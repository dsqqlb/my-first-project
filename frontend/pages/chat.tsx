import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from '../utils/constants';

interface ChatMessage {
  id?: string;
  sender: string;
  content: string;
  timestamp?: string;
  type: 'SENT' | 'RECEIVED';
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [connected, setConnected] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [safeMode, setSafeMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showMention, setShowMention] = useState(false);
  const stompClient = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 失去焦点时5秒后关闭页面（摸鱼保护）
  useEffect(() => {
    let blurTimer: NodeJS.Timeout | null = null;

    const handleBlur = () => {
      if (safeMode) {
        blurTimer = setTimeout(() => {
          window.location.href = 'about:blank';
        }, 5000);
      }
    };

    const handleFocus = () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };

    if (isJoined) {
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
    }

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (blurTimer) {
        clearTimeout(blurTimer);
      }
    };
  }, [isJoined, safeMode]);

  useEffect(() => {
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, []);

  // 获取历史消息
  const fetchHistory = async (user: string) => {
    try {
      const response = await fetch(`${WS_BASE_URL}/api/chat/history`);
      const history: ChatMessage[] = await response.json();
      if (history && history.length > 0) {
        const formattedHistory = history.map((msg) => ({
          ...msg,
          type: (msg.sender === user ? 'SENT' : 'RECEIVED') as 'SENT' | 'RECEIVED',
        }));
        setMessages(formattedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const connect = (user: string) => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws-chat`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);

        client.subscribe('/topic/messages', (message: IMessage) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          const isOwnMessage = chatMessage.sender === user;
          setMessages((prev) => [
            ...prev,
            {
              ...chatMessage,
              type: isOwnMessage ? 'SENT' : 'RECEIVED',
            },
          ]);
        });

        client.subscribe('/topic/typing', (message: IMessage) => {
          const data = JSON.parse(message.body);
          if (data.sender !== user && data.typing) {
            setPartnerTyping(true);
            setTimeout(() => setPartnerTyping(false), 2000);
          }
        });

        client.subscribe('/topic/users', (message: IMessage) => {
          const data = JSON.parse(message.body);
          if (data.sender !== user) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                sender: '系统',
                content: `${data.sender} 加入了聊天室`,
                timestamp: new Date().toISOString(),
                type: 'RECEIVED',
              },
            ]);
          }
        });

        fetchHistory(user);
      },
      onDisconnect: () => {
        setConnected(false);
      },
    });

    client.activate();
    stompClient.current = client;
  };

  const handleJoin = () => {
    if (!username.trim()) return;
    setIsJoined(true);
    connect(username);

    setTimeout(() => {
      if (stompClient.current?.connected) {
        stompClient.current.publish({
          destination: '/app/chat.join',
          body: JSON.stringify({ sender: username }),
        });
      }
    }, 500);
  };

  const handleSend = () => {
    if (!inputValue.trim() || !stompClient.current?.connected) return;

    const message: ChatMessage = {
      sender: username,
      content: inputValue.trim(),
      type: 'SENT',
    };

    stompClient.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message),
    });

    setInputValue('');

    stompClient.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ sender: username, typing: false }),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // 检测 @ 符号显示提示
    if (value.endsWith('@')) {
      setShowMention(true);
    } else {
      setShowMention(false);
    }

    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ sender: username, typing: true }),
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stompClient.current?.publish({
          destination: '/app/chat.typing',
          body: JSON.stringify({ sender: username, typing: false }),
        });
      }, 1000);
    }
  };

  const insertMention = () => {
    setInputValue(inputValue + 'Gemini ');
    setShowMention(false);
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 高亮 @Gemini
  const highlightMention = (text: string, isDark: boolean) => {
    if (!text.includes('@Gemini')) return text;
    
    const parts = text.split(/(@Gemini)/g);
    return parts.map((part, i) => {
      if (part === '@Gemini') {
        return (
          <span key={i} className="bg-purple-500 text-white px-1 rounded text-xs">
            @Gemini
          </span>
        );
      }
      return part;
    });
  };

  // 登录界面
  if (!isJoined) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md rounded-lg shadow-sm border p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                <svg className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>工作协作平台</h1>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>内部沟通工具</p>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              {darkMode ? (
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <label className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>员工工号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="请输入工号"
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
            />
            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
            >
              登录系统
            </button>
          </div>

          <p className={`text-xs mt-4 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            提示：开启安全模式后切换窗口将自动退出系统
          </p>
        </motion.div>
      </div>
    );
  }

  // 聊天界面
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部标题栏 */}
      <div className={`border-b px-4 py-2 flex items-center justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <svg className={`w-3 h-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>工作文档 - 协作编辑</span>
        </div>
        <div className="flex items-center gap-4">
          {/* 安全模式开关 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>安全模式</span>
            <div
              onClick={() => setSafeMode(!safeMode)}
              className={`w-8 h-4 rounded-full transition-colors ${safeMode ? 'bg-red-400' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
            >
              <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${safeMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </label>
          {/* 深色模式开关 */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
          >
            {darkMode ? (
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{username}</span>
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="h-[calc(100vh-120px)] overflow-y-auto p-4">
        <div className={`max-w-3xl mx-auto rounded shadow-sm border min-h-full p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id || index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mb-2 ${message.sender === '系统' ? 'text-center py-1' : ''}`}
              >
                {message.sender === '系统' ? (
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {message.content}
                  </span>
                ) : (
                  <div className={`flex ${message.type === 'SENT' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                      message.sender === 'Gemini'
                        ? darkMode ? 'bg-purple-900 text-gray-200' : 'bg-purple-50 text-gray-700'
                        : message.type === 'SENT'
                          ? darkMode ? 'bg-blue-900 text-gray-200' : 'bg-blue-50 text-gray-700'
                          : darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'
                    }`}>
                      {message.type === 'RECEIVED' && (
                        <span className={`text-xs font-medium block mb-1 ${
                          message.sender === 'Gemini' ? 'text-purple-500' : 'text-blue-500'
                        }`}>
                          {message.sender === 'Gemini' && '🤖 '}{message.sender}
                        </span>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {message.sender === 'Gemini' 
                          ? message.content 
                          : highlightMention(message.content, darkMode)}
                      </p>
                      <span className={`text-xs block mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {partnerTyping && (
            <div className="flex justify-start mb-2">
              <div className={`text-xs px-3 py-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                对方正在输入...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className={`fixed bottom-0 left-0 right-0 border-t p-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-3xl mx-auto">
          {/* @ 提示框 */}
          {showMention && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-2 p-2 rounded-lg cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={insertMention}
            >
              <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                @Gemini
              </span>
              <span className={`text-xs ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                AI 助手 - 点击提问
              </span>
            </motion.div>
          )}
          
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e as unknown as React.ChangeEvent<HTMLTextAreaElement>)}
              onKeyPress={handleKeyPress}
              placeholder="输入内容... 输入 @ 提及 Gemini"
              disabled={!connected}
              className={`flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:border-blue-400 placeholder-gray-400 disabled:opacity-50 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || !connected}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

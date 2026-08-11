// 页面文案配置，统一在这里修改
export const COPY = {
  fuckPage: {
    mainText: '快点下班，我要游泳去！',
    subText: '',
  },
};

// WebSocket 服务器地址
// 生产环境：改为服务器的实际 IP 或域名，如 'http://192.168.1.100:8080'
// 本地开发：使用 'http://localhost:8080'
export const WS_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:8080`
  : 'http://localhost:8080';

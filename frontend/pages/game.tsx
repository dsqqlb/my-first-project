import { useEffect, useRef, useState } from 'react';

export default function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const animationRef = useRef<number>();
  const gameStateRef = useRef({
    ball: { x: 0, y: 0, dx: 5, dy: -5, radius: 10 },
    paddle: { x: 0, width: 100, height: 15 },
    bricks: [] as Array<{x: number, y: number, width: number, height: number, alive: boolean, color: string, hits: number}>,
    score: 0,
    lives: 3,
    gameStarted: false,
    gameOver: false,
    particles: [] as Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}>,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = Math.min(800, window.innerWidth - 40);
      canvas.height = 600;
      initGame();
    };

    const initGame = () => {
      const state = gameStateRef.current;
      state.ball = { 
        x: canvas.width / 2, 
        y: canvas.height - 50, 
        dx: 5 * (Math.random() > 0.5 ? 1 : -1), 
        dy: -5, 
        radius: 10 
      };
      state.paddle = { 
        x: (canvas.width - 100) / 2, 
        width: 100, 
        height: 15 
      };
      state.bricks = [];
      state.particles = [];
      state.score = 0;
      state.lives = 3;
      state.gameStarted = false;
      state.gameOver = false;
      setScore(0);
      setLives(3);
      setGameStarted(false);
      setGameOver(false);

      // 创建彩色砖块
      const colors = [
        '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', 
        '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a24', '#10ac84'
      ];
      
      const brickRowCount = 6;
      const brickColumnCount = 10;
      const brickWidth = (canvas.width - 40) / brickColumnCount;
      const brickHeight = 25;
      const brickOffsetTop = 60;
      const brickOffsetLeft = 20;

      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const colorIndex = (c + r) % colors.length;
          state.bricks.push({
            x: brickOffsetLeft + c * brickWidth,
            y: brickOffsetTop + r * brickHeight,
            width: brickWidth - 4,
            height: brickHeight - 4,
            alive: true,
            color: colors[colorIndex],
            hits: r < 2 ? 2 : 1 // 前两行需要打两次
          });
        }
      }
    };

    const createParticles = (x: number, y: number, color: string) => {
      const state = gameStateRef.current;
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 2 + Math.random() * 3;
        state.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          color
        });
      }
    };

    const draw = () => {
      // 清空画布并绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const state = gameStateRef.current;

      // 绘制网格背景
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // 绘制砖块
      state.bricks.forEach(brick => {
        if (brick.alive) {
          // 砖块阴影
          ctx.shadowColor = brick.color;
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // 砖块主体
          ctx.fillStyle = brick.color;
          ctx.beginPath();
          ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 5);
          ctx.fill();

          // 如果需要打两次，显示标记
          if (brick.hits > 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 5);
            ctx.fill();
            
            // 显示剩余次数
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(brick.hits.toString(), brick.x + brick.width/2, brick.y + brick.height/2 + 4);
          }
          
          ctx.shadowBlur = 0;
        }
      });

      // 绘制粒子
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vy += 0.1; // 重力
        
        if (p.life > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 * (p.life / 30), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / 30;
          ctx.fill();
          ctx.globalAlpha = 1;
          return true;
        }
        return false;
      });

      // 绘制挡板
      ctx.shadowColor = '#00d9ff';
      ctx.shadowBlur = 20;
      const paddleGradient = ctx.createLinearGradient(
        state.paddle.x, 0,
        state.paddle.x + state.paddle.width, 0
      );
      paddleGradient.addColorStop(0, '#00d9ff');
      paddleGradient.addColorStop(0.5, '#00ffcc');
      paddleGradient.addColorStop(1, '#00d9ff');
      ctx.fillStyle = paddleGradient;
      ctx.beginPath();
      ctx.roundRect(
        state.paddle.x, 
        canvas.height - 30, 
        state.paddle.width, 
        state.paddle.height, 
        8
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // 绘制球
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 15;
      const ballGradient = ctx.createRadialGradient(
        state.ball.x - 3, state.ball.y - 3, 0,
        state.ball.x, state.ball.y, state.ball.radius
      );
      ballGradient.addColorStop(0, '#ffffff');
      ballGradient.addColorStop(1, '#00d9ff');
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballGradient;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 绘制分数和生命
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`分数: ${state.score}`, 20, 35);
      
      ctx.textAlign = 'right';
      ctx.fillText(`生命: ${'❤️'.repeat(state.lives)}`, canvas.width - 20, 35);

      // 如果游戏未开始或结束，显示提示
      if (!state.gameStarted || state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00d9ff';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(state.gameOver ? '游戏结束!' : '打砖块', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.fillText(
          state.gameOver 
            ? `最终分数: ${state.score}` 
            : '点击开始游戏',
          canvas.width / 2, 
          canvas.height / 2 + 20
        );
        
        if (state.gameOver) {
          ctx.fillStyle = '#00d9ff';
          ctx.font = '20px Arial';
          ctx.fillText('点击重新开始', canvas.width / 2, canvas.height / 2 + 60);
        }
      }
    };

    const update = () => {
      const state = gameStateRef.current;
      if (!state.gameStarted || state.gameOver) return;

      // 更新球位置
      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      // 边界碰撞
      if (state.ball.x - state.ball.radius < 0 || state.ball.x + state.ball.radius > canvas.width) {
        state.ball.dx = -state.ball.dx;
      }
      if (state.ball.y - state.ball.radius < 0) {
        state.ball.dy = -state.ball.dy;
      }

      // 掉落底部
      if (state.ball.y + state.ball.radius > canvas.height) {
        state.lives--;
        setLives(state.lives);
        
        if (state.lives === 0) {
          state.gameOver = true;
          setGameOver(true);
        } else {
          // 重置球位置
          state.ball.x = canvas.width / 2;
          state.ball.y = canvas.height - 50;
          state.ball.dx = 5 * (Math.random() > 0.5 ? 1 : -1);
          state.ball.dy = -5;
        }
      }

      // 挡板碰撞
      if (
        state.ball.y + state.ball.radius > canvas.height - 30 &&
        state.ball.x > state.paddle.x &&
        state.ball.x < state.paddle.x + state.paddle.width
      ) {
        state.ball.dy = -Math.abs(state.ball.dy);
        
        // 根据碰撞位置改变角度
        const hitPos = (state.ball.x - state.paddle.x) / state.paddle.width;
        state.ball.dx = 8 * (hitPos - 0.5);
        
        // 加速
        const speed = Math.sqrt(state.ball.dx ** 2 + state.ball.dy ** 2);
        const maxSpeed = 10;
        if (speed < maxSpeed) {
          state.ball.dx *= 1.02;
          state.ball.dy *= 1.02;
        }
      }

      // 砖块碰撞
      state.bricks.forEach(brick => {
        if (brick.alive) {
          if (
            state.ball.x + state.ball.radius > brick.x &&
            state.ball.x - state.ball.radius < brick.x + brick.width &&
            state.ball.y + state.ball.radius > brick.y &&
            state.ball.y - state.ball.radius < brick.y + brick.height
          ) {
            brick.hits--;
            
            if (brick.hits <= 0) {
              brick.alive = false;
              state.score += 10;
              setScore(state.score);
              createParticles(brick.x + brick.width/2, brick.y + brick.height/2, brick.color);
            }
            
            state.ball.dy = -state.ball.dy;
            
            // 检查是否通关
            if (state.bricks.every(b => !b.alive)) {
              state.gameOver = true;
              setGameOver(true);
              state.score += 100; // 通关奖励
              setScore(state.score);
            }
          }
        }
      });
    };

    const gameLoop = () => {
      update();
      draw();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const state = gameStateRef.current;
      state.paddle.x = Math.max(0, Math.min(canvas.width - state.paddle.width, x - state.paddle.width / 2));
    };

    const handleClick = () => {
      const state = gameStateRef.current;
      if (state.gameOver) {
        initGame();
      } else if (!state.gameStarted) {
        state.gameStarted = true;
        setGameStarted(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const state = gameStateRef.current;
      state.paddle.x = Math.max(0, Math.min(canvas.width - state.paddle.width, x - state.paddle.width / 2));
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleClick);

    gameLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" 
         style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
          🎮 打砖块大作战
        </h1>
        <p className="text-gray-400 text-sm">
          移动鼠标控制挡板 | 点击开始 | 打掉所有砖块获胜
        </p>
      </div>
      
      <canvas 
        ref={canvasRef}
        className="rounded-lg shadow-2xl"
        style={{ 
          cursor: 'none',
          boxShadow: '0 0 50px rgba(0, 217, 255, 0.3)'
        }}
      />
      
      <div className="mt-6 flex gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-gray-600"></span>
          <span>普通砖块 (1次)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-gray-400"></span>
          <span>强化砖块 (2次)</span>
        </div>
      </div>
    </div>
  );
}

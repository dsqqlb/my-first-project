import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import { COPY } from '../utils/constants';

// ─────────────────────────────────────────────────────────
// MagneticChar
// ─────────────────────────────────────────────────────────
const MagneticChar: React.FC<{
  char: string;
  index: number;
  total: number;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  hidden: boolean;
  onClick: (e: React.MouseEvent) => void;
  survivor?: boolean;
}> = ({ char, index, total, mouseX, mouseY, containerRef, hidden, onClick, survivor = false }) => {
  const charRef = useRef<HTMLSpanElement>(null);
  const springX = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const springY = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const springScale = useSpring(useMotionValue(1), { stiffness: 300, damping: 20 });
  const springRotate = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });

  useEffect(() => {
    const unsub = mouseX.on('change', () => {
      if (hidden || survivor) return;
      const el = charRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const cRect = containerRef.current?.getBoundingClientRect();
      const dx = mouseX.get() + (cRect ? cRect.left + cRect.width / 2 : 0) - cx;
      const dy = mouseY.get() + (cRect ? cRect.top + cRect.height / 2 : 0) - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 180;
      if (dist < maxDist) {
        const force = (1 - dist / maxDist) * 55;
        springX.set((dx / dist) * force);
        springY.set((dy / dist) * force);
        springScale.set(1 + (1 - dist / maxDist) * 0.4);
        springRotate.set((dx / dist) * (1 - dist / maxDist) * 20);
      } else {
        springX.set(0); springY.set(0); springScale.set(1); springRotate.set(0);
      }
    });
    return () => unsub();
  }, [mouseX, mouseY, springX, springY, springScale, springRotate, containerRef, hidden, survivor]);

  const hueOffset = (index / total) * 360;
  const exitY = -120;
  const exitRotate = (index % 2 === 0 ? 1 : -1) * (180 + index * 30);

  return (
    <span ref={charRef} className="inline-block relative cursor-pointer" onClick={onClick}>
      <motion.span
        className="inline-block select-none relative"
        style={{ x: springX, y: springY, scale: springScale, rotate: springRotate }}
        animate={
          survivor ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
          : hidden  ? { opacity: 0, y: exitY, scale: 0.2, rotate: exitRotate }
          :            { opacity: 1, y: 0, scale: 1, rotate: 0 }
        }
        transition={
          survivor ? { duration: 0.4, ease: 'easeOut' }
          : hidden  ? { duration: 0.45, ease: 'easeOut' }
          :            { type: 'spring', stiffness: 220, damping: 16, delay: 0.05 }
        }
      >
        <motion.span
          className="block bg-clip-text text-transparent"
          animate={{
            backgroundPosition: [`${hueOffset}% 50%`, `${hueOffset+100}% 50%`, `${hueOffset}% 50%`],
            filter: [
              `drop-shadow(0 0 20px hsl(${hueOffset},100%,60%)) drop-shadow(0 0 60px hsl(${hueOffset+60},100%,50%))`,
              `drop-shadow(0 0 40px hsl(${hueOffset+120},100%,70%)) drop-shadow(0 0 100px hsl(${hueOffset+180},100%,60%))`,
              `drop-shadow(0 0 20px hsl(${hueOffset},100%,60%)) drop-shadow(0 0 60px hsl(${hueOffset+60},100%,50%))`,
            ],
          }}
          transition={{ duration: 3 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            backgroundImage: `linear-gradient(90deg,hsl(${hueOffset},100%,60%),hsl(${hueOffset+90},100%,70%),hsl(${hueOffset+180},100%,60%),hsl(${hueOffset+270},100%,70%),hsl(${hueOffset+360},100%,60%))`,
            backgroundSize: '400% auto',
            WebkitBackgroundClip: 'text',
          }}
        >{char}</motion.span>
        <motion.span
          className="absolute inset-0 block blur-xl opacity-60 text-transparent bg-clip-text select-none pointer-events-none"
          animate={{ backgroundPosition: [`${hueOffset}% 50%`, `${hueOffset+100}% 50%`, `${hueOffset}% 50%`] }}
          transition={{ duration: 3 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            backgroundImage: `linear-gradient(90deg,hsl(${hueOffset},100%,60%),hsl(${hueOffset+180},100%,60%))`,
            backgroundSize: '400% auto',
            WebkitBackgroundClip: 'text',
          }}
        >{char}</motion.span>
      </motion.span>
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// Burst
// ─────────────────────────────────────────────────────────
const Burst: React.FC<{ x: number; y: number; onDone: () => void }> = ({ x, y, onDone }) => (
  <div className="pointer-events-none fixed inset-0 z-50">
    {Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 80 + Math.random() * 80;
      return (
        <motion.div key={i} className="absolute rounded-full"
          style={{ left: x, top: y, width: 6 + Math.random() * 6, height: 6 + Math.random() * 6, background: `hsl(${Math.random()*360},100%,70%)` }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          onAnimationComplete={i === 0 ? onDone : undefined}
        />
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────
// 游戏（canvas 渲染，彻底避免 CSS 渐变裁剪问题）
// ─────────────────────────────────────────────────────────
interface DinoProps {
  char: string;
  fontSize: number;
  groundY: number;   // 屏幕绝对 y，文字底部
  onDead: () => void;
}

const GRAVITY = 0.6;
const JUMP_V = -16;
const BASE_SPEED = 4.5;
const ACCEL = 0.0006;

interface Obstacle { id: number; x: number; w: number; h: number }

const DinoRunner: React.FC<DinoProps> = ({ char, fontSize, groundY, onDead }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);

  const DINO_X = 80;
  const W = typeof window !== 'undefined' ? window.innerWidth : 1200;
  // canvas 高度：从屏幕顶部到地板下方一点
  const CH = groundY + 4;

  const gs = useRef({
    y: groundY - fontSize,
    velY: 0,
    onGround: true,
    obs: [] as Obstacle[],
    speed: BASE_SPEED,
    frame: 0,
    nextObs: 90,
    score: 0,
    dead: false,
    obsIdCounter: 0,
  });

  const jump = useCallback(() => {
    const s = gs.current;
    if (s.dead || !s.onGround) return;
    s.velY = JUMP_V;
    s.onGround = false;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', jump);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('touchstart', jump); };
  }, [jump]);

  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const floor = groundY - fontSize;

    const tick = () => {
      const s = gs.current;
      if (s.dead) return;

      s.frame++;
      s.speed += ACCEL;
      s.score = Math.floor(s.frame / 6);

      // 物理
      s.velY += GRAVITY;
      s.y += s.velY;
      if (s.y >= floor) { s.y = floor; s.velY = 0; s.onGround = true; }

      // 生成障碍
      s.nextObs--;
      if (s.nextObs <= 0) {
        const h = fontSize * (0.4 + Math.random() * 0.35);
        const w = Math.max(12, fontSize * 0.16);
        s.obs.push({ id: s.obsIdCounter++, x: W + 20, w, h });
        s.nextObs = 65 + Math.random() * 85;
      }
      s.obs = s.obs.map(o => ({ ...o, x: o.x - s.speed })).filter(o => o.x + o.w * 3 > 0);

      // 碰撞（只检测主干）
      const pad = fontSize * 0.16;
      const dL = DINO_X + pad, dR = DINO_X + fontSize - pad;
      const dT = s.y + pad, dB = s.y + fontSize - pad * 0.3;
      for (const obs of s.obs) {
        const tL = obs.x + obs.w, tR = tL + obs.w;
        const oT = groundY - obs.h;
        if (dR > tL + 2 && dL < tR - 2 && dB > oT && dT < groundY) {
          s.dead = true;
          setDead(true);
          onDead();
          cancelAnimationFrame(rafRef.current);
          // 画一帧死亡状态
          drawFrame(ctx, s, true);
          return;
        }
      }

      setScore(s.score);
      drawFrame(ctx, s, false);
      rafRef.current = requestAnimationFrame(tick);
    };

    const drawFrame = (ctx: CanvasRenderingContext2D, s: typeof gs.current, isDead: boolean) => {
      ctx.clearRect(0, 0, W, CH);

      // 地板线
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
      ctx.restore();

      // 障碍物（仙人掌）
      for (const obs of s.obs) {
        const hue = (s.frame * 2 + obs.x * 0.3) % 360;
        const color = `hsl(${hue},100%,55%)`;
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        const tw = obs.w, th = obs.h;
        const tx = obs.x + tw; // 主干 x
        const ty = groundY - th;
        // 主干
        ctx.fillRect(tx, ty, tw, th);
        // 左枝竖
        ctx.fillRect(tx - tw * 1.2, ty + th * 0.15, tw * 0.7, th * 0.4);
        // 左枝横
        ctx.fillRect(tx - tw * 1.2, ty + th * 0.15, tw * 1.2, tw * 0.7);
        // 右枝竖
        ctx.fillRect(tx + tw * 1.5, ty + th * 0.25, tw * 0.7, th * 0.35);
        // 右枝横
        ctx.fillRect(tx + tw, ty + th * 0.25, tw * 1.5, tw * 0.7);
        ctx.restore();
      }

      // 恐龙（canvas fillText，彩虹渐变）
      const hue = (s.frame * 3) % 360;
      ctx.save();
      ctx.translate(DINO_X + fontSize / 2, s.y + fontSize / 2);
      if (!isDead) ctx.rotate((Math.sin(s.frame * 0.25) * 3 * Math.PI) / 180);
      ctx.shadowColor = `hsl(${hue},100%,65%)`;
      ctx.shadowBlur = 14 + Math.sin(s.frame * 0.2) * 6;
      ctx.font = `900 ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isDead) {
        ctx.fillStyle = '#ff4444';
        ctx.fillText('💀', 0, 0);
      } else {
        // 用渐变填充文字
        const grad = ctx.createLinearGradient(-fontSize / 2, 0, fontSize / 2, 0);
        grad.addColorStop(0, `hsl(${hue},100%,65%)`);
        grad.addColorStop(0.5, `hsl(${(hue + 120) % 360},100%,65%)`);
        grad.addColorStop(1, `hsl(${(hue + 240) % 360},100%,65%)`);
        ctx.fillStyle = grad;
        ctx.fillText(char, 0, 0);
      }
      ctx.restore();

      // 分数
      ctx.save();
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(String(s.score).padStart(5, '0'), W - 20, 32);
      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [groundY, fontSize, onDead, W, CH, char]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={CH}
      onClick={jump}
      className="absolute top-0 left-0 pointer-events-auto z-20"
      style={{ background: 'transparent', cursor: dead ? 'default' : 'pointer' }}
    />
  );
};

// ─────────────────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────────────────
export default function SleepyHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const survivorRef = useRef<HTMLSpanElement>(null);   // 直接指向幸存字的外层 span
  // 每个字的外层 span ref，用于第6次点击时读取坐标
  const charSpanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const rotateY = useTransform(springX, [-400,400], [-18,18]);
  const rotateX = useTransform(springY, [-300,300], [12,-12]);
  const glowHue = useTransform(springX, [-400,400], [0,360]);
  const glowColor = useTransform(glowHue, (h: number) => `hsl(${h},100%,55%)`);

  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [hiddenChars, setHiddenChars] = useState<Set<number>>(new Set());
  const clickCountRef = useRef(0);
  const [blastAll, setBlastAll] = useState(false);
  const [survivorIndex, setSurvivorIndex] = useState<number | null>(null);

  // 游戏状态
  const [gamePhase, setGamePhase] = useState<'none' | 'blasting' | 'sliding' | 'playing' | 'dead'>('none');
  const [dinoPos, setDinoPos] = useState<{ fontSize: number; groundY: number } | null>(null);
  // 幸存字的原始屏幕坐标（用于平移动画起点）
  const [survivorRect, setSurvivorRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => { mouseX.set(0); mouseY.set(0); }, [mouseX, mouseY]);

  const handleCharClick = useCallback((index: number, e: React.MouseEvent) => {
    if (gamePhase !== 'none') return;
    clickCountRef.current += 1;

    if (clickCountRef.current >= 6) {
      // 直接从 charSpanRefs 读取被点击字的真实坐标
      const el = charSpanRefs.current[index];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSurvivorRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setDinoPos({ fontSize: rect.height, groundY: rect.bottom });
      setSurvivorIndex(index);
      setBlastAll(true);
      setTimeout(() => setGamePhase('blasting'), 0);
      setTimeout(() => setGamePhase('sliding'), 500);
      return;
    }

    setHiddenChars(s => {
      if (s.has(index)) return s;
      return new Set(s).add(index);
    });
    const id = Date.now() + index;
    setBursts(b => [...b, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => setHiddenChars(s => { const n = new Set(s); n.delete(index); return n; }), 2000);
  }, [gamePhase]);

  const chars = COPY.fuckPage.mainText.split('');
  const survivorChar = survivorIndex !== null ? chars[survivorIndex] : '';

  const resetGame = useCallback(() => {
    setGamePhase('none');
    setBlastAll(false);
    setSurvivorIndex(null);
    clickCountRef.current = 0;
    setHiddenChars(new Set());
    setDinoPos(null);
    setSurvivorRect(null);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
      style={{ perspective: 1400 }}
    >
      {/* ── 背景（永远在这里）── */}
      <motion.div
        animate={{ scale:[1,1.3,1], opacity:[0.4,0.7,0.4], x:[-60,60,-60], y:[-40,40,-40] }}
        transition={{ duration:10, repeat:Infinity, ease:'easeInOut' }}
        className="absolute h-[700px] w-[700px] rounded-full bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 blur-[150px]"
      />
      <motion.div
        animate={{ scale:[1.2,1,1.2], opacity:[0.3,0.6,0.3], x:[60,-60,60], y:[40,-40,40] }}
        transition={{ duration:13, repeat:Infinity, ease:'easeInOut' }}
        className="absolute h-[600px] w-[600px] rounded-full bg-gradient-to-r from-cyan-500/30 via-green-500/30 to-yellow-500/30 blur-[140px]"
      />
      <motion.div
        className="pointer-events-none absolute h-[350px] w-[350px] rounded-full blur-[90px] opacity-35"
        style={{ x: useTransform(springX,(v:number)=>v*0.4), y: useTransform(springY,(v:number)=>v*0.4), background: glowColor }}
      />
      <motion.div animate={{ rotate:[0,360] }} transition={{ duration:8, repeat:Infinity, ease:'linear' }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[2px] w-[120vw] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </motion.div>
      <motion.div animate={{ rotate:[60,420] }} transition={{ duration:11, repeat:Infinity, ease:'linear' }}
        className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[1px] w-[120vw] bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />
      </motion.div>
      {[...Array(24)].map((_,i) => (
        <motion.div key={i}
          animate={{ y:[0,-120,0], opacity:[0,0.8,0], scale:[0,1,0] }}
          transition={{ duration:3+Math.random()*3, repeat:Infinity, delay:Math.random()*6 }}
          className="absolute rounded-full"
          style={{ width:3+Math.random()*5, height:3+Math.random()*5, background:`hsl(${Math.random()*360},100%,70%)`, left:`${Math.random()*100}%`, top:`${Math.random()*100}%` }}
        />
      ))}
      <motion.div animate={{ y:['-5%','105%'] }} transition={{ duration:4, repeat:Infinity, ease:'linear' }}
        className="pointer-events-none absolute w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <motion.div animate={{ opacity:[0.3,0.7,0.3] }} transition={{ duration:4, repeat:Infinity }}
        className="pointer-events-none absolute inset-0 border border-white/10 m-8 rounded-3xl" />

      {/* ── 文字层 ── */}
      <motion.div
        className="relative z-10 text-center px-4 w-full"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        <h1
          className="relative flex items-center justify-center font-black tracking-tight leading-none"
          style={{ fontSize: `min(${Math.floor(88 / chars.length)}vw, 22vh)`, transformStyle: 'preserve-3d' }}
        >
          {chars.map((char, i) => {
            const isSurvivor = blastAll && survivorIndex === i;
            // 幸存字在 sliding/playing/dead 阶段从 h1 里隐藏（绝对定位 div 接管）
            const hideInH1 = isSurvivor && (gamePhase === 'sliding' || gamePhase === 'playing' || gamePhase === 'dead');
            return (
              <span key={i}
                ref={el => { charSpanRefs.current[i] = el; if (isSurvivor) (survivorRef as React.MutableRefObject<HTMLSpanElement|null>).current = el; }}
                style={{ display: 'inline-block', visibility: hideInH1 ? 'hidden' : 'visible' }}>
                <MagneticChar
                  char={char} index={i} total={chars.length}
                  mouseX={mouseX} mouseY={mouseY} containerRef={containerRef}
                  hidden={hiddenChars.has(i) || (blastAll && !isSurvivor)}
                  onClick={e => handleCharClick(i, e)}
                  survivor={isSurvivor && gamePhase === 'blasting'}
                />
              </span>
            );
          })}
        </h1>

        <AnimatePresence>
          {gamePhase === 'none' && (
            <motion.p
              exit={{ opacity: 0 }}
              animate={{ opacity: [0.3,1,0.3], letterSpacing: ['0.6em','1em','0.6em'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mt-8 text-lg text-white/50 uppercase font-light"
            >{COPY.fuckPage.subText}</motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── 幸存字平移动画层 ── */}
      {survivorRect && dinoPos && (gamePhase === 'sliding') && (() => {
        const DINO_X = 80;
        const targetLeft = DINO_X;
        const targetTop = dinoPos.groundY - dinoPos.fontSize;
        const hueOffset = survivorIndex !== null ? (survivorIndex / chars.length) * 360 : 0;
        return (
          <motion.div
            className="absolute z-30 pointer-events-none font-black leading-none select-none"
            style={{ width: survivorRect.width, height: survivorRect.height }}
            initial={{ left: survivorRect.left, top: survivorRect.top }}
            animate={{ left: targetLeft, top: targetTop }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => setGamePhase('playing')}
          >
            <span style={{
              display: 'block',
              fontSize: survivorRect.height,
              lineHeight: 1,
              fontWeight: 900,
              backgroundImage: `linear-gradient(90deg,hsl(${hueOffset},100%,60%),hsl(${hueOffset+120},100%,65%),hsl(${hueOffset+240},100%,60%))`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: `drop-shadow(0 0 20px hsl(${hueOffset},100%,60%))`,
            }}>
              {survivorChar}
            </span>
          </motion.div>
        );
      })()}

      {/* ── 游戏层 ── */}
      {gamePhase === 'playing' && dinoPos && (
        <DinoRunner
          char={survivorChar}
          fontSize={dinoPos.fontSize}
          groundY={dinoPos.groundY}
          onDead={() => setGamePhase('dead')}
        />
      )}

      {/* 死亡提示 */}
      <AnimatePresence>
        {gamePhase === 'dead' && (
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-mono text-2xl tracking-[0.3em] text-white/90">GAME OVER</p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={resetGame}
                className="px-6 py-2 rounded-full border border-white/20 font-mono text-sm tracking-widest text-white/70 hover:bg-white/10 transition-colors"
              >PLAY AGAIN</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 爆炸粒子 */}
      <AnimatePresence>
        {bursts.map(b => (
          <Burst key={b.id} x={b.x} y={b.y} onDone={() => setBursts(bs => bs.filter(x => x.id !== b.id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}

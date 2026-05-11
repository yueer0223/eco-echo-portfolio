import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface PageState {
  depth: number; // 0 | 1 | 2
  regionId: string;
  regionName: string;
  color: string;
  text: string;
  svgPattern: string; // cultural geometric pattern path
  originX: number; // normalized 0–1
  originY: number;
}

type AnimPhase = 'idle' | 'out' | 'in';

// ─── Region Data ─────────────────────────────────────────────────────

const REGIONS = [
  {
    id: 'dali',
    name: '大理',
    text: '风过苍山，白族调起',
    color: '#00FFD1',
    // Bai ethnic zigzag / butterfly-wing motif
    svgPattern:
      'M 0,35 L 12,12 L 24,35 L 36,12 L 48,35 L 60,12 L 72,35 L 84,12 L 96,35 L 100,25 M 0,50 L 12,28 L 24,50 L 36,28 L 48,50 L 60,28 L 72,50 L 84,28 L 96,50 L 100,40 M 0,65 L 12,44 L 24,65 L 36,44 L 48,65 L 60,44 L 72,65 L 84,44 L 96,65 L 100,55',
    // hotspot position in %
    hx: 25,
    hy: 50,
  },
  {
    id: 'honghe',
    name: '红河',
    text: '梯田回声，海菜腔鸣',
    color: '#FF3366',
    // Hani terraced-field stepped motif
    svgPattern:
      'M 0,18 L 16,18 L 21,28 L 37,28 L 42,38 L 58,38 L 63,48 L 79,48 L 84,58 L 100,58 M 0,35 L 16,35 L 21,45 L 37,45 L 42,55 L 58,55 L 63,65 L 79,65 L 84,75 L 100,75 M 0,52 L 16,52 L 21,62 L 37,62 L 42,72 L 58,72 L 63,82 L 100,82',
    hx: 50,
    hy: 62,
  },
  {
    id: 'banna',
    name: '西双版纳',
    text: '雨林深处，象脚鼓响',
    color: '#FFD700',
    // Dai peacock-feather flowing curve motif
    svgPattern:
      'M 5,30 Q 20,5 35,30 Q 50,5 65,30 Q 80,5 95,30 M 5,45 Q 20,20 35,45 Q 50,20 65,45 Q 80,20 95,45 M 5,60 Q 20,35 35,60 Q 50,35 65,60 Q 80,35 95,60 M 5,75 Q 20,50 35,75 Q 50,50 65,75 Q 80,50 95,75',
    hx: 75,
    hy: 68,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

/** Find nearest region to a normalized click point */
function nearestRegion(nx: number, ny: number) {
  let best = REGIONS[0];
  let bestDist = Infinity;
  for (const r of REGIONS) {
    const dx = (r.hx - nx * 100) ** 2;
    const dy = (r.hy - ny * 100) ** 2;
    const dist = dx + dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = r;
    }
  }
  return best;
}

// ─── Sub-component: Glitch Text ──────────────────────────────────────

function GlitchText({ text, color }: { text: string; color: string }) {
  const [chars, setChars] = useState('');
  useEffect(() => {
    const pool = '!@#$^*_+?/<>';
    let i = 0;
    setChars('');
    const id = setInterval(() => {
      i += 0.5;
      setChars(
        text
          .split('')
          .map((c, j) => (j < i ? c : pool[Math.floor(Math.random() * pool.length)]))
          .join(''),
      );
      if (i >= text.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span style={{ color, fontSize: '13px', letterSpacing: '2px', textShadow: `0 0 8px ${color}60` }}>
      {chars}
    </span>
  );
}

// ─── Depth 0: Macro — Mountain Atlas ─────────────────────────────────

function Depth0({ onDrill }: { onDrill: (nx: number, ny: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onDrill((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };

  return (
    <div ref={ref} onClick={handleClick} className="absolute inset-0">
      {/* Mountain silhouettes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        {/* Far mountain range */}
        <path d="M-100,320 Q150,120 400,260 T900,180 T1500,300" fill="transparent" stroke="#1f2937" strokeWidth="0.8" />
        {/* Mid mountain range */}
        <path d="M-100,350 Q200,180 550,290 T1050,210 T1500,330" fill="transparent" stroke="#374151" strokeWidth="1" />
        {/* Foreground terrain */}
        <path d="M-100,380 Q300,250 600,320 T1200,270 T1500,360" fill="transparent" stroke="#4b5563" strokeWidth="0.6" />
        {/* Horizon baseline */}
        <line x1="0" y1="390" x2="100%" y2="390" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      </svg>

      {/* Hotspot indicator dots */}
      {REGIONS.map((r) => (
        <div
          key={r.id}
          className="absolute flex flex-col items-center pointer-events-none"
          style={{ left: `${r.hx}%`, top: `${r.hy}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
          <span className="text-[10px] text-gray-500 tracking-[0.2em] mt-2">{r.name}</span>
        </div>
      ))}

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-white/18 text-[11px] tracking-[0.3em] font-light">声景地图 · Sound Atlas</p>
      </div>

      {/* Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-white/08 text-[10px] tracking-[0.2em]">点击任意位置 · 下钻探索</p>
      </div>
    </div>
  );
}

// ─── Depth 1: Meso — Cultural Pattern + Glitch Text ──────────────────

function Depth1({ page, onDrill }: { page: PageState; onDrill: (nx: number, ny: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleClick = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    onDrill((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  };

  return (
    <div ref={ref} onClick={handleClick} className="absolute inset-0 cursor-crosshair">
      {/* Faint background terrain hint */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15" preserveAspectRatio="none">
        <path d="M-100,300 Q200,100 500,250 T1000,150 T1500,300" fill="transparent" stroke={page.color} strokeWidth="0.6" />
        <path d="M-100,340 Q300,200 600,280 T1100,200 T1500,340" fill="transparent" stroke={page.color} strokeWidth="0.4" />
      </svg>

      {/* Cultural geometric pattern — centered, large */}
      <svg
        className="absolute pointer-events-none"
        style={{ left: '50%', top: '45%', transform: 'translate(-50%, -50%)', width: '80%', height: '50%' }}
        viewBox="0 0 100 85"
        preserveAspectRatio="xMidYMid meet"
      >
        {page.svgPattern.split('M').filter(Boolean).map((seg, i) => {
          const d = 'M' + seg.trim();
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={page.color}
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.55 - i * 0.12}
              strokeDasharray="300"
              strokeDashoffset="300"
              style={{ animation: `drawStutter 0.5s steps(6, end) ${0.08 * i}s forwards` }}
            />
          );
        })}
      </svg>

      {/* Region name + glitch text — top area */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none">
        <p style={{ color: page.color, fontSize: '18px', letterSpacing: '6px', fontWeight: 300, textShadow: `0 0 12px ${page.color}40` }}>
          {page.regionName}
        </p>
        <GlitchText text={page.text} color={page.color} key={page.text} />
      </div>

      {/* Click origin marker — tiny crosshair */}
      <div
        className="absolute pointer-events-none"
        style={{ left: `${page.originX * 100}%`, top: `${page.originY * 100}%`, transform: 'translate(-50%, -50%)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" className="opacity-30">
          <line x1="0" y1="7" x2="14" y2="7" stroke={page.color} strokeWidth="0.5" />
          <line x1="7" y1="0" x2="7" y2="14" stroke={page.color} strokeWidth="0.5" />
        </svg>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-white/08 text-[10px] tracking-[0.2em]">继续点击 · 深入微观层</p>
      </div>
    </div>
  );
}

// ─── Depth 2: Micro — Audio Particles (steps() jerk) ─────────────────

function Depth2({ page, onReset }: { page: PageState; onReset: () => void }) {
  const particles = useRef(
    Array.from({ length: 55 }, () => ({
      x: page.originX * 100 + (Math.random() - 0.5) * 55,
      y: page.originY * 100 + (Math.random() - 0.5) * 55,
      w: 1.5 + Math.random() * 3,
      h: 3 + Math.random() * 22,
      d: 0.15 + Math.random() * 0.5,
      anim: Math.floor(Math.random() * 3), // pick one of 3 keyframe variants
    })),
  ).current;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {/* Particle SVG layer */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Spectrum bar particles */}
        {particles.map((p, i) => (
          <rect
            key={i}
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            rx="1"
            fill={page.color}
            style={{
              opacity: 0.15,
              animation: `barFlicker${p.anim} ${p.d}s steps(${p.anim === 0 ? 3 : p.anim === 1 ? 2 : 4}, start) infinite`,
            }}
          />
        ))}
        {/* Dot particles — scattered around origin */}
        {Array.from({ length: 30 }, (_, i) => {
          const dx = (Math.random() - 0.5) * 40;
          const dy = (Math.random() - 0.5) * 40;
          return (
            <circle
              key={`dot-${i}`}
              cx={page.originX * 100 + dx}
              cy={page.originY * 100 + dy}
              r={0.3 + Math.random() * 1.2}
              fill={page.color}
              style={{
                animation: `dotBlink ${0.2 + Math.random() * 0.6}s steps(2, jump-none) infinite`,
              }}
            />
          );
        })}
      </svg>

      {/* Origin marker — pulsing ring */}
      <div
        className="absolute pointer-events-none"
        style={{ left: `${page.originX * 100}%`, top: `${page.originY * 100}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div
          className="rounded-full border opacity-30"
          style={{
            width: '24px',
            height: '24px',
            borderColor: page.color,
            animation: 'ringPulse 1.2s steps(4, end) infinite',
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: page.color,
            opacity: 0.6,
            animation: 'dotFlick 0.4s steps(2, start) infinite',
          }}
        />
      </div>

      {/* Return button — overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onReset();
        }}
        className="relative z-30 px-6 py-2.5 rounded-full bg-white/[0.05] border cursor-pointer transition-colors duration-200 hover:bg-white/[0.12] hover:border-white/30"
        style={{ borderColor: `${page.color}30` }}
      >
        <span className="text-white/70 text-xs tracking-[0.2em]" style={{ color: page.color }}>
          ← 返回地表
        </span>
      </button>

      {/* Depth label */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/10 text-[9px] tracking-[0.3em] pointer-events-none">
        MICRO LAYER · {page.regionName}
      </p>

      {/* ── Scoped keyframes ─────────────────────────────── */}
      <style>{`
        @keyframes barFlicker0 {
          0%, 30%  { opacity: 0.1; height: ${3}px; }
          40%, 70% { opacity: 0.7; height: ${22}px; }
          80%, 100%{ opacity: 0.15; height: ${6}px; }
        }
        @keyframes barFlicker1 {
          0%, 50%  { opacity: 0.5; }
          51%, 100%{ opacity: 0.05; }
        }
        @keyframes barFlicker2 {
          0%   { opacity: 0.2; height: 4px; }
          25%  { opacity: 0.8; height: 20px; }
          50%  { opacity: 0.0; height: 2px; }
          75%  { opacity: 0.6; height: 15px; }
          100% { opacity: 0.1; height: 4px; }
        }
        @keyframes dotBlink {
          0%   { opacity: 0.05; }
          100% { opacity: 0.7; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0.0; }
        }
        @keyframes dotFlick {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function FlipbookCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });

  // ── Cleanup timers on unmount ──────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Double-RAF trigger: in → idle ──────────────────────────────
  useEffect(() => {
    if (phase !== 'in') return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('idle'));
    });
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ── Drill-down ────────────────────────────────────────────────
  const drillDown = useCallback(
    (nx: number, ny: number) => {
      if (phase !== 'idle') return;
      const depth = currentIndex >= 0 ? pages[currentIndex].depth + 1 : 1;
      if (depth > 2) return;

      setOrigin({ x: nx, y: ny });
      setPhase('out');

      timerRef.current = setTimeout(() => {
        const region = nearestRegion(nx, ny);
        const newPage: PageState = {
          depth,
          regionId: region.id,
          regionName: region.name,
          color: region.color,
          text: region.text,
          svgPattern: region.svgPattern,
          originX: nx,
          originY: ny,
        };
        // Branch truncation + append
        setPages((prev) => [...prev.slice(0, currentIndex + 1), newPage]);
        setCurrentIndex((prev) => prev + 1);
        setPhase('in');
      }, 350);
    },
    [phase, currentIndex, pages],
  );

  // ── Back ──────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (phase !== 'idle' || currentIndex <= 0) return;
    const prev = pages[currentIndex - 1];
    setOrigin({ x: prev.originX, y: prev.originY });
    setPhase('out');
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setPhase('in');
    }, 300);
  }, [phase, currentIndex, pages]);

  // ── Reset to surface (depth 0) ─────────────────────────────────
  const resetToSurface = useCallback(() => {
    if (phase !== 'idle') return;
    setPhase('out');
    timerRef.current = setTimeout(() => {
      setPages([]);
      setCurrentIndex(-1);
      setPhase('in');
    }, 300);
  }, [phase]);

  // ── Animated content style ─────────────────────────────────────
  const animStyle = (): React.CSSProperties => {
    const o = { transformOrigin: `${origin.x * 100}% ${origin.y * 100}%` };
    if (phase === 'out') {
      return { ...o, transform: 'scale(2.5)', opacity: 0, transition: 'transform 0.35s ease-in, opacity 0.3s ease-in' };
    }
    if (phase === 'in') {
      return { ...o, transform: 'scale(0.25)', opacity: 0, transition: 'none' };
    }
    // idle
    return { ...o, transform: 'scale(1)', opacity: 1, transition: 'transform 0.35s steps(5, end), opacity 0.3s steps(3, end)' };
  };

  // ── Current page ───────────────────────────────────────────────
  const page = currentIndex >= 0 ? pages[currentIndex] : null;

  return (
    <div
      ref={containerRef}
      className="col-span-1 md:col-span-12 w-full rounded-[2rem] relative overflow-hidden h-[400px] bg-[#0c1015] border border-white/[0.06]"
    >
      {/* ── Back button (depth > 0, idle only) ───────────────── */}
      {currentIndex > 0 && phase === 'idle' && (
        <button
          onClick={(e) => { e.stopPropagation(); goBack(); }}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.1] transition-colors cursor-pointer text-[11px] tracking-widest"
        >
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 4 L6 8 L10 12" />
          </svg>
          Back
        </button>
      )}

      {/* ── Page counter ─────────────────────────────────────── */}
      {page && (
        <div className="absolute top-4 right-4 z-30 pointer-events-none">
          <span className="text-white/12 text-[10px] tracking-[0.2em]">
            {currentIndex + 1} / {pages.length}
          </span>
        </div>
      )}

      {/* ── Animated content ─────────────────────────────────── */}
      <div className="absolute inset-0" style={animStyle()}>
        {!page ? (
          <Depth0 onDrill={drillDown} />
        ) : page.depth === 1 ? (
          <Depth1 page={page} onDrill={drillDown} />
        ) : (
          <Depth2 page={page} onReset={resetToSurface} />
        )}
      </div>

      {/* ── Shared keyframes ───────────────────────────────────── */}
      <style>{`
        @keyframes drawStutter { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

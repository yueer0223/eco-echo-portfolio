import { useState, useRef, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────

interface RegionData {
  id: string;
  color: string;
  text: string;
  label: string;
  svgPath: string;
  mountainPath: string;
}

// ── Region Data ──────────────────────────────────────────────────────

const regions: RegionData[] = [
  {
    id: 'dali',
    color: '#2DD4BF',
    text: '风过苍山，白族调起',
    label: '大理',
    svgPath: 'M 5,20 Q 11,8 18,20 Q 25,32 32,20 Q 39,8 46,20 Q 53,32 60,20 Q 67,8 74,20 Q 81,32 88,20 Q 93,8 95,20',
    mountainPath: 'M -20,420 L 50,140 L 110,210 L 170,80 L 230,160 L 290,90 L 350,170 L 410,105 L 450,170 L 480,420 Z',
  },
  {
    id: 'honghe',
    color: '#F87171',
    text: '红河峡谷，哈尼古歌回响',
    label: '红河',
    svgPath: 'M 0,10 L 22,10 L 26,24 L 48,24 L 52,38 L 74,38 L 78,52 L 100,52',
    mountainPath: 'M 450,420 L 470,240 L 510,240 L 520,180 L 560,180 L 570,120 L 610,120 L 620,200 L 660,200 L 670,280 L 710,280 L 720,360 L 750,420 Z',
  },
  {
    id: 'xishuangbanna',
    color: '#FBBF24',
    text: '孔雀开屏，风送傣韵悠长',
    label: '西双版纳',
    svgPath: 'M 50,8 C 70,24 90,24 100,40 C 90,56 70,56 50,40 C 30,56 10,56 0,40 C 10,24 30,24 50,8 Z',
    mountainPath: 'M 760,420 Q 800,200 850,150 Q 900,100 940,160 Q 970,220 1010,175 Q 1050,130 1090,190 Q 1130,250 1170,215 Q 1210,185 1240,420 Z',
  },
];

// Canvas viewBox constants
const VB_W = 1200;
const VB_H = 420;

// ── Sub-component: Typewriter Text ───────────────────────────────────

function TypewriterText({ text, active, speedMs = 60 }: { text: string; active: boolean; speedMs?: number }) {
  const [revealed, setRevealed] = useState('');

  useEffect(() => {
    if (!active) { setRevealed(''); return; }
    let i = 0;
    setRevealed('');
    const id = setInterval(() => {
      i++;
      setRevealed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, active, speedMs]);

  return (
    <p className="text-[12px] text-white/70 font-light leading-relaxed tracking-wide min-h-[1.4em]">
      {revealed}
      {active && revealed.length < text.length && (
        <span className="inline-block w-[1px] h-[12px] bg-white/50 ml-0.5 align-middle" />
      )}
    </p>
  );
}

// ── Sub-component: Audio Spectrum Bars ───────────────────────────────

function AudioBars({ active, color, count = 5 }: { active: boolean; color: string; count?: number }) {
  const [heights, setHeights] = useState<number[]>(() => Array.from({ length: count }, () => 4));

  useEffect(() => {
    if (!active) { setHeights(Array.from({ length: count }, () => 4)); return; }
    const id = setInterval(() => {
      setHeights(Array.from({ length: count }, () => 4 + Math.random() * 22));
    }, 130);
    return () => clearInterval(id);
  }, [active, count]);

  return (
    <div className="flex items-end gap-[3px] h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{ height: `${h}px`, backgroundColor: color, opacity: 0.7, transition: 'height 0.13s ease-out' }}
        />
      ))}
    </div>
  );
}

// ── Sub-component: Animated SVG Pattern ──────────────────────────────

function PatternPath({ pathD, active, color }: { pathD: string; active: boolean; color: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [dashOffset, setDashOffset] = useState(0);
  const [dashArray, setDashArray] = useState(0);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    setDashArray(len);
    setDashOffset(len);
    if (active) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDashOffset(0));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [active, pathD]);

  return (
    <svg viewBox="0 0 100 50" className="w-full h-10" preserveAspectRatio="xMidYMid meet">
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        style={{ transition: active ? 'stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none' }}
      />
    </svg>
  );
}

// ── Sub-component: Ambient floating pattern (rAF opacity pulse) ──────

function AmbientPattern({ pathD, color, cx, cy, w = 160, h = 80 }: { pathD: string; color: string; cx: number; cy: number; w?: number; h?: number }) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let t = Math.random() * Math.PI * 2;
    let raf = 0;
    const tick = () => {
      t += 0.008;
      const opacity = 0.04 + Math.sin(t) * 0.025;
      el.setAttribute('opacity', String(Math.max(0.02, opacity)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <g ref={ref} transform={`translate(${cx - w / 2}, ${cy - h / 2})`}>
      <svg width={w} height={h} viewBox="0 0 100 50" preserveAspectRatio="xMidYMid meet">
        <path d={pathD} fill="none" stroke={color} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      </svg>
    </g>
  );
}

// ── Main Component ───────────────────────────────────────────────────

function GenerativeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRegion, setActiveRegion] = useState<RegionData | null>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fadingOut, setFadingOut] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!fadingOut) return;
    const id = setTimeout(() => { setActiveRegion(null); setFadingOut(false); }, 500);
    return () => clearTimeout(id);
  }, [fadingOut]);

  const handleMountainClick = useCallback(
    (region: RegionData, e: React.MouseEvent<SVGPathElement>) => {
      e.stopPropagation();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setClickPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setFadingOut(false);
      setActiveRegion(region);
    },
    [],
  );

  const handleBackgroundClick = useCallback(() => {
    if (activeRegion && !fadingOut) setFadingOut(true);
  }, [activeRegion, fadingOut]);

  const popupStyle = (): React.CSSProperties => {
    const cw = containerRef.current?.clientWidth ?? 400;
    const ch = containerRef.current?.clientHeight ?? 280;
    const popupW = 220;
    const popupH = 135;
    const margin = 8;
    let left = clickPosition.x;
    let top = clickPosition.y - popupH - 12;
    if (left - popupW / 2 < margin) left = popupW / 2 + margin;
    if (left + popupW / 2 > cw - margin) left = cw - popupW / 2 - margin;
    if (top < margin) top = clickPosition.y + 16;
    if (top + popupH > ch - margin) top = ch - popupH - margin;
    return { left: `${left}px`, top: `${top}px`, transform: 'translate(-50%, 0)' };
  };

  const isVisible = activeRegion !== null && !fadingOut;

  // Approximate centre-x of each mountain region in viewBox coords
  const ambientSpots: { id: string; cx: number; cy: number }[] = [
    { id: 'dali', cx: 215, cy: 230 },
    { id: 'honghe', cx: 600, cy: 240 },
    { id: 'xishuangbanna', cx: 1000, cy: 230 },
  ];

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[2rem] bg-[#0D1117] border border-white/[0.06] h-[180px] sm:h-[200px] lg:h-[220px] cursor-crosshair select-none noise-overlay"
      onClick={handleBackgroundClick}
    >
      {/* Title badge */}
      <div className="absolute top-3.5 left-4 z-10 pointer-events-none flex items-center gap-2">
        <span className="text-[10px] text-white/25 tracking-[0.2em] uppercase">Generative Canvas</span>
        <span className="text-[10px] text-white/15">声景地图</span>
      </div>

      {/* Mountain SVG */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        {/* Horizon line */}
        <line x1="0" y1="380" x2={VB_W} y2="380" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* ── Ambient decorative patterns (always visible) ───── */}
        {regions.map((r) => {
          const spot = ambientSpots.find((s) => s.id === r.id)!;
          return (
            <AmbientPattern
              key={`amb-${r.id}`}
              pathD={r.svgPath}
              color={r.color}
              cx={spot.cx}
              cy={spot.cy}
              w={160}
              h={80}
            />
          );
        })}

        {/* Region labels */}
        {regions.map((r) => {
          const lx: Record<string, number> = { dali: 215, honghe: 600, xishuangbanna: 1000 };
          return (
            <text key={`l-${r.id}`} x={lx[r.id]} y="405" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="10" fontFamily="sans-serif" letterSpacing="2">
              {r.label}
            </text>
          );
        })}

        {/* Mountain paths */}
        {regions.map((r) => {
          const isHovered = hoveredId === r.id;
          const isActive = activeRegion?.id === r.id;
          const alpha = isActive ? 0.45 : isHovered ? 0.3 : 0.15;

          return (
            <g key={r.id}>
              <path
                d={r.mountainPath}
                fill="transparent"
                stroke="transparent"
                strokeWidth="32"
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleMountainClick(r, e)}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
              />
              <path
                d={r.mountainPath}
                fill="transparent"
                stroke={isActive ? r.color : `rgba(255,255,255,${alpha})`}
                strokeWidth={isActive ? 1.6 : 1}
                strokeLinejoin="round"
                strokeLinecap="round"
                pointerEvents="none"
                style={{ transition: 'stroke 0.35s ease' }}
              />
              {isActive && (
                <path d={r.mountainPath} fill={r.color} fillOpacity={0.04} pointerEvents="none" />
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Generative Popup ──────────────────────────────────── */}
      <div className="absolute z-20 pointer-events-none" style={popupStyle()}>
        <div
          className="pointer-events-auto rounded-xl p-3 border backdrop-blur-xl"
          style={{
            width: '220px',
            backgroundColor: 'rgba(13, 17, 23, 0.94)',
            borderColor: activeRegion ? `${activeRegion.color}40` : 'rgba(255,255,255,0.06)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
          }}
        >
          {activeRegion && (
            <div className="flex flex-col gap-2.5">
              <PatternPath pathD={activeRegion.svgPath} active={isVisible} color={activeRegion.color} />
              <AudioBars active={isVisible} color={activeRegion.color} count={5} />
              <TypewriterText text={activeRegion.text} active={isVisible} speedMs={60} />
            </div>
          )}
        </div>
      </div>

      {/* Hint text when idle */}
      {!activeRegion && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-700"
          style={{ opacity: fadingOut ? 0 : 1 }}
        >
          <p className="text-white/10 text-xs tracking-[0.25em] font-light">点击山脉 · 唤醒声音记忆</p>
        </div>
      )}
    </div>
  );
}

export default GenerativeCanvas;

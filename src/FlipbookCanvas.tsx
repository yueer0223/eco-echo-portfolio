import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface PageState {
  depth: number; // 0 | 1 | 2
  regionId: string;
  regionName: string;
  color: string;
  text: string;
  description: string;
  svgPattern: string;
  songId: number;
  originX: number;
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
    songId: 7,
    description:
      '纳西古乐源于唐宋宫廷音乐，经茶马古道传入丽江。旋律以羽调式为主，采用慢板—中板—快板的三段体结构，伴奏乐器包括苏古笃、曲项琵琶、胡琴。白沙细乐保留了中原早已失传的工尺谱记谱法，被誉为"音乐化石"。其声韵以五度相生律为基础，音程间保留大量微分音装饰，吟唱时真假声交替，气若游丝。',
    svgPattern:
      'M 0,35 L 12,12 L 24,35 L 36,12 L 48,35 L 60,12 L 72,35 L 84,12 L 96,35 L 100,25 M 0,50 L 12,28 L 24,50 L 36,28 L 48,50 L 60,28 L 72,50 L 84,28 L 96,50 L 100,40 M 0,65 L 12,44 L 24,65 L 36,44 L 48,65 L 60,44 L 72,65 L 84,44 L 96,65 L 100,55',
    hx: 25,
    hy: 50,
  },
  {
    id: 'honghe',
    name: '红河',
    text: '梯田回声，海菜腔鸣',
    color: '#FF3366',
    songId: 6,
    description:
      '哈尼海菜腔是云南红河彝族哈尼族特有的多声部民歌形式，以真假声交替演唱为特征。旋律以大二度和小三度为核心音程，节奏自由舒展，模仿山间鸟鸣与溪流潺潺。演唱时一人领唱众人帮腔，形成天然的复调织体。主要流传于红河县阿扎河乡一带，多在栽秧、薅草等集体劳作中演唱，是梯田农耕文明的声音图腾。',
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
    songId: 9,
    description:
      '傣族孔雀舞配乐以象脚鼓、铓锣、镲为主要打击乐器，节奏鲜明有力。音乐采用五声调式，旋律优美婉转如孔雀开屏。傣族赞哈（民间歌手）以说唱形式传唱史诗与爱情故事，唱腔细腻多变，常以葫芦丝、筚等吹奏乐器伴奏。孔雀舞配乐节奏型以"咚-哒-咚-哒"的四拍循环为基础，速度从慢渐快。',
    svgPattern:
      'M 5,30 Q 20,5 35,30 Q 50,5 65,30 Q 80,5 95,30 M 5,45 Q 20,20 35,45 Q 50,20 65,45 Q 80,20 95,45 M 5,60 Q 20,35 35,60 Q 50,35 65,60 Q 80,35 95,60 M 5,75 Q 20,50 35,75 Q 50,50 65,75 Q 80,50 95,75',
    hx: 75,
    hy: 68,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function nearestRegion(nx: number, ny: number) {
  let best = REGIONS[0];
  let bestDist = Infinity;
  for (const r of REGIONS) {
    const dx = (r.hx - nx * 100) ** 2;
    const dy = (r.hy - ny * 100) ** 2;
    const dist = dx + dy;
    if (dist < bestDist) { bestDist = dist; best = r; }
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
      setChars(text.split('').map((c, j) => (j < i ? c : pool[Math.floor(Math.random() * pool.length)])).join(''));
      if (i >= text.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, [text]);
  return <span style={{ color, fontSize: '13px', letterSpacing: '2px', textShadow: `0 0 8px ${color}60` }}>{chars}</span>;
}

// ─── Sub-component: Music Scroll (audio-driven visualizer) ───────────

function MusicScroll({ color, active }: { color: string; active: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 16 }, () => 4));

  useEffect(() => {
    if (!active) { setBars(Array.from({ length: 16 }, () => 4)); return; }
    const id = setInterval(() => {
      setBars(Array.from({ length: 16 }, () => 4 + Math.random() * 32));
    }, 100);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex items-end gap-[2px] h-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[2px]"
          style={{
            height: `${h}px`,
            backgroundColor: color,
            opacity: 0.25 + Math.random() * 0.35,
            transition: 'height 0.1s steps(3, end)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Depth 0: Mountain Atlas ─────────────────────────────────────────

function Depth0({ onDrill }: { onDrill: (nx: number, ny: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} onClick={(e) => {
      const r = ref.current?.getBoundingClientRect();
      if (r) onDrill((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    }} className="absolute inset-0 cursor-crosshair">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <path d="M-100,320 Q150,120 400,260 T900,180 T1500,300" fill="transparent" stroke="#1f2937" strokeWidth="0.8" />
        <path d="M-100,350 Q200,180 550,290 T1050,210 T1500,330" fill="transparent" stroke="#374151" strokeWidth="1" />
        <path d="M-100,380 Q300,250 600,320 T1200,270 T1500,360" fill="transparent" stroke="#4b5563" strokeWidth="0.6" />
        <line x1="0" y1="390" x2="100%" y2="390" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      </svg>
      {REGIONS.map((r) => (
        <div key={r.id} className="absolute flex flex-col items-center pointer-events-none"
          style={{ left: `${r.hx}%`, top: `${r.hy}%`, transform: 'translate(-50%, -50%)' }}>
          <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
          <span className="text-[10px] text-gray-500 tracking-[0.2em] mt-2">{r.name}</span>
        </div>
      ))}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-white/18 text-[11px] tracking-[0.3em] font-light">声景地图 · Sound Atlas</p>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-white/08 text-[10px] tracking-[0.2em]">点击任意位置 · 下钻探索</p>
      </div>
    </div>
  );
}

// ─── Depth 1: Audio Playback + Visualizer ────────────────────────────

function Depth1({ page, onBack, audioRef }: {
  page: PageState;
  onBack: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [audioFailed, setAudioFailed] = useState(false);
  const [paused, setPaused] = useState(false);

  // Auto-play on mount
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    const audio = new Audio(`/music/${page.songId}.mp3`);
    audio.volume = 0.6;
    audioRef.current = audio;
    audio.play().then(() => setAudioFailed(false)).catch(() => setAudioFailed(true));
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, [page.songId, audioRef]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (paused) {
      audioRef.current.play().catch(() => {});
      setPaused(false);
    } else {
      audioRef.current.pause();
      setPaused(true);
    }
  };

  const handleBlankClick = () => onBack();

  return (
    <div ref={ref} onClick={handleBlankClick} className="absolute inset-0 cursor-pointer">
      {/* Floating animated patterns */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        preserveAspectRatio="none" viewBox="0 0 200 100">
        {page.svgPattern.split('M').filter(Boolean).map((seg, i) => (
          <path key={i} d={'M' + seg.trim()} fill="none" stroke={page.color}
            strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"
            opacity={0.35 - i * 0.06}
            className="floating-pattern"
            style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
      </svg>

      {/* Region name + visualizer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 pointer-events-none">
        <p style={{ color: page.color, fontSize: '20px', letterSpacing: '8px', fontWeight: 300, textShadow: `0 0 16px ${page.color}50` }}>
          {page.regionName}
        </p>
        <MusicScroll color={page.color} active={!paused} />
        <GlitchText text={page.text} color={page.color} key={page.text} />
        <p className="text-white/25 text-[10px] tracking-[0.15em] font-light">
          {audioFailed
            ? `⚠ 音频缺失 · /music/${page.songId}.mp3`
            : paused
              ? '⏸ 已暂停'
              : `正在播放 · ID ${page.songId}`}
        </p>
      </div>

      {/* Play/Pause button */}
      <button onClick={handleToggle}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-6 py-2.5 rounded-full border cursor-pointer transition-all duration-300 hover:scale-105"
        style={{ borderColor: `${page.color}40`, backgroundColor: `${page.color}06` }}>
        <span className="text-xs tracking-[0.2em] font-light" style={{ color: page.color }}>
          {paused ? '▶ 继续播放' : '■ 暂停'}
        </span>
      </button>

      <style>{`
        @keyframes floatA {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-8px) scale(1.04); }
        }
        .floating-pattern { animation: floatA 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function FlipbookCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [phase, setPhase] = useState<AnimPhase>('idle');
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });

  // ── Kill audio on unmount ──────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  // ── Kill audio helper ──────────────────────────────────────────
  const killAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
  }, []);

  // ── Double-RAF trigger: in → idle ──────────────────────────────
  useEffect(() => {
    if (phase !== 'in') return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('idle')));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ── Drill-down (depth 0→1 uses nearestRegion; 1→2 inherits) ──
  const drillDown = useCallback(
    (nx: number, ny: number) => {
      if (phase !== 'idle') return;
      const depth = currentIndex >= 0 ? pages[currentIndex].depth + 1 : 1;
      if (depth > 1) return;

      killAudio();
      setOrigin({ x: nx, y: ny });
      setPhase('out');

      timerRef.current = setTimeout(() => {
        const currentPage = currentIndex >= 0 ? pages[currentIndex] : null;
        const region = currentPage
          ? (REGIONS.find((r) => r.id === currentPage.regionId) || REGIONS[0])
          : nearestRegion(nx, ny);

        const newPage: PageState = {
          depth,
          regionId: region.id,
          regionName: region.name,
          color: region.color,
          text: region.text,
          description: region.description,
          svgPattern: region.svgPattern,
          songId: region.songId,
          originX: nx,
          originY: ny,
        };
        setPages((prev) => [...prev.slice(0, currentIndex + 1), newPage]);
        setCurrentIndex((prev) => prev + 1);
        setPhase('in');
      }, 350);
    },
    [phase, currentIndex, pages, killAudio],
  );

  // ── Back ──────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (phase !== 'idle' || currentIndex < 0) return;
    killAudio();
    if (currentIndex === 0) {
      // First page → return to Depth 0
      const r = REGIONS.find((r) => r.id === pages[0].regionId);
      setOrigin({ x: r ? r.hx / 100 : 0.5, y: r ? r.hy / 100 : 0.5 });
      setPhase('out');
      timerRef.current = setTimeout(() => {
        setPages([]);
        setCurrentIndex(-1);
        setPhase('in');
      }, 300);
      return;
    }
    const prev = pages[currentIndex - 1];
    setOrigin({ x: prev.originX, y: prev.originY });
    setPhase('out');
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setPhase('in');
    }, 300);
  }, [phase, currentIndex, pages, killAudio]);

  // ── Animated content style ─────────────────────────────────────
  const animStyle = (): React.CSSProperties => {
    const o = { transformOrigin: `${origin.x * 100}% ${origin.y * 100}%` };
    if (phase === 'out') return { ...o, transform: 'scale(2.5)', opacity: 0, transition: 'transform 0.35s ease-in, opacity 0.3s ease-in' };
    if (phase === 'in')  return { ...o, transform: 'scale(0.25)', opacity: 0, transition: 'none' };
    return { ...o, transform: 'scale(1)', opacity: 1, transition: 'transform 0.35s steps(5, end), opacity 0.3s steps(3, end)' };
  };

  const page = currentIndex >= 0 ? pages[currentIndex] : null;

  return (
    <div ref={containerRef}
      className="col-span-1 md:col-span-12 w-full rounded-[2rem] relative overflow-hidden h-[400px] bg-[#0c1015] border border-white/[0.06]">
      {currentIndex >= 0 && phase === 'idle' && (
        <button onClick={(e) => { e.stopPropagation(); goBack(); }}
          className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-white/45 hover:text-white/80 hover:bg-white/[0.1] transition-colors cursor-pointer text-[11px] tracking-widest">
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 4 L6 8 L10 12" /></svg>
          Back
        </button>
      )}
      {page && (
        <div className="absolute top-4 right-4 z-30 pointer-events-none">
          <span className="text-white/12 text-[10px] tracking-[0.2em]">{currentIndex + 1} / {pages.length}</span>
        </div>
      )}
      <div className="absolute inset-0" style={animStyle()}>
        {!page ? (
          <Depth0 onDrill={drillDown} />
        ) : (
          <Depth1 page={page} onBack={goBack} audioRef={audioRef} />
        )}
      </div>
      <style>{`@keyframes drawStutter { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

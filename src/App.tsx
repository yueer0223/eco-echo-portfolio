import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  Sparkles, Play, Send, RefreshCw, ArrowUpRight, Loader2,
  FlaskConical, GraduationCap, LayoutGrid, Music, Disc3,
  Wand2, FileUp, FileAudio, FileVideo, Cloud, X, Check,
} from 'lucide-react';
import FlipbookCanvas from './FlipbookCanvas';

// ── Types ────────────────────────────────────────────────────────────
type View = 'showcase' | 'lab' | 'scholar';

interface ChatMessage { role: 'ai' | 'user'; text: string; }

interface Question {
  id: number; text: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  optionA: { label: string; value: string };
  optionB: { label: string; value: string };
}

interface Archetype { name: string; tagline: string; desc: string; }

interface NativeSeed { id: string; name: string; nameZh: string; desc: string; }

interface ModernFilter { id: string; name: string; nameZh: string; desc: string; }

interface UploadFile { file: File; id: string; }

// ══════════════════════════════════════════════════════════════════════
// ── JS Animation Primitives (no @keyframes, works in all browsers) ───
// ══════════════════════════════════════════════════════════════════════

/** rAF-driven continuous rotation — replaces CSS animate-spin */
function SpinningLoader({ size = 12, className = '' }: { size?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    let deg = 0, raf = 0;
    const spin = () => { deg = (deg + 3) % 360; el.style.transform = `rotate(${deg}deg)`; raf = requestAnimationFrame(spin); };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span ref={ref} className={`inline-flex ${className}`}><Loader2 size={size} className="text-white/60" /></span>;
}

/** CSS-transition slide-in — triggered on `id` change */
function FadeSlideIn({ id, speed, children }: { id: string | number; speed?: 'normal' | 'slow'; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const dur = speed === 'slow' ? '0.5s' : '0.4s';

  useLayoutEffect(() => {
    setVisible(false);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [id]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0,0,0)' : 'translate3d(16px,0,0)',
        transition: `opacity ${dur} ease-out, transform ${dur} ease-out`,
      }}
    >
      {children}
    </div>
  );
}

/** rAF-driven vertical marquee — replaces CSS @keyframes marquee-vertical */
function MarqueeVertical({ children, speedMs = 30000 }: { children: React.ReactNode; speedMs?: number }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const halfH = el.scrollHeight / 2;
    const pxPerMs = halfH / speedMs;
    let offset = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      offset -= pxPerMs * dt;
      if (offset <= -halfH) offset = 0;
      el.style.transform = `translate3d(0,${offset}px,0)`;
      el.style.willChange = 'transform';
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedMs]);

  return (
    <div className="h-full">
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

/** setInterval + CSS transition visualizer bars */
function Visualizer({ active }: { active: boolean }) {
  const [heights, setHeights] = useState([4, 6, 8, 10, 8, 6, 4, 8, 6, 4]);

  useEffect(() => {
    if (!active) { setHeights([4, 6, 8, 10, 8, 6, 4, 8, 6, 4]); return; }
    const id = setInterval(() => {
      setHeights(Array.from({ length: 10 }, () => 4 + Math.random() * 20));
    }, 150);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className={`flex items-end gap-[3px] h-8 ${active ? 'opacity-100' : 'opacity-30'} transition-opacity duration-500`}>
      {heights.map((h, i) => (
        <div key={i} className="w-[3px] bg-white/70 rounded-full transition-all duration-150 ease-out" style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}

/** Canvas video proxy — renders <video> frames offscreen, draws to <canvas> to evade hijacking */
const VIDEO_SOURCES = {
  stats: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_154543_d5b83fc1-9cea-44f3-b5e8-8f325935211a.mp4',
  soul: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4',
};

function VideoBackground({ src, opacity = 0.5 }: { src: string; opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setFallback(true); return; }

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('x5-video-player-type', 'h5');
    video.setAttribute('x5-video-player-fullscreen', 'false');
    video.setAttribute('x5-playsinline', 'true');
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    // Hide video off-viewport so X5 / Baidu native player can't find it
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-1';
    video.src = src;
    document.body.appendChild(video);

    let raf = 0;
    let framesDrawn = 0;
    let playing = false;
    let killed = false;

    const onPlay = () => { playing = true; };
    const onError = () => { if (!killed) setFallback(true); };
    video.addEventListener('play', onPlay);
    video.addEventListener('error', onError);

    video.play().catch(() => { if (!killed) setFallback(true); });

    const draw = () => {
      if (killed) return;
      if (playing && video.readyState >= 2) {
        try {
          const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 400;
          const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 300;
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          framesDrawn++;
        } catch { /* cross-origin may block */ }
      }
      // If after 3s we haven't drawn any frame, fall back to gradient
      if (!fallback && framesDrawn === 0 && performance.now() - startTime > 3000) {
        setFallback(true);
        killed = true;
        return;
      }
      raf = requestAnimationFrame(draw);
    };

    const startTime = performance.now();
    raf = requestAnimationFrame(draw);

    return () => {
      killed = true;
      cancelAnimationFrame(raf);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('error', onError);
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    };
  }, [src]);

  if (fallback) {
    return <FallbackGradient opacity={opacity} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    />
  );
}

/** Rich gradient standby — shown while video loads or if canvas proxy fails */
function FallbackGradient({ opacity }: { opacity: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const layers = [
    { color: 'rgba(180,130,70,0.18)', rx: 55, ry: 45, vx: 0.37, vy: 0.49, px: 0, py: 0 },
    { color: 'rgba(140,70,30,0.14)',  rx: 40, ry: 35, vx: 0.53, vy: 0.31, px: 2.1, py: 1.7 },
    { color: 'rgba(200,160,100,0.10)', rx: 35, ry: 40, vx: 0.61, vy: 0.44, px: -1.8, py: 3.0 },
    { color: 'rgba(90,60,40,0.12)',   rx: 48, ry: 50, vx: 0.29, vy: 0.58, px: 1.2, py: -2.3 },
    { color: 'rgba(160,110,60,0.08)',  rx: 60, ry: 52, vx: 0.19, vy: 0.23, px: -2.5, py: -1.5 },
  ];

  useEffect(() => {
    const el = ref.current!;
    let t = 0, raf = 0;
    const tick = () => {
      t += 0.016;
      const parts = layers.map((l) => {
        const x = 50 + Math.sin(t * l.vx + l.px) * 28 + Math.cos(t * 0.31 + l.py) * 12;
        const y = 50 + Math.cos(t * l.vy + l.py) * 28 + Math.sin(t * 0.38 + l.px) * 12;
        return `radial-gradient(ellipse ${l.rx}% ${l.ry}% at ${x}% ${y}%, ${l.color} 0%, transparent 100%)`;
      });
      el.style.background = parts.join(', ');
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} className="absolute inset-0" style={{ opacity }} />;
}

/** setInterval + CSS transition pulsing glow */
function PulseGlow({ active, children }: { active: boolean; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!active) { setOn(false); return; }
    const id = setInterval(() => setOn((v) => !v), 1000);
    return () => clearInterval(id);
  }, [active]);
  return (
    <span style={{
      boxShadow: on ? '0 0 16px rgba(255,255,255,0.25)' : '0 0 4px rgba(255,255,255,0.1)',
      transition: 'box-shadow 1s ease-in-out',
      borderRadius: '9999px',
    }}>
      {children}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ── Data ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

const archiveItems = [
  { title: '彝族阿细跳月 — Sampling #01' }, { title: '哈尼海菜腔 — 1080p' },
  { title: '苗族飞歌 — Field Recording' }, { title: '纳西古乐 — HD Master' },
  { title: '侗族大歌 — Multitrack' }, { title: '蒙古长调 — Archive #02' },
  { title: '藏族格萨尔 — 4K Raw' }, { title: '羌族多声部 — Mixdown' },
  { title: '傣族孔雀舞配乐 — Studio' }, { title: '土家族哭嫁歌 — Field #03' },
  { title: '维吾尔木卡姆 — Remaster' }, { title: '彝族海菜腔对唱 — 1080p' },
];

const nativeSeeds: NativeSeed[] = [
  { id: 'hani-seaweed', name: 'Hani Seaweed Tune', nameZh: '哈尼海菜腔', desc: '真假音自由流转的山林独白' },
  { id: 'yi-axi', name: 'Yi Axi Moon Dance', nameZh: '彝族阿细跳月', desc: '奔放大三弦与踏歌的狂欢' },
  { id: 'miao-flying', name: 'Miao Flying Song', nameZh: '苗族飞歌', desc: '穿云裂石的群山回响' },
  { id: 'dong-grand', name: 'Dong Grand Song', nameZh: '侗族大歌', desc: '无指挥多声部的和谐奇迹' },
  { id: 'mongol-long', name: 'Mongolian Long Song', nameZh: '蒙古长调', desc: '草原无垠的拖腔与仪式' },
  { id: 'naxi-ancient', name: 'Naxi Ancient Music', nameZh: '纳西古乐', desc: '唐宋遗音的活态博物馆' },
  { id: 'tibetan-gesar', name: 'Tibetan Gesar Epic', nameZh: '藏族格萨尔', desc: '百万行史诗的宏大叙事' },
  { id: 'qiang-poly', name: 'Qiang Polyphony', nameZh: '羌族多声部', desc: '古老羌寨的多维声景' },
];

const modernFilters: ModernFilter[] = [
  { id: 'cyberpunk', name: 'Cyberpunk', nameZh: '赛博朋克', desc: '合成器、失真与都市暗涌' },
  { id: 'lofi', name: 'Lo-fi', nameZh: '低保真', desc: '温暖磁带质感与慵懒节拍' },
  { id: 'orchestral', name: 'Orchestral', nameZh: '交响管弦', desc: '宏大堂音与史诗配器' },
  { id: 'ambient', name: 'Ambient', nameZh: '氛围电子', desc: '空间混响与冥想音景' },
  { id: 'trap', name: 'Trap', nameZh: '陷阱说唱', desc: '808低频与高速Hi-hats' },
  { id: 'synthwave', name: 'Synthwave', nameZh: '合成器浪潮', desc: '复古模拟合成器的霓虹梦境' },
  { id: 'jazz-fusion', name: 'Jazz Fusion', nameZh: '爵士融合', desc: '复杂和声与即兴对话' },
  { id: 'post-rock', name: 'Post-Rock', nameZh: '后摇滚', desc: '层层递进的情绪音墙' },
];

const questions: Question[] = [
  { id: 0, dimension: 'EI', text: '置身于云南群山的篝火晚会，火光映红了每一张脸，你更渴望？', optionA: { label: '融入人群，与大家共舞欢歌', value: 'E' }, optionB: { label: '坐在远处，静静感受火光与星空的对话', value: 'I' } },
  { id: 1, dimension: 'EI', text: '听到一首让你浑身颤栗的民歌，你的第一反应是？', optionA: { label: '立刻想找到身边的人分享这份感动', value: 'E' }, optionB: { label: '戴上耳机反复聆听，直到每一个音符渗入骨髓', value: 'I' } },
  { id: 2, dimension: 'EI', text: '在音乐节的人海中，你更倾向于？', optionA: { label: '站在前排，与乐队和观众一同呐喊、跃动', value: 'E' }, optionB: { label: '找一个安静的角落，闭眼沉浸在音墙之中', value: 'I' } },
  { id: 3, dimension: 'EI', text: '创作一段旋律时，你更享受的过程是？', optionA: { label: '与一群音乐家围坐即兴合奏，碰撞出意外的火花', value: 'E' }, optionB: { label: '独自在深夜的工作室里，反复雕琢每一个音符的呼吸', value: 'I' } },
  { id: 4, dimension: 'EI', text: '如果你是一首古老民歌唯一的传人，你会？', optionA: { label: '走遍山川，教更多人传唱，让歌声生生不息', value: 'E' }, optionB: { label: '用毕生心力，为这首歌写下最完整的谱系与考据', value: 'I' } },
  { id: 5, dimension: 'SN', text: '最能触动你的声音质感来自哪里？', optionA: { label: '粗粝的大地——泥土、木材、皮革与石头共振的回响', value: 'S' }, optionB: { label: '缥缈的虚空——风穿过峡谷、雾散入竹林、星光滑落屋檐', value: 'N' } },
  { id: 6, dimension: 'SN', text: '聆听一段古老的民族旋律时，你的注意力首先被什么抓住？', optionA: { label: '歌者嗓音的纹理、气息的转折、咬字的颗粒感', value: 'S' }, optionB: { label: '旋律背后的故事——它所穿越的时间、它承载的集体记忆', value: 'N' } },
  { id: 7, dimension: 'SN', text: '如果让你选择一件乐器相伴余生？', optionA: { label: '马头琴——琴弦震颤时，能摸到草原风的形状', value: 'S' }, optionB: { label: '古琴——七根弦上，藏着一整个宇宙的呼吸与留白', value: 'N' } },
  { id: 8, dimension: 'SN', text: '一段音乐让你莫名落泪，通常是因为？', optionA: { label: '某个具体的音符恰好击中了你此刻的生命体验', value: 'S' }, optionB: { label: '音乐唤起了某种无法命名的、横跨时空的情感暗流', value: 'N' } },
  { id: 9, dimension: 'SN', text: '你眼中"非遗音乐传承"最核心的意义是？', optionA: { label: '修旧如旧——忠实地记录每一个音高、每一种技法', value: 'S' }, optionB: { label: '借古开今——让古老的灵魂在新的媒介中重新呼吸', value: 'N' } },
  { id: 10, dimension: 'TF', text: '评价一首民歌的优劣，你内心最看重的标尺是？', optionA: { label: '调式结构的严谨、音律的和谐与技法的精妙', value: 'T' }, optionB: { label: '它能否穿透理性，直接触碰你灵魂最柔软的角落', value: 'F' } },
  { id: 11, dimension: 'TF', text: '面对两条不同的音乐探索之路，你会如何抉择？', optionA: { label: '列出每个方向的技术难度、资源需求与预期成果，理性对比', value: 'T' }, optionB: { label: '闭上眼睛感受，选择那个让你的心脏跳得更快的声音', value: 'F' } },
  { id: 12, dimension: 'TF', text: '田野采风中，一位老艺人即兴改动了古老旋律的一个音，你觉得？', optionA: { label: '需要记录并分析——传承的精确性关乎文化基因的完整', value: 'T' }, optionB: { label: '不必纠正——那一刻倾注的情感比音准本身更加珍贵', value: 'F' } },
  { id: 13, dimension: 'TF', text: '你更敬重哪一种音乐人？', optionA: { label: '技术臻于化境，对每一个音符背后的声学原理都有深邃思考', value: 'T' }, optionB: { label: '技术或许朴素，但每一次开口都像把灵魂捧在手心', value: 'F' } },
  { id: 14, dimension: 'TF', text: '面对一种濒临失传的民歌，你认为最紧迫的拯救是？', optionA: { label: '建立完整的数字档案——音频、谱面、语言学分析，缺一不可', value: 'T' }, optionB: { label: '找到能与之共情的年轻歌者，让它在新的呼吸中活下去', value: 'F' } },
  { id: 15, dimension: 'JP', text: '进入一片从未被采录过的音乐田野，你的工作方式是？', optionA: { label: '提前规划路线、预定设备、列出采访提纲，按部就班', value: 'J' }, optionB: { label: '只定一个方向，其余交给偶遇——走到哪里听到什么都是缘分', value: 'P' } },
  { id: 16, dimension: 'JP', text: '学习一门全新的民族乐器，你的路径更接近？', optionA: { label: '从指法乐理开始，循序渐进，每一步都踩实再前行', value: 'J' }, optionB: { label: '哪首曲子打动你，就从哪首开始——热情是最好的老师', value: 'P' } },
  { id: 17, dimension: 'JP', text: '策划一场非遗音乐展演，你希望它？', optionA: { label: '节目单清晰、环节有序、起承转合如同一部完整的交响', value: 'J' }, optionB: { label: '保留大量即兴空间，让艺术家根据此刻的气氛自由生发', value: 'P' } },
  { id: 18, dimension: 'JP', text: '整理一本数百页的民歌采风笔记，你的本能反应是？', optionA: { label: '先建目录、分类标注、建立索引，让一切归于秩序', value: 'J' }, optionB: { label: '随手翻开一页，跟随那一页的故事顺流而下', value: 'P' } },
  { id: 19, dimension: 'JP', text: '你如何理解"传统"这个词？', optionA: { label: '传统是根基——形式本身承载着不可替代的文化密码与秩序', value: 'J' }, optionB: { label: '传统是河流——每一代人都应让它流经自己的身体，重新诠释', value: 'P' } },
];

const archetypeMap: Record<string, Archetype> = {
  ESTP: { name: '彝族阿细跳月', tagline: '大地的狂欢者', desc: '你是节奏的信徒，身体先于思考而动。阿细跳月那奔放的大三弦与踏歌，是你生命力的直接外化——热烈、果敢、活在当下。你不追问意义，你创造现场。' },
  ESFP: { name: '苗族飞歌', tagline: '群山的歌者', desc: '你的灵魂穿梭于高山与深谷之间。苗族飞歌那嘹亮穿云的声线，是你对世界的热情告白。你用歌声连接每一个相遇的人，让孤独的山巅变成共鸣的剧场。' },
  ESTJ: { name: '蒙古族长调', tagline: '草原的守护者', desc: '你崇尚秩序与巍峨。蒙古族长调那无垠的拖腔与严格的仪式感，正是你心中世界的模样——广阔而有边界、自由而有章法。你是传统最坚定的守望者。' },
  ESFJ: { name: '侗族大歌', tagline: '和谐的建筑师', desc: '你相信声音的力量在于共鸣。侗族大歌那无指挥、无伴奏的多声部合唱，是你理想社会的声学模型——每一个人都在倾听他人中找到自己的位置。温暖而坚实。' },
  ENTP: { name: '纳西古乐', tagline: '时空的炼金术士', desc: '你迷恋古老系统中的隐藏变量。纳西古乐那唐宋遗音的严谨格律中，你偏偏听见了无限重组与即兴的可能。你在规则中寻找裂缝，让古老在智性的火光中裂变重生。' },
  ENFP: { name: '维吾尔木卡姆', tagline: '灵魂的游吟诗人', desc: '你是一部行走的叙事长诗。木卡姆那宏大的套曲结构、炽烈的情感跌宕，正是你内心世界的声学投影——奔放、深邃、永远在探索新的情感疆域。' },
  ENTJ: { name: '藏族格萨尔', tagline: '史诗的统帅', desc: '你的意志如高原的烈风。格萨尔王传那百万行的史诗体量，需要同样宏阔的灵魂来承载。你用理性的框架驾驭激情，统领散落的音符成为一部不朽的交响。' },
  ENFJ: { name: '羌族多声部', tagline: '和声的引路人', desc: '你的天赋在于听见每一个人声音中的光芒。羌族多声部那复杂交织却又和谐统一的和声网络，正是你领导力的声学隐喻——你让每一个声音找到归属，共同升华为精神的共振。' },
  ISTP: { name: '傣族象脚鼓舞', tagline: '沉默的节拍师', desc: '你以内敛的方式掌控着节奏的暴烈。傣族象脚鼓那深沉而精准的律动，是你与大地对话的私密语言。你不张扬，但你脚下的鼓点能让整个寨子随之起舞。' },
  ISFP: { name: '哈尼族海菜腔', tagline: '山林的独语者', desc: '你的深情藏于真假音转换的缝隙之中。海菜腔那自由流转于胸腔与头腔之间的声音，是你独自面对群山时的灵魂日记。技术无需炫示，每一次呼吸都是情感的坦诚。' },
  ISTJ: { name: '西安鼓乐', tagline: '时间的守望者', desc: '你的信仰刻在每一个节拍的精确里。西安鼓乐那传承千年的记谱法与庄严的行乐仪轨，是你心中秩序的美学形态。安静、缜密、不可动摇——你是文明传承的脊梁。' },
  ISFJ: { name: '福建南音', tagline: '温柔的守夜人', desc: '你用最细腻的丝竹之声织成一张保护网。南音那温润的琵琶点指与洞箫的幽微气息，是你对世界不动声色的深情。你不求瞩目，但你的温柔足以让千年古韵安然入梦。' },
  INTP: { name: '古琴减字谱', tagline: '抽象的密码学家', desc: '你痴迷于符号背后的无穷世界。古琴减字谱那看似晦涩的指法记号，在你眼中是一座精密而优雅的逻辑迷宫。你在独处中拆解宇宙的算法，而琴音只是你思考的余韵。' },
  INFP: { name: '昆曲水磨调', tagline: '梦境的织梦人', desc: '你栖居于此岸与彼岸之间的薄雾地带。昆曲水磨调那"启口轻圆、收音纯细"的极致美学，是你理想世界的声学标本——柔软、深邃、拒绝一切粗糙。你在声音中寻找失落的天堂。' },
  INTJ: { name: '编钟礼乐', tagline: '体系的建筑师', desc: '你的心智如青铜编钟——冷静、精密的共振系统。曾侯乙编钟那严密的音律体系与礼乐秩序，是你对世界的理想投射：每一个音高都有其不可替代的位置，共同构筑宏大的意义宫殿。' },
  INFJ: { name: '洞经音乐', tagline: '通灵的频率师', desc: '你听见的声音比常人多一个维度。洞经音乐那庄重而通灵的谈经调，是你与超越性对话的声学媒介。深邃的悲悯与洞察力让你成为精神的灯塔——你不需要大声说话，但每一个人都会在黑暗中朝你转身。' },
};

function calcType(answers: Record<number, string>): string {
  const s = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (let i = 0; i < 20; i++) { const a = answers[i]; if (a) s[a as keyof typeof s]++; }
  return (s.E >= s.I ? 'E' : 'I') + (s.S >= s.N ? 'S' : 'N') + (s.T >= s.F ? 'T' : 'F') + (s.J >= s.P ? 'J' : 'P');
}

const SYSTEM_PROMPT = '你是"音应未来"Eco-Echo非遗数字学者。你精通中国多民族传统音乐——包括彝族、哈尼族、苗族、侗族、蒙古族、藏族、纳西族、羌族、傣族、维吾尔族、土家族等民族的山歌、说唱、戏曲与仪式音乐。你擅于从调式结构、声韵学、人类学田野与AIGC转译等多个维度进行深度分析。请用中文回答，保持专业、诗意且深刻，每次回答控制在200字以内。';

function callAI(messages: { role: string; content: string }[], maxTokens = 400) {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const endpoint = import.meta.env.VITE_AI_API_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
  const model = import.meta.env.VITE_AI_MODEL || 'gpt-4o';
  if (!apiKey) throw new Error('API key not configured');
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.8 }),
  });
}

// ══════════════════════════════════════════════════════════════════════
// ── App ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════

function App() {
  // Navigation
  const [activeView, setActiveView] = useState<View>('showcase');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Soul test
  const [testPhase, setTestPhase] = useState<'start' | 'question' | 'result'>('start');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [resultType, setResultType] = useState<string | null>(null);

  // Lab
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<string | null>(null);

  // Scholar
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [metadata, setMetadata] = useState({ ethnicGroup: '', region: '', performer: '', description: '' });
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // ── Chat handlers ──────────────────────────────────────────────────
  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await callAI([
        { role: 'system', content: SYSTEM_PROMPT },
        ...[...messages, userMsg].map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
      ]);
      if (!res.ok) throw new Error(`[${res.status}] ${(await res.text()).slice(0, 120)}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', text: data.choices?.[0]?.message?.content ?? '学者陷入了沉思……' }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'ai', text: err?.message === 'Failed to fetch' ? '无法连接API。请检查 CORS / 端点配置。' : `请求失败：${err?.message ?? '未知'}` }]);
    } finally { setChatLoading(false); }
  };

  // ── Soul test ──────────────────────────────────────────────────────
  const handleAnswer = (qId: number, val: string) => {
    const next = { ...answers, [qId]: val };
    setAnswers(next);
    if (qId < 19) setCurrentQ(qId + 1);
    else { setResultType(calcType(next)); setTestPhase('result'); }
  };
  const startTest = () => { setTestPhase('question'); setCurrentQ(0); setAnswers({}); setResultType(null); };
  const restartTest = () => { setTestPhase('start'); setCurrentQ(0); setAnswers({}); setResultType(null); };

  // ── Lab ────────────────────────────────────────────────────────────
  const handleTranslate = async () => {
    if (!selectedSeed || !selectedFilter || isTranslating) return;
    setIsTranslating(true);
    setTranslationResult(null);
    const seed = nativeSeeds.find((s) => s.id === selectedSeed)!;
    const filter = modernFilters.find((f) => f.id === selectedFilter)!;
    const prompt = `你是一位数字民族音乐学家 (Digital Ethnomusicologist)。请对传统音乐"${seed.nameZh}（${seed.name}）"进行技术分析，并给出将其重新编排为"${filter.nameZh}（${filter.name}）"风格的详细制作指南。请按以下结构输出：\n\n**1. 调式映射 (Modal Mapping)**\n分析原曲使用的五声/七声调式，给出映射到目标风格的音阶对应关系。\n\n**2. 节奏改编 (Rhythm Adaptation)**\n传统节奏型如何转化为目标风格的律动模式，包含BPM建议。\n\n**3. 配器方案 (Instrumentation)**\n保留哪些原生音色采样，叠加哪些电子/原声乐器层。\n\n**4. 混音参数 (Mixing Parameters)**\n具体给出EQ频段、混响类型与参数、压缩比、声像摆位。\n\n**5. 唱词改编 (Lyrical Adaptation)**\n如何在保留文化语义的前提下调整唱腔与语言韵律。\n\n请用中文输出，保持技术性与可操作性。`;
    try {
      const res = await callAI([{ role: 'user', content: prompt }], 800);
      if (!res.ok) throw new Error(`[${res.status}]`);
      const data = await res.json();
      setTranslationResult(data.choices?.[0]?.message?.content ?? '转译未能完成。');
    } catch (err: any) {
      setTranslationResult(err?.message === 'Failed to fetch' ? '⚠️ 无法连接AI引擎。请检查网络与API端点配置。' : `⚠️ 转译失败：${err?.message ?? '未知错误'}`);
    } finally { setIsTranslating(false); }
  };

  // ── Scholar ────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => /\.(mp4|mp3|wav)$/i.test(f.name));
    setUploadFiles((prev) => [...prev, ...files.map((f) => ({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` }))]);
  }, []);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => /\.(mp4|mp3|wav)$/i.test(f.name));
    setUploadFiles((prev) => [...prev, ...files.map((f) => ({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` }))]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const removeFile = (id: string) => setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  const handleSync = async () => {
    if (uploadFiles.length === 0) return;
    setUploadStatus('uploading');
    const fd = new FormData();
    uploadFiles.forEach((uf) => fd.append('files', uf.file));
    fd.append('ethnicGroup', metadata.ethnicGroup);
    fd.append('region', metadata.region);
    fd.append('performer', metadata.performer);
    fd.append('description', metadata.description);
    try {
      const res = await fetch('/api/v1/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`[${res.status}]`);
      setUploadStatus('success');
      setTimeout(() => { setUploadStatus('idle'); setUploadFiles([]); setMetadata({ ethnicGroup: '', region: '', performer: '', description: '' }); }, 2500);
    } catch { setUploadStatus('error'); setTimeout(() => setUploadStatus('idle'), 2500); }
  };
  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  // ════════════════════════════════════════════════════════════════════
  // ── View: Showcase ─────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════

  const renderShowcase = () => (
    <>
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl md:text-[40px] tracking-tight font-light leading-none">Eco-Echo <span className="text-white/50">|</span> 音应未来</h1>
          <p className="text-sm md:text-[15px] text-white/60 max-w-3xl mt-2.5 leading-relaxed">A digital ecosystem reviving multi-ethnic folk music through AI and youth co-creation. Led by Yueer, we translate ancient vocal heritage into contemporary resonance.</p>
        </div>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="liquid-glass shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-white/80 hover:text-white transition-colors">Explore GitHub <ArrowUpRight size={14} /></a>
      </header>

      {/* ── Flipbook Canvas (standalone banner) ──────────────── */}
      <div className="shrink-0 mt-4 md:mt-5">
        <FlipbookCanvas />
      </div>

      {/* ── Original Bento Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 flex-1 min-h-0 mt-4 md:mt-5">
        {/* Col 1 — Archive */}
        <div className="md:col-span-2 lg:col-span-1 rounded-2xl bg-black overflow-hidden relative flex flex-col h-[600px]">
          <div className="absolute z-10 top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[11px] text-white/70 tracking-widest"><Sparkles size={12} /> ARCHIVE <Sparkles size={12} /></div>
          <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
            <MarqueeVertical>
              <div className="pt-12 pb-12">
                <div className="flex flex-col gap-2.5 px-4">
                  {archiveItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0 group-hover:bg-white/[0.15] transition-colors"><Play size={13} className="text-white/70 group-hover:text-white transition-colors" /></div>
                      <span className="text-[13px] text-white/80 leading-tight">{item.title}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2.5 px-4 mt-2.5">
                  {archiveItems.map((item, i) => (
                    <div key={i + archiveItems.length} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center shrink-0 group-hover:bg-white/[0.15] transition-colors"><Play size={13} className="text-white/70 group-hover:text-white transition-colors" /></div>
                      <span className="text-[13px] text-white/80 leading-tight">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </MarqueeVertical>
          </div>
        </div>

        {/* Col 2 — AI Chat + Stats */}
        <div className="flex flex-col gap-4 md:gap-5 h-[600px]">
          <div className="bg-[#324444] rounded-2xl p-5 noise-overlay relative flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-1.5 text-[11px] text-white/70 tracking-widest mb-3 shrink-0"><Sparkles size={12} /> AI HERITAGE SCHOLAR</div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3 mb-3">
              {messages.length === 0 && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center shrink-0 mt-0.5"><Sparkles size={11} className="text-white/60" /></div>
                  <div className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-tl-sm bg-white/[0.06] text-white/75 max-w-[88%]">你好，我是音应未来非遗数字学者。关于多民族音乐的调式、溯源或AIGC转译，你想探讨什么？</div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'ai' && <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center shrink-0 mt-0.5"><Sparkles size={11} className="text-white/60" /></div>}
                  <div className={`text-[13px] leading-relaxed px-3 py-2 rounded-2xl max-w-[88%] ${msg.role === 'ai' ? 'bg-white/[0.06] text-white/75 rounded-tl-sm' : 'bg-white/[0.1] text-white/80 rounded-tr-sm'}`}>{msg.text}</div>
                  {msg.role === 'user' && <div className="w-6 h-6 rounded-full bg-white/[0.12] flex items-center justify-center shrink-0 mt-0.5 text-[10px] text-white/50 font-medium">U</div>}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/[0.1] flex items-center justify-center shrink-0 mt-0.5"><Sparkles size={11} className="text-white/60" /></div>
                  <div className="text-[13px] leading-relaxed px-3 py-2 rounded-2xl rounded-tl-sm bg-white/[0.06] text-white/50 max-w-[88%] flex items-center gap-2"><SpinningLoader size={12} /> 学者正在沉思……</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="liquid-glass flex-1 flex items-center rounded-full px-4 py-2.5">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Ask about ethnic music…" disabled={chatLoading} className="bg-transparent text-[13px] text-white/80 placeholder:text-white/30 outline-none w-full disabled:opacity-40" />
              </div>
              <button onClick={handleSend} disabled={chatLoading || !chatInput.trim()} className="liquid-glass w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white/60 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><Send size={13} /></button>
            </div>
          </div>
          <div className="bg-black rounded-2xl noise-overlay relative overflow-hidden flex items-center justify-center shrink-0 h-40 md:h-48">
            <VideoBackground src={VIDEO_SOURCES.stats} opacity={0.5} />
            <div className="relative z-10 text-center"><p className="text-6xl md:text-[80px] font-light drop-shadow-lg leading-none">10K+</p><p className="text-white/85 text-sm mt-1.5 tracking-wide">Global Youth Creators</p></div>
          </div>
        </div>

        {/* Col 3 — Soul Test + Contact */}
        <div className="flex flex-col gap-4 md:gap-5 h-[600px]">
          <div className="bg-black rounded-2xl p-6 noise-overlay relative overflow-hidden flex flex-col flex-1 min-h-0">
            <VideoBackground src={VIDEO_SOURCES.soul} opacity={0.3} />
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-1.5 text-[11px] text-white/70 tracking-widest mb-3 shrink-0"><Sparkles size={12} /> SOUL RESONANCE TEST</div>
              <div className="flex-1 flex flex-col justify-center min-h-0">
                {testPhase === 'start' && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-5">
                    <p className="text-lg md:text-xl font-light tracking-wide text-white/90 leading-relaxed">测测你的非遗音乐灵魂</p>
                    <p className="text-[13px] text-white/50 max-w-xs leading-relaxed">二十道题，穿越群山与时光，<br />发现深藏于你血脉中的民族音乐原型。</p>
                    <button onClick={startTest} className="liquid-glass px-6 py-2.5 rounded-full text-sm text-white/85 hover:text-white transition-colors cursor-pointer">开始寻音 (Start)</button>
                  </div>
                )}
                {testPhase === 'question' && (() => {
                  const q = questions[currentQ];
                  const dimLabel = { EI: '灵魂的朝向', SN: '感知的质地', TF: '心灵的标尺', JP: '生活的韵律' }[q.dimension];
                  return (
                    <div className="flex flex-col h-full">
                      <div className="shrink-0 mb-4">
                        <div className="flex items-center justify-between text-[10px] text-white/40 tracking-widest mb-1.5"><span className="uppercase">{dimLabel}</span><span>{String(currentQ + 1).padStart(2, '0')} / 20</span></div>
                        <div className="w-full h-[2px] bg-white/[0.08] rounded-full overflow-hidden"><div className="h-full bg-white/40 rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentQ + 1) / 20) * 100}%` }} /></div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <FadeSlideIn id={currentQ}>
                          <p className="text-[15px] md:text-base text-white/85 font-light leading-relaxed mb-5">{q.text}</p>
                          <div className="flex flex-col gap-2.5">
                            <button onClick={() => handleAnswer(q.id, q.optionA.value)} className="w-full text-left px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-white/75 hover:bg-white/[0.09] hover:border-white/20 hover:text-white/90 transition-all cursor-pointer leading-relaxed">{q.optionA.label}</button>
                            <button onClick={() => handleAnswer(q.id, q.optionB.value)} className="w-full text-left px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-sm text-white/75 hover:bg-white/[0.09] hover:border-white/20 hover:text-white/90 transition-all cursor-pointer leading-relaxed">{q.optionB.label}</button>
                          </div>
                        </FadeSlideIn>
                      </div>
                    </div>
                  );
                })()}
                {testPhase === 'result' && resultType && archetypeMap[resultType] && (
                  <FadeSlideIn id={resultType} speed="slow">
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Your Musical Archetype</p>
                      <p className="text-3xl md:text-4xl font-light tracking-widest text-white/90">{resultType}</p>
                      <p className="text-[11px] text-white/50 tracking-widest uppercase">{archetypeMap[resultType].tagline}</p>
                      <p className="text-lg md:text-xl font-light text-white/85 tracking-wide mt-1">{archetypeMap[resultType].name}</p>
                      <p className="text-[13px] text-white/55 leading-relaxed max-w-xs">{archetypeMap[resultType].desc}</p>
                      <button onClick={restartTest} className="liquid-glass mt-3 px-4 py-2 rounded-full text-xs text-white/65 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"><RefreshCw size={12} /> 重新寻音 (Restart)</button>
                    </div>
                  </FadeSlideIn>
                )}
              </div>
            </div>
          </div>
          <div className="bg-[#324444] rounded-2xl p-6 noise-overlay relative flex flex-col justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-white/70 tracking-widest mb-4"><Sparkles size={12} /> REACH YUEER</div>
            <div className="flex items-end justify-between">
              <div><p className="text-[15px] text-white/85 font-light">hi@ecoecho.com</p><p className="text-[13px] text-white/50 mt-1">Shanghai, China</p></div>
              <a href="mailto:hi@ecoecho.com" className="liquid-glass w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"><ArrowUpRight size={16} /></a>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════
  // ── View: AIGC Lab ─────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════

  const renderLab = () => {
    const seed = nativeSeeds.find((s) => s.id === selectedSeed);
    const filter = modernFilters.find((f) => f.id === selectedFilter);
    const canTranslate = !!selectedSeed && !!selectedFilter && !isTranslating;

    return (
      <div className="flex flex-col flex-1 min-h-0 gap-5 mt-2">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"><FlaskConical size={18} className="text-white/70" /></div>
          <div><p className="text-lg font-light tracking-wide text-white/85">文化转译实验室</p><p className="text-[12px] text-white/45">Creative Laboratory — AIGC Ethnomusicology Re-arrangement</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto">
          <div className="bg-black rounded-2xl p-5 border border-white/[0.05] flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0"><Music size={14} className="text-white/50" /><span className="text-[11px] text-white/50 tracking-widest uppercase">Native Seed · 原生种子</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1">
              {nativeSeeds.map((s) => (
                <button key={s.id} onClick={() => setSelectedSeed(s.id === selectedSeed ? null : s.id)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${selectedSeed === s.id ? 'bg-white/[0.1] border-white/30' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/12'}`}>
                  <p className="text-sm text-white/85 font-light">{s.nameZh}</p><p className="text-[11px] text-white/40 mt-0.5">{s.name}</p><p className="text-[11px] text-white/30 mt-1 leading-snug">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-black rounded-2xl p-5 border border-white/[0.05] flex flex-col">
            <div className="flex items-center gap-2 mb-4 shrink-0"><Disc3 size={14} className="text-white/50" /><span className="text-[11px] text-white/50 tracking-widest uppercase">Modern Filter · 现代滤镜</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1">
              {modernFilters.map((f) => (
                <button key={f.id} onClick={() => setSelectedFilter(f.id === selectedFilter ? null : f.id)}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${selectedFilter === f.id ? 'bg-white/[0.1] border-white/30' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/12'}`}>
                  <p className="text-sm text-white/85 font-light">{f.nameZh}</p><p className="text-[11px] text-white/40 mt-0.5">{f.name}</p><p className="text-[11px] text-white/30 mt-1 leading-snug">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <div className="flex flex-col items-center gap-2">
            {seed && filter && <p className="text-[11px] text-white/40 text-center">{seed.nameZh} <span className="text-white/20">×</span> {filter.nameZh}</p>}
            <PulseGlow active={canTranslate}>
              <button onClick={handleTranslate} disabled={!canTranslate && !isTranslating}
                className={`liquid-glass px-6 py-2.5 rounded-full text-sm flex items-center gap-2 transition-all cursor-pointer ${canTranslate ? 'text-white/85 hover:text-white' : 'text-white/30 cursor-not-allowed'}`}>
                {isTranslating ? <><SpinningLoader size={14} /> 转译中……</> : <><Wand2 size={14} /> 开始转译 Translate</>}
              </button>
            </PulseGlow>
            <Visualizer active={isTranslating} />
          </div>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>
        {translationResult && (
          <FadeSlideIn id="lab-result" speed="slow">
            <div className="shrink-0 bg-black rounded-2xl p-5 border border-white/[0.06] max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-3"><span className="text-[11px] text-white/50 tracking-widest">TRANSLATION RESULT</span><button onClick={() => setTranslationResult(null)} className="text-white/30 hover:text-white/60 transition-colors"><X size={14} /></button></div>
              <div className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap">{translationResult}</div>
            </div>
          </FadeSlideIn>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════════
  // ── View: Scholar Portal ────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════

  const renderScholar = () => (
    <div className="flex flex-col flex-1 min-h-0 gap-5 mt-2">
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"><GraduationCap size={18} className="text-white/70" /></div>
        <div><p className="text-lg font-light tracking-wide text-white/85">学者入驻</p><p className="text-[12px] text-white/45">Scholar Portal — Field Recording Archive & Cloud Sync</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-4">
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
            className={`flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[200px] ${isDragging ? 'border-white/40 bg-white/[0.06]' : 'border-white/[0.1] hover:border-white/20 hover:bg-white/[0.02]'}`}>
            <input ref={fileInputRef} type="file" accept=".mp4,.mp3,.wav" multiple onChange={handleFileSelect} className="hidden" />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-white/[0.15]' : 'bg-white/[0.04]'}`}><FileUp size={24} className={isDragging ? 'text-white/80' : 'text-white/40'} /></div>
            <div className="text-center"><p className="text-sm text-white/60 font-light">{isDragging ? '松开以上传文件' : '拖拽文件至此或点击上传'}</p><p className="text-[11px] text-white/30 mt-1">支持 .mp4 / .mp3 / .wav</p></div>
          </div>
          {uploadFiles.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto shrink-0">
              {uploadFiles.map((uf) => (
                <div key={uf.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  {uf.file.name.endsWith('.mp4') ? <FileVideo size={16} className="text-white/40 shrink-0" /> : <FileAudio size={16} className="text-white/40 shrink-0" />}
                  <div className="flex-1 min-w-0"><p className="text-[13px] text-white/75 truncate">{uf.file.name}</p><p className="text-[10px] text-white/30">{fmtSize(uf.file.size)}</p></div>
                  <button onClick={() => removeFile(uf.id)} className="text-white/30 hover:text-white/60 transition-colors shrink-0"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="liquid-glass rounded-xl px-4 py-3"><label className="text-[10px] text-white/35 tracking-widest uppercase block mb-1">Ethnic Group · 民族</label><input type="text" value={metadata.ethnicGroup} onChange={(e) => setMetadata((p) => ({ ...p, ethnicGroup: e.target.value }))} placeholder="如：哈尼族、彝族……" className="bg-transparent text-[13px] text-white/75 placeholder:text-white/20 outline-none w-full" /></div>
            <div className="liquid-glass rounded-xl px-4 py-3"><label className="text-[10px] text-white/35 tracking-widest uppercase block mb-1">Region · 地区</label><input type="text" value={metadata.region} onChange={(e) => setMetadata((p) => ({ ...p, region: e.target.value }))} placeholder="如：云南红河、贵州黔东南……" className="bg-transparent text-[13px] text-white/75 placeholder:text-white/20 outline-none w-full" /></div>
          </div>
          <div className="liquid-glass rounded-xl px-4 py-3"><label className="text-[10px] text-white/35 tracking-widest uppercase block mb-1">Original Performer · 原始表演者</label><input type="text" value={metadata.performer} onChange={(e) => setMetadata((p) => ({ ...p, performer: e.target.value }))} placeholder="演唱者 / 演奏者姓名……" className="bg-transparent text-[13px] text-white/75 placeholder:text-white/20 outline-none w-full" /></div>
          <div className="liquid-glass rounded-xl px-4 py-3 flex-1 flex flex-col"><label className="text-[10px] text-white/35 tracking-widest uppercase block mb-1">Academic Description · 学术描述</label><textarea value={metadata.description} onChange={(e) => setMetadata((p) => ({ ...p, description: e.target.value }))} placeholder="调式特征、田野背景、采集时间、历史溯源……" rows={4} className="bg-transparent text-[13px] text-white/75 placeholder:text-white/20 outline-none w-full flex-1 resize-none" /></div>
          <button onClick={handleSync} disabled={uploadFiles.length === 0 || uploadStatus === 'uploading'}
            className={`liquid-glass w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${uploadStatus === 'success' ? 'text-emerald-400' : uploadStatus === 'error' ? 'text-red-400' : 'text-white/70 hover:text-white'} disabled:opacity-30 disabled:cursor-not-allowed`}>
            {uploadStatus === 'uploading' ? <><SpinningLoader size={14} /> 同步中……</> : uploadStatus === 'success' ? <><Check size={14} /> 同步成功 — 数据已提交至云端</> : uploadStatus === 'error' ? <><X size={14} /> 同步失败 — 后端未部署或网络异常</> : <><Cloud size={14} /> 同步至云端 Sync to Cloud</>}
          </button>
          <p className="text-[10px] text-white/25 text-center -mt-1">POST /api/v1/upload · FormData (multipart/form-data)</p>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // ── Main ────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════

  const navItems: { view: View; icon: React.ReactNode; label: string; labelZh: string }[] = [
    { view: 'showcase', icon: <LayoutGrid size={15} />, label: 'Showcase', labelZh: '展示' },
    { view: 'lab', icon: <FlaskConical size={15} />, label: 'AIGC Lab', labelZh: '实验室' },
    { view: 'scholar', icon: <GraduationCap size={15} />, label: 'Scholar', labelZh: '学者入驻' },
  ];

  return (
    <div className="min-h-screen overflow-y-auto flex flex-col bg-[#0a0a0a] text-white font-sans antialiased p-4 sm:p-6 md:p-8 lg:p-10">
      {activeView !== 'showcase' && (
        <header className="flex items-center justify-between shrink-0 mb-2">
          <h1 className="text-xl md:text-2xl tracking-tight font-light">Eco-Echo <span className="text-white/40">|</span> <span className="text-white/60">音应未来</span></h1>
          <button onClick={() => { setActiveView('showcase'); setTranslationResult(null); }} className="text-[12px] text-white/45 hover:text-white/75 transition-colors flex items-center gap-1"><ArrowUpRight size={12} /> Back to Showcase</button>
        </header>
      )}

      <div className="flex-1 min-h-0 flex flex-col">
        {activeView === 'showcase' && renderShowcase()}
        {activeView === 'lab' && renderLab()}
        {activeView === 'scholar' && renderScholar()}
      </div>

      <nav className="shrink-0 mt-4 md:mt-5 flex items-center justify-center gap-1">
        <div className="liquid-glass flex items-center rounded-full p-1 gap-0.5">
          {navItems.map((item) => (
            <button key={item.view} onClick={() => setActiveView(item.view)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all cursor-pointer ${activeView === item.view ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white/70'}`}>
              {item.icon}<span className="hidden sm:inline">{item.label}</span><span className="sm:hidden text-[11px]">{item.labelZh}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;

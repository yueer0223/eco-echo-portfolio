export interface SongEntry {
  id: number;
  nation: string;
  title: string;
  path: string;
}

const songs: SongEntry[] = [
  // ── 1–32 ──────────────────────────────────────────────────────────
  { id: 1,  nation: '侗族',     title: '蝉之歌',             path: '/music/1.mp3' },
  { id: 2,  nation: '蒙古族',   title: '辽阔的草原',         path: '/music/2.mp3' },
  { id: 3,  nation: '藏族',     title: '格萨尔王传',         path: '/music/3.mp3' },
  { id: 4,  nation: '苗族',     title: '飞歌',               path: '/music/4.mp3' },
  { id: 5,  nation: '彝族',     title: '阿细跳月',           path: '/music/5.mp3' },
  { id: 6,  nation: '哈尼族',   title: '海菜腔',             path: '/music/6.mp3' },
  { id: 7,  nation: '纳西族',   title: '白沙细乐',           path: '/music/7.mp3' },
  { id: 8,  nation: '羌族',     title: '多声部合唱',         path: '/music/8.mp3' },
  { id: 9,  nation: '傣族',     title: '孔雀舞',             path: '/music/9.mp3' },
  { id: 10, nation: '土家族',   title: '哭嫁歌',             path: '/music/10.mp3' },
  { id: 11, nation: '维吾尔族', title: '十二木卡姆',         path: '/music/11.mp3' },
  { id: 12, nation: '朝鲜族',   title: '阿里郎',             path: '/music/12.mp3' },
  { id: 13, nation: '藏族',     title: '牧歌',               path: '/music/13.mp3' },
  { id: 14, nation: '蒙古族',   title: '长调',               path: '/music/14.mp3' },
  { id: 15, nation: '苗族',     title: '古歌',               path: '/music/15.mp3' },
  { id: 16, nation: '彝族',     title: '海棠腔',             path: '/music/16.mp3' },
  { id: 17, nation: '侗族',     title: '大歌',               path: '/music/17.mp3' },
  { id: 18, nation: '壮族',     title: '山歌',               path: '/music/18.mp3' },
  { id: 19, nation: '回族',     title: '花儿',               path: '/music/19.mp3' },
  { id: 20, nation: '傣族',     title: '赞哈',               path: '/music/20.mp3' },
  { id: 21, nation: '哈萨克族', title: '冬不拉弹唱',         path: '/music/21.mp3' },
  { id: 22, nation: '布依族',   title: '好花红',             path: '/music/22.mp3' },
  { id: 23, nation: '瑶族',     title: '盘王歌',             path: '/music/23.mp3' },
  { id: 24, nation: '黎族',     title: '打柴舞',             path: '/music/24.mp3' },
  { id: 25, nation: '傈僳族',   title: '摆时',               path: '/music/25.mp3' },
  { id: 26, nation: '佤族',     title: '木鼓舞',             path: '/music/26.mp3' },
  { id: 27, nation: '畲族',     title: '双音',               path: '/music/27.mp3' },
  { id: 28, nation: '高山族',   title: '杵歌',               path: '/music/28.mp3' },
  { id: 29, nation: '拉祜族',   title: '芦笙舞曲',           path: '/music/29.mp3' },
  { id: 30, nation: '水族',     title: '双歌',               path: '/music/30.mp3' },
  { id: 31, nation: '东乡族',   title: '花儿对唱',           path: '/music/31.mp3' },
  { id: 32, nation: '景颇族',   title: '目瑙纵歌',           path: '/music/32.mp3' },

  // ── 33–44 跳过 ────────────────────────────────────────────────────

  // ── 45–56 ─────────────────────────────────────────────────────────
  { id: 45, nation: '纳西族',   title: '东巴唱腔',           path: '/music/45.mp3' },
  { id: 46, nation: '藏族',     title: '弦子',               path: '/music/46.mp3' },
  { id: 47, nation: '苗族',     title: '芦笙曲',             path: '/music/47.mp3' },
  { id: 48, nation: '彝族',     title: '四腔',               path: '/music/48.mp3' },
  { id: 49, nation: '蒙古族',   title: '呼麦',               path: '/music/49.mp3' },
  { id: 50, nation: '维吾尔族', title: '达斯坦',             path: '/music/50.mp3' },
  { id: 51, nation: '侗族',     title: '踩堂歌',             path: '/music/51.mp3' },
  { id: 52, nation: '傣族',     title: '象脚鼓舞',           path: '/music/52.mp3' },
  { id: 53, nation: '土家族',   title: '摆手歌',             path: '/music/53.mp3' },
  { id: 54, nation: '哈尼族',   title: '苦歌',               path: '/music/54.mp3' },
  { id: 55, nation: '羌族',     title: '释比唱经',           path: '/music/55.mp3' },
  { id: 56, nation: '壮族',     title: '歌圩',               path: '/music/56.mp3' },
];

export default songs;

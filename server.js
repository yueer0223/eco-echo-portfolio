import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 4000;

// ── CORS ─────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

// ── Upload directory ─────────────────────────────────────────────────
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`  📁  Created uploads directory: ${uploadDir}`);
}

// ── Multer config ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.\-一-鿿]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (/\.(mp4|mp3|wav)$/i.test(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new Error(`Rejected: "${file.originalname}" — only .mp4 / .mp3 / .wav allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});

// ── Pretty logger ────────────────────────────────────────────────────
const dim = '\x1b[2m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';

function logUpload(files, metadata) {
  const ts = new Date().toLocaleString('zh-CN', { hour12: false });

  console.log('');
  console.log('┌──────────────────────────────────────────────────────────┐');
  console.log(`│  📬  Scholar Upload Received  ·  ${ts}  │`);
  console.log('├──────────────────────────────────────────────────────────┤');

  if (metadata.ethnicGroup)  console.log(`│  🏷️  民族 (Ethnic Group)     ${pad(metadata.ethnicGroup)} │`);
  if (metadata.region)       console.log(`│  📍 地区 (Region)            ${pad(metadata.region)} │`);
  if (metadata.performer)    console.log(`│  🎤 表演者 (Performer)       ${pad(metadata.performer)} │`);
  if (metadata.description)  console.log(`│  📝 学术描述                  ${pad(truncate(metadata.description, 30))} │`);

  console.log('├──────────────────────────────────────────────────────────┤');

  const totalKB = files.reduce((s, f) => s + f.size, 0) / 1024;
  console.log(`│  📎 文件 (Files)  ·  ${files.length} 个  ·  ${totalKB.toFixed(1)} KB`.padEnd(59) + '│');

  files.forEach((f, i) => {
    const icon = f.mimetype.startsWith('video') ? '🎬' : '🎵';
    const kb = (f.size / 1024).toFixed(1);
    console.log(`│     ${i + 1}. ${icon}  ${truncate(f.originalname, 36)}  ${kb} KB`.padEnd(59) + '│');
    console.log(`${dim}│         → ${f.path}${reset}`);
  });

  console.log('└──────────────────────────────────────────────────────────┘');
  console.log(`  ${green}✓${reset}  Saved to ${cyan}${uploadDir}${reset}`);
  console.log('');
}

function pad(s, len = 26) {
  const str = String(s);
  return str.length > len ? str.slice(0, len - 1) + '…' : str.padEnd(len);
}

function truncate(s, len) {
  return String(s).length > len ? String(s).slice(0, len - 1) + '…' : String(s);
}

// ── Routes ───────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'eco-echo-scholar-upload', version: '1.0.0' });
});

app.post('/api/v1/upload', upload.array('files', 20), (req, res) => {
  const files = req.files;
  const { ethnicGroup, region, performer, description } = req.body;

  if (!files || files.length === 0) {
    console.log(`  ${yellow}⚠${reset}  Upload received but no files attached`);
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  logUpload(files, { ethnicGroup, region, performer, description });

  res.json({
    success: true,
    message: `${files.length} file(s) uploaded`,
    files: files.map((f) => ({
      originalName: f.originalname,
      storedName: path.basename(f.path),
      size: f.size,
    })),
    metadata: { ethnicGroup, region, performer, description },
    receivedAt: new Date().toISOString(),
  });
});

// ── Error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(`  ✗  ${err.message}`);
  res.status(err.status || 500).json({ success: false, error: err.message });
});

// ── Start ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   🎵  Eco-Echo Scholar Backend         ║');
  console.log(`  ║   Listening on http://localhost:${PORT}      ║`);
  console.log(`  ║   Upload  →  POST /api/v1/upload        ║`);
  console.log(`  ║   Health  →  GET  /api/v1/health        ║`);
  console.log(`  ║   Storage →  ${uploadDir}`.padEnd(45) + '║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});

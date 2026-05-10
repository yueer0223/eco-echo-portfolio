Eco-Echo (音应未来)

Eco-Echo 是一个多民族非遗民歌的数字化共创平台。项目通过 Bento Grid 布局、交互式音乐人格测试与大语言模型转译工作流，尝试在古老声场与青年创作者之间架一座桥。

Led by Yueer — translating ancient vocal heritage into contemporary resonance.


核心模块

文化转译实验室 (AIGC Lab)

传统音乐的二创门槛在于调式体系与制作知识的双重壁垒。实验室提供一套"种子 × 滤镜"的交互模型：

Native Seed（原生种子）：哈尼海菜腔、彝族阿细跳月、苗族飞歌等 8 种典型非遗音乐类型
Modern Filter（现代滤镜）：赛博朋克、Lo-fi、交响管弦、氛围电子等 8 种当代风格

选定组合后，接入 OpenAI 兼容接口（DeepSeek 等），通过结构化的民族音乐学 Prompt，输出包含调式映射、节奏改编、配器方案、混音参数与唱词改编的五部分制作指南。


音乐灵魂测试 (Soul Resonance Test)

20 道题目覆盖四个 MBTI 维度（E/I · S/N · T/F · J/P，各 5 题），每题均为针对声音感知、创作偏好与文化认同的场景化设问。根据答题结果计算四字母类型，对应 16 种非遗音乐原型。

过渡动画基于 requestAnimationFrame 与 CSS transition 实现，绕开了国产安卓浏览器对 @keyframes 的兼容性问题。


学者入驻门户 (Scholar Portal)

面向非遗传承人与田野工作者的资产管理前端：

拖拽上传 .mp4 / .mp3 / .wav 文件，带视觉反馈
元数据表单：民族、地区、原始表演者、学术描述
文件与元数据封装为标准 FormData，预配置 POST /api/v1/upload 端点

配套 server.js（Express + Multer）已提供完整的后端参考实现。


视觉与渲染

Liquid-Glass：纯 CSS 毛玻璃（backdrop-filter + 渐变边框伪元素），深色底上保留通透感
Noise Overlay：SVG fractalNoise 胶片颗粒纹理层
视频防劫持：针对微信 X5 与百度内核的视频劫持行为，Canvas 代理引擎将视频帧逐帧绘制到 canvas 显示，配合 x5-video-player-type 等属性最大限度地保持内联渲染


技术栈

框架：React 19 · TypeScript
构建：Vite 8
样式：Tailwind CSS 3.4 · PostCSS
图标：Lucide React
AI 接入：OpenAI 兼容协议 (DeepSeek / 代理网关)
后端参考：Express.js + Multer (server.js)


本地运行

cd eco-echo-portfolio
npm install
cp .env.example .env.local
npm run dev

打开 http://localhost:5173，手机使用局域网 IP 访问。

生产构建：

npm run build
npm run preview

后端（Scholar Upload）：

npm install express multer cors
node server.js


项目结构

eco-echo-portfolio/
  index.html
  vite.config.ts
  tailwind.config.js
  postcss.config.js
  server.js
  .env.example
  src/
    main.tsx
    index.css
    App.tsx


浏览器兼容

在微信 (X5)、百度等国产安卓浏览器上做了针对性适配：全部动画使用 rAF + CSS transition 驱动，零 @keyframes 依赖；背景视频通过 Canvas 代理渲染，避免原生播放器弹窗；liquid-glass 提供 backdrop-filter 不可用时的纯色降级。


Yueer

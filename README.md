# RUNKU 📚

智慧語言學習平台 - 透過間隔重複、語音練習和趣味遊戲，讓學習更有效率！

## ✨ 功能特色

### 1️⃣ 說出來（語音練習）
- 🎤 使用 Web Speech API 進行語音辨識
- 🔊 即時發音示範
- 📊 自動評分和反饋
- 🎯 中文→英文 / 英文→中文 雙向練習

### 2️⃣ 使用他（實際應用）
- 📝 AI 自動生成例句（透過 GitHub Actions）
- 💡 用法提示和情境說明
- 🎓 難度分級系統

### 3️⃣ 複習（間隔重複）
- 🧠 SM-2 演算法智慧排程
- 📅 自動計算下次複習時間
- 📈 學習進度追蹤
- 💾 LocalStorage 本地儲存

### 🎮 趣味小遊戲
- 🦫 **單字打地鼠**: 考驗反應力
- 🎴 **記憶翻牌**: 訓練記憶力
- ✏️ **拼字挑戰**: 練習拼寫

### 📊 學習統計
- 📈 每日學習記錄
- 🎯 精通度分析
- 💾 資料匯出/匯入
- 🏆 學習建議

## 🚀 快速開始

### 前置需求
- Node.js 18+
- GitHub 帳號

### 1. Clone 專案
\`\`\`bash
git clone https://github.com/s0914712/RUNKU.git
cd RUNKU
\`\`\`

### 2. 安裝依賴
\`\`\`bash
cd frontend
npm install
\`\`\`

### 3. 本地開發
\`\`\`bash
npm run dev
\`\`\`

訪問 http://localhost:5173

### 4. 建置部署
\`\`\`bash
npm run build
\`\`\`

## 📁 專案結構

\`\`\`
RUNKU/
├── .github/
│   └── workflows/
│       ├── generate_examples.yml  # 自動生成例句
│       └── deploy.yml            # 部署到 GitHub Pages
├── scripts/
│   └── generate_examples.py      # 生成例句腳本
├── data/
│   └── vocabulary.json            # 單字資料庫（自動生成）
├── words                          # 原始單字檔案
├── frontend/
│   ├── src/
│   │   ├── components/           # React 元件
│   │   │   ├── Flashcard.jsx
│   │   │   ├── SpeakingPractice.jsx
│   │   │   └── Games/
│   │   ├── pages/                # 頁面元件
│   │   ├── hooks/                # 自定義 Hooks
│   │   └── utils/                # 工具函式
│   ├── package.json
│   └── vite.config.js
└── README.md
\`\`\`

## 🔧 配置

### GitHub Secrets 設定
在 GitHub Repository Settings → Secrets 中新增：

- \`APERTIS_API_KEY\`: Apertis AI API 金鑰（用於生成例句）

### 單字檔案格式
在 \`words\` 檔案中，每行一個單字：

\`\`\`
開放-open
學習-learn
挑戰-challenge
\`\`\`

或只有英文：
\`\`\`
apple
banana
computer
\`\`\`

### GitHub Pages 部署
1. 前往 Repository Settings → Pages
2. Source 選擇 "GitHub Actions"
3. 推送到 main branch 後自動部署

## 🎯 使用說明

### 語音功能
- **首次使用**: 需要允許瀏覽器麥克風權限
- **最佳瀏覽器**: Chrome、Edge
- **建議環境**: 安靜的環境中練習

### 資料備份
1. 進入「統計」頁面
2. 點擊「匯出 JSON」下載備份
3. 使用「匯入」功能恢復資料

### 跨裝置同步
目前使用 LocalStorage 儲存，建議：
- 定期匯出備份
- 在新裝置上匯入資料

## 🛠️ 技術棧

### 前端
- React 18
- Vite
- Tailwind CSS
- React Router

### API
- Apertis AI (Grok 4.1)
- Web Speech API
- GitHub API

### 部署
- GitHub Pages
- GitHub Actions

## 📝 待辦事項

- [ ] 新增更多小遊戲
- [ ] 實作雲端同步功能
- [ ] 加入學習排行榜
- [ ] 支援多語言介面
- [ ] PWA 離線功能
- [ ] 社群分享功能

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

## 👤 作者

Chen - [@s0914712](https://github.com/s0914712)

## 🙏 致謝

- Apertis AI 提供免費 API
- Web Speech API
- Tailwind CSS
- React 社群
\`\`\`

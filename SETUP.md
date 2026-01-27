# 🚀 RUNKU 快速設定指南

## 步驟 1: 準備 GitHub Repository

### 1.1 上傳檔案到 GitHub
\`\`\`bash
# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 連結到你的 GitHub repo
git remote add origin https://github.com/s0914712/RUNKU.git
git branch -M main
git push -u origin main
\`\`\`

## 步驟 2: 設定 GitHub Secrets

1. 前往你的 Repository
2. Settings → Secrets and variables → Actions
3. 點擊 "New repository secret"
4. 新增以下 Secret:
   - **Name**: \`APERTIS_API_KEY\`
   - **Value**: 你的 Apertis API Key

### 如何取得 Apertis API Key？
1. 訪問 https://api.apertis.ai
2. 註冊/登入帳號
3. 複製 API Key

## 步驟 3: 啟用 GitHub Pages

1. Repository → Settings → Pages
2. **Source**: 選擇 "GitHub Actions"
3. 儲存設定

## 步驟 4: 設定單字檔案

編輯 \`words\` 檔案，加入你的單字：

\`\`\`
開放-open
學習-learn
挑戰-challenge
# ... 更多單字
\`\`\`

**格式說明**:
- \`中文-英文\`: 標準格式
- \`英文-中文\`: 也可以（會自動識別）
- \`單字\`: 只有英文（中文會由 AI 生成）
- \`# 註解\`: 以 # 開頭的行會被忽略

## 步驟 5: 觸發例句生成

### 方法 1: 手動觸發
1. Actions 頁面
2. 選擇 "Generate Word Examples"
3. 點擊 "Run workflow"

### 方法 2: 自動執行
- 每天凌晨 2 點自動執行
- 或每次推送 \`words\` 檔案時執行

## 步驟 6: 部署網站

推送程式碼後，GitHub Actions 會自動:
1. 建置 React 應用
2. 部署到 GitHub Pages

訪問網址: \`https://s0914712.github.io/RUNKU/\`

## 步驟 7: 本地開發（可選）

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

訪問 http://localhost:5173

## ⚙️ 進階設定

### 修改 GitHub Pages 路徑
在 \`frontend/vite.config.js\` 中修改:
\`\`\`javascript
base: '/RUNKU/',  // 改成你的 repo 名稱
\`\`\`

### 調整例句生成頻率
在 \`.github/workflows/generate_examples.yml\` 中修改:
\`\`\`yaml
schedule:
  - cron: '0 2 * * *'  # 每天凌晨 2 點
\`\`\`

### 使用不同的 AI 模型
在 \`scripts/generate_examples.py\` 中修改:
\`\`\`python
APERTIS_MODEL = 'grok-4.1-fast:free'  # 改成其他模型
\`\`\`

## 📱 使用應用

### 首次使用
1. 訪問網站
2. 允許麥克風權限（語音功能需要）
3. 開始學習！

### 備份資料
1. 進入「統計」頁面
2. 點擊「匯出 JSON」
3. 保存備份檔案

### 跨裝置使用
1. 在舊裝置匯出資料
2. 在新裝置匯入資料

## 🐛 常見問題

### Q: 語音辨識不工作？
A: 
- 檢查瀏覽器是否支援（建議使用 Chrome/Edge）
- 確認已允許麥克風權限
- 確保網站使用 HTTPS（GitHub Pages 預設支援）

### Q: 找不到單字庫？
A: 
- 確認 \`data/vocabulary.json\` 已生成
- 手動執行 "Generate Word Examples" workflow
- 檢查 API Key 是否正確設定

### Q: 部署失敗？
A: 
- 檢查 GitHub Actions 的錯誤訊息
- 確認 Node.js 版本相容（需要 18+）
- 確認已啟用 GitHub Pages

### Q: 資料會遺失嗎？
A: 
- 資料儲存在瀏覽器 LocalStorage
- 定期匯出備份
- 清除瀏覽器資料會遺失進度

## 🎉 完成！

現在你可以開始使用 RUNKU 學習語言了！

有問題？歡迎在 GitHub Issues 提問。
\`\`\`

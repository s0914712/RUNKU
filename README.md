# RUNKU 🎮📚

單字遊戲樂園 — 用遊戲幫小朋友背英文單字！

單字來源：**20260729 U6~U10 英文聽寫表**（共 58 個單字）

👉 線上遊玩：https://s0914712.github.io/RUNKU/

## 🎯 六種學習模式

| 模式 | 玩法 | 獎勵 |
|------|------|------|
| 🎯 **快問快答** | 看中文 + 圖示，從 4 個選項選出正確英文，共 10 題 | 每題 10 顆星 |
| 👂 **聽力大考驗** | 聽英文發音（可重複播放），選出正確中文 | 每題 12 顆星 |
| 🎴 **記憶翻牌** | 12 張牌，把英文和中文配成一對，翻牌越少分數越高 | 每對 20 顆星 + 效率獎勵 |
| 🔨 **打地鼠** | 60 秒內敲中畫面上正確的英文單字，會記錄最佳成績 | 每次敲中 15 顆星 |
| ✏️ **拼字大師** | 點選字母磁磚，把單字拼出來，可聽發音提示 | 每題 15 顆星 |
| 📖 **單字卡** | 依主題瀏覽全部單字，點卡片聽發音，顯示熟練度星星 | — |

## ✨ 特色

- 🔊 **真人發音**：使用瀏覽器 Web Speech API 唸出英文（速度放慢，適合小朋友）
- ⭐ **星星獎勵系統**：答對累積星星，激勵持續練習
- 📊 **熟練度追蹤**：每個單字依答對／答錯次數顯示 0～3 顆星
- 🗂️ **七大主題**：基礎用語、動物、生活物品、職業人物、交通與樂器、數字 1-10、身體部位
- 💾 **自動存檔**：進度存在瀏覽器 LocalStorage，關掉再打開還在
- 📱 **手機優先**：大按鈕、大字體，平板手機都好按
- 🎉 **即時回饋**：音效、動畫、彩帶慶祝

## 📖 單字內容（U6~U10）

| 主題 | 單字 |
|------|------|
| 基礎用語 | what, this, that, these, those, flower |
| 動物 | bear, bird, tiger, ant, zebra, octopus, horse, fish, lion, dog, cat, snake, duck, monkey |
| 生活物品 | mouse (mice), umbrella, watch (watches), bench (benches), window, door, kite, cloud, toy |
| 職業人物 | nurse, dancer, doctor |
| 交通與樂器 | violin, train, truck, piano |
| 數字 | one ~ ten |
| 身體部位 | face, hair, eye(s), mouth, hand(s), ear(s), stomach, shoulder, knee, arm, foot (feet), leg |

單字卡上會標示不規則變化與冠詞提示，例如 `one mouse - two mice`、`an umbrella`、`one foot - two feet`。

## 🚀 使用方式

### 直接遊玩
開啟 https://s0914712.github.io/RUNKU/ 即可，不需要安裝任何東西。

### 本機執行
```bash
git clone https://github.com/s0914712/RUNKU.git
cd RUNKU
# 直接用瀏覽器打開 index.html，或起一個簡易伺服器：
npx http-server .
```

`index.html` 是**單一檔案應用程式**，不需要建置流程、不依賴任何外部資源。

## ✏️ 更換單字

要換成新一課的單字時，編輯 `index.html` 裡的 `WORDS` 陣列即可：

```js
{ id:59, en:'apple', zh:'蘋果', cat:'things', emoji:'🍎' },
// 有不規則複數時再加上：
{ id:60, en:'child', zh:'小孩', cat:'people', emoji:'🧒', plural:'children', note:'one child - two children' },
```

`cat` 可用的主題：`basics`、`animals`、`things`、`people`、`vehicles`、`numbers`、`body`
（主題定義在同檔案的 `CATS` 物件中，可自行增減。）

同一份單字也維護在兩個地方，方便其他程式讀取：
- `words` — 純文字 `中文-英文` 格式（React 版 `WordLearningPage` 會讀這個檔）
- `data/vocabulary.json` — 含主題、emoji、複數變化的完整結構

## 📁 專案結構

```
RUNKU/
├── index.html                 # 🎮 主程式（單檔遊戲樂園，GitHub Pages 首頁）
├── words                      # 單字純文字檔（中文-英文）
├── data/
│   └── vocabulary.json        # 單字結構化資料（主題／emoji／複數）
├── frontend/                  # React + Vite 版本（實驗中）
│   └── src/
│       ├── components/
│       ├── pages/
│       └── utils/
└── .github/workflows/
    └── deploy.yml             # GitHub Pages 部署
```

## 🌐 瀏覽器支援

| 功能 | 支援 |
|------|------|
| 遊戲主體 | 所有現代瀏覽器 |
| 英文發音 | Chrome / Edge / Safari（需系統有英文語音）|
| 音效 | 支援 Web Audio API 的瀏覽器 |

> 提示：iPad / iPhone 首次需要點一下畫面才會有聲音（瀏覽器的音訊限制）。

## 🎓 給家長和老師的建議玩法

1. **先看單字卡** 📖 — 把該主題的單字聽過一遍
2. **玩快問快答** 🎯 — 確認中英文對應記住了
3. **玩聽力大考驗** 👂 — 訓練聽力，聽寫前必玩
4. **玩拼字大師** ✏️ — 準備聽寫的拼字部分
5. **打地鼠 / 記憶翻牌** 🔨🎴 — 複習加速反應，當作獎勵時間

## 📄 授權

MIT License

## 👤 作者

Chen - [@s0914712](https://github.com/s0914712)

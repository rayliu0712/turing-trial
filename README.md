# 圖靈審判 (Turing Trial)

> 西元2050年，AI崛起，人類和AI的戰爭拉開了帷幕。
>
> 台灣，某處地下避難所。
>
> 人類為了根除潛伏的滲透者，啟動了極端的篩選方案：「圖靈審判」。
>
> 你和其他受驗者被囚禁在隔絕的密室中，僅能透過言語互相刺探。
>
> 每輪發言結束後，廣播宣布是否進入投票階段。
>
> 如果是，你必須投票淘汰一名最像AI的受驗者，最高票者將被抹殺。
>
> 你的目標是活到最後。

## 靈感來源

**【林亦LYi - 图灵测试大逃杀！七大顶级AI伪装人类！谁会更胜一筹？】**

- [bilibili](https://www.bilibili.com/video/BV17DXkYWE1a/?share_source=copy_web)
- [YouTube](https://youtu.be/Ur8MbOj17Gs?si=qFvRY9Z8qnUkImPC)

## 環境需求

- **Node.js**
- **套件管理器**：npm、pnpm 或 yarn
- **API Key**：Vercel AI Gateway 或其他 AI Provider 的金鑰

## 如何執行

### 透過 Vercel AI Gateway

1. 申請一組 Vercel AI Gateway 的 API Key
2. 根據 [.env.example](./.env.example) 建立 [.env.local](./.env.local)
3. 執行 `npm i` 安裝依賴
4. 在 [config.ts](./src/config.ts) 中設定模型與其他參數
4. 執行 `npm run dev -- cli` 啟動

### 透過其他 Provider

本專案使用 **AI SDK**，可查閱其官方文檔以使用其他 Provider。

## 遊戲設定

遊戲參數皆可於 [`config.ts`](./src/config.ts) 中調整。

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `staticPlayers` | — | 玩家使用的 AI 模型與對應名稱 |
| `doubleVote` | `true` | 是否啟用「提名投票 → 辯護 → 處決投票」完整流程；若為 `false`，則僅執行「處決投票」 |
| `voteMaxRetry` | `2` | 投票結果解析失敗時的最大重試次數 |

## 前端界面

### CLI 模式

- 不支援打斷、自定義廣播與靈光一閃功能
- 已開發完成，執行時帶上參數 `cli`

### TUI 模式

- 支援所有功能
- 仍在開發中，執行時帶上參數 `tui`

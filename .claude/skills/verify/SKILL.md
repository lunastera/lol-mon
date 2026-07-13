---
name: verify
description: lol-ken (React Router SPA) をローカルで起動し、ブラウザで検定フローを一通り駆動して検証する手順
---

# lol-ken の検証手順

## 起動

```sh
npm run dev   # http://localhost:5173
```

## ブラウザ駆動

Playwright ブラウザは未インストール。`playwright-core` + システム Chrome を使う:

```js
const browser = await chromium.launch({ channel: "chrome", headless: true });
```

## 検証すべきフロー

1. `/` — レーン 5 個 + 出題タイプ 8 個のチェックボックス（デフォルト全チェック）と
   「検定を開始する」ボタン。タイプ 0 個、またはチャンピオン系タイプありでレーン 0 個
   だとボタンが disabled になりエラーメッセージが出る
2. 開始 → `/quiz?lanes=TOP,MIDDLE&types=title,item-price` 形式の URL（全選択時はパラメータ省略）。
   20 問回答。選択肢ボタンは `main button` の先頭 4 つ。回答後に `正解！`/`不正解…` が出て、
   `次の問題へ`（最終問は `結果を見る`）が現れる
3. `/result` — スコア・ランクバッジ・X シェアリンク（`twitter.com/intent`、レーン名入り）・
   「もう一度挑戦する」リンクが同じ lanes/types を保持
4. プローブ: 不正な lanes/types 値は無視され全選択にフォールバック / `?seed=N` 固定で同一出題 /
   lanes 指定時のチャンピオン問題の選択肢は該当レーンのチャンピオンのみ

## 注意

- クイズ完了直後の同一タブで `/result` を reload すると history.state に結果が
  残っているため結果が再表示される（仕様）。直接アクセスの検証は新規タブ/コンテキストで。
- GitHub Pages 相当のビルド確認: `GITHUB_REPOSITORY=lunastera/lol-ken npm run build`
  → `build/client/index.html` のアセットパスが `/lol-ken/` 始まり、`404.html` が存在すること。

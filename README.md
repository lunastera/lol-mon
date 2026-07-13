# LoLもん (lol-mon)

LoLもん — League of Legends 知識クイズ。20 問の 4 択問題に答えると、正解数に応じてアイアン〜チャレンジャーのランクを判定します。結果は X (Twitter) にシェアできます。

https://lunastera.github.io/lol-mon/

## 特徴

- **出題タイプをチェックリストで選択**: スキル / 称号 / チャンピオン画像 / アイテム価格 / アイテム効果 / アイテム画像 / ルーン系統 / サモナースペル
- **レーン絞り込み**: TOP / JG / MID / ADC / SUP を複数選択でき、チャンピオン問題の出題範囲が選んだレーンに限定される
- **完全静的**: 問題は [Riot Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) のデータからクライアントサイドで動的生成。サーバー不要で GitHub Pages にデプロイ
- **画像の事前ダウンロード**: Service Worker + Cache Storage で問題画像を端末にキャッシュし、表示を高速化

## 技術スタック

- [React Router](https://reactrouter.com/) v8 (SPA モード) + Vite + TypeScript
- Tailwind CSS v4
- Biome (lint / format) / Vitest (テスト)

## 開発

```sh
npm install
npm run dev        # 開発サーバー (http://localhost:5173)
npm run typecheck  # 型チェック
npm test           # ユニットテスト
npm run lint       # リント
npm run build      # 本番ビルド (build/client)
```

## データ更新

クイズの元データ `public/data/quiz-data.json` は以下で再生成します（新パッチ・新チャンピオン対応時）:

```sh
npm run generate-data
```

- チャンピオン・アイテム・ルーン・サモナースペル: Riot **Data Dragon** (ja_JP) の最新バージョン
- チャンピオンのレーン割り当て: [Meraki Analytics](https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/championrates.json) のレーン別プレイ率（プレイ率 0.5% 以上のレーンを採用）

生成結果はリポジトリにコミットします（ビルド時のネットワークアクセス不要）。

## デプロイ

`main` ブランチへの push で GitHub Actions ([deploy-pages.yml](.github/workflows/deploy-pages.yml)) が走り、GitHub Pages に自動デプロイされます。リポジトリ設定で Pages の Source を **GitHub Actions** にしてください。

ベースパス (`/lol-mon/`) は CI 上で `GITHUB_REPOSITORY` 環境変数から自動決定されます。ローカルで Pages 相当のビルドを確認する場合:

```sh
GITHUB_REPOSITORY=lunastera/lol-mon npm run build
npx vite preview
```

## クレジット

LoLもんは Riot Games 非公式のファンコンテンツです。League of Legends および Riot Games は Riot Games, Inc. の商標です。ゲームデータは Riot Data Dragon、レーン情報は Meraki Analytics を利用しています。

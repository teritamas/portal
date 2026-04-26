# Teritamas Portal

てりたまのハッカソン作品を紹介する Astro 製ポートフォリオサイトと、ChatGPT App 用のローカル MCP サーバーを含む npm workspaces 構成のリポジトリです。
作品データは `shared` workspace に集約し、`lp` と `mcp` の両方から共通利用します。

## ChatGPT App

MCP サーバーは読み取り専用の `projects.showcase` ツールを公開します。
このツールはポートフォリオ作品の構造化データを返し、`ui://teritamas/projects.html` に登録されたウィジェットを表示します。
Generative UI の動作確認には `projects.generate_ui` ツールを使用します。
このツールは検索結果に応じて `cards`、`table`、`comparison`、`spotlight` の UI 記述を生成し、同じウィジェットがその記述を解釈して表示します。

```sh
npm run mcp:build
PORT=8787 npm run mcp:start
```

ローカルの Streamable HTTP MCP エンドポイントには `http://127.0.0.1:8787` を指定してください。
軽量な起動確認用に `GET /health` も利用できます。

## ディレクトリ構成

```text
/
├── lp/
│   ├── public/
│   ├── src/
│   ├── astro.config.mjs
│   └── package.json
├── mcp/
│   ├── server.ts
│   ├── widget/
│   └── package.json
├── shared/
│   ├── src/
│   │   └── projects.ts
│   └── package.json
└── package.json
```

## コマンド

すべてのコマンドはプロジェクトルートで実行します。

| コマンド             | 説明                                           |
| :------------------- | :--------------------------------------------- |
| `npm install`        | 依存関係をインストールします                   |
| `npm run dev`        | `lp` の Astro ローカル開発サーバーを起動します |
| `npm run build`      | `lp` の本番用サイトを `lp/dist/` にビルドします |
| `npm run preview`    | `lp` のビルド済みサイトをローカルでプレビューします |
| `npm run check`      | `lp` の Astro check を実行します               |
| `npm run mcp:build`  | `shared`、ChatGPT App ウィジェット、MCP サーバーをビルドします |
| `npm run mcp:start`  | ローカル MCP サーバーを起動します              |
| `npm run mcp:dev`    | MCP サーバーをビルドして起動します             |
| `npm run astro ...`  | `lp` workspace の Astro CLI コマンドを実行します |

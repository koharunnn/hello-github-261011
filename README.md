# hello-github-261011

## かんたん掲示板 (Simple Bulletin Board)

Cloudflare Workers + D1 で動く、たった一つの掲示板です。誰でも書き込みができ、書き込みは全員に表示されます。

### 構成

- `src/index.js` — Worker本体（掲示板の表示・投稿処理）
- `wrangler.toml` — Worker設定（D1バインディング `DB` を含む）
- `schema.sql` — 掲示板の投稿を保存するテーブル定義

### ローカルで動かす

```bash
npm install
npx wrangler d1 execute bulletin-board-db --local --file=./schema.sql
npm run dev
```

ブラウザで `http://localhost:8787` を開くと掲示板が表示されます。

### Cloudflareへのデプロイ

1. [Cloudflareダッシュボード](https://dash.cloudflare.com/) の「My Profile」→「API Tokens」で、Workers と D1 の編集権限を持つAPIトークンを発行する
2. `CLOUDFLARE_API_TOKEN` を環境変数（または `wrangler login`）で設定する
3. 以下を実行する

```bash
npm install
npm run deploy
```

初回デプロイ後、表示されたURL（`https://simple-bulletin-board.<your-subdomain>.workers.dev`）にアクセスすると掲示板が利用できます。

データベース（D1）はすでに `bulletin-board-db` という名前で作成済みで、`wrangler.toml` にその `database_id` を設定しています。テーブルがまだ無い場合は以下でリモートに反映してください。

```bash
npx wrangler d1 execute bulletin-board-db --remote --file=./schema.sql
```

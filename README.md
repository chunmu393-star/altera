# MMO RPC Smoke Test Pack (App Router Plus)

Next.js App Router + TypeScript + Playwright で動く、Supabase MMO RPC のスモークテスト用サンプルです。

## 含まれるもの

- `/` : read-only smoke test
- `/admin` : mutation smoke test
- `/login` : Supabase Auth ログインフォーム
- `middleware.ts` : `/admin` 用の簡易 Basic 認証ガード
- `tests/*.spec.ts` : Playwright 自動実行サンプル

## 必要な環境変数

`.env.local` を作成して以下を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 任意: /admin を Basic 認証で保護
MMO_ADMIN_BASIC_USER=admin
MMO_ADMIN_BASIC_PASS=change-me

# 任意: Playwright 用ログインユーザー
E2E_USER_EMAIL=test@example.com
E2E_USER_PASSWORD=your-password
```

## セットアップ

```bash
npm install
npm run dev
```

## Playwright 実行

```bash
npx playwright install
npm run test:e2e
```

## 既存リポジトリへの移植手順

1. `src/app` ベースの Next.js プロジェクトであることを確認
2. `src/components/MmoRpcSmokePanel.tsx` を追加
3. `src/components/LoginForm.tsx` を追加
4. `src/lib/*.ts` を追加
5. `src/app/page.tsx`, `src/app/admin/page.tsx`, `src/app/login/page.tsx` を追加または既存構成に合わせて統合
6. `middleware.ts` を追加して `/admin` を簡易保護
7. `playwright.config.ts` と `tests/*.spec.ts` を追加
8. `.env.local` を設定

## SQL 同梱内容

`/sql` 配下に、今回の修正・再検証用 SQL を同梱しています。

- `01-stock-cap-diagnostic-patch.sql`
  - `mmo_install_diagnostic_report()` の `stock_cap_constraint` 誤検知だけを最小修正
- `02-final-diagnostic-and-function-verification.sql`
  - `mmo_install_diagnostic_summary()`、FAIL 抽出、主要 MMO 関数存在確認
- `03-rpc-verification.sql`
  - `mmo_rpc_me_*` の存在確認と `anon / authenticated` の EXECUTE 権限確認
- `04-short-e2e-verification.sql`
  - 武器 / 防具 / ジョブ切替 / ロールバック復元を 1 本で確認する短縮 E2E SQL

推奨順序:

1. 必要なら `01-stock-cap-diagnostic-patch.sql`
2. `02-final-diagnostic-and-function-verification.sql`
3. `03-rpc-verification.sql`
4. `04-short-e2e-verification.sql`
5. フロント側では `/` と `/admin`、または Playwright でスモークテスト

## 注意

- mutation smoke は実際に状態を変更します。テスト用ユーザーで実行してください。
- `04-short-e2e-verification.sql` は内部で変更確認後にロールバック復元を検証します。
- Basic 認証は簡易ガードです。厳密な管理者保護が必要なら、Supabase Auth + サーバー側権限判定に置き換えてください。
- RPC はログイン済みユーザー前提です。

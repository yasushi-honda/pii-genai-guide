# pii-genai-guide

個人情報×生成AI 実務ガイド — 個人情報を扱う組織のための、生成AI利用時の判定フローと要配慮個人情報を扱う場合の技術構成をまとめた実務資料。

公開URL: https://yasushi-honda.github.io/pii-genai-guide/

方針: 対象は主に介護・福祉分野の民間事業者。医療情報は別枠で要点のみ、自治体・行政機関等は参考情報にとどめる。公式一次情報に基づく整理と推奨水準であり、法的助言ではない（資料 p.3「この資料の方針」）。

## 開発

```bash
pnpm install
pnpm dev
```

## ビルド

```bash
pnpm check
pnpm build
```

`main` への push で GitHub Actions（`.github/workflows/deploy.yml`）が自動的に GitHub Pages へデプロイします。

## サイト構成

`public/index.html` がサイトのルート（`/`）そのものであり、元PDF「個人情報×生成AI
実務ガイド」（A4横・21ページ）と同一の固定レイアウトHTMLです。Astroの`src/pages/`は
存在せず、`public/`配下の静的ファイルがそのまま配信されます。本文はこのファイルが
唯一のソースで、二重管理はありません。

## PDF版の生成（`public/downloads/pii-genai-guide.pdf`）

`public/index.html` を変更したら、必ず以下を実行してPDFを再生成し、生成物をコミットしてください。

```bash
pnpm exec playwright install chromium   # 初回のみ
pnpm generate:pdf
```

**このコマンドは macOS でのみ正しく動作します。** 元PDFは macOS 上でレンダリングされており、
本文中の日本語等幅テキストは JetBrains Mono に日本語グリフがないため OS のフォント
（Osaka-Mono 等）へフォールバックします。Linux で実行するとフォント監査が異常終了します
（意図した安全装置です）。

CIは PDF を生成せず、`public/downloads/pii-genai-guide.pdf.source-sha256`（`public/index.html`と
PDF自身、両方のSHA-256を記録したマニフェスト）と実ファイルを突き合わせるだけです。
本文を直したのに再生成を忘れた場合や、PDFだけを誤って削除・置換した場合、
どちらもビルドが失敗します。

## 検証台帳

資料中の主要な主張と一次情報の対応は [docs/claim-source-ledger.md](docs/claim-source-ledger.md) にまとめています（2026-10-12時点）。本文を更新したら、対応する行も更新してください。
法務担当者に確認してほしい論点は [docs/legal-review-issues.md](docs/legal-review-issues.md) に絞って整理しています。

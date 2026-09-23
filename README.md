# pii-genai-guide

個人情報×生成AI 実務ガイド — 個人情報を扱う組織のための、生成AI利用時の判定フローと要配慮個人情報を扱う場合の技術構成をまとめた実務資料。

公開URL: https://yasushi-honda.github.io/pii-genai-guide/

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
実務ガイド」（A4横・16ページ）と同一の固定レイアウトHTMLです。Astroの`src/pages/`は
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

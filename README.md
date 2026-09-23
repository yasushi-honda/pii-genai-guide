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

## PDF版の生成（`public/downloads/pii-genai-guide.pdf`）

`public/deck/index.html` は、元PDF「個人情報×生成AI 実務ガイド」（A4横・16ページ）を
再現する固定レイアウトHTMLです。`src/content/personal-info-generative-ai.mdx`（連続スクロール版）
とは**内容が独立しており、自動同期されません**。本文を更新する場合は両方を手動で編集してください。

デッキHTMLを変更したら、必ず以下を実行してPDFを再生成し、生成物をコミットしてください。

```bash
pnpm exec playwright install chromium   # 初回のみ
pnpm generate:pdf
```

**このコマンドは macOS でのみ正しく動作します。** 元PDFは macOS 上でレンダリングされており、
デッキHTML内の日本語等幅テキストは JetBrains Mono に日本語グリフがないため OS のフォント
（Osaka-Mono 等）へフォールバックします。Linux で実行するとフォント監査が異常終了します
（意図した安全装置です）。

CIは PDF を生成せず、`public/downloads/pii-genai-guide.pdf.source-sha256`（デッキHTMLと
PDF自身、両方のSHA-256を記録したマニフェスト）と実ファイルを突き合わせるだけです。
デッキHTMLを直したのに再生成を忘れた場合や、PDFだけを誤って削除・置換した場合、
どちらもビルドが失敗します。

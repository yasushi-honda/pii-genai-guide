// public/deck/index.html を元PDF「個人情報×生成AI 実務ガイド」(A4横・16ページ) と
// 同一の見た目でPDF化し、public/downloads/ へ出力する。
//
// このスクリプトは macOS ローカルでの実行を前提にしている。元PDFは macOS 上で
// レンダリングされており、デッキHTML内の日本語等幅テキスト(.page-footer 等)は
// JetBrains Mono に日本語グリフがないため OS のフォント(Osaka-Mono 等)へフォール
// バックする。Linux で実行すると全ページのフォールバック箇所が別フォントに置き
// 換わるため、フォント監査(下記 assertPlatformFonts)が異常終了する。これは事故
//防止として意図した挙動であり、CI では実行しない(ハッシュ照合のみ行う)。
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const deckPath = new URL('public/deck/index.html', root);
const outDir = new URL('public/downloads/', root);
const outPdfPath = new URL('pii-genai-guide.pdf', outDir);
const outHashPath = new URL('pii-genai-guide.pdf.source-sha256', outDir);

const EXPECTED_PAGE_COUNT = 16;
const PAGE_WIDTH_MM = 297;
const PAGE_HEIGHT_MM = 210;
const MM_TOLERANCE = 0.05;
// A4横 (297mm x 210mm) の pt 換算値。元PDFは pypdf 後処理で約0.1%大きいが、
// 生成直後のPlaywright出力はこの理論値に一致する。
const PAGE_WIDTH_PT = 841.89;
const PAGE_HEIGHT_PT = 595.28;
const PT_TOLERANCE = 1;

// macOS でこのデッキが正しくレンダリングされた場合に実際に使われる物理フォント。
// Osaka / Osaka-Mono / Apple Color Emoji は、JetBrains Mono や Zen Kaku Gothic
// New のサブセットに日本語グリフ・絵文字がないために起きる「正常な」フォール
// バックであり、元PDFの埋め込みフォント構成そのもの。
// Hiragino Kaku Gothic ProN は `--font-body:'Zen Kaku Gothic New','Hiragino Sans',
// sans-serif` がCSS自身で明示する第2フォールバックの実体（'Hiragino Sans' は
// 論理ファミリー名で、実際にはウェイト別の物理フォントに解決される）。
// どの文字がこの経路に落ちるかはOSのフォントキャッシュ状態に依存し実行毎に
// 変わりうることを実機で確認済みだが、フォールバック先の「ファミリー」自体は
// CSSが意図した2択のどちらかで固定されるため許可リストに含める。
// これら以外が出た場合はフォント取得の失敗かレンダリング環境の差(Linux等)
// なので異常終了させる。
// CDP は太字バリアントを別ファミリーとして返すことがある
// (例: "Shippori Mincho" ExtraBold ウェイト → familyName "Shippori Mincho ExtraBold")
// ため、前方一致で判定する。
const ALLOWED_FONT_PREFIXES = [
  'Zen Kaku Gothic New',
  'Shippori Mincho',
  'JetBrains Mono',
  'Osaka',
  'Apple Color Emoji',
  'Hiragino Kaku Gothic ProN',
];

function isAllowedFont(familyName) {
  return ALLOWED_FONT_PREFIXES.some((prefix) => familyName.startsWith(prefix));
}

function assertDeckExists() {
  if (!existsSync(deckPath)) {
    throw new Error(
      `デッキHTMLが見つかりません: ${deckPath.pathname}\n` +
        '先に public/deck/index.html を配置してください。',
    );
  }
}

async function waitForFontsStable(page) {
  let prev = -1;
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(
      () => [...document.fonts].filter((f) => f.status === 'loaded').length,
    );
    if (loaded === prev && loaded > 0) return loaded;
    prev = loaded;
    await page.waitForTimeout(250);
  }
  throw new Error(
    `フォントの読み込みが安定しませんでした（最終値 ${prev} face）。` +
      'ネットワーク環境を確認し、再実行してください。',
  );
}

async function assertPlatformFonts(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root: domRoot } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds: pageNodeIds } = await cdp.send('DOM.querySelectorAll', {
    nodeId: domRoot.nodeId,
    selector: '.page',
  });

  const violations = [];
  for (let i = 0; i < pageNodeIds.length; i++) {
    // CSS.getPlatformFontsForNode は指定ノード自身の直接のテキストしか
    // 集計しない（実測で確認済み）。.page はテキストを持たない純粋な
    // コンテナ要素なので、配下の全要素を個別に走査する必要がある。
    const { nodeIds: descendantIds } = await cdp.send('DOM.querySelectorAll', {
      nodeId: pageNodeIds[i],
      selector: '*',
    });
    const bad = new Map();
    for (const nodeId of descendantIds) {
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      for (const f of fonts) {
        if (!isAllowedFont(f.familyName)) {
          bad.set(f.familyName, (bad.get(f.familyName) ?? 0) + f.glyphCount);
        }
      }
    }
    if (bad.size > 0) {
      violations.push(
        `p.${i + 1}: ${[...bad.entries()].map(([name, count]) => `${name}(${count}字)`).join(', ')}`,
      );
    }
  }
  if (violations.length > 0) {
    throw new Error(
      `許可リスト外のフォントへのフォールバックを検出しました。macOS以外で実行していないか確認してください。\n` +
        violations.join('\n'),
    );
  }
}

async function assertLayout(page) {
  const result = await page.evaluate(
    ({ widthMm, heightMm, tolerance }) => {
      const mmToPx = (mm) => (mm * 96) / 25.4;
      const pages = Array.from(document.querySelectorAll('.page'));
      const violations = [];
      pages.forEach((p, i) => {
        const rect = p.getBoundingClientRect();
        const widthDiff = Math.abs(rect.width - mmToPx(widthMm));
        if (widthDiff > mmToPx(tolerance)) {
          violations.push(`p.${i + 1}: 幅 ${rect.width.toFixed(1)}px (期待 ${mmToPx(widthMm).toFixed(1)}px)`);
        }
        if (rect.height > mmToPx(heightMm) + mmToPx(tolerance)) {
          violations.push(`p.${i + 1}: 高さ ${rect.height.toFixed(1)}px が上限 ${mmToPx(heightMm).toFixed(1)}px を超過`);
        }
        if (p.scrollHeight > p.clientHeight + 1) {
          violations.push(`p.${i + 1}: オーバーフロー (scrollHeight ${p.scrollHeight} > clientHeight ${p.clientHeight})`);
        }
      });
      return { count: pages.length, violations };
    },
    { widthMm: PAGE_WIDTH_MM, heightMm: PAGE_HEIGHT_MM, tolerance: MM_TOLERANCE },
  );

  if (result.count !== EXPECTED_PAGE_COUNT) {
    throw new Error(`.page の数が ${result.count} 件でした（期待 ${EXPECTED_PAGE_COUNT} 件）`);
  }
  if (result.violations.length > 0) {
    throw new Error(`レイアウト検証に失敗しました:\n${result.violations.join('\n')}`);
  }
  console.log(`  pages: ${result.count} / overflow: 0`);
}

async function assertOutputPdf(bytes) {
  // page.pdf() の出力は暗号化されないため現状は no-op。pdf-lib は既定で
  // 暗号化PDFの読み込みを拒否するため、将来の変更に備えた保険として残す。
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = doc.getPageCount();
  if (pageCount !== EXPECTED_PAGE_COUNT) {
    throw new Error(`生成PDFのページ数が ${pageCount} でした（期待 ${EXPECTED_PAGE_COUNT}）`);
  }
  const { width, height } = doc.getPage(0).getSize();
  if (Math.abs(width - PAGE_WIDTH_PT) > PT_TOLERANCE || Math.abs(height - PAGE_HEIGHT_PT) > PT_TOLERANCE) {
    throw new Error(
      `生成PDFの用紙サイズが ${width.toFixed(2)} x ${height.toFixed(2)} pt でした` +
        `（期待 ${PAGE_WIDTH_PT} x ${PAGE_HEIGHT_PT} pt 前後）`,
    );
  }
}

async function writeManifest(pdfBytes) {
  const html = await readFile(deckPath);
  const deckHash = createHash('sha256').update(html).digest('hex');
  const pdfHash = createHash('sha256').update(pdfBytes).digest('hex');
  await writeFile(outHashPath, `deck_sha256=${deckHash}\npdf_sha256=${pdfHash}\n`);
  return { deckHash, pdfHash };
}

async function main() {
  assertDeckExists();
  await mkdir(outDir, { recursive: true });

  const pkg = JSON.parse(await readFile(new URL('node_modules/playwright/package.json', root)));
  console.log(`playwright ${pkg.version}`);

  const browser = await chromium.launch();
  console.log(`chromium executablePath: ${chromium.executablePath()}`);

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'light',
    });
    const page = await context.newPage();

    await page.emulateMedia({ media: 'print', colorScheme: 'light' });
    await page.goto(deckPath.href, {
      waitUntil: 'networkidle',
      timeout: 60_000,
    });

    const loadedFonts = await waitForFontsStable(page);
    console.log(`  fonts loaded: ${loadedFonts}`);

    await assertLayout(page);
    await assertPlatformFonts(page);

    const bytes = await page.pdf({
      format: 'A4',
      landscape: true,
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      scale: 1,
    });

    await assertOutputPdf(bytes);
    await writeFile(outPdfPath, bytes);

    const { deckHash, pdfHash } = await writeManifest(bytes);
    console.log(`  deck sha256: ${deckHash}`);
    console.log(`  pdf  sha256: ${pdfHash}`);
    console.log(`PDF出力: ${outPdfPath.pathname}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});

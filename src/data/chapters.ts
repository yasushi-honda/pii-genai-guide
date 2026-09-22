export interface Chapter {
  num: string;
  id: string;
  kicker: string;
  title: string;
  tocSubtitle: string;
}

export const chapters: Chapter[] = [
  {
    num: '00',
    id: 'ch00',
    kicker: '00 はじめに',
    title: '「ISMAPを満たしているから安全」——それ、半分しか合っていません',
    tocSubtitle: 'なぜこの整理が必要か',
  },
  {
    num: '01',
    id: 'ch01',
    kicker: '01 大原則',
    title: '「安全に守る」義務と「そもそも使ってよいか」の義務は、独立している',
    tocSubtitle: '安全管理措置と、適法な取得・利用は独立している',
  },
  {
    num: '02',
    id: 'ch02',
    kicker: '02 判定フロー',
    title: '3つの質問で、入れていいレベルが決まる',
    tocSubtitle: '個人特定情報／要配慮個人情報／処理体制の3段階判定',
  },
  {
    num: '03',
    id: 'ch03',
    kicker: '03 越境移転規制（法28条）',
    title: '「日本国内処理」が必要になる理由 — 個人情報保護法28条',
    tocSubtitle: '「日本国内処理」が必要になる法的根拠',
  },
  {
    num: '04',
    id: 'ch04',
    kicker: '04 ISMAP登録の落とし穴',
    title: '「基盤の登録」は「上位サービス」に自動継承されない',
    tocSubtitle: '「登録済み」が自動的に意味しないもの',
  },
  {
    num: '05',
    id: 'ch05',
    kicker: '05 実名データの3段階',
    title: 'Tier A / B / C — 右に行くほど要件が跳ね上がる',
    tocSubtitle: '用途別に必要な技術要件を切り分ける',
  },
  {
    num: '06',
    id: 'ch06',
    kicker: '06 よくある間違いと正しい対応',
    title: '同じ「Gemini in Workspace」でも、使い方で明暗が分かれる',
    tocSubtitle: 'NG例・OK例で確認する、現場で起きがちなずれ',
  },
  {
    num: '07',
    id: 'ch07',
    kicker: '07 Tier Cの技術構成',
    title: '要配慮個人情報を実名で扱う場合の、現実的な最適構成',
    tocSubtitle: '要配慮個人情報のための現実的なアーキテクチャ',
  },
  {
    num: '08',
    id: 'ch08',
    kicker: '08 技術を固めても残るもの',
    title: '4つの軸——積み上げれば完了するもの、しないもの',
    tocSubtitle: '積み上げれば完了する軸と、終わりのない軸の違い',
  },
  {
    num: '09',
    id: 'ch09',
    kicker: '09 まとめ',
    title: '今日からできること、正直まだできないこと',
    tocSubtitle: 'できること・まだできないこと・準備すべきこと',
  },
  {
    num: '—',
    id: 'references',
    kicker: '出典一覧',
    title: 'すべて公式ドキュメント・公式ポータルで直接確認',
    tocSubtitle: '本文中の番号に対応する公式情報源、14件',
  },
];

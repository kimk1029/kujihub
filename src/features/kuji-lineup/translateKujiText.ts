const WEEKDAY_MAP: Record<string, string> = {
  '月': '월',
  '火': '화',
  '水': '수',
  '木': '목',
  '金': '금',
  '土': '토',
  '日': '일',
};

const COMMON_REPLACEMENTS: Array<[RegExp, string]> = [
  [/一番くじちょこっと/g, '이치방쿠지 쵸콧토'],
  [/一番くじ/g, '이치방쿠지'],
  [/倶楽部/g, '클럽'],
  [/取扱店/g, '취급 매장'],
  [/販売開始/g, '판매 시작'],
  [/店頭販売/g, '매장 판매'],
  [/オンライン販売/g, '온라인 판매'],
  [/オンライン限定/g, '온라인 한정'],
  [/なくなり次第終了/g, '재고 소진 시 종료'],
  [/数量限定/g, '수량 한정'],
  [/各等賞/g, '각 등 상'],
  [/税込/g, '세금 포함'],
  [/未定/g, '미정'],
  [/より順次発売予定/g, '부터 순차 발매 예정'],
  [/順次発売予定/g, '순차 발매 예정'],
  [/発売予定/g, '발매 예정'],
  [/発売/g, '발매'],
  [/登場/g, '등장'],
  [/予定/g, '예정'],
  [/ラストワン賞/g, '라스트원 상'],
  [/ダブルチャンス賞/g, '더블찬스 상'],
  [/ダブルチャンスキャンペーン/g, '더블찬스 캠페인'],
  [/ダブルチャンス/g, '더블찬스'],
  [/A賞/g, 'A상'],
  [/B賞/g, 'B상'],
  [/C賞/g, 'C상'],
  [/D賞/g, 'D상'],
  [/E賞/g, 'E상'],
  [/F賞/g, 'F상'],
  [/G賞/g, 'G상'],
  [/H賞/g, 'H상'],
  [/I賞/g, 'I상'],
  [/J賞/g, 'J상'],
  [/フィギュア/g, '피규어'],
  [/ぬいぐるみ/g, '봉제인형'],
  [/ぬいぐるみマスコット/g, '봉제인형 마스코트'],
  [/アクリルスタンド/g, '아크릴 스탠드'],
  [/アクリルチャーム/g, '아크릴 참'],
  [/アクリル/g, '아크릴'],
  [/クリアファイル/g, '클리어파일'],
  [/グラス/g, '글라스'],
  [/プレート/g, '플레이트'],
  [/ラバーチャーム/g, '러버 참'],
  [/ラバーストラップ/g, '러버 스트랩'],
  [/タオル/g, '타월'],
  [/ポスター/g, '포스터'],
  [/ラバー/g, '러버'],
  [/キーホルダー/g, '키홀더'],
  [/マスコット/g, '마스코트'],
  [/クッション/g, '쿠션'],
  [/タペストリー/g, '태피스트리'],
  [/ステッカー/g, '스티커'],
  [/コレクション/g, '컬렉션'],
  [/オンライン/g, '온라인'],
  [/限定/g, '한정'],
  [/先行/g, '선행'],
];

const TITLE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/鬼滅の刃/g, '귀멸의 칼날'],
  [/呪術廻戦/g, '주술회전'],
  [/ドラゴンボール/g, '드래곤볼'],
  [/ワンピース/g, '원피스'],
  [/進撃の巨人/g, '진격의 거인'],
  [/僕のヒーローアカデミア/g, '나의 히어로 아카데미아'],
  [/ハイキュー!!?/g, '하이큐!!'],
  [/ブルーロック/g, '블루 록'],
  [/ちいかわ/g, '치이카와'],
  [/ポケットモンスター/g, '포켓몬스터'],
  [/Pokémon/g, '포켓몬'],
  [/機動戦士ガンダム/g, '기동전사 건담'],
  [/初音ミク/g, '하츠네 미쿠'],
  [/hololive/g, '홀로라이브'],
  [/HUNTER×HUNTER/g, '헌터×헌터'],
  [/NARUTO/g, '나루토'],
  [/銀魂/g, '은혼'],
  [/たまごっち/g, '다마고치'],
  [/星のカービィ/g, '별의 커비'],
  [/サンリオキャラクターズ/g, '산리오 캐릭터즈'],
  [/すみっコぐらし/g, '스밋코구라시'],
  [/らんま1\/2/g, '란마 1/2'],
  [/名探偵コナン/g, '명탐정 코난'],
  [/リコリス・リコイル/g, '리코리스 리코일'],
  [/東京リベンジャーズ/g, '도쿄 리벤저스'],
  [/エヴァンゲリオン/g, '에반게리온'],
  [/魔法少女まどか☆マギカ/g, '마법소녀 마도카 마기카'],
];

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function applyReplacements(text: string, replacements: Array<[RegExp, string]>): string {
  return replacements.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text);
}

export function translateKujiTitle(title: string): string {
  const normalized = normalizeWhitespace(title);
  return applyReplacements(applyReplacements(normalized, TITLE_REPLACEMENTS), COMMON_REPLACEMENTS);
}

export function translateReleaseLabel(label: string): string {
  const normalized = normalizeWhitespace(label);
  const withDate = normalized.replace(
    /(\d{4})年0?(\d{1,2})月0?(\d{1,2})日\(([月火水木金土日])\)/g,
    (_, year, month, day, weekday) => `${year}년 ${Number(month)}월 ${Number(day)}일(${WEEKDAY_MAP[weekday] ?? weekday})`,
  );

  return applyReplacements(withDate, COMMON_REPLACEMENTS);
}

export function buildOriginalLabel(label: string): string | undefined {
  const normalized = normalizeWhitespace(label);
  return normalized ? `원문 일정: ${normalized}` : undefined;
}

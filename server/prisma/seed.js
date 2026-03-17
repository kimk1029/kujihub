const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KUJIS = [
  {
    title: '원피스 - 새로운 시대의 서막',
    description: 'A상 루피 피규어 포함 80종의 풍부한 라인업',
    price: 12000,
    boardSize: 80,
    status: 'active',
    prizes: [
      { grade: 'A', name: '킹 오브 아티스트 루피',   color: '#FFD700', chance: 0.04, displayOrder: 1 },
      { grade: 'B', name: '배틀 레코드 조로',         color: '#C0C0C0', chance: 0.12, displayOrder: 2 },
      { grade: 'C', name: '컬렉션 비주얼 보드',       color: '#FF3B30', chance: 0.34, displayOrder: 3 },
      { grade: 'D', name: '러버 코스터',              color: '#4A90E2', chance: 0.64, displayOrder: 4 },
      { grade: 'E', name: '클리어 파일 세트',         color: '#718096', chance: 1.00, displayOrder: 5 },
    ],
  },
  {
    title: '드래곤볼 EX - 천하제일무술대회',
    description: 'B상 무천도사 피규어 절찬 판매중',
    price: 13000,
    boardSize: 80,
    status: 'active',
    prizes: [
      { grade: 'A', name: '드래곤볼 슈퍼 피규어',     color: '#FFD700', chance: 0.04, displayOrder: 1 },
      { grade: 'B', name: '무천도사 피규어',           color: '#C0C0C0', chance: 0.12, displayOrder: 2 },
      { grade: 'C', name: '배틀 씬 아크릴',           color: '#FF3B30', chance: 0.34, displayOrder: 3 },
      { grade: 'D', name: '캐릭터 뱃지 세트',         color: '#4A90E2', chance: 0.64, displayOrder: 4 },
      { grade: 'E', name: '클리어 파일',              color: '#718096', chance: 1.00, displayOrder: 5 },
    ],
  },
  {
    title: '스파이 패밀리 - Mission Complete',
    description: '아냐 피규어는 벌써 매진 임박!',
    price: 11000,
    boardSize: 80,
    status: 'active',
    prizes: [
      { grade: 'A', name: '아냐 특제 피규어',          color: '#FFD700', chance: 0.04, displayOrder: 1 },
      { grade: 'B', name: '로이드 포저 피규어',        color: '#C0C0C0', chance: 0.12, displayOrder: 2 },
      { grade: 'C', name: '요르 포저 아크릴',          color: '#FF3B30', chance: 0.34, displayOrder: 3 },
      { grade: 'D', name: '스파이 패밀리 뱃지',        color: '#4A90E2', chance: 0.64, displayOrder: 4 },
      { grade: 'E', name: '미션 파일 세트',            color: '#718096', chance: 1.00, displayOrder: 5 },
    ],
  },
];

const COMMUNITY_POSTS = [
  {
    category: '정보',
    title: '홍대입구 근처 편의점에 이번 주 신상 쿠지 입고됐습니다',
    content: '오전 11시 기준으로 재고 확인했습니다.\n원피스 라인업이 먼저 들어왔고, 계산대 옆 진열대로 빠져 있습니다.\n혹시 방문하실 분은 오후 전에 가는 편이 좋아 보입니다.',
    author: 'kuji_scout',
  },
  {
    category: '후기',
    title: '오늘 뽑은 드래곤볼 EX 결과 공유합니다',
    content: '총 8회 뽑았고 B상 1개, D상 2개 나왔습니다.\n생각보다 하위상 퀄리티도 괜찮았고, 뱃지 세트 만족도가 높았습니다.',
    author: '손오공덕후',
  },
  {
    category: '질문',
    title: '일본 온라인 한정 쿠지 배송대행 써보신 분 있나요?',
    content: '처음 이용해보려고 하는데 관세나 합배송 이슈가 궁금합니다.\n실제 주문해보신 분 있으면 추천 업체와 주의점 부탁드립니다.',
    author: '익명',
  },
  {
    category: '정보',
    title: '이번 달 발매 일정 중 온라인 판매 먼저 열리는 것 정리',
    content: '라인업 캘린더 기준으로 온라인 판매가 빠른 상품만 모아봤습니다.\n원피스, 치이카와, 하이큐 쪽이 초반에 몰려 있습니다.',
    author: 'calendar_lab',
  },
];

const COMMUNITY_FEED = [
  {
    type: 'system_notice',
    source: 'system',
    title: '실시간 피드가 활성화되었습니다',
    body: '새 게시글 등록, 수정, 삭제 이벤트가 이 영역에 순서대로 기록됩니다.',
    author: 'KujiHub',
    link: '/community',
  },
  {
    type: 'lineup_alert',
    source: 'lineup',
    title: '이번 주 발매 일정 업데이트',
    body: '라인업 캘린더가 최신 발매 정보로 새로고침되었습니다.',
    author: 'KujiHub',
    link: '/',
  },
];

async function main() {
  console.log('🌱 시드 데이터 삽입 시작...');

  for (const kujiData of KUJIS) {
    const { prizes, ...kujiFields } = kujiData;

    const existing = await prisma.kuji.findFirst({ where: { title: kujiFields.title } });
    if (existing) {
      console.log(`  ⏭  이미 존재: ${kujiFields.title}`);
      continue;
    }

    const kuji = await prisma.kuji.create({
      data: {
        ...kujiFields,
        prizes: { create: prizes },
      },
    });
    console.log(`  ✅ 생성: [${kuji.id}] ${kuji.title}`);
  }

  for (const postData of COMMUNITY_POSTS) {
    const existing = await prisma.communityPost.findFirst({
      where: {
        title: postData.title,
        author: postData.author,
      },
    });

    if (existing) {
      console.log(`  ⏭  이미 존재: ${postData.title}`);
      continue;
    }

    const created = await prisma.communityPost.create({ data: postData });
    console.log(`  ✅ 게시글 생성: [${created.id}] ${created.title}`);

    await prisma.communityFeedItem.create({
      data: {
        type: 'post_created',
        source: 'community',
        title: created.title,
        body: `${created.author}님이 새 글을 등록했습니다.`,
        author: created.author,
        link: `/community/${created.id}`,
        postId: created.id,
      },
    });
  }

  for (const feedData of COMMUNITY_FEED) {
    const existing = await prisma.communityFeedItem.findFirst({
      where: {
        type: feedData.type,
        title: feedData.title,
      },
    });

    if (existing) {
      console.log(`  ⏭  이미 존재: ${feedData.title}`);
      continue;
    }

    const created = await prisma.communityFeedItem.create({ data: feedData });
    console.log(`  ✅ 피드 생성: [${created.id}] ${created.title}`);
  }

  console.log('🌱 시드 완료!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

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

  console.log('🌱 시드 완료!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

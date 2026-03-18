const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const player = await prisma.kujiPlayer.upsert({
      where: { id: "test_id_123" },
      update: { nickname: "Test" },
      create: {
        id: "test_id_123",
        nickname: "Test",
        points: 100000,
      },
    });
    console.log(player);
  } catch (e) {
    console.error(e);
  }
}
test();

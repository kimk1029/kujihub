/**
 * 쿠지 API 라우터 (Prisma ORM)
 * 마운트 위치: /api/kujis
 *
 * GET  /              쿠지 목록 (잔여 슬롯 포함)
 * GET  /:id           쿠지 상세 (prizes + 잔여 슬롯)
 * GET  /:id/board     뽑기판 슬롯 상태 조회
 * POST /:id/reserve   슬롯 예약 (locked) + 등급 결정
 * POST /:id/complete  결과 확인 완료 → drawn
 */

const { Router } = require('express');
const prisma = require('./db');

const router = Router();
const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2분

function lockExpiry() {
  return new Date(Date.now() - LOCK_TIMEOUT_MS);
}

// ── 목록 ──────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const kujis = await prisma.kuji.findMany({
      where: { NOT: { status: 'draft' } },
      include: {
        _count: {
          select: { slots: { where: { status: 'drawn' } } },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json(kujis.map((k) => ({
      id: String(k.id),
      title: k.title,
      description: k.description,
      imageUrl: k.imageUrl,
      price: k.price,
      boardSize: k.boardSize,
      status: k.status,
      remaining: k.boardSize - k._count.slots,
    })));
  } catch (e) {
    console.error('[kuji list]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── 상세 ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    const kuji = await prisma.kuji.findUnique({
      where: { id },
      include: {
        prizes: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { slots: { where: { status: 'drawn' } } } },
      },
    });

    if (!kuji) return res.status(404).json({ error: 'Not found' });

    res.json({
      id: String(kuji.id),
      title: kuji.title,
      description: kuji.description,
      imageUrl: kuji.imageUrl,
      price: kuji.price,
      boardSize: kuji.boardSize,
      status: kuji.status,
      remaining: kuji.boardSize - kuji._count.slots,
      prizes: kuji.prizes.map((p) => ({
        id: String(p.id),
        grade: p.grade,
        name: p.name,
        color: p.color,
        chance: p.chance,
        displayOrder: p.displayOrder,
      })),
    });
  } catch (e) {
    console.error('[kuji detail]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── 보드 상태 조회 ─────────────────────────────────────────────
router.get('/:id/board', async (req, res) => {
  const kujiId = Number(req.params.id);
  if (!kujiId) return res.status(400).json({ error: 'invalid id' });

  try {
    const rows = await prisma.kujiSlot.findMany({
      where: {
        kujiId,
        OR: [
          { status: 'drawn' },
          { status: 'locked', lockedAt: { gt: lockExpiry() } },
        ],
      },
      select: { slotNumber: true, status: true, grade: true, gradeName: true, gradeColor: true },
    });

    const slots = {};
    for (const r of rows) {
      if (r.status === 'drawn') {
        slots[r.slotNumber] = { status: 'drawn', grade: r.grade, name: r.gradeName, color: r.gradeColor };
      } else {
        slots[r.slotNumber] = { status: 'locked' };
      }
    }

    res.json({ kujiId: String(kujiId), slots });
  } catch (e) {
    console.error('[board]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── 슬롯 예약 ─────────────────────────────────────────────────
router.post('/:id/reserve', async (req, res) => {
  const kujiId = Number(req.params.id);
  if (!kujiId) return res.status(400).json({ error: 'invalid id' });

  const { slots, userId } = req.body || {};
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'slots array required' });
  }

  try {
    const results = await prisma.$transaction(async (tx) => {
      // 만료된 잠금 해제
      await tx.kujiSlot.deleteMany({
        where: { kujiId, status: 'locked', lockedAt: { lte: lockExpiry() } },
      });

      // 이미 사용 중인 슬롯 확인
      const existing = await tx.kujiSlot.findMany({
        where: { kujiId, slotNumber: { in: slots } },
        select: { slotNumber: true, status: true },
      });

      if (existing.length > 0) {
        const err = new Error('SLOT_TAKEN');
        err.slot = existing[0].slotNumber;
        err.status = existing[0].status;
        throw err;
      }

      // 이 쿠지의 등급/확률 정보
      const prizes = await tx.kujiPrize.findMany({
        where: { kujiId },
        orderBy: { chance: 'asc' },
      });

      if (!prizes.length) throw new Error('NO_PRIZES');

      // 슬롯별 등급 결정 후 일괄 insert
      const now = new Date();
      const slotData = slots.map((slot) => {
        const r = Math.random();
        const prize = prizes.find((p) => r <= p.chance) ?? prizes[prizes.length - 1];
        return { kujiId, slotNumber: slot, status: 'locked', grade: prize.grade, gradeName: prize.name, gradeColor: prize.color, lockedAt: now, lockedUserId: userId ?? null };
      });

      await tx.kujiSlot.createMany({ data: slotData });

      return slotData.map((s) => ({ slot: s.slotNumber, grade: s.grade, name: s.gradeName, color: s.gradeColor }));
    });

    res.json({ results });
  } catch (e) {
    if (e.message === 'SLOT_TAKEN') {
      return res.status(409).json({ error: 'slot_taken', slot: e.slot, status: e.status });
    }
    if (e.message === 'NO_PRIZES') {
      return res.status(400).json({ error: 'no prizes configured for this kuji' });
    }
    console.error('[reserve]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── 결과 확인 완료 → drawn ──────────────────────────────────────
router.post('/:id/complete', async (req, res) => {
  const kujiId = Number(req.params.id);
  if (!kujiId) return res.status(400).json({ error: 'invalid id' });

  const { slots } = req.body || {};
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'slots array required' });
  }

  try {
    await prisma.kujiSlot.updateMany({
      where: { kujiId, slotNumber: { in: slots }, status: 'locked' },
      data: { status: 'drawn', completedAt: new Date(), lockedAt: null, lockedUserId: null },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[complete]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;

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
const { fetchYouTubeSearch } = require('./youtube-search');

const router = Router();
const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2분
const DEFAULT_PLAYER_POINTS = 100000;

function lockExpiry() {
  return new Date(Date.now() - LOCK_TIMEOUT_MS);
}

function purchaseId() {
  return `kp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeNickname(value) {
  const text = String(value ?? '').trim();
  return text || '게스트';
}

function activeSlotWhere() {
  return {
    OR: [
      { status: 'drawn' },
      { status: 'locked', lockedAt: { gt: lockExpiry() } },
    ],
  };
}

function buildPrizeStats(prizes, boardSize, usedByGrade) {
  let previousChance = 0;
  let assignedTotal = 0;

  return prizes.map((prize, index) => {
    const bandChance = Math.max(prize.chance - previousChance, 0);
    previousChance = prize.chance;

    const rawTotal = boardSize * bandChance;
    let totalCount = index === prizes.length - 1
      ? Math.max(boardSize - assignedTotal, 0)
      : Math.max(Math.round(rawTotal), 0);

    assignedTotal += totalCount;

    const usedCount = usedByGrade.get(prize.grade) ?? 0;
    const remainingCount = Math.max(totalCount - usedCount, 0);

    return {
      id: String(prize.id),
      grade: prize.grade,
      name: prize.name,
      color: prize.color,
      chance: prize.chance,
      displayOrder: prize.displayOrder,
      totalCount,
      remainingCount,
      usedCount,
    };
  });
}

function mapPurchase(purchase) {
  return {
    id: purchase.id,
    kujiId: String(purchase.kujiId),
    playerId: purchase.playerId,
    quantity: purchase.quantity,
    totalPrice: purchase.totalPrice,
    status: purchase.status,
    selectedSlots: purchase.selectedSlots ?? [],
    results: purchase.resultJson ?? [],
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
  };
}

// ── 목록 ──────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    await prisma.kujiSlot.deleteMany({
      where: { status: 'locked', lockedAt: { lte: lockExpiry() } },
    });
    const kujis = await prisma.kuji.findMany({
      where: { NOT: { status: 'draft' } },
      include: {
        _count: {
          select: { slots: { where: activeSlotWhere() } },
        },
      },
      orderBy: { id: 'asc' },
    });

    const result = await Promise.all(kujis.map(async (k) => {
      let imageUrl = k.imageUrl;
      if (!imageUrl) {
        try {
          const yt = await fetchYouTubeSearch(k.title + ' 피규어', 1);
          if (yt && yt.items && yt.items.length > 0) {
            imageUrl = yt.items[0].thumbnail;
            // update db async so next time it's faster
            prisma.kuji.update({ where: { id: k.id }, data: { imageUrl } }).catch(() => {});
          }
        } catch (err) {
          console.error('[youtube search for kuji img failed]', err.message);
        }
      }
      return {
        id: String(k.id),
        title: k.title,
        description: k.description,
        imageUrl: imageUrl,
        price: k.price,
        boardSize: k.boardSize,
        status: k.status,
        remaining: k.boardSize - k._count.slots,
      };
    }));

    res.json(result);
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
    await prisma.kujiSlot.deleteMany({
      where: { kujiId: id, status: 'locked', lockedAt: { lte: lockExpiry() } },
    });
    const kuji = await prisma.kuji.findUnique({
      where: { id },
      include: {
        prizes: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { slots: { where: activeSlotWhere() } } },
      },
    });

    if (!kuji) return res.status(404).json({ error: 'Not found' });

    const activeSlots = await prisma.kujiSlot.findMany({
      where: {
        kujiId: id,
        ...activeSlotWhere(),
        grade: { not: null },
      },
      select: { grade: true },
    });

    const usedByGrade = new Map();
    for (const slot of activeSlots) {
      const grade = String(slot.grade || '').trim();
      if (!grade) continue;
      usedByGrade.set(grade, (usedByGrade.get(grade) ?? 0) + 1);
    }

    let imageUrl = kuji.imageUrl;
    if (!imageUrl) {
      try {
        const yt = await fetchYouTubeSearch(kuji.title + ' 피규어', 1);
        if (yt && yt.items && yt.items.length > 0) {
          imageUrl = yt.items[0].thumbnail;
          prisma.kuji.update({ where: { id: kuji.id }, data: { imageUrl } }).catch(() => {});
        }
      } catch (err) {
        console.error('[youtube search for kuji img failed]', err.message);
      }
    }

    res.json({
      id: String(kuji.id),
      title: kuji.title,
      description: kuji.description,
      imageUrl: imageUrl,
      price: kuji.price,
      boardSize: kuji.boardSize,
      status: kuji.status,
      remaining: kuji.boardSize - kuji._count.slots,
      prizes: buildPrizeStats(kuji.prizes, kuji.boardSize, usedByGrade),
    });
  } catch (e) {
    console.error('[kuji detail]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/player/ensure', async (req, res) => {
  const { playerId, nickname } = req.body || {};
  const id = String(playerId || '').trim();
  if (!id) return res.status(400).json({ error: 'playerId is required' });

  try {
    const player = await prisma.kujiPlayer.upsert({
      where: { id },
      update: { nickname: sanitizeNickname(nickname) },
      create: {
        id,
        nickname: sanitizeNickname(nickname),
        points: DEFAULT_PLAYER_POINTS,
      },
    });

    res.json({
      id: player.id,
      nickname: player.nickname,
      points: player.points,
      role: player.role,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    });
  } catch (e) {
    console.error('[player ensure]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/player/:id', async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    const player = await prisma.kujiPlayer.findUnique({ where: { id } });
    if (!player) return res.status(404).json({ error: 'Not found' });
    res.json({
      id: player.id,
      nickname: player.nickname,
      points: player.points,
      role: player.role,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    });
  } catch (e) {
    console.error('[player detail]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/:id/purchase', async (req, res) => {
  const kujiId = Number(req.params.id);
  const quantity = Number(req.body?.quantity || 0);
  const playerId = String(req.body?.playerId || '').trim();

  if (!kujiId) return res.status(400).json({ error: 'invalid id' });
  if (!playerId) return res.status(400).json({ error: 'playerId is required' });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return res.status(400).json({ error: 'quantity must be 1-10' });
  }

  try {
    const data = await prisma.$transaction(async (tx) => {
      await tx.kujiSlot.deleteMany({
        where: { kujiId, status: 'locked', lockedAt: { lte: lockExpiry() } },
      });

      const [kuji, player, usedCount] = await Promise.all([
        tx.kuji.findUnique({ where: { id: kujiId } }),
        tx.kujiPlayer.findUnique({ where: { id: playerId } }),
        tx.kujiSlot.count({ where: { kujiId, ...activeSlotWhere() } }),
      ]);

      if (!kuji) throw new Error('NOT_FOUND');
      if (!player) throw new Error('PLAYER_NOT_FOUND');
      if (kuji.status === 'sold_out' || kuji.status === 'draft') throw new Error('SOLD_OUT');

      const remaining = kuji.boardSize - usedCount;
      if (remaining < quantity) throw new Error('NOT_ENOUGH_SLOTS');

      const totalPrice = kuji.price * quantity;
      if (player.points < totalPrice) throw new Error('INSUFFICIENT_POINTS');

      const purchase = await tx.kujiPurchase.create({
        data: {
          id: purchaseId(),
          kujiId,
          playerId,
          quantity,
          totalPrice,
          status: 'pending',
        },
      });

      const updatedPlayer = await tx.kujiPlayer.update({
        where: { id: playerId },
        data: { points: { decrement: totalPrice } },
      });

      return { kuji, purchase, player: updatedPlayer, remaining: remaining - quantity };
    });

    res.status(201).json({
      purchase: mapPurchase(data.purchase),
      player: {
        id: data.player.id,
        nickname: data.player.nickname,
        points: data.player.points,
      },
      kuji: {
        id: String(data.kuji.id),
        title: data.kuji.title,
        price: data.kuji.price,
        remaining: data.remaining,
      },
    });
  } catch (e) {
    if (e.message === 'NOT_FOUND') return res.status(404).json({ error: 'Not found' });
    if (e.message === 'PLAYER_NOT_FOUND') return res.status(404).json({ error: 'player not found' });
    if (e.message === 'SOLD_OUT') return res.status(409).json({ error: 'sold_out' });
    if (e.message === 'NOT_ENOUGH_SLOTS') return res.status(409).json({ error: 'not_enough_slots' });
    if (e.message === 'INSUFFICIENT_POINTS') return res.status(409).json({ error: 'insufficient_points' });
    console.error('[purchase]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/:id/purchases/:purchaseId', async (req, res) => {
  const kujiId = Number(req.params.id);
  const purchaseIdValue = String(req.params.purchaseId || '').trim();
  if (!kujiId || !purchaseIdValue) return res.status(400).json({ error: 'invalid params' });

  try {
    const purchase = await prisma.kujiPurchase.findFirst({
      where: { id: purchaseIdValue, kujiId },
    });
    if (!purchase) return res.status(404).json({ error: 'Not found' });
    res.json(mapPurchase(purchase));
  } catch (e) {
    console.error('[purchase detail]', e.message);
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

  const { slots, userId, purchaseId: purchaseIdValue } = req.body || {};
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'slots array required' });
  }
  if (!userId || !purchaseIdValue) {
    return res.status(400).json({ error: 'userId and purchaseId are required' });
  }

  try {
    const results = await prisma.$transaction(async (tx) => {
      // 만료된 잠금 해제
      await tx.kujiSlot.deleteMany({
        where: { kujiId, status: 'locked', lockedAt: { lte: lockExpiry() } },
      });

      const purchase = await tx.kujiPurchase.findFirst({
        where: { id: purchaseIdValue, kujiId, playerId: String(userId), status: 'pending' },
      });
      if (!purchase) throw new Error('PURCHASE_NOT_FOUND');
      if (purchase.quantity !== slots.length) throw new Error('INVALID_SLOT_COUNT');

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

      await tx.kujiPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'reserved',
          selectedSlots: slots,
          resultJson: slotData.map((s) => ({
            slotNumber: s.slotNumber,
            grade: s.grade,
            name: s.gradeName,
            color: s.gradeColor,
          })),
        },
      });

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
    if (e.message === 'PURCHASE_NOT_FOUND') {
      return res.status(404).json({ error: 'purchase_not_found' });
    }
    if (e.message === 'INVALID_SLOT_COUNT') {
      return res.status(400).json({ error: 'invalid_slot_count' });
    }
    console.error('[reserve]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

// ── 결과 확인 완료 → drawn ──────────────────────────────────────
router.post('/:id/complete', async (req, res) => {
  const kujiId = Number(req.params.id);
  if (!kujiId) return res.status(400).json({ error: 'invalid id' });

  const { slots, purchaseId: purchaseIdValue } = req.body || {};
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'slots array required' });
  }
  if (!purchaseIdValue) return res.status(400).json({ error: 'purchaseId is required' });

  try {
    const resultJson = await prisma.$transaction(async (tx) => {
      await tx.kujiSlot.updateMany({
        where: { kujiId, slotNumber: { in: slots }, status: 'locked' },
        data: { status: 'drawn', completedAt: new Date(), lockedAt: null, lockedUserId: null },
      });

      const purchase = await tx.kujiPurchase.findFirst({
        where: { id: String(purchaseIdValue), kujiId },
      });
      if (!purchase) throw new Error('PURCHASE_NOT_FOUND');

      await tx.kujiPurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
        },
      });

      return purchase.resultJson ?? [];
    });

    res.json({ ok: true, results: resultJson });
  } catch (e) {
    if (e.message === 'PURCHASE_NOT_FOUND') return res.status(404).json({ error: 'purchase_not_found' });
    console.error('[complete]', e.message);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;

/**
 * 커스텀 쿠지 라인업 CRUD
 * 이치방쿠지 외 브랜드(くじ引き堂, BANDAI 등)의 일정을 사용자가 직접 등록
 */

const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = Router();

// 지원하는 쿠지 브랜드 목록
const KNOWN_BRANDS = [
  '이치방쿠지',
  'くじ引き堂',
  'BANDAI SPIRITS',
  'SEGA LUCKY LOT',
  'アミューズ',
  'タイトー',
  'フリュー',
  '기타',
];

// GET /api/lineup-custom?year=&month=
router.get('/', async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

  try {
    const entries = await prisma.lineupCustomEntry.findMany({
      where: { year, month },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ year, month, items: entries, brands: KNOWN_BRANDS });
  } catch (e) {
    console.error('lineup-custom GET:', e.message);
    res.status(500).json({ error: 'DB error', message: e.message });
  }
});

// POST /api/lineup-custom
router.post('/', async (req, res) => {
  const {
    brand,
    title,
    imageUrl,
    storeDate,
    onlineDate,
    url,
    submittedBy,
    year,
    month,
  } = req.body;

  if (!title || !year || !month) {
    return res.status(400).json({ error: 'title, year, month are required' });
  }
  if (month < 1 || month > 12) {
    return res.status(400).json({ error: 'month must be 1-12' });
  }

  try {
    const entry = await prisma.lineupCustomEntry.create({
      data: {
        brand: (brand || '기타').trim(),
        title: title.trim(),
        imageUrl: imageUrl || null,
        storeDate: storeDate || null,
        onlineDate: onlineDate || null,
        url: url || null,
        submittedBy: submittedBy || null,
        year: Number(year),
        month: Number(month),
      },
    });
    res.status(201).json(entry);
  } catch (e) {
    console.error('lineup-custom POST:', e.message);
    res.status(500).json({ error: 'DB error', message: e.message });
  }
});

// DELETE /api/lineup-custom/:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    await prisma.lineupCustomEntry.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'not found' });
    console.error('lineup-custom DELETE:', e.message);
    res.status(500).json({ error: 'DB error', message: e.message });
  }
});

module.exports = { router, KNOWN_BRANDS };

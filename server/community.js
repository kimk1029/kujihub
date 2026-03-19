const { Router } = require('express');
const prisma = require('./db');
const { verifyWebAuthToken } = require('./auth-web');

const router = Router();
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 60;

function parseLimit(value, fallback = DEFAULT_LIMIT) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!parsed || parsed < 1) return fallback;
  return Math.min(parsed, MAX_LIMIT);
}

function getBearerToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader.startsWith('Bearer ')) {
    return '';
  }
  return authHeader.slice('Bearer '.length).trim();
}

function requireWebAuth(req, res, next) {
  try {
    req.webAuth = verifyWebAuthToken(getBearerToken(req));
    next();
  } catch (error) {
    return res.status(401).json({ error: 'AUTH_REQUIRED' });
  }
}

function getAuthedAuthor(req) {
  return String(req.webAuth?.user?.name || '').trim() || '익명';
}

function canManagePost(req, post) {
  return post.author === getAuthedAuthor(req);
}

function mapPost(post) {
  return {
    id: post.id,
    category: post.category,
    isNotice: post.isNotice,
    title: post.title,
    content: post.content,
    author: post.author,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

function mapFeedItem(item) {
  return {
    id: item.id,
    type: item.type,
    source: item.source,
    title: item.title,
    body: item.body,
    author: item.author,
    link: item.link,
    postId: item.postId,
    createdAt: item.createdAt.toISOString(),
  };
}

async function createFeedItem(tx, data) {
  return tx.communityFeedItem.create({
    data: {
      type: data.type,
      source: data.source ?? 'community',
      title: data.title,
      body: data.body,
      author: data.author ?? null,
      link: data.link ?? null,
      postId: data.postId ?? null,
    },
  });
}

router.get('/posts', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const posts = await prisma.communityPost.findMany({
      orderBy: [{ isNotice: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
    res.json(posts.map(mapPost));
  } catch (error) {
    console.error('[community posts]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: 'Not found' });
    res.json(mapPost(post));
  } catch (error) {
    console.error('[community post detail]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/posts/:id/comments', async (req, res) => {
  const postId = Number(req.params.id);
  if (!postId) return res.status(400).json({ error: 'invalid id' });
  try {
    const comments = await prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    console.error('[community comments]', error.message);
    // If table doesn't exist yet, return empty array safely
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      return res.json([]);
    }
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/posts/:id/comments', requireWebAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (!postId) return res.status(400).json({ error: 'invalid id' });
  
  const { content } = req.body || {};
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'content is required' });
  }
  
  try {
    const comment = await prisma.communityComment.create({
      data: {
        postId,
        author: getAuthedAuthor(req),
        content: String(content).trim(),
      },
    });
    res.status(201).json(comment);
  } catch (error) {
    console.error('[create comment]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.post('/posts', requireWebAuth, async (req, res) => {
  const { title, content = '', category = '자유', isNotice = false } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const author = getAuthedAuthor(req);
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.communityPost.create({
        data: {
          title: String(title).trim(),
          content: String(content ?? '').trim(),
          author: String(author ?? '익명').trim() || '익명',
          category: String(category ?? '자유').trim() || '자유',
          isNotice: Boolean(isNotice),
        },
      });

      await createFeedItem(tx, {
        type: 'post_created',
        title: created.title,
        body: `${created.author}님이 새 글을 등록했습니다.`,
        author: created.author,
        link: `/community/${created.id}`,
        postId: created.id,
      });

      return created;
    });

    res.status(201).json(mapPost(post));
  } catch (error) {
    console.error('[community post create]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.put('/posts/:id', requireWebAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  const { title, content, category, isNotice } = req.body || {};

  try {
    const existing = await prisma.communityPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (!canManagePost(req, existing)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const post = await tx.communityPost.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title: String(title).trim() } : {}),
          ...(content !== undefined ? { content: String(content).trim() } : {}),
          ...(category !== undefined ? { category: String(category).trim() || '자유' } : {}),
          ...(isNotice !== undefined ? { isNotice: Boolean(isNotice) } : {}),
        },
      });

      await createFeedItem(tx, {
        type: 'post_updated',
        title: post.title,
        body: `${post.author}님이 게시글을 수정했습니다.`,
        author: post.author,
        link: `/community/${post.id}`,
        postId: post.id,
      });

      return post;
    });

    res.json(mapPost(updated));
  } catch (error) {
    console.error('[community post update]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.delete('/posts/:id', requireWebAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });

  try {
    const existing = await prisma.communityPost.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (!canManagePost(req, existing)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    await prisma.$transaction(async (tx) => {
      await createFeedItem(tx, {
        type: 'post_deleted',
        title: existing.title,
        body: `${existing.author}님이 게시글을 삭제했습니다.`,
        author: existing.author,
        link: null,
        postId: existing.id,
      });

      await tx.communityPost.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error) {
    console.error('[community post delete]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/feed', async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 30);
    const items = await prisma.communityFeedItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(items.map(mapFeedItem));
  } catch (error) {
    console.error('[community feed]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const postsLimit = parseLimit(req.query.postsLimit, 8);
    const feedLimit = parseLimit(req.query.feedLimit, 20);

    const [posts, feed, postCount] = await Promise.all([
      prisma.communityPost.findMany({
        orderBy: [{ isNotice: 'desc' }, { createdAt: 'desc' }],
        take: postsLimit,
      }),
      prisma.communityFeedItem.findMany({
        orderBy: { createdAt: 'desc' },
        take: feedLimit,
      }),
      prisma.communityPost.count(),
    ]);

    res.json({
      posts: posts.map(mapPost),
      feed: feed.map(mapFeedItem),
      stats: {
        postCount,
        feedCount: feed.length,
        latestPostAt: posts[0]?.createdAt?.toISOString() ?? null,
        latestFeedAt: feed[0]?.createdAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('[community overview]', error.message);
    res.status(500).json({ error: 'DB error' });
  }
});

module.exports = router;

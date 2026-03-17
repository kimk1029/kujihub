import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { communityApi } from '../api/community';

export function CommunityPostFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editId = id ? Number(id) : null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('익명');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const post = await communityApi.getOne(editId);
        if (!cancelled) {
          setTitle(post.title);
          setContent(post.content);
          setAuthor(post.author);
        }
      } catch {
        if (!cancelled) setFetching(false);
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const t = title.trim();
      if (!t) return;
      setLoading(true);
      try {
        if (editId) {
          await communityApi.update(editId, {
            title: t,
            content: content.trim(),
            author: author.trim(),
          });
        } else {
          await communityApi.create({
            title: t,
            content: content.trim(),
            author: author.trim() || '익명',
          });
        }
        navigate('/community');
      } catch {
        setLoading(false);
      }
    },
    [editId, title, content, author, navigate]
  );

  if (fetching) {
    return (
      <div className="page centered">
        <div className="loading-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <p style={{ fontWeight: 700, color: 'var(--primary)' }}>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="page form-page">
      <div className="detail-container">
        <h1 className="form-heading" style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '24px' }}>
          {editId ? '글 수정하기' : '새로운 글 작성'}
        </h1>
        <form onSubmit={handleSubmit} className="post-form">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>
              제목
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                required
                style={{ marginTop: '4px', width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', fontSize: '1rem' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>
              작성자
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="익명"
                style={{ marginTop: '4px', width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', fontSize: '1rem' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', fontSize: '0.9rem' }}>
              내용
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={8}
                style={{ marginTop: '4px', width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline)', fontSize: '1rem', resize: 'vertical' }}
              />
            </label>
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '12px' }}>
            <Link to={editId ? `/community/${editId}` : '/community'} className="btn outlined" style={{ flex: 1 }}>
              취소
            </Link>
            <button type="submit" className="btn primary" disabled={!title.trim() || loading} style={{ flex: 2 }}>
              {loading ? '처리 중…' : editId ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

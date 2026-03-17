import { useCallback, useEffect, useMemo, useState } from 'react';
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
    async (e: React.FormEvent<HTMLFormElement>) => {
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

  const contentLength = useMemo(() => content.trim().length, [content]);

  if (fetching) {
    return (
      <div className="page centered">
        <div className="loading-shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
        <p style={{ fontWeight: 700, color: 'var(--primary)' }}>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="page editor-page">
      <section className="editor-hero">
        <div className="editor-hero__eyebrow">{editId ? 'EDIT POST' : 'NEW POST'}</div>
        <h1 className="editor-hero__title">{editId ? '게시글 수정하기' : '새 게시글 작성하기'}</h1>
        <p className="editor-hero__body">
          제목과 첫 문장이 먼저 읽히는 글이 좋습니다. 한 줄 제목과 문단 구성이 핵심입니다.
        </p>
        <div className="editor-hero__meta">
          <span className="board-pill">자유게시판</span>
          <span className="board-pill muted">{contentLength.toLocaleString()}자</span>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="editor-shell">
        <div className="editor-field">
          <label className="editor-label" htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="한 줄로 핵심이 보이게 작성하세요"
            required
            className="editor-input"
          />
        </div>

        <div className="editor-field">
          <label className="editor-label" htmlFor="author">작성자</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.currentTarget.value)}
            placeholder="익명"
            className="editor-input"
          />
        </div>

        <div className="editor-field">
          <label className="editor-label" htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            placeholder="발매 정보, 후기, 질문 내용을 문단별로 정리해보세요"
            rows={12}
            className="editor-textarea"
          />
        </div>

        <div className="editor-guide">
          <span>제목은 30자 안팎이면 읽기 좋습니다.</span>
          <span>본문은 날짜, 장소, 상품명 순으로 정리하면 빠르게 읽힙니다.</span>
        </div>

        <div className="editor-actions">
          <Link to={editId ? `/community/${editId}` : '/community'} className="btn outlined">
            취소
          </Link>
          <button type="submit" className="btn dark" disabled={!title.trim() || loading}>
            {loading ? '처리 중…' : editId ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  );
}

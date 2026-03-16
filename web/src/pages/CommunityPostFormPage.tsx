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
        <p>불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="page form-page">
      <h1 className="form-heading">{editId ? '글 수정' : '글쓰기'}</h1>
      <form onSubmit={handleSubmit} className="post-form">
        <label>
          제목
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            required
          />
        </label>
        <label>
          작성자
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="익명"
          />
        </label>
        <label>
          내용
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={6}
          />
        </label>
        <div className="form-actions">
          <Link to={editId ? `/community/${editId}` : '/community'} className="btn outlined">
            취소
          </Link>
          <button type="submit" className="btn primary" disabled={!title.trim() || loading}>
            {loading ? '처리 중…' : editId ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityPost, CommunityComment } from '../types/community';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

export function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPostAndComments = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const postId = Number(id);
      const [postData, commentsData] = await Promise.all([
        communityApi.getOne(postId),
        communityApi.getComments(postId).catch(() => [] as CommunityComment[]) // Ignore error if comments table is missing
      ]);
      setPost(postData);
      setComments(commentsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : '글을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPostAndComments();
  }, [fetchPostAndComments]);

  const handleDelete = async () => {
    if (!id || !window.confirm('DELETE THIS LOG PERMANENTLY?')) return;
    try {
      await communityApi.remove(Number(id));
      navigate('/community');
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'ERASE_FAILED');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newComment = await communityApi.createComment(Number(id), {
        author: commentAuthor.trim() || '익명',
        content: commentContent.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setCommentContent('');
      setCommentAuthor('');
    } catch (err) {
      window.alert('댓글 등록에 실패했습니다. DB를 확인하세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem', fontWeight: 900 }}>
          DECRYPTING_LOG...
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="animate-in">
        <ArcadeBox variant="primary" label="ERROR">
          <p style={{ color: 'var(--error)', fontWeight: 900 }}>
            {error ?? 'LOG_NOT_FOUND'}
          </p>
          <ArcadeButton variant="secondary" onClick={() => navigate('/community')} style={{ marginTop: '20px' }}>
            BACK_TO_ARCHIVE
          </ArcadeButton>
        </ArcadeBox>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: 'var(--arcade-primary)', fontSize: '0.8rem', marginBottom: '8px', fontWeight: 900 }}>
            MESSAGE_ID: {post.id}
          </div>
          <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2.5rem', marginBottom: '16px', fontWeight: 900 }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--arcade-accent)', fontWeight: 900 }}>
              AUTHOR: {post.author}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
              RECEIVED: {dayjs(post.createdAt).format('YYYY.MM.DD HH:mm')}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <ArcadeButton variant="secondary" size="sm" onClick={() => navigate(`/community/edit/${post.id}`)}>
            EDIT_DATA
          </ArcadeButton>
          <ArcadeButton variant="primary" size="sm" onClick={handleDelete}>
            ERASE_LOG
          </ArcadeButton>
        </div>
      </header>

      <div className="community-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="LOG_CONTENT" variant="default" style={{ minHeight: '400px' }}>
            <div style={{ 
              fontSize: '1.1rem', 
              color: '#fff', 
              lineHeight: '1.6', 
              whiteSpace: 'pre-wrap',
              fontFamily: 'Galmuri11, sans-serif'
            }}>
              {post.content || '( NO_DATA_RECORDED )'}
            </div>
          </ArcadeBox>

          {/* Comments Section */}
          <ArcadeBox label="LOG_COMMENTS" variant="secondary">
            {comments.length > 0 ? (
              <div className="comment-list">
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-author">{comment.author}</div>
                    <div className="comment-content">{comment.content}</div>
                    <div className="comment-date">{dayjs(comment.createdAt).format('YYYY.MM.DD HH:mm')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', padding: '20px 0' }}>
                NO COMMENTS DETECTED
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="comment-input-area">
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="AUTHOR (OPTIONAL)"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '8px 12px',
                    fontFamily: 'Galmuri11, sans-serif',
                    width: '150px'
                  }}
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  placeholder="ENTER COMMENT DATA..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '8px 12px',
                    fontFamily: 'Galmuri11, sans-serif',
                    flex: 1
                  }}
                  disabled={isSubmitting}
                />
                <ArcadeButton variant="accent" size="sm" type="submit" disabled={!commentContent.trim() || isSubmitting}>
                  TRANSMIT
                </ArcadeButton>
              </div>
            </form>
          </ArcadeBox>
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <ArcadeBox label="METADATA" variant="secondary">
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', fontWeight: 900 }}>SECTOR</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>GENERAL_COMM</div>
              </li>
              <li style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', fontWeight: 900 }}>BYTE_SIZE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{post.content.length.toLocaleString()} B</div>
              </li>
              <li>
                <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', fontWeight: 900 }}>LAST_SYNC</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{dayjs(post.updatedAt).format('HH:mm:ss')}</div>
              </li>
            </ul>
          </ArcadeBox>

          <ArcadeBox label="NAVIGATION" variant="default">
            <ArcadeButton variant="secondary" size="sm" style={{ width: '100%' }} onClick={() => navigate('/community')}>
              BACK_TO_LIST
            </ArcadeButton>
          </ArcadeBox>
        </aside>
      </div>
    </div>
  );
}

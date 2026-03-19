import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityFeedItem } from '../types/community';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

function feedLabel(item: CommunityFeedItem) {
  if (item.type === 'post_created') return 'NEW_POST';
  if (item.type === 'post_updated') return 'UPDATE';
  if (item.type === 'post_deleted') return 'DELETE';
  if (item.type === 'lineup_alert') return 'ALERT';
  return 'SIGNAL';
}

export function FeedPage() {
  const [items, setItems] = useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // DOS Input & Tags state
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = ['가챠교환', '쿠지현황'];

  const loadFeed = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await communityApi.getFeed(60);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '피드를 불러올 수 없습니다.');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSubmitting) return;

    const finalTitle = selectedTag ? `[${selectedTag}] ${text}` : text;

    setIsSubmitting(true);
    try {
      await communityApi.create({
        title: finalTitle.length > 40 ? finalTitle.substring(0, 40) + '...' : finalTitle,
        content: text,
        author: '익명_WEB_CLI',
        category: selectedTag || '자유',
      });
      setInputText('');
      setSelectedTag(null);
      setSelectedImage(null);
      await loadFeed(false);
    } catch (err) {
      console.error('Failed to post from CLI:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter(item => 
      item.title.includes(`[${selectedTag}]`) || 
      item.body.includes(selectedTag)
    );
  }, [items, selectedTag]);

  const toggleTag = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag);
  };

  const pickImage = () => {
    // Placeholder simulation
    if (selectedImage) {
      setSelectedImage(null);
    } else {
      setSelectedImage('https://via.placeholder.com/150/000000/39FF14?text=CLI_IMG');
    }
  };

  if (loading && !refreshing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="blink" style={{ color: 'var(--arcade-primary)', fontSize: '1.5rem', fontWeight: 900 }}>
          SYNCING FEED...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header className="page-header" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'var(--arcade-secondary)', fontSize: '2rem', marginBottom: '8px' }}>
              LIVE_SIGNAL_FEED
            </h1>
            <p style={{ color: '#fff', fontSize: '0.9rem', opacity: 0.8, fontWeight: 500 }}>
              REAL-TIME SECTOR MONITORING & DATA INPUT.
            </p>
          </div>
          <ArcadeButton variant="primary" size="sm" onClick={() => loadFeed()}>
            REFRESH
          </ArcadeButton>
        </div>

        {/* DOS Style Input Section */}
        <div className="dos-container" style={dosStyles.container}>
          <div className="dos-header" style={dosStyles.header}>
            <div style={dosStyles.dot} />
            <span style={dosStyles.headerText}>KUJI_TERMINAL_V1.0.WEB</span>
          </div>
          
          <div className="dos-body" style={dosStyles.body}>
            <form onSubmit={handleQuickPost} style={dosStyles.inputRow}>
              <span style={dosStyles.prompt}>C:\FEED{'>'} </span>
              <input
                ref={inputRef}
                style={dosStyles.input}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="INPUT DATA AND PRESS ENTER..."
                autoComplete="off"
                disabled={isSubmitting}
              />
              <button type="button" onClick={pickImage} style={dosStyles.imageBtn}>
                <span style={{ fontSize: '1.2rem', color: selectedImage ? '#39FF14' : '#008F11' }}>
                  {selectedImage ? '▣' : '▤'}
                </span>
              </button>
              {isSubmitting && <div className="blink" style={{ color: '#39FF14', marginLeft: '12px' }}>...</div>}
            </form>

            {selectedImage && (
              <div style={dosStyles.previewRow}>
                <span style={dosStyles.tagPrompt}>ATTACHED_FILE: </span>
                <div style={dosStyles.imageFrame}>
                  <img src={selectedImage} alt="preview" style={dosStyles.previewImage} />
                  <button onClick={() => setSelectedImage(null)} style={dosStyles.closeBtn}>[X]</button>
                </div>
              </div>
            )}

            <div style={dosStyles.tagRow}>
              <span style={dosStyles.tagPrompt}>SELECT_TAG: </span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    ...dosStyles.tagButton,
                    ...(selectedTag === tag ? dosStyles.tagActive : {})
                  }}
                >
                  {selectedTag === tag ? `[*${tag}]` : `[ ${tag} ]`}
                </button>
              ))}
              <div className="blink" style={dosStyles.cursor} />
            </div>
          </div>
        </div>
      </header>

      {error && (
        <ArcadeBox variant="primary" style={{ marginBottom: '24px', borderColor: 'var(--error)' }}>
          <div style={{ color: 'var(--error)', fontSize: '1rem', fontWeight: 900 }}>
            SIGNAL_INTERRUPTED: {error}
          </div>
        </ArcadeBox>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {filteredItems.map((item) => (
          <ArcadeBox 
            key={item.id} 
            label={feedLabel(item)} 
            variant={item.type === 'lineup_alert' ? 'accent' : 'secondary'}
            onClick={() => item.postId && navigate(`/community/${item.postId}`)}
            style={{ cursor: item.postId ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.1rem', color: 'var(--arcade-secondary)', marginBottom: '12px', fontWeight: 900 }}>
                  {item.title}
                </h2>
                <p style={{ fontSize: '0.95rem', color: '#fff', opacity: 0.8, lineHeight: '1.4' }}>
                  {item.body}
                </p>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginLeft: '24px', fontWeight: 700 }}>
                {dayjs(item.createdAt).format('HH:mm:ss')}
              </div>
            </div>
          </ArcadeBox>
        ))}
        {filteredItems.length === 0 && !error && (
          <ArcadeBox label="EMPTY_SIGNAL" variant="default" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontWeight: 700 }}>
              {selectedTag ? `NO DATA DETECTED FOR '${selectedTag}'.` : 'NO DATA DETECTED IN THIS SECTOR.'}
            </p>
          </ArcadeBox>
        )}
      </div>
    </div>
  );
}

const dosStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#000',
    borderRadius: '8px',
    border: '2px solid #333',
    overflow: 'hidden',
    fontFamily: "'VT323', monospace",
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #333',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#39ff14',
    boxShadow: '0 0 5px #39ff14',
  },
  headerText: {
    color: '#888',
    fontSize: '12px',
    fontWeight: 900,
    letterSpacing: '1px',
  },
  body: {
    padding: '20px',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
  },
  prompt: {
    color: '#39ff14',
    fontSize: '1.2rem',
    fontWeight: 900,
    whiteSpace: 'pre',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#39ff14',
    fontSize: '1.2rem',
    fontWeight: 900,
    padding: 0,
    outline: 'none',
    textShadow: '0 0 5px rgba(57, 255, 20, 0.5)',
  },
  imageBtn: {
    marginLeft: '12px',
    padding: '4px 8px',
    border: '1px solid #008f11',
    color: '#008f11',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '16px',
  },
  imageFrame: {
    width: '80px',
    height: '80px',
    border: '2px solid #39ff14',
    position: 'relative',
    padding: '4px',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    opacity: 0.8,
  },
  closeBtn: {
    position: 'absolute',
    top: '-10px',
    right: '-30px',
    color: '#ff0033',
    fontWeight: 900,
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tagPrompt: {
    color: '#008f11',
    fontSize: '1rem',
    fontWeight: 700,
  },
  tagButton: {
    color: '#008f11',
    fontSize: '1rem',
    fontWeight: 700,
    transition: 'all 0.2s',
  },
  tagActive: {
    color: '#39ff14',
    textShadow: '0 0 8px rgba(57, 255, 20, 0.8)',
  },
  cursor: {
    width: '10px',
    height: '20px',
    backgroundColor: '#39ff14',
    marginLeft: '4px',
    boxShadow: '0 0 5px #39ff14',
  }
};

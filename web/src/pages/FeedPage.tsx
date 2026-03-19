import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { communityApi } from '../api/community';
import type { CommunityFeedItem } from '../types/community';
import { ArcadeBox } from '../components/arcade/ArcadeBox';
import { ArcadeButton } from '../components/arcade/ArcadeButton';

export function FeedPage() {
  const [items, setItems] = useState<CommunityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Animation state
  const [isExpanded, setIsExpanded] = useState(false);

  // DOS Input & Tags state
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleQuickPost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await communityApi.createFeedItem({
        type: 'quick_post',
        title: selectedTag ? `[${selectedTag}] ${text}` : text,
        body: text,
        imageUrl: selectedImage || undefined,
      });
      setInputText('');
      setSelectedTag(null);
      setSelectedImage(null);
      setIsExpanded(false); 
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
      item.body.includes(selectedTag) ||
      (item.type === 'quick_post' && item.title.includes(selectedTag))
    );
  }, [items, selectedTag]);

  const toggleTag = (tag: string) => {
    setSelectedTag(prev => prev === tag ? null : tag);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await communityApi.uploadImage(file);
      setSelectedImage(base64);
    } catch (err) {
      console.error('File read error:', err);
    }
  };

  const handleTerminalHeaderClick = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 300);
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
              REAL-TIME DATA STREAM. INDEPENDENT FROM SECTOR_POSTS.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <ArcadeButton 
              variant={isExpanded ? "accent" : "primary"} 
              size="sm" 
              onClick={handleTerminalHeaderClick}
            >
              {isExpanded ? 'MINIMIZE' : 'WRITE_SIGNAL'}
            </ArcadeButton>
            <ArcadeButton variant="secondary" size="sm" onClick={() => loadFeed()}>
              REFRESH
            </ArcadeButton>
          </div>
        </div>

        {/* DOS Style Input Section - Always visible, animated height */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div 
            className="dos-container" 
            style={{
              ...dosStyles.container,
              width: isExpanded ? '85%' : '60%',
              transition: 'width 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
            }}
          >
            <div 
              className="dos-header" 
              style={dosStyles.header}
              onClick={handleTerminalHeaderClick}
            >
              <div style={dosStyles.dot} />
              <span style={dosStyles.headerText}>KUJI_TERMINAL_V1.0.WEB</span>
              <span style={{ marginLeft: 'auto', color: '#555', fontSize: '10px' }}>
                {isExpanded ? '[-] EXPANDED' : '[+] MINIMIZED'}
              </span>
            </div>
            
            <div 
              className="dos-body" 
              style={{
                ...dosStyles.body,
                maxHeight: isExpanded ? '600px' : '64px',
                opacity: isExpanded ? 1 : 0.7,
                overflow: 'hidden',
                transition: 'max-height 0.4s ease, opacity 0.3s ease'
              }}
            >
              <form onSubmit={handleQuickPost} style={dosStyles.inputRow}>
                <span style={dosStyles.prompt}>C:\FEED{'>'} </span>
                <input
                  ref={inputRef}
                  style={dosStyles.input}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isExpanded ? "INPUT DATA AND PRESS ENTER..." : "CLICK WRITE OR THIS AREA TO START..."}
                  autoComplete="off"
                  disabled={isSubmitting}
                  onClick={() => !isExpanded && setIsExpanded(true)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} 
                    style={dosStyles.imageBtn}
                  >
                    <span style={{ fontSize: '1.6rem', color: selectedImage ? '#39FF14' : '#008F11', fontWeight: 900 }}>
                      +
                    </span>
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleQuickPost(); }} 
                    style={dosStyles.submitBtn}
                  >
                    <span style={{ fontSize: '1.4rem', color: '#39FF14', fontWeight: 900 }}>
                      ↵
                    </span>
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={onFileChange}
                />
                {isSubmitting && <div className="blink" style={{ color: '#39FF14', marginLeft: '12px' }}>...</div>}
              </form>

              <div style={{ 
                borderTop: '1px dashed #222', 
                paddingTop: '16px', 
                marginTop: '16px',
                display: isExpanded ? 'block' : 'none' 
              }}>
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
                      onClick={(e) => { e.stopPropagation(); toggleTag(tag); }}
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
        {filteredItems.map((item) => {
          // Extract tag from title if present
          const tagMatch = item.title.match(/^\[(.*?)\]/);
          const tagLabel = tagMatch ? tagMatch[1] : null;
          const cleanBody = item.body;

          return (
            <ArcadeBox 
              key={item.id} 
              variant={item.type === 'lineup_alert' ? 'accent' : 'secondary'}
              onClick={() => item.postId && navigate(`/community/${item.postId}`)}
              style={{ cursor: item.postId ? 'pointer' : 'default', padding: '20px' }}
            >
              <div style={{ position: 'relative', minHeight: '60px' }}>
                {/* Tag at Top-Right */}
                {tagLabel && (
                  <div style={dosStyles.itemTag}>
                    {tagLabel}
                  </div>
                )}

                {/* Main Content (Body Only) */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginTop: tagLabel ? '10px' : '0' }}>
                  {item.imageUrl && (
                    <div style={dosStyles.itemImageFrame}>
                      <img src={item.imageUrl} alt="feed-content" style={dosStyles.itemPreviewImage} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '1.05rem', color: '#fff', opacity: 0.9, lineHeight: '1.6', wordBreak: 'break-all' }}>
                      {cleanBody}
                    </p>
                  </div>
                </div>

                {/* Author & Time at Bottom-Right */}
                <div style={dosStyles.itemFooter}>
                  <span style={{ opacity: 0.6 }}>{dayjs(item.createdAt).format('HH:mm:ss')}</span>
                  <span style={{ color: 'var(--arcade-secondary)', fontWeight: 900 }}>@{item.author || '익명'}</span>
                </div>
              </div>
            </ArcadeBox>
          );
        })}
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
    borderRadius: '4px',
    border: '2px solid #333',
    overflow: 'hidden',
    fontFamily: "'VT323', monospace",
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  header: {
    backgroundColor: '#1a1a1a',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #333',
    cursor: 'pointer',
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
    height: '24px',
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
    padding: '0 4px',
    color: '#008f11',
    fontWeight: 900,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '0 4px',
    color: '#39ff14',
    fontWeight: 900,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
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
  itemImageFrame: {
    width: '120px',
    height: '120px',
    border: '1px solid rgba(57, 255, 20, 0.3)',
    padding: '4px',
    backgroundColor: '#000',
  },
  itemPreviewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemTag: {
    position: 'absolute',
    top: '-10px',
    right: '0',
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    color: 'var(--arcade-secondary)',
    padding: '2px 8px',
    fontSize: '0.8rem',
    fontWeight: 900,
    border: '1px solid var(--arcade-secondary)',
    textTransform: 'uppercase',
  },
  itemFooter: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  closeBtn: {
    position: 'absolute',
    top: '-10px',
    right: '-30px',
    color: '#ff0033',
    fontWeight: 900,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
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
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
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

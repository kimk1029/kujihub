export function ProfilePage() {
  const user = {
    nickname: '쿠지마스터',
    email: 'kuji@example.com',
    postsCount: 12,
    drawsCount: 45,
    collectionCount: 8,
  };

  return (
    <div className="page profile-page">
      <div className="profile-header profile-section">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <h1>{user.nickname}</h1>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">작성한 글</span>
          <span className="stat-value">{user.postsCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">누적 뽑기</span>
          <span className="stat-value">{user.drawsCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">나의 컬렉션</span>
          <span className="stat-value">{user.collectionCount}</span>
        </div>
      </div>

      <div className="profile-section" style={{ padding: '24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 800 }}>최근 활동</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
          최근 활동 내역이 없습니다.
        </p>
      </div>
    </div>
  );
}

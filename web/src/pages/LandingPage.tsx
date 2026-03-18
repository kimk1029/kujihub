import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import '../arcade.css';
import { ArcadeButton } from '../components/arcade/ArcadeButton';
import { kujiDrawApi } from '../api/kujiDraw';
import type { KujiListItem } from '../types/kujiDraw';
import { getWebAuthSession, setWebAuthSession } from '../auth/webAuth';

type WebLoginOption = {
  id: 'kakao' | 'naver' | 'google' | 'dev';
  label: string;
  tone: 'accent' | 'primary' | 'secondary';
};

const LOGIN_OPTIONS: WebLoginOption[] = [
  { id: 'kakao', label: '카카오 로그인', tone: 'accent' },
  { id: 'naver', label: '네이버 로그인', tone: 'secondary' },
  { id: 'google', label: '구글 로그인', tone: 'primary' },
  { id: 'dev', label: '바로가기(개발용)', tone: 'accent' },
];

const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY ?? '';
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID ?? '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function buildCallbackUrl(provider: 'kakao' | 'naver') {
  return `${window.location.origin}/?provider=${provider}`;
}

function createOAuthState(provider: 'kakao' | 'naver') {
  const state = `${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.sessionStorage.setItem(`kujihub_oauth_state_${provider}`, state);
  return state;
}

function validateOAuthState(provider: 'kakao' | 'naver', state: string | null) {
  const key = `kujihub_oauth_state_${provider}`;
  const expected = window.sessionStorage.getItem(key);
  window.sessionStorage.removeItem(key);
  return Boolean(state && expected && state === expected);
}

function buildKakaoAuthUrl() {
  const state = createOAuthState('kakao');
  const params = new URLSearchParams({
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: buildCallbackUrl('kakao'),
    response_type: 'code',
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

function buildNaverAuthUrl() {
  const state = createOAuthState('naver');
  const params = new URLSearchParams({
    client_id: NAVER_CLIENT_ID,
    redirect_uri: buildCallbackUrl('naver'),
    response_type: 'code',
    state,
  });
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
}

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [featured, setFeatured] = useState<KujiListItem[]>([]);
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    kujiDrawApi.getList().then(list => {
      setFeatured(list.slice(0, 3));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (getWebAuthSession()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provider = params.get('provider');
    const code = params.get('code');
    const state = params.get('state');
    const errorCode = params.get('error');

    if (!provider) {
      return;
    }

    if (errorCode) {
      setError('소셜 로그인에 실패했습니다. 다시 시도해주세요.');
      window.history.replaceState({}, '', '/');
      return;
    }

    if ((provider === 'kakao' || provider === 'naver') && code) {
      const isValid = validateOAuthState(provider, state);
      if (!isValid) {
        setError('로그인 검증에 실패했습니다. 다시 시도해주세요.');
        window.history.replaceState({}, '', '/');
        return;
      }

      setWebAuthSession(provider, code);
      window.history.replaceState({}, '', '/');
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate]);

  const loginHelp = useMemo(() => {
    const missing = [];
    if (!KAKAO_REST_API_KEY) missing.push('KAKAO');
    if (!NAVER_CLIENT_ID) missing.push('NAVER');
    if (!GOOGLE_CLIENT_ID) missing.push('GOOGLE');
    return missing;
  }, []);

  function handlePressStart() {
    if (showLoginPanel || isGlitching) {
      return;
    }

    setError(null);
    setIsGlitching(true);
    window.setTimeout(() => {
      setShowLoginPanel(true);
      setIsGlitching(false);
    }, 820);
  }

  function handleLogin(option: WebLoginOption['id']) {
    setError(null);

    if (option === 'dev') {
      setWebAuthSession('dev', 'web_dev_shortcut');
      navigate('/dashboard', { replace: true });
      return;
    }

    if (option === 'google') {
      if (!GOOGLE_CLIENT_ID) {
        setError('VITE_GOOGLE_CLIENT_ID가 없습니다.');
        return;
      }
      return;
    }

    if (option === 'kakao') {
      if (!KAKAO_REST_API_KEY) {
        setError('VITE_KAKAO_REST_API_KEY가 없습니다.');
        return;
      }
      window.location.href = buildKakaoAuthUrl();
      return;
    }

    if (!NAVER_CLIENT_ID) {
      setError('VITE_NAVER_CLIENT_ID가 없습니다.');
      return;
    }
    window.location.href = buildNaverAuthUrl();
  }

  return (
    <div className="arcade-body scanlines crt landing-shell">
      <div className="landing-topbar">
        <div style={{ color: 'var(--arcade-secondary)', fontWeight: 900 }}>1P: 00000</div>
        <div className="blink" style={{ color: 'var(--arcade-accent)', fontWeight: 900 }}>WEB LOGIN MODE</div>
        <div style={{ color: 'var(--arcade-primary)', fontWeight: 900 }}>CREDITS: 01</div>
      </div>

      <section className="arcade-hero landing-hero">
        <h1 className="hero-title glitch-heavy" style={{ fontSize: '6rem' }}>
          KUJI<br />HUB
        </h1>
        <p className="hero-subtitle" style={{ letterSpacing: '12px', color: 'var(--arcade-secondary)', marginBottom: '3rem' }}>
          // WEB LOGIN ARCADE GATE
        </p>

        <div className="login-gate-wrap">
          <div
            className={[
              'login-gate-stage',
              showLoginPanel ? 'is-revealed' : '',
              isGlitching ? 'is-glitching' : '',
            ].join(' ')}
          >
            <div className="login-gate-face start-face">
              <ArcadeButton
                variant="accent"
                size="lg"
                onClick={handlePressStart}
                className="coin-btn btn-glitch-active"
              >
                PRESS START
              </ArcadeButton>
            </div>

            <div className="login-gate-face login-face">
              <div className="web-login-panel">
                {LOGIN_OPTIONS.map((option) => (
                  option.id === 'google' ? (
                    GOOGLE_CLIENT_ID ? (
                      <GoogleLoginButton
                        key={option.id}
                        onError={(message) => setError(message)}
                        onSuccess={(token) => {
                          setWebAuthSession('google', token);
                          navigate('/dashboard', { replace: true });
                        }}
                      />
                    ) : (
                      <button
                        key={option.id}
                        type="button"
                        className="web-login-btn tone-primary"
                        onClick={() => setError('VITE_GOOGLE_CLIENT_ID가 없습니다.')}
                      >
                        <span className="web-login-btn-label">구글 로그인</span>
                        <span className="web-login-btn-sub">웹 로그인</span>
                      </button>
                    )
                  ) : (
                    <button
                      key={option.id}
                      type="button"
                      className={`web-login-btn tone-${option.tone}`}
                      onClick={() => handleLogin(option.id)}
                    >
                      <span className="web-login-btn-label">{option.label}</span>
                      <span className="web-login-btn-sub">
                        {option.id === 'dev' ? '개발용 바로 진입' : '웹 로그인'}
                      </span>
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>

          <p className="landing-gate-caption">
            PRESS START를 눌러야 로그인 버튼이 활성화됩니다.
          </p>
        </div>

        {error ? <div className="landing-login-error">{error}</div> : null}
        {loginHelp.length > 0 ? (
          <div className="landing-login-hint">
            누락된 웹 환경변수: {loginHelp.join(', ')}
          </div>
        ) : null}

        <div style={{ marginTop: '4rem', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {featured.map(item => (
            <div key={item.id} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
              LOADED: {item.title.substring(0, 15)}...
            </div>
          ))}
        </div>

        <div className="blink" style={{ marginTop: '2rem', color: 'var(--arcade-accent)', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '4px' }}>
          © 2026 KUJIHUB ENTERTAINMENT SYSTEM
        </div>
      </section>

      <footer className="landing-footer">
        <div style={{ display: 'flex', gap: '4rem', justifyContent: 'center' }}>
          <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>FAQ</span>
          <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>LEGAL</span>
          <span className="glitch-text" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>SUPPORT</span>
        </div>
      </footer>
    </div>
  );
}

function GoogleLoginButton({
  onSuccess,
  onError,
}: {
  onSuccess: (token: string) => void;
  onError: (message: string) => void;
}) {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      if (tokenResponse.access_token) {
        onSuccess(tokenResponse.access_token);
        return;
      }

      onError('구글 토큰을 받지 못했습니다.');
    },
    onError: () => {
      onError('구글 로그인에 실패했습니다. 설정값을 확인해주세요.');
    },
  });

  return (
    <button
      type="button"
      className="web-login-btn tone-primary"
      onClick={() => {
        login();
      }}
    >
      <span className="web-login-btn-label">구글 로그인</span>
      <span className="web-login-btn-sub">웹 로그인</span>
    </button>
  );
}

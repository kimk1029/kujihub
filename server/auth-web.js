const crypto = require('crypto');

const WEB_AUTH_SECRET = process.env.WEB_AUTH_SECRET || 'kujihub_web_auth_secret';
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '';
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

function signPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', WEB_AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function createSession(provider, user) {
  const session = {
    provider,
    user,
    issuedAt: Date.now(),
  };

  return {
    token: signPayload(session),
    provider,
    user,
  };
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Google 사용자 검증에 실패했습니다.');
  }

  const data = await response.json();
  return {
    id: data.sub,
    name: data.name || data.email || 'Google User',
    email: data.email || null,
    image: data.picture || null,
  };
}

async function exchangeKakaoCode(code, redirectUri) {
  if (!KAKAO_REST_API_KEY) {
    throw new Error('KAKAO_REST_API_KEY가 없습니다.');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  });

  if (KAKAO_CLIENT_SECRET) {
    params.set('client_secret', KAKAO_CLIENT_SECRET);
  }

  const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: params.toString(),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || '카카오 토큰 교환에 실패했습니다.');
  }

  const profileResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  const profileData = await profileResponse.json();
  if (!profileResponse.ok || !profileData.id) {
    throw new Error('카카오 사용자 조회에 실패했습니다.');
  }

  return {
    id: String(profileData.id),
    name:
      profileData.kakao_account?.profile?.nickname ||
      profileData.properties?.nickname ||
      'Kakao User',
    email: profileData.kakao_account?.email || null,
    image:
      profileData.kakao_account?.profile?.profile_image_url ||
      profileData.properties?.profile_image ||
      null,
  };
}

async function exchangeNaverCode(code, state) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    throw new Error('NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 없습니다.');
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: NAVER_CLIENT_ID,
    client_secret: NAVER_CLIENT_SECRET,
    code,
    state,
  });

  const tokenResponse = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`);
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || '네이버 토큰 교환에 실패했습니다.');
  }

  const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const profileData = await profileResponse.json();
  if (!profileResponse.ok || profileData.resultcode !== '00') {
    throw new Error('네이버 사용자 조회에 실패했습니다.');
  }

  return {
    id: profileData.response?.id,
    name: profileData.response?.name || profileData.response?.nickname || 'Naver User',
    email: profileData.response?.email || null,
    image: profileData.response?.profile_image || null,
  };
}

function registerWebAuthRoutes(app) {
  app.post('/api/auth/web/google', async (req, res) => {
    try {
      const accessToken = String(req.body?.accessToken || '').trim();
      if (!accessToken) {
        return res.status(400).json({ error: 'accessToken is required' });
      }

      const user = await fetchGoogleProfile(accessToken);
      res.json(createSession('google', user));
    } catch (error) {
      res.status(502).json({ error: 'Google auth failed', message: error.message });
    }
  });

  app.post('/api/auth/web/kakao', async (req, res) => {
    try {
      const code = String(req.body?.code || '').trim();
      const redirectUri = String(req.body?.redirectUri || '').trim();
      if (!code || !redirectUri) {
        return res.status(400).json({ error: 'code and redirectUri are required' });
      }

      const user = await exchangeKakaoCode(code, redirectUri);
      res.json(createSession('kakao', user));
    } catch (error) {
      res.status(502).json({ error: 'Kakao auth failed', message: error.message });
    }
  });

  app.post('/api/auth/web/naver', async (req, res) => {
    try {
      const code = String(req.body?.code || '').trim();
      const state = String(req.body?.state || '').trim();
      if (!code || !state) {
        return res.status(400).json({ error: 'code and state are required' });
      }

      const user = await exchangeNaverCode(code, state);
      res.json(createSession('naver', user));
    } catch (error) {
      res.status(502).json({ error: 'Naver auth failed', message: error.message });
    }
  });

  app.post('/api/auth/web/dev', (req, res) => {
    const nickname = String(req.body?.nickname || 'DEV USER').trim() || 'DEV USER';
    res.json(
      createSession('dev', {
        id: 'dev-user',
        name: nickname,
        email: null,
        image: null,
      }),
    );
  });
}

module.exports = {
  registerWebAuthRoutes,
};

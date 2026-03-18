import { BrowserRouter, Navigate, Outlet, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';
import { KujiListPage } from './pages/KujiListPage';
import { KujiDetailPage } from './pages/KujiDetailPage';
import { KujiBoardPage } from './pages/KujiBoardPage';
import { FeedPage } from './pages/FeedPage';
import { CommunityListPage } from './pages/CommunityListPage';
import { CommunityDetailPage } from './pages/CommunityDetailPage';
import { CommunityPostFormPage } from './pages/CommunityPostFormPage';
import { ProfilePage } from './pages/ProfilePage';
import { getWebAuthSession } from './auth/webAuth';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function App() {
  const app = (
    <BrowserRouter>
      <Routes>
        <Route index element={<LandingPage />} />

        <Route element={<RequireWebAuth />}>
          <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<HomePage />} />
            <Route path="kuji" element={<KujiListPage />} />
            <Route path="kuji/:id" element={<KujiDetailPage />} />
            <Route path="kuji/:id/board/:purchaseId" element={<KujiBoardPage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="community" element={<CommunityListPage />} />
            <Route path="community/new" element={<CommunityPostFormPage />} />
            <Route path="community/edit/:id" element={<CommunityPostFormPage />} />
            <Route path="community/:id" element={<CommunityDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );

  if (!googleClientId) {
    return app;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {app}
    </GoogleOAuthProvider>
  );
}

function RequireWebAuth() {
  const session = getWebAuthSession();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

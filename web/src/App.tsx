import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen Landing Page */}
        <Route index element={<LandingPage />} />
        
        {/* App Shell / Dashboard Layout */}
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
      </Routes>
    </BrowserRouter>
  );
}

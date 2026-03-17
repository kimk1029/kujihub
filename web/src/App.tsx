import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { FeedPage } from './pages/FeedPage';
import { CommunityListPage } from './pages/CommunityListPage';
import { CommunityDetailPage } from './pages/CommunityDetailPage';
import { CommunityPostFormPage } from './pages/CommunityPostFormPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
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

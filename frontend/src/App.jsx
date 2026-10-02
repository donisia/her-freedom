import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import EmptyState from './components/common/EmptyState';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import BookDetailPage from './pages/BookDetailPage';
import ChapterPage from './pages/ChapterPage';
import AuthorProfilePage from './pages/AuthorProfilePage';
import AuthorDashboardPage from './pages/AuthorDashboardPage';
import CreateBookPage from './pages/CreateBookPage';
import CreateChapterPage from './pages/CreateChapterPage';
import AboutPage from './pages/AboutPage';
function NotFoundPage() {
  return (
    <div className="container-page py-24">
      <EmptyState
        title="This page drifted off the relays"
        description="The page you’re looking for doesn’t exist, or its event was never published."
        actionLabel="Back to the library"
        actionTo="/explore"
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="book/:id" element={<BookDetailPage />} />
        <Route path="author/:npub" element={<AuthorProfilePage />} />
        <Route path="dashboard" element={<AuthorDashboardPage />} />
        <Route path="create-book" element={<CreateBookPage />} />
        <Route path="create-chapter" element={<CreateChapterPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Distraction-free reader: no global navbar or footer. */}
      <Route element={<Layout minimal />}>
        <Route path="book/:id/chapter/:chapterId" element={<ChapterPage />} />
      </Route>
    </Routes>
  );
}

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';
import { LoginPageRoute, RegisterPageRoute, ForgotPasswordPageRoute } from './pages/AuthPages';
import { GoalSelectionPage, SubjectSelectionPage, PlacementTestPage } from './pages/OnboardingPages';
import { DashboardPage } from './pages/DashboardPage';
import { ExamRoomPage } from './pages/ExamRoomPage';
import Homepage from "./pages/Homepage";
import { Challenge5MinPage } from './pages/Challenge5MinPage';
import { GoldenTimePage } from './pages/GoldenTimePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePageRoute } from './pages/ProfilePageRoute';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { TestLibraryPage } from './pages/TestLibraryPage';
import { ProtectedRoute } from './components/routing/ProtectedRoute';

// --- IMPORT 2 COMPONENT MỚI ---
import { ErrorHistoryReview } from './components/ErrorHistoryReview';
import { GoldenTimeFlashcardContainer } from './components/goldenTime/GoldenTimeFlashcardContainer';

// --- WRAPPER COMPONENTS (Để xử lý nút Back) ---
// Giúp chuyển đổi prop onBack/onClose thành hành động điều hướng của Router
const ErrorReviewWrapper = () => {
  const navigate = useNavigate();
  return <ErrorHistoryReview onBack={() => navigate('/dashboard')} />;
};

const FlashcardWrapper = () => {
  const navigate = useNavigate();
  return <GoldenTimeFlashcardContainer onClose={() => navigate('/dashboard')} />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />

          {/* Public Routes - Redirect to dashboard if already logged in */}
          <Route path="/login" element={<LoginPageRoute />} />
          <Route path="/register" element={<RegisterPageRoute />} />
          <Route path="/forgot-password" element={<ForgotPasswordPageRoute />} />

          {/* Onboarding Routes - Require authentication */}
          <Route
            path="/goal-selection"
            element={
              <ProtectedRoute>
                <GoalSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subject-selection"
            element={
              <ProtectedRoute>
                <SubjectSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement-test"
            element={
              <ProtectedRoute>
                <PlacementTestPage />
              </ProtectedRoute>
            }
          />

          {/* Main App Routes - Require authentication and onboarding */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* --- ✅ NEW ROUTES: ERROR REVIEW & FLASHCARDS --- */}
          <Route
            path="/error-review"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ErrorReviewWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <FlashcardWrapper />
              </ProtectedRoute>
            }
          />
          {/* ------------------------------------------------ */}

          {/* Exam Room Routes */}
          <Route
            path="/exam-room"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ExamRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam-room/sprint"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ExamRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam-room/marathon"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ExamRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam-room/ranking"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ExamRoomPage />
              </ProtectedRoute>
            }
          />

          {/* Challenge 5 Min Route */}
          <Route
            path="/challenge-5min"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <Challenge5MinPage />
              </ProtectedRoute>
            }
          />

          {/* Golden Time Route */}
          <Route
            path="/golden-time"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <GoldenTimePage />
              </ProtectedRoute>
            }
          />

          {/* Learning Roadmap Route */}
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <RoadmapPage />
              </ProtectedRoute>
            }
          />

          {/* Analytics Route */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ProfilePageRoute />
              </ProtectedRoute>
            }
          />

          {/* Leaderboard Route */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />

          {/* Test Library Route */}
          <Route
            path="/test-library"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <TestLibraryPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/Homepage" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
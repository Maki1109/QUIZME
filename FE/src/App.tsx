import { ComponentType, lazy, ReactNode, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import Homepage from './pages/Homepage';
import { AuthProvider, useAuth } from './lib/auth';
import { api, errorMessage } from './lib/api';
import type { Session } from './lib/types';
import { TutorProvider } from './app/Tutor';
import { Loading } from './app/ui';
// Pages are split into separate chunks so the landing page stays light.
const page = <M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M) =>
  lazy(() => load().then((m) => ({ default: m[name] as ComponentType })));
const LoginPage = page(() => import('./app/pages/Auth'), 'LoginPage');
const RegisterPage = page(() => import('./app/pages/Auth'), 'RegisterPage');
const ForgotPasswordPage = page(() => import('./app/pages/Auth'), 'ForgotPasswordPage');
const ResetPasswordPage = page(() => import('./app/pages/Auth'), 'ResetPasswordPage');
const OnboardingPage = page(() => import('./app/pages/Onboarding'), 'OnboardingPage');
const DashboardPage = page(() => import('./app/pages/Dashboard'), 'DashboardPage');
const PracticePage = page(() => import('./app/pages/Practice'), 'PracticePage');
const SessionPage = page(() => import('./app/pages/Session'), 'SessionPage');
const LibraryPage = page(() => import('./app/pages/Library'), 'LibraryPage');
const NotebookPage = page(() => import('./app/pages/Notebook'), 'NotebookPage');
const NotebookPrintPage = page(() => import('./app/pages/Notebook'), 'NotebookPrintPage');
const SolutionPage = page(() => import('./app/pages/Notebook'), 'SolutionPage');
const GoldenTimePage = page(() => import('./app/pages/GoldenTime'), 'GoldenTimePage');
const AnalyticsPage = page(() => import('./app/pages/Insights'), 'AnalyticsPage');
const RoadmapPage = page(() => import('./app/pages/Insights'), 'RoadmapPage');
const AchievementsPage = page(() => import('./app/pages/Engagement'), 'AchievementsPage');
const LeaderboardPage = page(() => import('./app/pages/Engagement'), 'LeaderboardPage');
const ProfilePage = page(() => import('./app/pages/Engagement'), 'ProfilePage');
const ShopPage = page(() => import('./app/pages/Engagement'), 'ShopPage');
const SupportPage = page(() => import('./app/pages/Engagement'), 'SupportPage');
const UpgradePage = page(() => import('./app/pages/Engagement'), 'UpgradePage');
const UpgradeResultPage = page(() => import('./app/pages/Engagement'), 'UpgradeResultPage');
const AdminPage = page(() => import('./app/pages/Admin'), 'AdminPage');

/** Requires a signed-in user (waits for the stored session to be restored first). */
function Private({ children, onboarding = true }: { children: ReactNode; onboarding?: boolean }) {
  const { user, restoring } = useAuth();
  const location = useLocation();
  if (restoring) return <Loading label="Đang khôi phục phiên đăng nhập…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (onboarding && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** /challenge-5min: start (or resume) today's challenge and open it. */
function DailyChallenge() {
  const navigate = useNavigate();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api
      .post<{ session: Session }>('/practice/sessions', { kind: 'daily' })
      .then((r) => navigate(`/session/${r.session.id}`, { replace: true }))
      .catch((err) => {
        toast.error(errorMessage(err));
        navigate('/dashboard', { replace: true });
      });
  }, [navigate]);
  return <Loading label="Đang chuẩn bị thử thách hôm nay…" />;
}

const p = (el: ReactNode, onboarding = true) => <Private onboarding={onboarding}>{el}</Private>;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <TutorProvider>
          <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/onboarding" element={p(<OnboardingPage />, false)} />
            <Route path="/dashboard" element={p(<DashboardPage />)} />
            <Route path="/practice" element={p(<PracticePage />)} />
            <Route path="/session/:id" element={p(<SessionPage />, false)} />
            <Route path="/challenge-5min" element={p(<DailyChallenge />)} />
            <Route path="/library" element={p(<LibraryPage />)} />
            <Route path="/error-notebook" element={p(<NotebookPage />)} />
            <Route path="/error-notebook/print" element={p(<NotebookPrintPage />)} />
            <Route path="/solution/:id" element={p(<SolutionPage />)} />
            <Route path="/golden-time" element={p(<GoldenTimePage />)} />
            <Route path="/roadmap" element={p(<RoadmapPage />)} />
            <Route path="/analytics" element={p(<AnalyticsPage />)} />
            <Route path="/leaderboard" element={p(<LeaderboardPage />)} />
            <Route path="/achievements" element={p(<AchievementsPage />)} />
            <Route path="/shop" element={p(<ShopPage />)} />
            <Route path="/profile" element={p(<ProfilePage />)} />
            <Route path="/upgrade" element={p(<UpgradePage />)} />
            <Route path="/upgrade/result" element={p(<UpgradeResultPage />, false)} />
            <Route path="/support" element={p(<SupportPage />)} />
            <Route path="/admin" element={p(<AdminPage />, false)} />

            {/* Paths used by earlier versions of the app. */}
            <Route path="/exam-room/*" element={<Navigate to="/practice" replace />} />
            <Route path="/test-library" element={<Navigate to="/practice" replace />} />
            <Route path="/error-review" element={<Navigate to="/error-notebook" replace />} />
            <Route path="/flashcards" element={<Navigate to="/golden-time" replace />} />
            <Route path="/goal-selection" element={<Navigate to="/onboarding" replace />} />
            <Route path="/subject-selection" element={<Navigate to="/onboarding" replace />} />
            <Route path="/placement-test" element={<Navigate to="/onboarding" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </TutorProvider>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

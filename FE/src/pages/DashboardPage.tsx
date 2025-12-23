/**
 * Dashboard Page Component
 * Main app page after authentication and onboarding
 */

import { useState, useEffect } from 'react';
import { TestsHub } from '../components/TestsHub';
import { LearningRoadmapEnhanced } from '../components/roadmap/LearningRoadmapEnhanced';
import { DashboardOptimized } from '../components/DashboardOptimized';
import { AITeacherPracticeContainer } from '../components/aiTeacher/AITeacherPracticeContainer';
import { StudyStreak } from '../components/StudyStreak';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { Mascot } from '../components/Mascot';
import { ProfilePage } from '../components/ProfilePage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Target } from 'lucide-react';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Tab mặc định
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [showAITeacherPractice, setShowAITeacherPractice] = useState(false);
  const [selectedAITopic, setSelectedAITopic] = useState('');
  
  // Fetch user stats from API
  const [userStats, setUserStats] = useState({
    streak: 0,
    xp: 0,
    level: 1,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch user stats when authenticated
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        
        // Fetch stats and streak in parallel
        const [stats, streak] = await Promise.all([
          userService.getStats(),
          userService.getStreak(),
        ]);
        
        setUserStats({
          streak: streak.currentStreak,
          xp: stats.currentXP,
          level: stats.level,
        });
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  // --- HÀM ĐIỀU HƯỚNG MỚI (QUAN TRỌNG) ---
  const handleOpenFlashcards = () => {
    navigate('/flashcards'); // Chuyển đến route /flashcards
  };

  const handleOpenErrorReview = () => {
    navigate('/error-review'); // Chuyển đến route /error-review
  };

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          {/* Top row: Logo + Navigation + User info */}
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-8 flex-1">
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setActiveTab('dashboard');
                  navigate('/dashboard');
                }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-slate-700 font-bold">QuizMe</h1>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-10 bg-slate-100/50 border border-slate-200 p-1 rounded-lg">
                  <TabsTrigger 
                    value="dashboard" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    Daily Quiz
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="tests" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/test-library')}
                  >
                    Phòng Thi
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="analytics" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/analytics')}
                  >
                    Phân Tích
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="roadmap" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/roadmap')}
                  >
                    Lộ Trình
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="profile" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/profile')}
                  >
                    Thành Tích
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Right: User Stats + Mascot */}
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="flex items-center gap-3">
                <StudyStreak streak={userStats.streak} />
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1.5 rounded-full border border-purple-200">
                  <span className="text-slate-700 font-medium text-sm">
                    Level {user?.level || userStats.level} – {user?.xp || userStats.xp} XP
                  </span>
                </div>
              </div>

              {/* Mascot Avatar */}
              <button
                onClick={() => navigate('/profile')}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-md relative"
              >
                <span className="text-xl">👋</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="hidden">
            <TabsList></TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardOptimized 
              onStartChallenge5Min={() => navigate('/challenge-5min')}
              onStartAITeacherPractice={(topic) => {
                setSelectedAITopic(topic);
                setShowAITeacherPractice(true);
              }}

              onOpenFlashcards={handleOpenFlashcards}
              onOpenErrorReview={handleOpenErrorReview}
            />
          </TabsContent>
          
          <TabsContent value="roadmap">
            <LearningRoadmapEnhanced />
          </TabsContent>

          <TabsContent value="tests">
            <TestsHub onOpenExamRoom={() => navigate('/exam-room')} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="profile">
            <ProfilePage />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Mascot */}
      <div className="fixed bottom-8 right-8 z-40 animate-float">
        <Mascot position="floating" size="large" emotion="happy" />
      </div>

      {/* Overlays/Modals */}
      {showAITeacherPractice && (
        <div className="fixed inset-0 z-50">
          <AITeacherPracticeContainer
            topic={selectedAITopic}
            onClose={() => setShowAITeacherPractice(false)}
          />
        </div>
      )}
    </div>
  );
}
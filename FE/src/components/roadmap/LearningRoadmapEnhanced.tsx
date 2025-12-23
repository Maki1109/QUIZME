import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { StageNode, type Stage } from './StageNode';
import { StageDetailModal } from './StageDetailModal';
import { RoadmapPath } from './RoadmapPath';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Trophy, Map, Target, Zap, Star, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Default Stages Data (Đã chỉnh tất cả thành unlocked/active) ---
const DEFAULT_STAGES: Stage[] = [
  {
    id: 1,
    title: 'Hàm Số Cơ Bản',
    description: 'Tìm hiểu khái niệm hàm số, đồ thị và các tính chất cơ bản',
    progress: 0,
    status: 'active', // Đang học
    totalLessons: 5,
    completedLessons: 0,
    totalQuestions: 50,
    correctQuestions: 0,
    bossUnlocked: true, // Mở boss
    bossDefeated: false,
    icon: '📈',
    color: 'from-blue-500 to-cyan-600',
    side: 'left',
    xp: 500,
    earnedXP: 0
  },
  {
    id: 2,
    title: 'Logarit',
    description: 'Học về logarit, tính chất và ứng dụng',
    progress: 0,
    status: 'active', 
    totalLessons: 5,
    completedLessons: 0,
    totalQuestions: 50,
    correctQuestions: 0,
    bossUnlocked: true,
    bossDefeated: false,
    icon: '🔢',
    color: 'from-purple-500 to-pink-600',
    side: 'right',
    xp: 600,
    earnedXP: 0
  },
  {
    id: 3,
    title: 'Lượng Giác',
    description: 'Khám phá các hàm lượng giác và phương trình',
    progress: 0,
    status: 'active', 
    totalLessons: 6,
    completedLessons: 0,
    totalQuestions: 60,
    correctQuestions: 0,
    bossUnlocked: true,
    bossDefeated: false,
    icon: '📐',
    color: 'from-green-500 to-teal-600',
    side: 'left',
    xp: 700,
    earnedXP: 0
  },
  {
    id: 4,
    title: 'Hình Học Không Gian',
    description: 'Học về hình học 3D và tính toán thể tích',
    progress: 0,
    status: 'active',
    totalLessons: 7,
    completedLessons: 0,
    totalQuestions: 70,
    correctQuestions: 0,
    bossUnlocked: true,
    bossDefeated: false,
    icon: '🔷',
    color: 'from-orange-500 to-red-600',
    side: 'right',
    xp: 800,
    earnedXP: 0
  },
  {
    id: 5,
    title: 'Đạo Hàm & Tích Phân',
    description: 'Làm chủ các phép tính vi tích phân',
    progress: 0,
    status: 'active', 
    totalLessons: 8,
    completedLessons: 0,
    totalQuestions: 80,
    correctQuestions: 0,
    bossUnlocked: true,
    bossDefeated: false,
    icon: '∫',
    color: 'from-pink-500 to-rose-600',
    side: 'left',
    xp: 900,
    earnedXP: 0
  },
  {
    id: 6,
    title: 'Số Phức',
    description: 'Làm quen với tập số phức',
    progress: 0,
    status: 'active', 
    totalLessons: 4,
    completedLessons: 0,
    totalQuestions: 40,
    correctQuestions: 0,
    bossUnlocked: true,
    bossDefeated: false,
    icon: 'ℹ️',
    color: 'from-indigo-500 to-violet-600',
    side: 'right',
    xp: 600,
    earnedXP: 0
  }
];

export const LearningRoadmapEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [challengeCount, setChallengeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pathSegments, setPathSegments] = useState<any[]>([]);

  // 1. Fetch Data
  useEffect(() => {
    const initializeRoadmap = async () => {
      try {
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Lấy số lượng challenge
        const historyRes = await fetch('${import.meta.env.VITE_API_URL}/challenges/history', { headers });
        const historyData = await historyRes.json();
        const count = historyData.success ? historyData.count : 0;
        setChallengeCount(count);

        // Kích hoạt personalized nếu đủ 3 bài
        if (count >= 3) {
           setIsPersonalized(true); 
        }

      } catch (error) {
        console.error("Lỗi khởi tạo roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeRoadmap();
  }, []);

  // 2. Calculate path segments
  useEffect(() => {
    if (!containerRef.current || stages.length === 0) return;

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const nodes = container.querySelectorAll('[data-stage-id]');
      const segments: any[] = [];
      
      nodes.forEach((node, index) => {
        if (index < nodes.length - 1) {
          const currentRect = node.getBoundingClientRect();
          const nextNode = nodes[index + 1];
          if (nextNode) {
            const nextRect = nextNode.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            segments.push({
              startX: currentRect.left - containerRect.left + currentRect.width / 2,
              startY: currentRect.bottom - containerRect.top,
              endX: nextRect.left - containerRect.left + nextRect.width / 2,
              endY: nextRect.top - containerRect.top,
              completed: false,
              active: true
            });
          }
        }
      });
      setPathSegments(segments);
    }, 100);

    return () => clearTimeout(timer);
  }, [stages, loading]);

  const handleStageClick = (stage: Stage) => {
    setSelectedStage(stage);
  };

  const handleStartChallenge = () => {
    navigate('/challenge-5min');
  };

  const totalStages = stages.length;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const overallProgress = Math.round((completedStages / totalStages) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 mb-4"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center">
            <Map className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-3xl mb-2 font-bold"
        >
          🗺️ Lộ Trình Chinh Phục
        </motion.h2>
        <p className="text-gray-600">Hành trình từ tân binh đến cao thủ</p>
      </div>

      {/* --- PERSONALIZATION BANNER --- */}
      {!isPersonalized && !loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-1 shadow-lg"
        >
          <div className="bg-white rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Mở khóa phân tích AI
                </h3>
                <p className="text-gray-600">
                  Hãy hoàn thành <strong>{3 - challengeCount} bài Challenge 5 Phút</strong> nữa để AI đánh giá chính xác năng lực của bạn!
                </p>
              </div>
            </div>
            <Button 
              onClick={handleStartChallenge}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg whitespace-nowrap"
            >
              Làm Challenge Ngay ({challengeCount}/3)
            </Button>
          </div>
        </motion.div>
      )}

      {/* Overall Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-bold">{overallProgress}%</div>
                  <div className="text-sm text-gray-600">Tiến độ tổng</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-md">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-2xl text-gray-900 font-bold">{completedStages}/{totalStages}</div>
                  <div className="text-sm text-gray-600">Chặng hoàn thành</div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Roadmap Container */}
      <div
        ref={containerRef}
        className="relative min-h-[1500px] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 md:p-12 overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #9333ea 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        {/* SVG Paths */}
        {pathSegments.length > 0 && <RoadmapPath segments={pathSegments} />}

        {/* Stage Nodes */}
        <div className="relative z-10 space-y-32">
          {stages.map((stage, index) => (
            <motion.div
              key={stage.id}
              data-stage-id={stage.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring' }}
              className={`flex ${stage.side === 'left' ? 'justify-start' : 'justify-end'}`}
            >
              <div className="w-full md:w-1/2">
                
                {/* ✅ SỬA: Luôn hiện gợi ý ở Stage đầu tiên (index === 0) khi đã cá nhân hóa */}
                {isPersonalized && index === 0 && (
                  <div className={`mb-2 flex ${stage.side === 'left' ? 'justify-start' : 'justify-end'}`}>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-bounce shadow-sm border border-red-200">
                      <AlertCircle className="w-3 h-3" /> GỢI Ý HỌC TỪ AI
                    </span>
                  </div>
                )}
                
                <StageNode
                  stage={stage}
                  onClick={handleStageClick}
                  onStartBoss={() => console.log('Boss')}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>

      {/* Motivational Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-4 text-center md:text-left md:justify-start">
              <TrendingUp className="w-12 h-12 flex-shrink-0" />
              <div>
                <h3 className="mb-1 font-bold text-lg">💪 Tiếp tục cố gắng!</h3>
                <p className="text-white/90">
                  Mọi hành trình vạn dặm đều bắt đầu từ một bước chân. Hãy chọn một chủ đề và bắt đầu ngay!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stage Detail Modal */}
      <StageDetailModal
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
        onStartLesson={() => {}}
        onStartBoss={() => {}}
      />
    </div>
  );
};
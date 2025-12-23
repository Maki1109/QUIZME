import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, CheckCircle, Lock, Video, BookOpen, Trophy, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import type { Stage } from './StageNode';

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'reading' | 'practice';
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface StageDetailModalProps {
  stage: Stage | null;
  onClose: () => void;
  onStartLesson: (lessonId: number) => void;
  onStartBoss: (stageId: number) => void;
}

export const StageDetailModal: React.FC<StageDetailModalProps> = ({
  stage,
  onClose,
  onStartLesson,
  onStartBoss
}) => {
  if (!stage) return null;

  // Mock lessons data
  const lessons: Lesson[] = [
    { id: 1, title: 'Giới thiệu khái niệm', type: 'video', duration: '10 phút', completed: true, locked: false },
    { id: 2, title: 'Lý thuyết cơ bản', type: 'reading', duration: '15 phút', completed: true, locked: false },
    { id: 3, title: 'Bài tập vận dụng', type: 'practice', duration: '20 phút', completed: true, locked: false },
    { id: 4, title: 'Lý thuyết nâng cao', type: 'video', duration: '12 phút', completed: false, locked: false },
    { id: 5, title: 'Bài tập khó', type: 'practice', duration: '25 phút', completed: false, locked: stage.progress < 60 },
  ];

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'reading': return <BookOpen className="w-4 h-4" />;
      case 'practice': return <Star className="w-4 h-4" />;
      default: return null;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'reading': return 'Đọc';
      case 'practice': return 'Luyện tập';
      default: return '';
    }
  };

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-700 border-red-200';
      case 'reading': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'practice': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-4xl`}>
                  {stage.icon}
                </div>
                <div>
                  <h2 className="text-gray-900 mb-1">Stage {stage.id}: {stage.title}</h2>
                  <p className="text-gray-600">{stage.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Overview */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">Tiến độ</div>
                  <div className="text-2xl text-blue-600">{stage.progress}%</div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">Bài học</div>
                  <div className="text-2xl text-purple-600">
                    {stage.completedLessons}/{stage.totalLessons}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-green-50 to-teal-50">
                <CardContent className="p-4">
                  <div className="text-sm text-gray-600 mb-1">XP</div>
                  <div className="text-2xl text-green-600">
                    {stage.earnedXP}/{stage.xp}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lessons List */}
          <div className="p-6">
            <h3 className="text-gray-900 mb-4">📚 Danh sách bài học</h3>
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className={`border-2 transition-all ${
                      lesson.locked
                        ? 'opacity-50 border-gray-300'
                        : lesson.completed
                        ? 'border-green-300 bg-green-50/50'
                        : 'border-orange-300 hover:shadow-md'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Lesson Number */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                          lesson.completed
                            ? 'bg-green-500'
                            : lesson.locked
                            ? 'bg-gray-400'
                            : 'bg-orange-500'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : lesson.locked ? (
                            <Lock className="w-5 h-5" />
                          ) : (
                            <span>{lesson.id}</span>
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-gray-900">{lesson.title}</h4>
                            <Badge className={`${getLessonTypeColor(lesson.type)} text-xs border`}>
                              {getLessonIcon(lesson.type)}
                              <span className="ml-1">{getLessonTypeLabel(lesson.type)}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>⏱️ {lesson.duration}</span>
                            {lesson.completed && (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Hoàn thành
                              </span>
                            )}
                            {lesson.locked && (
                              <span className="text-gray-500">
                                🔒 Cần {60}% tiến độ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        {!lesson.locked && (
                          <Button
                            size="sm"
                            variant={lesson.completed ? 'outline' : 'default'}
                            onClick={() => onStartLesson(lesson.id)}
                            className={lesson.completed ? '' : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white'}
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            {lesson.completed ? 'Xem lại' : 'Bắt đầu'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Boss Battle Section */}
            {stage.bossUnlocked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6"
              >
                <Card className={`border-2 ${
                  stage.bossDefeated
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50'
                    : 'border-red-500 bg-gradient-to-br from-red-50 to-pink-50'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 mb-1">
                            {stage.bossDefeated ? '👑 Boss đã hạ gục!' : '🔥 Boss Battle'}
                          </h3>
                          <p className="text-gray-600">
                            {stage.bossDefeated 
                              ? 'Bạn đã chinh phục thử thách này!'
                              : 'Kiểm tra tổng hợp toàn bộ kiến thức'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="text-gray-600">⏱️ 30 phút</span>
                            <span className="text-gray-600">📝 20 câu</span>
                            <span className="text-purple-600">+300 XP</span>
                          </div>
                        </div>
                      </div>
                      {!stage.bossDefeated && (
                        <Button
                          size="lg"
                          onClick={() => onStartBoss(stage.id)}
                          className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
                        >
                          <Trophy className="w-5 h-5 mr-2" />
                          Thách đấu ngay!
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Unlock Condition */}
            {!stage.bossUnlocked && (
              <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <Trophy className="w-5 h-5" />
                  <span className="text-sm">
                    Hoàn thành {stage.totalLessons} bài học để mở khóa Boss Battle
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { CheckCircle, Lock, Trophy, PlayCircle, RotateCcw, Star, BookOpen, Video } from 'lucide-react';

export interface Stage {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'active' | 'locked';
  totalLessons: number;
  completedLessons: number;
  totalQuestions: number;
  correctQuestions: number;
  bossUnlocked: boolean;
  bossDefeated: boolean;
  icon: string;
  color: string;
  side: 'left' | 'right';
  xp: number;
  earnedXP: number;
}

interface StageNodeProps {
  stage: Stage;
  onClick: (stage: Stage) => void;
  onStartBoss?: (stageId: number) => void;
}

export const StageNode: React.FC<StageNodeProps> = ({ stage, onClick, onStartBoss }) => {
  const getStatusColor = () => {
    switch (stage.status) {
      case 'completed': return 'from-green-500 to-teal-600';
      case 'active': return 'from-orange-500 to-pink-600';
      case 'locked': return 'from-gray-400 to-gray-500';
      default: return 'from-blue-500 to-purple-600';
    }
  };

  const getStatusIcon = () => {
    switch (stage.status) {
      case 'completed': return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'active': return <PlayCircle className="w-6 h-6 text-orange-400" />;
      case 'locked': return <Lock className="w-6 h-6 text-gray-400" />;
      default: return null;
    }
  };

  const getStatusLabel = () => {
    switch (stage.status) {
      case 'completed': return '✅ Hoàn thành';
      case 'active': return '⏳ Đang học';
      case 'locked': return '🔒 Chưa mở';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={stage.status !== 'locked' ? { scale: 1.05, y: -10 } : {}}
      className={`relative ${stage.side === 'left' ? 'mr-auto' : 'ml-auto'} w-full max-w-md`}
    >
      <Card 
        className={`cursor-pointer border-2 transition-all ${
          stage.status === 'locked' 
            ? 'opacity-60 border-gray-400' 
            : stage.status === 'completed'
            ? 'border-green-500 shadow-lg shadow-green-500/20'
            : 'border-orange-500 shadow-lg shadow-orange-500/20'
        }`}
        onClick={() => stage.status !== 'locked' && onClick(stage)}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getStatusColor()} flex items-center justify-center text-3xl`}>
                {stage.icon}
              </div>
              <div>
                <h3 className="text-gray-900 mb-1">Stage {stage.id}</h3>
                <p className="text-sm text-gray-600">{stage.title}</p>
              </div>
            </div>
            {getStatusIcon()}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">{stage.description}</p>

          {/* Status Badge */}
          <Badge 
            className={`mb-4 ${
              stage.status === 'completed' 
                ? 'bg-green-100 text-green-700'
                : stage.status === 'active'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {getStatusLabel()}
          </Badge>

          {/* Progress Bar */}
          {stage.status !== 'locked' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Tiến độ</span>
                <span className="text-gray-900">{stage.progress}%</span>
              </div>
              <Progress value={stage.progress} className="h-3" />
            </div>
          )}

          {/* Stats Grid */}
          {stage.status !== 'locked' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-gray-600">Bài học</span>
                </div>
                <div className="text-lg text-gray-900">
                  {stage.completedLessons}/{stage.totalLessons}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-gray-600">Câu hỏi</span>
                </div>
                <div className="text-lg text-gray-900">
                  {stage.correctQuestions}/{stage.totalQuestions}
                </div>
              </div>
            </div>
          )}

          {/* XP Info */}
          {stage.status !== 'locked' && (
            <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">XP đã nhận</span>
                <span className="text-purple-600">
                  {stage.earnedXP}/{stage.xp} XP
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {stage.status === 'locked' && (
            <div className="text-center text-sm text-gray-500">
              🔒 Yêu cầu: Hoàn thành Stage {stage.id - 1}
            </div>
          )}

          {stage.status === 'active' && (
            <div className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(stage);
                }}
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Tiếp tục học
              </Button>
              
              {stage.bossUnlocked && !stage.bossDefeated && (
                <Button 
                  variant="outline"
                  className="w-full border-red-500 text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartBoss && onStartBoss(stage.id);
                  }}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Thách đấu Boss
                </Button>
              )}
            </div>
          )}

          {stage.status === 'completed' && (
            <div className="space-y-2">
              <Button 
                variant="outline"
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(stage);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Ôn lại
              </Button>
              
              {stage.bossDefeated && (
                <div className="flex items-center justify-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded-lg">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">Boss đã hạ gục! 🏆</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Badge for Boss */}
      {stage.bossUnlocked && !stage.bossDefeated && stage.status === 'active' && (
        <motion.div
          className="absolute -top-3 -right-3"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
        </motion.div>
      )}

      {/* Completion Crown */}
      {stage.status === 'completed' && stage.bossDefeated && (
        <motion.div
          className="absolute -top-4 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <span className="text-4xl">👑</span>
        </motion.div>
      )}
    </motion.div>
  );
};

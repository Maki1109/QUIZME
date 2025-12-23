import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Clock, Star, TrendingUp, Award, Zap, Users, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface RankingModeProps {
  onStartDaily: () => void;
  onBack: () => void;
}

const RankingMode: React.FC<RankingModeProps> = ({ onStartDaily, onBack }) => {
  // Mock data
  const weeklyLeaderboard = [
    { rank: 1, name: 'Nguyễn Văn A', score: 8750, avatar: '👨', streak: 7, level: 12 },
    { rank: 2, name: 'Trần Thị B', score: 8240, avatar: '👩', streak: 6, level: 11 },
    { rank: 3, name: 'Lê Văn C', score: 7890, avatar: '👨', streak: 7, level: 10 },
    { rank: 4, name: 'Phạm Thị D', score: 7520, avatar: '👩', streak: 5, level: 10 },
    { rank: 5, name: 'Hoàng Văn E', score: 7150, avatar: '👨', streak: 4, level: 9 },
    { rank: 6, name: 'Đặng Thị F', score: 6890, avatar: '👩', streak: 7, level: 9 },
    { rank: 7, name: 'Vũ Văn G', score: 6520, avatar: '👨', streak: 3, level: 8 },
    { rank: 8, name: 'Ngô Thị H', score: 6240, avatar: '👩', streak: 6, level: 8 },
    { rank: 9, name: 'Bùi Văn I', score: 5980, avatar: '👨', streak: 5, level: 8 },
    { rank: 10, name: 'Trịnh Thị K', score: 5720, avatar: '👩', streak: 4, level: 7 },
  ];

  const currentUser = {
    rank: 24,
    name: 'Bạn',
    score: 4520,
    todayScore: 320,
    completedToday: true,
    streak: 12,
    level: 8
  };

  const dailyMissions = [
    { id: 1, title: 'Hoàn thành 10 câu hỏi', progress: 10, total: 10, points: 100, completed: true },
    { id: 2, title: 'Đạt 80% độ chính xác', progress: 85, total: 100, points: 150, completed: true },
    { id: 3, title: 'Học liên tục 3 ngày', progress: 3, total: 3, points: 200, completed: true },
  ];

  const weekRewards = [
    { rank: '🥇 Top 1', reward: '10,000 XP + Huy hiệu Vàng' },
    { rank: '🥈 Top 2-5', reward: '5,000 XP + Huy hiệu Bạc' },
    { rank: '🥉 Top 6-10', reward: '2,500 XP + Huy hiệu Đồng' },
    { rank: '🎯 Top 11-50', reward: '1,000 XP' },
  ];

  const [activeTab, setActiveTab] = useState('overview');

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getProgressToNextRank = () => {
    const nextRankScore = 4670; // Mock score needed for rank #23
    const diff = nextRankScore - currentUser.score;
    const progress = (currentUser.score / nextRankScore) * 100;
    return { diff, progress };
  };

  const { diff, progress } = getProgressToNextRank();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white mb-2">🏆 LEO RANK</h1>
          <p className="text-purple-300 text-lg">Cạnh tranh toàn quốc - Tuần này</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
            <TabsTrigger value="rewards">Phần thưởng</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* User Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-3">
                      <span className="text-3xl">👤</span>
                    </div>
                    <h2 className="text-white mb-1">Xếp hạng của bạn</h2>
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-2xl text-purple-300">#{currentUser.rank}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-slate-900/50">
                      <div className="text-2xl text-purple-400">{currentUser.score.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Điểm tuần này</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-900/50">
                      <div className="text-2xl text-cyan-400">+{currentUser.todayScore}</div>
                      <div className="text-xs text-slate-400">Điểm hôm nay</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-900/50">
                      <div className="text-2xl text-orange-400">{currentUser.streak}🔥</div>
                      <div className="text-xs text-slate-400">Streak</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-900/50">
                      <div className="text-2xl text-green-400">Lv.{currentUser.level}</div>
                      <div className="text-xs text-slate-400">Level</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-300">Tiến độ lên #{currentUser.rank - 1}</span>
                      <span className="text-purple-400">Còn {diff} điểm</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>

                  {currentUser.completedToday ? (
                    <div className="p-4 rounded-lg bg-green-500/20 border-2 border-green-500/30 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-300">
                        <Star className="w-5 h-5" />
                        <span>✅ Đã hoàn thành nhiệm vụ hôm nay! (+{currentUser.todayScore} điểm)</span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={onStartDaily}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                      size="lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Làm nhiệm vụ hôm nay
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Daily Missions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-slate-900/50 border-2 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h3 className="text-white">Nhiệm vụ hàng ngày</h3>
                  </div>

                  <div className="space-y-3">
                    {dailyMissions.map((mission, index) => (
                      <motion.div
                        key={mission.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        className="p-4 rounded-lg bg-slate-800/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm">{mission.title}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400 text-sm">+{mission.points} điểm</span>
                            {mission.completed && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                          </div>
                        </div>
                        <Progress value={(mission.progress / mission.total) * 100} className="h-2" />
                        <div className="text-xs text-slate-400 mt-1">
                          {mission.progress}/{mission.total}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="bg-slate-900/50 border-2 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-white">Top 10 tuần này</h3>
                  <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>15,678 người tham gia</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {weeklyLeaderboard.map((player, index) => (
                    <motion.div
                      key={player.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg transition-all ${
                        player.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl w-10 text-center">
                          {getRankEmoji(player.rank)}
                        </span>
                        <span className="text-2xl">{player.avatar}</span>
                        <div className="flex-1">
                          <div className="text-white">{player.name}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Lv.{player.level}
                            </span>
                            <span className="flex items-center gap-1">
                              🔥 {player.streak} ngày
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-400">
                            {player.score.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">điểm</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Current user */}
                  <div className="border-t-2 border-slate-700 pt-3 mt-3">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-2 border-cyan-500/30">
                      <div className="flex items-center gap-4">
                        <span className="text-cyan-400">🎯 #{currentUser.rank}</span>
                        <span className="text-2xl">👤</span>
                        <div className="flex-1">
                          <div className="text-white">{currentUser.name}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              Lv.{currentUser.level}
                            </span>
                            <span className="flex items-center gap-1">
                              🔥 {currentUser.streak} ngày
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-400">
                            {currentUser.score.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            ↑+2 Còn {diff}đ lên #23
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <Card className="bg-slate-900/50 border-2 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-white">Phần thưởng cuối tuần</h3>
                </div>

                <div className="space-y-4 mb-8">
                  {weekRewards.map((reward, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white text-lg">{reward.rank}</span>
                        <span className="text-purple-300">{reward.reward}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 rounded-lg bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border-2 border-yellow-500/30">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                    <h4 className="text-white mb-2">Thời gian còn lại</h4>
                    <div className="text-3xl text-yellow-400 mb-2">3 ngày 14 giờ</div>
                    <p className="text-slate-300 text-sm">
                      Kết thúc vào Chủ nhật, 23:59
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-cyan-900/20 border-2 border-cyan-500/30">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="mb-2"><strong className="text-white">💡 Mẹo:</strong></p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Hoàn thành nhiệm vụ hàng ngày để tối đa hóa điểm</li>
                        <li>Duy trì streak để nhận bonus điểm</li>
                        <li>Làm đề khó hơn để được điểm cao hơn</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Back Button */}
        <div className="flex justify-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            ← Quay lại Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RankingMode;

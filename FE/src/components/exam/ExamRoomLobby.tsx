import React from 'react';
import { motion } from 'motion/react';
import { Zap, Mountain, Trophy, Users, Clock, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface ExamRoomLobbyProps {
  onStartSprint: () => void;
  onStartMarathon: () => void;
  onStartRanking: () => void;
  onBack: () => void;
}

const ExamRoomLobby: React.FC<ExamRoomLobbyProps> = ({
  onStartSprint,
  onStartMarathon,
  onBack
}) => {
  // Mock leaderboard data (Giữ nguyên)
  const leaderboard = [
    { rank: 1, name: 'Nguyễn Văn A', score: 8750, emoji: '🥇' },
    { rank: 2, name: 'Trần Thị B', score: 8240, emoji: '🥈' },
    { rank: 3, name: 'Lê Văn C', score: 7890, emoji: '🥉' },
    { rank: 4, name: 'Phạm Thị D', score: 7520, emoji: '' },
    { rank: 5, name: 'Hoàng Văn E', score: 7150, emoji: '' },
  ];

  const currentUserRank = 24;
  const currentUserScore = 4520;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 mb-6 shadow-lg shadow-orange-500/20">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white mb-3 text-3xl font-bold tracking-tight">📝 PHÒNG THI</h1>
          <p className="text-cyan-300 text-lg">Chọn loại đề thi để thử thách bản thân!</p>
        </motion.div>

        {/* 2 Mode Cards */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* SPRINT Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-cyan-900/50 to-cyan-950/50 border-2 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 mb-4 shadow-lg shadow-cyan-500/20">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white mb-2 text-xl font-bold">⚡ Test 15 Phút</h3>
                  <p className="text-cyan-300">15 Phút</p>
                </div>

                <div className="space-y-3 mb-6 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Câu hỏi:</span>
                    <span className="text-white">15 câu</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Thời gian:</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      15:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Độ khó:</span>
                    <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs">
                      Trung bình
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Phần thưởng:</span>
                    <span className="text-purple-400">+150 XP</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-center text-slate-400 text-sm mb-1 italic">
                    Tốc độ là tất cả
                  </p>
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs">
                    <Users className="w-3 h-3" />
                    <span>1,234 người đang chơi</span>
                  </div>
                </div>

                <Button
                  onClick={onStartSprint}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white font-bold rounded-xl"
                >
                  Bắt đầu
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* MARATHON Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-orange-900/50 to-red-950/50 border-2 border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-105 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-4 shadow-lg shadow-orange-500/20">
                    <Mountain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white mb-2 text-xl font-bold">🏔️ Kiểm tra full đề 90 Phút</h3>
                  <p className="text-orange-300">90 Phút</p>
                </div>

                <div className="space-y-3 mb-6 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Câu hỏi:</span>
                    <span className="text-white">40 câu</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Thời gian:</span>
                    <span className="text-white flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      90:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Độ khó:</span>
                    <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-300 text-xs">
                      Khó
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Phần thưởng:</span>
                    <span className="text-purple-400">+500 XP</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-center text-slate-400 text-sm mb-1 italic">
                    Thử thách sức bền
                  </p>
                  <div className="flex items-center justify-center gap-1 text-slate-500 text-xs">
                    <Users className="w-3 h-3" />
                    <span>892 người đang chơi</span>
                  </div>
                </div>

                <Button
                  onClick={onStartMarathon}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl"
                >
                  Bắt đầu
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <Card className="bg-slate-900/50 border-2 border-purple-500/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-white font-bold text-lg">🏆 BẢNG XẾP HẠNG TUẦN NÀY</h3>
              </div>

              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl w-8 text-center">
                        {player.emoji || `#${player.rank}`}
                      </span>
                      <span className="text-white font-medium">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-semibold">
                        {player.score.toLocaleString()} điểm
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Current user position */}
                <div className="border-t-2 border-slate-700 pt-3 mt-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-2 border-cyan-500/30">
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400 font-bold">🎯 #{currentUserRank}</span>
                      <span className="text-white font-bold">Bạn</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-purple-400 font-bold">
                        {currentUserScore.toLocaleString()} điểm
                      </span>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <span>↑+2</span>
                        <span className="text-slate-400">Còn 150đ lên #23</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back Button - Đã đổi sang màu tím */}
        <div className="flex justify-center mt-12">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 h-11 px-8 rounded-xl font-medium transition-all"
          >
            ← Quay lại Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamRoomLobby;
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, Lock, Trophy, Sword, Map, Star, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Mascot } from './Mascot';

const roadmapStages = [
  {
    id: 1,
    title: 'Chặng 1: Hàm Số',
    location: 'Đảo Hàm Số',
    progress: 90,
    status: 'active',
    chapters: 5,
    completedChapters: 4,
    boss: 'Kiểm tra tổng hợp Hàm số',
    bossDefeated: false,
    icon: '📈',
    color: 'from-blue-400 to-cyan-500',
    side: 'left' // left or right
  },
  {
    id: 2,
    title: 'Chặng 2: Logarit',
    location: 'Thành Logarit',
    progress: 45,
    status: 'unlocked',
    chapters: 4,
    completedChapters: 2,
    boss: 'Boss Logarit Khó',
    bossDefeated: false,
    icon: '🔢',
    color: 'from-purple-400 to-pink-500',
    side: 'right'
  },
  {
    id: 3,
    title: 'Chặng 3: Hình Học',
    location: 'Vương Quốc Hình Học',
    progress: 0,
    status: 'locked',
    chapters: 6,
    completedChapters: 0,
    boss: 'Đại Boss Hình Học',
    bossDefeated: false,
    icon: '📐',
    color: 'from-green-400 to-teal-500',
    side: 'left'
  },
  {
    id: 4,
    title: 'Chặng 4: Đạo Hàm',
    location: 'Đỉnh Đạo Hàm',
    progress: 0,
    status: 'locked',
    chapters: 5,
    completedChapters: 0,
    boss: 'Boss Cuối - Tích Phân',
    bossDefeated: false,
    icon: '∫',
    color: 'from-orange-400 to-red-500',
    side: 'right'
  }
];

const checkpoints = [
  { id: 1, stageId: 1, title: 'Khái niệm cơ bản', completed: true },
  { id: 2, stageId: 1, title: 'Tính chất', completed: true },
  { id: 3, stageId: 1, title: 'Đồ thị', completed: true },
  { id: 4, stageId: 1, title: 'Cực trị', completed: true },
  { id: 5, stageId: 1, title: 'Ứng dụng', completed: false },
];

export function LearningRoadmap() {
  const activeStageIndex = roadmapStages.findIndex(s => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header with Map Icon */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white border-0 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Map className="w-12 h-12" />
              </motion.div>
              <div>
                <h2 className="text-white text-2xl mb-1">🗺️ Bản Đồ Hành Trình</h2>
                <p className="text-white/90">Khám phá từng đảo kiến thức theo trình tự!</p>
              </div>
            </div>
            <Mascot emotion="excited" size="large" />
          </div>
        </CardContent>
      </Card>

      {/* Vertical Journey Path */}
      <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 md:p-12 border-4 border-purple-200 shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20 overflow-hidden rounded-3xl">
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Center Path Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-0">
          <motion.div
            className="w-full h-full bg-gradient-to-b from-blue-400 via-purple-500 to-pink-500"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
          />
        </div>

        {/* Stages */}
        <div className="relative z-10 space-y-24">
          {roadmapStages.map((stage, index) => (
            <div key={stage.id} className="relative">
              {/* Connector Dot on Center Line - BIGGER & MORE COLORFUL */}
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.3, type: 'spring' }}
              >
                {/* Status Icon in the dot */}
                <div className={`w-12 h-12 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white ${
                  stage.status === 'active' 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-400 animate-pulse' 
                    : stage.status === 'locked'
                    ? 'bg-gradient-to-br from-gray-500 to-gray-400'
                    : 'bg-gradient-to-br from-green-500 to-teal-400'
                }`}>
                  {stage.status === 'active' && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-400"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {/* Icon based on status */}
                  {stage.status === 'active' ? (
                    <MapPin className="w-6 h-6 relative z-10" />
                  ) : stage.status === 'locked' ? (
                    <Lock className="w-6 h-6 relative z-10" />
                  ) : (
                    <CheckCircle className="w-6 h-6 relative z-10" />
                  )}
                </div>
              </motion.div>

              {/* Horizontal Connector Line */}
              <div className={`absolute top-1/2 ${
                stage.side === 'left' ? 'right-1/2 mr-4' : 'left-1/2 ml-4'
              } w-16 h-1 -translate-y-1/2 z-10`}>
                <motion.div
                  className={`h-full bg-gradient-to-${stage.side === 'left' ? 'l' : 'r'} ${stage.color}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.3 + 0.2 }}
                  style={{ transformOrigin: stage.side === 'left' ? 'right' : 'left' }}
                />
              </div>

              {/* Stage Card */}
              <motion.div
                initial={{ opacity: 0, x: stage.side === 'left' ? -100 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.3, type: 'spring', stiffness: 100 }}
                className={`flex ${stage.side === 'left' ? 'justify-start pr-1/2 mr-20' : 'justify-end pl-1/2 ml-20'}`}
              >
                <div className="relative max-w-md w-full">
                  {/* Island Shadow */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/20 rounded-full blur-xl" />

                  {/* Main Island Card */}
                  <motion.div
                    whileHover={{ scale: stage.status !== 'locked' ? 1.03 : 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Card className={`relative bg-gradient-to-br ${stage.color} border-4 ${
                      stage.status === 'active' 
                        ? 'border-yellow-400 shadow-2xl' 
                        : stage.status === 'locked'
                        ? 'border-gray-400 filter grayscale'
                        : 'border-white shadow-xl'
                    }`}>
                      {/* Pulsing effect for active stage */}
                      {stage.status === 'active' && (
                        <motion.div
                          className="absolute inset-0 bg-yellow-400 rounded-xl"
                          animate={{ opacity: [0, 0.3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      <CardContent className="p-6 relative z-10">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <motion.div
                            className="text-5xl"
                            animate={stage.status === 'active' ? {
                              scale: [1, 1.15, 1],
                              rotate: [0, 5, -5, 0]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {stage.status === 'locked' ? (
                              <Lock className="w-12 h-12 text-white/50" />
                            ) : (
                              stage.icon
                            )}
                          </motion.div>
                          
                          <div className="flex-1">
                            <h3 className="text-white text-xl mb-1">{stage.title}</h3>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-white/70" />
                              <p className="text-white/80 text-sm">{stage.location}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {stage.status === 'active' && (
                              <Badge className="bg-yellow-400 text-yellow-900">
                                <Star className="w-3 h-3 mr-1" />
                                Đang học
                              </Badge>
                            )}
                            {stage.status === 'locked' && (
                              <Badge className="bg-gray-600 text-white">
                                <Lock className="w-3 h-3 mr-1" />
                                Khóa
                              </Badge>
                            )}
                            {stage.status === 'unlocked' && (
                              <Badge className="bg-green-400 text-green-900">
                                Đã mở
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Progress Section */}
                        {stage.status !== 'locked' && (
                          <>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
                              <div className="flex items-center justify-between text-white/90 text-sm mb-2">
                                <span>{stage.completedChapters}/{stage.chapters} chương hoàn thành</span>
                                <span className="text-lg">{stage.progress}%</span>
                              </div>
                              <Progress value={stage.progress} className="h-3 bg-white/20" />
                            </div>

                            {/* Checkpoints for active stage */}
                            {stage.status === 'active' && (
                              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                                <p className="text-white/90 text-sm mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Tiến độ chi tiết:
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                  {checkpoints.filter(c => c.stageId === stage.id).map((checkpoint) => (
                                    <motion.div
                                      key={checkpoint.id}
                                      whileHover={{ scale: 1.1 }}
                                      className={`aspect-square rounded-lg flex items-center justify-center ${
                                        checkpoint.completed 
                                          ? 'bg-green-400' 
                                          : 'bg-white/30'
                                      }`}
                                      title={checkpoint.title}
                                    >
                                      {checkpoint.completed ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                      ) : (
                                        <div className="w-3 h-3 bg-white rounded-full" />
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Boss Section */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                                  <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white/70 text-xs">Boss cuối chặng</p>
                                  <p className="text-white text-sm">{stage.boss}</p>
                                </div>
                              </div>
                              
                              {stage.progress >= 80 ? (
                                <Button
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 text-white h-10"
                                >
                                  <Sword className="w-4 h-4 mr-2" />
                                  Thách đấu Boss!
                                </Button>
                              ) : (
                                <div className="text-center">
                                  {/* MORE SPECIFIC - Number of chapters instead of percentage */}
                                  <p className="text-white text-sm mb-2">
                                    <span className="text-yellow-300">Hoàn thành {stage.chapters - stage.completedChapters} chương nữa</span> để mở khóa
                                  </p>
                                  <p className="text-white/70 text-xs mb-2">
                                    ({stage.completedChapters}/{stage.chapters} chương đã xong)
                                  </p>
                                  <Progress value={stage.progress} className="h-2 bg-white/20 mt-2" />
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Locked State */}
                        {stage.status === 'locked' && (
                          <div className="text-center py-6">
                            <Lock className="w-12 h-12 text-white/50 mx-auto mb-3" />
                            <p className="text-white/70 text-sm">
                              Hoàn thành chặng trước để mở khóa
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Mascot for active stage */}
                  {stage.status === 'active' && (
                    <motion.div
                      className={`absolute -top-16 ${stage.side === 'left' ? '-right-20' : '-left-20'}`}
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      <div className="relative">
                        <Mascot emotion="happy" size="medium" />
                        <div className={`absolute top-full mt-2 ${stage.side === 'left' ? 'right-0' : 'left-0'} whitespace-nowrap bg-white rounded-lg px-3 py-2 shadow-lg border-2 border-yellow-200`}>
                          <p className="text-sm text-gray-700">Cố lên! Sắp xong rồi! 💪</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* End Flag */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: roadmapStages.length * 0.3 + 0.5 }}
          className="relative mt-24 flex justify-center"
        >
          <div className="text-center">
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🏁
            </motion.div>
            <h3 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
              Hoàn Thành Hành Trình!
            </h3>
            <p className="text-gray-600">Chinh phục tất cả để trở thành bậc thầy</p>
          </div>
        </motion.div>

        {/* Legend */}
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 border-2 border-purple-200 z-20 shadow-lg">
          <p className="text-sm text-gray-700 mb-3">📍 Trạng thái:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full" />
              <span className="text-gray-700">Đã hoàn thành</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-gray-700">Đang học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full" />
              <span className="text-gray-700">Chưa mở khóa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

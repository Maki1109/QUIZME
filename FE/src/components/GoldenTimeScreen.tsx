import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Brain, AlertCircle, Zap, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Mascot } from './Mascot';
import { useState } from 'react';

interface ReviewCard {
  id: number;
  topic: string;
  concept: string;
  lastReviewed: string;
  urgency: 'critical' | 'high' | 'medium';
  timeLeft: string;
  icon: string;
}

const reviewCards: ReviewCard[] = [
  {
    id: 1,
    topic: 'Logarit',
    concept: 'Tính chất logarit tích',
    lastReviewed: '6 ngày trước',
    urgency: 'critical',
    timeLeft: '2 giờ',
    icon: '🔢'
  },
  {
    id: 2,
    topic: 'Dao động',
    concept: 'Phương trình li độ',
    lastReviewed: '4 ngày trước',
    urgency: 'high',
    timeLeft: '5 giờ',
    icon: '〰️'
  },
  {
    id: 3,
    topic: 'Hàm số',
    concept: 'Cực trị hàm bậc 3',
    lastReviewed: '3 ngày trước',
    urgency: 'medium',
    timeLeft: '1 ngày',
    icon: '📈'
  },
  {
    id: 4,
    topic: 'Hình học',
    concept: 'Thể tích khối chóp',
    lastReviewed: '5 ngày trước',
    urgency: 'high',
    timeLeft: '8 giờ',
    icon: '🔺'
  }
];

const urgencyConfig = {
  critical: {
    color: 'from-rose-300 to-pink-300',
    bgColor: 'bg-rose-50 border-rose-300',
    textColor: 'text-rose-700',
    badgeColor: 'bg-rose-400',
    buttonColor: 'bg-rose-400 hover:bg-rose-500 text-white',
    label: '🚨 KHẨN CẤP!',
    borderWidth: 'border-3'
  },
  high: {
    color: 'from-amber-300 to-orange-300',
    bgColor: 'bg-amber-50 border-amber-300',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-400',
    buttonColor: 'bg-amber-400 hover:bg-amber-500 text-white',
    label: '⚠️ Quan trọng',
    borderWidth: 'border-2'
  },
  medium: {
    color: 'from-lime-300 to-emerald-300',
    bgColor: 'bg-lime-50 border-lime-300',
    textColor: 'text-lime-700',
    badgeColor: 'bg-lime-400',
    buttonColor: 'bg-lime-400 hover:bg-lime-500 text-white',
    label: '💡 Nên ôn',
    borderWidth: 'border-2'
  }
};

export function GoldenTimeScreen() {
  const [dismissedCards, setDismissedCards] = useState<number[]>([]);

  const handleReview = (cardId: number) => {
    setDismissedCards(prev => [...prev, cardId]);
  };

  const visibleCards = reviewCards.filter(card => !dismissedCards.includes(card.id));

  return (
    <div className="space-y-6">
      {/* Header with Mascot */}
      <div className="relative">
        <Card className="bg-gradient-to-br from-violet-300 via-fuchsia-300 to-rose-300 text-white border-0 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <CardHeader className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Clock className="w-8 h-8 text-amber-200" />
                  </motion.div>
                  <CardTitle className="text-white text-2xl">⏰ Thời Điểm Vàng</CardTitle>
                </div>
                <p className="text-white/90 text-lg">
                  Ôn tập ngay trước khi quên - Khoa học chứng minh hiệu quả!
                </p>
                <p className="text-white/70 text-sm mt-2">
                  AI Memory Twin phát hiện {visibleCards.length} kiến thức cần củng cố ngay bây giờ
                </p>
              </div>
              
              <div className="ml-6">
                <Mascot emotion="thinking" size="large" />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Floating Memory Machine Visual */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-white rounded-2xl shadow-2xl p-4 border-3 border-violet-200"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-violet-400" />
              <div>
                <p className="text-violet-700">Cỗ Máy Trí Nhớ</p>
                <p className="text-violet-500 text-sm">Đang phân tích...</p>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <RotateCcw className="w-5 h-5 text-violet-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Review Cards Grid */}
      <div className="pt-8">
        <AnimatePresence mode="popLayout">
          {visibleCards.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {visibleCards.map((card, index) => {
                const config = urgencyConfig[card.urgency];
                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 200
                    }}
                  >
                    <Card className={`${config.bgColor} ${config.borderWidth} hover:shadow-xl transition-all relative overflow-hidden`}>
                      {/* Urgency Stripe - THICKER */}
                      <div className={`absolute top-0 left-0 right-0 h-3 bg-gradient-to-r ${config.color}`} />
                      
                      {/* Pulsing indicator for critical items - BIGGER */}
                      {card.urgency === 'critical' && (
                        <motion.div
                          className="absolute top-4 right-4"
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{ 
                            duration: 1,
                            repeat: Infinity 
                          }}
                        >
                          <AlertCircle className="w-8 h-8 text-rose-400" />
                        </motion.div>
                      )}

                      <CardContent className="p-5 pt-6">
                        <div className="space-y-4">
                          {/* Header - TIME LEFT PROMINENT */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">{card.icon}</div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`${config.badgeColor} text-white px-3 py-1`}>
                                    {config.label}
                                  </Badge>
                                  {/* TIME LEFT - MOVED HERE, MORE VISIBLE */}
                                  <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border-2 border-red-400">
                                    <Clock className="w-4 h-4 text-red-600" />
                                    <span className="text-red-700">Còn {card.timeLeft}</span>
                                  </div>
                                </div>
                                <h3 className="text-gray-900">{card.topic}</h3>
                              </div>
                            </div>
                          </div>

                          {/* Concept */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3">
                            <p className="text-gray-700">{card.concept}</p>
                          </div>

                          {/* Time Info */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <RotateCcw className="w-4 h-4" />
                              <span>Ôn lần cuối: {card.lastReviewed}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <Button 
                              className={`flex-1 ${config.buttonColor} shadow-lg border-0 h-12`}
                              size="lg"
                              onClick={() => handleReview(card.id)}
                            >
                              <Brain className="w-5 h-5 mr-2" />
                              Ôn Ngay!
                            </Button>
                            <Button
                              variant="outline"
                              size="lg"
                              className="px-4 h-12 border-2"
                              onClick={() => handleReview(card.id)}
                            >
                              Để sau
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-2 border-green-300">
                <CardContent className="p-12">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    🎉
                  </motion.div>
                  <h3 className="text-green-700 text-2xl mb-2">Xuất sắc!</h3>
                  <p className="text-green-600">
                    Bạn đã ôn tập hết tất cả kiến thức cần thiết!
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Hãy quay lại sau để tiếp tục củng cố nhé 💪
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

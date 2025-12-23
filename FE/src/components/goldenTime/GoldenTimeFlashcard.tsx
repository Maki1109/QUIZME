import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { RotateCcw, ChevronRight, ChevronLeft, X, Lightbulb } from 'lucide-react';

interface FlashcardData {
  id: number;
  topic: string;
  question: string;
  answer: string;
  example?: string;
  icon: string;
}

interface GoldenTimeFlashcardProps {
  cards: FlashcardData[];
  onComplete: () => void;
  onExit: () => void;
}

type RecallLevel = 1 | 2 | 3;

export const GoldenTimeFlashcard: React.FC<GoldenTimeFlashcardProps> = ({
  cards,
  onComplete,
  onExit
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewResults, setReviewResults] = useState<RecallLevel[]>([]);

  const currentCard = cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRecall = (level: RecallLevel) => {
    setReviewResults([...reviewResults, level]);
    
    if (currentCardIndex < cards.length - 1) {
      // Next card
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Complete
      onComplete();
    }
  };

  const getRecallSchedule = (level: RecallLevel) => {
    switch (level) {
      case 1: return '1 ngày';
      case 2: return '3 ngày';
      case 3: return '10 ngày';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl text-gray-900">⏰ Thời Điểm Vàng - Ôn tập</h2>
            <p className="text-gray-600">
              Thẻ {currentCardIndex + 1} / {cards.length}
            </p>
          </div>
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% hoàn thành</p>
        </div>

        {/* Instructions (if not flipped) */}
        {!isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-blue-50 border-2 border-blue-200 mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <Lightbulb className="w-5 h-5" />
                  <p className="text-sm">
                    <strong>Bước 1:</strong> Đọc câu hỏi và cố gắng nhớ lại công thức
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Flashcard */}
        <div className="perspective-1000 mb-6">
          <motion.div
            className="relative h-96"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front Side - Question */}
            <AnimatePresence>
              {!isFlipped && (
                <motion.div
                  key="front"
                  className="absolute inset-0"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <Card className="h-full border-4 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 cursor-pointer"
                    onClick={handleFlip}
                  >
                    <CardContent className="h-full flex flex-col items-center justify-center p-8">
                      <div className="text-6xl mb-6">{currentCard.icon}</div>
                      <Badge className="bg-orange-500 text-white mb-4 text-sm">
                        {currentCard.topic}
                      </Badge>
                      <h3 className="text-3xl text-center text-gray-900 mb-6">
                        {currentCard.question}
                      </h3>
                      <p className="text-gray-600 text-center">
                        Cố gắng nhớ lại trước khi lật thẻ
                      </p>
                      
                      <motion.div
                        className="mt-8"
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <RotateCcw className="w-8 h-8 text-orange-500" />
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Back Side - Answer */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  key="back"
                  className="absolute inset-0"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <Card className="h-full border-4 border-green-300 bg-gradient-to-br from-green-50 to-teal-50">
                    <CardContent className="h-full flex flex-col items-center justify-center p-8">
                      <div className="text-6xl mb-6">{currentCard.icon}</div>
                      <Badge className="bg-green-500 text-white mb-4 text-sm">
                        {currentCard.topic}
                      </Badge>
                      
                      <div className="text-center mb-6">
                        <h4 className="text-gray-600 mb-2">Đáp án:</h4>
                        <div className="text-4xl text-gray-900 mb-4">
                          {currentCard.answer}
                        </div>
                      </div>

                      {currentCard.example && (
                        <Card className="bg-white border-2 border-green-200 mb-4">
                          <CardContent className="p-4">
                            <p className="text-sm text-gray-600 mb-1">Ví dụ ứng dụng:</p>
                            <p className="text-gray-900">{currentCard.example}</p>
                          </CardContent>
                        </Card>
                      )}

                      <button
                        onClick={handleFlip}
                        className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Lật lại
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Flip Button (if not flipped) */}
        {!isFlipped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <Button
              size="lg"
              onClick={handleFlip}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white text-xl h-14"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Lật thẻ để xem đáp án
            </Button>
          </motion.div>
        )}

        {/* Self-Assessment (if flipped) */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white border-2 border-gray-300">
              <CardContent className="p-6">
                <h4 className="text-gray-900 mb-4 text-center">
                  🤔 Mức độ ghi nhớ của bạn?
                </h4>
                <p className="text-sm text-gray-600 text-center mb-6">
                  AI sẽ lên lịch ôn tập dựa trên đánh giá của bạn
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {/* Level 1 - Forgot */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => handleRecall(1)}
                      className="w-full h-auto flex flex-col items-center p-4 bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
                    >
                      <div className="text-3xl mb-2">😰</div>
                      <div className="mb-2">1 - Quên hẳn</div>
                      <div className="text-xs opacity-80">
                        Ôn lại: {getRecallSchedule(1)}
                      </div>
                    </Button>
                  </motion.div>

                  {/* Level 2 - Vague */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => handleRecall(2)}
                      className="w-full h-auto flex flex-col items-center p-4 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white"
                    >
                      <div className="text-3xl mb-2">🤔</div>
                      <div className="mb-2">2 - Nhớ mang máng</div>
                      <div className="text-xs opacity-80">
                        Ôn lại: {getRecallSchedule(2)}
                      </div>
                    </Button>
                  </motion.div>

                  {/* Level 3 - Clear */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => handleRecall(3)}
                      className="w-full h-auto flex flex-col items-center p-4 bg-gradient-to-br from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white"
                    >
                      <div className="text-3xl mb-2">😊</div>
                      <div className="mb-2">3 - Nhớ rõ</div>
                      <div className="text-xs opacity-80">
                        Ôn lại: {getRecallSchedule(3)}
                      </div>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation */}
        {currentCardIndex > 0 && !isFlipped && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentCardIndex(prev => prev - 1);
                setIsFlipped(false);
              }}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Thẻ trước
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Badge component (if not imported)
const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${className}`}>
    {children}
  </span>
);

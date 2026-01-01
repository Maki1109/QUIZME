import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { RotateCcw, X, Lightbulb } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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

// Badge component nội bộ
const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}>
    {children}
  </span>
);

export const GoldenTimeFlashcard: React.FC<GoldenTimeFlashcardProps> = ({
  cards,
  onComplete,
  onExit
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewResults, setReviewResults] = useState<RecallLevel[]>([]);

  // Kiểm tra an toàn để tránh lỗi undefined nếu mảng rỗng
  const currentCard = cards && cards.length > 0 ? cards[currentCardIndex] : null;
  const progress = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRecall = (level: RecallLevel) => {
    setReviewResults([...reviewResults, level]);
    
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
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

  // Component hiển thị Latex
  const MathContent = ({ content }: { content?: string }) => {
    if (!content) return <span>(Trống)</span>;

    // Tách chuỗi dựa trên dấu $ (ví dụ: "Hàm số $y=x$ đồng biến")
    const parts = content.split(/(\$[^\$]+\$)/g);

    return (
      <span className="latex-content">
        {parts.map((part, index) => {
          // Nếu phần này được bao bởi $, render bằng InlineMath (bỏ $)
          if (part.startsWith('$') && part.endsWith('$')) {
            return <InlineMath key={index} math={part.slice(1, -1)} />;
          }
          // Nếu là văn bản thường, render thẻ span
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };
  
  // Nếu không có thẻ nào (ví dụ lỗi load CSV), hiển thị thông báo
  if (!currentCard) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl text-gray-900 font-bold">⏰ Thời Điểm Vàng - Ôn tập</h2>
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
                    <strong>Gợi ý:</strong> Đọc câu hỏi và cố gắng nhớ lại công thức trước khi lật.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Flashcard Area */}
        <div className="perspective-1000 mb-6 min-h-[400px]">
          <motion.div
            className="relative h-full min-h-[400px]"
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front Side - Question */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}
            >
              <Card 
                className="h-full border-4 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
                onClick={handleFlip}
              >
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <div className="text-6xl mb-6">{currentCard.icon}</div>
                  <Badge className="bg-orange-500 text-white mb-4">
                    {currentCard.topic}
                  </Badge>
                  
                  {/* SỬ DỤNG MathContent ĐỂ HIỂN THỊ LATEX */}
                  <h3 className="text-3xl text-center text-gray-900 mb-6 leading-relaxed">
                    <MathContent content={currentCard.question} />
                  </h3>

                  <p className="text-gray-500 text-center animate-pulse mt-auto">
                    (Chạm để lật thẻ)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Back Side - Answer */}
            <div
              className="absolute inset-0"
              style={{ 
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                zIndex: isFlipped ? 1 : 0
              }}
            >
              <Card className="h-full border-4 border-green-300 bg-gradient-to-br from-green-50 to-teal-50 shadow-lg">
                <CardContent className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
                  <div className="text-6xl mb-4">{currentCard.icon}</div>
                  <Badge className="bg-green-500 text-white mb-4">
                    {currentCard.topic}
                  </Badge>
                  
                  <div className="text-center mb-6 w-full">
                    <h4 className="text-gray-500 text-sm uppercase tracking-widest mb-2">Đáp án</h4>
                    
                    {/* SỬ DỤNG MathContent ĐỂ HIỂN THỊ LATEX */}
                    <div className="text-3xl text-gray-900 font-bold mb-4 leading-relaxed break-words">
                      <MathContent content={currentCard.answer} />
                    </div>
                  </div>

                  {currentCard.example && (
                    <Card className="bg-white/80 border-2 border-green-200 mb-4 w-full">
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Ví dụ:</p>
                        <div className="text-gray-800 text-lg">
                           <MathContent content={currentCard.example} />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <button
                    onClick={handleFlip}
                    className="mt-auto text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Lật lại câu hỏi
                  </button>
                </CardContent>
              </Card>
            </div>
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
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white text-xl h-14 shadow-md"
            >
              <RotateCcw className="w-6 h-6 mr-2" />
              Lật thẻ xem đáp án
            </Button>
          </motion.div>
        )}

        {/* Self-Assessment Buttons (if flipped) */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <h4 className="text-gray-900 mb-2 text-center font-bold">
                  🤔 Bạn nhớ thẻ này thế nào?
                </h4>
                <p className="text-sm text-gray-500 text-center mb-6">
                  Hệ thống sẽ lên lịch ôn tập dựa trên đánh giá của bạn
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {/* Level 1 */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleRecall(1)}
                      className="w-full h-auto flex flex-col items-center p-3 bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100"
                      variant="ghost"
                    >
                      <div className="text-3xl mb-1">😰</div>
                      <div className="font-bold text-sm">Quên</div>
                      <div className="text-[10px] opacity-70">1 ngày</div>
                    </Button>
                  </motion.div>

                  {/* Level 2 */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleRecall(2)}
                      className="w-full h-auto flex flex-col items-center p-3 bg-amber-50 border-2 border-amber-200 text-amber-700 hover:bg-amber-100"
                      variant="ghost"
                    >
                      <div className="text-3xl mb-1">🤔</div>
                      <div className="font-bold text-sm">Tạm ổn</div>
                      <div className="text-[10px] opacity-70">3 ngày</div>
                    </Button>
                  </motion.div>

                  {/* Level 3 */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => handleRecall(3)}
                      className="w-full h-auto flex flex-col items-center p-3 bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100"
                      variant="ghost"
                    >
                      <div className="text-3xl mb-1">😊</div>
                      <div className="font-bold text-sm">Nhớ rõ</div>
                      <div className="text-[10px] opacity-70">10 ngày</div>
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { GoldenTimeFlashcard } from './GoldenTimeFlashcard';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, CheckCircle } from 'lucide-react';

interface FlashcardData {
  id: number;
  topic: string;
  question: string;
  answer: string;
  example?: string;
  icon: string;
}

interface GoldenTimeFlashcardContainerProps {
  onClose: () => void;
}

export const GoldenTimeFlashcardContainer: React.FC<GoldenTimeFlashcardContainerProps> = ({
  onClose
}) => {
  const [stage, setStage] = useState<'flashcard' | 'completed'>('flashcard');

  // Mock flashcards data
  const flashcards: FlashcardData[] = [
    {
      id: 1,
      topic: 'Logarit',
      question: 'Tính chất Logarit Tích là gì?',
      answer: 'log(ab) = log(a) + log(b)',
      example: 'log(2×3) = log(2) + log(3)',
      icon: '🔢'
    },
    {
      id: 2,
      topic: 'Logarit',
      question: 'Tính chất Logarit Thương là gì?',
      answer: 'log(a/b) = log(a) - log(b)',
      example: 'log(6/2) = log(6) - log(2)',
      icon: '🔢'
    },
    {
      id: 3,
      topic: 'Logarit',
      question: 'Tính chất Logarit Lũy thừa là gì?',
      answer: 'log(aⁿ) = n × log(a)',
      example: 'log(2³) = 3 × log(2)',
      icon: '🔢'
    },
    {
      id: 4,
      topic: 'Logarit',
      question: 'Điều kiện xác định log_a(x)?',
      answer: 'a > 0, a ≠ 1, x > 0',
      example: 'log₂(8) xác định vì 2 > 0, 2 ≠ 1, 8 > 0',
      icon: '🔢'
    }
  ];

  const handleComplete = () => {
    setStage('completed');
  };

  const handleBackToDashboard = () => {
    onClose();
  };

  if (stage === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          className="max-w-2xl w-full"
        >
          <Card className="border-4 border-green-300 shadow-2xl">
            <CardContent className="p-8">
              {/* Success Icon */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-8xl mb-4"
                >
                  ✅
                </motion.div>
                <h1 className="text-3xl text-gray-900 mb-2">
                  Hoàn thành ôn tập!
                </h1>
                <p className="text-gray-600">
                  AI đã lên lịch ôn tập cho bạn
                </p>
              </div>

              {/* Schedule Info */}
              <Card className="bg-green-50 border-2 border-green-300 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-gray-900 mb-2">
                        📅 Lịch ôn tập tiếp theo
                      </h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>• Thẻ "Logarit Tích": <strong>1 ngày sau</strong> (đánh giá: Quên hẳn)</li>
                        <li>• Thẻ "Logarit Thương": <strong>3 ngày sau</strong> (đánh giá: Nhớ mang máng)</li>
                        <li>• Thẻ "Logarit Lũy thừa": <strong>10 ngày sau</strong> (đánh giá: Nhớ rõ)</li>
                        <li>• Thẻ "Điều kiện log": <strong>10 ngày sau</strong> (đánh giá: Nhớ rõ)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Update */}
              <Card className="bg-blue-50 border-2 border-blue-200 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-blue-800">
                      Thẻ <strong>Logarit</strong> đã biến mất khỏi khu vực "Thời Điểm Vàng" cho đến ngày hẹn ôn lại
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Motivational Message */}
              <div className="text-center mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <p className="text-yellow-800">
                  💪 <strong>Tuyệt vời!</strong> Việc ôn tập đều đặn sẽ giúp bạn ghi nhớ lâu dài hơn!
                </p>
              </div>

              {/* Back Button */}
              <Button
                size="lg"
                onClick={handleBackToDashboard}
                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white text-xl h-14"
              >
                <CheckCircle className="w-6 h-6 mr-2" />
                Về Bảng điều khiển
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <GoldenTimeFlashcard
      cards={flashcards}
      onComplete={handleComplete}
      onExit={onClose}
    />
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Target, Clock, Zap, AlertCircle, ChevronLeft } from 'lucide-react';

interface AITeacherPracticeLobbyProps {
  topic: string;
  incorrectCount: number;
  totalCount: number;
  onStart: () => void;
  onCancel: () => void;
}

export const AITeacherPracticeLobby: React.FC<AITeacherPracticeLobbyProps> = ({
  topic,
  incorrectCount,
  totalCount,
  onStart,
  onCancel
}) => {
  const topicIcons: Record<string, string> = {
    'Logarit': '🔢',
    'Hàm số': '📈',
    'Dao động': '〰️',
    'Hình học': '🔷',
    'Lượng giác': '📐'
  };

  const topicColors: Record<string, string> = {
    'Logarit': 'from-purple-500 to-pink-600',
    'Hàm số': 'from-blue-500 to-cyan-600',
    'Dao động': 'from-green-500 to-teal-600',
    'Hình học': 'from-orange-500 to-red-600',
    'Lượng giác': 'from-pink-500 to-rose-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="max-w-2xl w-full"
      >
        <Card className="border-4 border-purple-300 shadow-2xl">
          <CardContent className="p-8">
            {/* Back Button */}
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại Dashboard
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                className={`inline-flex w-24 h-24 rounded-3xl bg-gradient-to-br ${topicColors[topic] || 'from-purple-500 to-pink-600'} items-center justify-center text-5xl mb-4`}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {topicIcons[topic] || '📚'}
              </motion.div>
              
              <h1 className="text-3xl text-gray-900 mb-2">
                Luyện tập: Sửa lỗi {topic}
              </h1>
              <p className="text-gray-600">
                AI Teacher đã phát hiện bạn cần ôn lại chủ đề này
              </p>
            </div>

            {/* Error Stats */}
            <Card className="bg-red-50 border-2 border-red-200 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Lỗi sai gần nhất</p>
                      <p className="text-xl text-gray-900">
                        {incorrectCount}/{totalCount} câu
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-red-500 text-white text-lg px-4 py-2">
                    {Math.round((incorrectCount / totalCount) * 100)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <div className="mb-6">
              <h3 className="text-gray-900 mb-3">📋 Quy tắc luyện tập:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Số câu:</strong> 5-10 câu tập trung vào lỗi sai của bạn
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Phản hồi tức thì:</strong> Giải thích ngay sau mỗi câu
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">
                    <strong>Không giới hạn thời gian:</strong> Học kỹ, không vội vàng
                  </span>
                </li>
              </ul>
            </div>

            {/* Important Note */}
            <Card className="bg-orange-50 border-2 border-orange-300 mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-orange-900 mb-1">
                      <strong>Quan trọng:</strong>
                    </p>
                    <p className="text-orange-800 text-sm">
                      • Khi trả lời <strong>SAI</strong>, bạn sẽ phải đọc giải thích trước khi tiếp tục
                    </p>
                    <p className="text-orange-800 text-sm">
                      • Điều này giúp bạn học từ lỗi sai thay vì chỉ làm cho xong
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rewards */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-purple-700">
                <Zap className="w-5 h-5" />
                <span>Hoàn thành: <strong>+25 XP</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={onCancel}
                className="flex-1"
              >
                Để sau
              </Button>
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={onStart}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-xl h-14 shadow-xl"
                >
                  <Target className="w-6 h-6 mr-2" />
                  BẮT ĐẦU LUYỆN TẬP
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

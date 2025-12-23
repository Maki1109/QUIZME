import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Clock, FileText, Star, Sword } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const tests = [
  {
    id: 1,
    title: 'Đề thi thử THPT 2024 - Đề 15',
    source: 'Bộ GD&ĐT',
    difficulty: 'Khó',
    topic: 'Tổng hợp',
    year: 2024,
    questions: 40,
    duration: 90,
    rating: 4.5,
    attempts: 1250
  },
  {
    id: 2,
    title: 'Chuyên đề Logarit - Nâng cao',
    source: 'QuizMe',
    difficulty: 'Trung bình',
    topic: 'Logarit',
    year: 2024,
    questions: 30,
    duration: 60,
    rating: 4.8,
    attempts: 890
  },
  {
    id: 3,
    title: 'Hàm số - Cơ bản đến Nâng cao',
    source: 'Thầy Nguyễn',
    difficulty: 'Dễ',
    topic: 'Hàm số',
    year: 2024,
    questions: 25,
    duration: 45,
    rating: 4.3,
    attempts: 2100
  },
  {
    id: 4,
    title: 'Đề thi chọn HSG Quốc gia',
    source: 'HSG',
    difficulty: 'Rất khó',
    topic: 'Tổng hợp',
    year: 2023,
    questions: 50,
    duration: 120,
    rating: 4.9,
    attempts: 450
  }
];

const difficultyColors = {
  'Dễ': 'bg-green-100 text-green-700',
  'Trung bình': 'bg-yellow-100 text-yellow-700',
  'Khó': 'bg-orange-100 text-orange-700',
  'Rất khó': 'bg-red-100 text-red-700'
};

export function TestLibrary() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');

  return (
    // ✨ FIX: Thêm max-w-6xl và mx-auto để giới hạn chiều rộng
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-teal-700 font-bold text-xl">📚 Thư Viện Đề Thi</h2>
        <div className="flex gap-3">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Độ khó" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="easy">Dễ</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="hard">Khó</SelectItem>
              <SelectItem value="very-hard">Rất khó</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Chủ đề" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="function">Hàm số</SelectItem>
              <SelectItem value="logarit">Logarit</SelectItem>
              <SelectItem value="geometry">Hình học</SelectItem>
              <SelectItem value="comprehensive">Tổng hợp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {tests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-gray-900 font-semibold flex-1 text-lg">{test.title}</h3>
                      <Badge className={difficultyColors[test.difficulty as keyof typeof difficultyColors]}>
                        {test.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{test.source}</span>
                      <span>•</span>
                      <span>{test.year}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{test.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{test.questions} câu</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{test.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">{test.attempts.toLocaleString()} lượt làm</span>
                    <Button className="bg-gradient-to-r from-teal-500 to-orange-500 hover:opacity-90 text-white shadow-md transition-transform hover:scale-105">
                      <Sword className="w-4 h-4 mr-2" />
                      Chiến đấu!
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
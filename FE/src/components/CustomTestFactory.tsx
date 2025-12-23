import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings, Plus, Minus, Sparkles, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Mascot } from './Mascot';

const topics = [
  { id: 'functions', name: 'Hàm số', count: 0, max: 20, icon: '📈', color: 'from-blue-400 to-cyan-400' },
  { id: 'logarit', name: 'Logarit', count: 0, max: 15, icon: '🔢', color: 'from-purple-400 to-pink-400' },
  { id: 'trigonometry', name: 'Lượng giác', count: 0, max: 15, icon: '📐', color: 'from-green-400 to-teal-400' },
  { id: 'geometry', name: 'Hình học', count: 0, max: 20, icon: '🔺', color: 'from-orange-400 to-red-400' },
  { id: 'derivative', name: 'Đạo hàm', count: 0, max: 15, icon: '∫', color: 'from-indigo-400 to-purple-400' },
  { id: 'waves', name: 'Sóng cơ', count: 0, max: 10, icon: '〰️', color: 'from-teal-400 to-cyan-400' }
];

export function CustomTestFactory() {
  const [selectedTopics, setSelectedTopics] = useState<Record<string, number>>({});
  const [difficulty, setDifficulty] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const updateCount = (topicId: string, delta: number) => {
    setSelectedTopics(prev => ({
      ...prev,
      [topicId]: Math.max(0, Math.min((prev[topicId] || 0) + delta, topics.find(t => t.id === topicId)?.max || 0))
    }));
    
    // Trigger shake animation when adding ingredients
    if (delta > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const totalQuestions = Object.values(selectedTopics).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 border-2 border-orange-200 shadow-xl relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-pink-400 rounded-full blur-3xl" />
      </div>

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg"
              animate={isShaking ? { rotate: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <Beaker className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle>🧪 Quầy Bar Pha Chế Đề Thi</CardTitle>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Sáng tạo
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Trộn các "nguyên liệu" để tạo ra bài kiểm tra hoàn hảo cho riêng bạn!
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-600 hover:bg-orange-100"
          >
            {isExpanded ? 'Thu gọn ↑' : 'Pha chế ↓'}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-6 relative z-10">
              {/* Cocktail Shaker Visualization */}
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-gray-700 mb-4 flex items-center gap-2">
                    🥤 Chọn "Nguyên Liệu" (Ingredients)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {topics.map((topic, index) => (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-white rounded-xl border-2 hover:shadow-lg transition-all ${
                          (selectedTopics[topic.id] || 0) > 0 
                            ? 'border-orange-400 shadow-md' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={topic.id}
                                checked={(selectedTopics[topic.id] || 0) > 0}
                                onCheckedChange={(checked: boolean) => {
                                  if (!checked) {
                                    setSelectedTopics(prev => ({ ...prev, [topic.id]: 0 }));
                                  } else {
                                    setSelectedTopics(prev => ({ ...prev, [topic.id]: 5 }));
                                  }
                                }}
                              />
                              <Label htmlFor={topic.id} className="cursor-pointer flex items-center gap-2">
                                <motion.span 
                                  className="text-2xl"
                                  animate={(selectedTopics[topic.id] || 0) > 0 ? { rotate: [0, 10, -10, 0] } : {}}
                                  transition={{ duration: 0.5 }}
                                >
                                  {topic.icon}
                                </motion.span>
                                <span>{topic.name}</span>
                              </Label>
                            </div>
                            <span className="text-xs text-gray-500">Max {topic.max}</span>
                          </div>

                          {/* Difficulty Selector */}
                          {(selectedTopics[topic.id] || 0) > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                            >
                              <Select 
                                value={difficulty[topic.id] || 'medium'}
                                onValueChange={(value: string) => setDifficulty(prev => ({ ...prev, [topic.id]: value }))}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Độ khó" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">🟢 Dễ</SelectItem>
                                  <SelectItem value="medium">🟡 Trung bình</SelectItem>
                                  <SelectItem value="hard">🔴 Khó</SelectItem>
                                </SelectContent>
                              </Select>
                            </motion.div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCount(topic.id, -1)}
                              disabled={(selectedTopics[topic.id] || 0) === 0}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <div className="flex-1 text-center">
                              <motion.span 
                                className={`text-2xl bg-gradient-to-r ${topic.color} bg-clip-text text-transparent`}
                                key={selectedTopics[topic.id]}
                                initial={{ scale: 1.5 }}
                                animate={{ scale: 1 }}
                              >
                                {selectedTopics[topic.id] || 0}
                              </motion.span>
                              <span className="text-gray-500 text-sm ml-1">câu</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCount(topic.id, 1)}
                              disabled={(selectedTopics[topic.id] || 0) >= topic.max}
                              className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Cocktail Glass Visualization */}
                <div className="w-48 flex-shrink-0">
                  <div className="sticky top-6">
                    <motion.div
                      animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-6 border-2 border-orange-300 shadow-lg"
                    >
                      <h4 className="text-center text-gray-700 mb-4">🍹 Ly Cocktail</h4>
                      
                      {/* Glass SVG */}
                      <div className="relative h-64 flex items-end justify-center">
                        <div className="w-32 relative">
                          {/* Glass container */}
                          <div className="absolute bottom-0 w-full h-48 border-4 border-gray-300 rounded-b-3xl overflow-hidden bg-gradient-to-t from-white to-transparent">
                            {/* Liquid layers */}
                            <AnimatePresence>
                              {topics.map((topic, index) => {
                                const count = selectedTopics[topic.id] || 0;
                                if (count === 0) return null;
                                
                                const percentage = (count / totalQuestions) * 100;
                                const bottom = topics
                                  .slice(0, index)
                                  .reduce((sum, t) => sum + (selectedTopics[t.id] || 0), 0) / totalQuestions * 100;
                                
                                return (
                                  <motion.div
                                    key={topic.id}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${percentage}%` }}
                                    exit={{ height: 0 }}
                                    className={`absolute bottom-0 left-0 right-0 bg-gradient-to-r ${topic.color} opacity-70`}
                                    style={{ bottom: `${bottom}%` }}
                                  />
                                );
                              })}
                            </AnimatePresence>
                          </div>
                          {/* Glass stem */}
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2 h-8 bg-gray-300" />
                          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-300 rounded-b-full" />
                        </div>
                      </div>

                      <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">Tổng cộng</p>
                        <motion.p 
                          className="text-3xl text-orange-600"
                          key={totalQuestions}
                          initial={{ scale: 1.5 }}
                          animate={{ scale: 1 }}
                        >
                          {totalQuestions}
                        </motion.p>
                        <p className="text-xs text-gray-500">câu hỏi</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-orange-200">
                <div className="flex items-center gap-6">
                  <div className="text-center bg-white rounded-xl px-4 py-2 border-2 border-orange-200">
                    <p className="text-xs text-gray-600">Tổng số câu</p>
                    <p className="text-2xl text-orange-600">{totalQuestions}</p>
                  </div>
                  <div className="text-center bg-white rounded-xl px-4 py-2 border-2 border-teal-200">
                    <p className="text-xs text-gray-600">Thời gian dự kiến</p>
                    <p className="text-2xl text-teal-600">{Math.ceil(totalQuestions * 2)} phút</p>
                  </div>
                  
                  {totalQuestions > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Mascot emotion="excited" size="small" />
                    </motion.div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedTopics({});
                      setDifficulty({});
                    }}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    🔄 Đặt lại
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:opacity-90 shadow-lg text-white"
                      disabled={totalQuestions === 0}
                      size="lg"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Pha Chế Ngay! ({totalQuestions} câu)
                    </Button>
                  </motion.div>
                </div>
              </div>

              {totalQuestions > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-orange-100 via-yellow-100 to-pink-100 p-4 rounded-xl border-2 border-orange-300"
                >
                  <div className="flex items-start gap-3">
                    <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                      💡 Gợi ý
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        <strong>Cocktail của bạn:</strong> Đề thi sẽ được lưu với tag "Đề của tôi" 
                        để luyện lại hoặc chia sẻ với bạn bè! 🎯
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Mẹo: Kết hợp nhiều chủ đề với độ khó khác nhau sẽ giúp bạn phát triển toàn diện hơn!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

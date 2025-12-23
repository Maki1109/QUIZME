import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Target, Trophy, Sparkles, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

interface GoalSelectionProps {
  onComplete: (goals: string[]) => void;
}

const goals = [
  {
    id: 'thpt',
    title: 'Ôn thi THPT Quốc gia',
    description: 'Chinh phục kỳ thi quan trọng nhất',
    icon: GraduationCap,
    color: 'from-red-500 to-orange-500',
    borderColor: 'border-red-300',
  },
  {
    id: 'foundation',
    title: 'Lấy lại gốc',
    description: 'Xây dựng nền tảng kiến thức vững chắc',
    icon: Target,
    color: 'from-teal-500 to-cyan-500',
    borderColor: 'border-teal-300',
  },
  {
    id: 'fun',
    title: 'Học vui',
    description: 'Khám phá kiến thức một cách thú vị',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    borderColor: 'border-purple-300',
  },
  {
    id: 'competition',
    title: 'Thi đấu & Cạnh tranh',
    description: 'Leo rank và thách đấu với bạn bè',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
    borderColor: 'border-yellow-300',
  },
];

export function GoalSelection({ onComplete }: GoalSelectionProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = () => {
    if (selectedGoals.length > 0) {
      onComplete(selectedGoals);
    }
  };

  // Hàm xử lý bỏ qua
  const handleSkip = () => {
    onComplete([]); // Truyền mảng rỗng để báo hiệu bỏ qua
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <div className="inline-block mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Target className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-teal-700 mb-3">Mục Tiêu Của Bạn Là Gì?</h1>
        <p className="text-gray-600 text-lg">
          Chọn một hoặc nhiều mục tiêu để QuizMe cá nhân hóa trải nghiệm học tập
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {goals.map((goal, index) => {
          const isSelected = selectedGoals.includes(goal.id);
          const Icon = goal.icon;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                className={`cursor-pointer transition-all duration-300 h-full ${
                  isSelected
                    ? `border-4 ${goal.borderColor} shadow-2xl scale-105`
                    : 'border-2 border-gray-200 hover:border-teal-200 hover:shadow-lg'
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${goal.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-800 font-bold mb-2">{goal.title}</h3>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? `${goal.borderColor} bg-gradient-to-br ${goal.color}`
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 bg-white rounded-full"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button
          onClick={handleSkip}
          variant="ghost"
          className="px-8 py-6 text-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          Bỏ qua bước này
        </Button>

        <Button
          onClick={handleContinue}
          disabled={selectedGoals.length === 0}
          className="px-12 py-6 text-lg bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
          {selectedGoals.length === 0
            ? 'Vui lòng chọn mục tiêu'
            : `Tiếp tục (${selectedGoals.length})`}
        </Button>
      </motion.div>
    </div>
  );
}
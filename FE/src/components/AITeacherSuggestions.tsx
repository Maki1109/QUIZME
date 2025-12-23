import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const suggestions = [
  {
    type: 'improvement',
    icon: AlertTriangle,
    color: 'orange',
    title: 'Bạn sai 3/5 câu Logarit tối qua',
    message: 'Hãy luyện lại để củng cố kiến thức nhé!',
    action: 'Ôn ngay',
    actionColor: 'orange'
  },
  {
    type: 'progress',
    icon: TrendingUp,
    color: 'teal',
    title: 'Bạn đã đạt 90% ở Chặng 1 – Hàm số',
    message: 'QuizMe thấy bạn đang tiến bộ rất nhanh đó! Sẵn sàng cho Chặng 2 chưa?',
    action: 'Tiếp tục',
    actionColor: 'teal'
  }
];

export function AITeacherSuggestions() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`border-l-4 border-${suggestion.color}-500 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className={`w-10 h-10 rounded-full bg-${suggestion.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <suggestion.icon className={`w-5 h-5 text-${suggestion.color}-600`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <span className="text-teal-600">AI Teacher</span>
                  </div>
                  <p className="text-gray-900 mb-1">{suggestion.title}</p>
                  <p className="text-gray-600 text-sm mb-3">{suggestion.message}</p>
                  <Button 
                    size="sm" 
                    className={`bg-${suggestion.actionColor}-500 hover:bg-${suggestion.actionColor}-600`}
                  >
                    {suggestion.action}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

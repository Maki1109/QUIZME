import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Brain, RotateCcw, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const formulas = [
  {
    id: 1,
    topic: 'Dao động điều hòa',
    formula: 'x = A·cos(ωt + φ)',
    description: 'Phương trình li độ',
    lastReviewed: '3 ngày trước',
    needsReview: true
  },
  {
    id: 2,
    topic: 'Logarit',
    formula: 'log(ab) = log(a) + log(b)',
    description: 'Tính chất logarit tích',
    lastReviewed: '5 ngày trước',
    needsReview: true
  },
  {
    id: 3,
    topic: 'Đạo hàm',
    formula: '(uv)\' = u\'v + uv\'',
    description: 'Đạo hàm tích',
    lastReviewed: '1 ngày trước',
    needsReview: false
  }
];

export function FormulaReinforcement() {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const toggleFlip = (id: number) => {
    setFlippedCards(prev => 
      prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-6 h-6 text-teal-600" />
        <h2 className="text-teal-700">Củng Cố Công Thức</h2>
        <div className="ml-auto bg-red-100 px-3 py-1 rounded-full">
          <span className="text-red-600 text-sm">🧠 AI Memory Twin phát hiện công thức cần ôn</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {formulas.map((formula, index) => (
          <motion.div
            key={formula.id}
            initial={{ opacity: 0, rotateY: -20 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all ${
                formula.needsReview 
                  ? 'border-2 border-red-200 bg-red-50/50' 
                  : 'bg-white/80'
              } hover:shadow-lg`}
              onClick={() => toggleFlip(formula.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{formula.topic}</CardTitle>
                  {formula.needsReview && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </motion.div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gradient-to-br from-teal-100 to-orange-100 p-4 rounded-lg min-h-[80px] flex items-center justify-center">
                  <motion.div
                    initial={false}
                    animate={{ rotateY: flippedCards.includes(formula.id) ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center w-full"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {!flippedCards.includes(formula.id) ? (
                      <div style={{ backfaceVisibility: 'hidden' }}>
                        <p className="text-gray-600 text-sm mb-2">{formula.description}</p>
                        <p className="text-teal-700 text-xs">👆 Nhấp để xem công thức</p>
                      </div>
                    ) : (
                      <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="text-gray-900">{formula.formula}</p>
                      </div>
                    )}
                  </motion.div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs">{formula.lastReviewed}</span>
                  {formula.needsReview ? (
                    <Button size="sm" variant="destructive" className="h-7">
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Ôn ngay
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1 text-teal-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Đã nắm vững</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
// ❌ ĐÃ XÓA: import { useNavigate } from 'react-router-dom'; -> KHÔNG IMPORT CÁI NÀY
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Brain, ArrowLeft, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlacementTestProps {
  subjects: string[];
  onComplete: (level: number) => void;
  onBack: () => void;
}

// Mock placement test questions (Giữ nguyên phần dữ liệu câu hỏi của bạn)
const placementQuestions = [
  {
    id: 1,
    question: 'Tính đạo hàm của hàm số y = x² + 3x - 5',
    options: ['2x + 3', 'x² + 3', '2x - 5', 'x + 3'],
    correctAnswer: 0,
    difficulty: 1,
  },
  {
    id: 2,
    question: 'Giải phương trình: 2x + 5 = 13',
    options: ['x = 4', 'x = 8', 'x = 9', 'x = 3'],
    correctAnswer: 0,
    difficulty: 1,
  },
  {
    id: 3,
    question: 'Tính giá trị của log₂(8)',
    options: ['2', '3', '4', '8'],
    correctAnswer: 1,
    difficulty: 2,
  },
  {
    id: 4,
    question: 'Đạo hàm của hàm số y = sin(2x) là:',
    options: ['cos(2x)', '2cos(2x)', '-sin(2x)', '2sin(2x)'],
    correctAnswer: 1,
    difficulty: 2,
  },
  {
    id: 5,
    question: 'Tích phân ∫(2x + 1)dx từ 0 đến 2 bằng:',
    options: ['4', '6', '8', '10'],
    correctAnswer: 1,
    difficulty: 3,
  },
  {
    id: 6,
    question: 'Giới hạn lim(x→0) (sin x)/x bằng:',
    options: ['0', '1', '∞', 'Không tồn tại'],
    correctAnswer: 1,
    difficulty: 3,
  },
  {
    id: 7,
    question: 'Phương trình tiếp tuyến của đồ thị y = x³ tại điểm (1, 1) là:',
    options: ['y = 3x - 2', 'y = x + 1', 'y = 2x - 1', 'y = 3x + 1'],
    correctAnswer: 0,
    difficulty: 4,
  },
  {
    id: 8,
    question: 'Tính tích phân ∫e^x·sin(x)dx (dạng phức tạp)',
    options: [
      '(e^x/2)(sin x - cos x) + C',
      'e^x·sin x + C',
      '(e^x/2)(sin x + cos x) + C',
      'e^x·cos x + C',
    ],
    correctAnswer: 0,
    difficulty: 5,
  },
  {
    id: 9,
    question: 'Cho hàm số f(x) = x⁴ - 2x². Số điểm cực trị của hàm số là:',
    options: ['1', '2', '3', '4'],
    correctAnswer: 2,
    difficulty: 4,
  },
  {
    id: 10,
    question: 'Tính thể tích khối tròn xoay khi quay y = √x quanh trục Ox từ x=0 đến x=4',
    options: ['4π', '8π', '16π', '32π'],
    correctAnswer: 1,
    difficulty: 5,
  },
];

type TestState = 'intro' | 'testing' | 'result';

export function PlacementTest({ subjects, onComplete, onBack }: PlacementTestProps) {
  // ❌ ĐÃ XÓA: const navigate = useNavigate(); -> ĐỂ TRANG CHA QUẢN LÝ
  const [testState, setTestState] = useState<TestState>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = placementQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === placementQuestions.length - 1;

  const handleStartTest = () => {
    setTestState('testing');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setShowFeedback(true);

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Calculate level based on correct answers
      const percentage = (correctCount / placementQuestions.length) * 100;
      let calculatedLevel = 1;

      if (percentage >= 90) calculatedLevel = 10;
      else if (percentage >= 80) calculatedLevel = 8;
      else if (percentage >= 70) calculatedLevel = 7;
      else if (percentage >= 60) calculatedLevel = 6;
      else if (percentage >= 50) calculatedLevel = 5;
      else if (percentage >= 40) calculatedLevel = 4;
      else if (percentage >= 30) calculatedLevel = 3;
      else if (percentage >= 20) calculatedLevel = 2;

      setTestState('result');
      
      // Complete onboarding and navigate after 2 seconds
      setTimeout(() => {
        // ✅ CHỈ GỌI HÀM NÀY, KHÔNG GỌI navigate()
        onComplete(calculatedLevel); 
      }, 2000);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowFeedback(false);
    }
  };

  const handleSkipTest = () => {
    // ✅ CHỈ GỌI HÀM NÀY, KHÔNG GỌI navigate()
    onComplete(5);          
  };

  // Intro Screen
  if (testState === 'intro') {
    return (
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-4 border-purple-200 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl"
              >
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
              <CardTitle className="text-purple-700">Kiểm Tra Đầu Vào</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert className="border-2 border-teal-300 bg-teal-50">
                <AlertDescription className="text-gray-700">
                  <strong>Bạn sẽ làm bài kiểm tra đánh giá trình độ</strong> qua 10 câu hỏi ngắn (khoảng 10 phút).
                  <br />
                  <br />
                  Dựa vào kết quả này, QuizMe sẽ:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Xếp bạn vào đúng Chặng (Stage) phù hợp</li>
                    <li>Gợi ý lộ trình học tập cá nhân hóa</li>
                    <li>Đề xuất nội dung ôn tập hiệu quả nhất</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <p className="text-gray-700 text-center">
                  ⚡ <strong>Đừng lo lắng!</strong> Không có đúng hay sai. Hãy làm hết sức mình nhé!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="flex-1 py-6 text-lg border-2 border-gray-300"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Quay lại
                </Button>
                <Button
                  onClick={handleSkipTest}
                  variant="ghost"
                  className="flex-1 py-6 text-lg text-gray-600 hover:bg-gray-100"
                >
                  Bỏ qua (Gán Level 5)
                </Button>
                <Button
                  onClick={handleStartTest}
                  className="flex-1 py-6 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-xl"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Bắt đầu!
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Testing Screen
  if (testState === 'testing') {
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
      <div className="max-w-3xl mx-auto">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  Câu {currentQuestionIndex + 1} / {placementQuestions.length}
                </span>
                <div className="flex gap-1">
                  {placementQuestions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full ${
                        idx < currentQuestionIndex
                          ? 'bg-teal-500'
                          : idx === currentQuestionIndex
                          ? 'bg-purple-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <CardTitle className="text-gray-800">{currentQuestion.question}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === currentQuestion.correctAnswer;
                  const showCorrect = showFeedback && isCorrectAnswer;
                  const showWrong = showFeedback && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: isAnswered ? 1 : 1.02 }}
                      whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        showCorrect
                          ? 'border-green-400 bg-green-50'
                          : showWrong
                          ? 'border-red-400 bg-red-50'
                          : isSelected
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-300 bg-white hover:border-purple-300'
                      } ${isAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800">{option}</span>
                        {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert
                      className={`border-2 ${
                        isCorrect
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-300 bg-red-50'
                      }`}
                    >
                      <AlertDescription>
                        {isCorrect ? (
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <strong>Chính xác! Tuyệt vời!</strong>
                          </div>
                        ) : (
                          <div className="text-red-700">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-5 h-5" />
                              <strong>Chưa đúng rồi!</strong>
                            </div>
                            <p className="text-sm">
                              Đáp án đúng là: <strong>{currentQuestion.options[currentQuestion.correctAnswer]}</strong>
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={handleNextQuestion}
                      className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isLastQuestion ? 'Xem Kết Quả' : 'Câu Tiếp Theo →'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Result Screen
  const percentage = (correctCount / placementQuestions.length) * 100;
  let calculatedLevel = 1;
  if (percentage >= 90) calculatedLevel = 10;
  else if (percentage >= 80) calculatedLevel = 8;
  else if (percentage >= 70) calculatedLevel = 7;
  else if (percentage >= 60) calculatedLevel = 6;
  else if (percentage >= 50) calculatedLevel = 5;
  else if (percentage >= 40) calculatedLevel = 4;
  else if (percentage >= 30) calculatedLevel = 3;
  else if (percentage >= 20) calculatedLevel = 2;

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-4 border-teal-200 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-24 h-24 bg-gradient-to-br from-teal-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl"
            >
              <Brain className="w-12 h-12 text-white" />
            </motion.div>
            <CardTitle className="text-teal-700">Hoàn Thành Đánh Giá!</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="bg-gradient-to-r from-teal-50 to-orange-50 border-2 border-teal-300 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Bạn trả lời đúng <strong className="text-teal-600 text-2xl">{correctCount}/{placementQuestions.length}</strong> câu
              </p>
              <p className="text-gray-700">
                Bạn được xếp vào <strong className="text-orange-600 text-3xl">Level {calculatedLevel}</strong>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
              <p className="text-gray-600">Đang chuẩn bị trải nghiệm cá nhân hóa cho bạn...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
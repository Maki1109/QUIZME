import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Clock, CheckCircle, XCircle, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 1. INTERFACE KHỚP VỚI DB ---
interface Question {
  _id: string; 
  id?: number;
  question: string;
  options: string[];
  correct_answer: number;
  topic: string;
  difficulty: 'nb' | 'th' | 'vd' | 'vdc';
  explanation: string;
}

interface Challenge5MinQuizProps {
  onComplete: (results: QuizResults) => void;
}

export interface QuizResults {
  correctCount: number;
  totalQuestions: number;
  timeSpent: number;
  answers: {
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
    selectedAnswer: number; // ✅ THÊM: Lưu index đáp án user chọn
  }[];
}

export function Challenge5MinQuiz({ onComplete }: Challenge5MinQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [answers, setAnswers] = useState<QuizResults['answers']>([]);
  const [quizStartTime] = useState(Date.now());

  // --- DEBUG LOG ---
  const currentQuestion = questions[currentQuestionIndex];
  useEffect(() => {
    if (currentQuestion) {
      console.log("--- DEBUG CÂU HỎI HIỆN TẠI ---");
      console.log("Câu hỏi:", currentQuestion.question);
      console.log("Tên trường đáp án trong Object:", Object.keys(currentQuestion));
      console.log("Giá trị correct_answer:", currentQuestion.correct_answer);
      console.log("------------------------------");
    }
  }, [currentQuestion]);

  // Fetch câu hỏi
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL;
        
        const response = await fetch(`${baseUrl}/questions/daily-challenge`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Server Response Error:", errorData);
          throw new Error('Không thể tải đề thi từ server');
        }
        
        const data = await response.json();
        
        console.log("🔥 Dữ liệu Challenge trả về:", data); // Debug

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          
          // --- LOGIC MAP DỮ LIỆU (Giống SprintMode) ---
          const formattedQuestions: Question[] = data.data.map((q: any) => {
            // 1. Xử lý nội dung câu hỏi (text vs question)
            const questionContent = q.text || q.question || "Nội dung câu hỏi bị thiếu";

            // 2. Xử lý Topic (ID vs Name)
            let topicName = 'Tổng hợp';
            if (q.topic) {
                if (typeof q.topic === 'object' && q.topic.name) {
                    topicName = q.topic.name; 
                } else if (typeof q.topic === 'string' && q.topic.length < 15) {
                    topicName = q.topic; 
                }
            }

            // 3. Xử lý Đáp án đúng (correctAnswer vs correct_answer vs 'A','B')
            const rawAnswer = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_answer;
            let finalAnswerIndex = 0;
            if (typeof rawAnswer === 'number') {
                finalAnswerIndex = rawAnswer;
            } else if (typeof rawAnswer === 'string') {
                // Map 'A' -> 0, 'B' -> 1...
                const map: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                finalAnswerIndex = map[rawAnswer.toUpperCase()] || 0;
            }

            // 4. Map Difficulty (nếu API trả về 'easy'/'medium'...)
            let diff: any = q.difficulty;
            if (['easy', 'Easy'].includes(diff)) diff = 'nb';
            else if (['medium', 'Medium'].includes(diff)) diff = 'th';
            else if (['hard', 'Hard'].includes(diff)) diff = 'vd';
            else if (['very_hard', 'very hard'].includes(diff)) diff = 'vdc';
            // Fallback nếu vẫn không khớp
            if (!['nb','th','vd','vdc'].includes(diff)) diff = 'th';

            return {
              _id: q._id,
              question: questionContent,
              options: q.options || [],
              correct_answer: finalAnswerIndex,
              topic: topicName,
              difficulty: diff,
              explanation: q.explanation || q.explaination || "Chưa có giải thích chi tiết."
            };
          });

          setQuestions(formattedQuestions);
        } else {
          setError(data.message || 'Không tìm thấy câu hỏi.');
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi tải câu hỏi.");
      } finally {
        setLoading(false);
        setQuestionStartTime(Date.now());
      }
    };
    fetchQuiz();
  }, []);

  // Timer logic
  useEffect(() => {
    if (loading || error || questions.length === 0) return;
    if (timeRemaining <= 0) {
      handleComplete();
      return;
    }
    const timer = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, loading, error, questions.length]);

  const isLastQuestion = questions.length > 0 && currentQuestionIndex === questions.length - 1;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeRemaining > 180) return 'text-teal-600';
    if (timeRemaining > 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Xử lý chọn đáp án
  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;

    setSelectedAnswer(index);
    setIsAnswered(true);
    setShowFeedback(true);

    const dbCorrectAnswer = Number(currentQuestion.correct_answer);
    const isCorrect = index === dbCorrectAnswer;
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion._id,
        isCorrect,
        timeSpent,
        selectedAnswer: index, // ✅ LƯU LẠI ĐÁP ÁN ĐÃ CHỌN
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleComplete = async () => {
    const totalTimeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
    const baseUrl = import.meta.env.VITE_API_URL;

    const payloadAnswers = answers.map(a => ({
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer ?? -1
    }));

    try {
      const token = localStorage.getItem('quizme_token') || localStorage.getItem('token'); 
      
      // 🔥 SỬA: Thay đổi nháy đơn thành dấu huyền `
      const response = await fetch(`${baseUrl}/challenges/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: payloadAnswers,
          totalTimeSpent: totalTimeSpent, 
          type: 'challenge_5min'
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi lưu kết quả');
      }
      console.log("✅ Đã lưu kết quả vào DB thành công!");

    } catch (err) {
      console.error("❌ Không thể lưu kết quả:", err);
      // Vẫn cho người dùng xem kết quả dù lưu lỗi để không gián đoạn trải nghiệm
    }

    // 3. Chuyển sang màn hình kết quả
    onComplete({
      correctCount,
      totalQuestions: questions.length,
      timeSpent: totalTimeSpent,
      answers,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Đang chuẩn bị đề thi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-gray-800">Lỗi tải đề thi</h3>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-orange-500 hover:bg-orange-600">Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Logic
  const dbCorrectAnswer = Number(currentQuestion.correct_answer);
  const isCorrect = selectedAnswer === dbCorrectAnswer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 p-4 pt-8">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm border-2 border-teal-200 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span className="text-gray-700 font-bold">Challenge 5 Phút</span>
            </div>
            <div className={`flex items-center gap-2 ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              <span className="text-xl font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Câu {currentQuestionIndex + 1}/{questions.length}</span>
              <span>{correctCount} câu đúng</span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion._id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-orange-200 shadow-xl bg-white">
              <CardHeader>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">{currentQuestion.topic}</span>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium capitalize ${
                    currentQuestion.difficulty === 'nb' ? 'bg-green-100 text-green-700' :
                    currentQuestion.difficulty === 'th' ? 'bg-blue-100 text-blue-700' :
                    currentQuestion.difficulty === 'vd' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentQuestion.difficulty === 'nb' && 'Nhận biết'}
                    {currentQuestion.difficulty === 'th' && 'Thông hiểu'}
                    {currentQuestion.difficulty === 'vd' && 'Vận dụng'}
                    {currentQuestion.difficulty === 'vdc' && 'Vận dụng cao'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">{currentQuestion.question}</h2>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isThisOptionCorrect = index === dbCorrectAnswer;
                    const isThisOptionSelected = selectedAnswer === index;
                    const showGreen = showFeedback && isThisOptionCorrect;
                    const showRed = showFeedback && isThisOptionSelected && !isThisOptionCorrect;

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: isAnswered ? 1 : 1.01 }}
                        whileTap={{ scale: isAnswered ? 1 : 0.99 }}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={isAnswered}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${
                          showGreen
                            ? 'border-green-500 bg-green-50'
                            : showRed
                            ? 'border-red-500 bg-red-50'
                            : isThisOptionSelected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                        } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-lg ${showGreen ? 'font-bold text-green-800' : showRed ? 'text-red-800' : 'text-gray-700'}`}>
                            {option}
                          </span>
                          {showGreen && <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />}
                          {showRed && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {showFeedback && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <Alert className={`border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <AlertDescription>
                          {isCorrect ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-green-700 text-lg">
                                <CheckCircle className="w-6 h-6" />
                                <strong>Chính xác! Tuyệt vời! 🎉</strong>
                              </div>
                              <div className="text-sm text-green-800 bg-green-50 p-3 rounded-lg border border-green-100">
                                <strong>Giải thích:</strong> {currentQuestion.explanation}
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-700 space-y-3">
                              <div className="flex items-center gap-2 text-lg">
                                <XCircle className="w-6 h-6" />
                                <strong>Chưa đúng rồi!</strong>
                              </div>
                              <div className="text-base bg-white/50 p-3 rounded-lg border border-red-100">
                                Đáp án đúng là: <strong className="text-green-700">{currentQuestion.options[dbCorrectAnswer]}</strong>
                              </div>
                              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <strong>Giải thích:</strong> {currentQuestion.explanation}
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                      <Button onClick={handleNextQuestion} className="w-full mt-4 h-12 text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all">
                        {isLastQuestion ? 'Xem Kết Quả 🏆' : 'Câu Tiếp Theo →'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm border-2 border-green-200 rounded-xl p-3 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1 font-medium">Đúng</p>
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm border-2 border-red-200 rounded-xl p-3 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1 font-medium">Sai</p>
            <p className="text-2xl font-bold text-red-600">{answers.length - correctCount}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm border-2 border-orange-200 rounded-xl p-3 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1 font-medium">Còn lại</p>
            <p className="text-2xl font-bold text-orange-600">{questions.length - answers.length}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
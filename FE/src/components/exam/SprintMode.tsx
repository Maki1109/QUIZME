import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, CheckCircle, XCircle, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';

// --- Interface ---
interface Question {
  id: string; // Đổi thành string vì MongoDB ID là string
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionResult {
  questionId: string; // Đổi thành string
  correct: boolean;
  timeSpent: number;
}

interface SprintModeProps {
  onComplete: (results: {
    correctCount: number;
    totalQuestions: number;
    totalTime: number;
    questionResults: QuestionResult[];
  }) => void;
  onExit: () => void;
}

const SprintMode: React.FC<SprintModeProps> = ({ onComplete, onExit }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  // --- 1. Fetch Questions from API ---
  // --- 1. Fetch Questions from API ---
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        if (!token) return;

        // Gọi API lấy 15 câu hỏi ngẫu nhiên cho Sprint Mode
        const response = await fetch('${import.meta.env.VITE_API_URL}/questions/random?limit=15', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        console.log("🔥 Dữ liệu API trả về:", data);
        
        if (data.success && data.data) {
          // Map dữ liệu từ API sang format của Component
          const formattedQuestions: Question[] = data.data.map((q: any) => {
            const questionContent = q.text || q.question || "Nội dung câu hỏi bị thiếu";

            let topicName = 'Tổng hợp';
            if (q.topic) {
                if (typeof q.topic === 'object' && q.topic.name) {
                    topicName = q.topic.name; // Nếu đã populate
                } else if (typeof q.topic === 'string' && q.topic.length < 15) {
                    topicName = q.topic; // Nếu là tên ngắn (VD: "Toán")
                }
                // Nếu là ID dài (24 ký tự) thì giữ nguyên 'Tổng hợp'
            }

            const rawAnswer = q.correctAnswer !== undefined ? q.correctAnswer : q.correct_answer;
            // Nếu là số thì dùng luôn, nếu là chữ (A,B..) thì parse
            const finalAnswerIndex = typeof rawAnswer === 'number' ? rawAnswer : parseCorrectAnswer(rawAnswer);

            return {
              id: q._id,
              question: questionContent, // Dùng biến đã xử lý ở trên
              options: q.options || [],
              correctAnswer: finalAnswerIndex,
              topic: topicName,
              difficulty: mapDifficulty(q.difficulty)
            };
          });
          
          setQuestions(formattedQuestions);
        } else {
          toast.error("Không tải được câu hỏi.");
        }
      } catch (error) {
        console.error("Lỗi tải câu hỏi Sprint:", error);
        toast.error("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // --- Helper Functions ---
  const parseCorrectAnswer = (ans: string | number): number => {
    if (typeof ans === 'number') return ans;
    const map: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    return map[String(ans).toUpperCase()] || 0;
  };

  const mapDifficulty = (level: number): 'easy' | 'medium' | 'hard' => {
    if (level <= 1) return 'easy';
    if (level === 2 || level === 3) return 'medium';
    return 'hard';
  };

  // --- Timer Logic (Giữ nguyên) ---
  useEffect(() => {
    if (loading || questions.length === 0) return; // Chỉ chạy timer khi đã có câu hỏi

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 9 * 60) return 'text-cyan-400';
    if (timeLeft > 3 * 60) return 'text-orange-400';
    return 'text-red-400';
  };

  // --- Interaction Handlers ---
  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctAnswer;

    const result: QuestionResult = {
      questionId: questions[currentQuestionIndex].id,
      correct: isCorrect,
      timeSpent
    };

    setQuestionResults([...questionResults, result]);
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    const totalTime = 15 * 60 - timeLeft;
    onComplete({
      correctCount,
      totalQuestions: questions.length,
      totalTime,
      questionResults
    });
  };

  const handleAutoSubmit = () => {
    const totalTime = 15 * 60;
    onComplete({
      correctCount,
      totalQuestions: questions.length,
      totalTime,
      questionResults
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return '';
    }
  };

  // --- Render Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg">Đang chuẩn bị phòng thi Sprint...</p>
      </div>
    );
  }

  // --- Render Main Interface (Giữ nguyên) ---
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white">⚡ Sprint Mode</h2>
              <p className="text-cyan-300 text-sm">
                Câu {currentQuestionIndex + 1}/{questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">{correctCount}</span>
            </div>
            <div className={`flex items-center gap-2 ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              <span className="text-xl">{formatTime(timeLeft)}</span>
            </div>
            {/* Nút thoát */}
            <Button variant="ghost" onClick={onExit} className="text-slate-400 hover:text-white hover:bg-white/10">
              Thoát
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-8 h-2" />

        {/* Question Card */}
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-slate-900/50 border-2 border-cyan-500/20">
                <CardContent className="p-6">
                  {/* Topic & Difficulty */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm">
                      {currentQuestion.topic}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(currentQuestion.difficulty)}`}>
                      {getDifficultyText(currentQuestion.difficulty)}
                    </span>
                  </div>

                  {/* Question */}
                  <h3 className="text-white mb-6 text-lg font-medium leading-relaxed">
                    {currentQuestion.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedAnswer === index;
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const showCorrect = showFeedback && isCorrect;
                      const showWrong = showFeedback && isSelected && !isCorrect;

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showFeedback}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            showCorrect
                              ? 'bg-green-500/20 border-green-500 text-green-300'
                              : showWrong
                              ? 'bg-red-500/20 border-red-500 text-red-300'
                              : isSelected
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {showCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
                            {showWrong && <XCircle className="w-5 h-5 text-red-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback */}
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg mb-4 ${
                        selectedAnswer === currentQuestion.correctAnswer
                          ? 'bg-green-500/20 border-2 border-green-500/30'
                          : 'bg-red-500/20 border-2 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {selectedAnswer === currentQuestion.correctAnswer ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-green-300">✅ Chính xác! Tuyệt vời! 🎉</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="text-red-300">
                              ❌ Chưa đúng. Đáp án đúng là: {String.fromCharCode(65 + currentQuestion.correctAnswer)}
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Button */}
                  {!showFeedback ? (
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xác nhận đáp án
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white"
                    >
                      {currentQuestionIndex < questions.length - 1 ? (
                        <>
                          Câu tiếp theo
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      ) : (
                        'Xem kết quả 🎯'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Stats */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm">Đúng: {correctCount}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm">Sai: {questionResults.filter(r => !r.correct).length}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm">Còn lại: {questions.length - (currentQuestionIndex + 1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintMode;
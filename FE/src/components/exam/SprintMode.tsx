import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock, CheckCircle, XCircle, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { toast } from 'sonner';

// --- Interface ---
interface Question {
  id: string; 
  image_url: string;
  question_type: 'MCQ' | 'TrueFalse' | 'ShortAnswer';
  correctAnswer: string;
  topic: string;
  difficulty: string;
}

interface QuestionResult {
  questionId: string; 
  correct: boolean;
  timeSpent: number;
  selectedAnswer: string; 
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
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); 
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  // States cho từng dạng đáp án giống Challenge
  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [tfAnswers, setTfAnswers] = useState<string[]>(["D", "D", "D", "D"]);
  const [shortAnswer, setShortAnswer] = useState("");

  // --- 1. Fetch 10 Questions from API ---
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/questions/random?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const formattedQuestions: Question[] = data.data.map((q: any) => ({
            id: q._id,
            image_url: q.image_url,
            question_type: q.question_type || 'MCQ',
            correctAnswer: q.correct_answer,
            topic: q.topic?.name || q.topic || 'Tổng hợp',
            difficulty: q.difficulty_level || 'th'
          }));
          
          setQuestions(formattedQuestions);
        } else {
          toast.error("Không tải được câu hỏi.");
        }
      } catch (error) {
        console.error("Lỗi tải câu hỏi Sprint:", error);
        toast.error("Lỗi kết nối máy chủ.");
      } finally {
        setLoading(false);
        setQuestionStartTime(Date.now());
      }
    };

    fetchQuestions();
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    if (loading || questions.length === 0) return;

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

  // --- Handlers ---
  const handleTFToggle = (index: number) => {
    if (isAnswered) return;
    const newTF = [...tfAnswers];
    newTF[index] = newTF[index] === "D" ? "S" : "D";
    setTfAnswers(newTF);
  };

  const handleAnswerSubmit = (userValue: string) => {
    if (isAnswered) return;
    const currentQ = questions[currentQuestionIndex];
    
    const isCorrect = userValue.trim().toUpperCase() === currentQ.correctAnswer.trim().toUpperCase();
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    const result: QuestionResult = {
    questionId: currentQuestion.id,
    correct: isCorrect,
    timeSpent: Math.floor((Date.now() - questionStartTime) / 1000),
    selectedAnswer: userValue 
    };

    setQuestionResults([...questionResults, result]);
    if (isCorrect) setCorrectCount(prev => prev + 1);

    setIsAnswered(true);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setShowFeedback(false);
      setSelectedMCQ(null);
      setTfAnswers(["D", "D", "D", "D"]);
      setShortAnswer("");
      setQuestionStartTime(Date.now());
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
  const totalTimeSpent = 900 - timeLeft; // 15 phút * 60s - thời gian còn lại

  // 1. Chuẩn bị dữ liệu để lưu vào bảng ExamAttempt
  const examData = {
    mode: 'sprint', // hoặc 'marathon'
    totalTimeSpent: totalTimeSpent,
    correctCount: correctCount,
    totalQuestions: questions.length,
    // Ánh xạ mảng kết quả của bạn sang format Backend yêu cầu
    answers: questionResults.map(res => ({
      questionId: res.questionId,
      answer: res.selectedAnswer, // Bạn cần đảm bảo đã lưu lại giá trị người dùng chọn
      isCorrect: res.correct,
      timeSpent: res.timeSpent
    }))
  };

  try {
    const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
    
    // 2. Gửi yêu cầu lưu vào Database
    const response = await fetch(`${import.meta.env.VITE_API_URL}/examAttempts/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(examData)
    });

    const result = await response.json();

    if (result.success) {
      toast.success("Kết quả đã được lưu lại!");
      // 3. Gọi callback onComplete để hiện màn hình tổng kết trên UI
      onComplete({
        correctCount,
        totalQuestions: questions.length,
        totalTime: totalTimeSpent,
        questionResults
      });
    }
  } catch (error) {
    console.error("Lỗi khi nộp bài:", error);
    toast.error("Không thể lưu kết quả bài thi.");
  }
};

  const handleAutoSubmit = () => {
    onComplete({
      correctCount,
      totalQuestions: questions.length,
      totalTime: 15 * 60,
      questionResults
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-lg">Đang chuẩn bị phòng thi Sprint...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        {/* Header - GIỮ NGUYÊN */}
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
            <Button variant="ghost" onClick={onExit} className="text-slate-400 hover:text-white hover:bg-white/10">
              Thoát
            </Button>
          </div>
        </div>

        {/* Progress Bar - GIỮ NGUYÊN */}
        <Progress value={progress} className="mb-8 h-2" />

        {/* Question Card - THAY ĐỔI NỘI DUNG THEO CHALLENGE */}
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
                <CardContent className="p-6 space-y-6">
                  {/* Topic Tag */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                      {currentQuestion.topic}
                    </span>
                  </div>

                  {/* ẢNH CÂU HỎI (Giống Challenge) */}
                  <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800/50 flex items-center justify-center p-2 min-h-[250px]">
                    <img 
                      src={currentQuestion.image_url} 
                      alt="Question" 
                      className="max-w-full max-h-[400px] object-contain pointer-events-none" 
                    />
                  </div>

                  {/* CÁC DẠNG TRẢ LỜI (Giống Challenge) */}
                  
                  {/* 1. MCQ */}
                  {currentQuestion.question_type === 'MCQ' && (
                    <div className="grid grid-cols-4 gap-4">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <button
                          key={opt}
                          disabled={isAnswered}
                          onClick={() => { setSelectedMCQ(opt); handleAnswerSubmit(opt); }}
                          className={`h-14 rounded-xl border-2 font-bold text-lg transition-all ${
                            showFeedback && opt === currentQuestion.correctAnswer ? 'border-green-500 bg-green-500/20 text-green-400' :
                            selectedMCQ === opt ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300' : 
                            'border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 2. True/False */}
                  {currentQuestion.question_type === 'TrueFalse' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['a', 'b', 'c', 'd'].map((label, i) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                          <button
                            disabled={isAnswered}
                            onClick={() => handleTFToggle(i)}
                            className={`w-full h-20 rounded-2xl border-4 font-bold text-2xl flex items-center justify-center transition-all ${
                              tfAnswers[i] === "D" ? "border-teal-500 bg-teal-500/10 text-teal-400" : "border-orange-500 bg-orange-500/10 text-orange-400"
                            }`}
                          >
                            {label}.{tfAnswers[i]}
                          </button>
                        </div>
                      ))}
                      {!isAnswered && (
                        <Button 
                          className="col-span-full h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl mt-2" 
                          onClick={() => handleAnswerSubmit(tfAnswers.join(" "))}
                        >
                          XÁC NHẬN ĐÁP ÁN
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 3. Short Answer */}
                  {currentQuestion.question_type === 'ShortAnswer' && (
                    <div className="space-y-4">
                      <Input
                        placeholder="Nhập câu trả lời..."
                        value={shortAnswer}
                        onChange={(e) => setShortAnswer(e.target.value)}
                        disabled={isAnswered}
                        className="h-16 text-center text-2xl font-bold bg-slate-800 border-slate-700 text-white rounded-xl focus:border-cyan-500"
                      />
                      {!isAnswered && (
                        <Button 
                          className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl" 
                          onClick={() => handleAnswerSubmit(shortAnswer)}
                        >
                          NỘP BÀI
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Feedback Message */}
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg flex items-center gap-3 ${
                        questionResults[currentQuestionIndex]?.correct
                          ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                          : 'bg-red-500/20 border border-red-500/30 text-red-300'
                      }`}
                    >
                      {questionResults[currentQuestionIndex]?.correct ? (
                        <><CheckCircle className="w-5 h-5" /> <span>Chính xác!</span></>
                      ) : (
                        <><XCircle className="w-5 h-5" /> <span>Sai rồi. Đáp án: {currentQuestion.correctAnswer}</span></>
                      )}
                    </motion.div>
                  )}

                  {/* Next Button */}
                  {showFeedback && (
                    <Button
                      onClick={handleNextQuestion}
                      className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg rounded-xl"
                    >
                      {currentQuestionIndex < questions.length - 1 ? (
                        <>Câu tiếp theo <ChevronRight className="w-4 h-4 ml-1" /></>
                      ) : (
                        'Xem kết quả tổng quát 🎯'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Stats - GIỮ NGUYÊN */}
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
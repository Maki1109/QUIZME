import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Clock, CheckCircle, XCircle, Zap, Loader2, AlertTriangle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- 1. INTERFACE ---
interface Question {
  _id: string; 
  question_id: string;
  image_url: string;
  question_type: 'MCQ' | 'TrueFalse' | 'ShortAnswer'; 
  topic: string;
  difficulty_level: string;
  irt_difficulty_b: number;
  correct_answer: string;
  explanation: string;
}

interface Challenge5MinQuizProps {
  onComplete: (results: QuizResults) => void;
}

export interface AnalysisData {
  graphData: { subject: string; score: number; fullMark: number }[];
  weakTopics: string[];
  feedback: string;
}

export interface QuizResults {
  correctCount: number;
  totalQuestions: number;
  timeSpent: number;
  answers: {
    questionId: string;
    isCorrect: boolean;
    timeSpent: number;
    selectedAnswer: string;
  }[];
  analysis?: AnalysisData;
}

export function Challenge5MinQuiz({ onComplete }: Challenge5MinQuizProps) {
  // --- STATE ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [answers, setAnswers] = useState<QuizResults['answers']>([]);
  const [quizStartTime] = useState(Date.now());
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [tfAnswers, setTfAnswers] = useState<string[]>(["D", "D", "D", "D"]);
  const [shortAnswer, setShortAnswer] = useState("");

  const currentQuestion = questions[currentQuestionIndex]; 
  const isLastQuestion = questions.length > 0 && currentQuestionIndex === questions.length - 1;

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        const baseUrl = import.meta.env.VITE_API_URL;
        
        const response = await fetch(`${baseUrl}/challenge-5min/start`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải đề thi từ server');
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setQuestions(data.data);
          setAttemptId(data.attemptId); // Lưu attemptId quan trọng để gửi từng câu
        } else {
          setError(data.message || 'Không tìm thấy câu hỏi.');
        }
      } catch (err) {
        setError("Lỗi kết nối server.");
      } finally {
        setLoading(false);
        setQuestionStartTime(Date.now());
      }
    };
    fetchQuiz();
  }, []);

  // --- TIMER ---
  useEffect(() => {
    if (loading || error || questions.length === 0) return;
    if (timeRemaining <= 0) {
      handleComplete();
      return;
    }
    const timer = setInterval(() => setTimeRemaining((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, loading, error, questions.length]);

  // --- LOGIC GỬI KẾT QUẢ TỪNG CÂU (NEW) ---
  const submitSingleAnswer = async (questionId: string, answer: string, timeSpent: number) => {
    if (!attemptId) return;
    
    const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL;

    try {
      // Gọi API submit-answer để lưu ngay vào DB
      await fetch(`${baseUrl}/challenge-5min/submit-answer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          attemptId: attemptId,
          questionId: questionId,
          answer: answer,
          timeSpent: timeSpent
        })
      });
    } catch (err) {
      console.error("Lỗi khi lưu câu trả lời lẻ:", err);
      // Không block UI nếu lỗi mạng, vẫn cho user làm tiếp
    }
  };

  // --- LOGIC XỬ LÝ TRẢ LỜI ---
  const handleMCQSelect = (option: string) => {
    if (showFeedback) return;
    setSelectedOption(option);
    handleAnswerSubmit(option);
  };

  const handleTFToggle = (index: number) => {
    if (showFeedback) return;
    const newAnswers = [...tfAnswers];
    newAnswers[index] = newAnswers[index] === "D" ? "S" : "D";
    setTfAnswers(newAnswers);
  };

  const handleAnswerSubmit = (userValue: string) => {
    if (isAnswered) return;

    let isCorrect = false;
    // So khớp đáp án an toàn
    const correctAns = currentQuestion.correct_answer || "";
    if (currentQuestion.question_type === "TrueFalse") {
      isCorrect = userValue.trim().toUpperCase() === correctAns.trim().toUpperCase();
    } else {
      isCorrect = userValue.trim().toLowerCase() === correctAns.trim().toLowerCase();
    }

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Cập nhật State Local
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion._id,
        isCorrect,
        timeSpent,
        selectedAnswer: userValue,
      },
    ]);

    // [QUAN TRỌNG] Gửi kết quả câu này lên Server ngay lập tức
    submitSingleAnswer(currentQuestion._id, userValue, timeSpent);

    setIsAnswered(true);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTfAnswers(["D", "D", "D", "D"]);
      setShortAnswer("");
      setIsAnswered(false);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    }
  };

  const handleComplete = async () => {
    const totalTimeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
    const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL;
    
    let serverAnalysis: AnalysisData | undefined;

    try {
      // Gửi request chốt bài thi (Server sẽ tính điểm tổng và cộng XP)
      const response = await fetch(`${baseUrl}/challenge-5min/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          attemptId: attemptId,
          answers: answers, // Gửi lại mảng answers lần cuối để chắc chắn đồng bộ
          totalTimeSpent: totalTimeSpent
        })
      });
      
      const data = await response.json();
      if (data.success && data.analysis) {
        serverAnalysis = data.analysis;
      }
    } catch (err) {
      console.error("Lỗi khi lưu kết quả tổng:", err);
    }

    onComplete({
      correctCount: answers.filter((a) => a.isCorrect).length,
      totalQuestions: questions.length,
      timeSpent: totalTimeSpent,
      answers,
      analysis: serverAnalysis // Truyền analysis xuống Result
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-teal-50"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>;

  // Guard clause quan trọng để tránh crash
  if (!currentQuestion) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
        <p className="text-gray-600">Dữ liệu câu hỏi bị trống.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Tải lại</Button>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50 p-4 pt-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress & Timer Card */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-sm border-2 border-teal-200 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
              <span className="font-bold text-gray-700">Challenge 5 Phút</span>
            </div>
            <div className={`flex items-center gap-2 font-mono font-bold text-xl ${timeRemaining < 60 ? 'text-red-600' : 'text-teal-600'}`}>
              <Clock className="w-5 h-5" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion._id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-orange-200 shadow-xl bg-white overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm px-3 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">{currentQuestion?.topic || "Chung"}</span>
                  <span className="text-xs font-black text-orange-400 uppercase tracking-widest">{currentQuestion?.question_type}</span>
                </div>
                
                {/* ẢNH CÂU HỎI RESPONSIVE */}
                {currentQuestion?.image_url && (
                  <div className="rounded-xl overflow-hidden border-2 border-gray-50 bg-gray-50 flex items-center justify-center p-2 shadow-inner transition-all duration-300 mb-4">
                    <img 
                      src={currentQuestion.image_url} 
                      alt="Question" 
                      className="w-full h-auto max-w-full max-h-[300px] object-contain pointer-events-none block" 
                    />
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {/* 1. MCQ */}
                {currentQuestion?.question_type === "MCQ" && (
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {["A", "B", "C", "D"].map((option) => {
                      let btnClass = "h-14 text-lg font-medium rounded-xl border-2 transition-all "; 
                      if (showFeedback) {
                        if (option === currentQuestion.correct_answer) btnClass += "border-green-500 bg-green-50 text-green-700";
                        else if (option === selectedOption) btnClass += "border-red-500 bg-red-50 text-red-700";
                        else btnClass += "border-gray-100 text-gray-300";
                      } else {
                        btnClass += option === selectedOption ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md" : "border-gray-100 text-gray-500 hover:border-orange-200";
                      }
                      return (
                        <button key={option} className={btnClass} onClick={() => handleMCQSelect(option)} disabled={showFeedback}>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. True/False */}
                {currentQuestion?.question_type === "TrueFalse" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    {["a", "b", "c", "d"].map((label, index) => {
                      const userValue = tfAnswers[index];
                      const correctValues = (currentQuestion.correct_answer || "D D D D").split(" ");
                      const isThisCorrectVal = correctValues[index];

                      let cardClass = "h-28 w-full rounded-2xl border-4 font-medium text-4xl transition-all flex items-center justify-center ";
                      
                      if (showFeedback) {
                        cardClass += userValue === isThisCorrectVal ? "border-green-500 bg-green-50 text-green-600 shadow-sm" : "border-red-500 bg-red-50 text-red-600 shadow-sm";
                      } else {
                        cardClass += userValue === "D" ? "border-teal-400 bg-teal-50 text-teal-600" : "border-orange-400 bg-orange-50 text-orange-600 shadow-sm";
                      }

                      return (
                        <div key={label} className="flex flex-col items-center gap-3">
                          <button className={cardClass} onClick={() => handleTFToggle(index)} disabled={showFeedback}>
                            {label}.{tfAnswers[index]}
                          </button>
                          <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wider italic">Ý {label}</span>
                        </div>
                      );
                    })}
                    {!showFeedback && (
                      <Button className="col-span-full h-16 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-2xl mt-4 shadow-lg text-xl" onClick={() => handleAnswerSubmit(tfAnswers.join(" "))}>
                        Xác nhận đáp án <Send className="ml-2 w-6 h-6" />
                      </Button>
                    )}
                  </div>
                )}

                {/* 3. Short Answer */}
                {currentQuestion?.question_type === "ShortAnswer" && (
                  <div className="mb-6 space-y-4">
                    <Input
                      type="text"
                      placeholder="Nhập câu trả lời..."
                      value={shortAnswer}
                      onChange={(e) => setShortAnswer(e.target.value)}
                      disabled={showFeedback}
                      className={`h-16 text-center text-2xl font-medium rounded-2xl border-2 transition-all ${
                        showFeedback ? (answers[currentQuestionIndex]?.isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50") : "border-orange-100 focus:border-orange-500 shadow-inner bg-gray-50/50"
                      }`}
                    />
                    {!showFeedback && (
                      <Button className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-2xl shadow-lg text-lg" onClick={() => handleAnswerSubmit(shortAnswer)} disabled={!shortAnswer}>
                        Xác nhận đáp án
                      </Button>
                    )}
                  </div>
                )}

                {/* Feedback Section */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                      <Alert className={`border-2 rounded-2xl ${answers[currentQuestionIndex]?.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <AlertDescription className="space-y-3">
                          <div className="flex items-center gap-2 font-black text-xl">
                            {answers[currentQuestionIndex]?.isCorrect ? <CheckCircle className="text-green-600 w-7 h-7"/> : <XCircle className="text-red-600 w-7 h-7"/>}
                            {answers[currentQuestionIndex]?.isCorrect ? 'Chính xác! 🎉' : 'Chưa đúng rồi!'}
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl border border-gray-100">
                            <p className="text-gray-700"><strong>Đáp án đúng:</strong> <span className="text-green-700 font-medium">{currentQuestion?.correct_answer}</span></p>
                            {currentQuestion?.explanation && <p className="mt-2 text-gray-500 text-sm italic"><strong>Giải thích:</strong> {currentQuestion.explanation}</p>}
                          </div>
                        </AlertDescription>
                      </Alert>
                      <Button onClick={handleNextQuestion} className="w-full mt-6 h-14 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium text-xl shadow-xl hover:scale-[1.02] transition-transform rounded-2xl">
                        {isLastQuestion ? 'Xem kết quả tổng kết 🏆' : 'Câu tiếp theo →'}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Stats Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm border-2 border-green-200 rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Đúng</p>
            <p className="text-2xl font-black text-green-600">{answers.filter(a => a.isCorrect).length}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm border-2 border-red-200 rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">Sai</p>
            <p className="text-2xl font-black text-red-600">{answers.filter(a => !a.isCorrect).length}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm border-2 border-orange-200 rounded-xl p-3 text-center shadow-sm">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Còn lại</p>
            <p className="text-2xl font-black text-orange-600">{questions.length - answers.length}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
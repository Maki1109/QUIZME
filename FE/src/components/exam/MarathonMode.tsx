import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mountain, Clock, CheckCircle, XCircle, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { toast } from 'sonner';

// --- Interface đồng bộ với DB ---
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
}

interface MarathonModeProps {
  onComplete: (results: {
    correctCount: number;
    totalQuestions: number;
    totalTime: number;
    questionResults: QuestionResult[];
  }) => void;
  onExit: () => void;
}

const MarathonMode: React.FC<MarathonModeProps> = ({ onComplete, onExit }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60); 
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());

  const [selectedMCQ, setSelectedMCQ] = useState<string | null>(null);
  const [tfAnswers, setTfAnswers] = useState<string[]>(["D", "D", "D", "D"]);
  const [shortAnswer, setShortAnswer] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/questions/random?limit=22`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success && data.data) {
          const formatted = data.data.map((q: any) => ({
            id: q._id,
            image_url: q.image_url,
            question_type: q.question_type || 'MCQ',
            correctAnswer: q.correct_answer,
            topic: q.topic?.name || q.topic || 'Tổng hợp',
            difficulty: q.difficulty_level || 'th'
          }));
          setQuestions(formatted);
        }
      } catch (error) {
        toast.error("Lỗi tải đề thi Marathon.");
      } finally {
        setLoading(false);
        setQuestionStartTime(Date.now());
      }
    };
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (loading || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, questions]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

    const result: QuestionResult = { questionId: currentQ.id, correct: isCorrect, timeSpent };
    
    const newResults = [...questionResults];
    const existingIdx = newResults.findIndex(r => r.questionId === currentQ.id);
    if (existingIdx > -1) newResults[existingIdx] = result;
    else newResults.push(result);

    setQuestionResults(newResults);
    if (isCorrect) setCorrectCount(prev => prev + 1);
    setIsAnswered(true);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionStates();
    } else {
      onComplete({ correctCount, totalQuestions: questions.length, totalTime: 5400 - timeLeft, questionResults });
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      resetQuestionStates();
    }
  };

  const resetQuestionStates = () => {
    setIsAnswered(false);
    setShowFeedback(false);
    setSelectedMCQ(null);
    setTfAnswers(["D", "D", "D", "D"]);
    setShortAnswer("");
    setQuestionStartTime(Date.now());
  };

  const toggleMarkQuestion = () => {
    const newMarked = new Set(markedQuestions);
    const qId = questions[currentQuestionIndex].id;
    if (newMarked.has(qId)) newMarked.delete(qId);
    else newMarked.add(qId);
    setMarkedQuestions(newMarked);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-orange-400">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p>Đang tải bộ đề Marathon 22 câu...</p>
    </div>
  );

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 p-4">
      <div className="max-w-5xl mx-auto pt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">🏔️ Marathon Mode (22 Câu)</h2>
              <p className="text-orange-300 text-sm">Câu {currentQuestionIndex + 1}/{questions.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-green-400 font-bold">
                <CheckCircle className="w-5 h-5" /> <span>{correctCount}</span>
             </div>
             <div className="flex items-center gap-2 text-xl font-mono text-white">
                <Clock className="w-5 h-5 text-orange-400" /> {formatTime(timeLeft)}
             </div>
             <Button variant="ghost" onClick={onExit} className="text-slate-400">Thoát</Button>
          </div>
        </div>

        <Progress value={progress} className="mb-6 h-2 bg-slate-800" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card className="bg-slate-900/50 border-2 border-orange-500/20 sticky top-4">
              <CardContent className="p-4">
                <h3 className="text-white text-sm mb-3">Lộ trình bài thi</h3>
                <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
                  {questions.map((q, idx) => {
                    const isDone = questionResults.some(r => r.questionId === q.id);
                    const isCurrent = idx === currentQuestionIndex;
                    const isMarked = markedQuestions.has(q.id);

                    return (
                      <button
                        key={q.id}
                        onClick={() => { setCurrentQuestionIndex(idx); resetQuestionStates(); }}
                        className={`w-10 h-10 rounded-lg text-sm transition-all ${
                          isCurrent ? 'bg-orange-500 text-white ring-2 ring-orange-400' :
                          isDone ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                          isMarked ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                          'bg-slate-700 text-slate-300'
                        }`}
                      >{idx + 1}</button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="bg-slate-900/50 border-2 border-orange-500/20 shadow-2xl">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase">{currentQuestion.topic}</span>
                       <Button onClick={toggleMarkQuestion} variant="outline" size="sm" className={markedQuestions.has(currentQuestion.id) ? 'border-yellow-500 text-yellow-400' : 'text-slate-400'}>
                          <BookOpen className="w-4 h-4 mr-1" /> {markedQuestions.has(currentQuestion.id) ? 'Đã đánh dấu' : 'Đánh dấu'}
                       </Button>
                    </div>

                    <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center p-2 min-h-[250px]">
                       <img src={currentQuestion.image_url} alt="Question" className="max-w-full h-auto object-contain" />
                    </div>

                    {currentQuestion.question_type === 'MCQ' && (
                      <div className="grid grid-cols-4 gap-4">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <button key={opt} disabled={isAnswered} onClick={() => { setSelectedMCQ(opt); handleAnswerSubmit(opt); }}
                            className={`h-14 rounded-xl border-2 font-bold ${showFeedback && opt === currentQuestion.correctAnswer ? 'border-green-500 text-green-400' : selectedMCQ === opt ? 'border-orange-500 text-orange-300' : 'border-slate-700 text-slate-400'}`}
                          >{opt}</button>
                        ))}
                      </div>
                    )}

                    {currentQuestion.question_type === 'TrueFalse' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['a', 'b', 'c', 'd'].map((label, i) => (
                          <button key={label} disabled={isAnswered} onClick={() => handleTFToggle(i)}
                            className={`h-20 rounded-2xl border-4 font-bold text-2xl ${tfAnswers[i] === "D" ? "border-teal-500 text-teal-400" : "border-orange-500 text-orange-400"}`}
                          >{label}.{tfAnswers[i]}</button>
                        ))}
                        {!isAnswered && <Button className="col-span-full h-14 bg-orange-600" onClick={() => handleAnswerSubmit(tfAnswers.join(" "))}>Xác nhận D/S</Button>}
                      </div>
                    )}

                    {currentQuestion.question_type === 'ShortAnswer' && (
                      <div className="space-y-4">
                        <Input placeholder="Nhập kết quả..." value={shortAnswer} onChange={(e) => setShortAnswer(e.target.value)} disabled={isAnswered} className="h-16 text-center text-2xl font-bold bg-slate-800 text-white" />
                        {!isAnswered && <Button className="w-full h-14 bg-orange-600" onClick={() => handleAnswerSubmit(shortAnswer)}>Nộp bài</Button>}
                      </div>
                    )}

                    {showFeedback && (
                       <div className={`p-4 rounded-xl border-2 ${questionResults.find(r => r.questionId === currentQuestion.id)?.correct ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'}`}>
                          {questionResults.find(r => r.questionId === currentQuestion.id)?.correct ? "🎉 Chính xác!" : `❌ Đáp án đúng: ${currentQuestion.correctAnswer}`}
                       </div>
                    )}

                    <div className="flex gap-4">
                      {/* CẬP NHẬT: Màu tím cho chữ "Câu trước" */}
                      <Button 
                        onClick={handlePreviousQuestion} 
                        disabled={currentQuestionIndex === 0} 
                        variant="outline" 
                        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 disabled:opacity-30"
                      >
                        ← Câu trước
                      </Button>
                      
                      {showFeedback && <Button onClick={handleNextQuestion} className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold">{currentQuestionIndex < 21 ? "Câu tiếp theo" : "Xem kết quả"}</Button>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarathonMode;
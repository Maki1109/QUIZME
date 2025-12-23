import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mountain, Clock, CheckCircle, XCircle, ChevronRight, AlertCircle, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuestionResult {
  questionId: number;
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
  // Mock 40 questions for Marathon (simplified - in real app would be full question bank)
  const generateMockQuestions = (): Question[] => {
    const topics = ['Toán', 'Vật Lý', 'Hóa Học'];
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
    
    const baseQuestions = [
      'Tính đạo hàm của hàm số y = 3x² + 2x - 5',
      'Cho tập hợp A = {1, 2, 3}. Số tập con của A là:',
      'Giá trị của log₂(8) bằng:',
      'Phương trình x² - 5x + 6 = 0 có nghiệm:',
      'Trong dao động điều hòa, biên độ dao động là:',
      'Công thức tính động năng của vật là:',
      'Nguyên tử của nguyên tố X có 17 proton. X thuộc nhóm:',
      'Tích phân ∫x dx từ 0 đến 2 bằng:',
      'Sin²α + Cos²α bằng:',
      'Vận tốc ánh sáng trong chân không xấp xỉ:',
    ];

    return Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      question: `Câu ${i + 1}: ${baseQuestions[i % baseQuestions.length]}`,
      options: [
        'Đáp án A',
        'Đáp án B (đúng)',
        'Đáp án C',
        'Đáp án D'
      ],
      correctAnswer: 1,
      topic: topics[i % topics.length],
      difficulty: difficulties[Math.floor(i / 13) % 3]
    }));
  };

  const [questions] = useState<Question[]>(generateMockQuestions());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer countdown
  useEffect(() => {
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
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft > 60 * 60) return 'text-cyan-400'; // > 60 min
    if (timeLeft > 30 * 60) return 'text-orange-400'; // > 30 min
    return 'text-red-400'; // < 30 min
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const result: QuestionResult = {
      questionId: currentQuestion.id,
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

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setQuestionStartTime(Date.now());
    }
  };

  const toggleMarkQuestion = () => {
    const newMarked = new Set(markedQuestions);
    if (newMarked.has(currentQuestion.id)) {
      newMarked.delete(currentQuestion.id);
    } else {
      newMarked.add(currentQuestion.id);
    }
    setMarkedQuestions(newMarked);
  };

  const handleComplete = () => {
    const totalTime = 90 * 60 - timeLeft;
    onComplete({
      correctCount,
      totalQuestions: questions.length,
      totalTime,
      questionResults
    });
  };

  const handleAutoSubmit = () => {
    const totalTime = 90 * 60;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 p-4">
      <div className="max-w-5xl mx-auto pt-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Mountain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white">🏔️ Marathon Mode</h2>
              <p className="text-orange-300 text-sm">
                Câu {currentQuestionIndex + 1}/{questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">{correctCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">{markedQuestions.size}</span>
            </div>
            <div className={`flex items-center gap-2 ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              <span className="text-xl">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="mb-6 h-2" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="md:col-span-1">
            <Card className="bg-slate-900/50 border-2 border-orange-500/20 sticky top-4">
              <CardContent className="p-4">
                <h3 className="text-white text-sm mb-3">Danh sách câu hỏi</h3>
                <div className="grid grid-cols-5 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
                  {questions.map((q, idx) => {
                    const isAnswered = questionResults.some(r => r.questionId === q.id);
                    const isCurrent = idx === currentQuestionIndex;
                    const isMarked = markedQuestions.has(q.id);

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setSelectedAnswer(null);
                          setShowFeedback(false);
                          setQuestionStartTime(Date.now());
                        }}
                        className={`w-10 h-10 rounded-lg text-sm transition-all ${
                          isCurrent
                            ? 'bg-orange-500 text-white ring-2 ring-orange-400'
                            : isAnswered
                            ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                            : isMarked
                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                            : 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-orange-500/50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-500"></div>
                    <span className="text-slate-300">Hiện tại</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50"></div>
                    <span className="text-slate-300">Đã làm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
                    <span className="text-slate-300">Đánh dấu</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Area */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-slate-900/50 border-2 border-orange-500/20">
                  <CardContent className="p-6">
                    {/* Topic & Difficulty */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-sm">
                          {currentQuestion.topic}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(currentQuestion.difficulty)}`}>
                          {getDifficultyText(currentQuestion.difficulty)}
                        </span>
                      </div>
                      <Button
                        onClick={toggleMarkQuestion}
                        variant="outline"
                        size="sm"
                        className={`${
                          markedQuestions.has(currentQuestion.id)
                            ? 'border-yellow-500 text-yellow-400'
                            : 'border-slate-600 text-slate-400'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        {markedQuestions.has(currentQuestion.id) ? 'Đã đánh dấu' : 'Đánh dấu'}
                      </Button>
                    </div>

                    {/* Question */}
                    <h3 className="text-white mb-6 text-lg">
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
                                ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-orange-500/50'
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

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        variant="outline"
                        className="border-slate-600 text-slate-300 disabled:opacity-30"
                      >
                        ← Câu trước
                      </Button>

                      {!showFeedback ? (
                        <Button
                          onClick={handleSubmitAnswer}
                          disabled={selectedAnswer === null}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white disabled:opacity-50"
                        >
                          Xác nhận đáp án
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNextQuestion}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
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
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="flex items-center justify-center gap-4 mt-6">
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
            <span className="text-orange-300 text-sm">
              Còn lại: {questions.length - questionResults.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarathonMode;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, Lightbulb, ChevronRight, X } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

interface AITeacherPracticeQuizProps {
  topic: string;
  questions: Question[];
  onComplete: (correctCount: number, totalCount: number) => void;
  onExit: () => void;
}

export const AITeacherPracticeQuiz: React.FC<AITeacherPracticeQuizProps> = ({
  topic,
  questions,
  onComplete,
  onExit
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after submission
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowFeedback(true);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      onComplete(correctCount + (isCorrect ? 1 : 0), questions.length);
    }
  };

  const getOptionClassName = (index: number) => {
    if (!showFeedback) {
      return selectedAnswer === index
        ? 'border-purple-500 bg-purple-50'
        : 'border-gray-300 hover:border-purple-300 bg-white';
    }

    // After feedback
    if (index === currentQuestion.correctAnswer) {
      return 'border-green-500 bg-green-50';
    }
    if (index === selectedAnswer && !isCorrect) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-300 bg-gray-50 opacity-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl text-gray-900">Luyện tập: {topic}</h2>
            <p className="text-gray-600">
              Câu {currentQuestionIndex + 1} / {questions.length}
            </p>
          </div>
          <button
            onClick={onExit}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-600 mt-1">{Math.round(progress)}% hoàn thành</p>
        </div>

        {/* Question Card */}
        <Card className="border-2 border-purple-200 mb-6">
          <CardContent className="p-8">
            <div className="mb-6">
              <h3 className="text-xl text-gray-900 mb-4">{currentQuestion.question}</h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getOptionClassName(index)}`}
                  whileHover={!showFeedback ? { scale: 1.02 } : {}}
                  whileTap={!showFeedback ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                      showFeedback && index === currentQuestion.correctAnswer
                        ? 'bg-green-500 border-green-600'
                        : showFeedback && index === selectedAnswer && !isCorrect
                        ? 'bg-red-500 border-red-600'
                        : selectedAnswer === index
                        ? 'bg-purple-500 border-purple-600'
                        : 'border-gray-400'
                    }`}>
                      {showFeedback && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-5 h-5 text-white" />
                      )}
                      {showFeedback && index === selectedAnswer && !isCorrect && (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                      {!showFeedback && (
                        <span className={selectedAnswer === index ? 'text-white' : 'text-gray-600'}>
                          {String.fromCharCode(65 + index)}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 text-gray-900">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit Button */}
            {!showFeedback && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  size="lg"
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  Xác nhận
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={`border-4 ${
                isCorrect 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-teal-50' 
                  : 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50'
              }`}>
                <CardContent className="p-6">
                  {/* Feedback Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {isCorrect ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl text-green-700">✅ Chính xác!</h3>
                          <p className="text-green-600">Bạn đã hiểu rồi đấy!</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                          <XCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl text-red-700">❌ Sai rồi!</h3>
                          <p className="text-red-600">Xem lời giải để hiểu rõ hơn</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Explanation (Always show for wrong, optional for correct) */}
                  {!isCorrect && (
                    <Card className="bg-white border-2 border-orange-200 mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-gray-900 mb-2">💡 Lời giải thích:</h4>
                            <p className="text-gray-700">{currentQuestion.explanation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Correct Answer Highlight */}
                  {!isCorrect && (
                    <div className="mb-4 p-3 bg-green-100 border-2 border-green-300 rounded-lg">
                      <p className="text-green-800">
                        <strong>Đáp án đúng:</strong> {String.fromCharCode(65 + currentQuestion.correctAnswer)}. {currentQuestion.options[currentQuestion.correctAnswer]}
                      </p>
                    </div>
                  )}

                  {/* Next Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      size="lg"
                      onClick={handleNext}
                      className={`w-full ${
                        isCorrect
                          ? 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
                          : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                      } text-white`}
                    >
                      {isCorrect ? 'Tiếp tục' : 'Đã hiểu, tiếp tục'}
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Counter (floating) */}
        <div className="fixed bottom-6 right-6">
          <Card className="border-2 border-purple-300 shadow-xl">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Điểm hiện tại</p>
                <p className="text-2xl text-purple-600">
                  {correctCount}/{currentQuestionIndex + (showFeedback ? 1 : 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AITeacherPracticeLobby } from './AITeacherPracticeLobby';
import { AITeacherPracticeQuiz } from './AITeacherPracticeQuiz';
import { AITeacherPracticeResult } from './AITeacherPracticeResult';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

interface AITeacherPracticeContainerProps {
  topic: string;
  incorrectCount?: number;
  totalCount?: number;
  onClose: () => void;
}

export const AITeacherPracticeContainer: React.FC<AITeacherPracticeContainerProps> = ({
  topic,
  incorrectCount = 3,
  totalCount = 5,
  onClose
}) => {
  const [stage, setStage] = useState<'lobby' | 'quiz' | 'result'>('lobby');
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });

  // Mock questions - trong thực tế sẽ fetch từ API dựa trên topic
  const questions: Question[] = [
    {
      id: 1,
      question: 'Tính chất nào sau đây của logarit là đúng?',
      options: [
        'log(a + b) = log(a) + log(b)',
        'log(ab) = log(a) + log(b)',
        'log(a - b) = log(a) - log(b)',
        'log(a/b) = log(a) × log(b)'
      ],
      correctAnswer: 1,
      explanation: 'Tính chất logarit của tích: log(ab) = log(a) + log(b). Đây là một trong những tính chất cơ bản nhất của logarit, được sử dụng rất nhiều trong các bài toán.',
      topic: topic
    },
    {
      id: 2,
      question: 'Cho log₂(8) = x. Giá trị của x là:',
      options: ['2', '3', '4', '8'],
      correctAnswer: 1,
      explanation: 'log₂(8) = log₂(2³) = 3. Vì 2³ = 8, nên log₂(8) = 3.',
      topic: topic
    },
    {
      id: 3,
      question: 'Điều kiện để log_a(x) xác định là:',
      options: [
        'a > 0, a ≠ 1, x > 0',
        'a > 0, x > 0',
        'a ≠ 0, x ≠ 0',
        'a > 1, x > 0'
      ],
      correctAnswer: 0,
      explanation: 'Để log_a(x) xác định cần 3 điều kiện: a > 0 (cơ số dương), a ≠ 1 (cơ số khác 1), và x > 0 (biểu thức trong log phải dương).',
      topic: topic
    },
    {
      id: 4,
      question: 'Rút gọn biểu thức: log(100) - log(10) = ?',
      options: ['1', '10', '90', '2'],
      correctAnswer: 0,
      explanation: 'log(100) - log(10) = log(100/10) = log(10) = 1. Áp dụng tính chất log(a) - log(b) = log(a/b).',
      topic: topic
    },
    {
      id: 5,
      question: 'Nếu log₂(x) = 5, thì x bằng:',
      options: ['10', '25', '32', '64'],
      correctAnswer: 2,
      explanation: 'Nếu log₂(x) = 5, thì x = 2⁵ = 32. Đây là định nghĩa cơ bản của logarit.',
      topic: topic
    }
  ];

  const handleStart = () => {
    setStage('quiz');
  };

  const handleComplete = (correctCount: number, totalCount: number) => {
    setFinalScore({ correct: correctCount, total: totalCount });
    setStage('result');
  };

  const handleBackToDashboard = () => {
    onClose();
  };

  const calculateXP = () => {
    const percentage = (finalScore.correct / finalScore.total) * 100;
    if (percentage === 100) return 30;
    if (percentage >= 80) return 25;
    if (percentage >= 60) return 20;
    return 15;
  };

  return (
    <>
      {stage === 'lobby' && (
        <AITeacherPracticeLobby
          topic={topic}
          incorrectCount={incorrectCount}
          totalCount={totalCount}
          onStart={handleStart}
          onCancel={onClose}
        />
      )}

      {stage === 'quiz' && (
        <AITeacherPracticeQuiz
          topic={topic}
          questions={questions}
          onComplete={handleComplete}
          onExit={onClose}
        />
      )}

      {stage === 'result' && (
        <AITeacherPracticeResult
          topic={topic}
          correctCount={finalScore.correct}
          totalCount={finalScore.total}
          xpEarned={calculateXP()}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
    </>
  );
};

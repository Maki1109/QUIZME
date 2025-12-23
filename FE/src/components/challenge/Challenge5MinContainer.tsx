import { useState } from 'react';
import { Challenge5MinLobby } from './Challenge5MinLobby';
import { Challenge5MinQuiz, QuizResults } from './Challenge5MinQuiz';
import { Challenge5MinResult } from './Challenge5MinResult';

type ChallengeState = 'lobby' | 'quiz' | 'result';

interface Challenge5MinContainerProps {
  onExit: () => void;
}

export function Challenge5MinContainer({ onExit }: Challenge5MinContainerProps) {
  const [state, setState] = useState<ChallengeState>('lobby');
  const [results, setResults] = useState<QuizResults | null>(null);

  const handleStart = () => {
    setState('quiz');
  };

  const handleComplete = (quizResults: QuizResults) => {
    setResults(quizResults);
    setState('result');
  };

  const handleRetry = () => {
    // In production, this would check if user can retry (daily limit)
    setState('lobby');
    setResults(null);
  };

  const handleBackToDashboard = () => {
    onExit();
  };

  if (state === 'lobby') {
    return <Challenge5MinLobby onStart={handleStart} onBack={onExit} />;
  }

  if (state === 'quiz') {
    return <Challenge5MinQuiz onComplete={handleComplete} />;
  }

  if (state === 'result' && results) {
    return (
      <Challenge5MinResult
        results={results}
        onRetry={handleRetry}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return null;
}

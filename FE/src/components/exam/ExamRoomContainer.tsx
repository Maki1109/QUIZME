import React, { useState } from 'react';
import ExamRoomLobby from './ExamRoomLobby';
import SprintMode from './SprintMode';
import MarathonMode from './MarathonMode';
import RankingMode from './RankingMode';
import ExamRoomResult from './ExamRoomResult';

interface QuestionResult {
  questionId: number;
  correct: boolean;
  timeSpent: number;
}

interface ExamResults {
  correctCount: number;
  totalQuestions: number;
  totalTime: number;
  questionResults: QuestionResult[];
}

interface ExamRoomContainerProps {
  onExit: () => void;
}

type Screen = 'lobby' | 'sprint' | 'marathon' | 'ranking' | 'result';
type Mode = 'sprint' | 'marathon' | 'ranking';

const ExamRoomContainer: React.FC<ExamRoomContainerProps> = ({ onExit }) => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('lobby');
  const [currentMode, setCurrentMode] = useState<Mode>('sprint');
  const [examResults, setExamResults] = useState<ExamResults | null>(null);

  const handleStartSprint = () => {
    setCurrentMode('sprint');
    setCurrentScreen('sprint');
  };

  const handleStartMarathon = () => {
    setCurrentMode('marathon');
    setCurrentScreen('marathon');
  };

  const handleStartRanking = () => {
    setCurrentScreen('ranking');
  };

  const handleStartDailyRanking = () => {
    // For ranking mode, we use Sprint as the daily challenge
    setCurrentMode('ranking');
    setCurrentScreen('sprint');
  };

  const handleExamComplete = (results: ExamResults) => {
    setExamResults(results);
    setCurrentScreen('result');
  };

  const handleBackToLobby = () => {
    setCurrentScreen('lobby');
    setExamResults(null);
  };

  const handleRetry = () => {
    setExamResults(null);
    // Go back to the same mode
    setCurrentScreen(currentMode);
  };

  // Helper để render nội dung
  const renderContent = () => {
    switch (currentScreen) {
      case 'lobby':
        return (
          <ExamRoomLobby
            onStartSprint={handleStartSprint}
            onStartMarathon={handleStartMarathon}
            onStartRanking={handleStartRanking}
            onBack={onExit}
          />
        );

      case 'sprint':
        return (
          <SprintMode
            onComplete={handleExamComplete}
            onExit={handleBackToLobby}
          />
        );

      case 'marathon':
        return (
          <MarathonMode
            onComplete={handleExamComplete}
            onExit={handleBackToLobby}
          />
        );

      case 'ranking':
        return (
          <RankingMode
            onStartDaily={handleStartDailyRanking}
            onBack={handleBackToLobby}
          />
        );

      case 'result':
        return examResults ? (
          <ExamRoomResult
            mode={currentMode}
            correctCount={examResults.correctCount}
            totalQuestions={examResults.totalQuestions}
            totalTime={examResults.totalTime}
            questionResults={examResults.questionResults}
            onBackToDashboard={onExit}
            onRetry={handleRetry}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full">
      {renderContent()}
    </div>
  );
};

export default ExamRoomContainer;
/**
 * Exam Room Page
 * Route: /exam-room, /exam-room/sprint, /exam-room/marathon, /exam-room/ranking
 */

import { useParams, useNavigate } from 'react-router-dom';
import ExamRoomContainer from '../components/exam/ExamRoomContainer';

export function ExamRoomPage() {
  const { mode } = useParams<{ mode?: string }>();
  const navigate = useNavigate();

  const handleExit = () => {
    navigate('/dashboard');
  };

  return <ExamRoomContainer onExit={handleExit} />;
}


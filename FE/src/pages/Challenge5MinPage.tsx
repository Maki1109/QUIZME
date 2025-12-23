/**
 * Challenge 5 Min Page
 * Route: /challenge-5min
 */

import { useNavigate } from 'react-router-dom';
import { Challenge5MinContainer } from '../components/challenge/Challenge5MinContainer';

export function Challenge5MinPage() {
  const navigate = useNavigate();

  const handleExit = () => {
    navigate('/dashboard');
  };

  return <Challenge5MinContainer onExit={handleExit} />;
}


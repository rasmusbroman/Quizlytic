'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuizParticipant from '@/components/quiz/QuizParticipant';

export default function JoinQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPin = searchParams.get('pin') || '';
  
  const [pinCode, setPinCode] = useState(initialPin);
  const [participantName, setParticipantName] = useState('');
  const [showParticipant, setShowParticipant] = useState(false);
  
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode && participantName) {
      setShowParticipant(true);
    }
  };
  
  if (showParticipant) {
    return <QuizParticipant initialPinCode={pinCode} />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-6 text-center">Join a Quiz</h1>
        
        <form onSubmit={handleJoin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Quiz PIN Code</label>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition"
          >
            Join Quiz
          </button>
        </form>
      </div>
    </div>
  );
}
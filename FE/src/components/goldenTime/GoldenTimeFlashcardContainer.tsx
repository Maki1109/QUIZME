import React, { useState, useEffect } from 'react';
import { GoldenTimeFlashcard } from './GoldenTimeFlashcard';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Papa from 'papaparse';

// Interface cho dữ liệu Flashcard trong App
export interface FlashcardData {
  id: number;
  topic: string;
  question: string;
  answer: string;
  example?: string;
  icon: string;
}

// Interface cho dòng dữ liệu trong file CSV (Khớp với header file CSV của bạn)
interface CsvRow {
  ID: string;
  Front: string; // Tên cột trong CSV là Front
  Back: string;  // Tên cột trong CSV là Back
}

interface GoldenTimeFlashcardContainerProps {
  onClose: () => void;
}

export const GoldenTimeFlashcardContainer: React.FC<GoldenTimeFlashcardContainerProps> = ({
  onClose
}) => {
  const [stage, setStage] = useState<'loading' | 'flashcard' | 'completed'>('loading');
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);

  useEffect(() => {
    const fetchAndParseCSV = async () => {
      try {
        // Đảm bảo file 100_flashcard.csv nằm trong thư mục public
        const response = await fetch('/100_flashcard.csv');
        if (!response.ok) throw new Error("Không tìm thấy file CSV");

        const reader = response.body?.getReader();
        const result = await reader?.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result?.value);

        Papa.parse<CsvRow>(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const allCards = results.data;
            
            // 1. Trộn ngẫu nhiên (Fisher-Yates Shuffle)
            const shuffled = [...allCards];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }

            // 2. Lấy 5 thẻ ngẫu nhiên và map dữ liệu đúng cột
            const selectedCards: FlashcardData[] = shuffled.slice(0, 5).map((card, index) => ({
              id: index + 1,
              topic: 'Toán học', // Bạn có thể thêm cột Topic vào CSV nếu muốn động
              question: card.Front || 'Lỗi dữ liệu câu hỏi', // Map từ cột Front
              answer: card.Back || 'Lỗi dữ liệu đáp án',     // Map từ cột Back
              example: '', // File CSV hiện tại chưa có cột Example
              icon: '📐'
            }));

            setFlashcards(selectedCards);
            setStage('flashcard');
          },
          error: (err) => {
            console.error("Lỗi đọc CSV:", err);
            setStage('flashcard'); 
          }
        });
      } catch (error) {
        console.error("Lỗi fetch file:", error);
        setStage('flashcard');
      }
    };

    fetchAndParseCSV();
  }, []);

  const handleComplete = () => {
    setStage('completed');
  };

  if (stage === 'loading') {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (stage === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 p-6 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full">
          <Card className="border-4 border-green-300 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="text-8xl mb-4">✅</div>
              <h1 className="text-3xl text-gray-900 mb-2">Hoàn thành!</h1>
              <p className="text-gray-600 mb-6">Bạn đã ôn tập xong 5 flashcards.</p>
              <Button size="lg" onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white text-xl h-14">
                <CheckCircle className="w-6 h-6 mr-2" /> Về trang chủ
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <GoldenTimeFlashcard
      cards={flashcards}
      onComplete={handleComplete}
      onExit={onClose}
    />
  );
};
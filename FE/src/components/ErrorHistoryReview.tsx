import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

// Interface cho dữ liệu thật từ API
interface QuestionDetail {
  _id: string;
  question: string;
  options: string[];
  correct_answer?: string;
  correctAnswer?: string;
  explanation?: string;
  topic: string;
}

interface WrongAnswer {
  id: string;
  question: string;
  userAnswerIndex: number; // Index user chọn (0,1,2,3)
  correctAnswerIndex: number; // Index đúng (0,1,2,3)
  options: string[];
  explanation: string;
  topic: string;
  date: string;
}

interface ErrorHistoryReviewProps {
  onBack: () => void;
}

export const ErrorHistoryReview: React.FC<ErrorHistoryReviewProps> = ({ onBack }) => {
  const [errors, setErrors] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm chuyển đổi đáp án A/B/C/D hoặc string số sang index (0,1,2,3)
  const normalizeAnswerToIndex = (ans: string | number | undefined): number => {
    if (ans === undefined || ans === null) return -1;
    if (typeof ans === 'number') return ans;
    const map: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, '0': 0, '1': 1, '2': 2, '3': 3 };
    return map[String(ans).toUpperCase()] ?? -1;
  };

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('${import.meta.env.VITE_API_URL}/challenges/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();

        if (data.success && data.data) {
          const wrongQuestions: WrongAnswer[] = [];

          // Duyệt qua từng bài thi
          data.data.forEach((attempt: any) => {
            const attemptDate = new Date(attempt.completedAt).toLocaleDateString('vi-VN');

            // Duyệt qua từng câu trả lời trong bài thi
            attempt.answers.forEach((ans: any) => {
              // 1. Kiểm tra nếu sai VÀ có dữ liệu câu hỏi (do đã populate ở backend)
              if (!ans.isCorrect && ans.questionId && typeof ans.questionId === 'object') {
                const qDetail = ans.questionId as QuestionDetail;

                // 2. Lấy index đáp án đúng (ưu tiên correct_answer từ CSV)
                const correctIndex = normalizeAnswerToIndex(qDetail.correct_answer || qDetail.correctAnswer);
                
                // 3. Lấy index user chọn
                const userIndex = normalizeAnswerToIndex(ans.answer);

                wrongQuestions.push({
                  id: ans._id || Math.random().toString(),
                  question: qDetail.question,
                  options: qDetail.options,
                  userAnswerIndex: userIndex,
                  correctAnswerIndex: correctIndex,
                  explanation: qDetail.explanation || "Chưa có giải thích chi tiết cho câu này.",
                  topic: qDetail.topic || "Tổng hợp",
                  date: attemptDate
                });
              }
            });
          });

          setErrors(wrongQuestions);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử sai:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, []);

  if (loading) {
    return (
      // ✅ Background đỏ nhạt khi loading
      <div className="flex flex-col items-center justify-center h-screen bg-red-50">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-rose-700 font-medium">Đang phân tích các lỗi sai của bạn...</p>
      </div>
    );
  }

  return (
    // ✅ Background đỏ nhạt toàn màn hình
    <div className="min-h-screen bg-red-50 p-4 md:p-8">
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack} className="hover:bg-red-100 text-rose-700">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-rose-900 flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-600" />
              Kho Lỗi Sai
            </h1>
            <p className="text-rose-700 mt-1">Xem lại để không mắc sai lầm lần nữa!</p>
          </div>
        </div>

        {errors.length === 0 ? (
          // Empty State
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border-2 border-rose-100">
            <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🌟</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tuyệt vời!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Hệ thống chưa ghi nhận câu sai nào gần đây. Hãy tiếp tục làm bài tập để thử thách bản thân nhé.
            </p>
            <Button onClick={onBack} size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-200">
              Quay lại luyện tập
            </Button>
          </div>
        ) : (
          // List Error Items
          <div className="space-y-6">
            <div className="flex justify-between items-center text-rose-800 font-medium mb-2 px-2">
              <span>Tìm thấy {errors.length} câu cần ôn tập</span>
            </div>
            
            {errors.map((err, index) => (
              <motion.div 
                key={err.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 border-l-4 border-l-rose-500 shadow-md hover:shadow-lg transition-all bg-white overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-rose-50 to-white pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-white border border-rose-200 rounded-md text-xs font-bold text-rose-600 uppercase tracking-wide">
                          {err.topic}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs text-gray-500 font-medium flex items-center gap-1">
                          📅 {err.date}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg md:text-xl text-gray-800 leading-relaxed font-bold">
                      <span className="text-rose-500 mr-2">#{index + 1}.</span>
                      {err.question}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pt-6 space-y-5">
                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      {err.options.map((opt, i) => {
                        const isSelected = i === err.userAnswerIndex;
                        const isCorrect = i === err.correctAnswerIndex;
                        
                        let containerStyle = "border-gray-100 bg-gray-50 hover:bg-gray-100";
                        let icon = null;
                        let textStyle = "text-gray-700";

                        if (isSelected && !isCorrect) {
                          containerStyle = "border-rose-200 bg-rose-50";
                          textStyle = "text-rose-700 font-medium";
                          icon = <XCircle className="w-5 h-5 text-rose-500" />;
                        } else if (isCorrect) {
                          containerStyle = "border-emerald-200 bg-emerald-50";
                          textStyle = "text-emerald-700 font-bold";
                          icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
                        } else if (isSelected && isCorrect) {
                           // Trường hợp hiếm (nếu logic lọc sai sót), vẫn hiển thị đúng
                           containerStyle = "border-emerald-200 bg-emerald-50";
                           icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
                        }

                        return (
                          <div key={i} className={`p-3.5 rounded-xl border-2 flex items-center justify-between transition-colors ${containerStyle}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                                isCorrect ? 'bg-emerald-200 border-emerald-300 text-emerald-800' :
                                isSelected ? 'bg-rose-200 border-rose-300 text-rose-800' :
                                'bg-white border-gray-300 text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span className={textStyle}>{opt}</span>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
                      <BookOpen className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-500 uppercase mb-1">Giải thích chi tiết</p>
                        <p className="text-sm text-indigo-900 leading-relaxed">
                          {err.explanation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
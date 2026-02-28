import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

// --- 1. INTERFACE (Đồng bộ với Question trong Challenge5MinQuiz) ---
interface QuestionDetail {
  _id: string;
  question: string;       // Nội dung câu hỏi
  image_url?: string;     // Link ảnh (quan trọng)
  options: string[];      // Danh sách đáp án [Op1, Op2, Op3, Op4]
  correct_answer?: string;
  correctAnswer?: string; // Fallback nếu DB dùng tên khác
  explanation?: string;
  topic: string;
  question_type?: string;
}

interface WrongAnswer {
  id: string;
  question: string;
  image_url?: string;     // Thêm trường này vào state local
  userAnswerIndex: number;
  correctAnswerIndex: number;
  options: string[];
  explanation: string;
  topic: string;
  date: string;
  question_type?: string;
}

interface ErrorHistoryReviewProps {
  onBack: () => void;
}

export const ErrorHistoryReview: React.FC<ErrorHistoryReviewProps> = ({ onBack }) => {
  const [errors, setErrors] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm chuẩn hóa đáp án sang index (0,1,2,3)
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

        const response = await fetch(`${import.meta.env.VITE_API_URL}/challenges/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();

        if (data.success && data.data) {
          const wrongQuestions: WrongAnswer[] = [];

          data.data.forEach((attempt: any) => {
            const attemptDate = new Date(attempt.completedAt).toLocaleDateString('vi-VN');

            attempt.answers.forEach((ans: any) => {
              // Kiểm tra câu sai và có dữ liệu câu hỏi
              if (!ans.isCorrect && ans.questionId && typeof ans.questionId === 'object') {
                const qDetail = ans.questionId as QuestionDetail;
                
                const correctIndex = normalizeAnswerToIndex(qDetail.correct_answer || qDetail.correctAnswer);
                const userIndex = normalizeAnswerToIndex(ans.answer);

                wrongQuestions.push({
                  id: ans._id || Math.random().toString(),
                  question: qDetail.question || "Nội dung câu hỏi không tồn tại",
                  // --- LẤY ẢNH TỪ DATA ---
                  image_url: qDetail.image_url, 
                  options: qDetail.options || [], 
                  userAnswerIndex: userIndex,
                  correctAnswerIndex: correctIndex,
                  explanation: qDetail.explanation || "Chưa có giải thích chi tiết.",
                  topic: qDetail.topic || "Tổng hợp",
                  date: attemptDate,
                  question_type: qDetail.question_type
                });
              }
            });
          });

          setErrors(wrongQuestions);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-rose-700 font-medium">Đang tải lại các câu làm sai...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
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
            <p className="text-rose-700 mt-1">Ôn tập lại những kiến thức đã hổng</p>
          </div>
        </div>

        {errors.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-rose-100">
            <h2 className="text-2xl font-bold text-gray-800">Tuyệt vời!</h2>
            <p className="text-gray-600 mt-2">Gần đây bạn không làm sai câu nào cả.</p>
            <Button onClick={onBack} className="mt-6 bg-rose-500 hover:bg-rose-600 text-white">Quay lại</Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center text-rose-800 font-medium px-2">
              <span>Tìm thấy {errors.length} câu cần ôn tập</span>
            </div>
            
            {errors.map((err, index) => (
              <motion.div 
                key={err.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-white overflow-hidden rounded-2xl ring-1 ring-rose-100">
                  {/* Header Card */}
                  <CardHeader className="bg-gradient-to-r from-rose-50 to-white pb-4 border-b border-rose-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white border border-rose-200 rounded-full text-xs font-bold text-rose-600 uppercase tracking-wide">
                          {err.topic}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
                          {err.date}
                        </span>
                      </div>
                    </div>
                    
                    {/* NỘI DUNG CÂU HỎI */}
                    <CardTitle className="text-lg md:text-xl text-gray-800 font-bold leading-relaxed">
                      <span className="text-rose-500 mr-2">#{index + 1}.</span>
                      {err.question}
                    </CardTitle>

                    {/* --- HIỂN THỊ ẢNH (Style giống trang Challenge) --- */}
                    {err.image_url && (
                      <div className="mt-4 rounded-xl overflow-hidden border-2 border-gray-50 bg-gray-50 flex items-center justify-center p-2 shadow-inner">
                        <img 
                          src={err.image_url} 
                          alt="Question Illustration" 
                          className="w-full h-auto max-w-full max-h-[300px] object-contain block"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pt-6 space-y-6">
                    {/* --- HIỂN THỊ ĐÁP ÁN --- */}
                    <div className="grid grid-cols-1 gap-3">
                      {err.options && err.options.length > 0 ? (
                        err.options.map((opt, i) => {
                          const isSelected = i === err.userAnswerIndex;
                          const isCorrect = i === err.correctAnswerIndex;
                          
                          // Style logic: Đúng (Xanh), Sai (Đỏ), Còn lại (Xám)
                          let styleClass = "border-gray-100 bg-white text-gray-600";
                          let icon = null;

                          if (isCorrect) {
                            styleClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-500 shadow-sm";
                            icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;
                          } else if (isSelected && !isCorrect) {
                            styleClass = "border-rose-500 bg-rose-50 text-rose-800 font-medium ring-1 ring-rose-500 shadow-sm";
                            icon = <XCircle className="w-5 h-5 text-rose-600" />;
                          }

                          return (
                            <div key={i} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${styleClass}`}>
                              <div className="flex items-center gap-3 w-full">
                                <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold border ${
                                  isCorrect ? 'bg-emerald-200 border-emerald-300 text-emerald-800' :
                                  isSelected ? 'bg-rose-200 border-rose-300 text-rose-800' :
                                  'bg-gray-50 border-gray-200 text-gray-400'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="text-sm md:text-base">{opt}</span>
                              </div>
                              {icon}
                            </div>
                          );
                        })
                      ) : (
                        // Fallback nếu không có options (ví dụ câu tự luận hoặc lỗi data)
                        <div className="text-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                           <p className="text-gray-500 italic text-sm">Câu hỏi này không có các lựa chọn trắc nghiệm.</p>
                        </div>
                      )}
                    </div>

                    {/* --- GIẢI THÍCH --- */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex gap-4 items-start">
                      <BookOpen className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-indigo-500 uppercase mb-2 tracking-wider">Giải thích chi tiết</p>
                        <p className="text-sm md:text-base text-indigo-900 leading-relaxed">
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
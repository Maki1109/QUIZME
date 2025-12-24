import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import { TrendingUp, TrendingDown, Target, BookOpen, Zap, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Mascot } from './Mascot';

// --- INTERFACES ---
interface SpiderData {
  subject: string;
  score: number;
  fullMark: number;
}

interface WeakTopic {
  id: string;
  topic: string;
  score: number;
  trend: string;
  wrongQuestions: number;
  totalQuestions: number;
  commonErrors: string[];
  icon: string;
}

interface ProgressData {
  date: string;
  score: number;
  week?: string;
}

interface ErrorData {
  difficulty: string;
  correct: number;
  incorrect: number;
  total: number;
  percentage: number;
  color: string;
}

export function AnalyticsDashboard() {
  // --- STATE ---
  const [spiderData, setSpiderData] = useState<SpiderData[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  
  // Chỉ giữ lại state cho Error By Type (Dạng câu hỏi)
  const [errorByType, setErrorByType] = useState<ErrorData[]>([]);
  
  const [loading, setLoading] = useState(true);

  // --- FETCH API ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('quizme_token') || localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        
        const headers = { 'Authorization': `Bearer ${token}` };

        const baseUrl = import.meta.env.VITE_API_URL;

        const [radarRes, weakRes, progressRes, errorRes] = await Promise.all([
          fetch(`${baseUrl}/analytics/competency-radar`, { headers }),
          fetch(`${baseUrl}/analytics/weak-topics`, { headers }),
          fetch(`${baseUrl}/analytics/progress-trend`, { headers }),
          fetch(`${baseUrl}/analytics/error-analysis/by-difficulty`, { headers })
        ]);

        const radarJson = await radarRes.json();
        const weakJson = await weakRes.json();
        const progJson = await progressRes.json();
        const errorJson = await errorRes.json();

        if (radarJson.success) setSpiderData(radarJson.data);
        if (weakJson.success) setWeakTopics(weakJson.data);

        if (progJson.success) {
          const formatted = progJson.data.map((item: any) => {
            const date = new Date(item.date);
            return {
              ...item,
              week: `${date.getDate()}/${date.getMonth() + 1}`, // Format ngày/tháng ngắn gọn
              score: item.score
            };
          });
          setProgressData(formatted);
        }

        if (errorJson.success) {
          // Chỉ lấy dữ liệu gốc để hiển thị theo Dạng câu hỏi (Nhận biết, Thông hiểu...)
          setErrorByType(errorJson.data);
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Helper: Icon cho dạng câu hỏi
  const getIconForType = (label: string) => {
    const l = label ? label.toLowerCase() : '';
    if (l.includes('nhận biết')) return '👁️';
    if (l.includes('thông hiểu')) return '💡';
    if (l.includes('vận dụng cao')) return '🚀';
    if (l.includes('vận dụng')) return '⚙️';
    return '🎯';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-2 text-indigo-500" />
        <p>Đang phân tích dữ liệu học tập...</p>
      </div>
    );
  }

  // (Tiếp tục phần Render bên dưới...)

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <Card className="bg-gradient-to-br from-indigo-400 via-purple-400 to-fuchsia-400 text-white border-0 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-white text-2xl mb-2 flex items-center gap-3">
                <Target className="w-8 h-8" />
                Bảng Phân Tích Chuyên Sâu
              </CardTitle>
              <p className="text-white/90">
                AI Coach phân tích chi tiết để giúp bạn tiến bộ nhanh hơn
              </p>
            </div>
            <Mascot emotion="thinking" size="large" />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview">Tổng Quan</TabsTrigger>
          <TabsTrigger value="weaknesses">Điểm Yếu</TabsTrigger>
          <TabsTrigger value="progress">Tiến Độ</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: OVERVIEW --- */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Radar Chart */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                Biểu Đồ Năng Lực Tổng Hợp
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">Tổng quan trực quan + Dữ liệu định lượng chi tiết</p>
            </CardHeader>
            <CardContent>
              {spiderData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={spiderData}>
                        <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Radar name="Điểm số" dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.5} strokeWidth={2} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-gray-700 font-bold">📊 Chi Tiết Điểm Số</h4>
                    <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {spiderData.map((item, index) => {
                        const isWeak = item.score < 60;
                        return (
                          <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 mb-2 ${isWeak ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                            <p className="text-gray-900 flex-1 font-medium">{item.subject}</p>
                            <div className="flex items-center gap-3">
                              <Progress value={item.score} className="w-24 h-2" />
                              <p className={`text-lg font-bold w-12 text-right ${isWeak ? 'text-red-600' : 'text-green-600'}`}>{item.score}%</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">Chưa có dữ liệu để hiển thị biểu đồ.</div>
              )}
            </CardContent>
          </Card>

          {/* Error Analysis - Simplified */}
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-400 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-gray-900">Phân Tích Lỗi Sai</h3>
                    <p className="text-sm text-gray-600">Bạn mất điểm ở đâu?</p>
                  </div>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Phân tích theo Độ khó Câu Hỏi */}
              <div>
                <h4 className="text-gray-700 mb-4 flex items-center gap-2">📊 Phân tích theo Độ khó Câu Hỏi</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {errorByType.length > 0 ? errorByType.map((item, index) => {
                    const isWeak = item.percentage < 60;
                    return (
                      <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                        className={`relative overflow-hidden rounded-xl border-2 p-4 ${isWeak ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getIconForType(item.difficulty)}</span>
                            <div>
                              <p className="text-gray-900 font-bold">{item.difficulty}</p>
                              <p className="text-xs text-gray-500">{item.total} câu</p>
                            </div>
                          </div>
                          <p className={`text-3xl font-bold ${isWeak ? 'text-red-600' : 'text-green-600'}`}>{item.percentage}%</p>
                        </div>
                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 1 }} />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">✓ {item.correct} đúng</span>
                          <span className="text-red-600">✗ {item.incorrect} sai</span>
                        </div>
                      </motion.div>
                    );
                  }) : <p className="text-gray-500 italic">Chưa đủ dữ liệu phân tích dạng câu hỏi.</p>}
                </div>
              </div>

              {/* AI Insight Section */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-rose-50 via-pink-50 to-fuchsia-50 border-4 border-rose-300 rounded-xl p-6 mt-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-rose-900 mb-3 flex items-center gap-2 text-lg">💡 <strong>AI Coach Phát Hiện</strong></h4>
                    
                    {errorByType.some(e => e.percentage < 50) ? (
                      <div className="bg-red-100 border-2 border-red-300 rounded-lg p-3 mb-3">
                        <p className="text-red-800">⚠️ Cần cải thiện: Các câu hỏi dạng <strong>{errorByType.find(e => e.percentage < 50)?.difficulty}</strong> đang có tỉ lệ đúng thấp.</p>
                      </div>
                    ) : (
                      <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 mb-3">
                        <p className="text-green-800">✅ Làm tốt lắm! Bạn đang duy trì phong độ ổn định.</p>
                      </div>
                    )}
                    
                    <div className="bg-white/80 border-2 border-rose-300 rounded-lg p-4 mt-4">
                      <p className="text-gray-800 mb-3">🎯 <strong>Kế hoạch hành động:</strong> Luyện tập thêm 15 phút mỗi ngày với các chủ đề yếu.</p>
                      <div className="grid grid-cols-3 gap-3">
                        <Button className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white border-0 h-auto py-3 flex flex-col items-center gap-1">
                          <BookOpen className="w-5 h-5" /><span className="text-xs">Ôn Vận Dụng Cao</span>
                        </Button>
                        <Button className="bg-gradient-to-r from-rose-400 to-pink-400 text-white border-0 h-auto py-3 flex flex-col items-center gap-1">
                          <Target className="w-5 h-5" /><span className="text-xs">Làm đề Rất Khó</span>
                        </Button>
                        <Button className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 h-auto py-3 flex flex-col items-center gap-1">
                          <Zap className="w-5 h-5" /><span className="text-xs">Luyện Tốc Độ</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: WEAKNESSES --- */}
        <TabsContent value="weaknesses" className="space-y-6 mt-6">
          <div className="grid gap-4">
            {weakTopics.length > 0 ? weakTopics.map((topic, index) => (
              <motion.div key={topic.id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{topic.icon}</div>
                        <div>
                          <h3 className="text-gray-900 flex items-center gap-2 text-lg font-bold">
                            {topic.topic}
                            <Badge className="bg-red-500"><TrendingDown className="w-3 h-3 mr-1" /> Cần cải thiện</Badge>
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{topic.wrongQuestions}/{topic.totalQuestions} câu sai • Điểm TB: {topic.score}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl text-orange-600 font-bold">{topic.score}</div>
                        <Progress value={topic.score} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                    {/* Common Errors */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <p className="text-red-900 mb-2"><strong>❌ Lỗi thường gặp:</strong></p>
                      <ul className="space-y-1">
                        {topic.commonErrors && topic.commonErrors.length > 0 ? topic.commonErrors.map((err, i) => (
                          <li key={i} className="text-red-700 text-sm flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span>{err}</li>
                        )) : <li className="text-red-700 text-sm">Chưa ghi nhận lỗi cụ thể.</li>}
                      </ul>
                    </div>
                    {/* Action Buttons */}
                    <div className="grid md:grid-cols-3 gap-3 pt-2 mt-4">
                      <Button className="bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-90" size="sm">
                        <BookOpen className="w-4 h-4 mr-2" /> Ôn Lại Kiến Thức
                      </Button>
                      <Button className="bg-gradient-to-r from-rose-400 to-pink-400 hover:opacity-90" size="sm">
                        <Zap className="w-4 h-4 mr-2" /> Luyện Dạng Tương Tự
                      </Button>
                      <Button className="bg-gradient-to-r from-indigo-400 to-purple-400 hover:opacity-90" size="sm">
                        <Clock className="w-4 h-4 mr-2" /> Thêm vào Thời Điểm Vàng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">Tuyệt vời! Hiện tại chưa có chủ đề yếu nào.</p>
              </div>
            )}
          </div>

          {/* AI Coach Suggestion Card */}
          <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-300">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <Mascot emotion="excited" size="medium" />
                <div className="flex-1">
                  <h3 className="text-cyan-900 mb-2 font-bold">💡 AI Coach Gợi Ý</h3>
                  <p className="text-cyan-700 mb-4">
                    Nếu bạn tập trung ôn lại <strong>{weakTopics[0]?.topic || "các chủ đề yếu"}</strong> trong 3 ngày tới, điểm số dự kiến có thể tăng mạnh!
                  </p>
                  <Button className="bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-90">
                    <Target className="w-4 h-4 mr-2" /> Bắt Đầu Kế Hoạch 3 Ngày
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: PROGRESS --- */}
        <TabsContent value="progress" className="space-y-6 mt-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Tiến Độ Theo Thời Gian
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="week" tick={{ fill: '#475569' }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#475569' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <div className="text-center py-12 text-gray-500">Chưa có dữ liệu lịch sử.</div>}

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-green-900 font-bold">Tăng trưởng</span>
                  </div>
                  <p className="text-3xl text-green-600 font-bold">Ổn định</p>
                  <p className="text-green-700 text-sm">Duy trì phong độ nhé!</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-900 font-bold">Điểm cao nhất</span>
                  </div>
                  <p className="text-3xl text-blue-600 font-bold">{Math.max(...progressData.map(p => p.score), 0)}</p>
                  <p className="text-blue-700 text-sm">Trong tuần qua</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900 font-bold">Mục tiêu</span>
                  </div>
                  <p className="text-3xl text-purple-600 font-bold">90+</p>
                  <p className="text-purple-700 text-sm">Tuần sau (khả thi!)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
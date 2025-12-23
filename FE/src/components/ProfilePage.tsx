import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Input } from './ui/input'; // Cần component Input
import { 
  Mail, Calendar, Trophy, Flame, Target, TrendingUp, 
  Award, Star, BookOpen, Clock, Edit, Settings, Save, X 
} from 'lucide-react';
import { motion } from 'motion/react';
import { userService } from '../services/userService';
import { toast } from 'sonner';

// Interface cho dữ liệu Profile
interface UserProfileData {
  name: string;
  email: string;
  joinDate: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  streak: number;
  totalStudyDays: number;
  totalTests: number;
  totalQuestions: number;
  accuracy: number;
}

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  const [profile, setProfile] = useState<UserProfileData>({
    name: 'Người dùng',
    email: '...',
    joinDate: '...',
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    streak: 0,
    totalStudyDays: 0,
    totalTests: 0,
    totalQuestions: 0,
    accuracy: 0,
  });

  // Fetch Data từ API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        // Giả sử backend trả về data khớp cấu trúc, nếu không bạn cần map lại field ở đây
        // Ví dụ logic map dữ liệu:
        setProfile({
          name: data.name,
          email: data.email,
          joinDate: new Date(data.createdAt).toLocaleDateString('vi-VN'),
          level: data.level || 1,
          xp: data.currentXP || 0,
          nextLevelXp: (data.level || 1) * 500 + 500, // Logic tính XP lên cấp (giả lập)
          streak: data.streak || 0,
          totalStudyDays: data.stats?.totalStudyDays || 0,
          totalTests: data.stats?.totalTestsTaken || 0,
          totalQuestions: data.stats?.totalQuestionsAttempted || 0,
          // Tính độ chính xác: (Số câu đúng / Tổng câu) * 100
          accuracy: data.stats?.totalQuestionsAttempted > 0 
            ? Math.round((data.stats.correctAnswers / data.stats.totalQuestionsAttempted) * 100) 
            : 0,
        });
        setEditName(data.name);
      } catch (error) {
        console.error("Lỗi tải profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Xử lý lưu tên mới
  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      await userService.updateProfile({ name: editName });
      setProfile(prev => ({ ...prev, name: editName }));
      setIsEditing(false);
      toast.success("Đã cập nhật tên hiển thị!");
    } catch (error) {
      toast.error("Lỗi khi cập nhật tên.");
    }
  };

  // Tạo Initials từ tên (Vd: Nguyen Van A -> NA)
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const xpProgress = (profile.xp / profile.nextLevelXp) * 100;

  // Dữ liệu hiển thị Grid Stats
  const statsDisplay = [
    { label: 'Tổng số ngày học', value: profile.totalStudyDays, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { label: 'Chuỗi học tập', value: `${profile.streak} ngày`, icon: Flame, color: 'from-orange-500 to-red-500' },
    { label: 'Bài kiểm tra', value: profile.totalTests, icon: BookOpen, color: 'from-purple-500 to-pink-500' },
    { label: 'Câu hỏi đã làm', value: profile.totalQuestions.toLocaleString(), icon: Target, color: 'from-green-500 to-teal-500' },
    { label: 'Độ chính xác', value: `${profile.accuracy}%`, icon: TrendingUp, color: 'from-indigo-500 to-purple-500' },
    { label: 'Huy hiệu', value: `0/6`, icon: Award, color: 'from-yellow-500 to-orange-500' }, 
  ];

  if (loading) return <div className="p-10 text-center">Đang tải thông tin...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar - Dynamic Initials */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-500 text-white text-4xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Nút Edit Avatar (Placeholder) */}
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 bg-white text-purple-600 hover:bg-white/90"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {/* User Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  {/* EDIT NAME MODE */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-gray-900 bg-white/90 max-w-xs h-10"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveName} className="bg-green-500 hover:bg-green-600 border-0">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" onClick={() => setIsEditing(false)} className="bg-red-500 hover:bg-red-600 border-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mb-2 group">
                      <h2 className="text-white text-3xl font-bold truncate">{profile.name}</h2>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 hover:text-white"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Tham gia: {profile.joinDate}</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" className="bg-white/20 border-white text-white hover:bg-white/30 self-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Cài đặt
                </Button>
              </div>

              {/* Level Progress */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                    <div>
                      <p className="text-white text-lg font-bold">Level {profile.level}</p>
                      <p className="text-white/80 text-xs">{profile.xp} / {profile.nextLevelXp} XP</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-400 text-yellow-900 border-0">
                    {profile.nextLevelXp - profile.xp} XP nữa lên cấp!
                  </Badge>
                </div>
                <Progress value={xpProgress} className="h-3 bg-white/30" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 ">
        {statsDisplay.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all border-l-4" style={{borderLeftColor: '#a855f7'}}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase font-semibold mb-1">{stat.label}</p>
                    <p className="text-gray-900 text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Badges Section (Giữ nguyên UI Mockup hoặc chờ API) */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Huy Hiệu & Thành Tích
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Mock badges - bạn có thể thay bằng dynamic data sau này */}
            {[
              { id: 1, name: 'Chiến binh 7 ngày', icon: '🔥', unlocked: profile.streak >= 7 },
              { id: 2, name: 'Bậc thầy Logarit', icon: '🔢', unlocked: true },
              { id: 3, name: 'Tốc độ ánh sáng', icon: '⚡', unlocked: true },
              { id: 4, name: 'Người chinh phục', icon: '🏆', unlocked: false },
              { id: 5, name: 'Hoàn hảo', icon: '🎯', unlocked: profile.accuracy === 100 },
              { id: 6, name: 'Huyền thoại', icon: '👑', unlocked: profile.level >= 10 },
            ].map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: badge.unlocked ? 1.05 : 1 }}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  badge.unlocked 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="text-4xl mb-2 grayscale-0">{badge.unlocked ? badge.icon : '🔒'}</div>
                <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {badge.name}
                </h4>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study History (Placeholder - Cần API history riêng) */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-500" />
            Hoạt Động Gần Đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Chức năng lịch sử chi tiết đang được cập nhật...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/**
 * Test Library Page
 * Route: /test-library
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Mascot } from '../components/Mascot';
import { TestsHub } from '../components/TestsHub'; // ✨ ĐÃ ĐỔI: Import TestsHub

export function TestLibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Set active tab là 'tests' (Phòng Thi)
  const [activeTab, setActiveTab] = useState('tests');

  // Hàm xử lý khi bấm nút "Bắt đầu ngay" trong TestsHub -> chuyển sang ExamRoom
  const handleOpenExamRoom = () => {
    navigate('/exam-room');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-indigo-50">
      
      {/* --- HEADER & NAVIGATION --- */}
      <header className="bg-white border-b border-purple-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-8 flex-1">
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => navigate('/dashboard')}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-slate-700 font-bold">QuizMe</h1>
              </div>

              {/* Navigation Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-10 bg-slate-100/50 border border-slate-200 p-1 rounded-lg">
                  <TabsTrigger 
                    value="dashboard" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/dashboard')}
                  >
                    Daily Quiz
                  </TabsTrigger>
                  
                  {/* Tab Active */}
                  <TabsTrigger 
                    value="tests" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    // Đang ở đây
                  >
                    Phòng Thi
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="analytics" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/analytics')}
                  >
                    Phân Tích
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="roadmap" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/roadmap')}
                  >
                    Lộ Trình
                  </TabsTrigger>
                  
                  
                  <TabsTrigger 
                    value="profile" 
                    className="h-8 px-4 text-slate-600 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm rounded-md transition-all"
                    onClick={() => navigate('/profile')}
                  >
                    Thành Tích
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Right: User Info */}
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 px-3 py-1.5 rounded-full border border-purple-200">
                  <span className="text-slate-700 font-medium text-sm">
                    Level {user?.level || 1}
                  </span>
                </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white hover:scale-105 transition-transform shadow-md relative"
              >
                <span className="text-xl">👋</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="py-6 px-6">
        {/* ✨ Gọi TestsHub thay vì TestLibrary */}
        <TestsHub onOpenExamRoom={handleOpenExamRoom} />
      </main>

    </div>
  );
}
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import QuizmeLogo from "../components/QuizmeLogo";
import "./Homepage.css"; 

const Homepage = () => {

  const isLoggedIn = !!localStorage.getItem("token"); 

  return (
    <div className="homepage-scope min-h-screen bg-background">
      
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between py-4 px-6">
        <QuizmeLogo className="h-10" />
        <nav className="flex items-center gap-6">
          <Link 
            to={isLoggedIn ? "/dashboard" : "/login"} 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>

          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Liên hệ
          </Link>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Đăng nhập
          </Link>
          <Link to="/register">
            <Button className="rounded-full px-6">Đăng ký</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-4 animate-fade-in">
          <span className="text-gradient">Trải nghiệm học tập</span>
          <span className="text-gradient block mt-3">cá nhân hóa</span>
        </h1>
        <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          AI quizzes giúp bạn bứt phá điểm số
        </p>
        <Link to="/register">
          <Button size="lg" className="rounded-full px-8 py-6 text-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Dùng thử
          </Button>
        </Link>

        {/* App Preview */}
        <div className="mt-12 relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="max-w-4xl mx-auto rounded-2xl shadow-2xl bg-card border overflow-hidden">
            {/* Mock app interface */}
            <div className="bg-secondary/50 px-4 py-3 flex items-center gap-2 border-b">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 flex justify-center gap-2 text-xs text-muted-foreground">
                <span className="px-3 py-1 bg-background rounded-full">QuizMe</span>
                <span className="px-3 py-1">Daily quizzes</span>
                <span className="px-3 py-1">Flashcards</span>
                <span className="px-3 py-1">Roadmap</span>
              </div>
            </div>
            {/* Sửa bg-linear -> bg-gradient để chắc chắn hiện màu */}
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent">
              <div className="bg-card rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Thử Thách 5 Phút Hôm Nay</h3>
                    <p className="text-sm text-muted-foreground">Luyện tập nhanh hiệu quả ngày lập tức</p>
                  </div>
                  <Button className="ml-auto">Bắt đầu ngay!</Button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span>Hoàn thành Challenge của ngày</span>
                      <span className="ml-auto text-xs text-muted-foreground">+50 XP</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary/50"></div>
                      <span>Làm 10 câu hỏi</span>
                      <span className="ml-auto text-xs text-muted-foreground">+30 XP</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-muted"></div>
                      <span>Học 1 bài mới</span>
                      <span className="ml-auto text-xs text-muted-foreground">+40 XP</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>📊 Study Streak</span>
                      <span className="font-semibold">365 ngày</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>✨ XP Hôm nay</span>
                      <span className="font-semibold">170</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>📚 Số câu đúng</span>
                      <span className="font-semibold">535</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>⭐ Xếp hạng</span>
                      <span className="font-semibold">10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gradient">
          Quizme khiến việc học thú vị hơn
        </h2>

        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="animate-slide-in">
            <p className="text-sm font-medium text-primary mb-2">✨ Personalized quizzes</p>
            <h3 className="text-2xl font-bold mb-4">Quiz cá nhân hóa theo khả năng học sinh</h3>
            <p className="text-muted-foreground mb-6">
              Mỗi các quiz sẽ được tạo dựa trên kết quả làm bài của mỗi học sinh
            </p>
            <Link to="/register">
              <Button variant="outline" className="rounded-full">
                Bắt đầu sử dụng ngay →
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-accent rounded-2xl p-6 shadow-xl">
              <div className="bg-card rounded-xl p-4 shadow-lg">
                <p className="text-sm text-muted-foreground mb-2">Quiz #1</p>
                <p className="font-semibold mb-4">Chọn đáp án đúng</p>
                <div className="grid grid-cols-4 gap-2">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className={`rounded-lg p-4 text-center font-bold ${opt === 'C' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="order-2 md:order-1 relative">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-50 rounded-2xl p-6 shadow-xl">
              <div className="bg-card rounded-xl p-4 shadow-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Flashcards</p>
                <p className="font-semibold mb-4">Công thức toán</p>
                <p className="text-2xl font-bold text-primary">TAN(X).COT(X) = ?</p>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2 animate-slide-in">
            <p className="text-sm font-medium text-primary mb-2">📚 Personalized flashcards</p>
            <h3 className="text-2xl font-bold mb-4">Flashcard lý thuyết sử dụng space repetition</h3>
            <p className="text-muted-foreground mb-6">
              Các flashcards được gợi ý dựa trên kết quả làm quiz của học sinh
            </p>
            <Link to="/register">
              <Button variant="outline" className="rounded-full">
                Bắt đầu sử dụng ngay →
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-in">
            <p className="text-sm font-medium text-primary mb-2">💡 Student Analysis</p>
            <h3 className="text-2xl font-bold mb-4">Hệ thống AI phân tích khả năng và gợi ý lộ trình học phù hợp</h3>
            <p className="text-muted-foreground mb-6">
              Hệ thống AI phân tích điểm mạnh điểm yếu của học sinh và gợi ý lộ trình học phù hợp
            </p>
            <Link to="/register">
              <Button variant="outline" className="rounded-full">
                Bắt đầu sử dụng ngay →
              </Button>
            </Link>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-xl">
              <div className="bg-card rounded-xl p-4 shadow-lg">
                <div className="h-32 flex items-end justify-around gap-2">
                  {[40, 60, 80, 45, 70, 55, 90].map((h, i) => (
                    <div key={i} className="w-8 bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-around mt-2 text-xs text-muted-foreground">
                  <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/30 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold text-primary mb-2">QuizMe</h3>
              <p className="text-sm text-muted-foreground mb-4">Học đi rồi thi</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Nhập email của bạn" 
                  className="flex-1 px-4 py-2 rounded-full border bg-background text-sm"
                />
                <Button size="sm" className="rounded-full">→</Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Trợ giúp</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Thông tin tài khoản</Link></li>
                <li><Link to="#" className="hover:text-foreground">Giới thiệu</Link></li>
                <li><Link to="#" className="hover:text-foreground">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Cập nhật</Link></li>
                <li><Link to="#" className="hover:text-foreground">Bảo mật</Link></li>
                <li><Link to="#" className="hover:text-foreground">Beta test</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kết nối</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-foreground">Facebook</Link></li>
                <li><Link to="#" className="hover:text-foreground">Youtube</Link></li>
                <li><Link to="#" className="hover:text-foreground">Linkedin</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2025 QuizMe. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link to="#" className="hover:text-foreground">Điều khoản sử dụng</Link>
              <Link to="#" className="hover:text-foreground">Chính sách bảo mật</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
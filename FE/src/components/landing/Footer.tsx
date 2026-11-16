import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Container, Wordmark } from "./primitives";

const columns = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Góc học", href: "#showcase" },
      { label: "Tính năng", href: "#features" },
      { label: "Bảng giá", href: "#pricing" },
      { label: "Hỏi đáp", href: "#faq" },
    ],
  },
  {
    title: "Học tập",
    links: [
      { label: "Phòng thi", href: "/exam-room" },
      { label: "Thử thách 5 phút", href: "/challenge-5min" },
      { label: "Thời điểm vàng", href: "/golden-time" },
      { label: "Lộ trình", href: "/roadmap" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đăng nhập", href: "/login" },
      { label: "Đăng ký", href: "/register" },
      { label: "Quên mật khẩu", href: "/forgot-password" },
    ],
  },
];

const linkClass = "font-medium text-ink/75 transition-colors hover:text-butter";

const FooterLink = ({ href, label }: { href: string; label: string }) =>
  href.startsWith("#") ? (
    <a href={href} className={linkClass}>
      {label}
    </a>
  ) : (
    <Link to={href} className={linkClass}>
      {label}
    </Link>
  );

const Footer = () => (
  <footer className="overflow-hidden border-t border-ink/10 bg-[#070B09] pt-20 text-ink">
    <Container>
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="text-4xl">
            <Wordmark />
          </p>
          <p className="mt-5 max-w-sm leading-relaxed text-ink/75">
            Huấn luyện viên AI cá nhân giúp học sinh THPT ôn thi có trọng tâm, nhớ lâu và tự tin hơn.
          </p>
          <a
            href="mailto:hello@quizme.com.vn"
            className="btn-lime mt-8 normal-case"
          >
            hello@quizme.com.vn <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {columns.map((col) => (
          <div key={col.title} className="md:col-span-2">
            <p className="eyebrow mb-5 !text-butter">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <FooterLink {...l} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-20 flex flex-col gap-3 border-t border-ink/15 py-6 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} QuizMe. Bảo lưu mọi quyền.</p>
        <p className="eyebrow !text-ink/60">Your AI Personal Trainer</p>
      </div>
    </Container>

    {/* Oversized wordmark, cropped at the bottom edge */}
    <div className="pointer-events-none select-none" aria-hidden="true">
      <p className="display -mb-[4vw] text-center !leading-[0.8] text-[27vw] !text-ink/[0.07]">QuizMe</p>
    </div>
  </footer>
);

export default Footer;

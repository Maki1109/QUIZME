import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Container, Ribbon } from "./primitives";
import { ScribbleArrow } from "./showcase-kit";
import { StickerField, type StickerSpec } from "./StickerField";
import { STICKERS } from "./stickers";
import { Kinetic } from "./kinetic";

/** Placement on the board: d = desktop, m = phone, as [left %, top %, width %]. */
const heroStickers: StickerSpec[] = [
  { id: "mascot", ...STICKERS.mascot, d: [57.5, 13, 16.5], m: [31, 0, 38] },
  { id: "hello", ...STICKERS.hello, d: [75.5, 10.5, 15.5], m: [1, 9, 37] },
  { id: "qr", ...STICKERS.qr, d: [90.5, 15, 8], rot: 4 },
  { id: "bubble", ...STICKERS.bubble, d: [55.5, 43, 12], m: [66, 6, 32] },
  { id: "ticket", ...STICKERS.ticket, d: [67, 40.5, 18], m: [3, 44, 46] },
  { id: "burst", ...STICKERS.burst, d: [85.5, 37, 12.5], m: [56, 37, 33] },
  { id: "bolt", ...STICKERS.bolt, d: [49.5, 60, 7.2] },
  { id: "seal", ...STICKERS.seal, d: [58, 59.5, 13.5], m: [36, 64, 33] },
  { id: "notebook", ...STICKERS.notebook, d: [73.5, 57.5, 12], m: [70, 62, 28] },
  { id: "flame", ...STICKERS.flame, d: [88, 58, 9.5], m: [6, 66, 24] },
  { id: "pencil", ...STICKERS.pencil, d: [70.5, 80, 19] },
];

/** Ruler numbers sit on the heavy grid lines (every fifth cell = 220px). */
const RULER = Array.from({ length: 10 }, (_, i) => i);

const HeroSection = () => {
  const [touched, setTouched] = useState(false);

  return (
    <section className="board relative isolate overflow-hidden">
      {/* Ruler along the top and left edge of the board */}
      <div className="mono-note pointer-events-none absolute inset-0 select-none text-ink/35" aria-hidden="true">
        {RULER.map((i) => (
          <span key={`x${i}`} className="absolute top-[82px] pl-1.5" style={{ left: i * 220 }}>
            {String(i * 5).padStart(2, "0")}
          </span>
        ))}
        {RULER.slice(1, 6).map((i) => (
          <span key={`y${i}`} className="absolute left-1.5 hidden -translate-y-full pb-1 sm:block" style={{ top: i * 220 }}>
            {String(i * 5).padStart(2, "0")}
          </span>
        ))}
      </div>

      {/* Chalk left on the board from the last lesson */}
      <p className="font-hand pointer-events-none absolute bottom-[128px] left-[40%] hidden rotate-2 select-none text-[1.2rem] text-ink/[0.14] xl:block" aria-hidden="true">
        y′ = 0 ⇒ cực trị?
      </p>

      <Container className="relative z-10 pb-6 pt-[124px] lg:flex lg:min-h-[max(720px,min(100svh,920px))] lg:flex-col lg:justify-center lg:pb-[150px] lg:pt-[120px]">
        <div className="max-w-[46rem]">
          <p className="rise inline-flex items-center gap-2.5 rounded-full border border-ink/25 bg-black/15 px-3.5 py-1.5">
            <span className="live-dot" />
            <span className="eyebrow !text-ink">Mở đăng ký · Mùa thi THPT 2027</span>
          </p>

          <h1
            className="rise display mt-7 text-[3.5rem] !leading-[0.93] sm:text-[5.25rem] lg:text-[6.5rem] xl:text-[8.25rem]"
            style={{ animationDelay: "60ms" }}
          ><Kinetic>
            Học ít hơn,
            <br />
            <em>nhớ</em> lâu hơn</Kinetic>
          </h1>

          <p className="rise mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-2 sm:text-xl" style={{ animationDelay: "140ms" }}>
            QuizMe là huấn luyện viên AI cho học sinh THPT: tìm đúng lỗi bạn hay mắc, nhắc ôn ngay trước khi bạn quên, và giữ độ khó vừa
            sức để bạn luôn tiến bộ.
          </p>

          <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
            <Link to="/register" className="btn-pop !h-14 !px-8 !text-xl">
              Bắt đầu miễn phí
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#showcase" className="btn-ghost !h-14 !px-8 !text-xl">
              Xem bên trong
            </a>
          </div>

          <p className="rise mono-note mt-8 flex flex-wrap gap-x-4 gap-y-1 text-ink/55" style={{ animationDelay: "300ms" }}>
            <span>Toán 12</span>
            <span aria-hidden="true">/</span>
            <span>Cấu trúc đề 2025</span>
            <span aria-hidden="true">/</span>
            <span>12 trắc nghiệm · 4 đúng–sai · 6 trả lời ngắn</span>
          </p>
        </div>
      </Container>

      {/* The sticker board. On desktop it covers the whole hero, so stickers can be thrown anywhere. */}
      <div className="relative z-20 mx-auto mt-4 h-[400px] w-full max-w-[1600px] sm:h-[520px] lg:pointer-events-none lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
        <StickerField items={heroStickers} className="absolute inset-0" onFirstGrab={() => setTouched(true)} />

        <div
          className={`pointer-events-none absolute left-[60%] top-[-8px] flex items-start gap-1 text-ink transition-opacity duration-500 lg:left-[47%] lg:top-[19%] ${
            touched ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden="true"
        >
          <p className="font-hand -rotate-6 text-[1.25rem] leading-none lg:text-[1.5rem]">kéo thử đi!</p>
          <ScribbleArrow kind="downRight" className="mt-3 h-10 w-10 lg:h-14 lg:w-14" />
        </div>
      </div>

      {/* Tape across the bottom edge of the board */}
      <div className="relative z-30 mt-8 pb-7 lg:absolute lg:inset-x-0 lg:bottom-7 lg:mt-0 lg:pb-0" aria-hidden="true">
        <Ribbon
          items={["Active Recall", "Lặp lại ngắt quãng", "Gia sư Socratic", "Sổ lỗi sai", "Lộ trình AI"]}
          color="var(--pop)"
          rotate={-1.4}
          size="text-2xl sm:text-3xl md:text-4xl"
          className="mx-[-3%] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
        />
      </div>
    </section>
  );
};

export default HeroSection;

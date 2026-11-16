import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Container, Reveal, Sticker } from "./primitives";
import { CropMarks, RegistrationBar, Watermark } from "./print-kit";
import { Decor, Doodle, Peek, Spot, Tape } from "./backdrop";
import { ScribbleArrow } from "./showcase-kit";
import { STICKERS, type StickerName } from "./stickers";
import { Kinetic } from "./kinetic";

type Feature = {
  sticker: StickerName;
  title: string;
  body: string;
  meta: string;
  to: string;
};

const features: Feature[] = [
  {
    sticker: "notebook",
    title: "Sổ lỗi sai động",
    body: "AI gom và xếp hạng 20 lỗi nghiêm trọng nhất mỗi tuần để bạn ôn đúng chỗ hổng.",
    meta: "20 lỗi / tuần",
    to: "/error-notebook",
  },
  {
    sticker: "seal",
    title: "Lặp lại ngắt quãng",
    body: "Thuật toán SM-2 tính “thời điểm vàng” cho từng công thức, nhắc ôn trước khi quên.",
    meta: "SM-2",
    to: "/golden-time",
  },
  {
    sticker: "burst",
    title: "Lộ trình AI",
    body: "Bài kiểm tra đầu vào xác định trình độ, rồi dựng lộ trình theo chặng tới điểm mục tiêu.",
    meta: "Cá nhân hóa",
    to: "/roadmap",
  },
  {
    sticker: "bubble",
    title: "Gia sư Socratic",
    body: "Gia sư AI không đưa đáp án ngay mà đặt câu hỏi gợi mở để bạn tự tìm ra lời giải.",
    meta: "Hỏi 24/7",
    to: "/dashboard",
  },
  {
    sticker: "ticket",
    title: "Phòng thi",
    body: "Sprint 15 phút, Marathon 90 phút theo cấu trúc đề thật, và phòng xếp hạng 30 phút.",
    meta: "15 – 90 phút",
    to: "/practice",
  },
  {
    sticker: "bolt",
    title: "Thử thách 5 phút",
    body: "Năm câu mỗi ngày, đủ ngắn để giữ chuỗi học đều đặn mà không thấy quá tải.",
    meta: "5 phút / ngày",
    to: "/challenge-5min",
  },
  {
    sticker: "pill",
    title: "Phân tích năng lực",
    body: "Radar theo chủ đề và độ khó cho thấy bạn mạnh ở đâu, cần dồn sức vào đâu.",
    meta: "Cập nhật liên tục",
    to: "/analytics",
  },
  {
    sticker: "qr",
    title: "Bài tập Phygital",
    body: "In sổ lỗi thành bài tập giấy, mỗi câu kèm mã QR mở lời giải khi bạn làm xong.",
    meta: "PDF + QR",
    to: "/error-notebook",
  },
];

/** One kiss-cut position on the sheet: the whole cell is the link. */
const SheetCell = ({ f, index }: { f: Feature; index: number }) => {
  const art = STICKERS[f.sticker];
  const code = `${"AB"[Math.floor(index / 4)]}${(index % 4) + 1}`;
  return (
    <Link
      to={f.to}
      className="sheet-cell group relative flex gap-4 rounded-[1.25rem] border border-dashed border-ink/30 p-4 outline-offset-4 transition-colors duration-300 hover:border-ink/60 hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand sm:flex-col sm:gap-0 sm:p-5"
    >
      <p className="mono-note absolute left-4 top-3 flex w-[calc(100%-2rem)] justify-between text-ink-3 sm:left-5 sm:w-[calc(100%-2.5rem)]">
        <span>{code}</span>
        <span className="max-sm:hidden">{f.meta}</span>
      </p>

      <div className="mt-6 flex h-24 w-24 shrink-0 items-center justify-center sm:mx-auto sm:mt-7 sm:h-40 sm:w-full">
        <img
          src={art.src}
          alt=""
          width={art.w}
          height={art.h}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="stk-peel max-h-full w-auto max-w-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1 pt-5 sm:pt-3">
        <h3 className="display text-[1.7rem] sm:text-[1.95rem]">{f.title}</h3>
        <p className="mt-1.5 text-[0.93rem] font-medium leading-snug text-ink-2">{f.body}</p>
        <p className="mono-note mt-3 flex items-center gap-1 text-ink">
          Thử ngay
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 ease-[var(--ease-fluid)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </p>
      </div>
    </Link>
  );
};

const FeaturesSection = () => (
  <section id="features" className="relative isolate scroll-mt-20 overflow-hidden bg-paper py-24 md:py-36">
    <Decor>
      <Spot className="left-1/2 top-[30%] h-[1100px] w-[1500px] -translate-x-1/2" color="rgba(255, 201, 60, 0.09)" />
      <Doodle kind="star" className={`left-[5%] bottom-[6%] w-16 -rotate-12 text-ink/[0.2]`} />
      <Doodle kind="triangle" className={`right-[4%] bottom-[3%] w-36 rotate-6 text-ink/[0.2] max-lg:hidden`} />
      <Peek name="mascot" className="-right-12 top-[14%] w-40 max-xl:hidden" rot={-12} drift={50} />
    </Decor>
    <Watermark text="Học ít · Nhớ lâu" className="left-[-4%] top-[6%] -rotate-6 text-[21vw]" />

    <Container className="relative">
      <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
        <div>
          <Reveal>
            <Sticker>Tính năng</Sticker>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="display mt-5 text-[2.9rem] sm:text-6xl lg:text-[5.25rem]"><Kinetic>
              Mọi thứ để <em>ôn thi</em></Kinetic>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={120} className="max-w-sm text-lg leading-relaxed text-ink-2">
          Tám tính năng, mỗi cái dựa trên một nguyên lý khoa học học tập đã được kiểm chứng. Bóc cái nào dùng cái đó.
        </Reveal>
      </div>

      <Reveal delay={160} className="relative text-ink/40">
        <CropMarks />
        <Tape className="-top-3 left-[8%] z-10 h-8 w-36" color="rgba(255, 138, 198, 0.7)" rot={-5} />
        <Tape className="-top-3 right-[10%] z-10 h-8 w-32 max-sm:hidden" color="rgba(55, 210, 154, 0.6)" rot={4} />
        <div className="pointer-events-none absolute -left-4 -top-20 hidden items-end gap-1 text-ink xl:flex" aria-hidden="true">
          <p className="font-hand -rotate-6 text-[1.45rem] leading-none">bóc thử một cái!</p>
          <ScribbleArrow kind="downRight" className="h-12 w-12 translate-y-6" />
        </div>

        {/* The sticker sheet: cream backing paper, dashed kiss-cut lines, printer's marks in the margin. */}
        <div className="on-light relative rounded-[1.75rem] bg-[#F4EFE0] p-4 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] sm:p-7">
          <div className="mono-note flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 pb-4 text-ink-2 sm:pb-6">
            <p>
              QuizMe <span className="text-ink-3">—</span> Sticker sheet 01 <span className="text-ink-3">/</span> Bộ 8 tính năng
            </p>
            <div className="flex items-center gap-4">
              <span className="max-sm:hidden">Kiss-cut · Không bóng</span>
              <RegistrationBar />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {features.map((f, i) => (
              <SheetCell key={f.title} f={f} index={i} />
            ))}
          </div>

          <p className="mono-note px-1 pt-4 text-ink-3 sm:pt-6">In tại Việt Nam · Dán lên bàn học, không dán lên bài thi</p>
        </div>
      </Reveal>
    </Container>
  </section>
);

export default FeaturesSection;

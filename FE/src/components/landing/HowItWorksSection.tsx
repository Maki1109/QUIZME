import { Link } from "react-router-dom";
import { ArrowRight, Brain, Clock, Repeat, Sparkles, Sun, Zap } from "lucide-react";
import { Blob, CircleBadge, Container, Reveal, Ribbon, Sticker } from "./primitives";
import { ChalkText, Decor, Doodle, GridFade, Peek, Spot } from "./backdrop";
import { Watermark } from "./print-kit";
import { Kinetic } from "./kinetic";

const principles = [
  {
    icon: Brain,
    name: "Active Recall",
    vi: "Chủ động gợi nhớ",
    body: "Tự trả lời câu hỏi thay vì đọc lại. Mỗi lần truy xuất làm trí nhớ bền hơn.",
    color: "var(--pink)",
  },
  {
    icon: Repeat,
    name: "Spaced Repetition",
    vi: "Lặp lại ngắt quãng",
    body: "Ôn ngay trước khi quên, khoảng cách giãn dần: 1 ngày, 3 ngày, 1 tuần, 1 tháng.",
    color: "var(--sky)",
  },
  {
    icon: Zap,
    name: "Flow Model",
    vi: "Độ khó thích ứng",
    body: "Không quá dễ để chán, không quá khó để bỏ cuộc — luôn vừa sức hơn một chút.",
    color: "var(--lime)",
  },
  {
    icon: Clock,
    name: "Micro Learning",
    vi: "Học ngắn, đều đặn",
    body: "Những phiên 5–15 phút dễ duy trì hơn hẳn một buổi ôn dồn ba tiếng.",
    color: "var(--butter)",
  },
];

const steps = [
  { name: "Chẩn đoán", body: "Bài kiểm tra đầu vào đo trình độ từng chủ đề." },
  { name: "Định vị", body: "Chọn mục tiêu điểm và môn thi, AI dựng lộ trình." },
  { name: "Luyện tập", body: "Thử thách hằng ngày và đề thi tính giờ." },
  { name: "Củng cố", body: "Ôn lại lỗi sai và flashcard đúng thời điểm vàng." },
  { name: "Về đích", body: "Theo dõi tiến bộ, thi thử và điều chỉnh đến ngày thi." },
];

const stepColors = ["var(--pink)", "var(--peach)", "var(--butter)", "var(--lime)", "var(--sky)"];

const HowItWorksSection = () => (
  <section id="method" className="relative isolate overflow-x-clip bg-paper scroll-mt-20">
    <Decor>
      <Spot className="-left-[15%] top-[-5%] h-[900px] w-[900px]" color="rgba(201, 202, 248, 0.08)" />
      <Spot className="left-1/2 top-[55%] h-[900px] w-[1300px] -translate-x-1/2" color="rgba(255, 201, 60, 0.07)" />
      <GridFade className="left-1/2 top-[52%] h-[800px] w-[1400px] -translate-x-1/2" />
      <Watermark text="Phương pháp" className="left-[-2%] top-[30%] text-[15vw] -rotate-3" />
      <Doodle kind="axes" className={`left-[2%] top-[2%] w-32 -rotate-6 text-ink/[0.2] max-lg:hidden`} />
      <ChalkText className={`right-[3%] top-[3%] rotate-3 text-[1.5rem] text-ink/[0.2] max-lg:hidden`}>nhắc lại · giãn cách · vừa sức</ChalkText>
      <Doodle kind="loop" className={`left-[3%] bottom-[22%] w-36 text-ink/[0.2] max-lg:hidden`} />
      <Doodle kind="star" className={`right-[5%] bottom-[18%] w-16 text-ink/[0.2]`} />
      <Peek name="seal" className="-left-14 top-[30%] w-36 max-xl:hidden" rot={-8} drift={50} />
      <Peek name="pill" className="-right-14 top-[58%] w-44 max-xl:hidden" rot={16} />
    </Decor>
    {/* ---- About the method ---- */}
    <Container className="pb-10 pt-20 md:pt-28">
      <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <Reveal>
            <Sticker>Phương pháp</Sticker>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="display mt-5 text-[2.9rem] sm:text-6xl lg:text-[5.25rem]"><Kinetic>
              Khoa học
              <span className="mx-2 inline-flex h-[0.8em] w-[0.8em] translate-y-[-0.05em] items-center justify-center rounded-full bg-butter align-middle">
                <Sparkles className="h-[0.45em] w-[0.45em]" aria-hidden="true" />
              </span>
              học tập, không học vẹt
              <span className="ml-2 inline-flex h-[0.8em] w-[0.8em] translate-y-[-0.05em] items-center justify-center rounded-full bg-sky align-middle">
                <Brain className="h-[0.45em] w-[0.45em]" aria-hidden="true" />
              </span></Kinetic>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-2">
              QuizMe được xây quanh bốn nguyên lý mà nghiên cứu về trí nhớ đã chứng minh hiệu quả, thay vì chỉ tăng số lượng bài tập.
            </p>
            <Link to="/register" className="btn-lime mt-8">
              Thử phương pháp này <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {principles.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className={i % 2 === 1 ? "sm:mt-10" : ""}>
              <article className="h-full rounded-[1.75rem] bg-surface p-6 shadow-[var(--shadow-soft)] sm:p-7">
                <span className="on-light flex h-14 w-14 items-center justify-center rounded-full" style={{ background: p.color }}>
                  <p.icon className="h-6 w-6 text-ink" strokeWidth={1.75} />
                </span>
                <h3 className="display mt-8 text-[2rem]">{p.name}</h3>
                <p className="mt-1 font-bold text-brand-ink">{p.vi}</p>
                <p className="mt-3 leading-relaxed text-ink-2">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Container>

    {/* Butter ribbon crossing the section */}
    <div className="relative z-10 overflow-hidden py-14 md:py-20">
      <Ribbon
        items={["Học đều", "Nhớ lâu", "Hiểu sâu", "Tự tin đi thi"]}
        color="var(--butter)"
        rotate={3}
        reverse
        className="mx-[-5%]"
      />
    </div>

    {/* ---- Why it works: big surface panel ---- */}
    <Container className="pb-12 md:pb-16">
      <div className="relative rounded-[2.5rem] bg-surface px-5 pb-14 pt-16 sm:px-10 md:px-16 md:pb-20 md:pt-24">
        {/* Rotated stat pills, like the reference's "98% Love every bite" */}
        <div className="pointer-events-none absolute -left-3 top-10 hidden -rotate-[14deg] rounded-[2rem] bg-butter px-7 py-4 shadow-[var(--shadow-soft)] lg:block">
          <p className="display text-5xl">20 lỗi</p>
          <p className="text-sm font-bold text-ink">được chọn lọc mỗi tuần</p>
        </div>
        <div className="pointer-events-none absolute -right-3 top-44 hidden rotate-[12deg] rounded-[2rem] bg-lime px-7 py-4 shadow-[var(--shadow-soft)] lg:block">
          <p className="display text-5xl">5 phút</p>
          <p className="text-sm font-bold text-ink">cho thử thách mỗi ngày</p>
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <Sticker>Quy trình</Sticker>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="display mt-5 text-[2.6rem] sm:text-6xl lg:text-[4.75rem]"><Kinetic>
              Từ chẩn đoán đến ngày thi, <span className="text-ink-3">mỗi bước đều có lý do</span></Kinetic>
            </h2>
          </Reveal>
          <div className="mt-8 flex justify-center">
            <CircleBadge text="Học đều mỗi ngày ✦ Nhớ lâu hơn ✦ ">
              <Sun className="h-7 w-7" />
            </CircleBadge>
          </div>
        </div>

        <ol className="relative mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-5">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.name} delay={i * 80} className="rounded-[1.5rem] bg-paper p-6">
              <span className="on-light relative flex h-14 w-14 items-center justify-center">
                <Blob shape="scallop" color={stepColors[i]} className="absolute inset-0 h-full w-full" />
                <span className="display relative text-2xl">{i + 1}</span>
              </span>
              <h3 className="display mt-6 text-[1.75rem]">{s.name}</h3>
              <p className="mt-2 leading-relaxed text-ink-2">{s.body}</p>
            </Reveal>
          ))}
        </ol>

        {/* Mobile-only versions of the two stat pills */}
        <div className="mt-10 grid grid-cols-2 gap-3 lg:hidden">
          <div className="rounded-[1.5rem] bg-butter p-5">
            <p className="display text-4xl">20 lỗi</p>
            <p className="text-sm font-bold text-ink">được chọn lọc mỗi tuần</p>
          </div>
          <div className="rounded-[1.5rem] bg-lime p-5">
            <p className="display text-4xl">5 phút</p>
            <p className="text-sm font-bold text-ink">cho thử thách mỗi ngày</p>
          </div>
        </div>
      </div>
    </Container>

  </section>
);

export default HowItWorksSection;

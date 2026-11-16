import { ComponentType } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Lock, Plus, Timer, Layers, Route, Radar } from "lucide-react";
import { Blob, BlobShape, Container, Reveal, SectionHeader } from "./primitives";
import { ChalkText, Decor, Doodle, GridFade, Peek, PostIt, Spot } from "./backdrop";
import { Watermark } from "./print-kit";
import { Tilt } from "./motion3d";

/* ---------- Product vignettes (pure HTML/SVG, no images) ---------- */

const ExamVignette = () => (
  <div className="w-full">
    <div className="flex items-center justify-between text-sm">
      <span className="eyebrow">Sprint · Câu 7/20</span>
      <span className="font-bold tabular-nums text-ink">08:42</span>
    </div>
    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-paper-2">
      <div className="h-full w-[35%] rounded-full bg-brand" />
    </div>
    <p className="mt-4 font-bold leading-snug text-ink">Hàm số y = x³ − 3x + 2 đạt cực đại tại điểm nào?</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {["x = −1", "x = 1", "x = 0", "x = 2"].map((opt, i) => (
        <div
          key={opt}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
            i === 0 ? "bg-ink text-paper" : "bg-paper text-ink-2"
          }`}
        >
          <span className="opacity-70">{"ABCD"[i]}</span>
          {opt}
        </div>
      ))}
    </div>
  </div>
);

const FlashcardVignette = () => (
  <div className="flex w-full flex-col">
    <span className="eyebrow">Công thức · Lượng giác</span>
    <p className="display normal-case mt-6 text-[2.1rem]">
      sin 2x = <em>2 sin x cos x</em>
    </p>
    <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
      <span className="rounded-full bg-paper px-3 py-1.5 text-ink-2">Quên</span>
      <span className="rounded-full bg-paper px-3 py-1.5 text-ink-2">Khó</span>
      <span className="rounded-full bg-lime px-3 py-1.5 text-ink">Nhớ · 4 ngày</span>
    </div>
  </div>
);

const RoadmapVignette = () => {
  const stages = [
    { name: "Hàm số", state: "done" },
    { name: "Mũ & Logarit", state: "done" },
    { name: "Nguyên hàm", state: "current" },
    { name: "Tích phân", state: "locked" },
  ];
  return (
    <ol className="relative w-full space-y-3">
      <span className="absolute left-[11px] top-3 bottom-3 w-0.5 rounded-full bg-paper-3" aria-hidden="true" />
      {stages.map((s, i) => (
        <li key={s.name} className="relative flex items-center gap-3">
          <span
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
              s.state === "done"
                ? "bg-ink text-paper"
                : s.state === "current"
                  ? "bg-brand text-ink ring-4 ring-brand-soft"
                  : "bg-paper-2 text-ink-3"
            }`}
          >
            {s.state === "done" ? <Check className="h-3 w-3" /> : s.state === "locked" ? <Lock className="h-3 w-3" /> : i + 1}
          </span>
          <span className={`font-semibold ${s.state === "locked" ? "text-ink-3" : "text-ink"}`}>{s.name}</span>
          {s.state === "current" && <span className="ml-auto eyebrow !text-brand-ink">Đang học</span>}
        </li>
      ))}
    </ol>
  );
};

const RadarVignette = () => {
  const axes = ["Đại số", "Giải tích", "Hình học", "Xác suất", "Lượng giác", "Số phức"];
  const values = [0.82, 0.64, 0.45, 0.7, 0.9, 0.38];
  const cx = 130;
  const cy = 112;
  const r = 78;
  const point = (i: number, k: number) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
  };
  const poly = (k: number | number[]) => axes.map((_, i) => point(i, Array.isArray(k) ? k[i] : k).join(",")).join(" ");

  return (
    <svg viewBox="0 0 260 224" className="w-full" role="img" aria-label="Biểu đồ năng lực theo chủ đề">
      {[0.33, 0.66, 1].map((k) => (
        <polygon key={k} points={poly(k)} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
      ))}
      <polygon points={poly(values)} fill="var(--brand)" fillOpacity="0.18" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" />
      {values.map((v, i) => {
        const [x, y] = point(i, v);
        return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--brand)" />;
      })}
      {axes.map((label, i) => {
        const [x, y] = point(i, 1.24);
        return (
          <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="600" fill="var(--ink-2)" fontFamily="var(--font-body)">
            {label}
          </text>
        );
      })}
    </svg>
  );
};

/* ---------- Section ---------- */

type Space = {
  title: string;
  body: string;
  to: string;
  color: string;
  shape: BlobShape;
  icon: ComponentType<{ className?: string }>;
  tilt: string;
  Vignette: ComponentType;
};

const spaces: Space[] = [
  {
    title: "Phòng thi",
    body: "Sprint 15 phút, Marathon 60 phút và xếp hạng tuần.",
    to: "/exam-room",
    color: "var(--pink)",
    shape: "flower",
    icon: Timer,
    tilt: "-rotate-3",
    Vignette: ExamVignette,
  },
  {
    title: "Thời điểm vàng",
    body: "Flashcard công thức, nhắc ôn đúng lúc sắp quên.",
    to: "/golden-time",
    color: "var(--peach)",
    shape: "cloud",
    icon: Layers,
    tilt: "rotate-2",
    Vignette: FlashcardVignette,
  },
  {
    title: "Lộ trình học",
    body: "Từng chặng kiến thức, mở khóa dần tới mục tiêu.",
    to: "/roadmap",
    color: "var(--lime)",
    shape: "flower",
    icon: Route,
    tilt: "rotate-3",
    Vignette: RoadmapVignette,
  },
  {
    title: "Phân tích",
    body: "Radar năng lực cho biết nên dồn sức vào đâu.",
    to: "/analytics",
    color: "var(--lavender)",
    shape: "cloud",
    icon: Radar,
    tilt: "-rotate-2",
    Vignette: RadarVignette,
  },
];

const SpaceCard = ({ space }: { space: Space }) => {
  const { Vignette, icon: Icon } = space;
  return (
    <Link
      to={space.to}
      className="group relative block rounded-[2rem] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-brand"
    >
      {/* Blob with the product vignette floating on it */}
      <Tilt className="mx-auto aspect-square w-full max-w-[520px]" max={9} sheen={false}>
        <Blob
          shape={space.shape}
          color={space.color}
          className="absolute inset-0 h-full w-full transition-transform duration-700 ease-[var(--ease-fluid)] group-hover:rotate-[8deg] group-hover:scale-[1.03]"
        />
        <div className="absolute inset-[16%] flex items-center justify-center" style={{ transform: "translateZ(70px)", transformStyle: "preserve-3d" }}>
          <div
            className={`w-full max-w-[300px] rounded-[1.5rem] bg-surface p-5 shadow-[var(--shadow-lift)] transition-transform duration-500 ease-[var(--ease-fluid)] ${space.tilt} group-hover:rotate-0 group-hover:-translate-y-2 group-active:scale-[0.98] group-active:duration-100`}
          >
            <Vignette />
          </div>
        </div>
      </Tilt>

      {/* Info card with a notched "+" tab, overlapping the blob's base */}
      <div className="relative z-10 mx-auto -mt-[14%] w-[86%] max-w-[360px]">
        <span className="absolute -top-5 left-8 flex h-12 w-12 items-center justify-center rounded-full bg-surface">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-peach text-ink transition-transform duration-300 group-hover:rotate-90">
            <Plus className="h-4 w-4" />
          </span>
        </span>
        <div className="flex items-center gap-4 rounded-[1.25rem] bg-surface p-4 shadow-[var(--shadow-soft)]">
          <span className="on-light flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl" style={{ background: space.color }}>
            <Icon className="h-9 w-9 text-ink" />
          </span>
          <span className="min-w-0">
            <span className="display block text-[1.9rem]">{space.title}</span>
            <span className="mt-1 block text-[0.95rem] leading-snug text-ink-2">{space.body}</span>
          </span>
        </div>
      </div>
    </Link>
  );
};

const ShowcaseSection = () => (
  <section id="showcase" className="relative isolate bg-paper pt-24 pb-24 md:pt-32 md:pb-36 scroll-mt-20">
    <Decor>
      <Spot className="left-1/2 top-[-6%] h-[900px] w-[1100px] -translate-x-1/2" color="rgba(255, 201, 60, 0.10)" />
      <Spot className="-left-[20%] top-[38%] h-[900px] w-[900px]" color="rgba(55, 210, 154, 0.07)" />
      <Spot className="-right-[18%] top-[66%] h-[800px] w-[800px]" color="rgba(255, 138, 198, 0.06)" />
      <GridFade className="left-1/2 top-[2%] h-[700px] w-[1300px] -translate-x-1/2" />
      <Watermark text="Góc học" className="-left-[4%] top-[40%] -rotate-6 text-[18vw] max-md:hidden" />
      <Doodle kind="graph" className={`left-[3%] top-[4%] w-44 -rotate-6 text-ink/[0.2] max-md:hidden`} />
      <Doodle kind="star" className={`right-[7%] top-[7%] w-20 rotate-12 text-ink/[0.2]`} />
      <ChalkText className={`left-[4%] top-[47%] -rotate-3 text-[1.6rem] text-ink/[0.2] max-lg:hidden`}>logₐx = ln x ⁄ ln a</ChalkText>
      <Doodle kind="loop" className={`right-[4%] top-[57%] w-40 -scale-x-100 text-ink/[0.2] max-lg:hidden`} />
      <Doodle kind="axes" className={`left-[2%] top-[78%] w-40 text-ink/[0.2] max-lg:hidden`} />
      <Peek name="pencil" className="-left-14 top-[27%] w-56 max-xl:hidden" rot={28} drift={60} />
      <Peek name="flame" className="-right-8 top-[44%] w-28 max-xl:hidden" rot={-14} drift={50} />
      <Peek name="card" className="-left-16 top-[66%] w-44 max-xl:hidden" rot={14} />
      <PostIt className="right-[2.5%] top-[83%] max-xl:hidden" rot={5}>góc nào cũng có gia sư AI ngồi cạnh nha!</PostIt>
    </Decor>
    <Container>
      <SectionHeader
        align="center"
        eyebrow="Bên trong QuizMe"
        title="Chọn góc học của bạn"
        aside="Bốn không gian, mỗi nơi rèn một kỹ năng: làm bài, ghi nhớ, đi đúng lộ trình và tự đánh giá."
      />
      <Reveal delay={160} className="-mt-4 mb-16 flex justify-center md:mb-20">
        <Link to="/register" className="btn-lime">
          Vào học ngay <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      {/* Two independent columns; the right one starts lower for a staggered rhythm.
          On mobile they stack column by column, matching the DOM/tab order. */}
      <div className="grid gap-16 md:grid-cols-2 md:gap-x-10">
        {[0, 1].map((col) => (
          <div key={col} className={`flex flex-col gap-16 md:gap-24 ${col === 1 ? "md:pt-48" : ""}`}>
            {spaces
              .filter((_, i) => i % 2 === col)
              .map((s) => (
                <Reveal key={s.title} delay={col * 120}>
                  <SpaceCard space={s} />
                </Reveal>
              ))}
          </div>
        ))}
      </div>
    </Container>
  </section>
);

export default ShowcaseSection;

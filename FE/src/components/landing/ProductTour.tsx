/**
 * Scroll-driven product tour built from REAL screenshots of QuizMe (a demo account).
 *
 * Desktop: the text steps scroll by while one browser window stays pinned; the screen inside it
 * cross-fades to match the step at the centre of the viewport. Small paper slips with handwritten
 * notes point at the detail that matters. Mobile: each step simply shows its own screenshot.
 */

import { useEffect, useRef, useState } from "react";
import dashboard from "../../assets/landing/screen-dashboard.webp";
import challenge from "../../assets/landing/screen-challenge.webp";
import tutor from "../../assets/landing/screen-tutor.webp";
import notebook from "../../assets/landing/screen-notebook.webp";
import analytics from "../../assets/landing/screen-analytics.webp";
import roadmap from "../../assets/landing/screen-roadmap.webp";
import { Container, SectionHeader } from "./primitives";
import { ChalkText, Decor, Doodle, Peek, Spot, Tape } from "./backdrop";
import { Watermark } from "./print-kit";
import { BrowserFrame } from "./showcase-kit";
import { TourStage, type TourScreen } from "./TourStage";

interface Step extends TourScreen {
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    key: "today",
    accent: "#FFC93C",
    props: [{ name: "flame", x: -9, y: 2, w: 13, z: 140, rot: -10 }],
    chip: { text: "+50 XP hôm nay", x: 74, y: 84, z: 110 },
    img: dashboard,
    alt: "Trang Hôm nay của QuizMe: chuỗi 12 ngày học, cấp độ, dự đoán điểm 5,8, Thử thách 5 phút và nhiệm vụ trong ngày",
    url: "quizme.com.vn/dashboard",
    eyebrow: "01 · Hôm nay",
    title: "Mở ra là biết hôm nay học gì",
    body: "Chuỗi ngày học, nhiệm vụ, Thử thách 5 phút và gợi ý của gia sư AI nằm gọn trên một trang — tính từ chính lỗi sai, mục tiêu và ngày thi của bạn.",
    slip: { text: "12 ngày liền rồi đó!", x: 31, y: 28, rotate: -4, arrow: "upRight" },
  },
  {
    key: "feedback",
    accent: "#FF8AC6",
    props: [{ name: "pill", x: -9, y: 4, w: 22, z: 120, rot: -8 }],
    img: challenge,
    alt: "Màn hình làm bài: câu trắc nghiệm nguyên hàm, phương án B bị đánh sai, đáp án C được tô xanh, kèm nút Hỏi gia sư",
    url: "quizme.com.vn/session",
    eyebrow: "02 · Phản hồi tức thì",
    title: "Sai ở đâu, biết ngay ở đó",
    body: "Chọn xong là chấm. Gia sư AI không đọc đáp án cho bạn mà hỏi gợi mở từng bước, để bạn tự thấy mình hổng ở đâu — và nhớ lâu hơn.",
    slip: { text: "hỏi gia sư ngay", x: 1, y: 70, rotate: -3, arrow: "downRight" },
  },
  {
    key: "notebook",
    accent: "#A78BFF",
    props: [
      { name: "notebook", x: 86, y: -12, w: 16, z: 150, rot: 10 },
      { name: "card", x: -6, y: 74, w: 20, z: 110, rot: -8 },
    ],
    img: notebook,
    alt: "Sổ lỗi sai: câu nguyên hàm được gắn nhãn Bất cẩn, Sai khi tự tin, Sai 3 lần, kèm nút Hỏi gia sư",
    url: "quizme.com.vn/error-notebook",
    eyebrow: "03 · Sổ lỗi sai",
    title: "Sổ lỗi sai tự viết, khỏi chép tay",
    body: "Mỗi câu sai tự vào sổ kèm ảnh đề, đáp án bạn đã chọn, và là lỗi bất cẩn hay hổng kiến thức. Cuối tuần, 20 lỗi đáng sửa nhất nổi lên đầu.",
    slip: { text: "sai khi tự tin → sửa trước", x: 47, y: 32, rotate: 3, arrow: "downLeft", arrowFirst: true },
  },
  {
    key: "analytics",
    accent: "#37D29A",
    props: [{ name: "burst", x: 87, y: -8, w: 15, z: 150, rot: 12 }],
    chip: { text: "khoảng tin cậy ± 0,5", x: -6, y: 86, z: 100 },
    img: analytics,
    alt: "Trang phân tích: biểu đồ radar năng lực theo 9 chuyên đề và dự đoán điểm thi 5,8 với khoảng tin cậy 5,3–6,4",
    url: "quizme.com.vn/analytics",
    eyebrow: "04 · Phân tích",
    title: "Thấy rõ mình mạnh, yếu ở đâu",
    body: "Năng lực theo từng chuyên đề và từng mức độ tư duy, cùng dự đoán điểm thi có khoảng tin cậy — cập nhật sau mỗi bài làm.",
    slip: { text: "điểm dự đoán, không phải đoán mò", x: 28, y: 47, rotate: -3, arrow: "upRight" },
  },
  {
    key: "roadmap",
    accent: "#3B5BFF",
    props: [
      { name: "ticket", x: -7, y: 76, w: 23, z: 120, rot: -6 },
      { name: "mascot", x: 85, y: -14, w: 16, z: 160, rot: 8 },
    ],
    img: roadmap,
    alt: "Lộ trình cá nhân: bước tiếp theo được đề xuất và tiến độ từng chuyên đề so với mục tiêu",
    url: "quizme.com.vn/roadmap",
    eyebrow: "05 · Lộ trình",
    title: "Lộ trình tự xếp lại mỗi ngày",
    body: "Chuyên đề nặng điểm mà còn xa mục tiêu được đưa lên trước; kiến thức nền còn yếu thì củng cố trước khi học tiếp. Không phải tự lên kế hoạch.",
    slip: { text: "việc tiếp theo, rõ ràng", x: 52, y: 31, rotate: 3, arrow: "upLeft", arrowFirst: true },
  },
];

const ProductTour = () => {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const trackRef = useRef<HTMLOListElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // The step crossing the middle of the viewport is the active one.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    stepRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="tour" className="relative isolate scroll-mt-20 bg-paper py-24 md:py-32" aria-label="Bên trong QuizMe">
      <Decor>
        <Spot className="-right-[15%] top-[10%] h-[1000px] w-[1000px]" color="rgba(185, 219, 253, 0.07)" />
        <Spot className="-left-[25%] top-[55%] h-[1000px] w-[1000px]" color="rgba(255, 201, 60, 0.07)" />
        <Watermark text="24 giờ" className="-right-[4%] top-[55%] -rotate-6 text-[22vw]" />
        <Doodle kind="clock" className={`right-[5%] top-[3%] w-28 rotate-6 text-ink/[0.2]`} />
        <ChalkText className={`right-[6%] top-[13%] rotate-2 text-[1.5rem] text-ink/[0.2] max-lg:hidden`}>06:30 → 22:00</ChalkText>
        <Doodle kind="zigzag" className={`left-[3%] top-[42%] w-40 text-ink/[0.2] max-lg:hidden`} />
        <ChalkText className={`right-[4%] top-[92%] -rotate-3 text-[1.7rem] text-ink/[0.2] max-lg:hidden`}>∫₀¹ x² dx = ⅓</ChalkText>
        <Peek name="hello" className="-right-12 top-[50%] w-40 max-xl:hidden" rot={-16} drift={55} />
        <Peek name="bolt" className="-left-6 top-[86%] w-24 max-xl:hidden" rot={18} />
        <Tape className="right-[18%] top-[30%] h-7 w-32 max-xl:hidden" color="rgba(255, 201, 60, 0.35)" rot={-28} />
      </Decor>
      <Container>
        <SectionHeader
          eyebrow="Xem tận mắt"
          stickerColor="var(--lime)"
          title={
            <>
              Bên trong <em>một ngày học</em>
            </>
          }
          aside="Đây là ảnh chụp màn hình thật của QuizMe trên một tài khoản minh họa — không phải bản vẽ phác."
        />

        <div className="lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <ol ref={trackRef} className="relative space-y-16 lg:space-y-0 lg:pl-20">
            {/* Progress rail: fills with the scroll, a lit bead marks where you are. */}
            <span className="absolute bottom-[39vh] left-[29px] top-[39vh] hidden w-px bg-ink/15 lg:block" aria-hidden="true">
              <span className="absolute inset-x-[-1px] top-0 h-full origin-top bg-[var(--pop)] shadow-[0_0_14px_var(--pop)]" style={{ transform: "scaleY(var(--tour-p, 0))" }} />
              <span className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pop)] shadow-[0_0_0_5px_rgba(255,201,60,0.18),0_0_22px_var(--pop)]" style={{ top: "calc(var(--tour-p, 0) * 100%)" }} />
            </span>
            {STEPS.map((s, i) => (
              <li
                key={s.key}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                data-index={i}
                className="lg:flex lg:min-h-[78vh] lg:items-center"
              >
                <div className={`relative transition-[opacity,transform] duration-500 [transition-timing-function:var(--ease-fluid)] lg:max-w-md ${active === i ? "lg:opacity-100" : "lg:translate-x-[-6px] lg:opacity-35"}`}>
                  {/* Station on the rail */}
                  <span className={`absolute -left-[4.4rem] top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full font-[var(--font-mono)] text-sm font-bold transition-[background-color,color,box-shadow] duration-500 lg:flex ${active === i ? "bg-[var(--pop)] text-[#1B1512] shadow-[0_0_0_6px_rgba(255,201,60,0.15)]" : "bg-paper-2 text-ink-3 ring-1 ring-ink/15"}`} style={{ fontFamily: "var(--font-mono)" }} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {/* Poster numeral behind the title */}
                  <span className="pointer-events-none absolute -top-[5.6rem] right-0 select-none text-[7.5rem] leading-none lg:-right-6 transition-[-webkit-text-stroke-color] duration-500" style={{ fontFamily: "var(--font-poster)", fontStyle: "italic", fontWeight: 800, color: "transparent", WebkitTextStroke: active === i ? "1.5px rgba(255,201,60,0.45)" : "1.5px rgba(244,239,224,0.08)" }} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="eyebrow relative !text-brand-ink">{s.eyebrow}</p>
                  <h3 className="display relative mt-3 !leading-[1.12] text-[2.2rem] sm:text-[2.6rem] lg:text-[3rem]">{s.title}</h3>
                  <p className="relative mt-4 text-lg leading-relaxed text-ink-2">{s.body}</p>
                  {/* Mobile and tablet: the screenshot sits right under its text. */}
                  <div className="tilt-in mt-6 lg:hidden">
                    <BrowserFrame url={s.url}>
                      <img src={s.img} alt={s.alt} width={1280} height={820} loading="lazy" decoding="async" className="block aspect-[1280/820] w-full object-cover object-top" />
                    </BrowserFrame>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Desktop: the pinned 3D stage whose screen changes with the active step. */}
          <div className="hidden lg:block">
            <div className="sticky top-[calc(50vh-16rem)] pt-6">
              <TourStage
                screens={STEPS}
                active={active}
                trackRef={trackRef}
                progressHost={sectionRef}
                tutor={{ src: tutor, step: 1, alt: "Gia sư AI hỏi gợi mở: so với lời giải, bạn lệch ở bước nào? Lỗi do bất cẩn hay chưa nắm kiến thức?" }}
              />
              <div className="mt-16 flex justify-center gap-2" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <span key={s.key} className={`h-1.5 rounded-full transition-[width,background-color] duration-500 [transition-timing-function:var(--ease-fluid)] ${i === active ? "w-8 bg-[var(--pop)]" : "w-1.5 bg-ink/25"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ProductTour;

import { Quote } from "lucide-react";
import { Container, Reveal, SectionHeader, WaveEdge } from "./primitives";
import { Decor, Doodle, Peek, PostIt, Spot } from "./backdrop";

// PLACEHOLDER: replace with real, consented feedback from beta students before launch.
// Do not ship these as genuine reviews.
const testimonials = [
  {
    quote: "Sổ lỗi sai là thứ mình cần nhất. Trước đây mình làm rất nhiều đề nhưng cứ sai lại đúng những dạng cũ.",
    name: "Học sinh lớp 12",
    meta: "Khối A00",
    color: "var(--pink)",
    tilt: "md:-rotate-2",
  },
  {
    quote:
      "Mascot không đưa đáp án ngay nên lúc đầu hơi khó chịu, nhưng giờ mình tự giải được những bài trước đây phải xem lời giải.",
    name: "Học sinh lớp 11",
    meta: "Mục tiêu 8+ Toán",
    color: "var(--sky)",
    tilt: "md:rotate-1 md:mt-12",
  },
  {
    quote: "Mỗi ngày chỉ 5 phút thử thách mà giữ được chuỗi học hơn một tháng, chưa bao giờ mình học đều như vậy.",
    name: "Học sinh lớp 12",
    meta: "Khối D01",
    color: "var(--lime)",
    tilt: "md:-rotate-1",
  },
  {
    quote: "Biểu đồ năng lực cho mình thấy rõ hình học không gian đang kéo điểm xuống, nên mình biết phải ôn gì trước.",
    name: "Học sinh lớp 12",
    meta: "Khối A01",
    color: "var(--butter)",
    tilt: "md:rotate-2 md:mt-12",
  },
];

const TestimonialSection = () => (
  <section className="relative isolate bg-paper-2 pt-12 md:pt-16">
    <Decor>
      <Spot className="left-1/2 top-[-10%] h-[800px] w-[1200px] -translate-x-1/2" color="rgba(255, 138, 198, 0.08)" />
      <p className="display absolute -left-[2%] top-[2%] text-[26rem] !leading-none text-transparent max-md:hidden" style={{ WebkitTextStroke: "2px rgba(244, 239, 224, 0.07)", fontFamily: "var(--font-poster)" }}>“</p>
      <p className="display absolute -right-[2%] bottom-[8%] text-[26rem] !leading-none text-transparent max-md:hidden" style={{ WebkitTextStroke: "2px rgba(244, 239, 224, 0.07)", fontFamily: "var(--font-poster)" }}>”</p>
      <Doodle kind="star" className={`right-[12%] top-[6%] w-16 rotate-12 text-ink/[0.2]`} />
      <Doodle kind="zigzag" className={`left-[8%] bottom-[14%] w-40 text-ink/[0.2] max-lg:hidden`} />
      <Peek name="hello" className="-left-12 top-[40%] w-40 max-xl:hidden" rot={14} drift={50} />
      <PostIt className="right-[2%] top-[22%] max-xl:hidden" color="var(--pink)" rot={6}>ôn ít mà chắc</PostIt>
    </Decor>
    <Container>
      <SectionHeader align="center" eyebrow="Cảm nhận" stickerColor="var(--pink)" title="Học sinh nói gì" />

      <div className="grid gap-5 md:grid-cols-2 lg:gap-6">
        {testimonials.map((t, i) => (
          <Reveal key={i} delay={(i % 2) * 120} className={t.tilt}>
            <figure className="flex h-full flex-col rounded-[1.75rem] bg-surface p-7 shadow-[var(--shadow-soft)] md:p-9">
              <span className="on-light flex h-12 w-12 items-center justify-center rounded-full" style={{ background: t.color }}>
                <Quote className="h-5 w-5 text-ink" aria-hidden="true" />
              </span>
              <blockquote className="mt-6 mb-8 text-xl font-semibold leading-snug text-ink md:text-[1.45rem]">{t.quote}</blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-line pt-5">
                <span className="display flex h-11 w-11 items-center justify-center rounded-full bg-paper text-lg" aria-hidden="true">
                  HS
                </span>
                <span>
                  <span className="block font-bold text-ink">{t.name}</span>
                  <span className="block text-sm text-ink-3">{t.meta}</span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Container>
    <WaveEdge color="var(--paper)" className="mt-16 md:mt-24" />
  </section>
);

export default TestimonialSection;

import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Container, Reveal, SectionHeader } from "./primitives";
import { ChalkText, Decor, Doodle, GridFade, Peek, PostIt, Spot } from "./backdrop";
import { Watermark } from "./print-kit";
import { Tilt } from "./motion3d";

// Prices follow the business plan (199k – 599k VNĐ / tháng).
const plans = [
  {
    name: "Cơ bản",
    price: "0đ",
    period: "mãi mãi",
    blurb: "Làm quen với QuizMe và giữ thói quen học mỗi ngày.",
    features: ["Thử thách 5 phút mỗi ngày", "Đề luyện tập cơ bản", "Chuỗi ngày học & XP", "Thống kê tiến độ cơ bản"],
    cta: "Bắt đầu miễn phí",
    tone: "plain" as const,
  },
  {
    name: "Premium",
    price: "199k",
    period: "/ tháng",
    blurb: "Đầy đủ công cụ AI để ôn tập có trọng tâm.",
    features: [
      "Sổ lỗi sai động — 20 lỗi/tuần",
      "Gia sư AI Socratic không giới hạn",
      "Lộ trình học cá nhân hóa",
      "Phòng thi đầy đủ & xếp hạng",
      "Phân tích năng lực chi tiết",
    ],
    cta: "Nâng cấp Premium",
    tone: "featured" as const,
  },
  {
    name: "Elite",
    price: "599k",
    period: "/ tháng",
    blurb: "Đồng hành sát sao trong giai đoạn nước rút.",
    features: [
      "Mọi quyền lợi của Premium",
      "Bài tập PDF Phygital kèm QR",
      "Chiến lược thi riêng theo mục tiêu",
      "Ưu tiên tính năng mới",
      "Hỗ trợ ưu tiên",
    ],
    cta: "Chọn Elite",
    tone: "lavender" as const,
  },
];

const toneClass = {
  plain: "bg-surface text-ink",
  featured: "bg-ink text-paper lg:-translate-y-4",
  lavender: "bg-lavender text-ink",
};

const PricingSection = () => (
  <section id="pricing" className="relative isolate bg-paper pt-8 pb-24 md:pt-12 md:pb-36 scroll-mt-20">
    <Decor>
      {/* Kept clear of the section's bottom edge, so the glow fades out instead of being cut off. */}
      <Spot className="left-1/2 top-[14%] h-[760px] w-[1100px] -translate-x-1/2" color="rgba(255, 201, 60, 0.11)" />
      <GridFade className="left-1/2 top-[0%] h-[600px] w-[1200px] -translate-x-1/2" />
      <Watermark text="0đ" className="left-[2%] top-[38%] text-[22vw]" />
      <ChalkText className={`right-[5%] top-[8%] rotate-3 text-[1.6rem] text-ink/[0.2] max-lg:hidden`}>Free → Premium → Elite</ChalkText>
      <Doodle kind="star" className={`left-[8%] top-[10%] w-16 -rotate-6 text-ink/[0.2]`} />
      <Peek name="burst" className="-right-12 top-[44%] w-40 max-xl:hidden" rot={-6} drift={55} />
      <Peek name="ticket" className="-left-20 bottom-[10%] w-52 max-xl:hidden" rot={22} drift={20} />
      <PostIt className="left-[2%] top-[20%] max-xl:hidden" rot={-5}>gói Free đã đủ để bắt đầu!</PostIt>
    </Decor>
    <Container>
      <SectionHeader
        align="center"
        eyebrow="Bảng giá"
        stickerColor="var(--lime)"
        title="Chọn gói vừa sức"
        aside="Bắt đầu miễn phí, nâng cấp khi bạn cần thêm công cụ AI. Hủy bất cứ lúc nào."
      />

      <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
        {plans.map((p, i) => {
          const featured = p.tone === "featured";
          return (
            <Reveal key={p.name} delay={i * 100} className="h-full">
              <Tilt className="h-full" max={5} radius="2rem">
              <div className={`relative flex h-full flex-col rounded-[2rem] p-8 md:p-9 ${toneClass[p.tone]}`}>
                <div className="flex items-center justify-between">
                  <p className={`eyebrow ${featured ? "!text-paper/75" : "!text-ink-2"}`}>{p.name}</p>
                  {featured && <span className="sticker !text-sm" style={{ background: "var(--butter)" }}>Phổ biến nhất</span>}
                </div>

                <p className="mt-6 flex items-baseline gap-2">
                  {/* normal-case: uppercase would turn "đ" into "Đ" and "k" into "K" */}
                  <span className="display normal-case text-[5rem] !text-current">{p.price}</span>
                  <span className={`font-semibold ${featured ? "text-paper/75" : "text-ink-2"}`}>{p.period}</span>
                </p>
                <p className={`mt-2 ${featured ? "text-paper/85" : "text-ink-2"}`}>{p.blurb}</p>

                <ul className={`mt-8 space-y-3.5 border-t pt-8 ${featured ? "border-paper/15" : "border-ink/10"}`}>
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          featured ? "bg-lime text-ink" : "bg-ink text-paper"
                        }`}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className={`font-medium ${featured ? "text-paper/90" : "text-ink"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/register" className={`mt-10 w-full ${featured ? "btn-lime" : "btn-ink"}`}>
                  {p.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              </Tilt>
            </Reveal>
          );
        })}
      </div>
    </Container>
  </section>
);

export default PricingSection;

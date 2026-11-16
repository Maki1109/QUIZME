import { useState } from "react";
import { Plus } from "lucide-react";
import { Container, Reveal, Sticker } from "./primitives";
import { Decor, Doodle, Peek, Spot } from "./backdrop";
import { Kinetic } from "./kinetic";

const faqs = [
  {
    q: "QuizMe phù hợp với ai?",
    a: "Học sinh THPT từ lớp 10 đến 12 đang ôn thi tốt nghiệp và đại học. Hiện QuizMe tập trung vào Toán, các môn khác sẽ được bổ sung dần.",
  },
  {
    q: "Sổ lỗi sai động khác gì tự chép lỗi sai ra vở?",
    a: "Hệ thống tự ghi lại mọi câu bạn làm sai, gom theo dạng bài và độ khó, rồi mỗi tuần chọn ra 20 lỗi quan trọng nhất. Bạn không phải tự chép, và luôn biết nên ôn gì trước.",
  },
  {
    q: "Gia sư AI có giải bài hộ không?",
    a: "Không đưa đáp án ngay. Gia sư dùng phương pháp Socratic: gợi ý từng bước và đặt câu hỏi để bạn tự tìm ra lời giải, nhờ vậy bạn nhớ lâu hơn.",
  },
  {
    q: "Mỗi ngày cần học bao lâu?",
    a: "Tối thiểu 5 phút cho thử thách hằng ngày. Nếu có thêm thời gian, phiên ôn flashcard và một đề Sprint 15 phút là đủ cho một ngày hiệu quả.",
  },
  {
    q: "Có dùng được trên điện thoại không?",
    a: "Có. QuizMe chạy trên trình duyệt, giao diện tự co giãn theo màn hình điện thoại, máy tính bảng và máy tính.",
  },
  {
    q: "Tôi có thể hủy gói trả phí không?",
    a: "Có, bạn có thể hủy bất cứ lúc nào. Tài khoản sẽ quay về gói Cơ bản khi hết chu kỳ thanh toán, dữ liệu học tập vẫn được giữ nguyên.",
  },
];

const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative isolate bg-paper pt-16 pb-24 md:pt-24 md:pb-36 scroll-mt-20">
      <Decor>
        <Spot className="-left-[12%] top-[0%] h-[800px] w-[800px]" color="rgba(185, 219, 253, 0.07)" />
        <Doodle kind="question" className={`left-[4%] bottom-[8%] w-32 -rotate-12 text-ink/[0.2] max-lg:hidden`} />
        <Doodle kind="question" className={`left-[16%] bottom-[22%] w-14 rotate-12 text-ink/[0.2] max-lg:hidden`} />
        <Peek name="qr" className="-right-8 top-[10%] w-32 max-xl:hidden" rot={-12} drift={45} />
      </Decor>
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Sticker color="var(--butter)">Hỏi đáp</Sticker>
            <h2 className="display mt-5 text-[2.9rem] sm:text-6xl lg:text-[4.5rem]"><Kinetic>Câu hỏi thường gặp</Kinetic></h2>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-ink-2">
              Chưa thấy câu trả lời bạn cần? Hỏi thẳng Mascot AI sau khi đăng ký, hoặc gửi email cho đội ngũ QuizMe.
            </p>
          </Reveal>

          <div className="space-y-3 lg:col-span-8">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <Reveal key={f.q} delay={i * 50}>
                  <div className={`rounded-[1.5rem] transition-colors duration-300 ${isOpen ? "bg-surface shadow-[var(--shadow-soft)]" : "bg-paper-2"}`}>
                    <h3>
                      <button
                        id={`faq-q-${i}`}
                        className="flex w-full items-center justify-between gap-6 rounded-[1.5rem] px-6 py-5 text-left md:px-7 md:py-6 focus-visible:outline-2 focus-visible:outline-brand"
                        onClick={() => setOpen(isOpen ? null : i)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-a-${i}`}
                      >
                        <span className="text-lg font-bold text-ink md:text-xl" style={{ fontFamily: "var(--font-body)" }}>
                          {f.q}
                        </span>
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-[transform,background-color] duration-300 ease-[var(--ease-fluid)] ${
                            isOpen ? "rotate-45 bg-ink text-paper" : "bg-peach text-ink"
                          }`}
                          aria-hidden="true"
                        >
                          <Plus className="h-4 w-4" />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={`faq-a-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-fluid)] motion-reduce:transition-none ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-6 pb-6 pr-16 leading-relaxed text-ink-2 md:px-7 md:pb-7">{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default FAQSection;

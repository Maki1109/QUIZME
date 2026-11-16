/**
 * "Try one question" — a working miniature of QuizMe's core loop, no sign-up needed.
 * A wrong pick gets a hint aimed at that specific misconception (the Socratic tutor's approach);
 * the answer is only shown after a second miss or a correct answer.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, RotateCcw, Sparkles, X } from "lucide-react";
import phone from "../../assets/landing/screen-phone.webp";
import { Container, Reveal, Sticker } from "./primitives";
import { HandNote, PhoneFrame, ScribbleArrow } from "./showcase-kit";
import { ChalkText, Decor, Doodle, GridFade, Peek, Spot } from "./backdrop";
import { Kinetic } from "./kinetic";

type Letter = "A" | "B" | "C" | "D";
interface DemoQuestion {
  id: string;
  tab: string;
  level: string;
  prompt: string;
  options: Record<Letter, string>;
  answer: Letter;
  /** Hint for each wrong option: names the likely mistake without giving the answer away. */
  nudges: Partial<Record<Letter, string>>;
  explanation: string;
}

// Written and checked by hand.
const QUESTIONS: DemoQuestion[] = [
  {
    id: "monotonic",
    tab: "Hàm số",
    level: "Thông hiểu",
    prompt: "Hàm số y = x³ − 3x + 1 nghịch biến trên khoảng nào?",
    options: { A: "(−∞; −1)", B: "(−1; 1)", C: "(1; +∞)", D: "(−∞; +∞)" },
    answer: "B",
    nudges: {
      A: "Trên (−∞; −1), thử thay x = −2 vào y′ = 3x² − 3 xem y′ mang dấu gì?",
      C: "Thử x = 2: y′ = 3·4 − 3 = 9. Đạo hàm dương thì hàm đang tăng hay giảm?",
      D: "Hàm bậc ba có hai điểm cực trị thì có thể giảm trên cả trục số không? Hãy tìm nghiệm của y′ = 0 trước.",
    },
    explanation: "y′ = 3x² − 3 < 0 ⇔ x² < 1 ⇔ −1 < x < 1. Vậy hàm số nghịch biến trên (−1; 1).",
  },
  {
    id: "log",
    tab: "Logarit",
    level: "Nhận biết",
    prompt: "Nghiệm của phương trình log₂(x − 1) = 3 là",
    options: { A: "x = 7", B: "x = 8", C: "x = 9", D: "x = 10" },
    answer: "C",
    nudges: {
      A: "Có phải bạn đã lấy 2³ − 1? Hãy xem lại: 2³ bằng x − 1, không phải bằng x + 1.",
      B: "Bạn tính đúng 2³ = 8 rồi — nhưng 8 là giá trị của x − 1 hay của x?",
      D: "log₂(x − 1) = 3 nghĩa là 2 mũ mấy bằng x − 1? Tính lại 2³ nhé.",
    },
    explanation: "log₂(x − 1) = 3 ⇔ x − 1 = 2³ = 8 ⇔ x = 9 (thỏa điều kiện x > 1).",
  },
  {
    id: "prob",
    tab: "Xác suất",
    level: "Nhận biết",
    prompt: "Gieo một con xúc xắc cân đối. Xác suất để mặt xuất hiện có số chấm chẵn là",
    options: { A: "1/6", B: "1/3", C: "1/2", D: "2/3" },
    answer: "C",
    nudges: {
      A: "1/6 là xác suất của đúng một mặt. Có bao nhiêu mặt mang số chấm chẵn?",
      B: "Bạn đếm được mấy mặt chẵn? Liệt kê thử: 2, 4, … còn mặt nào nữa không?",
      D: "Xác suất = số kết quả thuận lợi / số kết quả có thể. Có 6 kết quả — bao nhiêu trong đó là số chẵn?",
    },
    explanation: "Có 3 mặt chẵn (2, 4, 6) trong 6 kết quả đồng khả năng, nên P = 3/6 = 1/2.",
  },
];

const LETTERS: Letter[] = ["A", "B", "C", "D"];

function QuestionCard({ q }: { q: DemoQuestion }) {
  const [wrong, setWrong] = useState<Letter[]>([]);
  const [solved, setSolved] = useState(false);
  const revealed = solved || wrong.length >= 2;
  const lastWrong = wrong[wrong.length - 1];

  const pick = (l: Letter) => {
    if (revealed || wrong.includes(l)) return;
    if (l === q.answer) setSolved(true);
    else setWrong((w) => [...w, l]);
  };
  const reset = () => {
    setWrong([]);
    setSolved(false);
  };

  return (
    <div className="paper-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-sky px-2.5 py-1">Trắc nghiệm</span>
        <span className="rounded-full bg-paper-2 px-2.5 py-1">{q.level}</span>
      </div>
      <p className="mt-4 text-[1.35rem] font-bold leading-snug text-ink sm:text-2xl">{q.prompt}</p>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Chọn đáp án">
        {LETTERS.map((l) => {
          const isWrong = wrong.includes(l);
          const isRight = revealed && l === q.answer;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={isRight || isWrong}
              disabled={revealed || isWrong}
              onClick={() => pick(l)}
              className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-[transform,background-color,border-color] duration-200 active:scale-[0.97] active:duration-75 disabled:cursor-default ${
                isRight ? "border-[var(--answer-correct)] bg-lime" : isWrong ? "border-[var(--answer-wrong)] bg-pink" : "border-line bg-surface hover:border-ink"
              }`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold ${isRight || isWrong ? "bg-surface/70" : "bg-paper-2"}`}>
                {isRight ? <Check className="h-4 w-4" /> : isWrong ? <X className="h-4 w-4" /> : l}
              </span>
              <span className="text-lg">{q.options[l]}</span>
            </button>
          );
        })}
      </div>

      {/* Tutor reply: a hint after a miss, the explanation once solved. */}
      <div className="mt-5 min-h-[5.5rem]" aria-live="polite">
        {(lastWrong || revealed) && (
          <div key={`${wrong.length}-${solved}`} className="animate-fade-in flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-paper" aria-hidden="true">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className={`flex-1 rounded-[1.25rem] rounded-tl-md px-4 py-3 ${solved ? "bg-lime" : revealed ? "bg-butter" : "bg-paper"}`}>
              <p className="text-sm font-extrabold">{solved ? "Chính xác! 🎉" : revealed ? "Cùng xem lời giải nhé" : "Gần rồi — thử nghĩ thế này:"}</p>
              <p className="mt-1 leading-relaxed text-ink-2">{revealed ? q.explanation : q.nudges[lastWrong as Letter]}</p>
              {!revealed && <p className="mt-1 text-sm font-semibold text-ink-3">Chọn lại một phương án khác.</p>}
            </div>
          </div>
        )}
      </div>

      {revealed && (
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Link to="/register" className="btn-ink !h-12">
            Luyện tiếp với lỗi sai của bạn <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-ink-2 hover:bg-ink/5">
            <RotateCcw className="h-4 w-4" /> Làm lại câu này
          </button>
        </div>
      )}
    </div>
  );
}

const TryQuestion = () => {
  const [index, setIndex] = useState(0);
  return (
    <section id="try" className="relative isolate scroll-mt-20 overflow-hidden bg-surface py-24 md:py-32">
      <Decor>
        <GridFade className="-right-[10%] top-[-10%] h-[900px] w-[1000px]" />
        <Spot className="right-[5%] top-[20%] h-[700px] w-[800px]" color="rgba(55, 210, 154, 0.08)" />
        <Doodle kind="question" className={`right-[3%] top-[6%] w-20 rotate-12 text-ink/[0.2] max-md:hidden`} />
        <Doodle kind="question" className={`left-[44%] bottom-[5%] w-12 -rotate-12 text-ink/[0.2] max-lg:hidden`} />
        <ChalkText className={`right-[8%] bottom-[7%] rotate-2 text-[1.6rem] text-ink/[0.2] max-lg:hidden`}>y′ = 3x² − 3</ChalkText>
        <Peek name="bubble" className="-right-10 top-[42%] w-36 max-xl:hidden" rot={-10} drift={45} />
      </Decor>
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="relative">
            <Reveal>
              <Sticker color="var(--butter)">Thử ngay, không cần đăng ký</Sticker>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="display mt-5 text-[2.9rem] sm:text-6xl lg:text-[4.4rem]"><Kinetic>
                Sai một lần, <em>hiểu</em> luôn</Kinetic>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-2">
                Cố tình chọn sai thử xem. Gia sư của QuizMe không đưa đáp án ngay mà chỉ ra đúng chỗ bạn có thể đã nhầm — giống một thầy cô ngồi cạnh.
              </p>
            </Reveal>

            <Reveal delay={160} className="relative mt-10 hidden lg:block">
              <PhoneFrame src={phone} alt="Thử thách 5 phút trên điện thoại: câu trả lời ngắn về nguyên hàm, có đồng hồ đếm ngược" className="w-[230px] rotate-[-5deg]" />
              <div className="absolute left-[250px] top-16 w-48">
                <ScribbleArrow kind="upLeft" className="-ml-6 h-12 w-14 rotate-[20deg] text-brand-ink" />
                <HandNote>mỗi ngày 5 câu, ngay trên điện thoại</HandNote>
              </div>
            </Reveal>
          </div>

          <Reveal delay={80}>
            <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Chọn câu hỏi mẫu">
              {QUESTIONS.map((q, i) => (
                <button
                  key={q.id}
                  role="tab"
                  aria-selected={i === index}
                  onClick={() => setIndex(i)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-[background-color,color,transform] duration-200 active:scale-95 ${i === index ? "bg-ink text-paper" : "bg-paper text-ink-2 hover:bg-paper-2"}`}
                >
                  {q.tab}
                </button>
              ))}
            </div>
            {/* key resets the card state when switching question */}
            <QuestionCard key={QUESTIONS[index].id} q={QUESTIONS[index]} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
};

export default TryQuestion;

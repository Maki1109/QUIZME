/**
 * Interactive forgetting curve — the idea behind "Thời điểm vàng".
 *
 * Drag the day marker: it follows the pointer 1:1 (keeping the grab offset), and on release it
 * settles onto the nearest whole day with a critically damped spring that starts from the
 * marker's live position and the pointer's release velocity, so a drag can be caught mid-flight.
 * Keyboard: ← → move by a day, Home / End jump to the ends.
 *
 * Model (illustrative): without review, retention follows an Ebbinghaus-style decay towards ~20%.
 * With QuizMe, each review lands when memory reaches 90% (R = 0.9^(t / interval)), and the interval
 * grows after every review, as in the SM-2 scheduler the app uses.
 */

import { PointerEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container, Reveal, Sticker, WaveEdge } from "./primitives";
import { HandNote } from "./showcase-kit";
import { ChalkText, Decor, Doodle, Peek, Spot } from "./backdrop";
import { Watermark } from "./print-kit";
import { Kinetic } from "./kinetic";

/** Colour of the "reviewed on time" line: signal yellow on the dark landing page, ink elsewhere. */
const GOLD = "var(--pop, var(--ink))";
const DAYS = 30;
const REVIEWS = [0, 1, 3, 7, 16, 37]; // learn on day 0, then review on these days
const W = 640;
const H = 300;
const X0 = 44;
const X1 = 624;
const Y100 = 24;
const Y0 = 256;

const raw = (t: number) => 20 + 80 * Math.exp(-t / 1.4);
function golden(t: number) {
  let k = 0;
  while (k < REVIEWS.length - 2 && t >= REVIEWS[k + 1]) k += 1;
  const interval = REVIEWS[k + 1] - REVIEWS[k];
  return 100 * 0.9 ** ((t - REVIEWS[k]) / interval);
}
const xOf = (day: number) => X0 + (day / DAYS) * (X1 - X0);
const yOf = (pct: number) => Y0 - (pct / 100) * (Y0 - Y100);
const dayOf = (x: number) => Math.min(DAYS, Math.max(0, ((x - X0) / (X1 - X0)) * DAYS));

function pathFor(fn: (t: number) => number) {
  const pts: string[] = [];
  for (let t = 0; t <= DAYS + 1e-9; t += 0.05) pts.push(`${xOf(t).toFixed(1)},${yOf(fn(t)).toFixed(1)}`);
  return `M${pts.join(" L")}`;
}
function goldenPath() {
  // Draw each review segment separately so the jump back to 100% is a clean vertical stroke.
  let d = "";
  for (let k = 0; k < REVIEWS.length - 1 && REVIEWS[k] <= DAYS; k += 1) {
    const from = REVIEWS[k];
    const to = Math.min(REVIEWS[k + 1], DAYS);
    const interval = REVIEWS[k + 1] - REVIEWS[k];
    for (let t = from; t <= to + 1e-9; t += 0.05) {
      const p = `${xOf(t).toFixed(1)},${yOf(100 * 0.9 ** ((t - from) / interval)).toFixed(1)}`;
      d += t === from ? `${k === 0 ? "M" : " L"}${p}` : ` L${p}`;
    }
  }
  return d;
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Critically damped spring on a single number, interruptible from its live value. */
function useDaySpring(initial: number, onFrame: (v: number) => void) {
  const value = useRef(initial);
  const velocity = useRef(0);
  const raf = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const set = useCallback(
    (v: number) => {
      stop();
      value.current = v;
      velocity.current = 0;
      onFrame(v);
    },
    [onFrame, stop]
  );

  /** response ≈ seconds to settle (Apple's "response"); damping ratio 1 = no overshoot. */
  const animateTo = useCallback(
    (target: number, { initialVelocity = velocity.current, response = 0.45 } = {}) => {
      stop();
      if (prefersReducedMotion()) return set(target);
      const omega = (2 * Math.PI) / response;
      velocity.current = initialVelocity;
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(0.032, (now - last) / 1000);
        last = now;
        const accel = -omega * omega * (value.current - target) - 2 * omega * velocity.current; // ζ = 1
        velocity.current += accel * dt;
        value.current += velocity.current * dt;
        if (Math.abs(value.current - target) < 0.002 && Math.abs(velocity.current) < 0.01) {
          value.current = target;
          velocity.current = 0;
          onFrame(target);
          raf.current = null;
          return;
        }
        onFrame(value.current);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [onFrame, set, stop]
  );

  useEffect(() => stop, [stop]);
  // Stable identity, so effects that depend on the spring do not re-run on every frame.
  return useMemo(() => ({ value, velocity, set, animateTo, stop }), [set, animateTo, stop]);
}

const ForgettingCurve = () => {
  const [day, setDay] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const spring = useDaySpring(0, setDay);
  const drag = useRef<{ offset: number; history: { day: number; time: number }[] } | null>(null);

  const rawD = useMemo(() => pathFor(raw), []);
  const goldenD = useMemo(goldenPath, []);

  // Draw the curves when the chart comes into view, then glide the marker to day 7.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setDrawn(true);
        setTimeout(() => {
          if (!drag.current) spring.animateTo(7, { response: 1.1 });
        }, prefersReducedMotion() ? 0 : 900);
        io.disconnect();
      },
      { threshold: 0.45 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [spring]);

  /** Pointer x in SVG coordinates. */
  const svgX = (e: PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * W;
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    spring.stop(); // catch it mid-flight, from where it is now
    const x = svgX(e);
    const knobX = xOf(spring.value.current);
    // Grabbing the marker keeps the offset; pressing elsewhere on the chart jumps there.
    const offset = Math.abs(x - knobX) < 22 ? x - knobX : 0;
    const d = dayOf(x - offset);
    spring.set(d);
    drag.current = { offset, history: [{ day: d, time: performance.now() }] };
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const d = dayOf(svgX(e) - drag.current.offset);
    spring.set(d);
    const now = performance.now();
    drag.current.history = [...drag.current.history.filter((h) => now - h.time < 100), { day: d, time: now }];
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const h = drag.current.history;
    const first = h[0];
    const last = h[h.length - 1];
    const dt = (last.time - first.time) / 1000;
    const v = dt > 0 ? (last.day - first.day) / dt : 0; // days per second at release
    drag.current = null;
    setDragging(false);
    // Project the throw a little (scroll-like deceleration), then settle on a whole day.
    const projected = spring.value.current + (v / 1000) * (0.99 / (1 - 0.99));
    spring.animateTo(Math.round(Math.min(DAYS, Math.max(0, projected))), { initialVelocity: v, response: 0.4 });
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const current = Math.round(spring.value.current);
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? current + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? current - 1 : e.key === "Home" ? 0 : e.key === "End" ? DAYS : null;
    if (next === null) return;
    e.preventDefault();
    spring.animateTo(Math.min(DAYS, Math.max(0, next)), { response: 0.3 });
  };

  const r = raw(day);
  const g = golden(day);
  const shownDay = Math.round(day);
  const nextReview = REVIEWS.find((d) => d > day + 1e-6);
  const reviewsDone = REVIEWS.filter((d) => d > 0 && d <= day + 1e-6).length;
  const knobX = xOf(day);

  return (
    <section id="golden-time" className="relative isolate scroll-mt-20 bg-paper pt-24 md:pt-32">
      <Decor>
        <Spot className="right-[-10%] top-[-10%] h-[900px] w-[900px]" color="rgba(255, 201, 60, 0.12)" />
        <Spot className="left-[-15%] bottom-[12%] h-[700px] w-[700px]" color="rgba(255, 138, 198, 0.06)" />
        <Watermark text="90%" className="right-[2%] top-[2%] text-[24vw]" />
        <Doodle kind="clock" className={`left-[42%] top-[4%] w-24 -rotate-6 text-ink/[0.2] max-lg:hidden`} />
        <ChalkText className={`left-[3%] bottom-[4%] -rotate-2 text-[1.5rem] text-ink/[0.2] max-lg:hidden`}>R = e^(−t ⁄ S)</ChalkText>
        <Peek name="seal" className="-right-10 bottom-[8%] w-36 max-xl:hidden" rot={12} drift={45} />
      </Decor>
      <Container>
        <div className="mb-12 max-w-3xl md:mb-14">
          <Reveal>
            <Sticker color="var(--butter)">Thời điểm vàng</Sticker>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="display mt-5 text-[2.9rem] sm:text-6xl lg:text-[4.6rem]"><Kinetic>
              Kéo thử đường cong <em>lãng quên</em></Kinetic>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              Không ôn lại, sau một tuần ta chỉ còn nhớ khoảng một phần năm. QuizMe nhắc bạn ôn đúng lúc trí nhớ chạm 90% — mỗi lần ôn, kiến thức bám lâu hơn và lần ôn sau được giãn xa hơn.
            </p>
          </Reveal>
        </div>

        <Reveal delay={80}>
          <div className="paper-card grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
            <div>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${W} ${H}`}
                className={`w-full touch-none select-none outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-brand ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                role="slider"
                tabIndex={0}
                aria-label="Số ngày kể từ khi học"
                aria-valuemin={0}
                aria-valuemax={DAYS}
                aria-valuenow={shownDay}
                aria-valuetext={`Ngày ${shownDay}: không ôn còn nhớ ${Math.round(r)}%, ôn đúng thời điểm vàng còn nhớ ${Math.round(g)}%`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
              >
                <defs>
                  <linearGradient id="fc-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" style={{ stopColor: GOLD }} stopOpacity="0.32" />
                    <stop offset="100%" style={{ stopColor: GOLD }} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* grid */}
                {[0, 25, 50, 75, 100].map((p) => (
                  <g key={p}>
                    <line x1={X0} x2={X1} y1={yOf(p)} y2={yOf(p)} style={{ stroke: "var(--line-strong)" }} strokeDasharray={p === 90 ? "" : "3 5"} />
                    <text x={X0 - 8} y={yOf(p) + 4} textAnchor="end" className="fc-label">
                      {p}%
                    </text>
                  </g>
                ))}
                <line x1={X0} x2={X1} y1={yOf(90)} y2={yOf(90)} style={{ stroke: "var(--brand-ink)" }} strokeOpacity="0.45" strokeDasharray="2 4" />
                <text x={X1 - 4} y={yOf(90) + 16} textAnchor="end" className="fc-label" style={{ fill: "var(--brand-ink)" }}>
                  ngưỡng ôn 90%
                </text>
                {[0, 5, 10, 15, 20, 25, 30].map((d) => (
                  <text key={d} x={xOf(d)} y={H - 16} textAnchor={d === 0 ? "start" : d === DAYS ? "end" : "middle"} className={`fc-label ${d === 25 ? "max-sm:hidden" : ""}`}>
                    {d === 0 ? "học" : `ngày ${d}`}
                  </text>
                ))}

                {/* curves */}
                <path d={`${goldenD} L${xOf(DAYS)},${Y0} L${X0},${Y0} Z`} fill="url(#fc-fill)" className={`transition-opacity duration-700 ${drawn ? "opacity-100" : "opacity-0"}`} />
                <path
                  d={rawD}
                  fill="none"
                  stroke="#FF95C3"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  pathLength={1}
                  style={{ strokeDashoffset: drawn ? 0 : 1, transition: "stroke-dashoffset 1.4s var(--ease-fluid)" }}
                />
                <path
                  d={goldenD}
                  fill="none"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  pathLength={1}
                  style={{ stroke: GOLD, strokeDashoffset: drawn ? 0 : 1, transition: "stroke-dashoffset 1.6s var(--ease-fluid) 0.15s" }}
                />
                {REVIEWS.filter((d) => d > 0 && d <= DAYS).map((d, i) => (
                  <g key={d} className={`transition-opacity duration-500 ${drawn ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: `${0.6 + i * 0.15}s` }}>
                    <circle cx={xOf(d)} cy={yOf(100)} r={day >= d - 0.02 ? 6.5 : 5} fill="#F9E47C" style={{ stroke: "var(--surface)" }} strokeWidth="2" />
                    <text x={xOf(d)} y={yOf(100) - 11} textAnchor="middle" className="fc-tag">
                      ôn {i + 1}
                    </text>
                  </g>
                ))}

                {/* marker */}
                <line x1={knobX} x2={knobX} y1={Y100 - 6} y2={Y0} style={{ stroke: "var(--ink)" }} strokeOpacity="0.35" strokeWidth="1.5" />
                <circle cx={knobX} cy={yOf(r)} r="6" fill="#FF95C3" style={{ stroke: "var(--surface)" }} strokeWidth="2.5" />
                <circle cx={knobX} cy={yOf(g)} r="6" style={{ fill: GOLD, stroke: "var(--surface)" }} strokeWidth="2.5" />
                <g transform={`translate(${knobX}, ${Y0 + 1})`}>
                  <rect x="-22" y="-3" width="44" height="22" rx="11" style={{ fill: "var(--ink)" }} className={`transition-transform duration-100 ${dragging ? "scale-110" : ""}`} />
                  <path d="M-8 8 l-4 0 M12 8 l-4 0" style={{ stroke: "var(--paper)" }} strokeWidth="2" strokeLinecap="round" />
                  <path d="M-12 8 l3 -3 M-12 8 l3 3 M12 8 l-3 -3 M12 8 l-3 3" style={{ stroke: "var(--paper)" }} strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
              <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold text-ink-2">
                <span className="inline-flex items-center gap-2"><span className="h-1 w-6 rounded-full bg-pink" /> Học xong rồi bỏ đó</span>
                <span className="inline-flex items-center gap-2"><span className="h-1 w-6 rounded-full" style={{ background: GOLD }} /> Ôn đúng thời điểm vàng</span>
                <span className="ml-auto text-xs text-ink-3">Kéo trên biểu đồ<span className="hidden sm:inline"> hoặc dùng phím ← →</span></span>
              </p>
            </div>

            <div className="flex flex-col justify-center gap-3" aria-live="polite">
              <p className="eyebrow">{shownDay === 0 ? "Vừa học xong" : `Sau ${shownDay} ngày`}</p>
              <div className="rounded-[1.25rem] bg-pink/30 p-4">
                <p className="text-sm font-bold text-ink-2">Không ôn lại</p>
                <p className="display mt-1 text-[3rem] normal-case tabular-nums">{Math.round(r)}%</p>
              </div>
              <div className="rounded-[1.25rem] bg-ink p-4 text-paper">
                <p className="text-sm font-bold text-paper/75">Với QuizMe nhắc ôn</p>
                <p className="display mt-1 text-[3rem] normal-case tabular-nums !text-paper">{Math.round(g)}%</p>
                <p className="text-xs font-semibold text-paper/70">
                  {reviewsDone ? `đã ôn ${reviewsDone} lần` : "chưa cần ôn"}
                  {nextReview !== undefined && nextReview <= DAYS ? ` · lần tới: ngày ${nextReview}` : ""}
                </p>
              </div>
              <HandNote className="mt-1 -rotate-2 !text-[1.35rem]">chỉ vài phút mỗi lần ôn thôi!</HandNote>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-3">Mô hình minh họa dựa trên đường cong lãng quên Ebbinghaus và thuật toán lặp lại ngắt quãng SM-2 mà QuizMe dùng để xếp lịch ôn.</p>
        </Reveal>
      </Container>
      <WaveEdge color="var(--paper-2)" className="mt-16 md:mt-24" />
    </section>
  );
};

export default ForgettingCurve;

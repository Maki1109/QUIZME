import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Container, Reveal } from "./primitives";
import { StickerField, type StickerSpec } from "./StickerField";
import { STICKERS } from "./stickers";
import { Decor, Spot } from "./backdrop";
import { Kinetic } from "./kinetic";

const ctaStickers: StickerSpec[] = [
  { id: "cta-mascot", ...STICKERS.mascot, d: [2.5, 7, 12.5], m: [2, 2, 30] },
  { id: "cta-flame", ...STICKERS.flame, d: [87.5, 6, 8.5], m: [74, 1.5, 21] },
  { id: "cta-burst", ...STICKERS.burst, d: [84.5, 60, 12.5], m: [66, 84.5, 30] },
  { id: "cta-pencil", ...STICKERS.pencil, d: [3, 80, 19], m: [4, 90, 52], rot: 4 },
  { id: "cta-pill", ...STICKERS.pill, d: [71.5, 85, 14] },
];

const CTASection = () => (
  <section className="relative isolate bg-paper pb-24 md:pb-32">
    <Decor>
      <Spot className="left-1/2 top-[10%] h-[900px] w-[1500px] -translate-x-1/2" color="rgba(55, 210, 154, 0.10)" />
    </Decor>
    <Container>
      <Reveal>
        <div className="board relative isolate overflow-hidden rounded-[2rem] px-6 py-36 text-center ring-1 ring-ink/15 sm:px-12 md:rounded-[2.5rem] md:py-32">
          <div className="relative z-10 mx-auto max-w-4xl">
            <p className="label-tape">Sẵn sàng cho kỳ thi?</p>
            <h2 className="display mx-auto mt-7 text-5xl sm:text-6xl lg:text-[6rem]"><Kinetic>
              Bắt đầu ôn tập <em>đúng cách</em> ngay hôm nay</Kinetic>
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-lg text-ink-2">
              Làm bài kiểm tra đầu vào trong 10 phút và nhận lộ trình học riêng cho mục tiêu của bạn.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-pop !h-14 !px-8 !text-xl">
                Tạo tài khoản miễn phí
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="btn-ghost !h-14 !px-8 !text-xl">
                Tôi đã có tài khoản
              </Link>
            </div>
          </div>

          <StickerField items={ctaStickers} className="absolute inset-0 z-20" introDelay={0} />
        </div>
      </Reveal>
    </Container>
  </section>
);

export default CTASection;

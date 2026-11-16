/**
 * The QuizMe sticker set. Artwork is hand-drawn SVG kept in FE/design/stickers.html;
 * these are its transparent exports (2x). Sizes are the artwork's CSS-pixel boxes.
 */
import bolt from "../../assets/stickers/bolt.webp";
import bubble from "../../assets/stickers/bubble.webp";
import burst from "../../assets/stickers/burst.webp";
import card from "../../assets/stickers/card.webp";
import flame from "../../assets/stickers/flame.webp";
import hello from "../../assets/stickers/hello.webp";
import mascot from "../../assets/stickers/mascot.webp";
import notebook from "../../assets/stickers/notebook.webp";
import pencil from "../../assets/stickers/pencil.webp";
import pill from "../../assets/stickers/pill.webp";
import qr from "../../assets/stickers/qr.webp";
import seal from "../../assets/stickers/seal.webp";
import ticket from "../../assets/stickers/ticket.webp";

export const STICKERS = {
  hello: { src: hello, w: 320, h: 240 },
  mascot: { src: mascot, w: 300, h: 300 },
  burst: { src: burst, w: 260, h: 260 },
  ticket: { src: ticket, w: 350, h: 200 },
  bubble: { src: bubble, w: 280, h: 236 },
  seal: { src: seal, w: 280, h: 280 },
  flame: { src: flame, w: 230, h: 290 },
  notebook: { src: notebook, w: 270, h: 300 },
  pencil: { src: pencil, w: 430, h: 130 },
  card: { src: card, w: 330, h: 230 },
  bolt: { src: bolt, w: 200, h: 270 },
  pill: { src: pill, w: 330, h: 160 },
  qr: { src: qr, w: 260, h: 300 },
} as const;

export type StickerName = keyof typeof STICKERS;

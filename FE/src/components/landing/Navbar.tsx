import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Container, Wordmark } from "./primitives";

const links = [
  { label: "Góc học", href: "#showcase" },
  { label: "Tính năng", href: "#features" },
  { label: "Phương pháp", href: "#method" },
  { label: "Bảng giá", href: "#pricing" },
  { label: "Hỏi đáp", href: "#faq" },
];

/** Critically damped by default — menus that merely appear shouldn't bounce. */
const sheetSpring = { type: "spring", bounce: 0, duration: 0.4 } as const;

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const primary = isAuthenticated
    ? { to: "/dashboard", label: "Vào học" }
    : { to: "/register", label: "Học miễn phí" };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Floating chrome: translucent once content scrolls beneath it. A soft
          shadow, not a hairline, marks the edge — and only when it overlaps. */}
      <div
        className={`transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
          scrolled || open ? "glass shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]" : "bg-transparent"
        }`}
      >
        <Container className="flex h-[72px] items-center justify-between gap-6">
          <Link to="/" className="text-[1.9rem] leading-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" aria-label="QuizMe — trang chủ">
            <Wordmark />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Mục trang">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-4 py-2 text-[0.95rem] font-semibold text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink active:bg-ink/10"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {!isAuthenticated && (
              <Link to="/login" className="rounded-full px-4 py-2 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-ink/5 active:bg-ink/10">
                Đăng nhập
              </Link>
            )}
            <Link to={primary.to} className="btn-lime !h-11 !px-5">
              {primary.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            className="lg:hidden -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition-transform active:scale-90 active:duration-100 focus-visible:outline-2 focus-visible:outline-brand"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {/* Two bars that cross into an X — the icon hints at the state it leads to. */}
            <span className="relative block h-3 w-6" aria-hidden="true">
              <span
                className={`absolute left-0 h-[2px] w-6 rounded-full bg-current transition-transform duration-300 ease-[var(--ease-fluid)] ${
                  open ? "top-[5px] rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 h-[2px] w-6 rounded-full bg-current transition-transform duration-300 ease-[var(--ease-fluid)] ${
                  open ? "top-[5px] -rotate-45" : "top-[10px]"
                }`}
              />
            </span>
          </button>
        </Container>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Dim to focus: the menu is a modal task. */}
            <motion.button
              key="scrim"
              type="button"
              aria-label="Đóng menu"
              tabIndex={-1}
              className="fixed inset-0 top-[72px] -z-10 bg-black/55 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            {/* Grows from the menu button (top-right) and returns there on close. */}
            <motion.div
              key="sheet"
              id="mobile-menu"
              className="lg:hidden mx-3 mt-2 overflow-hidden rounded-[1.75rem] bg-surface shadow-[var(--shadow-lift)]"
              style={{ transformOrigin: "calc(100% - 28px) -20px" }}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -12 }}
              transition={reduceMotion ? { duration: 0.15 } : sheetSpring}
            >
              <nav className="flex flex-col p-3" aria-label="Mục trang">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="display rounded-2xl px-4 py-3 text-[2rem] transition-colors active:bg-paper-2"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 border-t border-line p-4">
                <Link to={primary.to} className="btn-lime w-full" onClick={() => setOpen(false)}>
                  {primary.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!isAuthenticated && (
                  <Link to="/login" className="btn-ghost w-full" onClick={() => setOpen(false)}>
                    Đăng nhập
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

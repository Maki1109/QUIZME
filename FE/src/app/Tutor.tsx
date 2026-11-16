/**
 * AI Tutor Mascot: floating chat panel available on every signed-in page.
 * Other pages open it with a question attached (e.g. from the error notebook) via useTutor().
 */

import { createContext, FormEvent, lazy, ReactNode, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
// The formula renderer (KaTeX) is only downloaded once the chat is opened.
const RichText = lazy(() => import('./math').then((m) => ({ default: m.RichText })));

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}
interface Quota {
  used: number;
  limit: number;
  remaining: number;
}
interface TutorCtx {
  open: (opts?: { questionId?: string; label?: string; prompt?: string }) => void;
}

const Ctx = createContext<TutorCtx>({ open: () => undefined });
export const useTutor = () => useContext(Ctx);

export function TutorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [quota, setQuota] = useState<Quota | null>(null);
  const [context, setContext] = useState<{ questionId: string; label: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user || !visible || messages.length) return;
    api
      .get<{ message: string; quota: Quota | null }>('/tutor/intro')
      .then((r) => {
        setMessages([{ role: 'assistant', content: r.message }]);
        setQuota(r.quota);
      })
      .catch(() => setMessages([{ role: 'assistant', content: 'Chào bạn! Mình là gia sư QuizMe. Bạn đang vướng bài nào?' }]));
  }, [user, visible, messages.length]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // Sign-out clears the conversation.
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setVisible(false);
      setContext(null);
    }
  }, [user]);

  const open = useCallback<TutorCtx['open']>((opts = {}) => {
    setVisible(true);
    if (opts.questionId) setContext({ questionId: opts.questionId, label: opts.label || 'câu hỏi đang xem' });
    if (opts.prompt) setInput(opts.prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError('');
    const history = messages.slice(-12);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setBusy(true);
    try {
      const r = await api.post<{ message: string; quota: Quota }>('/tutor/chat', { message: text, history, questionId: context?.questionId });
      setMessages((m) => [...m, { role: 'assistant', content: r.message }]);
      setQuota(r.quota);
    } catch (err) {
      setError(errorMessage(err));
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {user && (
        <>
          {!visible && (
            <button
              onClick={() => open()}
              className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-ink px-5 font-bold text-paper shadow-[var(--shadow-lift)] transition-transform hover:scale-[1.03] active:scale-95 print:hidden"
              aria-label="Mở gia sư AI"
            >
              <MessageCircle className="h-5 w-5" /> <span className="hidden sm:inline">Hỏi gia sư</span>
            </button>
          )}
          {visible && (
            <aside className="fixed inset-x-3 bottom-3 z-50 flex max-h-[min(640px,calc(100vh-1.5rem))] flex-col overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[var(--shadow-lift)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px] print:hidden" aria-label="Gia sư AI">
              <header className="flex items-center gap-3 bg-lime px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold leading-tight">Gia sư QuizMe</p>
                  <p className="text-xs font-semibold text-ink-2">{quota ? `Còn ${quota.remaining}/${quota.limit} lượt hôm nay` : 'Hỏi gợi mở — không đưa sẵn đáp án'}</p>
                </div>
                <button onClick={() => setVisible(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-ink/10" aria-label="Đóng">
                  <X className="h-5 w-5" />
                </button>
              </header>
              {context && (
                <div className="flex items-center gap-2 border-b border-line bg-butter/50 px-5 py-2 text-xs font-semibold">
                  <span className="flex-1 truncate">Đang hỏi về: {context.label}</span>
                  <button onClick={() => setContext(null)} className="underline">Bỏ</button>
                </div>
              )}
              <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[88%] rounded-[1.25rem] px-4 py-2.5 text-[0.95rem] ${m.role === 'user' ? 'rounded-br-md bg-ink text-paper' : 'rounded-bl-md bg-paper'}`}>
                      {m.role === 'assistant' ? (
                        <Suspense fallback={<p className="whitespace-pre-wrap">{m.content}</p>}>
                          <RichText text={m.content} />
                        </Suspense>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex items-center gap-2 text-sm text-ink-3">
                    <Loader2 className="h-4 w-4 animate-spin" /> Gia sư đang suy nghĩ…
                  </div>
                )}
              </div>
              {error && <p className="mx-4 mb-2 rounded-xl bg-pink/40 px-3 py-2 text-xs font-semibold">{error}</p>}
              <form onSubmit={send} className="flex items-end gap-2 border-t border-line p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Mô tả chỗ bạn đang vướng…"
                  className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-paper px-4 py-2.5 text-[0.95rem] outline-none focus:border-ink"
                  aria-label="Tin nhắn cho gia sư"
                />
                <button type="submit" disabled={busy || !input.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper disabled:opacity-40 active:scale-90" aria-label="Gửi">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </aside>
          )}
        </>
      )}
    </Ctx.Provider>
  );
}

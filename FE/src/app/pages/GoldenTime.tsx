import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Brain, Download, ImagePlus, Loader2, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { date, relative } from '../../lib/format';
import type { Card as FlashCard } from '../../lib/types';
import { Shell } from '../Shell';
import { Bar, Card, Empty, ErrorBox, Loading, PageHeader, Pill, SectionTitle, Stat } from '../ui';
import { MathText } from '../math';
import { useStartSession } from './Session';

interface Stats {
  total: number;
  newCards: number;
  learning: number;
  mastered: number;
  dueNow: number;
  reviewsToday: number;
  averageRetention: number | null;
  forecast: { dayKey: string; count: number }[];
  fadingTopics: { topic: string; name: string; retention: number; mastery: number; lastPracticedAt: string }[];
  decks: { id: string; name: string }[];
}

const RATINGS = [
  { id: 'again', label: 'Quên', hint: '1 ngày', tone: 'pink' },
  { id: 'hard', label: 'Khó', hint: 'sớm hơn', tone: 'peach' },
  { id: 'good', label: 'Nhớ', hint: 'bình thường', tone: 'lime' },
  { id: 'easy', label: 'Dễ', hint: 'giãn xa', tone: 'sky' },
] as const;

function Review({ onDone }: { onDone: () => void }) {
  const { refresh } = useAuth();
  const { data, error, loading, reload } = useLoad(() => api.get<{ items: FlashCard[]; total: number }>('/flashcards/due', { limit: 30 }));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [xp, setXp] = useState(0);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const cards = data?.items || [];
  const card = cards[index];

  if (!card)
    return (
      <Empty title={cards.length ? 'Xong lượt ôn! 🎉' : 'Không có thẻ nào cần ôn lúc này'} action={<button onClick={onDone} className="btn-ink">Về tổng quan</button>}>
        {cards.length ? `Bạn đã ôn ${cards.length} thẻ${xp ? ` và nhận ${xp} XP` : ''}. Thẻ sẽ quay lại đúng thời điểm vàng tiếp theo.` : 'Thẻ sẽ xuất hiện khi đến thời điểm vàng — ngay trước khi bạn kịp quên.'}
      </Empty>
    );

  const rate = async (rating: string) => {
    setBusy(true);
    try {
      const r = await api.post<{ xpEarned: number }>(`/flashcards/${card.id}/review`, { rating });
      setXp((x) => x + r.xpEarned);
      setFlipped(false);
      setIndex((i) => i + 1);
      if (index === cards.length - 1) refresh().catch(() => undefined);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm font-bold">
        <span>Thẻ {index + 1}/{cards.length}{data && data.total > cards.length ? ` (còn ${data.total - cards.length} thẻ sau)` : ''}</span>
        <button onClick={onDone} className="text-ink-3 hover:text-ink">Dừng</button>
      </div>
      <Bar value={index} max={cards.length} className="mb-5" />
      <button onClick={() => setFlipped((f) => !f)} className="paper-card flex min-h-[300px] w-full flex-col items-center justify-center p-8 text-center transition-transform active:scale-[0.99]" aria-label={flipped ? 'Mặt sau — chạm để xem mặt trước' : 'Mặt trước — chạm để lật'}>
        {card.topicName && <Pill tone="lavender" className="mb-4">{card.topicName}</Pill>}
        <p className="eyebrow mb-3">{flipped ? 'Mặt sau' : 'Mặt trước'}</p>
        {(flipped ? card.backImage : card.frontImage) && <img src={(flipped ? card.backImage : card.frontImage) as string} alt="" className="mb-4 max-h-48 rounded-xl" />}
        <MathText text={flipped ? card.back : card.front} className="block text-2xl font-bold leading-snug" />
        {!flipped && card.hint && <p className="mt-4 text-sm text-ink-3">Gợi ý: {card.hint}</p>}
        {flipped && card.note && <p className="mt-4 text-sm text-ink-2">{card.note}</p>}
        {!flipped && <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-ink-3"><RotateCw className="h-4 w-4" /> Chạm để lật</p>}
      </button>
      {flipped && (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button key={r.id} onClick={() => rate(r.id)} disabled={busy} className={`rounded-2xl bg-${r.tone} px-2 py-3 font-extrabold transition-transform active:scale-95 disabled:opacity-60`}>
              {r.label}
              <span className="block text-xs font-semibold text-ink-2">{r.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CardEditor({ card, onClose, onSaved }: { card: FlashCard | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ front: card?.front || '', back: card?.back || '', hint: card?.hint || '', note: card?.note || '', frontImage: card?.frontImage || null, backImage: card?.backImage || null });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const upload = async (side: 'frontImage' | 'backImage', file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error('Ảnh tối đa 3MB');
    setUploading(side);
    try {
      const r = await api.upload<{ url: string }>('/flashcards/image', file);
      setForm((f) => ({ ...f, [side]: r.url }));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(null);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.front.trim() || !form.back.trim()) return toast.error('Cần có cả mặt trước và mặt sau');
    setBusy(true);
    try {
      if (card) await api.put(`/flashcards/${card.id}`, form);
      else await api.post('/flashcards', form);
      toast.success(card ? 'Đã lưu thẻ' : 'Đã tạo thẻ — thẻ mới sẵn sàng để ôn ngay');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  const field = 'w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-ink';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label={card ? 'Sửa thẻ' : 'Tạo thẻ'}>
      <form onSubmit={save} className="paper-card max-h-[92vh] w-full max-w-lg overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="display text-3xl">{card ? 'Sửa thẻ' : 'Thẻ mới'}</p>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full p-2 hover:bg-paper-2"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-3 text-xs text-ink-3">Viết công thức trong dấu $...$, ví dụ $\sin^2 x + \cos^2 x = 1$.</p>
        {(['front', 'back'] as const).map((side) => {
          const img = side === 'front' ? 'frontImage' : 'backImage';
          return (
            <div key={side} className="mb-4">
              <label className="mb-1.5 block text-sm font-bold">{side === 'front' ? 'Mặt trước (câu hỏi)' : 'Mặt sau (đáp án)'}</label>
              <textarea value={form[side]} onChange={(e) => setForm({ ...form, [side]: e.target.value.slice(0, 2000) })} rows={2} className={field} />
              <div className="mt-2 flex items-center gap-2">
                {form[img] ? (
                  <>
                    <img src={form[img] as string} alt="" className="h-14 rounded-lg" />
                    <button type="button" onClick={() => setForm({ ...form, [img]: null })} className="text-sm font-bold text-ink-3 underline">Bỏ ảnh</button>
                  </>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-sm font-bold hover:bg-paper-2">
                    {uploading === img ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Thêm ảnh
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(e) => upload(img, e.target.files?.[0])} />
                  </label>
                )}
              </div>
            </div>
          );
        })}
        <label className="mb-1.5 block text-sm font-bold">Gợi ý (không bắt buộc)</label>
        <input value={form.hint} onChange={(e) => setForm({ ...form, hint: e.target.value.slice(0, 500) })} className={`${field} mb-4`} />
        <label className="mb-1.5 block text-sm font-bold">Ghi chú (không bắt buộc)</label>
        <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value.slice(0, 1000) })} className={field} />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost !h-11">Hủy</button>
          <button type="submit" disabled={busy} className="btn-ink !h-11">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thẻ'}</button>
        </div>
      </form>
    </div>
  );
}

function Manage({ onChanged, version }: { onChanged: () => void; version: number }) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, reload } = useLoad(() => api.get<{ items: FlashCard[]; total: number }>('/flashcards', { status, search: query, page, limit: 30 }), [status, query, page, version]);
  const [editing, setEditing] = useState<FlashCard | null | 'new'>(null);
  const pages = data ? Math.max(1, Math.ceil(data.total / 30)) : 1;

  const remove = async (c: FlashCard) => {
    if (!window.confirm('Xóa thẻ này?')) return;
    try {
      await api.del(`/flashcards/${c.id}`);
      reload();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section className="mt-12">
      <SectionTitle action={<button onClick={() => setEditing('new')} className="btn-ink !h-10 !text-sm"><Plus className="h-4 w-4" /> Thẻ mới</button>}>Bộ thẻ của bạn</SectionTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        {[['', 'Tất cả'], ['due', 'Cần ôn'], ['new', 'Chưa học'], ['custom', 'Tự tạo']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }} className={`tag ${status === v ? '!bg-ink !text-paper' : ''}`}>{l}</button>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setPage(1); }} className="ml-auto flex items-center gap-2 rounded-full border border-line bg-surface px-3">
          <Search className="h-4 w-4 text-ink-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value.slice(0, 80))} placeholder="Tìm thẻ…" className="h-9 bg-transparent text-sm outline-none" aria-label="Tìm thẻ" />
        </form>
      </div>
      {data && data.items.length === 0 && <Empty title="Chưa có thẻ nào ở đây">Tạo thẻ của riêng bạn hoặc nhập bộ công thức có sẵn.</Empty>}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.items.map((c) => (
          <div key={c.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <MathText text={c.front} className="block font-bold" />
              <MathText text={c.back} className="mt-1 block text-sm text-ink-2" />
              <p className="mt-2 text-xs text-ink-3">
                {c.status === 'new' ? 'Chưa học' : c.status === 'due' ? 'Đến hạn ôn' : `Ôn lại ${relative(c.dueAt)}`}
                {c.retention !== null ? ` · nhớ ~${Math.round(c.retention * 100)}%` : ''}
                {c.topicName ? ` · ${c.topicName}` : ''}
              </p>
            </div>
            <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(c)} className="rounded-full p-2 hover:bg-paper-2" aria-label="Sửa thẻ"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c)} className="rounded-full p-2 hover:bg-paper-2" aria-label="Xóa thẻ"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-ghost !h-10 disabled:opacity-40">Trước</button>
          <span className="px-3 font-bold tabular-nums">{page}/{pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn-ghost !h-10 disabled:opacity-40">Sau</button>
        </div>
      )}
      {editing && <CardEditor card={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); onChanged(); }} />}
    </section>
  );
}

export function GoldenTimePage() {
  useDocumentTitle('Thời điểm vàng');
  const { data, error, reload } = useLoad(() => api.get<Stats>('/flashcards/stats'));
  const [reviewing, setReviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [version, setVersion] = useState(0);
  const { start, busy } = useStartSession();
  const maxForecast = data ? Math.max(1, ...data.forecast.map((f) => f.count)) : 1;

  const importDeck = async (deck: string) => {
    setImporting(true);
    try {
      const r = await api.post<{ added: number; total: number }>('/flashcards/import', { deck });
      toast.success(r.added ? `Đã thêm ${r.added} thẻ công thức` : 'Bạn đã có đủ bộ thẻ này');
      reload();
      setVersion((x) => x + 1);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  if (reviewing)
    return (
      <Shell>
        <Review onDone={() => { setReviewing(false); reload(); setVersion((x) => x + 1); }} />
      </Shell>
    );

  return (
    <Shell>
      <PageHeader
        eyebrow="Thời điểm vàng · AI Memory Twin"
        title={<>Ôn <em>đúng lúc</em>, nhớ <em>đúng lâu</em></>}
        subtitle="QuizMe theo dõi đường cong lãng quên của từng thẻ và từng chuyên đề, rồi nhắc bạn ôn ngay trước khi kiến thức rơi rụng."
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <Card tone="butter" className="!p-6 sm:!p-8">
              <Brain className="h-7 w-7" />
              <p className="display mt-3 text-5xl">{data.dueNow} thẻ</p>
              <p className="font-semibold text-ink-2">đang ở thời điểm vàng{data.reviewsToday ? ` · đã ôn ${data.reviewsToday} lượt hôm nay` : ''}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => setReviewing(true)} disabled={!data.dueNow} className="btn-ink disabled:opacity-50">Bắt đầu ôn</button>
                {data.decks.map((d) => (
                  <button key={d.id} onClick={() => importDeck(d.id)} disabled={importing} className="btn-ghost">
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Nhập “{d.name}”
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <p className="eyebrow">Dự báo 7 ngày tới</p>
              <div className="mt-4 flex h-36 items-end gap-2">
                {data.forecast.map((f, i) => (
                  <div key={f.dayKey} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-bold tabular-nums">{f.count}</span>
                    <div className={`w-full rounded-t-lg ${i === 0 ? 'bg-brand' : 'bg-lavender'}`} style={{ height: `${Math.max(4, (f.count / maxForecast) * 100)}px` }} />
                    <span className="text-[11px] font-semibold text-ink-3">{i === 0 ? 'Nay' : new Date(`${f.dayKey}T00:00:00`).toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Tổng số thẻ" value={data.total} />
            <Stat label="Chưa học" value={data.newCards} tone="sky" />
            <Stat label="Đang nhớ" value={data.learning} tone="lavender" />
            <Stat label="Thuộc lòng" value={data.mastered} hint={data.averageRetention !== null ? `Trí nhớ TB ~${data.averageRetention}%` : undefined} tone="lime" />
          </div>

          {data.fadingTopics.length > 0 && (
            <section className="mt-10">
              <SectionTitle>Chuyên đề đang phai nhạt</SectionTitle>
              <div className="grid gap-3 md:grid-cols-2">
                {data.fadingTopics.map((t) => (
                  <Card key={t.topic} className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold">{t.name}</p>
                      <p className="text-sm text-ink-3">Lần cuối luyện {date(t.lastPracticedAt)} · còn nhớ ~{Math.round(t.retention * 100)}%</p>
                      <Bar value={t.retention * 100} tone={t.retention < 0.5 ? 'pink' : 'butter'} className="mt-2" />
                    </div>
                    <button onClick={() => start({ kind: 'adaptive', topic: t.topic, count: 8 }, t.topic)} disabled={busy !== null} className="btn-ink !h-10 !text-sm">
                      {busy === t.topic ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ôn ngay'}
                    </button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <Manage onChanged={reload} version={version} />
          <p className="mt-10 text-center text-sm text-ink-3">Muốn luyện bằng câu hỏi thay vì thẻ? <Link to="/practice" className="font-bold underline">Vào Luyện thi</Link></p>
        </>
      )}
    </Shell>
  );
}

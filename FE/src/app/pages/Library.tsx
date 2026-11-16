import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Flag, Loader2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import type { Facet, Question } from '../../lib/types';
import { Shell } from '../Shell';
import { QuestionBody } from '../QuestionView';
import { Card, Empty, ErrorBox, Loading, PageHeader } from '../ui';

const REASONS = [
  { id: 'wrong_answer', label: 'Đáp án sai' },
  { id: 'wrong_question', label: 'Đề bài sai / thiếu dữ kiện' },
  { id: 'image_error', label: 'Ảnh lỗi, khó đọc' },
  { id: 'typo', label: 'Lỗi chính tả' },
  { id: 'other', label: 'Khác' },
];

/** "Báo lỗi câu hỏi" button with a small form. */
export function ReportButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('wrong_answer');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const r = await api.post<{ message: string }>(`/library/questions/${questionId}/report`, { reason, detail });
      toast.success(r.message);
      setOpen(false);
      setDetail('');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-ink-3 hover:bg-paper-2 hover:text-ink">
        <Flag className="h-4 w-4" /> Báo lỗi câu hỏi
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true" aria-label="Báo lỗi câu hỏi">
          <div className="paper-card w-full max-w-md p-6">
            <p className="display text-3xl">Báo lỗi câu hỏi</p>
            <div className="mt-4 grid gap-2">
              {REASONS.map((r) => (
                <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2.5 font-semibold ${reason === r.id ? 'border-ink bg-paper' : 'border-line'}`}>
                  <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="accent-[var(--ink)]" />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value.slice(0, 1000))} rows={3} placeholder="Mô tả thêm (không bắt buộc)" className="mt-3 w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-ink" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="btn-ghost !h-11">Hủy</button>
              <button onClick={send} disabled={busy} className="btn-ink !h-11">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gửi'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface LibraryResponse {
  items: Question[];
  total: number;
  page: number;
  facets: { topics: Facet[]; levels: Facet[]; types: Facet[]; total: number };
}

export function LibraryPage() {
  useDocumentTitle('Kho câu hỏi');
  const [params, setParams] = useSearchParams();
  const topic = params.get('topic') || '';
  const level = params.get('level') || '';
  const type = params.get('type') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { data, error, loading, reload } = useLoad(() => api.get<LibraryResponse>('/library/questions', { topic, level, type, page, limit: 12 }), [topic, level, type, page]);

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next);
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / 12)) : 1;

  const Select = ({ k, value, options, all }: { k: string; value: string; options: Facet[]; all: string }) => (
    <select value={value} onChange={(e) => set(k, e.target.value)} className="h-11 rounded-full border border-line bg-surface px-4 font-semibold outline-none focus:border-ink" aria-label={all}>
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.name} ({o.count})
        </option>
      ))}
    </select>
  );

  return (
    <Shell>
      <PageHeader eyebrow="Kho đề & thư viện" title={<>Ngân hàng <em>câu hỏi</em></>} subtitle="Chuẩn hóa theo 4 mức độ nhận thức của Bộ GD&ĐT. Làm câu hỏi trong bài luyện để mở khóa lời giải chi tiết." />
      {data && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Select k="topic" value={topic} options={data.facets.topics} all="Mọi chuyên đề" />
          <Select k="level" value={level} options={data.facets.levels} all="Mọi mức độ" />
          <Select k="type" value={type} options={data.facets.types} all="Mọi dạng câu" />
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && data.items.length === 0 && <Empty title="Không có câu hỏi phù hợp">Thử bỏ bớt bộ lọc.</Empty>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.items.map((q) => (
          <Card key={q.id}>
            <QuestionBody question={q} />
            <div className="mt-3 flex justify-between gap-2">
              <span className="self-center text-xs font-semibold text-ink-3">Mã {q.code} · {q.difficulty}</span>
              <ReportButton questionId={q.id} />
            </div>
          </Card>
        ))}
      </div>
      {data && pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => set('page', String(page - 1))} className="btn-ghost !h-10 disabled:opacity-40">Trước</button>
          <span className="px-3 font-bold tabular-nums">{page}/{pages}</span>
          <button disabled={page >= pages} onClick={() => set('page', String(page + 1))} className="btn-ghost !h-10 disabled:opacity-40">Sau</button>
        </div>
      )}
    </Shell>
  );
}

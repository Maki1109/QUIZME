import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2, Pencil, Plus, Search, X } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { date, num, tierLabel, vnd } from '../../lib/format';
import type { Question, Solution } from '../../lib/types';
import { Shell } from '../Shell';
import { QuestionBody } from '../QuestionView';
import { Card, Empty, ErrorBox, Loading, PageHeader, Pill, Stat } from '../ui';

type Tab = 'overview' | 'users' | 'questions' | 'exams' | 'reports' | 'feedback' | 'orders';
const TABS: [Tab, string][] = [['overview', 'Tổng quan'], ['users', 'Người dùng'], ['questions', 'Câu hỏi'], ['exams', 'Đề thi'], ['reports', 'Báo lỗi'], ['feedback', 'Góp ý'], ['orders', 'Doanh thu']];
const input = 'h-11 rounded-2xl border border-line bg-surface px-4 font-semibold outline-none focus:border-ink';

async function act(fn: () => Promise<unknown>, ok: string, after?: () => void) {
  try {
    await fn();
    toast.success(ok);
    after?.();
  } catch (err) {
    toast.error(errorMessage(err));
  }
}

/* ------------------------------------------------------------- overview */

interface Overview {
  users: { total: number; new7d: number; activeToday: number; paying: number };
  content: { questions: number; sessions7d: number; openReports: number; openFeedback: number };
  revenue: { month: number; monthOrders: number; total: number; totalOrders: number; byDay: { dayKey: string; amount: number }[]; byPlan: { planId: string; name: string; amount: number; orders: number }[] };
}

function OverviewTab() {
  const { data, error } = useLoad(() => api.get<Overview>('/admin/overview'));
  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Người dùng" value={num(data.users.total)} hint={`+${data.users.new7d} trong 7 ngày`} tone="sky" />
        <Stat label="Học hôm nay" value={num(data.users.activeToday)} tone="lime" />
        <Stat label="Đang trả phí" value={num(data.users.paying)} tone="lavender" />
        <Stat label="Bài làm 7 ngày" value={num(data.content.sessions7d)} tone="butter" />
        <Stat label="Câu hỏi" value={num(data.content.questions)} />
        <Stat label="Báo lỗi mở" value={data.content.openReports} tone={data.content.openReports ? 'pink' : undefined} />
        <Stat label="Doanh thu tháng" value={vnd(data.revenue.month)} hint={`${data.revenue.monthOrders} đơn`} tone="peach" />
        <Stat label="Tổng doanh thu" value={vnd(data.revenue.total)} hint={`${data.revenue.totalOrders} đơn`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <p className="eyebrow">Doanh thu 30 ngày</p>
          {data.revenue.byDay.length === 0 ? <p className="py-10 text-center text-ink-3">Chưa có giao dịch.</p> : (
            <div className="mt-2 h-[240px]">
              <ResponsiveContainer>
                <BarChart data={data.revenue.byDay.map((d) => ({ ...d, label: d.dayKey.slice(8) + '/' + d.dayKey.slice(5, 7) }))}>
                  <CartesianGrid vertical={false} stroke="#E9DAB9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => vnd(v)} />
                  <RBar dataKey="amount" name="Doanh thu" fill="#F6700F" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card>
          <p className="eyebrow">Theo gói</p>
          <ul className="mt-3 space-y-2">
            {data.revenue.byPlan.map((p) => <li key={p.planId} className="flex justify-between font-semibold"><span>{p.name} · {p.orders} đơn</span><span className="tabular-nums">{vnd(p.amount)}</span></li>)}
            {data.revenue.byPlan.length === 0 && <p className="text-sm text-ink-3">Chưa có dữ liệu.</p>}
          </ul>
        </Card>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- users */

interface AdminUser { id: string; fullName: string; name: string; email: string; role: string; status: string; level: number; xp: number; coins: number; plan: { tier: string; expiresAt: string | null }; google: boolean; lastStudyDay: string | null; createdAt: string }

function UsersTab() {
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, reload } = useLoad(() => api.get<{ items: AdminUser[]; total: number }>('/admin/users', { q: query, page, limit: 20 }), [query, page]);
  const patch = (u: AdminUser, body: object, ok: string) => act(() => api.patch(`/admin/users/${u.id}`, body), ok, reload);

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setPage(1); }} className="mb-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo email hoặc tên" className={`${input} flex-1`} aria-label="Tìm người dùng" />
        <button className="btn-ink !h-11"><Search className="h-4 w-4" /></button>
      </form>
      {error && <ErrorBox message={error} />}
      <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-surface">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-3"><tr>{['Người dùng', 'Vai trò', 'Gói', 'Cấp / XP', 'Học gần nhất', 'Thao tác'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((u) => (
              <tr key={u.id} className={u.status === 'banned' ? 'opacity-60' : ''}>
                <td className="px-4 py-3"><p className="font-bold">{u.name || u.fullName}{u.google ? ' · G' : ''}</p><p className="text-xs text-ink-3">{u.email}</p></td>
                <td className="px-4 py-3">
                  <select value={u.role} disabled={u.id === me?.id} onChange={(e) => window.confirm(`Đổi vai trò thành ${e.target.value}?`) && patch(u, { role: e.target.value }, 'Đã đổi vai trò')} className="rounded-full border border-line bg-surface px-2 py-1 font-semibold">
                    <option value="student">Học sinh</option><option value="teacher">Giáo viên</option><option value="admin">Quản trị</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Pill tone={u.plan.tier === 'free' ? 'paper-2' : 'lavender'}>{tierLabel(u.plan.tier)}</Pill>
                  {u.plan.expiresAt && <p className="text-xs text-ink-3">đến {date(u.plan.expiresAt)}</p>}
                  <select defaultValue="" onChange={(e) => { const [tier, days] = e.target.value.split(':'); e.target.value = ''; if (tier) patch(u, { plan: { tier, days: Number(days) || 30 } }, 'Đã cập nhật gói'); }} className="mt-1 block rounded-full border border-line bg-surface px-2 py-0.5 text-xs">
                    <option value="">Cấp gói…</option><option value="premium:30">Premium 30 ngày</option><option value="elite:30">Elite 30 ngày</option><option value="free:0">Về gói Cơ bản</option>
                  </select>
                </td>
                <td className="px-4 py-3 tabular-nums">Lv {u.level} · {num(u.xp)}</td>
                <td className="px-4 py-3">{u.lastStudyDay || '—'}</td>
                <td className="px-4 py-3">
                  {u.id !== me?.id && (
                    <button onClick={() => window.confirm(u.status === 'banned' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản này? Người dùng sẽ bị đăng xuất ngay.') && patch(u, { status: u.status === 'banned' ? 'active' : 'banned' }, u.status === 'banned' ? 'Đã mở khóa' : 'Đã khóa tài khoản')} className={`rounded-full px-3 py-1 font-bold ${u.status === 'banned' ? 'bg-lime' : 'bg-pink'}`}>
                      {u.status === 'banned' ? 'Mở khóa' : 'Khóa'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager page={page} total={data.total} per={20} onPage={setPage} />}
    </>
  );
}

function Pager({ page, total, per, onPage }: { page: number; total: number; per: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / per));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-ghost !h-10 disabled:opacity-40">Trước</button>
      <span className="px-3 font-bold tabular-nums">{page}/{pages} · {num(total)}</span>
      <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="btn-ghost !h-10 disabled:opacity-40">Sau</button>
    </div>
  );
}

/* ------------------------------------------------------------ questions */

type AdminQuestion = Question & Solution & { isActive: boolean; irtB: number; rawAnswer: string };
const TOPICS = ['HS', 'ML', 'NHTP', 'HHKG', 'Oxyz', 'THXS', 'TK', 'LG', 'CSCCSN'];

function QuestionEditor({ q, onClose, onSaved }: { q: AdminQuestion | null; onClose: () => void; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const body = {
      question_id: f.question_id,
      question_type: f.question_type,
      topic: f.topic,
      difficulty_level: f.difficulty_level,
      irt_difficulty_b: Number(f.irt_difficulty_b),
      correct_answer: f.correct_answer,
      image_url: f.image_url || null,
      content: f.content || null,
      explanation: f.explanation || null,
      solution_video_url: f.solution_video_url || null,
      isActive: f.isActive === 'on',
    };
    setBusy(true);
    try {
      if (q) await api.put(`/admin/questions/${q.id}`, body);
      else await api.post('/admin/questions', body);
      toast.success('Đã lưu câu hỏi');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };
  const L = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1 block text-sm font-bold">{label}</span>{children}</label>;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <form onSubmit={save} className="paper-card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex justify-between"><p className="display text-3xl">{q ? 'Sửa câu hỏi' : 'Câu hỏi mới'}</p><button type="button" onClick={onClose} aria-label="Đóng"><X className="h-5 w-5" /></button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <L label="Mã câu hỏi"><input name="question_id" required defaultValue={q?.code} className={`${input} w-full`} /></L>
          <L label="Dạng"><select name="question_type" defaultValue={q?.type || 'MCQ'} className={`${input} w-full`}><option value="MCQ">Trắc nghiệm</option><option value="TrueFalse">Đúng/Sai</option><option value="ShortAnswer">Trả lời ngắn</option></select></L>
          <L label="Chuyên đề (mã)"><input name="topic" list="topics" required defaultValue={q?.topic} className={`${input} w-full`} /><datalist id="topics">{TOPICS.map((t) => <option key={t} value={t} />)}</datalist></L>
          <L label="Mức độ"><select name="difficulty_level" defaultValue={q?.level || 'T_H'} className={`${input} w-full`}><option value="N_B">Nhận biết</option><option value="T_H">Thông hiểu</option><option value="V_D">Vận dụng</option><option value="V_D_C">Vận dụng cao</option></select></L>
          <L label="Độ khó IRT b (−4…4)"><input name="irt_difficulty_b" type="number" step="0.1" min={-4} max={4} required defaultValue={q?.irtB ?? 0} className={`${input} w-full`} /></L>
          <L label="Đáp án (A–D · 'D S D S' · số)"><input name="correct_answer" required defaultValue={q?.rawAnswer} className={`${input} w-full`} /></L>
        </div>
        <div className="mt-3 space-y-3">
          <L label="Ảnh đề bài (https)"><input name="image_url" type="url" defaultValue={q?.imageUrl || ''} className={`${input} w-full`} /></L>
          <L label="Nội dung văn bản (tùy chọn, hỗ trợ $LaTeX$)"><textarea name="content" rows={3} defaultValue={q?.content || ''} className="w-full rounded-2xl border border-line bg-surface p-3" /></L>
          <L label="Lời giải"><textarea name="explanation" rows={4} defaultValue={q?.explanation || ''} className="w-full rounded-2xl border border-line bg-surface p-3" /></L>
          <L label="Video lời giải (https, dùng cho mã QR)"><input name="solution_video_url" type="url" defaultValue={q?.solutionVideoUrl || ''} className={`${input} w-full`} /></L>
          <label className="flex items-center gap-2 font-semibold"><input name="isActive" type="checkbox" defaultChecked={q ? q.isActive : true} className="h-4 w-4 accent-[var(--ink)]" /> Đang sử dụng</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="btn-ghost !h-11">Hủy</button><button disabled={busy} className="btn-ink !h-11">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}</button></div>
      </form>
    </div>
  );
}

function QuestionsTab() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, reload } = useLoad(() => api.get<{ items: AdminQuestion[]; total: number }>('/admin/questions', { q: query, page, limit: 20 }), [query, page]);
  const [editing, setEditing] = useState<AdminQuestion | null | 'new'>(null);
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setPage(1); }} className="flex flex-1 gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã câu hỏi" className={`${input} flex-1`} aria-label="Tìm câu hỏi" />
          <button className="btn-ghost !h-11"><Search className="h-4 w-4" /></button>
        </form>
        <button onClick={() => setEditing('new')} className="btn-ink !h-11"><Plus className="h-4 w-4" /> Thêm câu hỏi</button>
      </div>
      {error && <ErrorBox message={error} />}
      <div className="grid gap-3 md:grid-cols-2">
        {data?.items.map((x) => (
          <Card key={x.id} className={x.isActive ? '' : 'opacity-60'}>
            <QuestionBody question={x} />
            <p className="mt-3 text-sm"><b>{x.code}</b> · đáp án <b>{x.rawAnswer}</b> · b = {x.irtB}{!x.isActive && ' · đã ẩn'}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing(x)} className="btn-ghost !h-9 !text-sm"><Pencil className="h-4 w-4" /> Sửa</button>
              {x.isActive && <button onClick={() => window.confirm('Ẩn câu hỏi này khỏi mọi đề mới?') && act(() => api.del(`/admin/questions/${x.id}`), 'Đã ẩn câu hỏi', reload)} className="btn-ghost !h-9 !text-sm">Ẩn</button>}
            </div>
          </Card>
        ))}
      </div>
      {data && <Pager page={page} total={data.total} per={20} onPage={setPage} />}
      {editing && <QuestionEditor q={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

/* ---------------------------------------------------------------- exams */

function ExamsTab() {
  const { data, reload } = useLoad(() => api.get<{ items: { id: string; title: string; code: string; duration: number; questionIds: string[]; isPublished: boolean; isPinned: boolean; attempts: number }[] }>('/admin/exams'));
  const [busy, setBusy] = useState(false);
  const create = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const questionIds = f.questionIds.split(/[\s,]+/).filter(Boolean);
    setBusy(true);
    await act(() => api.post('/admin/exams', { title: f.title, code: f.code, duration: Number(f.duration), description: f.description || null, questionIds, isPublished: f.isPublished === 'on' }), 'Đã tạo đề thi', () => { form.reset(); reload(); });
    setBusy(false);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <p className="display mb-3 text-2xl">Tạo đề thư viện</p>
        <form onSubmit={create} className="space-y-3">
          <input name="title" required placeholder="Tên đề" className={`${input} w-full`} />
          <div className="flex gap-2"><input name="code" required placeholder="Mã đề, ví dụ TOAN12-002" className={`${input} flex-1`} /><input name="duration" type="number" min={1} max={300} defaultValue={90} className={`${input} w-28`} aria-label="Thời gian (phút)" /></div>
          <textarea name="description" rows={2} placeholder="Mô tả" className="w-full rounded-2xl border border-line bg-surface p-3" />
          <textarea name="questionIds" required rows={4} placeholder="ID câu hỏi (24 ký tự), cách nhau bằng dấu phẩy hoặc xuống dòng" className="w-full rounded-2xl border border-line bg-surface p-3 font-mono text-xs" />
          <label className="flex items-center gap-2 font-semibold"><input name="isPublished" type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--ink)]" /> Công khai</label>
          <button disabled={busy} className="btn-ink !h-11">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tạo đề'}</button>
        </form>
      </Card>
      <div className="space-y-3">
        {data?.items.map((e) => (
          <Card key={e.id}>
            <p className="font-extrabold">{e.title} <span className="text-sm font-semibold text-ink-3">· {e.code}</span></p>
            <p className="text-sm text-ink-2">{e.questionIds.length} câu · {e.duration} phút · {e.attempts} lượt</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => act(() => api.put(`/admin/exams/${e.id}`, { isPublished: !e.isPublished }), e.isPublished ? 'Đã ẩn đề' : 'Đã công khai đề', reload)} className="btn-ghost !h-9 !text-sm">{e.isPublished ? 'Ẩn' : 'Công khai'}</button>
              <button onClick={() => act(() => api.put(`/admin/exams/${e.id}`, { isPinned: !e.isPinned }), 'Đã cập nhật', reload)} className="btn-ghost !h-9 !text-sm">{e.isPinned ? 'Bỏ ghim' : 'Ghim'}</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ reports/feedback */

function ReportsTab() {
  const [status, setStatus] = useState('open');
  const { data, reload } = useLoad(() => api.get<{ items: { id: string; reason: string; detail: string; status: string; createdAt: string; reporter: { name: string; email: string } | null; question: AdminQuestion | null }[] }>('/admin/reports', { status }), [status]);
  const LABEL: Record<string, string> = { wrong_answer: 'Đáp án sai', wrong_question: 'Đề sai', image_error: 'Ảnh lỗi', typo: 'Chính tả', other: 'Khác' };
  const handle = (id: string, s: string) => {
    const note = window.prompt('Ghi chú gửi người báo lỗi (không bắt buộc):') ?? '';
    act(() => api.patch(`/admin/reports/${id}`, { status: s, adminNote: note }), 'Đã xử lý', reload);
  };
  return (
    <>
      <div className="mb-4 flex gap-2">{['open', 'resolved', 'rejected'].map((s) => <button key={s} onClick={() => setStatus(s)} className={`tag ${status === s ? '!bg-ink !text-paper' : ''}`}>{s === 'open' ? 'Đang mở' : s === 'resolved' ? 'Đã sửa' : 'Từ chối'}</button>)}</div>
      {data?.items.length === 0 && <Empty title="Không có báo lỗi nào" />}
      <div className="space-y-4">
        {data?.items.map((r) => (
          <Card key={r.id}>
            <div className="mb-3 flex flex-wrap items-center gap-2"><Pill tone="pink">{LABEL[r.reason]}</Pill><span className="text-sm text-ink-2">{r.reporter?.name} · {r.reporter?.email} · {date(r.createdAt, true)}</span></div>
            {r.detail && <p className="mb-3 rounded-xl bg-paper p-3 text-sm">“{r.detail}”</p>}
            {r.question && <><QuestionBody question={r.question} /><p className="mt-2 text-sm">Mã <b>{r.question.code}</b> · đáp án hiện tại <b>{r.question.rawAnswer}</b></p></>}
            {r.status === 'open' && <div className="mt-3 flex gap-2"><button onClick={() => handle(r.id, 'resolved')} className="btn-lime !h-9 !text-sm">Đã sửa</button><button onClick={() => handle(r.id, 'rejected')} className="btn-ghost !h-9 !text-sm">Câu hỏi đúng</button></div>}
          </Card>
        ))}
      </div>
    </>
  );
}

function FeedbackTab() {
  const [status, setStatus] = useState('open');
  const { data, reload } = useLoad(() => api.get<{ items: { id: string; category: string; message: string; status: string; adminNote: string; createdAt: string; user: { name: string; email: string } | null }[] }>('/admin/feedback', { status }), [status]);
  return (
    <>
      <div className="mb-4 flex gap-2">{['open', 'resolved'].map((s) => <button key={s} onClick={() => setStatus(s)} className={`tag ${status === s ? '!bg-ink !text-paper' : ''}`}>{s === 'open' ? 'Chưa xử lý' : 'Đã phản hồi'}</button>)}</div>
      {data?.items.length === 0 && <Empty title="Không có góp ý nào" />}
      <div className="space-y-3">
        {data?.items.map((f) => (
          <Card key={f.id}>
            <div className="flex flex-wrap items-center gap-2"><Pill tone="sky">{f.category}</Pill><span className="text-sm text-ink-2">{f.user?.name} · {f.user?.email} · {date(f.createdAt, true)}</span></div>
            <p className="mt-2 whitespace-pre-wrap">{f.message}</p>
            {f.adminNote && <p className="mt-2 text-sm font-semibold">Đã trả lời: {f.adminNote}</p>}
            {f.status === 'open' && <button onClick={() => { const note = window.prompt('Phản hồi cho người dùng:'); if (note !== null) act(() => api.patch(`/admin/feedback/${f.id}`, { adminNote: note }), 'Đã phản hồi', reload); }} className="btn-ink mt-3 !h-9 !text-sm">Phản hồi & đóng</button>}
          </Card>
        ))}
      </div>
    </>
  );
}

function OrdersTab() {
  const [page, setPage] = useState(1);
  const { data } = useLoad(() => api.get<{ items: { id: string; planName: string; amount: number; status: string; createdAt: string; txnRef: string; user: { email: string } | null }[]; total: number }>('/admin/orders', { page }), [page]);
  return (
    <>
      <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper text-left text-xs uppercase text-ink-3"><tr>{['Thời gian', 'Người dùng', 'Gói', 'Số tiền', 'Trạng thái', 'Mã GD'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {data?.items.map((o) => (
              <tr key={o.id}><td className="px-4 py-2.5">{date(o.createdAt, true)}</td><td className="px-4 py-2.5">{o.user?.email}</td><td className="px-4 py-2.5">{o.planName}</td><td className="px-4 py-2.5 tabular-nums">{vnd(o.amount)}</td><td className="px-4 py-2.5"><Pill tone={o.status === 'paid' ? 'lime' : o.status === 'failed' ? 'pink' : 'paper-2'}>{o.status}</Pill></td><td className="px-4 py-2.5 font-mono text-xs">{o.txnRef}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pager page={page} total={data.total} per={30} onPage={setPage} />}
    </>
  );
}

export function AdminPage() {
  useDocumentTitle('Quản trị');
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  // The API enforces admin-only access; this only hides the screen from everyone else.
  if (user && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return (
    <Shell wide>
      <PageHeader eyebrow="Quản trị hệ thống" title={<>Bảng điều <em>khiển</em></>} />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-paper-2 p-1 font-bold [scrollbar-width:none]">
        {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${tab === id ? 'bg-ink text-paper' : ''}`}>{label}</button>)}
      </div>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'questions' && <QuestionsTab />}
      {tab === 'exams' && <ExamsTab />}
      {tab === 'reports' && <ReportsTab />}
      {tab === 'feedback' && <FeedbackTab />}
      {tab === 'orders' && <OrdersTab />}
    </Shell>
  );
}

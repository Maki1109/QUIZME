/**
 * "Luyện thi" hub: exam room (Sprint / Marathon / weekly ranking), exam factory,
 * 5-minute challenge, adaptive practice, library exams, unfinished and past sessions.
 */

import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, Factory, Gauge, Library, Loader2, Medal, Timer, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { clock, date, duration, KIND_LABEL } from '../../lib/format';
import type { Facet, HistoryRow } from '../../lib/types';
import { Shell, Avatar } from '../Shell';
import { Card, Empty, ErrorBox, Loading, PageHeader, Pill, scoreTone, SectionTitle } from '../ui';
import { useStartSession } from './Session';

interface Cell {
  topic: string;
  level: string;
  type: string;
  band: string;
  count: number;
}

interface Modes {
  modes: { id: 'sprint' | 'marathon' | 'ranking'; title: string; description: string; questionCount: number; timeLimit: number; structure: Record<string, number> }[];
  ranking: { weekKey: string; used: boolean; status: string | null; score: number | null };
  daily: { completed: boolean; score: number | null };
  facets: { topics: Facet[]; levels: Facet[]; types: Facet[]; total: number; matrix: Cell[] };
  factory: { difficulties: { id: string; name: string; bands: string[] }[]; minCount: number; maxCount: number; minMinutes: number; maxMinutes: number };
}

const MODE_STYLE = { sprint: { tone: 'sky', icon: Zap }, marathon: { tone: 'peach', icon: Timer }, ranking: { tone: 'lavender', icon: Medal } } as const;

type ListKey = 'topics' | 'levels' | 'types';
interface Filters {
  topics: string[];
  levels: string[];
  types: string[];
  difficulty: string;
}
const NO_FILTERS: Filters = { topics: [], levels: [], types: [], difficulty: 'mixed' };

/** Suggested time: about 1.8 minutes per question, rounded to 5 minutes. */
const suggestMinutes = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round((n * 1.8) / 5) * 5));

function Factory_({ data }: { data: Modes }) {
  const { start, busy } = useStartSession();
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [count, setCount] = useState(15);
  const [minutes, setMinutes] = useState(25);
  const [minutesTouched, setMinutesTouched] = useState(false);
  const bandsOf = (id: string) => data.factory.difficulties.find((d) => d.id === id)?.bands || [];

  /** How many questions in the bank match a set of filters. */
  const countFor = (filters: Filters) => {
    const bands = bandsOf(filters.difficulty);
    return data.facets.matrix.reduce(
      (sum, c) =>
        (!filters.topics.length || filters.topics.includes(c.topic)) &&
        (!filters.levels.length || filters.levels.includes(c.level)) &&
        (!filters.types.length || filters.types.includes(c.type)) &&
        bands.includes(c.band)
          ? sum + c.count
          : sum,
      0
    );
  };
  const available = countFor(f);
  const effectiveCount = Math.min(count, available);
  const max = Math.max(1, Math.min(data.factory.maxCount, available));

  // Keep the time in step with the number of questions until the user sets it explicitly.
  useEffect(() => {
    if (!minutesTouched) setMinutes(suggestMinutes(effectiveCount || 1, data.factory.minMinutes, data.factory.maxMinutes));
  }, [effectiveCount, minutesTouched, data.factory.minMinutes, data.factory.maxMinutes]);

  const toggled = (list: string[], value: string) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const chipClass = (active: boolean, empty: boolean) =>
    `rounded-full border-2 px-3 py-1.5 text-sm font-bold transition-colors ${
      active ? 'border-ink bg-ink text-paper' : empty ? 'cursor-not-allowed border-dashed border-line bg-paper text-ink-3' : 'border-line bg-surface hover:border-ink'
    }`;

  /** A filter chip showing how many questions this option has under the other active filters. */
  const renderChip = (k: ListKey, value: string, label: string) => {
    const active = f[k].includes(value);
    const n = countFor({ ...f, [k]: [value] });
    const empty = !active && n === 0; // this option has no question for the current filters
    return (
      <button
        type="button"
        key={value}
        onClick={() => setF((cur) => ({ ...cur, [k]: toggled(cur[k], value) }))}
        disabled={empty}
        className={chipClass(active, empty)}
        aria-pressed={active}
        title={empty ? 'Không có câu hỏi phù hợp với các lựa chọn hiện tại' : undefined}
      >
        {label}
        {!active && <span className="ml-1.5 font-semibold tabular-nums opacity-60">{n}</span>}
      </button>
    );
  };

  const filtered = f.topics.length > 0 || f.levels.length > 0 || f.types.length > 0 || f.difficulty !== 'mixed';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!available) return;
    start({ kind: 'custom', ...f, count: effectiveCount, minutes, title: 'Đề tự chọn' }, 'custom');
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-bold">Chuyên đề <span className="font-normal text-ink-3">(bỏ trống = tất cả)</span></p>
        <div className="flex flex-wrap gap-2">{data.facets.topics.map((t) => renderChip('topics', t.code, t.name))}</div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-bold">Độ khó</p>
          <div className="flex flex-wrap gap-2">
            {data.factory.difficulties.map((d) => {
              const active = f.difficulty === d.id;
              const n = countFor({ ...f, difficulty: d.id });
              const empty = !active && n === 0;
              return (
                <button type="button" key={d.id} onClick={() => setF((cur) => ({ ...cur, difficulty: d.id }))} disabled={empty} className={chipClass(active, empty)} aria-pressed={active}>
                  {d.name}
                  {!active && <span className="ml-1.5 font-semibold tabular-nums opacity-60">{n}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">Dạng câu hỏi</p>
          <div className="flex flex-wrap gap-2">{data.facets.types.map((t) => renderChip('types', t.code, t.name))}</div>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold">Mức độ nhận thức</p>
        <div className="flex flex-wrap gap-2">{data.facets.levels.map((l) => renderChip('levels', l.code, l.name))}</div>
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${available ? 'bg-lime/50' : 'bg-pink/40'}`} role="status" aria-live="polite">
        {available ? `Có ${available} câu phù hợp trong ngân hàng.` : 'Không có câu nào khớp với tổ hợp này.'}
        {filtered && (
          <button type="button" onClick={() => setF(NO_FILTERS)} className="ml-auto underline">
            Bỏ chọn tất cả
          </button>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 flex justify-between text-sm font-bold">
            Số câu <span className="tabular-nums">{effectiveCount}{available > 0 && count >= available ? ' (tối đa)' : ''}</span>
          </span>
          <input type="range" min={1} max={max} value={Math.max(1, effectiveCount)} disabled={!available} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-[var(--ink)] disabled:opacity-40" aria-label="Số câu" />
        </label>
        <label className="block">
          <span className="mb-2 flex justify-between text-sm font-bold">Thời gian <span className="tabular-nums">{minutes} phút</span></span>
          <input
            type="range"
            min={data.factory.minMinutes}
            max={data.factory.maxMinutes}
            step={5}
            value={minutes}
            onChange={(e) => {
              setMinutesTouched(true);
              setMinutes(Number(e.target.value));
            }}
            className="w-full accent-[var(--ink)]"
            aria-label="Thời gian làm bài"
          />
        </label>
      </div>
      <button type="submit" disabled={busy !== null || !available} className="btn-ink disabled:opacity-40">
        {busy === 'custom' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Factory className="h-4 w-4" />} Tạo đề{effectiveCount ? ` ${effectiveCount} câu` : ''} và bắt đầu
      </button>
    </form>
  );
}

function HistoryList({ status }: { status: 'submitted' | 'in_progress' }) {
  const { data } = useLoad(() => api.get<{ items: HistoryRow[]; total: number }>('/practice/sessions', { status, limit: status === 'submitted' ? 10 : 5 }), [status]);
  if (!data) return null;
  if (!data.items.length) return status === 'submitted' ? <Empty title="Chưa có bài làm nào">Bài làm của bạn sẽ hiện ở đây.</Empty> : <p className="text-ink-3">Không có bài nào đang làm dở.</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-surface">
      {data.items.map((h) => {
        const pct = Math.round(h.score);
        return (
          <li key={h.id}>
            <Link to={`/session/${h.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-paper">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{h.title}</p>
                <p className="text-sm text-ink-3">
                  {KIND_LABEL[h.kind]} · {status === 'submitted' ? date(h.submittedAt, true) : `bắt đầu ${date(h.startedAt, true)}`}
                  {status === 'submitted' && h.totalTimeSpent ? ` · ${duration(h.totalTimeSpent)}` : ''}
                </p>
              </div>
              {status === 'submitted' ? (
                <Pill tone={scoreTone(pct)} className="!text-sm">{typeof h.score10 === 'number' ? `${h.score10.toFixed(1).replace('.', ',')}đ` : `${pct}%`}</Pill>
              ) : (
                <span className="btn-lime !h-9 !px-4 !text-sm">Làm tiếp</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

interface ExamRow {
  id: string;
  title: string;
  code: string;
  description: string | null;
  duration: number;
  questionCount: number;
  attempts: number;
  avgScore: number;
}

interface RankingBoard {
  entries: { rank: number; id: string; name: string; avatar: string | null; frame: string | null; score: number; timeSpent: number; isMe: boolean }[];
  me: { rank: number; score: number } | null;
}

export function PracticePage() {
  useDocumentTitle('Luyện thi');
  const { data, error, reload } = useLoad(() => api.get<Modes>('/practice/modes'));
  const exams = useLoad(() => api.get<{ items: ExamRow[] }>('/library/exams'));
  const board = useLoad(() => api.get<RankingBoard>('/practice/ranking'));
  const { start, busy } = useStartSession();
  const [tab, setTab] = useState<'room' | 'factory' | 'library'>('room');

  return (
    <Shell>
      <PageHeader
        eyebrow="Phòng thi & luyện tập"
        title={<>Luyện đúng <em>sức</em>, thi đúng <em>chuẩn</em></>}
        subtitle="Cấu trúc đề theo kỳ thi THPT: trắc nghiệm, Đúng/Sai và trả lời ngắn. Đồng hồ và chấm điểm đều chạy trên máy chủ."
        actions={<Link to="/library" className="btn-ghost !h-11"><BookOpen className="h-4 w-4" /> Kho câu hỏi</Link>}
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <Card tone="lime" className="!p-6">
              <p className="eyebrow !text-ink-2">Mỗi ngày</p>
              <p className="display mt-1 text-3xl">Thử thách 5 phút</p>
              <p className="mt-2 text-ink-2">5 câu lấy từ chính lỗi sai gần đây của bạn, phản hồi ngay sau từng câu.</p>
              <button onClick={() => start({ kind: 'daily' })} disabled={busy !== null} className="btn-ink mt-5">
                {busy === 'daily' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />} {data.daily.completed ? 'Làm lại (không tính XP)' : 'Bắt đầu'}
              </button>
            </Card>
            <Card tone="butter" className="!p-6">
              <p className="eyebrow !text-ink-2">Động cơ thích ứng</p>
              <p className="display mt-1 text-3xl">Luyện vừa sức</p>
              <p className="mt-2 text-ink-2">Độ khó tự điều chỉnh sau từng câu để bạn luôn ở "vùng dòng chảy" — không quá dễ, không quá khó.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => start({ kind: 'adaptive', count: 10 })} disabled={busy !== null} className="btn-ink">
                  {busy === 'adaptive' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gauge className="h-4 w-4" />} 10 câu tổng hợp
                </button>
                <select
                  onChange={(e) => e.target.value && start({ kind: 'adaptive', count: 10, topic: e.target.value }, 'adaptive')}
                  defaultValue=""
                  className="h-12 rounded-full border border-ink/20 bg-surface px-4 font-bold"
                  aria-label="Luyện thích ứng theo chuyên đề"
                >
                  <option value="">Theo chuyên đề…</option>
                  {data.facets.topics.map((t) => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>
            </Card>
          </div>

          <div className="mb-6 flex gap-1 rounded-full bg-paper-2 p-1 font-bold sm:w-fit" role="tablist">
            {[
              { id: 'room', label: 'Phòng thi', icon: Timer },
              { id: 'factory', label: 'Nhà máy chế đề', icon: Factory },
              { id: 'library', label: 'Đề thư viện', icon: Library },
            ].map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id as typeof tab)} className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm sm:flex-none ${tab === t.id ? 'bg-ink text-paper' : 'text-ink-2'}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'room' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {data.modes.map((m) => {
                  const S = MODE_STYLE[m.id];
                  return (
                    <Card key={m.id} tone={S.tone} className="flex flex-col !p-6">
                      <S.icon className="h-7 w-7" />
                      <p className="display mt-3 text-3xl">{m.title}</p>
                      <p className="mt-2 flex-1 text-sm text-ink-2">{m.description}</p>
                      <p className="mt-3 text-sm font-bold">{m.questionCount} câu · {clock(m.timeLimit)}</p>
                      {m.id === 'ranking' && data.ranking.used && <p className="mt-1 text-xs font-semibold text-ink-2">Bạn đã dùng lượt xếp hạng tuần này{data.ranking.score !== null ? ` (${data.ranking.score}%)` : ''} — lượt sau là luyện tập.</p>}
                      <button onClick={() => start({ kind: m.id })} disabled={busy !== null || m.questionCount === 0} className="btn-ink mt-4 w-full">
                        {busy === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vào thi'} <ArrowRight className="h-4 w-4" />
                      </button>
                    </Card>
                  );
                })}
              </div>
              <Card>
                <p className="eyebrow">Bảng xếp hạng tuần</p>
                {board.data && board.data.entries.length === 0 && <p className="mt-3 text-sm text-ink-3">Chưa có ai thi tuần này. Hãy là người đầu tiên!</p>}
                <ol className="mt-3 space-y-2">
                  {board.data?.entries.slice(0, 10).map((e) => (
                    <li key={e.id} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${e.isMe ? 'bg-butter' : ''}`}>
                      <span className="w-6 text-center font-extrabold tabular-nums">{e.rank}</span>
                      <Avatar name={e.name} src={e.avatar} frame={e.frame} size={30} />
                      <span className="min-w-0 flex-1 truncate font-semibold">{e.name}</span>
                      <span className="font-extrabold tabular-nums">{e.score}%</span>
                    </li>
                  ))}
                </ol>
                {board.data?.me && <p className="mt-3 text-sm font-bold">Hạng của bạn: #{board.data.me.rank}</p>}
              </Card>
            </div>
          )}

          {tab === 'factory' && (
            <Card className="!p-6 sm:!p-8">
              <p className="display mb-1 text-3xl">Tự thiết kế đề thi</p>
              <p className="mb-6 text-ink-2">Chọn chủ đề, độ khó, dạng câu, số câu và thời gian — QuizMe ghép đề từ ngân hàng {data.facets.total} câu hỏi.</p>
              <Factory_ data={data} />
            </Card>
          )}

          {tab === 'library' && (
            <div className="grid gap-4 md:grid-cols-2">
              {exams.data?.items.length === 0 && <Empty title="Chưa có đề thư viện">Đề thi chính thức sẽ sớm được cập nhật.</Empty>}
              {exams.data?.items.map((e) => (
                <Card key={e.id} className="flex flex-col">
                  <p className="eyebrow">{e.code}</p>
                  <p className="display mt-1 text-2xl">{e.title}</p>
                  {e.description && <p className="mt-2 text-sm text-ink-2">{e.description}</p>}
                  <p className="mt-3 text-sm font-semibold text-ink-2">{e.questionCount} câu · {e.duration} phút · {e.attempts} lượt làm{e.attempts ? ` · TB ${e.avgScore}%` : ''}</p>
                  <button onClick={() => start({ kind: 'library', examId: e.id }, e.id)} disabled={busy !== null} className="btn-ink mt-4 self-start">
                    {busy === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Làm đề'}
                  </button>
                </Card>
              ))}
            </div>
          )}

          <section className="mt-12">
            <SectionTitle>Đang làm dở</SectionTitle>
            <HistoryList status="in_progress" />
          </section>
          <section className="mt-10">
            <SectionTitle>Bài làm gần đây</SectionTitle>
            <HistoryList status="submitted" />
          </section>
        </>
      )}
    </Shell>
  );
}

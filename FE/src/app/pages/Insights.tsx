import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar as RBar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, CheckCircle2, Loader2, Lock, Swords, Target, TriangleAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { date, duration, num } from '../../lib/format';
import type { Action, Breakdown, Prediction } from '../../lib/types';
import { Shell } from '../Shell';
import { Bar, Card, Empty, ErrorBox, Loading, PageHeader, Pill, scoreTone, SectionTitle, Stat } from '../ui';
import { useAction } from './Dashboard';

const INK = '#552D24';
const BRAND = '#F6700F';
const GRID = '#E9DAB9';
const tooltipStyle = { borderRadius: 14, border: '1px solid #E9DAB9', background: '#FFFDF7', fontFamily: 'Manrope', fontSize: 13 };

interface Report {
  overview: { sessions: number; questions: number; correct: number; accuracy: number; totalTime: number; totalXp: number };
  capacity: { topic: string; name: string; mastery: number; accuracy: number | null; attempts: number; retention: number | null; gapLevels: { level: string; name: string }[]; levels: { level: string; name: string; mastery: number; attempts: number }[] }[];
  byLevel: (Breakdown & { incorrect: number })[];
  byDifficulty: (Breakdown & { incorrect: number })[];
  byType: (Breakdown & { incorrect: number })[];
  errors: { total: number; careless: number; gap: number; carelessPercentage: number; avgTimeCorrect: number | null; avgTimeWrong: number | null };
  trend: { dayKey: string; sessions: number; questions: number; accuracy: number | null; avgScore: number | null; xp: number }[];
  prediction: Prediction;
  gaps: { topic: string; topicName: string; level: string | null; levelName: string | null; mastery: number; reason: string; prerequisiteName?: string }[];
}

interface Graph {
  nodes: { id: string; name: string; mastery: number; attempts: number; status: 'new' | 'weak' | 'learning' | 'mastered' }[];
  edges: { from: string; to: string }[];
}

export function PredictionCard({ p }: { p: Prediction }) {
  return (
    <Card tone="ink" className="!p-6">
      <p className="eyebrow !text-paper/70">Dự đoán điểm thi Toán</p>
      {p.reliable ? (
        <>
          <p className="display mt-2 text-[4.5rem] normal-case leading-none !text-paper">{p.score.toFixed(1).replace('.', ',')}</p>
          <p className="mt-1 text-paper/80">Khoảng tin cậy {String(p.low).replace('.', ',')} – {String(p.high).replace('.', ',')} điểm{p.targetScore ? ` · mục tiêu ${String(p.targetScore).replace('.', ',')}` : ''}</p>
          <div className="mt-5 space-y-2">
            {p.parts.map((part) => (
              <div key={part.type}>
                <div className="flex justify-between text-sm font-semibold text-paper/85"><span>{part.name}</span><span className="tabular-nums">{part.expected.toFixed(2).replace('.', ',')}/{part.max}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper/15"><div className="h-full rounded-full bg-lime" style={{ width: `${(part.expected / part.max) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="display mt-2 text-4xl !text-paper">Đang thu thập dữ liệu</p>
          <p className="mt-2 text-paper/80">Làm thêm <b>{p.answersNeeded} câu</b> để QuizMe dự đoán điểm thi của bạn đủ tin cậy.</p>
        </>
      )}
    </Card>
  );
}

function KnowledgeGraph({ graph }: { graph: Graph }) {
  // Layered layout: a node's column is the length of its longest prerequisite chain.
  const depth = new Map<string, number>();
  const parents = (id: string) => graph.edges.filter((e) => e.to === id).map((e) => e.from);
  const d = (id: string, seen = new Set<string>()): number => {
    if (depth.has(id)) return depth.get(id) as number;
    if (seen.has(id)) return 0;
    seen.add(id);
    const v = parents(id).reduce((m, p) => Math.max(m, d(p, seen) + 1), 0);
    depth.set(id, v);
    return v;
  };
  graph.nodes.forEach((n) => d(n.id));
  const cols = Math.max(...graph.nodes.map((n) => depth.get(n.id) || 0)) + 1;
  const byCol: string[][] = Array.from({ length: cols }, () => []);
  graph.nodes.forEach((n) => byCol[depth.get(n.id) || 0].push(n.id));
  const rows = Math.max(...byCol.map((c) => c.length));
  const W = 220;
  const H = 74;
  const pos = new Map<string, { x: number; y: number }>();
  byCol.forEach((col, ci) => col.forEach((id, ri) => pos.set(id, { x: ci * W + 10, y: ri * H + (rows - col.length) * (H / 2) + 10 })));
  const fill = { new: '#F3E7C9', weak: '#FF95C3', learning: '#F9E47C', mastered: '#D6DE67' };

  return (
    <div className="overflow-x-auto">
      <svg width={cols * W} height={rows * H + 20} role="img" aria-label="Bản đồ tri thức: các chuyên đề và quan hệ tiên quyết" className="min-w-full">
        {graph.edges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          return <path key={`${e.from}-${e.to}`} d={`M${a.x + 180},${a.y + 26} C${a.x + 200},${a.y + 26} ${b.x - 20},${b.y + 26} ${b.x},${b.y + 26}`} fill="none" stroke="#D5C6A3" strokeWidth={2} />;
        })}
        {graph.nodes.map((n) => {
          const p = pos.get(n.id);
          if (!p) return null;
          return (
            <g key={n.id} transform={`translate(${p.x},${p.y})`}>
              <rect width={180} height={52} rx={16} fill={fill[n.status]} stroke={INK} strokeOpacity={0.15} />
              <text x={12} y={22} fontFamily="Manrope" fontWeight={800} fontSize={13} fill={INK}>{n.name.length > 24 ? `${n.name.slice(0, 23)}…` : n.name}</text>
              <text x={12} y={40} fontFamily="Manrope" fontWeight={600} fontSize={11} fill="#6E473D">{n.attempts ? `Thành thạo ${Math.round(n.mastery * 100)}%` : 'Chưa luyện'}</text>
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        {[['mastered', 'Đã vững'], ['learning', 'Đang học'], ['weak', 'Lỗ hổng'], ['new', 'Chưa luyện']].map(([k, l]) => (
          <span key={k} className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: fill[k as keyof typeof fill] }} />{l}</span>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  useDocumentTitle('Phân tích năng lực');
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const { data, error, reload } = useLoad(() => api.get<Report>('/analytics', { period }), [period]);
  const graph = useLoad(() => api.get<Graph>('/analytics/knowledge-graph'));

  return (
    <Shell wide>
      <PageHeader eyebrow="Phân tích thông minh" title={<>Bạn <em>mạnh</em> ở đâu, <em>hổng</em> ở đâu</>} subtitle="Mọi con số đều tính từ chính bài làm của bạn: năng lực từng chuyên đề, độ chính xác theo 4 mức độ tư duy, và lỗi do bất cẩn hay do hổng kiến thức nền." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && data.overview.questions === 0 && (
        <Empty title="Chưa có dữ liệu để phân tích" action={<Link to="/practice" className="btn-ink">Làm bài đầu tiên</Link>}>Sau vài bài luyện, biểu đồ năng lực và dự đoán điểm sẽ xuất hiện ở đây.</Empty>
      )}
      {data && data.overview.questions > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Bài đã làm" value={num(data.overview.sessions)} tone="sky" />
            <Stat label="Câu đã làm" value={num(data.overview.questions)} tone="lavender" />
            <Stat label="Độ chính xác" value={`${data.overview.accuracy}%`} tone={scoreTone(data.overview.accuracy) as 'lime'} />
            <Stat label="Thời gian học" value={duration(data.overview.totalTime).replace(/ \d+ giây$/, '')} tone="butter" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <p className="eyebrow">Biểu đồ năng lực theo chuyên đề (mức thành thạo %)</p>
              <div className="h-[340px]">
                <ResponsiveContainer>
                  <RadarChart data={data.capacity} outerRadius="72%">
                    <PolarGrid stroke={GRID} />
                    <PolarAngleAxis dataKey="name" tick={{ fill: INK, fontSize: 12, fontWeight: 700 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="mastery" name="Thành thạo" stroke={BRAND} fill={BRAND} fillOpacity={0.35} strokeWidth={2} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <PredictionCard p={data.prediction} />
          </div>

          <section className="mt-10">
            <SectionTitle>Độ chính xác chi tiết theo chuyên đề</SectionTitle>
            <div className="grid gap-3 md:grid-cols-2">
              {data.capacity.map((c) => (
                <Card key={c.topic}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-extrabold">{c.name}</p>
                    <p className="text-sm font-bold tabular-nums">{c.attempts ? `${c.accuracy}% đúng · ${c.attempts} câu` : 'Chưa luyện'}</p>
                  </div>
                  <Bar value={c.mastery} tone={scoreTone(c.mastery)} className="mt-2" label={`Thành thạo ${c.name}`} />
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {c.levels.map((l) => (
                      <div key={l.level} className="rounded-xl bg-paper px-2 py-1.5 text-center" title={`${l.name}: ${l.attempts} câu`}>
                        <p className="text-[10px] font-bold uppercase text-ink-3">{l.name}</p>
                        <p className="font-extrabold tabular-nums">{l.attempts ? `${l.mastery}%` : '—'}</p>
                      </div>
                    ))}
                  </div>
                  {c.gapLevels.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-ink"><TriangleAlert className="h-4 w-4" /> Lỗ hổng: {c.gapLevels.map((g) => g.name).join(', ')}</p>}
                </Card>
              ))}
            </div>
          </section>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {([['byLevel', 'Theo 4 mức độ tư duy'], ['byDifficulty', 'Theo độ khó']] as const).map(([k, title]) => (
              <Card key={k}>
                <p className="eyebrow">{title}</p>
                <div className="mt-2 h-[240px]">
                  <ResponsiveContainer>
                    <BarChart data={data[k]} margin={{ left: -20 }}>
                      <CartesianGrid vertical={false} stroke={GRID} />
                      <XAxis dataKey="name" tick={{ fill: INK, fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#86655A', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F3E7C9' }} />
                      <RBar dataKey="correct" name="Đúng" stackId="a" fill="#D6DE67" radius={[0, 0, 0, 0]} />
                      <RBar dataKey="incorrect" name="Sai" stackId="a" fill="#FF95C3" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <Card tone="lavender">
              <p className="eyebrow !text-ink-2">Bất cẩn hay hổng kiến thức?</p>
              <p className="display mt-2 text-5xl normal-case">{data.errors.carelessPercentage}%</p>
              <p className="font-semibold">lỗi sai của bạn có dấu hiệu do bất cẩn</p>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-paper">
                <div className="bg-butter" style={{ width: `${data.errors.carelessPercentage}%` }} />
                <div className="flex-1 bg-pink" />
              </div>
              <div className="mt-2 flex justify-between text-xs font-bold"><span>Bất cẩn · {data.errors.careless}</span><span>Hổng kiến thức · {data.errors.gap}</span></div>
              <p className="mt-4 text-sm text-ink-2">
                "Bất cẩn" = sai ở câu dễ hơn năng lực hiện tại hoặc ở dạng bạn đã vững. {data.errors.avgTimeWrong !== null && data.errors.avgTimeCorrect !== null && `Bạn mất trung bình ${data.errors.avgTimeWrong}s cho câu sai và ${data.errors.avgTimeCorrect}s cho câu đúng.`}
              </p>
            </Card>
            <Card>
              <div className="flex items-center justify-between">
                <p className="eyebrow">Tiến độ theo thời gian</p>
                <div className="flex gap-1 rounded-full bg-paper-2 p-1 text-xs font-bold">
                  {(['week', 'month'] as const).map((p) => <button key={p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1 ${period === p ? 'bg-ink text-paper' : ''}`}>{p === 'week' ? '7 ngày' : '30 ngày'}</button>)}
                </div>
              </div>
              <div className="mt-2 h-[240px]">
                <ResponsiveContainer>
                  <LineChart data={data.trend.map((t) => ({ ...t, label: t.dayKey.slice(8, 10) + '/' + t.dayKey.slice(5, 7) }))} margin={{ left: -20, right: 10 }}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="label" tick={{ fill: '#86655A', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#86655A', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => (n === 'Độ chính xác' ? `${v}%` : v)} />
                    <Line type="monotone" dataKey="accuracy" name="Độ chính xác" stroke={BRAND} strokeWidth={3} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <section className="mt-10">
            <SectionTitle>Bản đồ tri thức</SectionTitle>
            <Card>
              {graph.data ? <KnowledgeGraph graph={graph.data} /> : <Loading />}
              {data.gaps.length > 0 && (
                <div className="mt-6 border-t border-line pt-5">
                  <p className="eyebrow mb-3">Lỗ hổng kiến thức phát hiện được</p>
                  <ul className="grid gap-2 md:grid-cols-2">
                    {data.gaps.slice(0, 8).map((g, i) => (
                      <li key={i} className="rounded-2xl bg-paper px-4 py-3 text-sm">
                        <b>{g.topicName}{g.levelName ? ` — ${g.levelName}` : ''}</b>
                        <span className="block text-ink-2">{g.reason === 'weak_prerequisite' ? `Kiến thức nền "${g.prerequisiteName}" còn yếu nên ảnh hưởng tới chuyên đề này.` : `Mức thành thạo mới ${Math.round(g.mastery * 100)}% dù đã có đủ dữ liệu.`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </section>
        </>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------------- roadmap */

interface Stage {
  order: number;
  topic: string;
  name: string;
  subtopics: string[];
  status: 'mastered' | 'in_progress' | 'not_started';
  mastery: number;
  targetMastery: number;
  progress: number;
  accuracy: number | null;
  attempts: number;
  bossPassed: boolean;
  bossScore: number | null;
  gapLevels: { level: string; name: string }[];
  weakPrerequisites: { topic: string; name: string }[];
  mistakes: number;
  examWeight: number;
  estimatedQuestions: number;
  recommended: boolean;
  tasks: { key: string; title: string; description: string; progress: number; target: number; done: boolean; locked?: boolean; action: Action }[];
}
interface Roadmap {
  targetScore: number;
  examDate: string | null;
  daysLeft: number | null;
  prediction: Prediction;
  overallProgress: number;
  masteredCount: number;
  dailyPlan: { questions: number; minutes: number; remainingQuestions: number };
  nextAction: { topicName: string; title: string; action: Action } | null;
  stages: Stage[];
}

export function RoadmapPage() {
  useDocumentTitle('Lộ trình');
  const { data, error, reload } = useLoad(() => api.get<Roadmap>('/roadmap'));
  const { run, busy } = useAction();

  return (
    <Shell>
      <PageHeader
        eyebrow="Lộ trình cá nhân hóa"
        title={<>Đường tới <em>{data ? String(data.targetScore).replace('.', ',') : '…'} điểm</em></>}
        subtitle="Lộ trình được AI tính lại mỗi lần bạn mở trang: dựa trên điểm số, lịch sử lỗi sai, mục tiêu và lịch thi. Chuyên đề nặng điểm và còn xa mục tiêu được ưu tiên trước."
        actions={<Link to="/profile#goals" className="btn-ghost !h-11"><Target className="h-4 w-4" /> Đổi mục tiêu</Link>}
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Hoàn thành lộ trình" value={`${data.overallProgress}%`} hint={`${data.masteredCount}/${data.stages.length} chuyên đề đã vững`} tone="lime" />
            <Stat label="Mỗi ngày nên làm" value={`${data.dailyPlan.questions} câu`} hint={`~${data.dailyPlan.minutes} phút`} tone="butter" />
            <Stat label="Thời gian còn lại" value={data.daysLeft !== null ? `${data.daysLeft} ngày` : '—'} hint={data.examDate ? `Thi ngày ${date(data.examDate)}` : 'Chưa đặt ngày thi'} tone="sky" />
          </div>
          {data.nextAction && (
            <Card tone="ink" className="mt-6 flex flex-wrap items-center gap-4 !p-6">
              <div className="min-w-0 flex-1">
                <p className="eyebrow !text-paper/70">Bước tiếp theo được đề xuất</p>
                <p className="display mt-1 text-3xl !text-paper">{data.nextAction.topicName}: {data.nextAction.title}</p>
              </div>
              <button onClick={() => run(data.nextAction!.action, 'next')} disabled={busy !== null} className="btn-lime">
                {busy === 'next' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bắt đầu'} <ArrowRight className="h-4 w-4" />
              </button>
            </Card>
          )}

          <ol className="relative mt-10 space-y-5 before:absolute before:bottom-4 before:left-[22px] before:top-4 before:w-[3px] before:rounded-full before:bg-paper-3">
            {data.stages.map((s) => (
              <li key={s.topic} className="relative pl-16">
                <span className={`absolute left-0 top-5 flex h-11 w-11 items-center justify-center rounded-full border-4 border-paper font-extrabold ${s.status === 'mastered' ? 'bg-lime' : s.recommended ? 'bg-brand text-white' : s.status === 'in_progress' ? 'bg-butter' : 'bg-paper-2'}`}>
                  {s.status === 'mastered' ? <CheckCircle2 className="h-5 w-5" /> : s.order}
                </span>
                <Card className={s.recommended ? 'ring-2 ring-brand' : ''}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="display text-2xl">{s.name}</p>
                    {s.recommended && <Pill tone="peach">Ưu tiên</Pill>}
                    {s.status === 'mastered' && <Pill tone="lime">Đã vững</Pill>}
                    <Pill tone="paper-2">{s.examWeight}% ngân hàng đề</Pill>
                    {s.bossPassed && <Pill tone="lavender"><Swords className="h-3 w-3" /> Đã vượt chặng</Pill>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Bar value={s.progress} tone={s.status === 'mastered' ? 'lime' : 'brand'} className="flex-1" label={`Tiến độ ${s.name}`} />
                    <span className="text-sm font-bold tabular-nums">{s.mastery}% / {s.targetMastery}%</span>
                  </div>
                  {s.weakPrerequisites.length > 0 && <p className="mt-2 text-sm font-semibold text-brand-ink">Nên củng cố trước: {s.weakPrerequisites.map((p) => p.name).join(', ')}</p>}
                  {s.gapLevels.length > 0 && <p className="mt-1 text-sm text-ink-2">Lỗ hổng: {s.gapLevels.map((g) => g.name).join(', ')}</p>}
                  {s.status !== 'mastered' && (
                    <ul className="mt-4 grid gap-2 md:grid-cols-3">
                      {s.tasks.map((t) => (
                        <li key={t.key}>
                          <button
                            onClick={() => !t.locked && run(t.action, `${s.topic}-${t.key}`)}
                            disabled={t.locked || busy !== null}
                            className={`flex h-full w-full flex-col rounded-2xl border-2 p-3 text-left transition-colors ${t.done ? 'border-transparent bg-lime/60' : t.locked ? 'cursor-not-allowed border-dashed border-line opacity-60' : 'border-line hover:border-ink'}`}
                          >
                            <span className="flex items-center gap-1.5 text-sm font-extrabold">
                              {t.done ? <CheckCircle2 className="h-4 w-4" /> : t.locked ? <Lock className="h-4 w-4" /> : busy === `${s.topic}-${t.key}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} {t.title}
                            </span>
                            <span className="mt-1 text-xs text-ink-2">{t.locked ? 'Luyện thêm vài câu ở chuyên đề này để mở khóa' : t.description}</span>
                            {t.target > 1 && !t.done && <Bar value={t.progress} max={t.target} className="mt-2 !h-1.5" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-ink-3">{s.subtopics.join(' · ')}</p>
                </Card>
              </li>
            ))}
          </ol>
        </>
      )}
    </Shell>
  );
}

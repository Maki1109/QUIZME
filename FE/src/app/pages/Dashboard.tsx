import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Brain, CheckCircle2, Clock3, Flame, Loader2, MessageCircle, Snowflake, Sparkles, Target } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { KIND_LABEL } from '../../lib/format';
import type { Action, HistoryRow, Mission, Prediction, Suggestion, User } from '../../lib/types';
import { Shell } from '../Shell';
import { useTutor } from '../Tutor';
import { Bar, Card, ErrorBox, Loading, Pill, SectionTitle, Stat } from '../ui';
import { useStartSession } from './Session';

interface Dashboard {
  user: User & { studiedToday: boolean };
  missions: Mission[];
  daily: { completed: boolean; score: number | null; correctAnswers: number | null; totalQuestions: number };
  goldenTime: { dueCards: number };
  suggestions: Suggestion[];
  prediction: Prediction;
  roadmap: { overallProgress: number; daysLeft: number | null; dailyPlan: { questions: number; minutes: number }; nextAction: { topicName: string; title: string; action: Action } | null };
  tutorQuota: { remaining: number; limit: number };
  openSessions: HistoryRow[];
}

/** Turn a server-suggested action into a click handler. */
export function useAction() {
  const navigate = useNavigate();
  const { start, busy } = useStartSession();
  const run = (a: Action, tag?: string) => {
    if (a.type === 'link' && a.to && a.to.startsWith('/')) navigate(a.to);
    else if (a.type === 'session' && a.kind) start({ kind: a.kind, ...(a.topic ? { topic: a.topic } : {}), ...(a.kind === 'adaptive' ? { count: 10 } : {}) }, tag || a.kind);
  };
  return { run, busy };
}

const PRIORITY_TONE = { high: 'pink', medium: 'butter', low: 'sky' } as const;

export function DashboardPage() {
  useDocumentTitle('Hôm nay');
  const { user } = useAuth();
  const tutor = useTutor();
  const { data, error, reload } = useLoad(() => api.get<Dashboard>('/dashboard'));
  const { run, busy } = useAction();
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <Shell wide>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <header className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="eyebrow">{greet}, {user?.name}</p>
              <h1 className="display mt-2 text-[2.8rem] sm:text-[4rem]">
                {data.user.studiedToday ? <>Hôm nay bạn đã <em>học</em> rồi!</> : <>Sẵn sàng <em>học</em> chưa?</>}
              </h1>
              <p className="mt-3 max-w-xl text-ink-2">
                Gợi ý hôm nay: khoảng <b>{data.roadmap.dailyPlan.questions} câu</b> (~{data.roadmap.dailyPlan.minutes} phút)
                {data.roadmap.daysLeft !== null ? <> — còn <b>{data.roadmap.daysLeft} ngày</b> tới kỳ thi.</> : '.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Chuỗi ngày" value={<span className="inline-flex items-center gap-1"><Flame className="h-6 w-6 text-brand-ink" />{data.user.streak}</span>} hint={data.user.streakFreezes ? <span className="inline-flex items-center gap-1"><Snowflake className="h-3 w-3" />{data.user.streakFreezes} đóng băng</span> : data.user.studiedToday ? 'Đã giữ chuỗi' : 'Học để giữ chuỗi'} tone="butter" />
              <Stat label={`Cấp ${data.user.level}`} value={`${data.user.progress}%`} hint={data.user.rank} tone="lavender" />
              <Stat label="Dự đoán điểm" value={data.prediction.reliable ? data.prediction.score.toFixed(1).replace('.', ',') : '—'} hint={data.prediction.reliable ? `Khoảng ${String(data.prediction.low).replace('.', ',')}–${String(data.prediction.high).replace('.', ',')}` : `Cần thêm ${data.prediction.answersNeeded} câu`} tone="sky" />
            </div>
          </header>

          {data.openSessions.length > 0 && (
            <Card tone="peach" className="mb-6 flex flex-wrap items-center gap-4">
              <Clock3 className="h-6 w-6" />
              <p className="flex-1 font-bold">
                Bạn đang làm dở {KIND_LABEL[data.openSessions[0].kind].toLowerCase()}
                {/* Only quote the title when it says more than the kind itself. */}
                {data.openSessions[0].title.toLowerCase() !== KIND_LABEL[data.openSessions[0].kind].toLowerCase() && <> “{data.openSessions[0].title}”</>}.
              </p>
              <Link to={`/session/${data.openSessions[0].id}`} className="btn-ink !h-10">Làm tiếp</Link>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card tone={data.daily.completed ? 'lime' : 'ink'} className="!p-6 lg:col-span-2">
              <p className={`eyebrow ${data.daily.completed ? '!text-ink-2' : '!text-paper/70'}`}>Thử thách 5 phút · {data.daily.totalQuestions} câu từ lỗi sai của bạn</p>
              {data.daily.completed ? (
                <>
                  <p className="display mt-2 text-4xl">Đã hoàn thành hôm nay</p>
                  <p className="mt-2 font-semibold">Bạn đúng {data.daily.correctAnswers}/{data.daily.totalQuestions} câu. Quay lại vào ngày mai nhé!</p>
                </>
              ) : (
                <>
                  <p className="display mt-2 text-4xl !text-paper">5 câu · 5 phút · +50 XP</p>
                  <p className="mt-2 text-paper/80">Câu hỏi được chọn từ chính những chỗ bạn hay sai, phản hồi ngay sau từng câu.</p>
                </>
              )}
              <button onClick={() => run({ type: 'session', kind: 'daily' }, 'daily')} disabled={busy !== null} className={`mt-5 ${data.daily.completed ? 'btn-ghost' : 'btn-lime'}`}>
                {busy === 'daily' ? <Loader2 className="h-4 w-4 animate-spin" /> : data.daily.completed ? 'Làm lại để ôn' : 'Bắt đầu thử thách'} <ArrowRight className="h-4 w-4" />
              </button>
            </Card>

            <Card>
              <p className="eyebrow">Nhiệm vụ hôm nay</p>
              <ul className="mt-3 space-y-4">
                {data.missions.map((m) => (
                  <li key={m.id}>
                    <div className="flex items-start gap-3">
                      {m.completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--answer-correct)]" /> : <Target className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" />}
                      <div className="min-w-0 flex-1">
                        <p className={`font-bold ${m.completed ? 'line-through decoration-2 opacity-60' : ''}`}>{m.title}</p>
                        <p className="text-xs text-ink-3">+{m.xp} XP · +{m.coins} xu</p>
                        {!m.completed && <Bar value={m.progress} max={m.target} className="mt-2 !h-2" label={m.title} />}
                      </div>
                      <span className="text-sm font-bold tabular-nums">{m.progress}/{m.target}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <section className="mt-10">
            <SectionTitle>Gia sư AI gợi ý cho bạn</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.suggestions.map((s) => (
                <Card key={s.id} className="flex flex-col">
                  <Pill tone={PRIORITY_TONE[s.priority]} className="self-start">{s.priority === 'high' ? 'Ưu tiên' : s.priority === 'medium' ? 'Nên làm' : 'Gợi ý'}</Pill>
                  <p className="mt-3 text-lg font-extrabold leading-snug">{s.title}</p>
                  <p className="mt-1 flex-1 text-sm text-ink-2">{s.message}</p>
                  <button onClick={() => run(s.action, s.id)} disabled={busy !== null} className="btn-ghost mt-4 !h-10 self-start !text-sm">
                    {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Làm ngay'} <ArrowRight className="h-4 w-4" />
                  </button>
                </Card>
              ))}
            </div>
          </section>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card tone="butter">
              <Brain className="h-6 w-6" />
              <p className="display mt-3 text-3xl">{data.goldenTime.dueCards} thẻ</p>
              <p className="text-sm font-semibold text-ink-2">đang ở thời điểm vàng — ôn ngay trước khi quên</p>
              <Link to="/golden-time" className="btn-ink mt-4 !h-10 !text-sm">Ôn thẻ</Link>
            </Card>
            <Card tone="lavender">
              <Sparkles className="h-6 w-6" />
              <p className="display mt-3 text-3xl">{data.roadmap.overallProgress}%</p>
              <p className="text-sm font-semibold text-ink-2">{data.roadmap.nextAction ? `Tiếp theo: ${data.roadmap.nextAction.topicName} — ${data.roadmap.nextAction.title.toLowerCase()}` : 'Bạn đã hoàn thành lộ trình!'}</p>
              <Link to="/roadmap" className="btn-ink mt-4 !h-10 !text-sm">Mở lộ trình</Link>
            </Card>
            <Card tone="sky">
              <MessageCircle className="h-6 w-6" />
              <p className="display mt-3 text-3xl">{data.tutorQuota.remaining} lượt</p>
              <p className="text-sm font-semibold text-ink-2">hỏi gia sư AI còn lại hôm nay</p>
              <button onClick={() => tutor.open({ prompt: 'Hôm nay mình nên ôn phần nào trước?' })} className="btn-ink mt-4 !h-10 !text-sm">Hỏi gia sư</button>
            </Card>
          </div>
        </>
      )}
    </Shell>
  );
}

/**
 * Session player for every practice kind, and the result / review screen.
 *
 *  Timed papers  — all questions, navigator, autosave, "unsure" flags, server-synced countdown,
 *                  automatic submission at zero.
 *  Instant kinds — one question at a time, locked answer + solution after each one (daily
 *                  challenge, adaptive practice, mistake review).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Clock3, Flag, Flame, Loader2, MessageCircle, PlayCircle, Sparkles, Trophy, TriangleAlert, X } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useCountdown, useDocumentTitle } from '../../lib/hooks';
import { clock, duration, KIND_LABEL } from '../../lib/format';
import type { Question, Session, SessionAnswer, SessionKind, SessionResult } from '../../lib/types';
import { Shell } from '../Shell';
import { AnswerInput, prettyAnswer, QuestionBody } from '../QuestionView';
import { Bar, Card, ErrorBox, Loading, Pill, scoreTone, SectionTitle } from '../ui';
import { MathText } from '../math';
import { useTutor } from '../Tutor';
import { ReportButton } from './Library';

/** Start a session and open the player. */
export function useStartSession() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const start = useCallback(
    async (params: { kind: SessionKind } & Record<string, unknown>, tag: string = params.kind) => {
      setBusy(tag);
      try {
        const r = await api.post<{ session: Session }>('/practice/sessions', params);
        navigate(`/session/${r.session.id}`);
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setBusy(null);
      }
    },
    [navigate]
  );
  return { start, busy };
}

type Payload = { state: 'in_progress'; session: Session } | { state: 'submitted'; result: SessionResult };

export function SessionPage() {
  const { id = '' } = useParams();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const { refresh } = useAuth();

  const load = useCallback(() => {
    setError('');
    api
      .get<Payload>(`/practice/sessions/${id}`)
      .then(setPayload)
      .catch((err) => setError(errorMessage(err)));
  }, [id]);
  useEffect(load, [load]);

  const onSubmitted = (result: SessionResult) => {
    setPayload({ state: 'submitted', result });
    refresh().catch(() => undefined);
    window.scrollTo({ top: 0 });
  };

  return (
    <Shell>
      {error && <ErrorBox message={error} onRetry={load} />}
      {!payload && !error && <Loading />}
      {payload?.state === 'in_progress' &&
        (payload.session.instantFeedback ? <InstantPlayer session={payload.session} onSubmitted={onSubmitted} /> : <TimedPlayer session={payload.session} onSubmitted={onSubmitted} />)}
      {payload?.state === 'submitted' && <ResultView result={payload.result} />}
    </Shell>
  );
}

/* ------------------------------------------------------------- timer */

function Timer({ session, onExpire }: { session: Session; onExpire: () => void }) {
  const left = useCountdown(session.expiresAt, session.serverNow);
  const fired = useRef(false);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  if (left === null) return null;
  const low = left <= 60;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-extrabold tabular-nums ${low ? 'bg-pink animate-pulse' : 'bg-butter'}`} role="timer" aria-live={low ? 'assertive' : 'off'}>
      <Clock3 className="h-4 w-4" /> {clock(left)}
    </span>
  );
}

/* -------------------------------------------------------- timed paper */

function TimedPlayer({ session, onSubmitted }: { session: Session; onSubmitted: (r: SessionResult) => void }) {
  useDocumentTitle(session.title);
  const navigate = useNavigate();
  const initial = useMemo(() => new Map(session.answers.map((a) => [a.questionId, a])), [session.answers]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(session.questions.map((q) => [q.id, initial.get(q.id)?.answer || ''])));
  const [flags, setFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(session.questions.map((q) => [q.id, Boolean(initial.get(q.id)?.flagged)])));
  const [index, setIndex] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const shownAt = useRef(Date.now());
  const spent = useRef<Record<string, number>>(Object.fromEntries(session.questions.map((q) => [q.id, initial.get(q.id)?.timeSpent || 0])));
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const latest = useRef({ answers, flags });
  latest.current = { answers, flags };

  const q = session.questions[index];
  const answeredCount = session.questions.filter((x) => answers[x.id]).length;

  const trackTime = () => {
    const now = Date.now();
    spent.current[q.id] = (spent.current[q.id] || 0) + Math.round((now - shownAt.current) / 1000);
    shownAt.current = now;
  };

  const save = (questionId: string, value: string, flagged: boolean) => {
    clearTimeout(timers.current[questionId]);
    timers.current[questionId] = setTimeout(() => {
      api.post(`/practice/sessions/${session.id}/answer`, { questionId, answer: value, flagged, timeSpent: Math.min(spent.current[questionId] || 0, 14400) }).catch((err) => {
        if (err.status === 409) toast.error(errorMessage(err));
      });
    }, 600);
  };

  const setAnswer = (value: string) => {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    save(q.id, value, flags[q.id]);
  };
  const toggleFlag = () => {
    const next = !flags[q.id];
    setFlags((f) => ({ ...f, [q.id]: next }));
    save(q.id, answers[q.id], next);
  };
  const go = (i: number) => {
    trackTime();
    setIndex(Math.max(0, Math.min(session.questions.length - 1, i)));
  };

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    Object.values(timers.current).forEach(clearTimeout);
    const { answers: a, flags: f } = latest.current;
    try {
      const r = await api.post<{ result: SessionResult }>(`/practice/sessions/${session.id}/submit`, {
        answers: session.questions.map((x) => ({ questionId: x.id, answer: a[x.id] || '', flagged: Boolean(f[x.id]), timeSpent: Math.min(spent.current[x.id] || 0, 14400) })),
      });
      onSubmitted(r.result);
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  }, [onSubmitted, session.id, session.questions, submitting]);

  // Warn before closing the tab mid-exam.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const quit = async () => {
    if (!window.confirm('Bỏ bài làm này? Bài sẽ không được chấm điểm.')) return;
    // Drop pending autosaves first, otherwise they reach the server after the session is closed.
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    await api.del(`/practice/sessions/${session.id}`).catch(() => undefined);
    navigate('/practice');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{KIND_LABEL[session.kind]}{session.ranked ? ' · tính xếp hạng' : ''}</p>
            <h1 className="display mt-1 truncate text-3xl sm:text-4xl">{session.title}</h1>
          </div>
          <Timer session={session} onExpire={submit} />
        </div>

        <Card>
          <QuestionBody question={q} number={index + 1} />
          <div className="mt-6">
            <AnswerInput question={q} value={answers[q.id] || ''} onChange={setAnswer} disabled={submitting} />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
            <button onClick={toggleFlag} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${flags[q.id] ? 'bg-butter' : 'bg-paper hover:bg-paper-2'}`} aria-pressed={flags[q.id]}>
              <Flag className="h-4 w-4" /> {flags[q.id] ? 'Đã đánh dấu chưa chắc' : 'Chưa chắc chắn'}
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={() => go(index - 1)} disabled={index === 0} className="btn-ghost !h-11 disabled:opacity-40" aria-label="Câu trước">
                <ArrowLeft className="h-4 w-4" />
              </button>
              {index < session.questions.length - 1 ? (
                <button onClick={() => go(index + 1)} className="btn-ink !h-11">
                  Câu tiếp <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => setConfirm(true)} className="btn-lime !h-11">
                  Nộp bài <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <p className="eyebrow">Đã làm {answeredCount}/{session.questions.length}</p>
          <Bar value={answeredCount} max={session.questions.length} className="mt-2" />
          <div className="mt-4 grid grid-cols-6 gap-1.5">
            {session.questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => go(i)}
                className={`relative h-9 rounded-lg text-sm font-bold tabular-nums ${i === index ? 'ring-2 ring-ink' : ''} ${answers[x.id] ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'}`}
                aria-label={`Câu ${i + 1}${answers[x.id] ? ', đã trả lời' : ''}${flags[x.id] ? ', chưa chắc' : ''}`}
              >
                {i + 1}
                {flags[x.id] && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-surface bg-butter" />}
              </button>
            ))}
          </div>
          <button onClick={() => setConfirm(true)} disabled={submitting} className="btn-ink mt-5 w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Nộp bài'}
          </button>
          <button onClick={quit} className="mt-2 w-full rounded-full py-2 text-sm font-bold text-ink-3 hover:text-ink">
            Bỏ bài
          </button>
        </Card>
      </aside>

      {confirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4" role="dialog" aria-modal="true">
          <div className="paper-card w-full max-w-md p-6">
            <p className="display text-3xl">Nộp bài?</p>
            <p className="mt-2 text-ink-2">
              Bạn đã làm {answeredCount}/{session.questions.length} câu.
              {answeredCount < session.questions.length && ` Còn ${session.questions.length - answeredCount} câu bỏ trống sẽ được tính là sai.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setConfirm(false)} className="btn-ghost">Làm tiếp</button>
              <button
                onClick={() => {
                  trackTime();
                  submit();
                }}
                disabled={submitting}
                className="btn-ink"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Nộp bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------- instant feedback */

interface Feedback {
  isCorrect: boolean;
  score: number;
  correctAnswer: string | null;
  explanation: string | null;
  solutionVideoUrl: string | null;
}

function InstantPlayer({ session, onSubmitted }: { session: Session; onSubmitted: (r: SessionResult) => void }) {
  useDocumentTitle(session.title);
  const tutor = useTutor();
  const [questions, setQuestions] = useState<Question[]>(session.questions);
  const [graded, setGraded] = useState<Record<string, SessionAnswer>>(() => Object.fromEntries(session.answers.map((a) => [a.questionId, a])));
  const firstOpen = session.questions.findIndex((q) => !graded[q.id]);
  const [index, setIndex] = useState(firstOpen === -1 ? Math.max(0, session.questions.length - 1) : firstOpen);
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(firstOpen === -1 && session.answers.length >= session.totalQuestions);
  const shownAt = useRef(Date.now());

  const q = questions[index];
  const total = session.totalQuestions || questions.length;
  const correctSoFar = Object.values(graded).filter((a) => a.isCorrect).length;

  const finish = useCallback(async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const r = await api.post<{ result: SessionResult }>(`/practice/sessions/${session.id}/submit`, {});
      onSubmitted(r.result);
    } catch (err) {
      toast.error(errorMessage(err));
      setFinishing(false);
    }
  }, [finishing, onSubmitted, session.id]);

  const check = async () => {
    if (!value || checking) return;
    setChecking(true);
    try {
      const r = await api.post<Feedback & { done: boolean; nextQuestion: Question | null }>(`/practice/sessions/${session.id}/answer`, {
        questionId: q.id,
        answer: value,
        timeSpent: Math.min(3600, Math.round((Date.now() - shownAt.current) / 1000)),
      });
      setFeedback(r);
      setGraded((g) => ({ ...g, [q.id]: { questionId: q.id, answer: value, flagged: false, timeSpent: 0, isCorrect: r.isCorrect, score: r.score } }));
      if (r.nextQuestion) setQuestions((qs) => [...qs, r.nextQuestion as Question]);
      setDone(r.done);
    } catch (err) {
      toast.error(errorMessage(err));
      if ((err as { status?: number }).status === 409) finish();
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    if (done || index >= questions.length - 1) return finish();
    setIndex(index + 1);
    setValue('');
    setFeedback(null);
    shownAt.current = Date.now();
  };

  if (!q) return <Loading />;
  const locked = Boolean(feedback) || Boolean(graded[q.id]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{KIND_LABEL[session.kind]}{!session.rewardEligible ? ' · làm lại (không tính XP)' : ''}</p>
          <h1 className="display mt-1 text-3xl sm:text-4xl">{session.title}</h1>
        </div>
        <Pill tone="lime" className="!px-3 !py-2 !text-sm">
          <Check className="h-4 w-4" /> {correctSoFar} đúng
        </Pill>
        {session.expiresAt && <Timer session={session} onExpire={finish} />}
      </div>
      <Bar value={Object.keys(graded).length} max={total} className="mb-5" label="Tiến độ" />

      <Card>
        <QuestionBody question={q} number={index + 1} />
        <div className="mt-6">
          <AnswerInput question={q} value={feedback ? value : graded[q.id]?.answer || value} onChange={setValue} disabled={locked} correct={feedback?.correctAnswer} />
        </div>

        {feedback && (
          <div className={`mt-6 rounded-2xl p-5 ${feedback.isCorrect ? 'bg-lime/70' : 'bg-pink/50'}`} role="status">
            <p className="flex items-center gap-2 text-lg font-extrabold">
              {feedback.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              {feedback.isCorrect ? 'Chính xác!' : feedback.score > 0 ? `Đúng một phần (${Math.round(feedback.score * 100)}%)` : 'Chưa đúng'}
            </p>
            {!feedback.isCorrect && feedback.correctAnswer && <p className="mt-1 font-semibold">Đáp án đúng: {prettyAnswer(q.type, feedback.correctAnswer.replace(/Đ/g, 'D'))}</p>}
            {feedback.explanation && <MathText text={feedback.explanation} className="mt-3 block whitespace-pre-line text-ink-2" />}
            <div className="mt-4 flex flex-wrap gap-2">
              {feedback.solutionVideoUrl && /^https:\/\//.test(feedback.solutionVideoUrl) && (
                <a href={feedback.solutionVideoUrl} target="_blank" rel="noopener noreferrer" className="btn-cream !h-10 !text-sm">
                  <PlayCircle className="h-4 w-4" /> Video lời giải
                </a>
              )}
              {!feedback.isCorrect && (
                <button onClick={() => tutor.open({ questionId: q.id, label: `${q.topicName} — câu ${index + 1}`, prompt: 'Vì sao mình làm sai câu này? Gợi ý giúp mình từng bước nhé.' })} className="btn-cream !h-10 !text-sm">
                  <MessageCircle className="h-4 w-4" /> Hỏi gia sư
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-line pt-5">
          {!locked ? (
            <button onClick={check} disabled={!value || checking} className="btn-ink disabled:opacity-40">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kiểm tra'}
            </button>
          ) : (
            <button onClick={next} disabled={finishing} className={done || index >= questions.length - 1 ? 'btn-lime' : 'btn-ink'}>
              {finishing ? <Loader2 className="h-4 w-4 animate-spin" /> : done || index >= questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp'} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------------------------------------- result */

function RewardsBanner({ result }: { result: SessionResult }) {
  const r = result.rewards;
  if (!r) return null;
  const chips = [
    r.xp > 0 && { icon: Sparkles, text: `+${r.xp} XP`, tone: 'lavender' },
    r.coins > 0 && { icon: Trophy, text: `+${r.coins} xu`, tone: 'lime' },
    r.streak && { icon: Flame, text: `Chuỗi ${r.streak} ngày`, tone: 'butter' },
    r.leveledUp && r.level && { icon: Sparkles, text: `Lên cấp ${r.level}!`, tone: 'pink' },
    r.bossPassed && { icon: Trophy, text: 'Vượt chặng!', tone: 'peach' },
    r.resolvedMistakes > 0 && { icon: Check, text: `Sửa ${r.resolvedMistakes} lỗi sai`, tone: 'sky' },
  ].filter(Boolean) as { icon: typeof Sparkles; text: string; tone: string }[];
  if (!chips.length && !r.missions.length && !r.achievements.length) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {chips.map((c) => (
        <Pill key={c.text} tone={c.tone} className="!px-3 !py-1.5 !text-sm">
          <c.icon className="h-4 w-4" /> {c.text}
        </Pill>
      ))}
      {r.missions.map((m) => (
        <Pill key={m.id} tone="butter" className="!px-3 !py-1.5 !text-sm">✓ {m.title}</Pill>
      ))}
      {r.achievements.map((a) => (
        <Pill key={a.key} tone="pink" className="!px-3 !py-1.5 !text-sm">{a.icon} {a.name}</Pill>
      ))}
    </div>
  );
}

export function ResultView({ result }: { result: SessionResult }) {
  useDocumentTitle(`Kết quả · ${result.title}`);
  const tutor = useTutor();
  const { start, busy } = useStartSession();
  const [filter, setFilter] = useState<'all' | 'wrong' | 'flagged'>('all');
  const items = result.items.filter((i) => (filter === 'wrong' ? !i.isCorrect : filter === 'flagged' ? i.flagged : true));
  const pct = Math.round(result.score);

  return (
    <div>
      <Card tone={pct >= 80 ? 'lime' : pct >= 50 ? 'butter' : 'pink'} className="!p-6 sm:!p-8">
        <p className="eyebrow !text-ink-2">
          {KIND_LABEL[result.kind]}
          {result.title && result.title.toLowerCase() !== KIND_LABEL[result.kind].toLowerCase() ? ` · ${result.title}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
          <p className="display text-[4.5rem] normal-case leading-none sm:text-[6rem]">{result.score10 !== null ? result.score10.toFixed(2).replace('.', ',') : `${pct}%`}</p>
          <div className="pb-2 font-semibold text-ink-2">
            <p>{result.score10 !== null ? 'điểm / 10' : 'chính xác'}</p>
            <p>
              {result.correctAnswers}/{result.totalQuestions} câu đúng · {duration(result.totalTimeSpent)}
            </p>
            {result.passed !== null && <p className="font-extrabold text-ink">{result.passed ? 'Đã vượt chặng 🎉' : 'Chưa đạt 70% — luyện thêm rồi thử lại nhé'}</p>}
          </div>
        </div>
        <RewardsBanner result={result} />
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/practice" className="btn-ink !h-11">Luyện tiếp</Link>
          {result.items.some((i) => !i.isCorrect) && (
            <button onClick={() => start({ kind: 'review', questionIds: result.items.filter((i) => !i.isCorrect && !i.hidden).map((i) => i.question.id).slice(0, 20) })} disabled={busy !== null} className="btn-cream !h-11">
              Làm lại câu sai
            </button>
          )}
          <Link to="/analytics" className="btn-ghost !h-11">Xem phân tích</Link>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(['byTopic', 'byLevel', 'byType'] as const).map((k) => (
          <Card key={k}>
            <p className="eyebrow mb-3">{k === 'byTopic' ? 'Theo chuyên đề' : k === 'byLevel' ? 'Theo mức độ' : 'Theo dạng câu'}</p>
            <ul className="space-y-3">
              {result.breakdown[k].map((b) => (
                <li key={b.key}>
                  <div className="mb-1 flex justify-between text-sm font-semibold">
                    <span className="truncate pr-2">{b.name}</span>
                    <span className="tabular-nums">{b.correct}/{b.total}</span>
                  </div>
                  <Bar value={b.percentage} tone={scoreTone(b.percentage)} />
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <section className="mt-10">
        <SectionTitle
          action={
            <div className="flex gap-1 rounded-full bg-paper-2 p-1 text-sm font-bold">
              {(['all', 'wrong', 'flagged'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 ${filter === f ? 'bg-ink text-paper' : ''}`}>
                  {f === 'all' ? 'Tất cả' : f === 'wrong' ? 'Câu sai' : 'Chưa chắc'}
                </button>
              ))}
            </div>
          }
        >
          Xem lại bài làm
        </SectionTitle>
        <div className="space-y-4">
          {items.map((item) => {
            const n = result.items.indexOf(item) + 1;
            return (
              <Card key={item.question.id}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Pill tone={item.isCorrect ? 'lime' : item.score > 0 ? 'butter' : 'pink'}>{item.isCorrect ? 'Đúng' : item.score > 0 ? `Đúng ${Math.round(item.score * 100)}%` : item.answered ? 'Sai' : 'Bỏ trống'}</Pill>
                  {item.errorType && <Pill tone="paper-2">{item.errorType === 'careless' ? 'Có thể do bất cẩn' : 'Hổng kiến thức'}</Pill>}
                  {item.flagged && <Pill tone="butter"><Flag className="h-3 w-3" /> Chưa chắc</Pill>}
                </div>
                <QuestionBody question={item.question} number={n} />
                <div className="mt-4 grid gap-2 rounded-2xl bg-paper p-4 text-sm sm:grid-cols-2">
                  <p><span className="font-bold">Bạn chọn:</span> {prettyAnswer(item.question.type, item.userAnswer)}</p>
                  <p>
                    <span className="font-bold">Đáp án:</span>{' '}
                    {item.hidden ? <span className="text-ink-3">Ẩn vì câu này đang nằm trong một bài thi bạn chưa nộp</span> : prettyAnswer(item.question.type, (item.correctAnswer || '').replace(/Đ/g, 'D'))}
                  </p>
                </div>
                {item.explanation && <MathText text={item.explanation} className="mt-3 block whitespace-pre-line text-ink-2" />}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.solutionVideoUrl && /^https:\/\//.test(item.solutionVideoUrl) && (
                    <a href={item.solutionVideoUrl} target="_blank" rel="noopener noreferrer" className="btn-cream !h-10 !text-sm">
                      <PlayCircle className="h-4 w-4" /> Video lời giải
                    </a>
                  )}
                  {!item.isCorrect && !item.hidden && (
                    <button onClick={() => tutor.open({ questionId: item.question.id, label: `${item.question.topicName} — câu ${n}`, prompt: 'Mình sai câu này, bạn gợi ý giúp mình tìm ra chỗ sai nhé.' })} className="btn-cream !h-10 !text-sm">
                      <MessageCircle className="h-4 w-4" /> Hỏi gia sư
                    </button>
                  )}
                  <ReportButton questionId={item.question.id} />
                </div>
              </Card>
            );
          })}
          {items.length === 0 && <p className="text-center text-ink-3">Không có câu nào trong mục này.</p>}
        </div>
      </section>
    </div>
  );
}

export function ExpiredNote() {
  return (
    <p className="flex items-center gap-2 text-sm text-ink-3">
      <TriangleAlert className="h-4 w-4" /> Bài làm đã hết giờ và được chấm tự động.
    </p>
  );
}

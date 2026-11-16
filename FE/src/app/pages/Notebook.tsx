import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, ArrowRight, Crown, MessageCircle, PlayCircle, Printer, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { date, relative } from '../../lib/format';
import type { MistakeItem, Question, Solution } from '../../lib/types';
import { Shell } from '../Shell';
import { useTutor } from '../Tutor';
import { prettyAnswer, QuestionBody } from '../QuestionView';
import { Card, Empty, ErrorBox, Loading, PageHeader, Pill, Stat } from '../ui';
import { MathText } from '../math';
import { useStartSession } from './Session';
import { ReportButton } from './Library';
import { Wordmark } from '../../components/landing/primitives';

interface Weekly {
  week: string;
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  previousWeek: string | null;
  nextWeek: string | null;
  totalThisWeek: number;
  limit: number;
  summary: { total: number; unresolved: number; careless: number; gap: number; highConfidence: number; byTopic: { topic: string; name: string; count: number }[] };
  items: MistakeItem[];
}

function MistakeCard({ item, n }: { item: MistakeItem; n: number }) {
  const tutor = useTutor();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="display text-xl normal-case">#{n}</span>
        <Pill tone={item.resolved ? 'lime' : 'pink'}>{item.resolved ? 'Đã sửa' : 'Chưa sửa'}</Pill>
        <Pill tone={item.errorType === 'careless' ? 'butter' : 'lavender'}>{item.errorTypeLabel}</Pill>
        {item.confidence === 'high' && !item.resolved && <Pill tone="peach">Sai khi tự tin</Pill>}
        {item.wrongCount > 1 && <Pill tone="paper-2">Sai {item.wrongCount} lần</Pill>}
        <span className="ml-auto text-xs font-semibold text-ink-3">{relative(item.lastWrongAt)}</span>
      </div>
      <QuestionBody question={item.question} />
      <div className="mt-4 grid gap-2 rounded-2xl bg-paper p-4 text-sm sm:grid-cols-2">
        <p><span className="font-bold">Bạn đã chọn:</span> {prettyAnswer(item.question.type, item.lastAnswer)}</p>
        <p>
          <span className="font-bold">Đáp án:</span>{' '}
          {item.hidden ? <span className="text-ink-3">Ẩn trong lúc bạn đang làm một bài thi chứa câu này</span> : open ? prettyAnswer(item.question.type, (item.correctAnswer || '').replace(/Đ/g, 'D')) : <button onClick={() => setOpen(true)} className="font-bold text-brand-ink underline">Hiện đáp án</button>}
        </p>
      </div>
      {open && item.explanation && <MathText text={item.explanation} className="mt-3 block whitespace-pre-line text-ink-2" />}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.solutionVideoUrl && /^https:\/\//.test(item.solutionVideoUrl) && (
          <a href={item.solutionVideoUrl} target="_blank" rel="noopener noreferrer" className="btn-cream !h-10 !text-sm"><PlayCircle className="h-4 w-4" /> Video giải</a>
        )}
        {!item.hidden && (
          <button onClick={() => tutor.open({ questionId: item.question.id, label: `${item.question.topicName} (sổ lỗi sai)`, prompt: 'Vì sao mình chọn sai câu này? Dẫn mình từng bước nhé.' })} className="btn-cream !h-10 !text-sm">
            <MessageCircle className="h-4 w-4" /> Hỏi gia sư
          </button>
        )}
        <ReportButton questionId={item.question.id} />
      </div>
    </Card>
  );
}

export function NotebookPage() {
  useDocumentTitle('Sổ lỗi sai');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const week = params.get('week') || '';
  const topic = params.get('topic') || '';
  const { data, error, loading, reload } = useLoad(() => api.get<Weekly>('/notebook/weekly', { week }), [week]);
  const { start, busy } = useStartSession();
  const elite = user?.plan.tier === 'elite';
  const items = data ? data.items.filter((i) => !topic || i.question.topic === topic) : [];
  const openIds = items.filter((i) => !i.resolved && !i.hidden).map((i) => i.question.id);

  const setWeek = (w: string | null) => {
    const next = new URLSearchParams(params);
    if (w) next.set('week', w);
    else next.delete('week');
    setParams(next);
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Sổ tay lỗi sai động"
        title={<>20 lỗi <em>đáng sửa</em> nhất tuần</>}
        subtitle="QuizMe tự gom lỗi sai từ mọi bài làm và xếp hạng theo mức độ nghiêm trọng: sai khi tự tin, sai lặp lại, sai ở câu vừa sức. Không cần chép tay."
        actions={
          elite ? (
            <Link to={`/error-notebook/print${week ? `?week=${week}` : ''}`} className="btn-ink !h-11"><Printer className="h-4 w-4" /> In / xuất PDF</Link>
          ) : (
            <Link to="/upgrade" className="btn-ghost !h-11"><Crown className="h-4 w-4" /> Xuất PDF (Elite)</Link>
          )
        }
      />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <Loading />}
      {data && (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button onClick={() => setWeek(data.previousWeek)} disabled={!data.previousWeek} className="btn-ghost !h-10 disabled:opacity-40" aria-label="Tuần trước"><ArrowLeft className="h-4 w-4" /></button>
            <span className="font-bold">Tuần {date(data.weekStart)} – {date(data.weekEnd)}</span>
            <button onClick={() => setWeek(data.nextWeek)} disabled={!data.nextWeek} className="btn-ghost !h-10 disabled:opacity-40" aria-label="Tuần sau"><ArrowRight className="h-4 w-4" /></button>
            {!data.isCurrentWeek && <button onClick={() => setWeek(null)} className="text-sm font-bold underline">Tuần này</button>}
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Lỗi trong sổ" value={data.summary.total} hint={`trên ${data.totalThisWeek} lỗi tuần này`} tone="pink" />
            <Stat label="Chưa sửa" value={data.summary.unresolved} tone="butter" />
            <Stat label="Hổng kiến thức" value={data.summary.gap} tone="lavender" />
            <Stat label="Bất cẩn" value={data.summary.careless} tone="sky" />
          </div>
          {data.summary.byTopic.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button onClick={() => setParams(week ? { week } : {})} className={`tag ${!topic ? '!bg-ink !text-paper' : ''}`}>Tất cả</button>
              {data.summary.byTopic.map((t) => (
                <button key={t.topic} onClick={() => setParams({ ...(week ? { week } : {}), topic: t.topic })} className={`tag ${topic === t.topic ? '!bg-ink !text-paper' : ''}`}>
                  {t.name} · {t.count}
                </button>
              ))}
            </div>
          )}
          {openIds.length > 0 && (
            <Card tone="lime" className="mb-6 flex flex-wrap items-center gap-4">
              <RotateCcw className="h-6 w-6" />
              <p className="flex-1 font-bold">Làm lại {Math.min(openIds.length, 20)} câu chưa sửa — câu nào đúng sẽ được gạch khỏi sổ.</p>
              <button onClick={() => start({ kind: 'review', questionIds: openIds.slice(0, 20) })} disabled={busy !== null} className="btn-ink !h-10">Ôn ngay</button>
            </Card>
          )}
          {items.length === 0 ? (
            <Empty title={data.isCurrentWeek ? 'Tuần này chưa có lỗi sai nào' : 'Không có lỗi sai trong tuần này'} action={<Link to="/practice" className="btn-ink">Đi luyện tập</Link>}>
              Làm bài luyện — mọi câu sai sẽ tự động vào đây kèm đề bài và lời giải.
            </Empty>
          ) : (
            <div className="space-y-4">
              {items.map((item, i) => <MistakeCard key={item.id} item={item} n={i + 1} />)}
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------- Phygital print */

export function NotebookPrintPage() {
  useDocumentTitle('In sổ lỗi sai');
  const [params] = useSearchParams();
  const week = params.get('week') || '';
  const { data, error } = useLoad(() => api.get<Weekly & { student: string }>('/notebook/export', { week }), [week]);
  const [codes, setCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    Promise.all(data.items.map(async (i) => [i.id, await QRCode.toDataURL(i.qrUrl || '', { margin: 1, width: 180, errorCorrectionLevel: 'M' })] as const)).then((pairs) => setCodes(Object.fromEntries(pairs)));
  }, [data]);

  if (error)
    return (
      <div className="mx-auto max-w-xl p-8">
        <ErrorBox message={error} />
        <Link to="/error-notebook" className="btn-ghost mt-4">Quay lại</Link>
      </div>
    );
  if (!data) return <Loading />;

  return (
    <div className="bg-white text-ink print:bg-white">
      <div className="mx-auto max-w-[800px] px-8 py-8">
        <div className="mb-6 flex items-center gap-3 print:hidden">
          <Link to="/error-notebook" className="btn-ghost !h-10"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
          <button onClick={() => window.print()} className="btn-ink !h-10"><Printer className="h-4 w-4" /> In / Lưu PDF</button>
          <p className="text-sm text-ink-3">Chọn “Lưu dưới dạng PDF” trong hộp thoại in để xuất file.</p>
        </div>
        <header className="flex items-end justify-between border-b-2 border-ink pb-4">
          <div>
            <div className="text-[1.6rem]"><Wordmark /></div>
            <p className="display mt-2 text-3xl">Sổ lỗi sai cá nhân</p>
            <p className="font-semibold">{data.student} · Tuần {date(data.weekStart)} – {date(data.weekEnd)}</p>
          </div>
          <p className="text-right text-sm">{data.items.length} câu<br />Quét mã QR để xem lời giải chi tiết</p>
        </header>
        {data.items.length === 0 && <p className="py-10 text-center">Tuần này không có lỗi sai nào.</p>}
        {data.items.map((item) => (
          <article key={item.id} className="break-inside-avoid border-b border-line py-5">
            <div className="flex gap-5">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm font-bold">
                  Câu {item.index} · {item.question.topicName} · {item.question.levelName} · {item.errorTypeLabel}{item.wrongCount > 1 ? ` · sai ${item.wrongCount} lần` : ''}
                </p>
                {item.question.content && <MathText text={item.question.content} className="block whitespace-pre-line" />}
                {item.question.imageUrl && <img src={item.question.imageUrl} alt={`Đề ${item.question.code}`} referrerPolicy="no-referrer" className="max-h-[320px] max-w-full object-contain" />}
                <p className="mt-2 text-sm">Bạn đã chọn: <b>{prettyAnswer(item.question.type, item.lastAnswer)}</b></p>
                <div className="mt-3 h-24 rounded-lg border border-dashed border-line-strong p-2 text-xs text-ink-3">Ghi chú / làm lại:</div>
              </div>
              <div className="w-[110px] shrink-0 text-center">
                {codes[item.id] && <img src={codes[item.id]} alt="Mã QR lời giải" className="h-[110px] w-[110px]" />}
                <p className="mt-1 text-[10px] leading-tight">{item.solutionVideoUrl ? 'Video lời giải' : 'Lời giải chi tiết'}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------- solution page (QR target) */

export function SolutionPage() {
  const { id = '' } = useParams();
  useDocumentTitle('Lời giải');
  const tutor = useTutor();
  const { data, error } = useLoad(() => api.get<Solution & { question: Question; topicName: string; levelName: string; mistake: { lastAnswer: string; wrongCount: number } | null }>(`/library/questions/${id}/solution`), [id]);
  return (
    <Shell>
      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}
      {data && (
        <div className="mx-auto max-w-3xl">
          <PageHeader eyebrow={`${data.topicName} · ${data.levelName}`} title={<>Lời giải <em>chi tiết</em></>} />
          <Card>
            <QuestionBody question={data.question} />
            {data.mistake && <p className="mt-4 text-sm">Lần gần nhất bạn chọn: <b>{prettyAnswer(data.question.type, data.mistake.lastAnswer)}</b></p>}
            <p className="mt-4 rounded-2xl bg-lime/70 p-4 font-bold">Đáp án: {prettyAnswer(data.question.type, (data.correctAnswer || '').replace(/Đ/g, 'D'))}</p>
            {data.explanation ? <MathText text={data.explanation} className="mt-4 block whitespace-pre-line text-ink-2" /> : <p className="mt-4 text-ink-3">Câu này chưa có lời giải viết. Hỏi gia sư để được hướng dẫn từng bước.</p>}
            {data.solutionVideoUrl && /^https:\/\//.test(data.solutionVideoUrl) && (
              <a href={data.solutionVideoUrl} target="_blank" rel="noopener noreferrer" className="btn-ink mt-5"><PlayCircle className="h-4 w-4" /> Xem video lời giải</a>
            )}
            <button onClick={() => tutor.open({ questionId: data.question.id, label: data.topicName })} className="btn-ghost mt-5 sm:ml-2"><MessageCircle className="h-4 w-4" /> Hỏi gia sư</button>
          </Card>
        </div>
      )}
    </Shell>
  );
}

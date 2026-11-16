import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import type { Session, User } from '../../lib/types';
import { Wordmark } from '../../components/landing/primitives';
import { Card, Loading } from '../ui';

export function OnboardingPage() {
  useDocumentTitle('Bắt đầu');
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { data } = useLoad(() => api.get<{ goals: string[] }>('/onboarding/options'));
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>(user?.goals || []);
  const [target, setTarget] = useState(user?.targetScore ?? 8);
  const [examDate, setExamDate] = useState(user?.examDate ? user.examDate.slice(0, 10) : '');
  const [busy, setBusy] = useState(false);

  const finish = async (placement: boolean) => {
    setBusy(true);
    try {
      const r = await api.post<{ user: User }>('/onboarding/complete', { goals, targetScore: target, examDate: examDate || undefined });
      setUser(r.user);
      if (placement) {
        const s = await api.post<{ session: Session }>('/practice/sessions', { kind: 'placement' });
        navigate(`/session/${s.session.id}`, { replace: true });
      } else navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-[1.8rem]"><Wordmark /></div>
        <div className="mt-8 flex gap-2" aria-label={`Bước ${step + 1}/3`}>
          {[0, 1, 2].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-paper-3'}`} />)}
        </div>
        {!data ? (
          <Loading />
        ) : (
          <Card className="mt-8 !p-6 sm:!p-10">
            {step === 0 && (
              <>
                <p className="eyebrow">Bước 1 · Mục tiêu</p>
                <h1 className="display mt-2 text-4xl sm:text-5xl">Bạn muốn đạt <em>điều gì</em>?</h1>
                <div className="mt-6 grid gap-2">
                  {data.goals.map((g) => {
                    const on = goals.includes(g);
                    return (
                      <button key={g} onClick={() => setGoals(on ? goals.filter((x) => x !== g) : [...goals, g])} aria-pressed={on} className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left font-bold ${on ? 'border-ink bg-butter' : 'border-line hover:border-ink'}`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? 'border-ink bg-ink text-paper' : 'border-line-strong'}`}>{on && <Check className="h-4 w-4" />}</span>
                        {g}
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setStep(1)} className="btn-ink mt-8">Tiếp tục <ArrowRight className="h-4 w-4" /></button>
              </>
            )}
            {step === 1 && (
              <>
                <p className="eyebrow">Bước 2 · Kỳ thi</p>
                <h1 className="display mt-2 text-4xl sm:text-5xl">Điểm <em>mục tiêu</em> môn Toán</h1>
                <p className="mt-6 display text-7xl normal-case tabular-nums">{target.toFixed(1).replace('.', ',')}</p>
                <input type="range" min={5} max={10} step={0.5} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="mt-4 w-full accent-[var(--ink)]" aria-label="Điểm mục tiêu" />
                <label className="mt-8 block">
                  <span className="mb-2 block font-bold">Ngày thi (không bắt buộc)</span>
                  <input type="date" min={today} value={examDate} onChange={(e) => setExamDate(e.target.value)} className="h-12 rounded-2xl border-[1.5px] border-line bg-surface px-4 font-semibold outline-none focus:border-ink" />
                </label>
                <p className="mt-3 text-sm text-ink-2">QuizMe dùng điểm mục tiêu và ngày thi để chia nhỏ lộ trình thành lượng bài vừa sức mỗi ngày.</p>
                <div className="mt-8 flex gap-2">
                  <button onClick={() => setStep(0)} className="btn-ghost">Quay lại</button>
                  <button onClick={() => setStep(2)} className="btn-ink">Tiếp tục <ArrowRight className="h-4 w-4" /></button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="eyebrow">Bước 3 · Kiểm tra đầu vào</p>
                <h1 className="display mt-2 text-4xl sm:text-5xl">Cho QuizMe biết <em>bạn đang ở đâu</em></h1>
                <p className="mt-4 text-ink-2">Bài kiểm tra 10 câu (~20 phút) giúp ước lượng năng lực ban đầu và tìm lỗ hổng kiến thức, để lộ trình và độ khó câu hỏi vừa sức bạn ngay từ đầu.</p>
                <div className="mt-8 flex flex-wrap gap-2">
                  <button onClick={() => finish(true)} disabled={busy} className="btn-ink">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Làm bài kiểm tra'}</button>
                  <button onClick={() => finish(false)} disabled={busy} className="btn-ghost">Để sau</button>
                </div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

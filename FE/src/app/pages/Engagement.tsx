import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, Check, CheckCircle2, Coins, Crown, Flame, Loader2, Lock, LogOut, Snowflake, XCircle } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useDocumentTitle, useLoad } from '../../lib/hooks';
import { date, num, relative, vnd } from '../../lib/format';
import type { User } from '../../lib/types';
import { Avatar, Shell } from '../Shell';
import { Bar, Card, Empty, ErrorBox, Loading, PageHeader, Pill, SectionTitle, Stat } from '../ui';

/* ------------------------------------------------------------ leaderboard */

interface Board {
  period: string;
  entries: { rank: number; id: string; name: string; avatar: string | null; frame: string | null; level: number; score: number; isMe: boolean }[];
  me: { rank: number; score: number };
}

export function LeaderboardPage() {
  useDocumentTitle('Bảng xếp hạng');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { data, error, reload } = useLoad(() => api.get<Board>('/leaderboard', { period }), [period]);
  const podium = data?.entries.slice(0, 3) || [];
  return (
    <Shell>
      <PageHeader eyebrow="Bảng xếp hạng" title={<>Ai <em>chăm</em> nhất?</>} subtitle="Xếp theo XP kiếm được từ việc học thật. Chỉ hiển thị tên hiển thị và cấp độ — không bao giờ lộ email." />
      <div className="mb-6 flex gap-1 rounded-full bg-paper-2 p-1 font-bold sm:w-fit">
        {(['week', 'month', 'all'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 rounded-full px-4 py-2 text-sm sm:flex-none ${period === p ? 'bg-ink text-paper' : ''}`}>{p === 'week' ? 'Tuần này' : p === 'month' ? 'Tháng này' : 'Mọi thời điểm'}</button>
        ))}
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && data.entries.length === 0 && <Empty title="Chưa có ai trên bảng">Học và nhận XP để lên bảng xếp hạng.</Empty>}
      {data && data.entries.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-3 items-end gap-3">
            {[podium[1], podium[0], podium[2]].map((e, i) =>
              e ? (
                <Card key={e.id} tone={i === 1 ? 'butter' : i === 0 ? 'sky' : 'peach'} className={`text-center ${i === 1 ? 'pb-10' : ''}`}>
                  <p className="display text-4xl">#{e.rank}</p>
                  <div className="mt-2 flex justify-center"><Avatar name={e.name} src={e.avatar} frame={e.frame} size={56} /></div>
                  <p className="mt-2 truncate font-extrabold">{e.name}</p>
                  <p className="text-sm font-bold tabular-nums">{num(e.score)} XP</p>
                </Card>
              ) : <div key={i} />
            )}
          </div>
          <ol className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-surface">
            {data.entries.slice(3).map((e) => (
              <li key={e.id} className={`flex items-center gap-4 px-5 py-3 ${e.isMe ? 'bg-butter/60' : ''}`}>
                <span className="w-8 text-center font-extrabold tabular-nums">{e.rank}</span>
                <Avatar name={e.name} src={e.avatar} frame={e.frame} size={36} />
                <span className="min-w-0 flex-1 truncate font-bold">{e.name}{e.isMe ? ' (bạn)' : ''}</span>
                <Pill tone="lavender">Lv {e.level}</Pill>
                <span className="w-24 text-right font-extrabold tabular-nums">{num(e.score)} XP</span>
              </li>
            ))}
          </ol>
          <Card tone="ink" className="mt-6 flex items-center justify-between">
            <span className="font-bold">Hạng của bạn</span>
            <span className="display text-3xl !text-paper">#{data.me.rank} · {num(data.me.score)} XP</span>
          </Card>
        </>
      )}
    </Shell>
  );
}

/* ----------------------------------------------------------- achievements */

interface Achievements {
  items: { key: string; name: string; description: string; icon: string; rarity: string; xp: number; coins: number; progress: number; target: number; unlocked: boolean; unlockedAt: string | null }[];
  unlocked: number;
  total: number;
}
const RARITY = { common: ['Phổ thông', 'sky'], rare: ['Hiếm', 'lavender'], epic: ['Sử thi', 'pink'], legendary: ['Huyền thoại', 'butter'] } as Record<string, [string, string]>;

export function AchievementsPage() {
  useDocumentTitle('Thành tích');
  const { user } = useAuth();
  const { data, error, reload } = useLoad(() => api.get<Achievements>('/achievements'));
  return (
    <Shell>
      <PageHeader eyebrow="Thành tích & cấp độ" title={<>Bộ sưu tập <em>huy hiệu</em></>} />
      {user && (
        <Card tone="lavender" className="mb-8 !p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow !text-ink-2">Hạng {user.rank}</p>
              <p className="display text-5xl">Cấp {user.level}</p>
            </div>
            <p className="font-bold tabular-nums">{num(user.xpInLevel)}/{num(user.xpForNextLevel)} XP tới cấp {user.level + 1}</p>
          </div>
          <Bar value={user.progress} tone="ink" className="mt-4 !h-3 !bg-paper" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone="butter" className="!text-sm"><Flame className="h-4 w-4" /> Chuỗi {user.streak} ngày (dài nhất {user.longestStreak ?? user.streak})</Pill>
            <Pill tone="lime" className="!text-sm"><Coins className="h-4 w-4" /> {num(user.coins)} xu</Pill>
            <Pill tone="surface" className="!text-sm">Tổng {num(user.totalXp)} XP</Pill>
          </div>
        </Card>
      )}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <p className="mb-4 font-bold">Đã mở khóa {data.unlocked}/{data.total}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((a) => (
              <Card key={a.key} className={a.unlocked ? '' : 'opacity-70'}>
                <div className="flex items-start gap-3">
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl ${a.unlocked ? `bg-${RARITY[a.rarity][1]}` : 'bg-paper-2 grayscale'}`}>{a.unlocked ? a.icon : <Lock className="h-6 w-6 text-ink-3" />}</span>
                  <div className="min-w-0">
                    <p className="font-extrabold">{a.name}</p>
                    <p className="text-sm text-ink-2">{a.description}</p>
                    <p className="mt-1 text-xs font-semibold text-ink-3">{RARITY[a.rarity][0]} · +{a.xp} XP · +{a.coins} xu</p>
                  </div>
                </div>
                {a.unlocked ? <p className="mt-3 text-xs font-bold text-[var(--answer-correct)]">✓ Mở khóa {date(a.unlockedAt)}</p> : (
                  <div className="mt-3"><Bar value={a.progress} max={a.target} /><p className="mt-1 text-right text-xs font-bold tabular-nums">{a.progress}/{a.target}</p></div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------- shop */

interface Shop {
  coins: number;
  streakFreezes: number;
  equippedFrame: string | null;
  items: { key: string; name: string; description: string; icon: string; cost: number; type: string; owned: boolean; ownedCount?: number; maxOwned?: number }[];
}

export function ShopPage() {
  useDocumentTitle('Cửa hàng');
  const { refresh } = useAuth();
  const { data, error, reload, setData } = useLoad(() => api.get<Shop>('/shop'));
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (key: string, fn: () => Promise<Shop & { message?: string }>, ok?: string) => {
    setBusy(key);
    try {
      const r = await fn();
      setData(r);
      if (ok) toast.success(ok);
      refresh().catch(() => undefined);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Shell>
      <PageHeader eyebrow="Cửa hàng đổi quà" title={<>Đổi <em>xu</em> lấy quà</>} subtitle="Kiếm xu khi hoàn thành bài luyện, nhiệm vụ hằng ngày và mở khóa thành tích." />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:w-fit">
            <Stat label="Xu của bạn" value={<span className="inline-flex items-center gap-2"><Coins className="h-6 w-6" />{num(data.coins)}</span>} tone="lime" />
            <Stat label="Đóng băng chuỗi" value={<span className="inline-flex items-center gap-2"><Snowflake className="h-6 w-6" />{data.streakFreezes}</span>} tone="sky" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => {
              const frame = item.type === 'frame';
              const equipped = frame && data.equippedFrame === item.key;
              const maxed = item.maxOwned !== undefined && (item.ownedCount || 0) >= item.maxOwned;
              return (
                <Card key={item.key} className="flex flex-col">
                  <span className="text-4xl">{item.icon}</span>
                  <p className="mt-3 text-lg font-extrabold">{item.name}</p>
                  <p className="flex-1 text-sm text-ink-2">{item.description}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 font-extrabold"><Coins className="h-4 w-4" /> {num(item.cost)} xu</p>
                  {frame && item.owned ? (
                    <button onClick={() => act(item.key, () => api.post<Shop>('/shop/equip', { frame: equipped ? null : item.key }))} disabled={busy !== null} className={`mt-3 ${equipped ? 'btn-lime' : 'btn-ghost'}`}>
                      {busy === item.key ? <Loader2 className="h-4 w-4 animate-spin" /> : equipped ? <><Check className="h-4 w-4" /> Đang dùng</> : 'Dùng khung này'}
                    </button>
                  ) : (
                    <button
                      onClick={() => window.confirm(`Đổi ${item.cost} xu lấy "${item.name}"?`) && act(item.key, () => api.post<Shop>('/shop/redeem', { item: item.key }), 'Đổi quà thành công!')}
                      disabled={busy !== null || item.owned || maxed || data.coins < item.cost}
                      className="btn-ink mt-3 disabled:opacity-40"
                    >
                      {busy === item.key ? <Loader2 className="h-4 w-4 animate-spin" /> : item.owned ? 'Đã sở hữu' : maxed ? `Tối đa ${item.maxOwned}` : data.coins < item.cost ? 'Chưa đủ xu' : 'Đổi quà'}
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------------- profile */

interface Me {
  user: User;
  stats: { sessions: number; questions: number; correct: number; accuracy: number; totalTime: number; badges: number };
}

export function ProfilePage() {
  useDocumentTitle('Hồ sơ');
  const { setUser, adopt, logoutEverywhere } = useAuth();
  const { data, error, reload } = useLoad(() => api.get<Me>('/users/me'));
  const xp = useLoad(() => api.get<{ items: { id: string; amount: number; coins: number; description: string; createdAt: string }[] }>('/users/me/xp-history', { limit: 15 }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });

  if (error) return <Shell><ErrorBox message={error} onRetry={reload} /></Shell>;
  if (!data) return <Shell><Loading /></Shell>;
  const u = data.user;

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const r = await api.put<{ user: User }>('/users/me', {
        name: String(f.get('name') || ''),
        fullName: String(f.get('fullName') || ''),
        targetScore: Number(f.get('targetScore')),
        examDate: String(f.get('examDate') || '') || null,
        settings: { studyReminder: f.get('studyReminder') === 'on', emailNotifications: f.get('emailNotifications') === 'on', studyTime: String(f.get('studyTime') || '19:00'), dailyGoal: Number(f.get('dailyGoal')) },
      });
      setUser(r.user);
      toast.success('Đã lưu thay đổi');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file?: File) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error('Ảnh tối đa 3MB');
    setUploading(true);
    try {
      const r = await api.upload<{ user: User }>('/users/me/avatar', file);
      setUser(r.user);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.put<{ token: string; user: User }>('/auth/password', { currentPassword: pw.current, newPassword: pw.next });
      adopt(r);
      setPw({ current: '', next: '' });
      toast.success('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const input = 'h-12 w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 font-semibold outline-none focus:border-ink';
  return (
    <Shell>
      <div className="mb-8 flex flex-wrap items-center gap-5">
        <label className="relative cursor-pointer" aria-label="Đổi ảnh đại diện">
          <Avatar name={u.name} src={u.avatar} frame={u.equippedFrame} size={96} />
          <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</span>
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        <div>
          <p className="eyebrow">Hồ sơ · tham gia {date(u.createdAt)}</p>
          <h1 className="display text-5xl">{u.name}</h1>
          <p className="text-ink-2">{u.email} · Gói <b>{u.plan.name}</b>{u.plan.expiresAt ? ` đến ${date(u.plan.expiresAt)}` : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Bài đã làm" value={num(data.stats.sessions)} tone="sky" />
        <Stat label="Câu đúng" value={num(data.stats.correct)} hint={`${data.stats.accuracy}% chính xác`} tone="lime" />
        <Stat label="Ngày học" value={num(u.totalStudyDays || 0)} hint={`Chuỗi dài nhất ${u.longestStreak ?? 0}`} tone="butter" />
        <Stat label="Huy hiệu" value={data.stats.badges} tone="lavender" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle>Thông tin & mục tiêu</SectionTitle>
          <form id="goals" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-sm font-bold">Tên hiển thị</span><input name="name" defaultValue={u.name} maxLength={40} className={input} /></label>
            <label><span className="mb-1.5 block text-sm font-bold">Họ và tên</span><input name="fullName" defaultValue={u.fullName} maxLength={80} className={input} /></label>
            <label><span className="mb-1.5 block text-sm font-bold">Điểm mục tiêu (1–10)</span><input name="targetScore" type="number" min={1} max={10} step={0.5} defaultValue={u.targetScore} className={input} /></label>
            <label><span className="mb-1.5 block text-sm font-bold">Ngày thi</span><input name="examDate" type="date" defaultValue={u.examDate ? u.examDate.slice(0, 10) : ''} className={input} /></label>
            <label><span className="mb-1.5 block text-sm font-bold">Giờ học hằng ngày</span><input name="studyTime" type="time" defaultValue={u.settings?.studyTime || '19:00'} className={input} /></label>
            <label><span className="mb-1.5 block text-sm font-bold">Mục tiêu câu/ngày</span><input name="dailyGoal" type="number" min={1} max={200} defaultValue={u.settings?.dailyGoal || 10} className={input} /></label>
            <label className="flex items-center gap-3 font-semibold"><input name="studyReminder" type="checkbox" defaultChecked={u.settings?.studyReminder} className="h-4 w-4 accent-[var(--ink)]" /> Nhắc học hằng ngày</label>
            <label className="flex items-center gap-3 font-semibold"><input name="emailNotifications" type="checkbox" defaultChecked={u.settings?.emailNotifications} className="h-4 w-4 accent-[var(--ink)]" /> Nhận email thông báo</label>
            <button type="submit" disabled={saving} className="btn-ink sm:col-span-2 sm:justify-self-start">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu thay đổi'}</button>
          </form>
        </Card>
        <div className="space-y-6">
          <Card>
            <SectionTitle>Bảo mật</SectionTitle>
            <form onSubmit={changePassword} className="space-y-3">
              {u.hasPassword && <input type="password" autoComplete="current-password" placeholder="Mật khẩu hiện tại" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={input} />}
              <input type="password" autoComplete="new-password" placeholder={u.hasPassword ? 'Mật khẩu mới (≥ 8 ký tự, chữ + số)' : 'Đặt mật khẩu (≥ 8 ký tự, chữ + số)'} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={input} />
              <button type="submit" disabled={!pw.next} className="btn-ink !h-11 disabled:opacity-40">{u.hasPassword ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}</button>
            </form>
            <button onClick={() => window.confirm('Đăng xuất khỏi tất cả thiết bị, kể cả thiết bị này?') && logoutEverywhere()} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-ink-3 hover:text-ink">
              <LogOut className="h-4 w-4" /> Đăng xuất mọi thiết bị
            </button>
          </Card>
          <Card>
            <SectionTitle>Lịch sử XP</SectionTitle>
            <ul className="space-y-2">
              {xp.data?.items.map((x) => (
                <li key={x.id} className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{x.description || 'Nhận XP'}<span className="block text-xs text-ink-3">{relative(x.createdAt)}</span></span>
                  <span className="font-extrabold tabular-nums">+{x.amount}</span>
                </li>
              ))}
              {xp.data?.items.length === 0 && <p className="text-sm text-ink-3">Chưa có XP nào.</p>}
            </ul>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------------------- upgrade */

interface Plans {
  enabled: boolean;
  plans: { id: string; name: string; tier: string; tierName: string; price: number; days: number; tagline: string; features: string[] }[];
}

export function UpgradePage() {
  useDocumentTitle('Nâng cấp');
  const { user } = useAuth();
  const { data, error } = useLoad(() => api.get<Plans>('/payments/plans'));
  const orders = useLoad(() => api.get<{ items: { id: string; planName: string; amount: number; status: string; createdAt: string }[] }>('/payments/orders'));
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (planId: string) => {
    setBusy(planId);
    try {
      const r = await api.post<{ paymentUrl: string }>('/payments/checkout', { planId });
      const url = new URL(r.paymentUrl);
      if (url.protocol !== 'https:') throw new Error('Liên kết thanh toán không hợp lệ');
      window.location.assign(url.toString());
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(null);
    }
  };

  return (
    <Shell>
      <PageHeader eyebrow="Nâng cấp" title={<>Chọn gói <em>vừa sức</em></>} subtitle={<>Bạn đang dùng gói <b>{user?.plan.name}</b>{user?.plan.expiresAt ? ` đến ${date(user.plan.expiresAt)}` : ''}. Thanh toán an toàn qua VNPay; gói được kích hoạt ngay khi ngân hàng xác nhận.</>} />
      {error && <ErrorBox message={error} />}
      {data && !data.enabled && <div className="mb-6"><ErrorBox message="Cổng thanh toán đang được cấu hình. Vui lòng quay lại sau hoặc liên hệ hỗ trợ." /></div>}
      <div className="grid gap-5 lg:grid-cols-3">
        {data?.plans.map((p) => (
          <Card key={p.id} tone={p.tier === 'elite' ? 'lavender' : undefined} className={`flex flex-col !p-7 ${p.id === 'combo' ? 'ring-2 ring-ink' : ''}`}>
            <div className="flex items-center justify-between"><p className="eyebrow !text-ink-2">{p.name} · {p.tierName}</p>{p.id === 'combo' && <span className="sticker !text-sm" style={{ background: 'var(--butter)' }}>Tiết kiệm</span>}</div>
            <p className="display mt-4 text-[3.6rem] normal-case leading-none">{vnd(p.price)}</p>
            <p className="font-semibold text-ink-2">{p.days} ngày · {p.tagline}</p>
            <ul className="mt-6 flex-1 space-y-2.5 border-t border-ink/10 pt-6">
              {p.features.map((f) => <li key={f} className="flex gap-2.5 font-medium"><Check className="mt-0.5 h-4 w-4 shrink-0" />{f}</li>)}
            </ul>
            <button onClick={() => buy(p.id)} disabled={!data.enabled || busy !== null} className="btn-ink mt-8 w-full disabled:opacity-40">{busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Crown className="h-4 w-4" /> Thanh toán</>}</button>
          </Card>
        ))}
      </div>
      {orders.data && orders.data.items.length > 0 && (
        <section className="mt-10">
          <SectionTitle>Lịch sử thanh toán</SectionTitle>
          <ul className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-surface">
            {orders.data.items.map((o) => (
              <li key={o.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                <span className="flex-1 font-bold">{o.planName}<span className="block font-normal text-ink-3">{date(o.createdAt, true)}</span></span>
                <span className="font-bold tabular-nums">{vnd(o.amount)}</span>
                <Pill tone={o.status === 'paid' ? 'lime' : o.status === 'failed' ? 'pink' : 'paper-2'}>{o.status === 'paid' ? 'Thành công' : o.status === 'failed' ? 'Thất bại' : 'Chờ thanh toán'}</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

export function UpgradeResultPage() {
  useDocumentTitle('Kết quả thanh toán');
  const [params] = useSearchParams();
  const { refresh, user } = useAuth();
  const status = params.get('status');
  const ok = status === 'success';
  useLoad(() => refresh(), []);
  return (
    <Shell>
      <Card tone={ok ? 'lime' : 'pink'} className="mx-auto max-w-xl !p-8 text-center">
        {ok ? <CheckCircle2 className="mx-auto h-12 w-12" /> : <XCircle className="mx-auto h-12 w-12" />}
        <p className="display mt-4 text-4xl">{ok ? 'Thanh toán thành công!' : 'Thanh toán chưa hoàn tất'}</p>
        <p className="mt-2 font-semibold text-ink-2">{ok ? `Gói ${user?.plan.name || ''} đã được kích hoạt.` : 'Giao dịch bị hủy hoặc chưa được ngân hàng xác nhận. Bạn chưa bị trừ tiền cho gói này.'}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/dashboard" className="btn-ink">Về trang chính</Link>
          {!ok && <Link to="/upgrade" className="btn-ghost">Thử lại</Link>}
        </div>
      </Card>
    </Shell>
  );
}

/* ---------------------------------------------------------------- support */

export function SupportPage() {
  useDocumentTitle('Hỗ trợ');
  const { data, reload } = useLoad(() => api.get<{ items: { id: string; category: string; message: string; status: string; adminNote: string; createdAt: string }[] }>('/support/feedback'));
  const [category, setCategory] = useState('idea');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const CATS = [['bug', 'Báo lỗi ứng dụng'], ['idea', 'Góp ý tính năng'], ['content', 'Nội dung học'], ['payment', 'Thanh toán'], ['other', 'Khác']];

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) return toast.error('Nội dung quá ngắn');
    setBusy(true);
    try {
      const r = await api.post<{ message: string }>('/support/feedback', { category, message: message.trim() });
      toast.success(r.message);
      setMessage('');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <PageHeader eyebrow="Hỗ trợ & góp ý" title={<>Chúng mình <em>lắng nghe</em></>} subtitle={<>Gặp lỗi hoặc có ý tưởng? Gửi cho đội ngũ QuizMe. Thấy câu hỏi sai đề, hãy dùng nút “Báo lỗi câu hỏi” ngay dưới câu đó.</>} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <form onSubmit={send} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CATS.map(([id, label]) => <button type="button" key={id} onClick={() => setCategory(id)} className={`tag ${category === id ? '!bg-ink !text-paper' : ''}`}>{label}</button>)}
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} rows={6} placeholder="Mô tả chi tiết…" className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-ink" aria-label="Nội dung góp ý" />
            <div className="flex items-center justify-between"><span className="text-xs text-ink-3">{message.length}/2000</span><button type="submit" disabled={busy} className="btn-ink">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gửi'}</button></div>
          </form>
        </Card>
        <Card>
          <SectionTitle>Góp ý đã gửi</SectionTitle>
          {data?.items.length === 0 && <p className="text-sm text-ink-3">Bạn chưa gửi góp ý nào.</p>}
          <ul className="space-y-3">
            {data?.items.map((f) => (
              <li key={f.id} className="rounded-2xl bg-paper p-3 text-sm">
                <div className="flex items-center justify-between"><Pill tone={f.status === 'resolved' ? 'lime' : 'butter'}>{f.status === 'resolved' ? 'Đã phản hồi' : 'Đang xử lý'}</Pill><span className="text-xs text-ink-3">{relative(f.createdAt)}</span></div>
                <p className="mt-2 whitespace-pre-wrap">{f.message}</p>
                {f.adminNote && <p className="mt-2 rounded-xl bg-surface p-2 font-semibold">QuizMe: {f.adminNote}</p>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}

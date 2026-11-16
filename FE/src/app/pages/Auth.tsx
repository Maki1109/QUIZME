import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { AuthError, AuthField, AuthLayout } from '../../components/auth/AuthLayout';
import { useAuth } from '../../lib/auth';
import { api, errorMessage } from '../../lib/api';
import { useDocumentTitle } from '../../lib/hooks';
import type { User } from '../../lib/types';

const afterLogin = (user: User, from?: string) => (!user.onboardingCompleted ? '/onboarding' : from && from.startsWith('/') && !from.startsWith('//') ? from : '/dashboard');

/* ------------------------------------------------------------ Google */

declare global {
  interface Window {
    google?: { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } };
  }
}

let gsiLoading: Promise<void> | null = null;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiLoading) {
    gsiLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gsiLoading = null;
        reject(new Error('gsi'));
      };
      document.head.appendChild(s);
    });
  }
  return gsiLoading;
}

function GoogleButton({ onError }: { onError: (m: string) => void }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ googleClientId: string | null }>('/auth/config')
      .then((c) => setClientId(c.googleClientId))
      .catch(() => setClientId(null));
  }, []);

  useEffect(() => {
    if (!clientId || !ref.current) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: { credential?: string }) => {
            if (!resp.credential) return;
            try {
              const user = await loginWithGoogle(resp.credential);
              navigate(afterLogin(user), { replace: true });
            } catch (err) {
              onError(errorMessage(err));
            }
          },
        });
        window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'vi', width: 320 });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [clientId, loginWithGoogle, navigate, onError]);

  if (!clientId) return null;
  return (
    <div className="mt-6">
      <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-ink-3">
        <span className="h-px flex-1 bg-line" /> hoặc <span className="h-px flex-1 bg-line" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}

function Submit({ busy, children }: { busy: boolean; children: string }) {
  return (
    <button type="submit" disabled={busy} className="btn-ink w-full !h-14 !text-lg disabled:opacity-60">
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
      {!busy && <ArrowRight className="h-5 w-5" />}
    </button>
  );
}

function useGuestOnly() {
  const { user, restoring } = useAuth();
  if (restoring) return null;
  if (user) return <Navigate to={afterLogin(user)} replace />;
  return undefined;
}

/* ------------------------------------------------------------- pages */

export function LoginPage() {
  useDocumentTitle('Đăng nhập');
  const redirect = useGuestOnly();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (redirect !== undefined) return redirect;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Vui lòng nhập email và mật khẩu');
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      navigate(afterLogin(user, (location.state as { from?: string } | null)?.from), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Đăng nhập"
      title={<>Chào mừng <em>trở lại</em></>}
      subtitle="Sổ lỗi sai và lộ trình của bạn vẫn đang chờ."
      footer={<>Chưa có tài khoản? <Link to="/register" className="font-bold text-ink underline underline-offset-4">Tạo tài khoản miễn phí</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <AuthError>{error}</AuthError>}
        <AuthField id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
        <AuthField
          id="password"
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={<Link to="/forgot-password" className="text-sm font-bold text-brand-ink hover:underline">Quên mật khẩu?</Link>}
        />
        <Submit busy={busy}>Đăng nhập</Submit>
      </form>
      <GoogleButton onError={setError} />
    </AuthLayout>
  );
}

const passwordProblem = (p: string) => (p.length < 8 ? 'Mật khẩu cần ít nhất 8 ký tự' : !/[A-Za-z]/.test(p) || !/[0-9]/.test(p) ? 'Mật khẩu cần có cả chữ và số' : '');

export function RegisterPage() {
  useDocumentTitle('Đăng ký');
  const redirect = useGuestOnly();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (redirect !== undefined) return redirect;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.fullName.trim().length < 2) return setError('Vui lòng nhập họ và tên');
    if (!form.email) return setError('Vui lòng nhập email');
    const p = passwordProblem(form.password);
    if (p) return setError(p);
    if (form.password !== form.confirm) return setError('Mật khẩu nhập lại không khớp');
    if (!agree) return setError('Bạn cần đồng ý với điều khoản sử dụng');
    setBusy(true);
    try {
      await register(form.fullName.trim(), form.email.trim(), form.password);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Tạo tài khoản"
      title={<>Bắt đầu <em>miễn phí</em></>}
      subtitle="Mất chưa tới một phút. Không cần thẻ thanh toán."
      footer={<>Đã có tài khoản? <Link to="/login" className="font-bold text-ink underline underline-offset-4">Đăng nhập</Link></>}
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && <AuthError>{error}</AuthError>}
        <AuthField id="fullName" label="Họ và tên" autoComplete="name" value={form.fullName} onChange={set('fullName')} maxLength={80} />
        <AuthField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        <AuthField id="password" label="Mật khẩu" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} hint={<span className="text-xs text-ink-3">≥ 8 ký tự, có chữ và số</span>} />
        <AuthField id="confirm" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
        <label className="flex items-start gap-3 text-sm text-ink-2">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
          Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của QuizMe.
        </label>
        <Submit busy={busy}>Tạo tài khoản</Submit>
      </form>
      <GoogleButton onError={setError} />
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  useDocumentTitle('Quên mật khẩu');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Vui lòng nhập email');
    setBusy(true);
    try {
      const r = await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim() });
      setSent(r.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Quên mật khẩu"
      title={<>Lấy lại <em>quyền truy cập</em></>}
      subtitle="Nhập email đã đăng ký, chúng mình sẽ gửi liên kết đặt lại mật khẩu (hiệu lực 15 phút)."
      footer={<Link to="/login" className="font-bold text-ink underline underline-offset-4">Quay lại đăng nhập</Link>}
    >
      {sent ? (
        <div className="flex items-start gap-3 rounded-2xl bg-lime/60 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-semibold">{sent}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          {error && <AuthError>{error}</AuthError>}
          <AuthField id="email" label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Submit busy={busy}>Gửi liên kết</Submit>
        </form>
      )}
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  useDocumentTitle('Đặt lại mật khẩu');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Keep the one-time token out of the address bar and browser history once it has been read.
  useEffect(() => {
    if (token) window.history.replaceState(null, '', '/reset-password');
  }, [token]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const p = passwordProblem(password);
    if (p) return setError(p);
    if (password !== confirm) return setError('Mật khẩu nhập lại không khớp');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout eyebrow="Mật khẩu mới" title={<>Đặt lại <em>mật khẩu</em></>} footer={<Link to="/login" className="font-bold text-ink underline underline-offset-4">Quay lại đăng nhập</Link>}>
      {!token ? (
        <AuthError>Liên kết không hợp lệ. Hãy yêu cầu một liên kết mới ở trang Quên mật khẩu.</AuthError>
      ) : done ? (
        <div className="flex items-start gap-3 rounded-2xl bg-lime/60 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-semibold">Đã đặt lại mật khẩu. Đang chuyển tới trang đăng nhập…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          {error && <AuthError>{error}</AuthError>}
          <AuthField id="password" label="Mật khẩu mới" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint={<span className="text-xs text-ink-3">≥ 8 ký tự, có chữ và số</span>} />
          <AuthField id="confirm" label="Nhập lại mật khẩu" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Submit busy={busy}>Lưu mật khẩu mới</Submit>
        </form>
      )}
    </AuthLayout>
  );
}

/**
 * Chrome of the signed-in app: translucent sticky header, section navigation,
 * streak / level / coin chips, notifications and the account menu.
 */

import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Coins, Crown, Flame, LifeBuoy, LogOut, Medal, Menu, Shield, ShoppingBag, Trophy, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { relative } from '../lib/format';
import { Wordmark } from '../components/landing/primitives';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

const NAV = [
  { to: '/dashboard', label: 'Hôm nay' },
  { to: '/practice', label: 'Luyện thi' },
  { to: '/error-notebook', label: 'Sổ lỗi sai' },
  { to: '/golden-time', label: 'Thời điểm vàng' },
  { to: '/roadmap', label: 'Lộ trình' },
  { to: '/analytics', label: 'Phân tích' },
];

const FRAME_RING: Record<string, string> = { frame_lime: 'ring-lime', frame_pink: 'ring-pink', frame_gold: 'ring-[#E2BC2A]' };

export function Avatar({ name, src, frame, size = 40 }: { name: string; src?: string | null; frame?: string | null; size?: number }) {
  const initial = (name || 'Q').trim().charAt(0).toUpperCase();
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink font-extrabold text-ink ${frame && FRAME_RING[frame] ? `ring-[3px] ring-offset-2 ring-offset-paper ${FRAME_RING[frame]}` : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {src ? <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : initial}
    </span>
  );
}

interface Notice {
  id: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

function Notifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);

  const load = () =>
    api
      .get<{ items: Notice[]; unread: number }>('/users/me/notifications', { limit: 15 })
      .then((r) => {
        setItems(r.items);
        setUnread(r.unread);
      })
      .catch(() => undefined);

  useEffect(() => {
    load();
  }, [location.pathname]);

  const open = (n: Notice) => {
    if (n.actionUrl && n.actionUrl.startsWith('/')) navigate(n.actionUrl);
  };

  return (
    <DropdownMenu
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen && unread) {
          api.post('/users/me/notifications/read').then(() => {
            setUnread(0);
            setItems((xs) => xs.map((x) => ({ ...x, read: true })));
          });
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink active:scale-90" aria-label={`Thông báo${unread ? ` (${unread} chưa đọc)` : ''}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-3">Chưa có thông báo nào</p>}
        {items.map((n) => (
          <DropdownMenuItem key={n.id} onClick={() => open(n)} className="flex flex-col items-start gap-0.5 py-2">
            <span className={`text-sm ${n.read ? 'font-semibold text-ink-2' : 'font-extrabold text-ink'}`}>{n.title}</span>
            <span className="text-xs text-ink-2">{n.message}</span>
            <span className="text-[11px] text-ink-3">{relative(n.createdAt)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-3.5 py-2 text-[0.92rem] font-bold transition-[background-color,color,transform] duration-200 active:scale-[0.96] active:duration-100 ${isActive ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-ink/5 hover:text-ink'}`;

  const menu = [
    { to: '/profile', label: 'Hồ sơ & cài đặt', icon: UserIcon },
    { to: '/achievements', label: 'Thành tích', icon: Medal },
    { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
    { to: '/shop', label: 'Cửa hàng đổi quà', icon: ShoppingBag },
    { to: '/upgrade', label: 'Nâng cấp gói', icon: Crown },
    { to: '/support', label: 'Hỗ trợ & góp ý', icon: LifeBuoy },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Quản trị', icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Bỏ qua điều hướng
      </a>
      <header className="glass sticky top-0 z-40 shadow-[0_10px_30px_-22px_rgba(85,45,36,0.45)]">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-ink/5 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Mở menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/dashboard" className="text-[1.65rem] leading-none" aria-label="QuizMe — Hôm nay">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Điều hướng chính">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkClass}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link to="/profile" className="inline-flex items-center gap-1.5 rounded-full bg-butter px-3 py-1.5 text-sm font-bold" title="Chuỗi ngày học">
              <Flame className="h-4 w-4 text-brand-ink" />
              <span className="tabular-nums">{user?.streak ?? 0}</span>
            </Link>
            <Link to="/shop" className="hidden items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-sm font-bold sm:inline-flex" title="Xu đổi quà">
              <Coins className="h-4 w-4" />
              <span className="tabular-nums">{user?.coins ?? 0}</span>
            </Link>
            <Link to="/achievements" className="hidden items-center gap-2 rounded-full bg-lavender px-3 py-1.5 text-sm font-bold md:inline-flex" title={`${user?.xpInLevel ?? 0}/${user?.xpForNextLevel ?? 0} XP đến cấp tiếp theo`}>
              <span className="eyebrow !text-[0.72rem] !text-ink">Lv</span>
              <span className="tabular-nums">{user?.level ?? 1}</span>
            </Link>
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand active:scale-90" aria-label="Tài khoản">
                  <Avatar name={user?.name || ''} src={user?.avatar} frame={user?.equippedFrame} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="truncate font-bold text-ink">{user?.name}</p>
                  <p className="truncate text-xs font-normal text-ink-3">{user?.email}</p>
                  <p className="mt-1 text-xs font-semibold text-brand-ink">Gói {user?.plan.name}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {menu.map((m) => (
                  <DropdownMenuItem key={m.to} onClick={() => navigate(m.to)}>
                    <m.icon className="h-4 w-4" /> {m.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {mobileOpen && (
          <nav className="grid gap-1 border-t border-line px-4 py-3 lg:hidden" aria-label="Điều hướng (di động)">
            {[...NAV, ...menu.map((m) => ({ to: m.to, label: m.label }))].map((n) => (
              <NavLink key={n.to} to={n.to} className={linkClass}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className={`mx-auto px-4 py-8 sm:px-6 sm:py-10 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>
        {children}
      </main>
    </div>
  );
}


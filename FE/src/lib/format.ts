export const vnd = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
export const num = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

export function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h} giờ ${m} phút`;
  if (m) return sec ? `${m} phút ${sec} giây` : `${m} phút`;
  return `${sec} giây`;
}

export function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (x: number) => String(x).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function date(value: string | Date | null | undefined, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('vi-VN', withTime ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function relative(value: string | Date | null | undefined) {
  if (!value) return '—';
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  const abs = Math.abs(diff);
  const future = diff < 0;
  let text: string;
  if (abs < 60) text = 'vài giây';
  else if (abs < 3600) text = `${Math.round(abs / 60)} phút`;
  else if (abs < 86400) text = `${Math.round(abs / 3600)} giờ`;
  else text = `${Math.round(abs / 86400)} ngày`;
  return future ? `trong ${text}` : `${text} trước`;
}

export const KIND_LABEL: Record<string, string> = {
  daily: 'Thử thách 5 phút',
  sprint: 'Sprint',
  marathon: 'Marathon',
  ranking: 'Xếp hạng tuần',
  custom: 'Đề tự chọn',
  library: 'Đề thư viện',
  adaptive: 'Luyện thích ứng',
  review: 'Ôn lỗi sai',
  boss: 'Kiểm tra chặng',
  placement: 'Kiểm tra đầu vào',
};

export const tierLabel = (tier: string) => ({ free: 'Cơ bản', premium: 'Premium', elite: 'Elite' })[tier] || tier;

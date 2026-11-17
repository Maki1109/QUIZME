import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * Last line of defence: a render error or a page chunk that fails to load must never leave the
 * user on an empty screen.
 *
 * A failed chunk almost always means a new version was deployed while this tab was open (the old
 * file names no longer exist), so it reloads once to pick up the new build. Anything else shows a
 * short message with a way out.
 */

const RELOAD_KEY = 'quizme:chunk-reload-at';

export const isChunkError = (err: unknown) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|is not a valid JavaScript MIME type/i.test(
    String((err as Error)?.message || err)
  );

/** Reloads the page at most once per minute, so a genuinely broken deploy can't loop forever. */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Storage blocked: still reload once; the browser keeps us from looping within this load.
  }
  window.location.reload();
  return true;
}

interface Props {
  children: ReactNode;
  /** Changing this value clears a caught error (pass the current path so navigating away recovers). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] render error', error, info.componentStack);
    if (isChunkError(error)) reloadForNewVersion();
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunk = isChunkError(error);
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
        <div role="alert" className="w-full max-w-md rounded-[2rem] border border-line bg-surface p-8 text-center shadow-[var(--shadow-soft)]">
          <p className="display text-3xl">{chunk ? 'QuizMe vừa được cập nhật' : 'Có lỗi khi hiển thị trang'}</p>
          <p className="mt-3 text-ink-2">
            {chunk
              ? 'Trang cần tải lại để dùng phiên bản mới. Bài làm đang dở vẫn được lưu trên máy chủ.'
              : 'Bài làm của bạn vẫn được lưu trên máy chủ. Hãy tải lại trang, nếu vẫn lỗi thì quay về trang Hôm nay.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-ink">
              <RotateCw className="h-4 w-4" /> Tải lại trang
            </button>
            {!chunk && (
              <a href="/dashboard" className="btn-ghost">
                Về trang Hôm nay
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
}

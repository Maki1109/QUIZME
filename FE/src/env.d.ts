/// <reference types="vite/client" />

// Thêm các biến môi trường VITE_... bạn sử dụng trong dự án ở đây
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // Add more VITE_ variables here as needed, e.g.
  // readonly VITE_OTHER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

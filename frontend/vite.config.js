import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 개발 중에는 프론트(5173)와 백엔드(8000)를 따로 띄우는데,
    // React 쪽에서 /api/... 로 fetch 하면 자동으로 FastAPI(8000)로 전달해준다.
    // 이렇게 하면 CORS 설정을 따로 안 해도 된다.
    proxy: {
      '/api': 'http://127.0.0.1:8901',
    },
  },
})

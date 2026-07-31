/**
 * 아직 React로 안 옮긴 기존 Jinja2 페이지(/characters/new 같은)로 이동할 때 쓰는 헬퍼.
 *
 * - 개발 중(npm run dev, 5173번 포트)에는 그 페이지가 vite에는 없고 FastAPI(8000)에만
 *   있으므로, 절대주소로 명시해서 이동해야 한다.
 * - 빌드해서 FastAPI가 /app 으로 서빙할 때는 어차피 같은 origin(8000)이므로
 *   절대주소를 안 붙여도 된다 (오히려 안 붙이는 게 안전 - IP/포트가 바뀌어도 안 깨짐).
 *
 * import.meta.env.DEV 는 vite가 자동으로 넣어주는 값으로,
 * `npm run dev` 로 실행 중이면 true, `npm run build` 결과물에서는 false 이다.
 */
const BACKEND_ORIGIN = import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''

export function backendUrl(path) {
  return BACKEND_ORIGIN + path
}

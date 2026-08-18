/**
 * 여러 페이지를 오가야 하니 react-router-dom의 BrowserRouter를 씁니다.
 *
 * basename 이 dev/build에 따라 달라지는 이유:
 * - 개발 중(npm run dev)엔 vite가 5173번 포트의 루트("/")에서 앱을 서빙합니다.
 * - 빌드 후엔 FastAPI가 "/app" 경로 밑에서 서빙합니다 (main.py의 @app.get("/app") 참고).
 * 그래서 라우터가 "지금 내가 어느 경로 밑에 붙어있는지"를 알아야 링크가 안 깨집니다.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import CharacterList from './pages/CharacterList'
import CharactersForm from './pages/forms/CharactersForm'
import CharactersDetail from './pages/details/CharacterDetail'

import GroupList from './pages/GroupList'
import GroupsForm from './pages/forms/GroupsForm'
import GroupDetail from './pages/details/GroupDetail'

import './App.css'

const basename = import.meta.env.DEV ? '/' : '/app'

function App() {
  return (
    <BrowserRouter basename={basename}>
      <div className="app-shell">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/characters" element={<CharacterList />} />
            <Route path="/characters/new" element={<CharactersForm />} />
            <Route path="/characters/:id" element={<CharactersDetail />} />
            <Route path="/characters/:id/edit" element={<CharactersForm />} />


            <Route path="/groups" element={<GroupList />} />
            <Route path="/groups/new" element={<GroupsForm />} />
            <Route path="/groups/:gid" element={<GroupDetail />} />
            <Route path="/groups/:id/edit" element={<GroupsForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App

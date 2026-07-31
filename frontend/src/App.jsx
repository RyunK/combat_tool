import CharacterList from './CharacterList'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>⚔️ 전투 GM 계산기 (React 시범 페이지)</h1>
      </header>
      <main>
        <CharacterList />
      </main>
    </div>
  )
}

export default App

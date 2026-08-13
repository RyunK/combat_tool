/**
 * ===== React 처음 보시는 분을 위한 설명 =====
 *
 * 1. 컴포넌트는 그냥 "화면 조각을 리턴하는 함수"입니다.
 *    아래 CharacterList 함수가 리턴하는 (  <div>...</div>  ) 부분이
 *    JSX 라는 문법인데, HTML처럼 생겼지만 사실 자바스크립트입니다.
 *
 * 2. useState : "이 컴포넌트가 기억해야 할 값"을 선언하는 함수.
 *    const [characters, setCharacters] = useState([])
 *    - characters : 현재 값 (처음엔 빈 배열 [])
 *    - setCharacters : 이 값을 바꿀 때 반드시 써야 하는 함수
 *      (characters = [...] 처럼 직접 대입하면 화면이 안 바뀝니다.
 *       꼭 setCharacters(새값) 형태로 호출해야 리액트가 "아, 다시 그려야겠다"고 압니다.)
 *
 * 3. useEffect : "화면이 처음 떴을 때(또는 특정 값이 바뀔 때) 실행할 코드"
 *    여기서는 "컴포넌트가 처음 나타났을 때 서버에서 캐릭터 목록을 가져온다"는
 *    용도로 씁니다. 기존 Jinja2 버전에서는 서버가 미리 데이터를 채워서
 *    HTML을 보내줬지만, React는 빈 화면을 먼저 띄운 다음 fetch로
 *    데이터를 따로 가져와서 채워넣는 방식입니다.
 *
 * 4. fetch('/api/characters') : 서버(FastAPI)의 routers/api.py 에 있는
 *    GET /api/characters 엔드포인트를 호출합니다. 개발 중엔 vite.config.js의
 *    proxy 설정 덕분에 자동으로 127.0.0.1:8000 (FastAPI)으로 연결됩니다.
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate  } from "react-router-dom";

function CharacterList() {
  // 서버에서 받아온 캐릭터 목록을 담아둘 state
  const [characters, setCharacters] = useState([])
  // 아직 fetch 중인지 여부 (로딩 표시용)
  const [loading, setLoading] = useState(true)
  // fetch가 실패했을 때 에러 메시지를 담아둘 state
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  // [] 를 두 번째 인자로 주면 "컴포넌트가 처음 화면에 나타났을 때 딱 한 번만" 실행됩니다.
  useEffect(() => {
    fetch('/api/characters')
      .then((res) => {
        if (!res.ok) throw new Error('서버 응답 오류: ' + res.status)
        return res.json()
      })
      .then((data) => {
        setCharacters(data)   // 받아온 데이터로 state 갱신 -> 화면이 자동으로 다시 그려짐
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <p className="hint">불러오는 중...</p>
  }

  if (error) {
    return <div className="error">캐릭터 목록을 불러오지 못했습니다: {error}</div>
  }

  return (
    <div>
      <h2>캐릭터 (React 버전) </h2>
      <p className="hint">
        이 페이지는 FastAPI의 <code>/api/characters</code> 를 fetch로 호출해서 그립니다.
      </p>
      <Link to="/characters/new" className="btn btn-primary">새 캐릭터 추가</Link>
      

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>소속 그룹</th>
            <th>유효 스탯</th>
            <th>상태 수</th>
          </tr>
        </thead>
        <tbody>
          {/* 배열을 화면에 뿌릴 땐 .map() 을 씁니다.
              각 항목마다 고유한 key 를 꼭 지정해야 리액트가 어떤 게 바뀌었는지 압니다. */}
          {characters.map((c) => (
            <tr key={c.id} 
              className="row-link"
              onClick={() => navigate(`/characters/${c.id}`)}>
              <td><strong>{c.name}</strong></td>
              <td>
                {c.group_names.map((g) => (
                  <span className="tag" key={g}>{g}</span>
                ))}
              </td>
              <td>
                {Object.entries(c.effective_stats).map(([statName, value]) => (
                  <span className="tag" key={statName}>
                    {statName}: {value.toFixed(1)}
                  </span>
                ))}
              </td>
              <td>{c.status_count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {characters.length === 0 && (
        <p className="hint">아직 캐릭터가 없습니다. 기존 화면(/characters/new)에서 먼저 만들어보세요.</p>
      )}
    </div>
  )
}

export default CharacterList

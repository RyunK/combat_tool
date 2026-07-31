/**
 * 대시보드 페이지. CharacterList.jsx와 거의 같은 패턴입니다:
 * useState 로 데이터 담을 곳 만들고 -> useEffect 로 처음 뜰 때 fetch -> 화면에 그리기.
 *
 * 여기서 새로운 건 backendUrl() 을 써서 "아직 React로 안 옮긴 화면"으로 가는
 * 링크(그룹 만들기, 전투 계산 등)를 거는 부분입니다. CharacterList로 가는 링크만
 * <Link>(react-router)를 씁니다 - 그 페이지는 이미 React로 옮겨졌으니까요.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { backendUrl } from '../utils/backendUrl'

function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('서버 응답 오류: ' + res.status)
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <div className="error">대시보드를 불러오지 못했습니다: {error}</div>
  }
  if (!data) {
    return <p className="hint">불러오는 중...</p>
  }

  return (
    <div>
      <div className="cards">
        <div className="card"><div className="card-num">{data.group_count}</div><div>그룹</div></div>
        <div className="card"><div className="card-num">{data.char_count}</div><div>캐릭터</div></div>
        <div className="card"><div className="card-num">{data.formula_count}</div><div>로드된 공식</div></div>
        <div className="card"><div className="card-num">{data.skill_count}</div><div>로드된 스킬</div></div>
      </div>

      <h2>설치된 모드팩</h2>
      <table>
        <thead>
          <tr><th>이름</th><th>버전</th><th>작성자</th><th>설명</th></tr>
        </thead>
        <tbody>
          {data.manifests.map((m) => (
            <tr key={m.name}>
              <td>{m.name}</td><td>{m.version}</td><td>{m.author}</td><td>{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>빠른 시작</h2>
      <ul className="quick-links">
        <li><a href={backendUrl('/groups/new')}>그룹 만들기</a> (아직 기존 화면)</li>
        <li><Link to="/characters">캐릭터 목록 보기</Link> (React로 옮겨진 화면)</li>
        <li><a href={backendUrl('/combat')}>전투 계산</a> (아직 기존 화면)</li>
      </ul>
    </div>
  )
}

export default Dashboard

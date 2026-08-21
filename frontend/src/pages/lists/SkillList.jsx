import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function SkillList() {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/skills')
      .then((res) => {
        if (!res.ok) throw new Error('서버 응답 오류: ' + res.status)
        return res.json()
      })
      .then((data) => {
        setSkills(data)
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
    return <div className="error">스킬 목록을 불러오지 못했습니다: {error}</div>
  }

  return (
    <div>
      <h2>스킬</h2>
      <p className="hint">
        스킬을 추가하고 관리할 수 있습니다. 각 스킬은 수식 하나를 참조하고, 그 수식의 변수에 채울 값을 정의합니다.
      </p>
      <Link to="/skills/new" className="btn btn-primary">새 스킬 추가</Link>

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>id</th>
            <th>참조 수식</th>
            <th>태그</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr
              key={s.id}
              className="row-link"
              onClick={() => navigate(`/skills/${s.id}`)}
            >
              <td><strong>{s.name}</strong></td>
              <td><span className="tag">{s.id}</span></td>
              <td><code>{s.formula}</code></td>
              <td>
                {(s.tags || []).map((t) => (
                  <span className="tag status" key={t}>{t}</span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {skills.length === 0 && (
        <p className="hint">아직 등록된 스킬이 없습니다. 위 버튼으로 먼저 만들어보세요.</p>
      )}
    </div>
  )
}

export default SkillList
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function FormulaList() {
  const [formulas, setFormulas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/formulas')
      .then((res) => {
        if (!res.ok) throw new Error('서버 응답 오류: ' + res.status)
        return res.json()
      })
      .then((data) => {
        setFormulas(data)
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
    return <div className="error">수식 목록을 불러오지 못했습니다: {error}</div>
  }

  return (
    <div>
      <h2>수식</h2>
      <p className="hint">
        수식을 추가하고 관리할 수 있습니다. 각 수식의 id는 스킬에서 참조됩니다.
      </p>
      <Link to="/formulas/new" className="btn btn-primary">새 수식 추가</Link>

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>id</th>
            <th>수식 내용</th>
            <th>설명</th>
          </tr>
        </thead>
        <tbody>
          {formulas.map((f) => (
            <tr
              key={f.id}
              className="row-link"
              onClick={() => navigate(`/formulas/${f.id}`)}
            >
              <td><strong>{f.name}</strong></td>
              <td><span className="tag">{f.id}</span></td>
              <td><code>{f.expression}</code></td>
              <td className="">{f.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {formulas.length === 0 && (
        <p className="hint">아직 등록된 수식이 없습니다. 위 버튼으로 먼저 만들어보세요.</p>
      )}
    </div>
  )
}

export default FormulaList
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

function SkillDetail() {
  const { id: sid } = useParams()
  const navigate = useNavigate()

  const [skill, setSkill] = useState(null)
  const [formula, setFormula] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/skills/${sid}`)
      .then((res) => {
        if (!res.ok) throw new Error('스킬을 불러오지 못했습니다: ' + res.status)
        return res.json()
      })
      .then((s) => {
        setSkill(s)
        return fetch(`/api/formulas/${s.formula}`)
      })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((f) => {
        setFormula(f)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [sid])

  async function handleDelete() {
    if (!window.confirm('정말 삭제할까요?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/skills/${sid}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('삭제 실패: ' + res.status)
      navigate('/skills')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) return <p className="hint">불러오는 중...</p>
  if (error) return <div className="error">{error}</div>
  if (!skill) return null

  const variableEntries = Object.entries(skill.variables || {})

  return (
    <div>
      <h2>{skill.name}</h2>

      <h3>id</h3>
      <span className="tag">{skill.id}</span>

      <h3>참조 수식</h3>
      {formula ? (
        <p>
          <Link to={`/formulas/${formula.id}`} className="tag">{formula.name}</Link>
          {' '}
          <code>{formula.expression}</code>
        </p>
      ) : (
        <p className="hint">수식 '{skill.formula}' 을(를) 찾을 수 없습니다.</p>
      )}

      <h3>변수</h3>
      {variableEntries.length === 0 ? (
        <p className="hint">정의된 변수가 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr><th>변수명</th><th>값</th></tr>
          </thead>
          <tbody>
            {variableEntries.map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>태그</h3>
      <div>
        {(skill.tags || []).length === 0 && <p className="hint">태그가 없습니다.</p>}
        {(skill.tags || []).map((t) => (
          <span className="tag status" key={t}>{t}</span>
        ))}
      </div>

      <div className="btn-row form-default-row" style={{ marginTop: 20 }}>
        <Link to={`/skills/${sid}/edit`} className="btn btn-primary">수정</Link>
        <button className="btn btn-red" onClick={handleDelete} disabled={deleting}>
          {deleting ? '삭제 중...' : '삭제'}
        </button>
        <Link to="/skills" className="btn btn-secondary">목록으로</Link>
      </div>
    </div>
  )
}

export default SkillDetail
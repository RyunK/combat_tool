import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

function FormulaDetail() {
  const { id: fid } = useParams()
  const navigate = useNavigate()

  const [formula, setFormula] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/formulas/${fid}`)
      .then((res) => {
        if (!res.ok) throw new Error('수식을 불러오지 못했습니다: ' + res.status)
        return res.json()
      })
      .then((f) => {
        setFormula(f)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [fid])

  async function handleDelete() {
    if (!window.confirm('정말 삭제할까요?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/formulas/${fid}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('삭제 실패: ' + res.status)
      navigate('/formulas')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) return <p className="hint">불러오는 중...</p>
  if (error) return <div className="error">{error}</div>
  if (!formula) return null

  return (
    <div>
      <h2>{formula.name}</h2>

      <h3>id</h3>
      <span className="tag">{formula.id}</span>

      <h3>수식 내용</h3>
      <p><code>{formula.expression}</code></p>

      <h3>설명</h3>
      <p className="hint">{formula.description || '설명이 없습니다.'}</p>

      <div className="btn-row form-default-row" style={{ marginTop: 20 }}>
        <Link to={`/formulas/${fid}/edit`} className="btn btn-primary">수정</Link>
        <button className="btn btn-red" onClick={handleDelete} disabled={deleting}>
          {deleting ? '삭제 중...' : '삭제'}
        </button>
        <Link to="/formulas" className="btn btn-secondary">목록으로</Link>
      </div>
    </div>
  )
}

export default FormulaDetail
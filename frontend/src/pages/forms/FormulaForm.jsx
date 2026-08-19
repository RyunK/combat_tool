import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

function FormulaForm() {
  const { id: fid } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(fid)

  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [expression, setExpression] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    fetch(`/api/formulas/${fid}`)
      .then((res) => {
        if (!res.ok) throw new Error('수식을 불러오지 못했습니다: ' + res.status)
        return res.json()
      })
      .then((f) => {
        setId(f.id)
        setName(f.name)
        setExpression(f.expression)
        setDescription(f.description || '')
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [fid, isEdit])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      id: isEdit ? fid : id.trim(),
      name: name.trim(),
      expression: expression.trim(),
      description: description.trim() || null,
    }

    try {
      const res = await fetch(
        isEdit ? `/api/formulas/${fid}` : '/api/formulas',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || '저장 실패: ' + res.status)
      }
      const saved = await res.json()
      navigate(`/formulas/${saved.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <p className="hint">불러오는 중...</p>

  return (
    <div>
      <h2>{isEdit ? '수식 수정' : '새 수식'}</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <h3>id</h3>
        <p className="hint">
          스킬에서 이 수식을 참조할 때 쓰는 고유 값입니다. (예: physical_basic)
        </p>
        <div className="form-default-row">
          <input
            type="text"
            value={isEdit ? fid : id}
            onChange={(e) => setId(e.target.value)}
            disabled={isEdit}
            required
          />
        </div>

        <h3>이름</h3>
        <div className="form-default-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <h3>수식 내용</h3>
        <p className="hint">
          예: max(0, atk * multiplier - def * 0.5)
        </p>
        <div className="form-default-row" style={{ maxWidth: '100%' }}>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            required
          />
        </div>

        <h3>설명</h3>
        <div className="form-default-row" style={{ maxWidth: '100%' }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-actions form-default-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <Link to={isEdit ? `/formulas/${fid}` : '/formulas'} className="btn btn-secondary">
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}

export default FormulaForm
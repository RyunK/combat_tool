import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

const emptyVarRow = () => ({ key: '', value: '' })

function SkillForm() {
  const { id: sid } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(sid)

  const [formulas, setFormulas] = useState([])
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [formulaId, setFormulaId] = useState('')
  const [varRows, setVarRows] = useState([])
  const [tagsText, setTagsText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/formulas')
      .then((res) => res.json())
      .then((fs) => {
        setFormulas(fs)
        if (!isEdit) {
          setLoading(false)
          if (fs.length > 0) setFormulaId(fs[0].id)
        }
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    fetch(`/api/skills/${sid}`)
      .then((res) => {
        if (!res.ok) throw new Error('스킬을 불러오지 못했습니다: ' + res.status)
        return res.json()
      })
      .then((s) => {
        setId(s.id)
        setName(s.name)
        setFormulaId(s.formula)
        setVarRows(
          Object.entries(s.variables || {}).map(([k, v]) => ({ key: k, value: v }))
        )
        setTagsText((s.tags || []).join(', '))
        setLoading(false)
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [sid, isEdit])

  function updateVarRow(idx, field, value) {
    setVarRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  function addVarRow() {
    setVarRows((rows) => [...rows, emptyVarRow()])
  }
  function removeVarRow(idx) {
    setVarRows((rows) => rows.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const variables = {}
    varRows.forEach((r) => {
      if (!r.key.trim()) return
      const num = Number(r.value)
      variables[r.key.trim()] = r.value !== '' && !Number.isNaN(num) ? num : r.value
    })

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const payload = {
      id: isEdit ? sid : id.trim(),
      name: name.trim(),
      formula: formulaId,
      variables,
      tags,
    }

    try {
      const res = await fetch(
        isEdit ? `/api/skills/${sid}` : '/api/skills',
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
      navigate(`/skills/${saved.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <p className="hint">불러오는 중...</p>

  return (
    <div>
      <h2>{isEdit ? '스킬 수정' : '새 스킬'}</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <h3>id</h3>
        <p className="hint">
          다른 곳에서 이 스킬을 참조할 때 쓰는 고유 값입니다. (예: slash)
        </p>
        <div className="form-default-row">
          <input
            type="text"
            value={isEdit ? sid : id}
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

        <h3>참조 수식</h3>
        {formulas.length === 0 ? (
          <p className="hint">등록된 수식이 없습니다. 먼저 수식을 만들어주세요.</p>
        ) : (
          <div className="form-default-row">
            <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)} required>
              {formulas.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
              ))}
            </select>
          </div>
        )}

        <h3>변수</h3>
        <p className="hint">
          수식의 변수명에 대응하는 값을 입력합니다. 숫자면 상수로, 문자면 시전자 스탯 이름으로,
          "target."으로 시작하면 대상 스탯 이름으로 취급됩니다. (예: STR, 1.2, target.DEF)
        </p>
        <div>
          {varRows.map((row, idx) => (
            <div className="form-stat-row" key={idx}>
              <input
                type="text" placeholder="변수명 (예: atk)"
                value={row.key}
                onChange={(e) => updateVarRow(idx, 'key', e.target.value)}
              />
              <input
                type="text" placeholder="값 (예: STR, 1.2, target.DEF)"
                value={row.value}
                onChange={(e) => updateVarRow(idx, 'value', e.target.value)}
              />
              <button type="button" className="btn btn-red" onClick={() => removeVarRow(idx)}>✕</button>
            </div>
          ))}
        </div>
        <div className="form-default-row">
          <button type="button" className="btn btn-secondary" onClick={addVarRow}>+ 변수 추가</button>
        </div>

        <h3>태그</h3>
        <p className="hint">쉼표로 구분해서 입력하세요. (예: magic, fire)</p>
        <div className="form-default-row" style={{ maxWidth: '100%' }}>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="magic, fire"
          />
        </div>

        <div className="form-actions form-default-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <Link to={isEdit ? `/skills/${sid}` : '/skills'} className="btn btn-secondary">
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}

export default SkillForm
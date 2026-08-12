import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

const emptyStatRow = () => ({ name: '', value: '' })

function CharacterForm() {
  const { id: cid } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(cid)

  const [groups, setGroups] = useState([])
  const [name, setName] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [statRows, setStatRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/groups')
      .then((res) => res.json())
      .then((gs) => {
        setGroups(gs)
        if (!isEdit) setLoading(false)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    fetch(`/api/characters/${cid}`)
      .then((res) => {
        if (!res.ok) throw new Error('캐릭터를 불러오지 못했습니다: ' + res.status)
        return res.json()
      })
      .then((c) => {
        setName(c.name)
        setSelectedGroupIds(c.group_ids || [])
        setStatRows(
          Object.entries(c.base_stats || {}).map(([k, v]) => ({ name: k, value: v }))
        )
        setLoading(false)
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [cid, isEdit])

  function handleGroupToggle(gid) {
    const nowChecked = selectedGroupIds.includes(gid)
    const newSelected = nowChecked
      ? selectedGroupIds.filter((id) => id !== gid)
      : [...selectedGroupIds, gid]
    setSelectedGroupIds(newSelected)

    setStatRows((rows) => {
      const haveNames = rows.map((r) => r.name)
      const additions = []
      newSelected.forEach((id) => {
        const g = groups.find((g) => g.id === id)
        if (!g) return
        g.stat_schema.forEach((sd) => {
          if (!haveNames.includes(sd.name) && !additions.some((a) => a.name === sd.name)) {
            additions.push({ name: sd.name, value: sd.default })
          }
        })
      })
      return [...rows, ...additions]
    })
  }

  function updateStatRow(idx, field, value) {
    setStatRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  function addStatRow() {
    setStatRows((rows) => [...rows, emptyStatRow()])
  }
  function removeStatRow(idx) {
    setStatRows((rows) => rows.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const base_stats = {}
    statRows.forEach((r) => {
      if (r.name.trim()) base_stats[r.name] = Number(r.value) || 0
    })

    const payload = {
      id: isEdit ? cid : null,
      name,
      group_ids: selectedGroupIds,
      base_stats,
    }

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('저장 실패: ' + res.status)
      const saved = await res.json()
      navigate(`/characters/${saved.id}`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <p className="hint">불러오는 중...</p>

  return (
    <div>
      <h2>{isEdit ? '캐릭터 수정' : '새 캐릭터'}</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label>캐릭터 이름</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

        <h3>소속 그룹</h3>
        <p className="hint">
          그룹을 선택하면 그 그룹이 요구하는 스탯이 아래 표에 자동으로 추가됩니다.
          (진영 + 역할 등 여러 개 동시 선택 가능)
        </p>
        <div className="group-checks">
          {groups.map((g) => (
            <label className="checkbox-pill" key={g.id}>
              <input
                type="checkbox"
                checked={selectedGroupIds.includes(g.id)}
                onChange={() => handleGroupToggle(g.id)}
              />
              {' '}{g.name} {g.category && <span className="cat">[{g.category}]</span>}
            </label>
          ))}
        </div>

        <h3>스탯</h3>
        <div>
          {statRows.map((row, idx) => (
            <div className="dyn-row" key={idx}>
              <input
                type="text" placeholder="스탯 이름"
                value={row.name}
                onChange={(e) => updateStatRow(idx, 'name', e.target.value)}
              />
              <input
                type="number" step="any" placeholder="값"
                value={row.value}
                onChange={(e) => updateStatRow(idx, 'value', e.target.value)}
              />
              <button type="button" className="btn" onClick={() => removeStatRow(idx)}>✕</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn btn-secondary" onClick={addStatRow}>+ 커스텀 스탯 추가</button>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <Link to="/characters" className="btn btn-secondary">취소</Link>
        </div>
      </form>
    </div>
  )
}

export default CharacterForm
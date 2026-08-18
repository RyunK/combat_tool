import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import './CharactersForm.css'

const emptyStatRow = () => ({ name: '', value: '' })

import {
  emptyStatus,
  STATUS_MODE_OPTIONS,
  STATUS_TIMING_OPTIONS,
  STATUS_NAME_PRESETS,
} from "../../constants/status";

function CharacterForm() {
  const { id: cid } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(cid)

  const [groups, setGroups] = useState([])
  const [name, setName] = useState('')
  const [selectedGroupIds, setSelectedGroupIds] = useState([])
  const [statRows, setStatRows] = useState([])
  const [statusRows, setStatusRows] = useState([])
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
        setStatusRows(
          (c.statuses || []).map((s) => ({
            name: s.name || '',
            target: s.target || '',
            value: s.value || '',
            mode: s.mode || 'fixed',
            timing: s.timing || 'one_time',
            duration: s.duration === null || s.duration === undefined ? '' : s.duration,
            source: s.source || '',
            memo: s.memo || '',
          }))
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

  function updateStatusRow(idx, field, value) {
    setStatusRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  // 이름 변경 전용 핸들러.
  // selectedFromPreset=true로 호출되면(추후 드롭박스 선택 시) STATUS_NAME_PRESETS의
  // 기본값으로 나머지 필드를 채운다. 지금처럼 직접 타이핑할 때는 이름만 바뀌고
  // 나머지 필드는 사용자가 입력한 값 그대로 둔다.
  function handleStatusNameChange(idx, value, selectedFromPreset = false) {
    setStatusRows((rows) => rows.map((r, i) => {
      if (i !== idx) return r
      if (selectedFromPreset && STATUS_NAME_PRESETS[value]) {
        return { ...emptyStatusRow(), ...STATUS_NAME_PRESETS[value], name: value }
      }
      return { ...r, name: value }
    }))
  }

  function addStatusRow() {
    setStatusRows((rows) => [...rows, emptyStatusRow()])
  }
  function removeStatusRow(idx) {
    setStatusRows((rows) => rows.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const base_stats = {}
    statRows.forEach((r) => {
      if (r.name.trim()) base_stats[r.name] = Number(r.value) || 0
    })

    const statuses = statusRows
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name,
        target: r.target,
        value: r.value,
        mode: r.mode,
        duration: r.duration === '' ? null : Number(r.duration),
        timing: r.timing,
        source: r.source,
        memo: r.memo,
      }))

    const payload = {
      id: isEdit ? cid : null,
      name,
      group_ids: selectedGroupIds,
      base_stats,
      statuses,
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
        <h3>캐릭터 이름</h3>
        <div className="form-default-row">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

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
            <div className="form-stat-row" key={idx}>
              <input
                type="text" placeholder="스탯명"
                value={row.name}
                onChange={(e) => updateStatRow(idx, 'name', e.target.value)}
              />
              <input
                type="number" step="any" placeholder="값"
                value={row.value}
                onChange={(e) => updateStatRow(idx, 'value', e.target.value)}
              />
              <button type="button" className="btn btn-red" onClick={() => removeStatRow(idx)}>✕</button>
            </div>
          ))}
        </div>
        <div className="form-default-row">
          <button type="button" className="btn btn-secondary" onClick={addStatRow}>+ 스탯 추가</button>
        </div>

        <h3>상태</h3>
        <div>
          {statusRows.map((row, idx) => (
            <div className="status-entry" key={idx}>
              <div className="status-entry-header">
                {/* <span className="status-entry-title">상태 {idx + 1}</span> */}
              </div>
              <div className="status-entry-grid">
                <label className="status-field">
                  상태명 *
                  <input
                    type="text" placeholder="상태 이름"
                    value={row.name}
                    onChange={(e) => handleStatusNameChange(idx, e.target.value)}
                    required
                  />
                </label>
                <label className="status-field">
                  대상 스탯 *
                  <input
                    type="text" placeholder="효과를 받는 스탯"
                    value={row.target}
                    onChange={(e) => updateStatusRow(idx, 'target', e.target.value)}
                    required
                  />
                </label>
                <label className="status-field">
                  값 *
                  <input
                    type="number" step="any" placeholder=""
                    value={row.value}
                    onChange={(e) => updateStatusRow(idx, 'value', e.target.value)}
                    required
                  />
                </label>
                <label className="status-field">
                  값 적용 방식
                  <select
                    value={row.mode}
                    onChange={(e) => updateStatusRow(idx, 'mode', e.target.value)}
                  >
                    {STATUS_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="status-field">
                  지속시간
                  <input
                    type="number" step="any" placeholder="기본 무한"
                    value={row.duration}
                    onChange={(e) => updateStatusRow(idx, 'duration', e.target.value)}
                  />
                </label>
                <label className="status-field">
                  적용 시점
                  <select
                    value={row.timing}
                    onChange={(e) => updateStatusRow(idx, 'timing', e.target.value)}
                  >
                    {STATUS_TIMING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label className="status-field">
                  상태를 건 주체
                  <input
                    type="text" placeholder="스킬명, 캐릭터명 등"
                    value={row.source}
                    onChange={(e) => updateStatusRow(idx, 'source', e.target.value)}
                  />
                </label>
                <label className="status-field">
                  메모
                  <input
                    type="text" 
                    value={row.memo}
                    onChange={(e) => updateStatusRow(idx, 'memo', e.target.value)}
                  />
                </label>
              </div>
              <div className="status-entry-footer">
                <button type="button" className="btn btn-red" onClick={() => removeStatusRow(idx)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
        <div className="form-default-row">
          <button type="button" className="btn btn-secondary" onClick={addStatusRow}>+ 상태 추가</button>
        </div>

        <div className="form-actions form-default-row">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
          <Link to={isEdit ? `/characters/${cid}` : '/characters'} className="btn btn-secondary">취소</Link>
        </div>
      </form>
    </div>
  )
}

export default CharacterForm

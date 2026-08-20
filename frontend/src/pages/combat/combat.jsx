import { useEffect, useState, useCallback } from 'react'
import { backendUrl } from '../../utils/backendUrl'

let _uid = 0
function uid(prefix) {
  _uid += 1
  return `${prefix}-${Date.now()}-${_uid}`
}

function emptyRow() {
  return {
    id: uid('row'),
    casterId: '',
    targetId: '',
    skillId: '',
    // 계산 결과 (판정 이후 채워짐)
    expression: null,
    result: null,
    error: null,
    loading: false,
  }
}

function emptyTeam(name) {
  return {
    id: uid('team'),
    name,
    rows: [emptyRow()],
  }
}

function Combat() {
  const [characters, setCharacters] = useState([])
  const [skills, setSkills] = useState([])
  const [metaLoading, setMetaLoading] = useState(true)
  const [metaError, setMetaError] = useState(null)

  const [teams, setTeams] = useState([emptyTeam('팀1')])

  useEffect(() => {
    let cancelled = false
    async function loadMeta() {
      setMetaLoading(true)
      setMetaError(null)
      try {
        const res = await fetch(backendUrl('/combat/api/meta'))
        if (!res.ok) throw new Error(`메타 정보를 불러오지 못했습니다 (${res.status})`)
        const data = await res.json()
        if (cancelled) return
        setCharacters(data.characters || [])
        setSkills(data.skills || [])
      } catch (e) {
        if (!cancelled) setMetaError(e.message || String(e))
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    }
    loadMeta()
    return () => { cancelled = true }
  }, [])

  // ------------------------------------------------------------ 팀 관리
  const addTeam = useCallback(() => {
    setTeams(prev => [...prev, emptyTeam(`팀${prev.length + 1}`)])
  }, [])

  const removeTeam = useCallback((teamId) => {
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }, [])

  const renameTeam = useCallback((teamId, name) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, name } : t))
  }, [])

  // ------------------------------------------------------------ 행(캐릭터/대상/스킬) 관리
  const addRow = useCallback((teamId) => {
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, rows: [...t.rows, emptyRow()] } : t))
  }, [])

  const removeRow = useCallback((teamId, rowId) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t
      const rows = t.rows.filter(r => r.id !== rowId)
      return { ...t, rows: rows.length > 0 ? rows : [emptyRow()] }
    }))
  }, [])

  const updateRow = useCallback((teamId, rowId, field, value) => {
    setTeams(prev => prev.map(t => {
      if (t.id !== teamId) return t
      return {
        ...t,
        rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: value } : r),
      }
    }))
  }, [])

  // ------------------------------------------------------------ 판정 (팀 전체 배치 계산)
  const judgeTeam = useCallback(async (teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    setTeams(prev => prev.map(t => t.id !== teamId ? t : {
      ...t,
      rows: t.rows.map(r => ({ ...r, loading: true, error: null })),
    }))

    const items = team.rows.map(r => ({
      id: r.id,
      caster_id: r.casterId || null,
      target_id: r.targetId || null,
      skill_id: r.skillId || null,
    }))

    try {
      const res = await fetch(backendUrl('/combat/api/execute-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error(`계산 요청에 실패했습니다 (${res.status})`)
      const data = await res.json()
      const byId = Object.fromEntries((data.results || []).map(r => [r.id, r]))

      setTeams(prev => prev.map(t => t.id !== teamId ? t : {
        ...t,
        rows: t.rows.map(r => {
          const found = byId[r.id]
          if (!found) return { ...r, loading: false, error: '결과를 받지 못했습니다.' }
          return {
            ...r,
            loading: false,
            expression: found.expression,
            result: found.result,
            error: found.error,
          }
        }),
      }))
    } catch (e) {
      const message = e.message || String(e)
      setTeams(prev => prev.map(t => t.id !== teamId ? t : {
        ...t,
        rows: t.rows.map(r => ({ ...r, loading: false, error: message })),
      }))
    }
  }, [teams])

  if (metaLoading) {
    return (
      <section>
        <h2>전투 계산</h2>
        <p className="hint">캐릭터/스킬 목록을 불러오는 중...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>전투 계산</h2>
      <p className="hint">
        팀별로 캐릭터·대상·스킬 조합을 등록하고, '판정' 버튼으로 팀의 모든 스킬을 한 번에 계산합니다.
      </p>

      {metaError && <div className="error">{metaError}</div>}

      {teams.map(team => (
        <TeamTable
          key={team.id}
          team={team}
          characters={characters}
          skills={skills}
          onRename={(name) => renameTeam(team.id, name)}
          onJudge={() => judgeTeam(team.id)}
          onRemoveTeam={() => removeTeam(team.id)}
          onAddRow={() => addRow(team.id)}
          onRemoveRow={(rowId) => removeRow(team.id, rowId)}
          onUpdateRow={(rowId, field, value) => updateRow(team.id, rowId, field, value)}
          canRemoveTeam={teams.length > 1}
        />
      ))}

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-secondary" onClick={addTeam}>
          + 팀 추가
        </button>
      </div>
    </section>
  )
}

function TeamTable({
  team, characters, skills,
  onRename, onJudge, onRemoveTeam,
  onAddRow, onRemoveRow, onUpdateRow,
  canRemoveTeam,
}) {
  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(team.name)

  const commitName = () => {
    const trimmed = draftName.trim()
    onRename(trimmed || team.name)
    setEditingName(false)
  }

  const anyLoading = team.rows.some(r => r.loading)

  return (
    <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
      {/* 표 왼쪽 위: 팀 이름 / 오른쪽 끝: 판정 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        {editingName ? (
          <input
            type="text"
            value={draftName}
            autoFocus
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName() }}
            style={{ maxWidth: 220 }}
          />
        ) : (
          <h3
            style={{ margin: 0, cursor: 'pointer' }}
            title="클릭해서 팀 이름 변경"
            onClick={() => { setDraftName(team.name); setEditingName(true) }}
          >
            {team.name}
          </h3>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={onJudge}
          disabled={anyLoading}
        >
          {anyLoading ? '계산 중...' : '판정'}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>캐릭터</th>
            <th>대상</th>
            <th>스킬</th>
            <th>계산식</th>
            <th>결과</th>
            <th style={{ width: 36 }}></th>
          </tr>
        </thead>
        <tbody>
          {team.rows.map(row => (
            <tr key={row.id}>
              <td>
                <select
                  value={row.casterId}
                  onChange={e => onUpdateRow(row.id, 'casterId', e.target.value)}
                >
                  <option value="">-- 캐릭터 --</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={row.targetId}
                  onChange={e => onUpdateRow(row.id, 'targetId', e.target.value)}
                >
                  <option value="">-- 대상 --</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={row.skillId}
                  onChange={e => onUpdateRow(row.id, 'skillId', e.target.value)}
                >
                  <option value="">-- 스킬 --</option>
                  {skills.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.pack ? ` (${s.pack})` : ''}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {row.loading ? (
                  <span className="hint">계산 중...</span>
                ) : row.error ? (
                  <span className="tag status">{row.error}</span>
                ) : row.expression ? (
                  <code>{row.expression}</code>
                ) : (
                  <span className="hint">-</span>
                )}
              </td>
              <td>
                {row.loading ? (
                  '-'
                ) : row.error ? (
                  '-'
                ) : row.result !== null && row.result !== undefined ? (
                  <strong>{Number(row.result).toFixed(2)}</strong>
                ) : (
                  <span className="hint">-</span>
                )}
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-secondary"
                  title="이 행 삭제"
                  onClick={() => onRemoveRow(row.id)}
                  style={{ padding: '3px 8px' }}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={onAddRow}>
          + 행 추가
        </button>

        {canRemoveTeam && (
          <button
            type="button"
            className="btn btn-red"
            title="팀 삭제"
            onClick={onRemoveTeam}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default Combat
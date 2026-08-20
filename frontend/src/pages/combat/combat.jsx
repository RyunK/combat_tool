import { useEffect, useState, useCallback } from 'react'
import { backendUrl } from '../../utils/backendUrl'
import TeamTable from '../../components/Teamtable'

let _uid = 0
function uid(prefix) {
  _uid += 1
  return `${prefix}-${Date.now()}-${_uid}`
}

function emptyRow() {
  return {
    id: uid('row'),
    casterId: '',
    targetIds: [],
    skillId: '',
    // 판정 이후 채워지는, 대상별 계산 결과 목록
    results: [],
    rowError: null,
    loading: false,
  }
}

function emptyTeam(name) {
  return {
    id: uid('team'),
    name,
    rows: [emptyRow()],
    saving: false,
    saveError: null,
  }
}

// 저장된 팀(GET /combat/api/teams 응답 하나)을 화면에서 쓰는 팀 형태로 변환.
// 요구사항: 팀 이름 + 각 행의 캐릭터(대상/스킬은 비워둔 채)만 불러오면 됨.
function teamFromSaved(saved) {
  const chars = saved.characters || []
  const rows = chars.length > 0
    ? chars.map(c => ({ ...emptyRow(), casterId: c.id }))
    : [emptyRow()]
  return {
    id: saved.id,
    name: saved.name,
    rows,
    saving: false,
    saveError: null,
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
    async function loadAll() {
      setMetaLoading(true)
      setMetaError(null)
      try {
        const [metaRes, teamsRes] = await Promise.all([
          fetch(backendUrl('/combat/api/meta')),
          fetch(backendUrl('/combat/api/teams')),
        ])
        if (!metaRes.ok) throw new Error(`메타 정보를 불러오지 못했습니다 (${metaRes.status})`)
        const metaData = await metaRes.json()
        if (cancelled) return
        setCharacters(metaData.characters || [])
        setSkills(metaData.skills || [])

        if (teamsRes.ok) {
          const savedTeams = await teamsRes.json()
          if (cancelled) return
          setTeams(
            Array.isArray(savedTeams) && savedTeams.length > 0
              ? savedTeams.map(teamFromSaved)
              : [emptyTeam('팀1')]
          )
        } else {
          // 저장된 팀 목록을 못 가져와도, 계산 기능 자체는 그대로 쓸 수 있게 기본 팀으로 시작
          setTeams([emptyTeam('팀1')])
        }
      } catch (e) {
        if (!cancelled) {
          setMetaError(e.message || String(e))
          setTeams([emptyTeam('팀1')])
        }
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    }
    loadAll()
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

  // ------------------------------------------------------------ 팀 저장
  const saveTeam = useCallback(async (teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    setTeams(prev => prev.map(t => t.id !== teamId ? t : { ...t, saving: true, saveError: null }))

    // 백엔드 TeamIn은 팀 이름 + 캐릭터 id 목록만 받으므로, 각 행의 '캐릭터' 칸만 모은다.
    const characterIds = team.rows.map(r => r.casterId).filter(Boolean)

    try {
      const res = await fetch(backendUrl('/combat/api/teams'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: team.id,
          name: team.name,
          character_ids: characterIds,
        }),
      })
      if (!res.ok) throw new Error(`팀 저장에 실패했습니다 (${res.status})`)
      const saved = await res.json()

      setTeams(prev => prev.map(t => t.id !== teamId ? t : {
        ...t,
        id: saved.id, // 새로 만든 팀이면 서버가 내려준 id로 맞춰서, 다음 저장부터는 같은 팀을 덮어쓰게 함
        saving: false,
        saveError: null,
      }))
    } catch (e) {
      const message = e.message || String(e)
      setTeams(prev => prev.map(t => t.id !== teamId ? t : { ...t, saving: false, saveError: message }))
    }
  }, [teams])

  // ------------------------------------------------------------ 판정 (팀 전체 배치 계산)
  const judgeTeam = useCallback(async (teamId) => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return

    setTeams(prev => prev.map(t => t.id !== teamId ? t : {
      ...t,
      rows: t.rows.map(r => ({ ...r, loading: true, rowError: null })),
    }))

    // 대상을 여러 명 선택한 행은 대상 수만큼 배치 아이템으로 펼친다.
    // 대상을 하나도 안 골랐으면(검증 에러를 그대로 보여주기 위해) null 하나로 펼친다.
    const items = []
    team.rows.forEach(r => {
      const targetIds = r.targetIds.length > 0 ? r.targetIds : [null]
      targetIds.forEach(targetId => {
        items.push({
          id: `${r.id}::${targetId ?? '_empty'}`,
          rowId: r.id,
          targetId,
          caster_id: r.casterId || null,
          target_id: targetId || null,
          skill_id: r.skillId || null,
        })
      })
    })

    try {
      const res = await fetch(backendUrl('/combat/api/execute-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, caster_id, target_id, skill_id }) => ({ id, caster_id, target_id, skill_id })),
        }),
      })
      if (!res.ok) throw new Error(`계산 요청에 실패했습니다 (${res.status})`)
      const data = await res.json()
      const byId = Object.fromEntries((data.results || []).map(r => [r.id, r]))

      setTeams(prev => prev.map(t => t.id !== teamId ? t : {
        ...t,
        rows: t.rows.map(r => {
          const rowItems = items.filter(it => it.rowId === r.id)
          const results = rowItems.map(it => {
            const found = byId[it.id]
            if (!found) {
              return { targetId: it.targetId, targetName: null, expression: null, result: null, error: '결과를 받지 못했습니다.' }
            }
            return {
              targetId: it.targetId,
              targetName: found.target_name,
              expression: found.expression,
              result: found.result,
              error: found.error,
            }
          })
          return { ...r, loading: false, results }
        }),
      }))
    } catch (e) {
      const message = e.message || String(e)
      setTeams(prev => prev.map(t => t.id !== teamId ? t : {
        ...t,
        rows: t.rows.map(r => ({ ...r, loading: false, rowError: message })),
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
          onSave={() => saveTeam(team.id)}
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

export default Combat
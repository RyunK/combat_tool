import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { STATUS_MODE_OPTIONS, STATUS_TIMING_OPTIONS } from '../../constants/status'

const modeLabel = (mode) =>
  STATUS_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode

const timingLabel = (timing) =>
  STATUS_TIMING_OPTIONS.find((o) => o.value === timing)?.label ?? timing ?? '-'

function CharacterDetail() {
  const { id: cid } = useParams()
  const navigate = useNavigate()

  const [character, setCharacter] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/api/characters/${cid}`).then((res) => {
        if (!res.ok) throw new Error('캐릭터를 불러오지 못했습니다: ' + res.status)
        return res.json()
      }),
      fetch('/api/groups').then((res) => res.json()),
    ])
      .then(([c, gs]) => {
        setCharacter(c)
        setGroups(gs)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [cid])

  async function handleDelete() {
    if (!window.confirm('정말 삭제할까요?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/characters/${cid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패: ' + res.status)
      navigate('/characters')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) return <p className="hint">불러오는 중...</p>
  if (error) return <div className="error">{error}</div>
  if (!character) return null

  const groupNames = (character.group_ids || [])
    .map((gid) => groups.find((g) => g.id === gid))
    .filter(Boolean)

  const statEntries = Object.entries(character.base_stats || {})
  const statuses = character.statuses || []

  return (
    <div>
      <h2>{character.name}</h2>

      <h3>소속 그룹</h3>
      <div>
        {groupNames.length === 0 && <p className="hint">소속된 그룹이 없습니다.</p>}
        {groupNames.map((g) => (
          <span className="tag" key={g.id}>
            {g.name}{g.category ? ` [${g.category}]` : ''}
          </span>
        ))}
      </div>

      <h3>스탯</h3>
      {statEntries.length === 0 ? (
        <p className="hint">등록된 스탯이 없습니다.</p>
      ) : (
        <table className="stat-table">
          <thead>
            <tr><th>이름</th><th>값</th></tr>
          </thead>
          <tbody>
            {statEntries.map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>상태</h3>
      {statuses.length === 0 ? (
        <p className="hint">현재 적용된 상태가 없습니다.</p>
      ) : (
        <table className="status-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>대상</th>
              <th>값</th>
              <th>적용 방식</th>
              <th>지속시간</th>
              <th>적용 시점</th>
              <th>주체</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s, i) => (
              <tr key={s.id ?? i}>
                <td>{s.name}</td>
                <td>{s.target}</td>
                <td>{s.value}{s.mode === 'percent' ? '%' : ''}</td>
                <td>{modeLabel(s.mode)}</td>
                <td>{s.duration === null || s.duration === undefined || s.duration === '' ? '무한' : s.duration}</td>
                <td>{timingLabel(s.timing)}</td>
                <td>{s.source || '-'}</td>
                <td>{s.memo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="btn-row form-default-row" style={{ marginTop: 20 }}>
        <Link to={`/characters/${cid}/edit`} className="btn btn-primary">수정</Link>
        <button className="btn btn-red" onClick={handleDelete} disabled={deleting}>
          {deleting ? '삭제 중...' : '삭제'}
        </button>
        <Link to="/characters" className="btn btn-secondary">목록으로</Link>
      </div>
    </div>
  )
}

export default CharacterDetail
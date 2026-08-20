import { useState } from 'react'
import Dropdown from './Dropdown'

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

  const characterOptions = characters.map(c => ({ id: c.id, name: c.name }))
  const skillOptions = skills.map(s => ({
    id: s.id,
    name: s.name + (s.pack ? ` (${s.pack})` : ''),
  }))

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
            {team.name} <span className="hint">...<i class="fa-solid fa-pen"></i></span>
          </h3>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={onJudge}
          disabled={anyLoading}
        >
          {anyLoading ? '계산 중...' : '계산하기'}
        </button>
      </div>

      <table className="team-table">
        <colgroup>
          {/* 캐릭터 */}
          <col style={{ width: '18%' }} />
          {/* 대상 */}
          <col style={{ width: '18%' }} />
          {/* 스킬 */}
          <col style={{ width: '18%' }} />
          {/* 계산식 */}
          <col style={{ width: '26%' }} />
          {/* 결과 */}
          <col style={{ width: '13%' }} />
          {/* x 버튼 */}
          <col style={{ width: '30px' }} />
        </colgroup>
        <thead>
          <tr>
            <th>캐릭터</th>
            <th>대상</th>
            <th>스킬</th>
            <th>계산식</th>
            <th>결과</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {team.rows.map(row => (
            <tr key={row.id}>
              <td>
                <Dropdown
                  value={row.casterId}
                  options={characterOptions}
                  onChange={val => onUpdateRow(row.id, 'casterId', val)}
                  placeholder="-- 캐릭터 --"
                />
              </td>
              <td>
                <Dropdown
                  multiple
                  values={row.targetIds}
                  options={characterOptions}
                  onChange={vals => onUpdateRow(row.id, 'targetIds', vals)}
                  placeholder="-- 대상 --"
                />
              </td>
              <td>
                <Dropdown
                  value={row.skillId}
                  options={skillOptions}
                  onChange={val => onUpdateRow(row.id, 'skillId', val)}
                  placeholder="-- 스킬 --"
                />
              </td>
              <td>
                {row.loading ? (
                  <span className="hint">계산 중...</span>
                ) : row.rowError ? (
                  <span className="tag status">{row.rowError}</span>
                ) : row.results.length === 0 ? (
                  <span className="hint">-</span>
                ) : (
                  <div className="result-lines">
                    {row.results.map((res, idx) => (
                      <div className="result-line" key={idx}>
                        {res.error ? (
                          <span className="tag status">{res.error}</span>
                        ) : res.expression ? (
                          <code>{res.expression}</code>
                        ) : (
                          <span className="hint">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </td>
              <td>
                {row.loading ? (
                  '-'
                ) : row.rowError ? (
                  '-'
                ) : row.results.length === 0 ? (
                  <span className="hint">-</span>
                ) : (
                  <div className="result-lines">
                    {row.results.map((res, idx) => (
                      <div className="result-line" key={idx}>
                        {res.error ? (
                          '-'
                        ) : res.result !== null && res.result !== undefined ? (
                          <>
                            {row.targetIds.length > 1 && res.targetName && (
                              <span className="hint" style={{ marginRight: 4 }}>{res.targetName}:</span>
                            )}
                            <strong>{Number(res.result).toFixed(2)}</strong>
                          </>
                        ) : (
                          <span className="hint">-</span>
                        )}
                      </div>
                    ))}
                  </div>
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
            팀 삭제
          </button>
        )}
      </div>
    </div>
  )
}

export default TeamTable
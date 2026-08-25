/* =========================================================
   크리티컬 규칙 하나(확률 또는 추가값)를 표현하는 재사용 블록
   - mode: 'formula' | 'table'
   - 수식 모드: 자유 입력 텍스트박스 (예: "힘^2+민첩^2")
   - 표 모드: 조건 | 값 표, 행 추가/삭제 가능
   ========================================================= */
export default function RuleBlock({ rule, onChange, valueLabel = '%' }) {
  const { mode, formula, rows } = rule

  const setMode = (mode) => onChange({ ...rule, mode })
  const setFormula = (formula) => onChange({ ...rule, formula })

  const setRow = (idx, key, value) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    onChange({ ...rule, rows: next })
  }

  const addRow = () => {
    onChange({ ...rule, rows: [...rows, { condition: '', value: '' }] })
  }

  const removeRow = (idx) => {
    onChange({ ...rule, rows: rows.filter((_, i) => i !== idx) })
  }

  return (
    <div>
      <div className="form-default-row" style={{ maxWidth: 220 }}>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="table">표</option>
          <option value="formula">수식</option>
        </select>
      </div>

      {mode === 'formula' ? (
        <div className="form-default-row" style={{ maxWidth: 400 }}>
          <input
            type="text"
            placeholder="예: 힘^2+민첩^2"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
          />
          <span className="text" style={{ alignSelf: 'center' }}>{valueLabel}</span>
        </div>
      ) : (
        <>
          <table className="stat-table">
            <thead>
              <tr>
                <th>조건</th>
                <th>{valueLabel}</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      placeholder="예: 힘 = 1"
                      value={row.condition}
                      onChange={(e) => setRow(idx, 'condition', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="예: 5"
                      value={row.value}
                      onChange={(e) => setRow(idx, 'value', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-red"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => removeRow(idx)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="btn-row" style={{ marginBottom: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={addRow}>
              + 행 추가
            </button>
          </div>
        </>
      )}
    </div>
  )
}
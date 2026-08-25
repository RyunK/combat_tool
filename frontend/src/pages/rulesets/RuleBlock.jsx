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

  const MODES = [
    { key: 'table', label: '표' },
    { key: 'formula', label: '수식' },
  ]

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
      <div className="btn-row" style={{ marginBottom: 12 }}>
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            className={mode === m.key ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
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
          <table className="crt-table">
            <thead>
              <tr>
                <th>조건</th>
                <th>{valueLabel}</th>
                <th style={{ width: 90 }}></th>
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
                      onClick={() => removeRow(idx)}
                    >
                      ✕
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
import { useState } from 'react'
import RuleBlock from './RuleBlock'

/* =========================================================
   크리티컬 탭
   ========================================================= */
export default function CriticalTab() {
  const [probability, setProbability] = useState({
    mode: 'table',
    formula: '',
    rows: [
      { condition: '힘 = 1', value: '5' },
      { condition: '힘 = 2', value: '10' },
      { condition: '힘 = 3', value: '13' },
    ],
  })

  const [extraType, setExtraType] = useState('add') // 'add' | 'multiply'
  const [extra, setExtra] = useState({
    mode: 'table',
    formula: '',
    rows: [{ condition: '', value: '' }],
  })

  return (
    <div>
      <h2>크리티컬 적용 규칙</h2>

      <h3>크리티컬 확률</h3>
      <RuleBlock rule={probability} onChange={setProbability} valueLabel="%" />

      <h3 style={{ marginTop: 24 }}>크리티컬 추가값</h3>
      <div className="form-default-row" style={{ maxWidth: 220 }}>
        <select value={extraType} onChange={(e) => setExtraType(e.target.value)}>
          <option value="add">추가값</option>
          <option value="multiply">배수</option>
        </select>
      </div>
      <RuleBlock
        rule={extra}
        onChange={setExtra}
        valueLabel={extraType === 'multiply' ? '배' : '값'}
      />
    </div>
  )
}
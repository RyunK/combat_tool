import { useState } from 'react'
import RuleBlock from './RuleBlock'
import { backendUrl } from '../../utils/backendUrl'

/* --------------------------------------------------------
   백엔드 전송
   -------------------------------------------------------- */

export async function postCrit(crit) {
  const payload = crit
  const res = await fetch(backendUrl('/order'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error('저장에 실패했습니다.')
  }
  return res.json()
}


/* =========================================================
   크리티컬 탭
   ========================================================= */
export default function CriticalTab() {
  const [probability, setProbability] = useState({
    mode: 'table',
    formula: '',
    rows: [
      { condition: '', value: '' },
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
      <RuleBlock rule={probability} 
        onChange={setProbability} 
        valueLabel="%" 
      />

      <h3 style={{ marginTop: 24 }}>크리티컬 추가값</h3>
      <div className="btn-row" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={extraType === 'add' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setExtraType('add')}
        >
          추가값
        </button>
        <button
          type="button"
          className={extraType === 'multiply' ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={() => setExtraType('multiply')}
        >
          배수
        </button>
      </div>
      <RuleBlock
        rule={extra}
        onChange={setExtra}
        valueLabel={extraType === 'multiply' ? '배' : '값'}
      />
    </div>
  )
}
import { useState } from 'react'
import CriticalTab from './Criticaltab'
import TagTab from './Tagtab'
import OrderTab from './Ordertab'
import './Rulesets.css'


const TABS = [
  { key: 'critical', label: '크리티컬', Component: CriticalTab },
  { key: 'tag', label: '태그', Component: TagTab },
  { key: 'order', label: '계산 순서', Component: OrderTab },
]

export default function Ruleset() {
  const [activeTab, setActiveTab] = useState('critical')
  const ActiveComponent = TABS.find((tab) => tab.key === activeTab).Component
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await postOrder(blocks)
    } catch (err) {
      setSaveError(err.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="btn-row" style={{ marginBottom: 20 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent />

      <div className="btn-row" >
        <button type="button" className="btn btn-green" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {saveError && <div className="error">{saveError}</div>}
    </div>
  )
}
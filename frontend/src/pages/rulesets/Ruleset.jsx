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

      <button
        // key={tab.key}
        type="button"
        className={'btn btn-red'}
        // onClick={() => setActiveTab(tab.key)}
      >
        저장
      </button>
    </div>
  )
}
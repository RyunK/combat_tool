import { useState, useRef } from 'react'
// TODO: 실제 프로젝트 폴더 구조에 맞게 경로 조정 (Nav.jsx 참고)
import { backendUrl } from '../../utils/backendUrl'

/* =========================================================
   계산 순서 탭
   - 기본 3블럭(모든 상태 적용 / 모든 스킬 선언 및 판정 / 모든 스킬 결과 적용)
   - 상태 블럭 / 스킬 판정 블럭 / 결과 적용 블럭을 추가로 넣을 수 있음
   - 블럭은 "확인"을 눌러야 확정되고, 확정된 블럭은 기본 블럭과 같은
     디자인으로 보여짐. 확정된 블럭을 다시 클릭하면 수정 모드로 돌아감.
   - 드래그로 순서 변경
   - buildOrderPayload / postOrder: 백엔드 저장용 직렬화 & POST 함수
   ========================================================= */

let nextId = 1
const genId = () => nextId++

const FIXED_LABELS = {
  stateAll: '모든 상태 적용',
  skillCheckAll: '모든 스킬 선언 및 판정',
  resultAll: '모든 스킬 결과 적용',
}

const BASE_BLOCKS = () => [
  { id: genId(), kind: 'stateAll' },
  { id: genId(), kind: 'skillCheckAll' },
  { id: genId(), kind: 'resultAll' },
]

const BLOCK_TYPES = [
  { kind: 'state', label: '상태 적용' },
  { kind: 'skillCheck', label: '선언 및 판정' },
  { kind: 'skillResult', label: '결과 적용' },
]

function makeBlock(kind) {
  return {
    id: genId(),
    kind,
    confirmed: false,
    target: '그룹',
    targetName: '',
    particle: '의',
    detail: '',
  }
}

function tailLabelOf(kind) {
  if (kind === 'state') return '적용'
  if (kind === 'skillCheck') return '선언 및 판정'
  return '결과 적용'
}

function detailPlaceholderOf(kind) {
  return kind === 'state' ? '상태 종류' : '스킬명 혹은 태그'
}

/* 확정된 블럭을 문장으로 보여주기 위한 요약 라벨 */
function summaryLabel(block) {
  const target = block.targetName ? `${block.target} ${block.targetName}` : block.target
  if (block.kind === 'state') {
    return `${target} 의 ${block.detail || '(상태 종류)'} 적용`
  }
  return `${target} ${block.particle} ${block.detail || '(스킬명 혹은 태그)'} ${tailLabelOf(block.kind)}`
}

/* --------------------------------------------------------
   백엔드 전송용 직렬화
   -------------------------------------------------------- */
function serializeBlock(block, order) {
  if (block.kind === 'stateAll' || block.kind === 'skillCheckAll' || block.kind === 'resultAll') {
    return { order, kind: block.kind }
  }
  return {
    order,
    kind: block.kind,
    target: block.target,
    targetName: block.targetName,
    particle: block.particle,
    detail: block.detail,
  }
}

export function buildOrderPayload(blocks) {
  return { blocks: blocks.map((b, idx) => serializeBlock(b, idx)) }
}

export async function postOrder(blocks) {
  const payload = buildOrderPayload(blocks)
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

/* --------------------------------------------------------
   블럭 한 줄 렌더링
   -------------------------------------------------------- */
function BlockRow({ block, onChange, onRemove, onConfirm, onEditAgain }) {
  const isFixed =
    block.kind === 'stateAll' || block.kind === 'skillCheckAll' || block.kind === 'resultAll'

  if (isFixed) {
    return (
      <div className="default-container order-container confirmed-box">
        <span className="text" style={{ fontWeight: 700 }}>{FIXED_LABELS[block.kind]}</span>
      </div>
    )
  }

  if (block.confirmed) {
    return (
      <div className="default-container order-container confirmed-box" style={{ cursor: 'pointer' }} onClick={onEditAgain}>
        <span className="text" style={{ fontWeight: 700 }}>{summaryLabel(block)}</span>
      </div>
    )
  }

  const set = (key, value) => onChange({ ...block, [key]: value })
  const isState = block.kind === 'state'

  return (
    <div className="default-container order-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <select
          value={block.target}
          onChange={(e) => set('target', e.target.value)}
          style={{ width: 90 }}
        >
          <option value="그룹">그룹</option>
          <option value="캐릭터">캐릭터</option>
        </select>

        <input
          type="text"
          placeholder={block.target === '그룹' ? '그룹명' : '캐릭터명'}
          value={block.targetName}
          onChange={(e) => set('targetName', e.target.value)}
          style={{ width: 120 }}
        />

        {isState ? (
          <span className="text">의</span>
        ) : (
          <select
            value={block.particle}
            onChange={(e) => set('particle', e.target.value)}
            style={{ width: 80 }}
          >
            <option value="의">의</option>
            <option value="대상">대상</option>
          </select>
        )}

        <input
          type="text"
          placeholder={detailPlaceholderOf(block.kind)}
          value={block.detail}
          onChange={(e) => set('detail', e.target.value)}
          style={{ flex: 1, minWidth: 140 }}
        />

        <span className="text" style={{ whiteSpace: 'nowrap' }}>{tailLabelOf(block.kind)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-red" onClick={onRemove}>
          삭제
        </button>
        <button
          type="button"
          className="btn btn-green"
          onClick={onConfirm}
        >
          확인
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------------
   계산 순서 탭 본체
   -------------------------------------------------------- */
export default function OrderTab() {
  const [blocks, setBlocks] = useState(BASE_BLOCKS)

  const dragIndex = useRef(null)
  const [overIndex, setOverIndex] = useState(null)

  const updateBlock = (idx, next) => {
    setBlocks(blocks.map((b, i) => (i === idx ? next : b)))
  }

  const removeBlock = (idx) => {
    setBlocks(blocks.filter((_, i) => i !== idx))
  }

  const addBlock = (kind) => {
    setBlocks([...blocks, makeBlock(kind)])
  }

  const confirmBlock = (idx) => {
    updateBlock(idx, { ...blocks[idx], confirmed: true })
  }

  const editAgain = (idx) => {
    updateBlock(idx, { ...blocks[idx], confirmed: false })
  }

  const handleDragStart = (idx) => (e) => {
    dragIndex.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (idx) => (e) => {
    e.preventDefault()
    if (idx !== overIndex) setOverIndex(idx)
  }

  const handleDrop = (idx) => (e) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === idx) {
      setOverIndex(null)
      return
    }
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(idx, 0, moved)
    setBlocks(next)
    dragIndex.current = null
    setOverIndex(null)
  }

  const handleDragEnd = () => {
    dragIndex.current = null
    setOverIndex(null)
  }

  

  return (
    <div>
      <h2>계산 순서</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        블럭을 드래그해서 순서를 바꿀 수 있습니다. 새 블럭은 "확인"을 눌러야 확정되고,
        확정된 블럭을 다시 클릭하면 수정할 수 있습니다.
      </p>

      <div>
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            draggable
            onDragStart={handleDragStart(idx)}
            onDragOver={handleDragOver(idx)}
            onDrop={handleDrop(idx)}
            onDragEnd={handleDragEnd}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 10,
              marginBottom: 12,
              opacity: overIndex === idx ? 0.5 : 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                cursor: 'grab',
                color: 'var(--text-muted)',
                fontSize: 18,
                userSelect: 'none',
              }}
              title="드래그하여 순서 변경"
            >
              ⠿
            </div>

            <div style={{ flex: 1 }}>
              <BlockRow
                block={block}
                onChange={(next) => updateBlock(idx, next)}
                onRemove={() => removeBlock(idx)}
                onConfirm={() => confirmBlock(idx)}
                onEditAgain={() => editAgain(idx)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="btn-row" style={{ marginTop: 8 }}>
        {BLOCK_TYPES.map((t) => (
          <button
            key={t.kind}
            type="button"
            className="btn btn-secondary mb-row"
            onClick={() => addBlock(t.kind)}
          >
            + {t.label}
          </button>
        ))}
      </div>

      
    </div>
  )
}
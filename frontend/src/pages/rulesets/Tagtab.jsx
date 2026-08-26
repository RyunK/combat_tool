import { useState } from 'react'

/* =========================================================
   태그 탭
   태그 하나 = 박스 하나
   "(대상/시전자) 의 (스탯명) 을 [수식] 만큼 (감소/증가)"
   ========================================================= */
export default function TagTab() {
  const [tags, setTags] = useState([
    { name: '', target: '대상', stat: '', formula: '', direction: '감소' },
  ])

  const setTag = (idx, key, value) => {
    const next = tags.map((t, i) => (i === idx ? { ...t, [key]: value } : t))
    setTags(next)
  }

  const addTag = () => {
    setTags([
      ...tags,
      { name: '', target: '대상', stat: '', formula: '', direction: '감소' },
    ])
  }

  const removeTag = (idx) => {
    setTags(tags.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <h2>태그</h2>

      {tags.map((tag, idx) => (
        <div
          key={idx}
          className="default-container"
        >
          <div className="form-default-row" style={{ maxWidth: 260, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="태그명"
              value={tag.name}
              onChange={(e) => setTag(idx, 'name', e.target.value)}
            />
          </div>

          <div
            className="form-default-row"
            style={{ maxWidth: 'none', alignItems: 'center', marginBottom: 12 }}
          >
            <select
              value={tag.target}
              onChange={(e) => setTag(idx, 'target', e.target.value)}
              style={{ width: 100 }}
            >
              <option value="대상">대상</option>
              <option value="시전자">시전자</option>
            </select>
            <span className="text">의</span>

            <input
              type="text"
              placeholder="스탯명"
              value={tag.stat}
              onChange={(e) => setTag(idx, 'stat', e.target.value)}
              style={{ width: 120 }}
            />
            <span className="text">을</span>

            <input
              type="text"
              placeholder="예: 판정값 * 힘 / 10"
              value={tag.formula}
              onChange={(e) => setTag(idx, 'formula', e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            <span className="text">만큼</span>

            <select
              value={tag.direction}
              onChange={(e) => setTag(idx, 'direction', e.target.value)}
              style={{ width: 100 }}
            >
              <option value="감소">감소</option>
              <option value="증가">증가</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-red"
              onClick={() => removeTag(idx)}
              aria-label="태그 삭제"
            >
              삭제
            </button>
          </div>
        </div>
      ))}

      <div className="btn-row mb-row">
        <button type="button" className="btn btn-secondary" onClick={addTag}>
          + 태그 추가
        </button>
      </div>
    </div>
  )
}
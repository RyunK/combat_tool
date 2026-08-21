import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * 검색 가능한 드롭다운 (콤보박스).
 *
 * - 단일 선택: value(string) / onChange(id: string)
 * - 다중 선택(multiple): values(string[]) / onChange(ids: string[])
 *
 * 클릭하면 입력창으로 바뀌고, 타이핑하면 옵션 목록이 실시간으로 필터링됩니다.
 * 다중 선택 모드에서는 항목 옆에 체크박스가 뜨고, 선택된 항목들은 ', '로 이어서 보여줍니다.
 */
function Dropdown({
  value,
  values,
  options,
  onChange,
  placeholder = '선택',
  multiple = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const selectedIds = multiple ? (values || []) : (value ? [value] : [])
  const selectedOptions = options.filter(o => selectedIds.includes(o.id))
  const displayLabel = selectedOptions.length > 0
    ? selectedOptions.map(o => o.name).join(', ')
    : placeholder

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.name.toLowerCase().includes(q))
  }, [options, query])

  const openMenu = () => {
    setOpen(true)
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleSelect = (id) => {
    if (multiple) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id]
      onChange(next)
      // 다중 선택은 계속 고를 수 있게 닫지 않는다
    } else {
      onChange(id)
      setOpen(false)
      setQuery('')
    }
  }

  const handleClear = () => {
    onChange(multiple ? [] : '')
    if (!multiple) {
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="dropdown" ref={rootRef}>
      {open ? (
        <input
          ref={inputRef}
          type="text"
          className="dropdown-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={selectedOptions.length > 0 ? displayLabel : placeholder}
        />
      ) : (
        <button
          type="button"
          className="dropdown-toggle"
          onClick={openMenu}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={`dropdown-toggle-label${selectedOptions.length === 0 ? ' is-placeholder' : ''}`}>
            {displayLabel}
          </span>
          <span className="dropdown-caret" aria-hidden="true">▾</span>
        </button>
      )}

      {open && (
        <ul className="dropdown-menu" role="listbox">
          {!multiple && (
            <li
              className="dropdown-option dropdown-option-empty"
              role="option"
              aria-selected={!value}
              onClick={handleClear}
            >
              {placeholder}
            </li>
          )}
          {multiple && selectedOptions.length > 0 && (
            <li
              className="dropdown-option dropdown-option-empty"
              onClick={handleClear}
            >
              선택 초기화
            </li>
          )}
          {filteredOptions.length === 0 && (
            <li className="dropdown-option dropdown-option-empty">일치하는 항목이 없습니다</li>
          )}
          {filteredOptions.map(o => {
            const isSelected = selectedIds.includes(o.id)
            return (
              <li
                key={o.id}
                className={`dropdown-option${isSelected ? ' is-selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(o.id)}
              >
                {multiple && (
                  <input
                    type="checkbox"
                    className="dropdown-checkbox"
                    checked={isSelected}
                    readOnly
                  />
                )}
                <span>{o.name}</span>
              </li>
            )
          })}
          {multiple && (
            <li className="dropdown-menu-footer">
              <button
                type="button"
                className="dropdown-done-btn"
                onClick={() => { setOpen(false); setQuery('') }}
              >
                완료
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export default Dropdown
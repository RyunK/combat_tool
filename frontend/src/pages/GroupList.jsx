/**
 * 그룹 리스트 표시하는 파일
 */
import { useState, useEffect } from 'react'


function GroupList() {
  // 서버에서 받아온 캐릭터 목록을 담아둘 state
  const [groups, setGroups] = useState([])
  // 아직 fetch 중인지 여부 (로딩 표시용)
  const [loading, setLoading] = useState(true)
  // fetch가 실패했을 때 에러 메시지를 담아둘 state
  const [error, setError] = useState(null)

  // [] 를 두 번째 인자로 주면 "컴포넌트가 처음 화면에 나타났을 때 딱 한 번만" 실행됩니다.
  useEffect(() => {
    fetch('/api/groups')
      .then((res) => {
        if (!res.ok) throw new Error('서버 응답 오류: ' + res.status)
        return res.json()
      })
      .then((data) => {
        setGroups(data)   // 받아온 데이터로 state 갱신 -> 화면이 자동으로 다시 그려짐
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <p className="hint">불러오는 중...</p>
  }

  if (error) {
    return <div className="error">캐릭터 목록을 불러오지 못했습니다: {error}</div>
  }

  return (
    <div>
      <h2>그룹 (React 버전)</h2>
      <p className="hint">
        그룹은 진영(플레이어팀/몬스터팀)일 수도 있고, 역할(탱커/힐러/딜러)일 수도 있습니다. 캐릭터는 여러 그룹에 동시에 속할 수 있습니다.
      </p>

      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>분류</th>
            <th>요구 스탯</th>
            <th>그룹 상태</th>
          </tr>
        </thead>
        <tbody>
          {/* 배열을 화면에 뿌릴 땐 .map() 을 씁니다.
              각 항목마다 고유한 key 를 꼭 지정해야 리액트가 어떤 게 바뀌었는지 압니다. */}
          {groups.map((g) => (
            <tr key={g.id}>
              <td><strong>{g.name}</strong></td>
              <td>
                {g.category
                    ? <span className="tag">{g.category}</span>
                    : <span className="hint">-</span>}
                </td>
              <td>
                {g.stat_schema.map((sd) => (
                    <span className="tag" key={sd.name}>
                    {sd.name}({sd.default})
                  </span>
                ))}
              </td>
               <td>
                    {/* statuses도 배열 */}
                    {g.statuses.map((s) => (
                        <span className="tag status" key={s.id}>
                        {s.name}: {s.target} {s.mode} {s.value}
                        </span>
                    ))}
                </td>
            </tr>
          ))}
        </tbody>
      </table>

      {groups.length === 0 && (
        <p className="hint">아직 그룹이 없습니다. 기존 화면(/groups/new)에서 먼저 만들어보세요.</p>
      )}
    </div>
  )
}

export default GroupList

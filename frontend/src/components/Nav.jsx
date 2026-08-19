import { Link } from 'react-router-dom'
import { backendUrl } from '../utils/backendUrl'

function Nav() {
  return (
    <header>
      <h1><Link to="/">🍊 감귤 전투 계산기</Link></h1>
      <nav>
        {/* <a href={backendUrl('/groups')}>그룹</a> */}
        <Link to="/groups">그룹</Link>
        <Link to="/characters">캐릭터</Link>
        <Link to="/characters">스킬</Link>
        <Link to="/formulas">수식</Link>
        <a href={backendUrl('/combat')}>전투 계산</a>
      </nav>
    </header>
  )
}

export default Nav

import { Link } from 'react-router-dom'
import { backendUrl } from '../utils/backendUrl'

function Nav() {
  return (
    <header>
      <h1><Link to="/">⚔️ GM을 위한 전투 계산기</Link></h1>
      <nav>
        <a href={backendUrl('/groups')}>그룹</a>
        <Link to="/characters">캐릭터</Link>
        <a href={backendUrl('/combat')}>전투 계산</a>
      </nav>
    </header>
  )
}

export default Nav

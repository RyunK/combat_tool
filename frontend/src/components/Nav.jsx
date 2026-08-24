import { Link, NavLink } from 'react-router-dom'

function Nav() {
  return (
    <header>
      <h1><Link to="/">🍊 감귤 전투 계산기</Link></h1>
      <nav>
        <NavLink to="/groups" className={({ isActive }) => isActive ? 'active' : undefined}>그룹</NavLink>
        <NavLink to="/characters" className={({ isActive }) => isActive ? 'active' : undefined}>캐릭터</NavLink>
        <NavLink to="/skills" className={({ isActive }) => isActive ? 'active' : undefined}>스킬</NavLink>
        <NavLink to="/formulas" className={({ isActive }) => isActive ? 'active' : undefined}>수식</NavLink>
        <NavLink to="/rulesets" className={({ isActive }) => isActive ? 'active' : undefined}>규칙 설정</NavLink>
        <NavLink to="/combat" className={({ isActive }) => isActive ? 'active' : undefined}>전투 계산</NavLink>
      </nav>
    </header>
  )
}

export default Nav

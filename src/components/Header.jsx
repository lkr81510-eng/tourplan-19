import { Link, NavLink } from 'react-router-dom'
import './Header.css'

const MENUS = [
  { to: '/', label: '홈', end: true },
  { to: '/favorites', label: '관심 여행지' },
]

function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__logo" aria-label="오늘의 여행 플래너 홈">
          <span className="header__logo-icon" aria-hidden="true">🧳</span>
          <span className="header__logo-text">오늘의 여행 플래너</span>
        </Link>

        <nav className="header__nav" aria-label="주요 메뉴">
          {MENUS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'header__link header__link--active' : 'header__link'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header

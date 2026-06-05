import { useEffect, useState } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
import styles from './Navbar.module.css'

const links = [
  { label: 'Home',     href: '#home'     },
  { label: 'Projects', href: '#projects' },
  { label: 'About',    href: '#home',    action: 'open-profile-card' },
]

export default function Navbar({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen(false)
    window.addEventListener('scroll', close, { passive: true, once: true })
    return () => window.removeEventListener('scroll', close)
  }, [menuOpen])

  const handleClick = (e, link) => {
    e.preventDefault()
    setMenuOpen(false)
    document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })
    if (link.action) window.dispatchEvent(new CustomEvent(link.action))
  }

  const navClass = [
    styles.navbar,
    scrolled ? styles.scrolled : '',
    menuOpen ? styles.menuActive : '',
  ].filter(Boolean).join(' ')

  return (
    <nav className={navClass}>
      <div className={styles.inner}>
        <a href="#home" className={styles.logo} onClick={(e) => handleClick(e, { href: '#home' })}>
          Brian <span>Dang</span>
        </a>
        <ul className={styles.links}>
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} onClick={(e) => handleClick(e, l)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.right}>
          <button
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={`${styles.mobileMenu}${menuOpen ? ` ${styles.mobileMenuOpen}` : ''}`}>
        <ul className={styles.mobileLinks}>
          {links.map(l => (
            <li key={l.label}>
              <a href={l.href} onClick={(e) => handleClick(e, l)}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

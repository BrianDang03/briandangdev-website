import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import styles from './Navbar.module.css'

const links = [
  { label: 'Home',     href: '#home'     },
  { label: 'Projects', href: '#projects' },
  { label: 'About',    href: '#home',    action: 'open-profile-card' },
]

export default function Navbar({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${styles.navbar}${scrolled ? ` ${styles.scrolled}` : ''}`}>
      <div className={styles.inner}>
        <a href="#home" className={styles.logo}>
          Brian <span>Dang</span>
        </a>
        <ul className={styles.links}>
          {links.map(l => (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={l.action ? (e) => {
                  e.preventDefault()
                  document.querySelector(l.href)?.scrollIntoView({ behavior: 'smooth' })
                  window.dispatchEvent(new CustomEvent(l.action))
                } : undefined}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <button
          className={styles.themeToggle}
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </nav>
  )
}

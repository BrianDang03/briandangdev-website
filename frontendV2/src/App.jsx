import { useEffect } from 'react'
import Background from './components/Background'
import Orbs from './components/Orbs'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import Project from './components/Project/Project'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const [theme, toggleTheme] = useTheme()

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' },
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <Background theme={theme} />
      <Orbs />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      <div className="page-layout">
        <Hero />
        <Project />
      </div>
    </>
  )
}

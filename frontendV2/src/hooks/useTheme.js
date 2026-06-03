import { useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme') ?? 'dark'
    // Set synchronously so CSS vars are correct before any effects run
    document.documentElement.setAttribute('data-theme', saved)
    return saved
  })

  const toggleTheme = () => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem('theme', next)
      return next
    })
  }

  return [theme, toggleTheme]
}

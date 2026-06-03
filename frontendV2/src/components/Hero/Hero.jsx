import { useState, useEffect } from 'react'
import { Mail, Github } from 'lucide-react'
import TiltFlipCard from '../TiltFlipCard/TiltFlipCard'
import styles from './Hero.module.css'

// Returns how many characters are currently visible.
// All characters are always rendered (no layout shift); only visibility changes.
function useTypewriter(length, speed, startDelay) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(length)
      return
    }
    setCount(0)
    let intervalId
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCount(n => {
          const next = n + 1
          if (next >= length) clearInterval(intervalId)
          return next
        })
      }, speed)
    }, startDelay)
    return () => { clearTimeout(timeoutId); clearInterval(intervalId) }
  }, [length, speed, startDelay])

  return [count, count >= length]
}

// Renders text with a ghost + live overlay so layout never shifts.
// Ghost (invisible) reserves the full space; live text types in on top.
function TypedLine({ text, visibleCount, showCursor, cursorBlink, className }) {
  const done = visibleCount >= text.length
  return (
    <span className={`${styles.typedLine} ${className ?? ''}`}>
      <span className={styles.ghost} aria-hidden="true">{text}</span>
      <span className={styles.live} aria-live="polite">
        {text.slice(0, visibleCount)}
        {showCursor && !done && (
          <span className={styles.cursor} aria-hidden="true">|</span>
        )}
        {cursorBlink && done && (
          <span className={styles.cursorBlink} aria-hidden="true">|</span>
        )}
      </span>
    </span>
  )
}

const GREETING = "Hello, I'm"
const NAME     = "Brian Dang"
const TITLE    = "A Software Engineer in Colorado"
//  greeting: 10 chars × 65ms = 650ms,  delay 200ms  → done ~850ms
//  name:     10 chars × 90ms = 900ms,  delay 950ms  → done ~1850ms
//  title:    31 chars × 45ms = 1395ms, delay 1950ms → done ~3345ms

const cardFront = (
  <p className={styles.cardHint}>Tap to know more about me</p>
)

const cardBack = (
  <div className={styles.backContent}>
    <p className={styles.backBio}>
      I build software that connects ideas to real systems — from production
      tools and automation scripts to embedded device workflows and game projects.
    </p>
    <div className={styles.backLinks}>
      <a href="mailto:briandang730@gmail.com" className={styles.backLink}>
        <Mail size={14} />
        briandang730@gmail.com
      </a>
      <a
        href="https://github.com/briandang03"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.backLink}
      >
        <Github size={14} />
        GitHub
      </a>
    </div>
  </div>
)

export default function Hero() {
  const [greetingCount, greetingDone] = useTypewriter(GREETING.length, 65,  200)
  const [nameCount,     nameDone]     = useTypewriter(NAME.length,     90,  950)
  const [titleCount,    titleDone]    = useTypewriter(TITLE.length,    45, 1950)

  return (
    <section id="home" className={styles.hero}>
      <div className={styles.section}>
        <div className={styles.text}>

          <p className={styles.greeting}>
            <TypedLine
              text={GREETING}
              visibleCount={greetingCount}
              showCursor
            />
          </p>

          <h1 className={styles.name}>
            <TypedLine
              text={NAME}
              visibleCount={nameCount}
              showCursor={greetingDone}
            />
          </h1>

          <p className={styles.title}>
            <TypedLine
              text={TITLE}
              visibleCount={titleCount}
              showCursor={nameDone}
              cursorBlink
            />
          </p>

          <div className={styles.actions}>
            <a href="mailto:briandang730@gmail.com" className={styles.contactBtn}>
              <Mail size={15} />
              briandang730@gmail.com
            </a>

            <a
              href="https://github.com/briandang03"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactBtn}
            >
              <Github size={15} />
              GitHub
            </a>
          </div>

        </div>

        <div className={styles.cardWrap}>
          <TiltFlipCard
            frontImg="/profile.jpg"
            front={cardFront}
            back={cardBack}
            width={340}
            height={460}
            prioritizeFrontImage
            entranceFrom="right"
            entranceOrder={1}
          />
        </div>
      </div>
    </section>
  )
}

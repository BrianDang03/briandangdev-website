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

function useCycleTypewriter(words, typeSpeed, deleteSpeed, holdDelay, startDelay, active = true) {
  const [wordIndex, setWordIndex] = useState(0)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('idle')

  useEffect(() => {
    if (!active) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(words[0].length)
      setPhase('holding')
      return
    }

    const word = words[wordIndex]
    let timeoutId

    if (phase === 'idle') {
      timeoutId = setTimeout(() => {
        setPhase('typing')
      }, startDelay)
    } else if (phase === 'typing') {
      if (count < word.length) {
        timeoutId = setTimeout(() => setCount(count + 1), typeSpeed)
      } else {
        timeoutId = setTimeout(() => setPhase('holding'), holdDelay)
      }
    } else if (phase === 'holding') {
      timeoutId = setTimeout(() => setPhase('deleting'), holdDelay)
    } else if (phase === 'deleting') {
      if (count > 0) {
        timeoutId = setTimeout(() => setCount(count - 1), deleteSpeed)
      } else {
        timeoutId = setTimeout(() => {
          setWordIndex((wordIndex + 1) % words.length)
          setPhase('pause')
        }, 200)
      }
    } else if (phase === 'pause') {
      timeoutId = setTimeout(() => {
        setPhase('typing')
      }, 250)
    }

    return () => clearTimeout(timeoutId)
  }, [active, words, wordIndex, count, phase, typeSpeed, deleteSpeed, holdDelay, startDelay])

  return [wordIndex, count, phase]
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
const TITLES   = [
  'Software Engineer',
  'Systems Engineer',
  'Gameplay Engineer',
]
//  greeting: 10 chars × 65ms = 650ms,  delay 200ms  → done ~850ms
//  name:     10 chars × 90ms = 900ms,  delay 950ms  → done ~1850ms
//  title loops through each phrase with typing and deletion

const cardFront = (
  <p className={styles.cardHint}>Tap to know more about me</p>
)

const cardBack = (
  <div className={styles.backContent}>
    <p className={styles.backBio}>
      The goal is to get into an environment where the work carries real weight
      and the people around you do not settle for good enough. I want to spend
      several years building at that level, absorbing what it actually means to
      ship things that matter. Then bring all of it into game development.
      Building the kinds of experiences that made me feel what I felt growing up.
      That is where this is all heading.
    </p>

    <div className={styles.backSection}>Education</div>
    <div className={styles.backEduList}>
      <div className={styles.backEduItem}>
        <span className={styles.backEduDegree}>M.S. Computer Science</span>
        <span className={styles.backEduSchool}>Colorado School of Mines · 2026 to 2028</span>
      </div>
      <div className={styles.backEduItem}>
        <span className={styles.backEduDegree}>B.A. Computer Science</span>
        <span className={styles.backEduSchool}>University of Colorado Denver · 2022 to 2026</span>
      </div>
    </div>

    <div className={styles.backSection}>What I Build</div>
    <div className={styles.backEduList}>
      {[
        'Production tools that replace broken manual workflows',
        'Full stack web applications shipped end to end',
        'Automation that compresses hours of work into minutes',
        'Gameplay systems focused on feel and responsiveness',
        'Open source contributions to systems and numerics libraries',
      ].map(item => (
        <span key={item} className={styles.backBullet}>{item}</span>
      ))}
    </div>

    <div className={styles.backSection}>Skills</div>
    <div className={styles.backSkills}>
      {['C/C++', 'C#', 'Python', 'JavaScript', 'React', 'Node.js',
        'MongoDB', 'Unity', 'Unreal Engine', 'Docker', 'Git'].map(s => (
        <span key={s} className={styles.backSkillTag}>{s}</span>
      ))}
    </div>

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
        <span className={styles.iconCircle}><Github size={14} /></span>
        github.com/briandang03
      </a>
    </div>
  </div>
)

export default function Hero() {
  const [greetingCount, greetingDone] = useTypewriter(GREETING.length, 65,  200)
  const [nameCount,     nameDone]     = useTypewriter(NAME.length,     90,  950)
  const [titleIndex, titleCount, phase] = useCycleTypewriter(TITLES, 45, 35, 4000, 200, nameDone)
  const titleDone                        = titleCount >= TITLES[titleIndex].length

  return (
    <section id="home" className={styles.hero}>
      <div className={styles.section}>
        <div className={styles.text}>

          <p className={styles.greeting}>
            <TypedLine
              text={GREETING}
              visibleCount={greetingCount}
              showCursor={greetingCount > 0}
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
              text={TITLES[titleIndex]}
              visibleCount={titleCount}
              showCursor={nameDone || phase !== 'idle'}
              cursorBlink={titleDone}
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
              <span className={styles.iconCircle}><Github size={15} /></span>
              GitHub
            </a>
          </div>

          <div className={styles.about}>
            <h2 className="sec-title">A little about me</h2>
            <p className="sec-desc">
              I grew up chasing the feeling of finally cracking something open after it had
              been grinding at me for hours. Gaming gave me that. Turns out engineering does
              too. I started in pharmacy, knew immediately it was wrong, switched to computer
              science on a whim, and found everything medicine never gave me. The building,
              the problem solving, watching something finally click and ship. That is what
              keeps me going.
            </p>
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

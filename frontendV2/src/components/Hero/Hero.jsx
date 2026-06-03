import { Mail, Github, ArrowDown } from 'lucide-react'
import TiltFlipCard from '../TiltFlipCard/TiltFlipCard'
import styles from './Hero.module.css'

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
  return (
    <section id="home" className={styles.hero}>
      <div className={styles.section}>
        <div className={styles.text}>
          <h1 className={styles.name}>Brian Dang</h1>

          <p className={styles.title}>
            <strong>Software Engineer</strong>
          </p>

          <p className={styles.desc}>
            I enjoy building software that connects ideas to real systems, from production
            tools and automation scripts to embedded device workflows and game projects.
            I like learning how things work under the hood and turning that knowledge
            into tools that are practical, reliable, and useful to the people who depend
            on them.
          </p>

          <div className={styles.actions}>
            <a href="#projects" className="btn btn-primary btn-lg">
              View Projects <ArrowDown size={15} />
            </a>

            <a href="#about" className="btn btn-ghost btn-lg">About Me</a>

            <a href="mailto:briandang730@gmail.com" className={styles.link}>
              <Mail /> briandang730@gmail.com
            </a>

            <a
              href="https://github.com/briandang03"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <Github /> GitHub
            </a>
          </div>
        </div>

        <div className={styles.cardWrap}>
          <TiltFlipCard
            frontImg="/profile.jpg"
            front={cardFront}
            back={cardBack}
            width={300}
            height={420}
            prioritizeFrontImage
            entranceFrom="right"
            entranceOrder={1}
          />
        </div>
      </div>
    </section>
  )
}

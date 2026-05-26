import { Mail, Github, ArrowDown } from 'lucide-react'
import styles from './Hero.module.css'

export default function Hero() {
  return (
    <section id="home">
      <div className={styles.section}>
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
    </section>
  )
}

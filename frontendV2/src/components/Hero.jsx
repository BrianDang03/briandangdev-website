import { Mail, Github, ArrowDown } from 'lucide-react'

export default function Hero() {
  return (
    <section id="home">
      <div className="hero-section">
        <h1 className="hero-name">Brian Dang</h1>

        <p className="hero-title">
          <strong>Software Engineer</strong>
        </p>

        <p className="hero-desc">
          I enjoy building software that connects ideas to real systems, from production
          tools and automation scripts to embedded device workflows and game projects.
          I like learning how things work under the hood and turning that knowledge
          into tools that are practical, reliable, and useful to the people who depend
          on them.
        </p>

        <div className="hero-actions">
          <a href="#about" className="btn btn-secondary btn-lg">About Me</a>

          <a href="#projects" className="btn btn-primary btn-lg">
            View Projects <ArrowDown size={15} />
          </a>

          <a
            href="mailto:briandang730@gmail.com"
            className="hero-link"
          >
            <Mail /> briandang730@gmail.com
          </a>

          <a
            href="https://github.com/briandang03"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-link"
          >
            <Github /> GitHub
          </a>
        </div>
      </div>
    </section>
  )
}

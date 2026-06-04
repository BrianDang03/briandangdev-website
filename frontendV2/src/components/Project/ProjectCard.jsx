import { Github, ExternalLink, Zap } from 'lucide-react'
import styles from './ProjectCard.module.css'

export default function ProjectCard({
  type = 'Project',
  title = 'Project Title',
  company,
  description = 'Project description goes here.',
  impact,
  stack = [],
  githubUrl,
  liveUrl,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.type}>{type}</span>
        <div className={styles.extLinks}>
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.extLink}
              aria-label="GitHub"
            >
              <Github size={15} />
            </a>
          )}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.extLink}
              aria-label="Live site"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>

      <div>
        <p className={styles.name}>{title}</p>
        {company && <p className={styles.company}>{company}</p>}
      </div>

      <p className={styles.desc}>{description}</p>

      {impact && (
        <div className={styles.impact}>
          <Zap size={14} color="var(--project-card-impact-color)" style={{ flexShrink: 0 }} />
          <span className={styles.impactLabel}>{impact}</span>
        </div>
      )}

      {stack.length > 0 && (
        <div className={styles.stack}>
          {stack.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}

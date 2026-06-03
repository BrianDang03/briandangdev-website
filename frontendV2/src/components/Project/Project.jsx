import ProjectCard from './ProjectCard'
import styles from './Project.module.css'

const projects = [
  {
    type: 'Full Stack',
    title: 'Project Title',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['React', 'Node.js', 'PostgreSQL'],
    githubUrl: '#',
    liveUrl: '#',
  },
  {
    type: 'Embedded',
    title: 'Project Title 2',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['C', 'Python', 'Raspberry Pi'],
    githubUrl: '#',
  },
  {
    type: 'Game',
    title: 'Project Title 3',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['Unity', 'C#'],
    githubUrl: '#',
  },
]

export default function Project() {
  return (
    <section id="projects" className={styles.section}>
      <div className={styles.header}>
        <div className="sec-tag">Projects</div>
        <h2 className="sec-title">Things I've Built</h2>
      </div>
      <div className={styles.grid}>
        {projects.map(p => (
          <ProjectCard key={p.title} {...p} />
        ))}
      </div>
    </section>
  )
}

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
  {
    type: 'Full Stack',
    title: 'Project Title 4',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['Next.js', 'TypeScript', 'Tailwind'],
    githubUrl: '#',
    liveUrl: '#',
  },
  {
    type: 'Automation',
    title: 'Project Title 5',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['Python', 'Bash', 'Docker'],
    githubUrl: '#',
  },
  {
    type: 'Mobile',
    title: 'Project Title 6',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['React Native', 'Expo', 'Firebase'],
    githubUrl: '#',
    liveUrl: '#',
  },
  {
    type: 'Embedded',
    title: 'Project Title 7',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['Arduino', 'C++', 'MQTT'],
    githubUrl: '#',
  },
  {
    type: 'Game',
    title: 'Project Title 8',
    company: 'Personal',
    description: 'Project description goes here.',
    impact: 'Impact or highlight goes here.',
    stack: ['Unreal Engine', 'C++', 'Blueprints'],
    githubUrl: '#',
  },
]

export default function Project() {
  return (
    <section id="projects" className={styles.section}>
      <div className={styles.header}>
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

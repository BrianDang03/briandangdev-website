import ProjectCard from './ProjectCard'
import styles from './Project.module.css'

const projects = [
  {
    type: 'Full Stack',
    title: 'Modem Wizard',
    company: 'Wanco Inc.',
    description: 'Internal production tool that automates modem setup, activation, and configuration for Message Board Trailers. Interfaces with the modem REST API and Verizon Thingspace API for cellular activation. Architected and shipped from scratch in 6 weeks.',
    impact: 'Processes 40–90 modems per week — the production floor\'s sole fulfillment system with no manual fallback.',
    stack: ['MongoDB', 'Express', 'React', 'Node.js', 'Verizon API', 'REST'],
  },
  {
    type: 'Automation',
    title: 'Asset Tracker Automation',
    company: 'Wanco Inc.',
    description: 'Python tool that orchestrates the full Suntech asset tracker fulfillment cycle: cellular activation, Plex ERP data entry, and label printing. Uses Playwright browser automation as a cost-effective alternative to Plex\'s paid API.',
    impact: 'Cut fulfillment time from 4 hours to 10 minutes per box. Serves 3 active production lines.',
    stack: ['Python', 'Playwright', 'Browser Automation'],
  },
  {
    type: 'Open Source',
    title: '<T>LAPACK Contributions',
    company: 'University of Colorado Denver',
    description: 'Contributor to an NSF-funded C++ template linear algebra library. Implemented symmetric eigenvalue routines (laed2, laed4, laed6), merge and sort utilities, triangular matrix multiplication, plus test cases and usage examples for each.',
    impact: 'Contributions merged across multiple PRs as one of 17 contributors to the NSF-funded open source library.',
    stack: ['C++', 'CMake', 'Linear Algebra', 'CI/CD'],
    githubUrl: 'https://github.com/tlapack/tlapack',
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

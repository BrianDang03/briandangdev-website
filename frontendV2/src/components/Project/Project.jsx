import ProjectCard from './ProjectCard'

const projects = [
    {
        title: 'Project Title',
        description: 'Project description goes here.',
        githubUrl: '#',
    },
    {
        title: 'Project Title2',
        description: 'Project description goes here.2',
        githubUrl: '#',
    },
    {
        title: 'Project Title3',
        description: 'Project description goes here.3',
        githubUrl: '#',
    },
]

export default function Project() {
    return (
        <section id="project">
            <div className="project-section">
                <h2 className="project-title">Projects</h2>
                {projects.map((p) => (
                    <ProjectCard
                        key={p.title}
                        title={p.title}
                        description={p.description}
                        githubUrl={p.githubUrl}
                    />
                ))}
            </div>
        </section>
    )
}

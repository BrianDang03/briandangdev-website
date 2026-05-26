import { Github } from 'lucide-react'

export default function ProjectCard({ title = 'Project Title', description = 'Project description goes here.', githubUrl = '#', onDetails }) {
    return (
        <div className="project-card">
            <h3 className="project-card-title">{title}</h3>
            <p className="project-card-desc">{description}</p>
            <div className="project-card-footer">
                <button className="project-card-details-btn" onClick={onDetails}>
                    Details
                </button>
            </div>
        </div>
    )
}
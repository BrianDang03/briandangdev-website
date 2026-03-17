import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, ExternalLink, Lock } from 'lucide-react';
import SEO from '../../components/SEO';
import PageTransition from '../../components/PageTransition';
import projects from '../../data/projects';
import './ProjectDetail.css';

export default function ProjectDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const project = projects.find((p) => p.slug === slug);

    if (!project || !project.details) {
        return (
            <PageTransition>
                <SEO title="Project Not Found" />
                <section className="page-shell">
                    <h1>Project Not Found</h1>
                    <p>The project you're looking for doesn't exist.</p>
                    <Link to="/portfolio" className="back-link">
                        <ArrowLeft size={16} /> Back to Portfolio
                    </Link>
                </section>
            </PageTransition>
        );
    }

    const { details } = project;

    return (
        <PageTransition>
            <SEO
                title={project.title}
                description={project.summary}
                keywords={project.technologies.join(', ')}
            />
            <section className="page-shell project-detail-page">
                <button className="back-link" onClick={() => navigate(-1)} aria-label="Go back to portfolio">
                    <ArrowLeft size={16} />
                    <span>Back to Portfolio</span>
                </button>

                <h1>{project.title}</h1>
                {details.company && (
                    <p className="hero-kicker">{details.company}</p>
                )}

                {project.image && (
                    <div className="project-detail-image">
                        <picture>
                            {project.imageWebpSrcSet && (
                                <source type="image/webp" srcSet={project.imageWebpSrcSet} sizes="(max-width: 900px) 92vw, 860px" />
                            )}
                            {project.imageJpegSrcSet && (
                                <source type="image/jpeg" srcSet={project.imageJpegSrcSet} sizes="(max-width: 900px) 92vw, 860px" />
                            )}
                            <img
                                src={project.image}
                                alt={project.title}
                                style={project.imageObjectPosition ? { objectPosition: project.imageObjectPosition } : undefined}
                            />
                        </picture>
                    </div>
                )}

                <div className="project-detail-meta">
                    <div className="project-detail-tech">
                        {project.technologies.map((tech) => (
                            <span key={tech} className="tech-badge">{tech}</span>
                        ))}
                    </div>
                    <div className="project-detail-links">
                        {project.github && (
                            <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                                <Github size={18} /> <span>View on GitHub</span>
                            </a>
                        )}
                        {project.demo && (
                            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="project-link">
                                <ExternalLink size={18} /> <span>Live Demo</span>
                            </a>
                        )}
                        {project.proprietary && (
                            <span className="project-proprietary">
                                <Lock size={13} aria-hidden="true" />
                                Code Unavailable
                            </span>
                        )}
                    </div>
                </div>

                <div className="project-detail-body">
                    <div className="project-detail-section">
                        <h2>Overview</h2>
                        <p>{details.overview}</p>
                    </div>

                    <div className="project-detail-section">
                        <h2>Key Contributions</h2>
                        <ul className="project-detail-list" role="list">
                            {details.highlights.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="project-detail-section">
                        <h2>Challenges</h2>
                        <p>{details.challenges}</p>
                    </div>

                    <div className="project-detail-section">
                        <h2>Impact</h2>
                        <p>{details.impact}</p>
                    </div>
                </div>
            </section>
        </PageTransition>
    );
}

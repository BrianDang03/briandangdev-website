import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ExternalLink, Github, Lock } from 'lucide-react';
import { shouldUseSimpleMotion } from '../../utils/motionProfile';
import "./ProjectCard.css";

const TECH_COLORS = {
    // Frontend / web
    React: 'badge-blue', 'Vue.js': 'badge-blue', TypeScript: 'badge-blue',
    JavaScript: 'badge-blue', CSS3: 'badge-blue', 'HTML/CSS': 'badge-blue',
    'Framer Motion': 'badge-blue', Vite: 'badge-blue', 'D3.js': 'badge-blue',
    // Backend / runtime
    'Node.js': 'badge-green', Express: 'badge-green', Django: 'badge-green',
    GraphQL: 'badge-green', 'REST APIs': 'badge-green', WebSocket: 'badge-green',
    // Systems / native
    'C#': 'badge-purple', Unity: 'badge-purple', 'C++': 'badge-purple',
    'System Architecture': 'badge-purple', 'Unreal Engine': 'badge-purple',
    // Data / infra / AI
    Python: 'badge-amber', TensorFlow: 'badge-amber', PostgreSQL: 'badge-amber',
    Stripe: 'badge-amber', Docker: 'badge-amber', AWS: 'badge-amber',
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1]
        }
    }
};

function ProjectCard({ project }) {
    const simpleMotion = shouldUseSimpleMotion();

    return (
        <Motion.article
            className="project-card"
            variants={simpleMotion ? undefined : cardVariants}
            initial={simpleMotion ? false : "hidden"}
            whileInView={simpleMotion ? undefined : "visible"}
            viewport={{ once: true, margin: simpleMotion ? "0px" : "-50px" }}
            whileHover={simpleMotion ? undefined : { y: -8 }}
            transition={simpleMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 20 }}
        >
            {project.image ? (
                <div className="project-image" style={project.imageAspectRatio ? { aspectRatio: project.imageAspectRatio } : undefined}>
                    <picture>
                        {project.imageWebpSrcSet && (
                            <source
                                type="image/webp"
                                srcSet={project.imageWebpSrcSet}
                                sizes={project.imageSizes}
                            />
                        )}
                        {project.imageJpegSrcSet && (
                            <source
                                type="image/jpeg"
                                srcSet={project.imageJpegSrcSet}
                                sizes={project.imageSizes}
                            />
                        )}
                        <img
                            src={project.image}
                            alt={project.title}
                            loading="lazy"
                            decoding="async"
                            sizes={project.imageSizes}
                            style={project.imageObjectPosition ? { objectPosition: project.imageObjectPosition } : undefined}
                        />
                    </picture>
                </div>
            ) : (
                <div className="project-image-placeholder" aria-hidden="true">
                    <span className="project-placeholder-initial">
                        {project.title.charAt(0)}
                    </span>
                </div>
            )}

            <div className="project-content">
                <h3>{project.title}</h3>
                <p className="project-description">{project.summary || project.description}</p>

                <div className="project-tech">
                    {project.technologies.map((tech) => (
                        <span key={tech} className={`tech-badge${TECH_COLORS[tech] ? ` ${TECH_COLORS[tech]}` : ''}`}>{tech}</span>
                    ))}
                </div>

                <div className="project-links">
                    {project.github && (
                        <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link"
                            aria-label={`View ${project.title} on GitHub`}
                        >
                            <Github size={18} />
                            <span>Code</span>
                        </a>
                    )}
                    {project.demo && (
                        <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link"
                            aria-label={`View live demo of ${project.title}`}
                        >
                            <ExternalLink size={18} />
                            <span>Live Demo</span>
                        </a>
                    )}
                    {!project.github && !project.demo && project.proprietary && (
                        <span className="project-proprietary">
                            <Lock size={13} aria-hidden="true" />
                            Code Unavailable
                        </span>
                    )}
                    {project.details && (
                        <Link
                            to={`/portfolio/${project.slug}`}
                            className="project-link project-link-see-more"
                            aria-label={`Details details about ${project.title}`}
                        >
                            <span>Details</span>
                        </Link>
                    )}
                    {!project.github && !project.demo && !project.proprietary && !project.details && (
                        <span className="project-coming-soon">Coming Soon</span>
                    )}
                </div>
            </div>
        </Motion.article>
    );
}

export default memo(ProjectCard);

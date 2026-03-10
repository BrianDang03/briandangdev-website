import { motion as Motion } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { shouldUseSimpleMotion } from '../../utils/motionProfile';
import "./ProjectCard.css";

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

export default function ProjectCard({ project }) {
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
            {project.image && (
                <div className="project-image">
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
                        />
                    </picture>
                </div>
            )}

            <div className="project-content">
                <h3>{project.title}</h3>
                <p className="project-description">{project.description}</p>

                <div className="project-tech">
                    {project.technologies.map((tech) => (
                        <span key={tech} className="tech-badge">{tech}</span>
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
                </div>
            </div>
        </Motion.article>
    );
}

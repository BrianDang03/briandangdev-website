import SEO from '../../components/SEO';
import PageTransition from '../../components/PageTransition';
import ProjectsGrid from '../../components/ProjectsGrid/ProjectsGrid';
import './Portfolio.css';

export default function Portfolio() {
    return (
        <PageTransition>
            <SEO
                title="Portfolio"
                description="Explore my software engineering projects including gameplay systems, web applications, and full-stack development work."
                keywords="portfolio, projects, software development, game development, web applications"
            />
            <section className="page-shell">
                <p className="hero-kicker">Selected Work</p>
                <h1>Portfolio</h1>
                <p className="page-intro">
                    A collection of creator-led projects where system design meets
                    implementation: gameplay-driven features, immersive interaction,
                    and resilient builds shaped by challenge and constant growth.
                </p>

                <ProjectsGrid />
            </section>
        </PageTransition>
    );
}
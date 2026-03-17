import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../../components/SEO';
import PageTransition from '../../components/PageTransition';
import ProjectsGrid from '../../components/ProjectsGrid/ProjectsGrid';
import './Portfolio.css';

export default function Portfolio() {
    const navigate = useNavigate();

    return (
        <PageTransition>
            <SEO
                title="Portfolio"
                description="Explore my software engineering projects including gameplay systems, web applications, and full-stack development work."
                keywords="portfolio, projects, software development, game development, web applications"
            />
            <section className="page-shell portfolio-page">
                <button className="back-link" onClick={() => navigate(-1)} aria-label="Go back">
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>
                <p className="hero-kicker">Selected Work</p>
                <h1>Portfolio</h1>
                <p className="page-intro">
                    I design, develop, and deliver. Every project here was built to solve
                    a real problem, shipped under real pressure, and used by real people.
                </p>

                <ProjectsGrid />
            </section>
        </PageTransition>
    );
}
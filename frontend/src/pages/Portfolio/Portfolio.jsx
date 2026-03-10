import SEO from '../../components/SEO';
import PageTransition from '../../components/PageTransition';
import ProjectCard from '../../components/ProjectCard/ProjectCard';
import './Portfolio.css';

const ASSET_BASE = import.meta.env.BASE_URL;
const PROJECT_IMAGE_SIZES = "(max-width: 900px) 92vw, 420px";

const projects = [
    {
        title: "Interactive Portfolio Website",
        description: "Modern portfolio with 3D tilt effects, smooth animations, and responsive design. Features custom-built flip cards with GPU-accelerated transforms for 60fps performance.",
        technologies: ["React", "Vite", "Framer Motion", "CSS3"],
        image: `${ASSET_BASE}modem.jpg`,
        imageWebpSrcSet: `${ASSET_BASE}modem-480.webp 480w, ${ASSET_BASE}modem-768.webp 768w, ${ASSET_BASE}modem-1200.webp 1200w`,
        imageJpegSrcSet: `${ASSET_BASE}modem-480.jpg 480w, ${ASSET_BASE}modem-768.jpg 768w, ${ASSET_BASE}modem-1200.jpg 1200w`,
        imageSizes: PROJECT_IMAGE_SIZES,
        demo: "https://briandangdev.com",
        github: "https://github.com/BrianDang03/briandangdev-website"
    },
    {
        title: "Gameplay Systems Engine",
        description: "Custom gameplay framework for fast-paced action games. Implements modular ability system, state machines, and event-driven architecture for scalable game logic.",
        technologies: ["C#", "Unity", "System Architecture"],
        image: null,
        github: null
    },
    {
        title: "Real-time Multiplayer Game",
        description: "Online multiplayer game with client-server architecture, lag compensation, and authoritative server design. Handles player synchronization and network optimization.",
        technologies: ["Node.js", "WebSocket", "JavaScript"],
        image: null,
        github: null
    },
    {
        title: "AI-Powered Task Manager",
        description: "Intelligent task management app with natural language processing for smart task categorization and priority suggestions. Features offline-first architecture.",
        technologies: ["React", "TypeScript", "Python", "TensorFlow"],
        image: null,
        demo: null,
        github: null
    },
    {
        title: "E-commerce Platform",
        description: "Full-stack e-commerce solution with payment integration, inventory management, and admin dashboard. Implements secure authentication and RESTful API design.",
        technologies: ["React", "Node.js", "PostgreSQL", "Stripe"],
        image: null,
        demo: null,
        github: null
    },
    {
        title: "Data Visualization Dashboard",
        description: "Interactive analytics dashboard with real-time data streaming, customizable charts, and export functionality. Built for performance with large datasets.",
        technologies: ["Vue.js", "D3.js", "WebSocket", "Express"],
        image: null,
        demo: null,
        github: null
    }
];

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

                <div className="projects-grid">
                    {projects.map((project) => (
                        <ProjectCard key={project.title} project={project} />
                    ))}
                </div>
            </section>
        </PageTransition>
    );
}
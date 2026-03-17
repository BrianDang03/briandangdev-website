import ProjectCard from '../ProjectCard/ProjectCard';
import './ProjectsGrid.css';

const ASSET_BASE = import.meta.env.BASE_URL;
const PROJECT_IMAGE_SIZES = "(max-width: 900px) 92vw, 420px";

const projects = [
    {
        title: "Modem Wizard",
        description: "Internal production tool built for Wanco Inc. to streamline the setup, activation, and configuration of InHand modems deployed on Message Board Trailers. Interfaces directly with the modem's REST API and integrates with Verizon's Thingspace API to handle cellular activation programmatically. Architected and shipped from scratch in 6 weeks — including learning the full MERN stack for the first time — and is now a critical dependency in weekly production, processing 40–90 modems per week. Without it, the production floor has no reliable fallback process.",
        technologies: ["MongoDB", "Express", "React", "Node.js", "Verizon Thingspace API", "REST"],
        proprietary: true,
        image: `${ASSET_BASE}modem.jpg`,
        imageWebpSrcSet: `${ASSET_BASE}modem-480.webp 480w, ${ASSET_BASE}modem-768.webp 768w, ${ASSET_BASE}modem-1200.webp 1200w`,
        imageJpegSrcSet: `${ASSET_BASE}modem-480.jpg 480w, ${ASSET_BASE}modem-768.jpg 768w, ${ASSET_BASE}modem-1200.jpg 1200w`,
        imageSizes: PROJECT_IMAGE_SIZES,
        github: null
    },
    {
        title: "Asset Tracker Automation",
        description: "Python automation tool built for Wanco Inc. that reduced Suntech asset tracker order fulfillment from 4 hours to 10 minutes per box. Orchestrates the full workflow: activating each tracker, performing all data entry into Plex ERP, and automating label printing — a process that previously required an operator to manually click through Plex four times per tracker just to print labels. Built with Playwright for browser automation as a cost-effective alternative to Plex's paid API. Serves three active production lines processing 30-unit orders.",
        technologies: ["Python", "Playwright", "Browser Automation"],
        proprietary: true,
        image: null,
        github: null
    },
    {
        title: "<T>LAPACK — Open Source Contributions",
        description: "Contributor to <T>LAPACK, an NSF-funded open-source C++ template linear algebra library developed at the University of Colorado Denver. Implemented and refined core symmetric eigenvalue routines — primarily laed4 and laed6, the secular equation solvers at the heart of the divide-and-conquer eigenvalue algorithm — along with laed2, lamrg, steqr quicksort, and in-place triangular matrix multiplication routines (mult_llh, mult_uhu). Authored test cases and usage examples for each implemented routine. Contributions merged across multiple pull requests as one of 17 contributors.",
        technologies: ["C++", "Numerical Linear Algebra", "CMake", "CI/CD Pipeline", "Open Source"],
        image: `${ASSET_BASE}tlapack.jpg`,
        imageWebpSrcSet: `${ASSET_BASE}tlapack-480.webp 480w, ${ASSET_BASE}tlapack-768.webp 768w, ${ASSET_BASE}tlapack-1200.webp 1200w`,
        imageJpegSrcSet: `${ASSET_BASE}tlapack-480.jpg 480w, ${ASSET_BASE}tlapack-768.jpg 768w, ${ASSET_BASE}tlapack-1200.jpg 1200w`,
        imageSizes: PROJECT_IMAGE_SIZES,
        imageAspectRatio: "16 / 8",
        imageObjectPosition: "center 30%",
        github: "https://github.com/tlapack/tlapack"
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

export default function ProjectsGrid() {
    return (
        <div className="projects-grid">
            {projects.map((project) => (
                <ProjectCard key={project.title} project={project} />
            ))}
        </div>
    );
}

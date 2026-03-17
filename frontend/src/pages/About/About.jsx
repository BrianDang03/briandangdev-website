import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SEO from '../../components/SEO';
import PageTransition from '../../components/PageTransition';
import SkillsGrid from '../../components/SkillsGrid/SkillsGrid';
import ContactForm from '../../components/ContactForm/ContactForm';
import './About.css';

export default function About() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.scrollTo) return;
    // Delay past the 400ms page-enter transition so scroll isn't
    // overridden by PageTransition's scroll-to-top on mount.
    const id = setTimeout(() => {
      document.getElementById(state.scrollTo)?.scrollIntoView({ behavior: "smooth" });
    }, 480);
    return () => clearTimeout(id);
  }, [state?.scrollTo]);

  return (
    <PageTransition>
      <SEO
        title="About"
        description="Learn about Brian Dang - software engineer passionate about gameplay systems, full-stack development, and creating memorable user experiences."
        keywords="about, bio, skills, experience, software engineer, gameplay engineer"
      />
      <section className="page-shell about-page">
        <button className="back-link" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <p className="hero-kicker">Background</p>
        <h1>About Me</h1>

        <div className="about-content">
          <p className="about-intro">
            I am a creator first, and a systems designer and implementer at heart.
            My work blends technical precision with creative vision, with a strong
            focus on gameplay engineering, challenge-driven problem solving, and
            continuous growth through every build.
          </p>

          <div className="about-section">
            <h2>My Journey</h2>
            <p>
              As a software engineer, I've built systems that prioritize both user experience
              and technical excellence. From gameplay-focused features to full-stack web
              applications, I approach each project with a creator's mindset and an engineer's
              discipline.
            </p>
            <p>
              My experience spans game development, web technologies, and system architecture.
              I thrive on complex challenges that require creative solutions, whether it's
              optimizing performance for 60fps gameplay or architecting scalable backend systems.
            </p>
          </div>

          <div className="about-section">
            <h2>What I Do</h2>
            <ul className="about-list" role="list">
              <li>Design and implement gameplay systems with focus on feel, feedback, and performance</li>
              <li>Build full-stack web applications from concept through production</li>
              <li>Create user-centered experiences that balance aesthetics with functionality</li>
              <li>Optimize systems for scalability, maintainability, and long-term support</li>
              <li>Collaborate across disciplines to bring creative visions to life</li>
            </ul>
          </div>

          <div className="about-section">
            <h2>Technical Skills</h2>
            <SkillsGrid />
          </div>

          <div className="about-section" id="get-in-touch">
            <h2>Get in Touch</h2>
            <p>
              I'm always interested in discussing new projects, creative ideas, or opportunities
              to collaborate. Feel free to reach out!
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
import { Zap, Layers, Cpu } from 'lucide-react';
import SEO from "../../components/SEO";
import PageTransition from "../../components/PageTransition";
import HeroBlock from "../../components/HeroBlock/HeroBlock";
import HomeCards from "../../components/HomeCards/HomeCards";
import CareerScroller from "../../components/CareerScroller/CareerScroller";
import "./Home.css";

const PILLARS = [
  {
    Icon: Zap,
    title: "Gameplay Engineering",
    body: "Feel-first feature design: physics, state machines, and real-time systems built to run at 60 fps.",
    color: "var(--pillar-color-a)",
  },
  {
    Icon: Layers,
    title: "Full-Stack Web",
    body: "React to backend — production-deployed applications built end-to-end with performance in mind.",
    color: "var(--pillar-color-b)",
  },
  {
    Icon: Cpu,
    title: "System Architecture",
    body: "Modular, maintainable code designed for iteration, scalability, and long-term team support.",
    color: "var(--pillar-color-c)",
  },
];

const TECH = [
  "JavaScript", "TypeScript", "C#", "C++", "Python",
  "React", "Node.js", "Unity", "Unreal Engine", "Git",
];

export default function Home({ name, job }) {
  return (
    <PageTransition>
      <SEO />
      <section className="home-shell">
        <div className="home-hero">
          <HeroBlock
            name={name}
            job={job}
            intro="Software engineer with a gameplay focus. I design and ship systems end-to-end — from player mechanics to production web interfaces — with an emphasis on feel, performance, and maintainability."
          />
          <HomeCards />
        </div>

        {/* Pillar tiles */}
        <div className="home-pillars" role="list">
          {PILLARS.map(({ Icon, title, body, color }, i) => (
            <div
              key={title}
              className="home-pillar"
              role="listitem"
              style={{ "--pillar-accent": color, "--pillar-delay": `${500 + i * 120}ms` }}
            >
              <Icon className="home-pillar-icon" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>

        {/* Tech strip */}
        <div className="home-tech-strip" aria-label="Technologies">
          {TECH.map((t) => (
            <span key={t} className="home-tag">{t}</span>
          ))}
        </div>

        <div className="home-bottom-line" aria-hidden="true" />
      </section>

      {/* Scroll-driven career timeline */}
      <CareerScroller />
    </PageTransition>
  );
}
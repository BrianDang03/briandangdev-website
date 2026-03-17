import { Zap, Layers, Cpu } from 'lucide-react';
import SEO from "../../components/SEO";
import PageTransition from "../../components/PageTransition";
import HeroBlock from "../../components/HeroBlock/HeroBlock";
import HomeCards from "../../components/HomeCards/HomeCards";
import "./Home.css";

const PILLARS = [
  {
    Icon: Layers,
    title: "Full-Stack Development",
    body: "End-to-end web applications built from database to UI, production-deployed and relied on by real teams.",
    color: "var(--pillar-color-b)",
  },
  {
    Icon: Zap,
    title: "Automation & Tooling",
    body: "Python-driven workflow automation that replaced manual processes and cut fulfillment time from hours to minutes.",
    color: "var(--pillar-color-a)",
  },
  {
    Icon: Cpu,
    title: "Algorithms & Open Source",
    body: "Contributor to an NSF-funded C++ linear algebra library, implementing numerical routines and test cases for production use.",
    color: "var(--pillar-color-c)",
  },
];

const TECH = [
  "JavaScript", "C#", "C++", "Python",
  "React", "Node.js", "MongoDB", "Express", "Git",
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

    </PageTransition>
  );
}
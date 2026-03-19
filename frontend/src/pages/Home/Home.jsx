import { Zap, Layers, Cpu } from 'lucide-react';
import SEO from "../../components/SEO";
import PageTransition from "../../components/PageTransition";
import HeroBlock from "../../components/HeroBlock/HeroBlock";
import HomeCards from "../../components/HomeCards/HomeCards";
import TimelineSection from "../../components/TimelineSection/TimelineSection";
import "./Home.css";

const PILLARS = [
  {
    Icon: Layers,
    title: "Full-Stack Development",
    body: "Builds complete web applications from the database to the UI, shipped to production and relied on by real teams.",
    color: "var(--pillar-color-b)",
  },
  {
    Icon: Zap,
    title: "Automation & Tooling",
    body: "Workflow automation built in Python that replaced manual processes and cut fulfillment time from hours to minutes.",
    color: "var(--pillar-color-a)",
  },
  {
    Icon: Cpu,
    title: "Algorithms & Open Source",
    body: "Contributor to a C++ linear algebra library backed by NSF funding, implementing numerical routines and test cases for production use.",
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
        {/* ── Above-the-fold: fills 100vh, hero centred ── */}
        <div className="home-above-fold">
          <div className="home-hero">
            <HeroBlock
              name={name}
              job={job}
              intro="Software engineer who builds tools and products that create real impact. I ship production web applications, automate workflows, and contribute to open source. I thrive when the work has a clear purpose and real consequences."
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

          {/* Skills & beam */}
          <div className="home-tech-strip" aria-label="Technologies">
            {TECH.map((t) => (
              <span key={t} className="home-tag">{t}</span>
            ))}
          </div>

          <div className="home-bottom-line" aria-hidden="true" />

          {/* Career timeline */}
          <TimelineSection />
        </div>

      </section>

    </PageTransition>
  );
}
import TiltFlipCard from "../components/tilt_flip_card/TiltFlipCard";
import FlipIcon from "../components/FlipIcon";

export default function Home({ name, job }) {
  return (
    <section className="home-shell">
      <div className="hero-block">
        <h1>{name}</h1>
        <h2>{job}</h2>
        <p className="hero-lead">
          Ideas engineered into unforgettable experiences.
        </p>
      </div>

      <div className="card-container">
        <TiltFlipCard
          frontImg={`${import.meta.env.BASE_URL}headshot.jpg`}
          front={
            <div className="card-copy-front">
              <h3>About Me</h3>

              <p className="card-hint">
                Tap to Learn More
                <FlipIcon />
              </p>
            </div>
          }
          back={
            <div className="card-copy-back">
              <h3>Core Profile</h3>
              <ul>
                <li>Creator mindset with a focus on memorable player and user experiences.</li>
                <li>Designs and implements systems from concept through production.</li>
                <li>Gameplay engineer who seeks challenge and continuous growth.</li>
              </ul>
            </div>
          }
          maxTilt={20}
        />

        <TiltFlipCard
          frontImg={`${import.meta.env.BASE_URL}modem.jpg`}
          front={
            <div className="card-copy-front">
              <h3>Portfolio</h3>
              <p className="card-hint">
                Tap to Learn More
                <FlipIcon />
              </p>
            </div>
          }
          back={
            <div className="card-copy-back">
              <h3>Recent Systems</h3>
              <ul>
                <li>Gameplay-focused features that balance feel, feedback, and performance.</li>
                <li>System architecture built for iteration, scalability, and long-term support.</li>
                <li>End-to-end implementation across front-end experience and technical delivery.</li>
              </ul>
            </div>
          }
          maxTilt={20}
        />

        <TiltFlipCard
          frontImg={`${import.meta.env.BASE_URL}contact.png`}
          front={
            <div className="card-copy-front">
              <h3>Contact Me</h3>

              <p className="card-hint">
                Tap to Learn More
                <FlipIcon />
              </p>
            </div>
          }
          back={
            <div className="card-copy-back">
              <h3>Channels</h3>
              <ul>
                <li>Email: hello@briandang.dev</li>
                <li>GitHub: github.com</li>
                <li>LinkedIn: linkedin.com</li>
              </ul>
            </div>
          }
          maxTilt={20}
        />
      </div>

      <div className="home-bottom-line" aria-hidden="true" />
    </section>
  );
}
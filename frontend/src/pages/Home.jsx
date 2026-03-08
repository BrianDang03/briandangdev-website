import TiltFlipCard from "../components/tilt_flip_card/TiltFlipCard";
import FlipIcon from "../components/FlipIcon";

export default function Home({ name, job }) {
  return (
    <section className="home-shell">
      <div className="hero-block">
        <p className="hero-kicker">Atmospheric Interface Engineer</p>
        <h1>{name}</h1>
        <h2>{job}</h2>
        <p className="hero-lead">
          I build clean, high-performance products that feel cinematic,
          intentional, and alive across desktop and mobile surfaces.
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
                <li>Software engineer focused on polished front-end systems.</li>
                <li>Builds interactions with motion, depth, and clarity.</li>
                <li>Comfortable from UI architecture to deployment.</li>
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
                <li>Interactive front-end builds with custom 3D card motion.</li>
                <li>Mobile-first website architecture and route-ready layouts.</li>
                <li>Component-driven UI libraries for reusable shipping speed.</li>
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
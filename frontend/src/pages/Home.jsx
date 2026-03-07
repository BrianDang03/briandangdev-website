import TiltFlipCard from "../components/tilt_flip_card/TiltFlipCard";
import FlipIcon from "../components/FlipIcon";

function NameTitle({ name }) {
  return (<h1>{name}</h1>);
}

function JobTitle({ job }) {
  return (<h2>{job}</h2>);
}

export default function Home({ name, job }) {
  return (
    <div>
      <NameTitle name={name} />
      <JobTitle job={job} />
      <div className="card-container">
        <TiltFlipCard
          frontImg="./headshot.jpg"
          front={
            <>
              <h2>About Me</h2>

              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                Tap to Learn More
                <FlipIcon />
              </h3>
            </>
          }
          back={
            <>
              <h3>Details</h3>
              <ul>
              </ul>
            </>
          }
          maxTilt={20}
        />

        <TiltFlipCard
          frontImg="/modem.jpg"
          front={
            <>
              <h2>Portfolio</h2>
              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                Tap to Learn More
                <FlipIcon />
              </h3>
            </>
          }
          backImg="/modem.jpg"
          back={
            <>
              <h3>Details</h3>
              <p>More info here</p>
            </>
          }
          maxTilt={20}
        />

        <TiltFlipCard
          frontImg="./contact.png"
          front={
            <>
              <h2>Contact Me</h2>

              <h3
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                Tap to Learn More
                <FlipIcon />
              </h3>
            </>
          }
          backImg="./vite.svg"
          back={
            <>
              <h3>Details</h3>
              <ul>
              </ul>
            </>
          }
          maxTilt={20}
        />
      </div>
    </div>
  );
}
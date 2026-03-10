import TiltFlipCard from "../tilt_flip_card/TiltFlipCard";
import { Link } from "react-router-dom";
import FlipIcon from "../FlipIcon/FlipIcon";
import '../ActionButton.css';
import './HomeCards.css';

const ASSET_BASE = import.meta.env.BASE_URL;
const CARD_HINT_TEXT = "Tap to Learn More";
const CARD_IMAGE_SIZES = "(max-width: 640px) 88vw, (max-width: 1280px) 320px, (max-width: 1600px) 360px, 400px";

function makeSrcSet(name, ext) {
  return `${ASSET_BASE}${name}-480.${ext} 480w, ${ASSET_BASE}${name}-768.${ext} 768w, ${ASSET_BASE}${name}-1200.${ext} 1200w`;
}

export default function HomeCards() {
  return (
    <div className="card-container">
      <TiltFlipCard
          frontImg={`${ASSET_BASE}modem.jpg`}
          frontWebpSrcSet={makeSrcSet("modem", "webp")}
          frontJpegSrcSet={makeSrcSet("modem", "jpg")}
          frontSizes={CARD_IMAGE_SIZES}
          prioritizeFrontImage
          entranceFrom="left"
          entranceOrder={0}
          front={
            <div className="card-copy-front">
              <h3>Portfolio</h3>
              <p className="card-hint">
                {CARD_HINT_TEXT}
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
                <li>End-to-end implementation across front-end experience.</li>
              </ul>
              <div className="card-action-wrapper card-actions-row">
                <Link to="/portfolio" className="card-action-btn">See More</Link>
                <a
                  href="https://github.com/BrianDang03"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-icon-btn"
                  aria-label="GitHub Profile"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          }
          maxTilt={20}
        />

      <TiltFlipCard
          frontImg={`${ASSET_BASE}headshot.jpg`}
          frontWebpSrcSet={makeSrcSet("headshot", "webp")}
          frontJpegSrcSet={makeSrcSet("headshot", "jpg")}
          frontSizes={CARD_IMAGE_SIZES}
          entranceFrom="front"
          entranceOrder={0}
          front={
            <div className="card-copy-front">
              <h3>About Me</h3>
              <p className="card-hint">
                {CARD_HINT_TEXT}
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
              <div className="card-action-wrapper">
                <Link to="/about" className="card-action-btn">See More</Link>
              </div>
            </div>
          }
          maxTilt={20}
        />

      <TiltFlipCard
          frontImg={`${ASSET_BASE}contact.png`}
          frontWebpSrcSet={makeSrcSet("contact", "webp")}
          frontJpegSrcSet={makeSrcSet("contact", "jpg")}
          frontSizes={CARD_IMAGE_SIZES}
          entranceFrom="right"
          entranceOrder={0}
          front={
            <div className="card-copy-front">
              <h3>Contact Me</h3>
              <p className="card-hint">
                {CARD_HINT_TEXT}
                <FlipIcon />
              </p>
            </div>
          }
          back={
            <div className="card-copy-back">
              <h3>Channels</h3>
              <ul>
                <li>Email: briandang730@gmail.com</li>
                <li>Phone: (720) 546-4929</li>
              </ul>
              <div className="social-links">
                <a
                  href="https://www.linkedin.com/in/brian-dang-b0a3a5256/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-icon-link"
                  aria-label="LinkedIn Profile"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="social-icon">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          }
          maxTilt={20}
        />
    </div>
  );
}

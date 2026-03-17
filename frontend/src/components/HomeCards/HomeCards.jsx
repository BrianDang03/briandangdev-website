import TiltFlipCard from "../TiltFlipCard/TiltFlipCard";
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
        frontImg={`${ASSET_BASE}headshot.jpg`}
        frontWebpSrcSet={makeSrcSet("headshot", "webp")}
        frontJpegSrcSet={makeSrcSet("headshot", "jpg")}
        frontSizes={CARD_IMAGE_SIZES}
        prioritizeFrontImage
        entranceFrom="right"
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
              <li>M.S. Computer Science at Colorado School of Mines.</li>
              <li>Learns new tools quickly and delivers under pressure.</li>
              <li>Mission driven, motivated by building tools that make a real difference.</li>
            </ul>
            <div className="card-action-wrapper">
              <Link to="/about" className="card-action-btn">See More</Link>
            </div>
          </div>
        }
        maxTilt={20}
      />
    </div>
  );
}

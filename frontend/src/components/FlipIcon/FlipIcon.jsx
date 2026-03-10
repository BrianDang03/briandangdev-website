import "./FlipIcon.css";

export default function FlipIcon() {
    return (
        <span className="flip-icon-shell" aria-hidden="true">
            <img
                src={`${import.meta.env.BASE_URL}flipIcon.png`}
                alt=""
                className="flip-icon-img"
                loading="lazy"
                decoding="async"
            />
        </span>
    );
}
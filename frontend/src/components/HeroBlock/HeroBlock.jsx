import './HeroBlock.css';

export default function HeroBlock({ name, job, lead = "Ideas engineered into unforgettable experiences." }) {
  return (
    <div className="hero-block">
      <h1>{name}</h1>
      <h2>{job}</h2>
      <p className="hero-lead">{lead}</p>
    </div>
  );
}

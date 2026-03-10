import SEO from "../../components/SEO";
import PageTransition from "../../components/PageTransition";
import HeroBlock from "../../components/HeroBlock/HeroBlock";
import HomeCards from "../../components/HomeCards/HomeCards";
import "./Home.css";

export default function Home({ name, job }) {
  return (
    <PageTransition>
      <SEO />
      <section className="home-shell">
        <HeroBlock name={name} job={job} />

        <HomeCards />

        <div className="home-bottom-line" aria-hidden="true" />
      </section>
    </PageTransition>
  );
}
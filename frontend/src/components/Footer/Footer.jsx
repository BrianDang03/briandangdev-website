import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Footer.css";

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleEmail = (e) => {
        e.preventDefault();
        if (location.pathname === "/about") {
            document.getElementById("get-in-touch")?.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate("/about", { state: { scrollTo: "get-in-touch" } });
        }
    };
    return (
        <footer className="site-footer">
            {/* Decorative background elements — sit above the backdrop but below the text */}
            <span className="ft-deco-orb" aria-hidden="true" />
            <span className="ft-deco-beam" aria-hidden="true" />

            <div className="footer-inner">
                <div className="footer-grid">
                    <div>
                        <p className="footer-title">Brian Dang</p>
                        <p className="footer-copy">
                            Creator. Systems designer. Gameplay engineer.
                            Built for challenge. Driven by growth.
                        </p>
                    </div>

                    <div>
                        <p className="footer-title">Navigate</p>
                        <div className="footer-links">
                            <Link to="/">Home</Link>
                            <Link to="/portfolio">Portfolio</Link>
                            <Link to="/about">About</Link>
                        </div>
                    </div>

                    <div>
                        <p className="footer-title">Connect</p>
                        <div className="footer-links">
                            <a href="/about#get-in-touch" onClick={handleEmail}>briandang730@gmail.com</a>
                            <a href="https://github.com/BrianDang03" target="_blank" rel="noreferrer">
                                GitHub
                            </a>
                            <a href="https://www.linkedin.com/in/brian-dang-b0a3a5256/" target="_blank" rel="noreferrer">
                                LinkedIn
                            </a>
                        </div>
                    </div>
                </div>

                <p className="footer-legal">Copyright © {CURRENT_YEAR} Brian Dang. All rights reserved.</p>
            </div>{/* end footer-inner */}
        </footer>
    );
}
import { Link } from "react-router-dom";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
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
                        <a href="mailto:hello@briandang.dev">hello@briandang.dev</a>
                        <a href="https://github.com" target="_blank" rel="noreferrer">
                            GitHub
                        </a>
                        <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>

            <p className="footer-legal">Copyright {year} Brian Dang. All rights reserved.</p>
        </footer>
    );
}
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinkClass = ({ isActive }) =>
        `nav-link ${isActive ? "is-active" : ""}`;

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="site-header">
            <nav className="site-nav" aria-label="Primary navigation">
                <NavLink to="/" className="brand-mark" onClick={closeMenu}>
                    <span className="brand-ring" aria-hidden="true" />
                    <span className="brand-text">Brian Dang</span>
                </NavLink>

                <button
                    type="button"
                    className={`nav-menu-btn ${isMenuOpen ? "is-open" : ""}`}
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-nav-panel"
                >
                    <span />
                    <span />
                    <span />
                </button>

                <button
                    type="button"
                    className={`nav-backdrop ${isMenuOpen ? "is-open" : ""}`}
                    onClick={closeMenu}
                    aria-hidden="true"
                    tabIndex={-1}
                />

                <div
                    id="mobile-nav-panel"
                    className={`nav-panel ${isMenuOpen ? "is-open" : ""}`}
                >
                    <div className="nav-links">
                        <NavLink to="/" className={navLinkClass} end onClick={closeMenu}>
                            Home
                        </NavLink>
                        <NavLink to="/portfolio" className={navLinkClass} onClick={closeMenu}>
                            Portfolio
                        </NavLink>
                        <NavLink to="/about" className={navLinkClass} onClick={closeMenu}>
                            About
                        </NavLink>
                    </div>

                    <a href="mailto:briandang730@gmail.com" className="nav-cta" onClick={closeMenu}>
                        Contact
                    </a>
                </div>
            </nav>
        </header>
    );
}
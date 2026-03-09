import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinkClass = ({ isActive }) =>
        `nav-link ${isActive ? "is-active" : ""}`;

    useEffect(() => {
        if (!isMenuOpen) {
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";
            return;
        }

        const scrollY = window.scrollY;
        document.body.dataset.lockScrollY = String(scrollY);
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";

        return () => {
            const lockedY = Number.parseInt(document.body.dataset.lockScrollY || "0", 10) || 0;
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";
            delete document.body.dataset.lockScrollY;
            if (isMenuOpen) {
                window.scrollTo(0, lockedY);
            }
        };
    }, [isMenuOpen]);

    useEffect(() => {
        if (!isMenuOpen) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("keydown", handleEscape);
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

                    <div className="nav-actions">
                        <a href="mailto:briandang730@gmail.com" className="nav-cta" onClick={closeMenu}>
                            Contact
                        </a>
                        <ThemeToggle />
                    </div>
                </div>
            </nav>
        </header>
    );
}
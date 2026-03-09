import { motion as Motion } from 'framer-motion';
import "./SkillsGrid.css";

const skills = {
    "Languages": ["JavaScript", "TypeScript", "Python", "C#", "Java", "C++"],
    "Frontend": ["React", "Vue", "HTML/CSS", "Tailwind", "Framer Motion"],
    "Backend": ["Node.js", "Express", "Django", "REST APIs", "GraphQL"],
    "Tools & Other": ["Git", "Docker", "AWS", "Unity", "Unreal Engine", "Agile"]
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4
        }
    }
};

export default function SkillsGrid() {
    return (
        <div className="skills-section">
            {Object.entries(skills).map(([category, items]) => (
                <div key={category} className="skill-category">
                    <h3>{category}</h3>
                    <Motion.div
                        className="skill-tags"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        {items.map((skill) => (
                            <Motion.span
                                key={skill}
                                className="skill-tag"
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, y: -2 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                {skill}
                            </Motion.span>
                        ))}
                    </Motion.div>
                </div>
            ))}
        </div>
    );
}

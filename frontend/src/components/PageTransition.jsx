import { motion as Motion } from 'framer-motion';
import { useLayoutEffect } from 'react';
import { shouldUseSimpleMotion } from '../utils/motionProfile';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
};

export default function PageTransition({ children }) {
    const simpleMotion = shouldUseSimpleMotion();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    return (
        <Motion.div
            variants={simpleMotion ? undefined : pageVariants}
            initial={simpleMotion ? false : "initial"}
            animate={simpleMotion ? undefined : "animate"}
            exit={simpleMotion ? undefined : "exit"}
        >
            {children}
        </Motion.div>
    );
}

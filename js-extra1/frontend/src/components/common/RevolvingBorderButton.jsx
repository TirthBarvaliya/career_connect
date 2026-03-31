import { motion } from "framer-motion";

/**
 * Wraps any child element with a continuously-revolving border beam.
 * The beam colour adapts to light / dark theme via CSS classes defined
 * in index.css (.revolving-border-wrap / .revolving-border-inner).
 *
 * Props:
 *  - children      — the button or element to wrap
 *  - className     — extra classes on the outer wrapper
 *  - innerClassName — extra classes on the inner masking layer (default: themed bg)
 *  - as            — wrapper HTML tag (default: "span" for inline use)
 */
const RevolvingBorderButton = ({
    children,
    className = "",
    innerClassName = "",
    as: Tag = "span"
}) => {
    return (
        <motion.span
            className={`revolving-border-wrap ${className}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <Tag
                className={`revolving-border-inner ${innerClassName}`}
            >
                {children}
            </Tag>
        </motion.span>
    );
};

export default RevolvingBorderButton;

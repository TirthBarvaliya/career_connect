import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TypingHeadline = ({ phrases, typeSpeed = 55, deleteSpeed = 30, pause = 2000 }) => {
  const safePhrases = useMemo(
    () => (Array.isArray(phrases) && phrases.length ? phrases.map(String) : [""]),
    [phrases]
  );

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    const currentFullPhrase = safePhrases[phraseIndex];

    if (!isDeleting && displayedText.length < currentFullPhrase.length) {
      // Typing forward
      timeout = setTimeout(() => {
        setDisplayedText(currentFullPhrase.slice(0, displayedText.length + 1));
      }, typeSpeed);
    } else if (!isDeleting && displayedText.length === currentFullPhrase.length) {
      // Paused at the end of the word
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pause);
    } else if (isDeleting && displayedText.length > 0) {
      // Deleting backwards
      timeout = setTimeout(() => {
        setDisplayedText(currentFullPhrase.slice(0, displayedText.length - 1));
      }, deleteSpeed);
    } else if (isDeleting && displayedText.length === 0) {
      // Move to next word, pause briefly
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % safePhrases.length);
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, phraseIndex, safePhrases, typeSpeed, deleteSpeed, pause]);

  // Prevent Layout Shifts by reserving maximum width
  const longestPhrase = useMemo(
    () => safePhrases.reduce((max, item) => (item.length > max.length ? item : max), ""),
    [safePhrases]
  );

  return (
    <span className="relative inline-flex items-center justify-start align-baseline">
      {/* Invisible placeholder for max width */}
      <span aria-hidden className="invisible whitespace-nowrap">
        {longestPhrase}
      </span>

      {/* Actual typing content overlay */}
      <span className="absolute left-0 top-0 flex items-center">
        <span className="flex whitespace-nowrap text-slate-900 dark:text-white">
          {displayedText.split("").map((char, index) => (
            <motion.span
              key={`${phraseIndex}-${index}`}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(2px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }} // Subtle glass blur reveal
              className="inline-block"
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </span>

        {/* Premium Aceternity Block Cursor */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="ml-[4px] inline-block h-[1em] w-[4px] bg-brand-indigo dark:bg-cyan-400"
          style={{ transform: "translateY(-5%)" }}
        />
      </span>
    </span>
  );
};

export default TypingHeadline;

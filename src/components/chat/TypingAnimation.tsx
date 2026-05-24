"use client";

import { motion } from "framer-motion";

const dotVariants = {
  initial: { opacity: 0.3, y: 0 },
  animate: { opacity: 1, y: -4 },
};

export const TypingAnimation = () => {
  return (
    <div className="flex items-center gap-1 rounded-[18px] border border-app-border bg-white/90 px-3 py-2 text-app-text shadow-sm">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-2 w-2 rounded-full bg-app-primary"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            repeat: Infinity,
            repeatType: "mirror",
            duration: 0.6,
            delay: index * 0.15,
          }}
        />
      ))}
      <span className="ml-2 text-xs text-app-text-muted">Typing</span>
    </div>
  );
};

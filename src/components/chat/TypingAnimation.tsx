"use client";

import { motion } from "framer-motion";

const dotVariants = {
  initial: { opacity: 0.3, y: 0 },
  animate: { opacity: 1, y: -4 },
};

export const TypingAnimation = ({ message = "Khwaaish is thinking..." }: { message?: string }) => {
  return (
    <div className="flex items-center gap-1.5 rounded-[22px] border border-app-border bg-white/95 px-4 py-2.5 text-app-text shadow-[0_8px_20px_rgba(17,24,39,0.04)] w-fit">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="h-1.8 w-1.8 rounded-full bg-app-primary"
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
      </div>
      <span className="ml-1.5 text-xs text-app-text-muted font-semibold tracking-wide animate-pulse">{message}</span>
    </div>
  );
};

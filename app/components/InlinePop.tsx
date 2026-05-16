"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function InlinePop({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`inline-block align-middle will-change-transform ${className ?? ""}`}
      style={{ transformOrigin: "center" }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      variants={reduce ? { hidden: {}, show: {} } : variants}
      transition={{ delay }}
    >
      {children}
    </motion.span>
  );
}

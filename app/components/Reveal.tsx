"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  className?: string;
  amount?: number;
  once?: boolean;
};

export default function Reveal({
  children,
  delay = 0,
  y = 32,
  duration = 0.9,
  className,
  amount = 0.3,
  once = true,
}: Props) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : y, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
}

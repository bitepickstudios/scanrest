"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { Children, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  y?: number;
  amount?: number;
  once?: boolean;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function StaggerGrid({
  children,
  className,
  stagger = 0.08,
  delay = 0.05,
  amount = 0.2,
  once = true,
}: Props) {
  const reduce = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: {
      transition: reduce
        ? { duration: 0 }
        : { delayChildren: delay, staggerChildren: stagger },
    },
  };
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={container}
    >
      {Children.map(children, (child, i) => (
        <motion.div key={i} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

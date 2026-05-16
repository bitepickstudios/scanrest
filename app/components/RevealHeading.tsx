"use client";

import {
  motion,
  useReducedMotion,
  type Variants,
  type HTMLMotionProps,
} from "motion/react";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
  stagger?: number;
  amount?: number;
  once?: boolean;
};

function splitNode(node: ReactNode, keyPrefix: string): ReactNode[] {
  if (typeof node === "string") {
    const tokens = node.split(/(\s+)/);
    return tokens.map((t, i) => {
      if (/^\s+$/.test(t)) return <span key={`${keyPrefix}-s-${i}`}> </span>;
      if (t === "") return null;
      return (
        <motion.span
          key={`${keyPrefix}-w-${i}`}
          className="inline-block will-change-transform"
          variants={wordVariants}
        >
          {t}
        </motion.span>
      );
    });
  }
  if (Array.isArray(node)) {
    return node.flatMap((n, i) => splitNode(n, `${keyPrefix}-${i}`));
  }
  return [node];
}

const wordVariants: Variants = {
  hidden: { opacity: 0, y: "0.6em", filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, rotate: -15, y: "0.4em" },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: 0,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function RevealHeading({
  children,
  as = "h2",
  className,
  delay = 0,
  stagger = 0.06,
  amount = 0.4,
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

  const words = splitNode(children, "h");

  const motionProps: HTMLMotionProps<"h2"> = {
    className,
    initial: "hidden",
    whileInView: "show",
    viewport: { once, amount },
    variants: container,
  };

  if (as === "h1") return <motion.h1 {...motionProps}>{words}</motion.h1>;
  if (as === "h3") return <motion.h3 {...motionProps}>{words}</motion.h3>;
  return <motion.h2 {...motionProps}>{words}</motion.h2>;
}

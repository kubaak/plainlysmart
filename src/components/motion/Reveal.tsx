"use client";

import { motion, stagger, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

// Keyframes start only on entry. The server HTML and uninitialized page stay visible.
export function useEntrance(distance = 14): Variants {
  const reduced = useReducedMotion();
  return {
    visible: reduced
      ? { opacity: 1, translateY: 0, transition: { duration: 0, delay: 0 } }
      // Keep this independent of feedback's y so hover exit cannot replay entry keyframes.
      : { opacity: [0.35, 1], translateY: [distance, 0], transition: { duration: 0.55, ease } },
  };
}

type Props = HTMLMotionProps<"div"> & { distance?: number };

export function Reveal({ distance, ...props }: Props) {
  const variants = useEntrance(distance);
  return <motion.div {...props} initial={false} variants={variants} whileInView="visible" viewport={{ once: true, amount: 0.15 }} />;
}

export function Stagger({ interval = 0.075, ...props }: HTMLMotionProps<"div"> & { interval?: number }) {
  const reduced = useReducedMotion();
  return <motion.div {...props} initial={false} whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={{ visible: { transition: { delayChildren: reduced ? 0 : stagger(interval) } } }} />;
}

export function StaggerItem({ distance, ...props }: Props) {
  const variants = useEntrance(distance);
  return <motion.div {...props} variants={variants} />;
}

export function MotionHeading(props: HTMLMotionProps<"h1">) {
  const variants = useEntrance(10);
  return <motion.h1 {...props} variants={variants} />;
}

export function MotionParagraph(props: HTMLMotionProps<"p">) {
  const variants = useEntrance(10);
  return <motion.p {...props} variants={variants} />;
}

export function useFeedback(lift = 2) {
  const reduced = useReducedMotion();
  return {
    whileHover: reduced ? undefined : { y: -lift },
    whileTap: reduced ? undefined : { scale: 0.985 },
    transition: { type: "spring" as const, stiffness: 420, damping: 32 },
  };
}

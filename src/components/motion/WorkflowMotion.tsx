"use client";

import { useId } from "react";
import { motion, stagger, useReducedMotion, type HTMLMotionProps } from "motion/react";

const timing = { inputs: 0, input: 0, engine: 0.5, spark: 0.7, connector: 0.8, output: 0.95, rows: 1.05, row: 0, saved: 1.6 };
const ease = [0.22, 1, 0.36, 1] as const;

export function WorkflowScene(props: HTMLMotionProps<"div">) {
  return <motion.div {...props} initial={false} whileInView="flow" viewport={{ once: true, amount: 0.25 }} />;
}

export function WorkflowStep({ stage, group, ...props }: HTMLMotionProps<"div"> & { stage: keyof typeof timing; group?: boolean }) {
  const reduced = useReducedMotion();
  const delay = timing[stage];
  return <motion.div {...props} variants={{ flow: group
    ? { transition: { delayChildren: reduced ? 0 : stagger(0.1, { startDelay: delay }) } }
    : reduced
      ? { opacity: 1, translateY: 0, scale: 1, transition: { duration: 0, delay: 0 } }
      : {
          opacity: [0.35, 1],
          // CSS rotate/translate retain the cards' original placement beneath this transform.
          translateY: [7, 0],
          ...(stage === "spark" ? { scale: [1, 1.12, 1] } : {}),
          transition: { delay, duration: 0.45, ease },
        },
  }} />;
}

const path = "M65 0v22q0 15 15 15h105q15 0 15 15v33M200 0v85M335 0v22q0 15-15 15H215q-15 0-15 15v33";

export function WorkflowConnections() {
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <svg viewBox="0 0 400 85" fill="none" preserveAspectRatio="none">
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="85">
          <motion.path d={path} stroke="white" strokeWidth="4" variants={{ flow: reduced
            ? { pathLength: 1, transition: { duration: 0, delay: 0 } }
            : { pathLength: [0, 1], transition: { delay: 0.25, duration: 0.5, ease } },
          }} />
        </mask>
      </defs>
      <path d={path} stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 4" mask={`url(#${id})`} />
    </svg>
  );
}

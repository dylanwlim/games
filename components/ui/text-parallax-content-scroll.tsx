"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { useRef, type ReactNode } from "react";

const imagePadding = 12;

type TextParallaxContentProps = {
  imgUrl: string;
  subheading: string;
  heading: string;
  children: ReactNode;
};

export function DiscoverParallaxContent() {
  return (
    <div className="discover-parallax">
      <TextParallaxContent
        imgUrl="/art/discover-action.png"
        subheading="Action"
        heading="Fast rounds with clean restarts."
      >
        <DiscoverSectionCopy
          title="Built for short sessions."
          body="Dylan Games keeps the loop immediate: open a game, understand the rules, and play without a wall of setup. The action shelf starts with Snake and leaves room for tighter arcade pieces next."
          href="/genres/action"
          action="Browse Action"
        />
      </TextParallaxContent>
      <TextParallaxContent
        imgUrl="/art/discover-puzzle.png"
        subheading="Puzzle"
        heading="Quiet logic, readable boards."
      >
        <DiscoverSectionCopy
          title="Every placeholder has a real place."
          body="Puzzle slots are shaped around finished unavailable states, clear game metadata, and future routes that can become playable without reshaping the hub."
          href="/genres/puzzle"
          action="Browse Puzzle"
        />
      </TextParallaxContent>
      <TextParallaxContent
        imgUrl="/art/discover-racing.png"
        subheading="Racing"
        heading="Motion without clutter."
      >
        <DiscoverSectionCopy
          title="Designed to stay light."
          body="The hub uses local artwork, static-first routes, accessible navigation, and restrained motion so new games can arrive without making the interface feel heavier."
          href="/genres/racing"
          action="Browse Racing"
        />
      </TextParallaxContent>
    </div>
  );
}

export function TextParallaxContent({
  imgUrl,
  subheading,
  heading,
  children,
}: TextParallaxContentProps) {
  return (
    <section className="text-parallax-content" style={{ paddingInline: imagePadding }}>
      <div className="text-parallax-sticky">
        <StickyImage imgUrl={imgUrl} />
        <OverlayCopy heading={heading} subheading={subheading} />
      </div>
      {children}
    </section>
  );
}

function StickyImage({ imgUrl }: { imgUrl: string }) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["end end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <motion.div
      ref={targetRef}
      className="text-parallax-image"
      style={{
        backgroundImage: `url(${imgUrl})`,
        height: `calc(100svh - ${imagePadding * 2}px)`,
        top: imagePadding,
        scale: shouldReduceMotion ? 1 : scale,
      }}
    >
      <motion.div className="text-parallax-overlay" style={{ opacity }} />
    </motion.div>
  );
}

function OverlayCopy({ subheading, heading }: { subheading: string; heading: string }) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [220, -220]);
  const opacity = useTransform(scrollYProgress, [0.24, 0.48, 0.78], [0, 1, 0]);

  return (
    <motion.div
      ref={targetRef}
      className="text-parallax-copy"
      style={{
        y: shouldReduceMotion ? 0 : y,
        opacity: shouldReduceMotion ? 1 : opacity,
      }}
    >
      <p>{subheading}</p>
      <h2>{heading}</h2>
    </motion.div>
  );
}

function DiscoverSectionCopy({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: Route;
  action: string;
}) {
  return (
    <div className="discover-section-copy">
      <h3>{title}</h3>
      <div>
        <p>{body}</p>
        <Link className="discover-action" href={href}>
          {action}
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

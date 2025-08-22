import React, { useState, useEffect, useRef } from "react";
import GlassBar from "./glassbar";
import HeroImage from "./../../public/AlphoraHeroImage.png";
import FloatingCubeImage from "./../../public/img4.png";
import Optimisation from "./../../public/perplexity image 12.avif";
import asManyAsthestars from "./../../public/image 2.avif";
import StressTestImage from "./../../public/image 5.avif";
// Feature & UI icons (Material UI)
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import PublicIcon from "@mui/icons-material/Public";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { subscribeEmail } from "../utils/mailchimp";

export default function LandingPage() {
  const [email, setEmail] = useState<string>("");
  const [showFloatingBar, setShowFloatingBar] = useState<boolean>(false);
  const [dockProgress, setDockProgress] = useState(0); // 0 = fully floating, 1 = fully docked inside CTA
  const [subStatus, setSubStatus] = useState<{
    state: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ state: "idle", message: "" });

  const featuresRef = useRef<HTMLDivElement | null>(null);
  const faqRef = useRef<HTMLDivElement | null>(null);
  const ctaEndRef = useRef<HTMLDivElement | null>(null);
  const ctaFormRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setSubStatus({ state: "loading", message: "Submitting..." });
    const res = await subscribeEmail(email);
    if (res.ok) {
      setSubStatus({
        state: "success",
        message: "Success! Added to the list.",
      });
    } else {
      setSubStatus({
        state: "error",
        message: res.message || "Could not subscribe.",
      });
    }
  };

  useEffect(() => {
    const onScroll = () => {
      // Original CTA visibility -> decide if floating bar should show
      const ctaBottom =
        ctaFormRef.current?.getBoundingClientRect().bottom ??
        Number.POSITIVE_INFINITY;
      const faqTop =
        faqRef.current?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;

      const ctaLeaveThreshold = 16;
      const faqApproachThreshold = 120;

      // Docking logic (animate floating bar morphing into bottom CTA)
      const ctaEndTop =
        ctaEndRef.current?.getBoundingClientRect().top ??
        Number.POSITIVE_INFINITY;
      const vh = window.innerHeight;

      // Start docking once the bottom CTA section starts entering the viewport
      // Finish docking after it has advanced 180px into the viewport
      const DOCK_START = vh; // when its top touches bottom edge
      const DOCK_RANGE = 180;

      let progress = 0;
      if (ctaEndTop < DOCK_START) {
        progress = (DOCK_START - ctaEndTop) / DOCK_RANGE;
      }
      progress = Math.min(Math.max(progress, 0), 1);
      setDockProgress(progress);

      const shouldFloatBase =
        ctaBottom < ctaLeaveThreshold && faqTop > faqApproachThreshold;

      // Keep floating bar logic independent of docking; we decide visibility later
      setShowFloatingBar(shouldFloatBase);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // Tuning thresholds so only ONE bar is visible (prevents overlap)
  const FLOAT_HIDE_AT = 0.35; // when to fully hide floating version
  const DOCK_SHOW_AT = 0.15; // when to start showing dock target

  // Eased progress for smoother visual (simple ease-out)
  const ease = (t: number) => 1 - Math.pow(1 - t, 2);

  // Floating bar styles (visible only until FLOAT_HIDE_AT)
  const floatPhase = dockProgress / FLOAT_HIDE_AT;
  const clampedFloatPhase = Math.min(Math.max(floatPhase, 0), 1);
  const floatingStyle: React.CSSProperties = {
    transform: `scale(${1 - 0.07 * clampedFloatPhase}) translateY(${
      -4 * clampedFloatPhase
    }px)`,
    opacity: 1 - ease(clampedFloatPhase),
    pointerEvents: dockProgress >= FLOAT_HIDE_AT ? "none" : "auto",
    transition: "transform 160ms ease, opacity 160ms ease",
  };

  // Dock (bottom CTA) fade/scale only after DOCK_SHOW_AT
  const dockPhase =
    dockProgress <= DOCK_SHOW_AT
      ? 0
      : (dockProgress - DOCK_SHOW_AT) / (1 - DOCK_SHOW_AT);
  const clampedDockPhase = Math.min(Math.max(dockPhase, 0), 1);
  const dockedStyle: React.CSSProperties = {
    opacity: ease(clampedDockPhase),
    transform: `scale(${0.96 + 0.04 * clampedDockPhase})`,
    transition: "transform 220ms ease, opacity 220ms ease",
    visibility: clampedDockPhase === 0 ? "hidden" : "visible",
  };

  const showFloating = showFloatingBar && dockProgress < FLOAT_HIDE_AT;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 text-[15px] sm:text-[16px] md:text-[17px] leading-relaxed">
      {/* Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0b0f17]/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => scrollToId("hero")}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Alphora home"
          >
            <span className="font-semibold tracking-tight text-xl">
              Alphora
            </span>
          </button>
          <nav className="hidden gap-8 text-sm md:flex">
            <button
              onClick={() => scrollToId("features")}
              className="hover:text-gray-200 cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToId("faq")}
              className="hover:text-gray-200 cursor-pointer"
            >
              FAQ
            </button>
          </nav>
          <div className="hidden md:flex">
            <button
              onClick={() => scrollToId("bottom-cta")}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Join waitlist
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="relative isolate overflow-hidden pb-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900 via-slate-950 to-[#0b0f17]" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Modern Portfolio Theory for Everyone
            </h1>
            <p className="mt-4 text-lg leading-7 text-gray-300">
              Smarter investing made simple. Optimize your portfolio like
              institutions do — without the spreadsheets.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 flex w-full max-w-md items-center gap-2"
              id="cta"
              ref={ctaFormRef}
            >
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base outline-none transition placeholder:text-gray-400 focus:border-white/20 focus:ring-2 focus:ring-white/10"
              />
              <button
                type="submit"
                className="whitespace-nowrap rounded-xl bg-white px-5 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Join waitlist
              </button>
            </form>
            {subStatus.state !== "idle" && (
              <p
                className={`mt-3 text-sm ${
                  subStatus.state === "success"
                    ? "text-emerald-400"
                    : subStatus.state === "error"
                    ? "text-rose-400"
                    : "text-gray-400"
                }`}
              >
                {subStatus.message}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="mx-auto aspect-[16/10] w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm">
              <div className="flex h-full items-center justify-center">
                <img
                  src={HeroImage}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Gradient divider removed */}
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        id="features"
        className="relative mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Practical Modern Portfolio Theory, Made Accessible
          </h2>
          <p className="mt-3 text-gray-300 text-lg md:text-xl leading-snug">
            We transform complex portfolio theory into practical, actionable
            insights. Optimize your portfolio for growth, income, and risk —
            with the same tools used by institutions.
          </p>
        </div>

        {/* Analytics Row (info left, image right) */}
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <QueryStatsIcon className="h-5 w-5 text-indigo-400" />
              <span>Smarter Analytics (Backed by MPT)</span>
            </h3>
            <p className="mt-3 text-gray-300">
              Understand your portfolio like a professional. See risk-adjusted
              metrics such as Sharpe, Alpha, and Beta, explained in plain
              English.
            </p>
            <p className="mt-2 text-gray-400 italic text-[0.95rem]">
              Why it matters: See if your returns are worth the risk you’re
              taking.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-center text-gray-400">
              <img
                src={FloatingCubeImage}
                alt="Analytics preview"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Optimization Row (stacked: big image below) */}
        <div className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <AutoGraphIcon className="h-5 w-5 text-emerald-400" />
              <span>Optimize Risk &amp; Reward</span>
            </h3>
            <p className="mt-3 text-gray-300">
              Our optimizer uses variance, covariance, and the efficient
              frontier to recommend the ideal allocation for your risk
              tolerance.
            </p>
            <p className="mt-2 text-gray-400 italic text-[0.95rem]">
              Why it matters: Stay invested with confidence that your portfolio
              fits your goals.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md">
            <div className="flex h-full items-center justify-center text-gray-400">
              <img
                src={Optimisation}
                alt="Optimization preview"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* Diversification Row (image left) */}
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="order-2 rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md md:order-1">
            <div className="flex h-full items-center justify-center text-gray-400">
              <img
                src={asManyAsthestars}
                alt="Diversification insights preview"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <PublicIcon className="h-5 w-5 text-sky-400" />
              <span>Diversification Insights</span>
            </h3>
            <p className="mt-3 text-gray-300">
              We break down your exposure by sector, geography, and asset class
              — and show how each security contributes to your total risk.
            </p>
            <p className="mt-2 text-gray-400 italic text-[0.95rem]">
              Why it matters: Spot hidden concentrations before they become
              problems.
            </p>
          </div>
        </div>

        {/* Scenario Row (image right) */}
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <CrisisAlertIcon className="h-5 w-5 text-rose-400" />
              <span>Scenario Modeling</span>
            </h3>
            <p className="mt-3 text-gray-300">
              Stress-test your portfolio against real-world conditions. What if
              your largest stock drops 10%? What if interest rates rise?
            </p>
            <p className="mt-2 text-gray-400 italic text-[0.95rem]">
              Why it matters: Prepare for the future, don’t react to it.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 shadow-xl backdrop-blur-md">
            <div className="flex h-full items-center justify-center text-gray-400">
              <img
                src={StressTestImage}
                alt="Scenario modeling preview"
                className="h-full w-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <blockquote className="text-xl italic text-gray-300">
            “Modern Portfolio Theory was built for institutions. We put it to
            work for you — simple, visual, and actionable.”
          </blockquote>
        </div>
      </section>

      {/* FAQ */}
      <section
        ref={faqRef}
        id="faq"
        className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        {/*
          Split FAQs into two columns for better scanability.
          Falls back to a single column on small screens.
        */}
        {(() => {
          const faqs = [
            {
              q: "How is Alphora different from a robo‑advisor?",
              a: "We expose the underlying Modern Portfolio Theory metrics (efficient frontier, marginal contributions to risk, factor exposures) and let you tune constraints instead of auto‑piloting allocations.",
            },
            {
              q: "Do you support taxable accounts and tax‑aware rebalancing?",
              a: "Yes. We track lots, unrealized gains, and let you simulate harvest thresholds before applying a rebalance to minimize tax drag.",
            },
            {
              q: "What kinds of assets can I include?",
              a: "Equities, ETFs, mutual funds, bonds, and crypto with reliable data. You can add custom assets via price history or manual stats.",
            },
            {
              q: "Where do your return and risk estimates come from?",
              a: "Rolling historical stats blended with regime detection and forward factor / yield curve data to adapt expected returns & covariance.",
            },
            {
              q: "How often should I rebalance with Alphora?",
              a: "Rebalance when drift or tracking error thresholds trigger—not just calendar intervals—to reduce unnecessary turnover.",
            },
            {
              q: "Can I run stress tests and scenario analyses?",
              a: "Yes. Apply historical shocks, factor moves, rate shifts, or custom multi‑factor scenarios and view P&L, VaR, CVaR, drawdowns.",
            },
            {
              q: "How is my data secured?",
              a: "Data encrypted at rest and in transit. No storage of raw brokerage credentials; scoped tokens are revocable anytime.",
            },
            {
              q: "What will pricing look like?",
              a: "Early access is free. Planned tiers: individual, pro (factor + tax tools), and team (multi‑user + API).",
            },
            {
              q: "Is there a minimum portfolio size?",
              a: "No minimum. Advanced modules add more value as balances and complexity grow.",
            },
          ];
          const mid = Math.ceil(faqs.length / 2);
          const columns = [faqs.slice(0, mid), faqs.slice(mid)];
          return (
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {columns.map((col, i) => (
                <div key={i} className="space-y-5">
                  {col.map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition hover:border-white/20"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold">
                        <span>{item.q}</span>
                        <ExpandMoreIcon
                          className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                          fontSize="inherit"
                        />
                      </summary>
                      <p className="mt-3 text-base leading-relaxed text-gray-300">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
      </section>
      {/* Dock target CTA */}
      <section
        ref={ctaEndRef}
        id="bottom-cta"
        className="relative isolate border-t-0"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900" />
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="text-2xl font-semibold">
              Put Modern Portfolio Theory to work
            </h3>
            <p className="mt-2 text-gray-300">
              Join the waitlist to get early access to analytics, optimization,
              and scenario tools.
            </p>
          </div>
          <div
            className="mx-auto mt-6 max-w-3xl transition-all"
            style={dockedStyle}
          >
            <GlassBar
              onSubmit={handleSubmit}
              email={email}
              setEmail={setEmail}
              status={subStatus}
            />
          </div>
        </div>
      </section>

      {/* Floating GlassBar (hidden once docking begins past threshold) */}
      {showFloating && (
        <div
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
          style={floatingStyle}
        >
          <div className="w-full max-w-5xl">
            <GlassBar
              onSubmit={handleSubmit}
              email={email}
              setEmail={setEmail}
              status={subStatus}
              className="shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Alphora. All rights reserved.
            </p>
            <a
              href="mailto:Inquire@alphora.lambdalearner.com?subject=Alphora%20Inquiry"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Inquire@alphora.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

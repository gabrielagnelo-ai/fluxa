"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Logo } from "@/components/branding/logo";
import { sceneStore } from "./scene-store";

// Header, chapter progress and scroll reveals for the landing page.
// Progress: each [data-chapter] adds 0 to 1 while its top travels from 90% to 20% of the viewport.
export function LandingChrome() {
  const [solid, setSolid] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    document.documentElement.classList.add("reveal-ready");
    return () => document.documentElement.classList.remove("reveal-ready");
  }, []);

  useEffect(() => {
    const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]")).slice(1);
    const hero = document.querySelector<HTMLElement>("[data-chapter='0']");
    const final = document.querySelector<HTMLElement>("[data-chapter='5']");
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      let progress = 0;
      for (const chapter of chapters) {
        const top = chapter.getBoundingClientRect().top;
        progress += Math.min(1, Math.max(0, (height * 0.9 - top) / (height * 0.7)));
      }
      sceneStore.setProgress(progress);
      barRef.current?.style.setProperty("--p", String(progress / chapters.length));
      setSolid(window.scrollY > 24);
      // One filled action per view: the header offers "Começar" only between the hero and the final call.
      const pastHero = hero ? hero.getBoundingClientRect().bottom < height * 0.35 : false;
      const beforeFinal = final ? final.getBoundingClientRect().top > height * 0.6 : true;
      setShowCta(pastHero && beforeFinal);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-inview", "");
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  return (
    <header className="public-header fixed inset-x-0 top-0 z-30 border-b border-transparent" data-solid={solid}>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 md:px-10">
        <Link href="/" aria-label="Fluxa, início" className="-ml-1 rounded-md p-1">
          <Logo size="sm" />
        </Link>
        <nav aria-label="Acesso" className="relative flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="link-quiet px-2 text-[15px]">Entrar</Link>
          <Link href="/signup" className="btn-cyan header-cta !min-h-11 !px-5 !text-[15px]" data-visible={showCta} aria-hidden={!showCta} tabIndex={showCta ? undefined : -1}>
            Começar
          </Link>
        </nav>
      </div>
      <div className="h-px w-full bg-transparent">
        <div ref={barRef} className="chapter-progress h-px w-full bg-[var(--cyan)]" />
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { landingMotionPaused, MOTION_EVENT } from "./motion-toggle";

const examples = [
  { line: "07/10 · COMPRA DEB", name: "Mercado do bairro", amount: "−R$ 620,00", category: "Mercado", how: "Regra: contém “mercado”" },
  { line: "06/10 · BOLETO", name: "Aluguel e condomínio", amount: "−R$ 1.450,00", category: "Moradia", how: "Regra: contém “aluguel”" },
  { line: "09/10 · COMPRA CRED", name: "Cinema centro", amount: "−R$ 200,00", category: "Lazer", how: "Sugestão da IA, para você conferir" }
];

/** Category card beside the phone: every few seconds another fictitious transaction gets its category. */
export function CategorySwap() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let visible = false;
    const sync = () => {
      window.clearInterval(timer);
      if (visible && !media.matches && !landingMotionPaused()) timer = window.setInterval(() => setIndex(current => (current + 1) % examples.length), 4200);
    };
    const io = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); sync(); });
    if (ref.current) io.observe(ref.current);
    window.addEventListener(MOTION_EVENT, sync);
    media.addEventListener("change", sync);
    return () => { io.disconnect(); window.clearInterval(timer); window.removeEventListener(MOTION_EVENT, sync); media.removeEventListener("change", sync); };
  }, []);
  const item = examples[index];
  return (
    <div ref={ref} className="example-category" aria-hidden="true">
      <div key={index} className="swap-in">
        <p className="row-sub num">{item.line}</p>
        <p className="example-category-name">{item.name}</p>
        <p className="example-category-meta"><span className="num">{item.amount}</span><span className="tag">{item.category}</span></p>
        <p className="row-sub">{item.how}</p>
      </div>
    </div>
  );
}

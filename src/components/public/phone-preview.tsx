"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Calculator, Ellipsis, Home, MessageCircle, Upload, WalletCards } from "lucide-react";
import { exampleBalance, exampleCategories, exampleIncome, exampleSpent, exampleStatement, formatAmount } from "./example-month";

const tabs = [
  { label: "Início", icon: Home, active: true },
  { label: "Transações", icon: WalletCards },
  { label: "Planejar", icon: Calculator },
  { label: "Importar", icon: Upload },
  { label: "Mais", icon: Ellipsis }
];
const WHATSAPP_AMOUNT = 32;
const recent = exampleStatement.filter(row => row.amount < 0).slice(0, 3);
const topCategories = exampleCategories.slice(0, 3);
const largest = Math.max(...exampleCategories.map(item => item.spent));

// One loop of the living phone (ms). Stage: 0 empty, 1 balance and bars, 2 rows, 3 message, 4 reply and new row, 5 hold.
const timeline = [0, 300, 1500, 3600, 5200, 9000];
const LOOP = 12000;

/** The Fluxa overview inside a neutral phone frame, alive: it plays a short month in a loop (principle 19). */
export function PhonePreview() {
  const figure = useRef<HTMLElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(5);
  const [rowsShown, setRowsShown] = useState(recent.length);
  const [whatsappSaved, setWhatsappSaved] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let timers: number[] = [];
    let frame = 0;
    let running = false;
    const clear = () => { timers.forEach(window.clearTimeout); timers = []; cancelAnimationFrame(frame); };
    const count = (from: number, to: number, duration: number) => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const value = from + (to - from) * (1 - Math.pow(1 - p, 4));
        if (balanceRef.current) balanceRef.current.textContent = formatAmount(value);
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const play = () => {
      clear();
      setStage(0); setRowsShown(0); setWhatsappSaved(false);
      if (balanceRef.current) balanceRef.current.textContent = formatAmount(0);
      timers.push(window.setTimeout(() => { setStage(1); count(0, exampleBalance, 1100); }, timeline[1]));
      recent.forEach((_, index) => timers.push(window.setTimeout(() => { setStage(2); setRowsShown(index + 1); }, timeline[2] + index * 380)));
      timers.push(window.setTimeout(() => setStage(3), timeline[3]));
      timers.push(window.setTimeout(() => { setStage(4); setWhatsappSaved(true); count(exampleBalance, exampleBalance - WHATSAPP_AMOUNT, 700); }, timeline[4]));
      timers.push(window.setTimeout(() => setStage(5), timeline[5]));
      timers.push(window.setTimeout(() => { if (running) play(); }, LOOP));
    };
    // Plays only while visible on screen and the tab is in front.
    const io = new IntersectionObserver(([entry]) => {
      const visible = Boolean(entry?.isIntersecting) && !document.hidden;
      if (visible && !running) { running = true; play(); }
      if (!visible && running) { running = false; clear(); }
    }, { threshold: 0.35 });
    if (figure.current) io.observe(figure.current);
    const onVisibility = () => { if (document.hidden) { running = false; clear(); } };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { io.disconnect(); clear(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  const result = exampleIncome - exampleSpent - (whatsappSaved ? WHATSAPP_AMOUNT : 0);
  const rows = [...(whatsappSaved ? [{ raw: "Mercado · WhatsApp", amount: -WHATSAPP_AMOUNT, isNew: true }] : []), ...recent.slice(0, rowsShown).map(row => ({ raw: row.raw.split(" · ").pop() ?? row.raw, amount: row.amount, isNew: false }))].slice(0, 3);

  return (
    <figure ref={figure} className="phone" data-reveal style={{ "--i": 3 } as CSSProperties} data-stage={stage} aria-label="Tela de visão geral do Fluxa com dados fictícios, registrando um gasto pelo WhatsApp">
      <div className="phone-screen" aria-hidden="true">
        <div className="phone-status"><span className="num">9:41</span></div>
        <div className={stage >= 3 && stage < 5 ? "phone-banner is-shown" : "phone-banner"}>
          <span className="phone-banner-icon"><MessageCircle /></span>
          <span className="phone-banner-text">{stage >= 4 ? <>Registrado no Fluxa: gasto de <b className="num">R$&nbsp;32,00</b> em Mercado</> : <>Você: gastei 32 no mercado</>}</span>
        </div>
        <div className="phone-content">
          <p className="phone-title">Visão geral</p>
          <p className="phone-period">Outubro</p>
          <div className="card phone-card">
            <p className="overview-label">Saldo atual</p>
            <p className="phone-balance num">R$&nbsp;<span ref={balanceRef}>{formatAmount(exampleBalance - (whatsappSaved ? WHATSAPP_AMOUNT : 0))}</span></p>
            <dl className="phone-period-grid">
              <div><dt>Entradas</dt><dd className="num">{formatAmount(exampleIncome)}</dd></div>
              <div><dt>Saídas</dt><dd className="num">{formatAmount(exampleSpent + (whatsappSaved ? WHATSAPP_AMOUNT : 0))}</dd></div>
              <div><dt>Resultado</dt><dd className="num">+{formatAmount(result)}</dd></div>
            </dl>
          </div>
          <div className="card phone-card phone-list">
            <p className="phone-card-title">Gastos por categoria</p>
            <ul>
              {topCategories.map((item, index) => (
                <li key={item.name}>
                  <div><span>{item.name}</span><span className="num">{formatAmount(item.spent + (item.name === "Mercado" && whatsappSaved ? WHATSAPP_AMOUNT : 0))}</span></div>
                  <span className="meter"><span className="phone-bar" style={{ width: `${Math.round((item.spent / largest) * 100)}%`, "--d": index } as CSSProperties} /></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card phone-card phone-list">
            <p className="phone-card-title">Últimas transações</p>
            <ul className="phone-rows">
              {rows.map(row => (
                <li key={row.raw} className={row.isNew ? "phone-row is-new" : "phone-row"}>
                  <div><span>{row.raw}</span><span className="num">−{formatAmount(row.amount)}</span></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <nav className="phone-tabbar glass">
          {tabs.map(tab => <span key={tab.label} className={tab.active ? "is-active" : undefined}><tab.icon /><span>{tab.label}</span></span>)}
        </nav>
      </div>
      <figcaption className="phone-caption">Tela do Fluxa com dados fictícios</figcaption>
    </figure>
  );
}

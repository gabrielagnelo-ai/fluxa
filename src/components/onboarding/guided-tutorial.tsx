"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Flag, SlidersHorizontal, UploadCloud, WalletCards, X } from "lucide-react";

const STORAGE_KEY = "fluxa-guided-tutorial-v1";
const steps = [
  { title: "Informe sua renda", description: "Nesta área, informe quanto espera receber no mês, escolha a divisão da renda e salve. Depois, avance para definir seus limites.", href: "/planning#planning-income", selector: "#planning-income", icon: WalletCards },
  { title: "Defina seus limites", description: "Escolha quanto pretende gastar em cada categoria e salve seu planejamento. Os valores previstos não registram pagamentos.", href: "/planning#planning-limits", selector: "#planning-limits", icon: SlidersHorizontal },
  { title: "Importe e revise", description: "Envie um extrato, revise os valores e as categorias e salve quando estiver tudo certo. O dashboard passa a mostrar suas movimentações.", href: "/import", selector: '[data-tour="import-upload"]', icon: UploadCloud }
];
type Status = "new" | "active" | "skipped" | "completed";
type Mode = "idle" | "intro" | "guide";
type Bounds = { x: number; y: number; width: number; height: number };
type TutorialContextValue = { ready: boolean; startTutorial: () => void; offerTutorial: (step: number) => void };
const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial() {
  const value = useContext(TutorialContext);
  if (!value) throw new Error("TutorialProvider is required");
  return value;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>("new");
  const [mode, setMode] = useState<Mode>("idle");
  const [step, setStep] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [notice, setNotice] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (saved && typeof saved === "object" && "status" in saved && typeof saved.status === "string" && ["new", "active", "skipped", "completed"].includes(saved.status)) {
          setStatus(saved.status as Status);
          if ("step" in saved && typeof saved.step === "number" && Number.isInteger(saved.step) && saved.step >= 0 && saved.step < steps.length) setStep(saved.step);
          if (saved.status === "active") setMode("intro");
        }
      }
    } catch { /* The tutorial also works for the current session without storage. */ }
    setReady(true);
  }, []);

  const persist = useCallback((nextStatus: Status, nextStep: number) => {
    setStatus(nextStatus);
    setStep(nextStep);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: nextStatus, step: nextStep })); } catch { /* Keep the session choice. */ }
  }, []);

  const startTutorial = useCallback(() => {
    if (status === "completed") setStep(0);
    setMode("intro");
    setNotice(false);
  }, [status]);

  const offerTutorial = useCallback((suggestedStep: number) => {
    if (ready && status === "new" && mode === "idle") {
      setStep(suggestedStep);
      setMode("intro");
    }
  }, [ready, status, mode]);

  const skip = useCallback(() => {
    persist("skipped", step);
    setMode("idle");
    setBounds(null);
  }, [persist, step]);

  function goToStep(index: number) {
    if (index >= steps.length) {
      persist("completed", steps.length - 1);
      setMode("idle");
      setBounds(null);
      setNotice(true);
      router.push("/dashboard");
      return;
    }
    persist("active", index);
    setCollapsed(false);
    setMode("guide");
    setBounds(null);
    router.push(steps[index].href);
  }

  function focusCurrentArea() {
    const target = document.querySelector<HTMLElement>(steps[step].selector);
    if (!target) { goToStep(step); return; }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mode === "intro" && !dialog.open) dialog.showModal();
    if (mode !== "intro" && dialog.open) dialog.close();
  }, [mode]);

  useEffect(() => {
    if (mode !== "guide") { setBounds(null); return; }
    setBounds(null);
    let target: HTMLElement | null = null;
    let originalTabIndex: string | null = null;
    let frame = 0;
    const update = () => {
      if (!target || !target.isConnected) return;
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const next = { x: rect.x - 5, y: rect.y - 5, width: rect.width + 10, height: rect.height + 10 };
      setBounds(current => current && Math.abs(current.x - next.x) < 1 && Math.abs(current.y - next.y) < 1 && Math.abs(current.width - next.width) < 1 && Math.abs(current.height - next.height) < 1 ? current : next);
    };
    const queueUpdate = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(queueUpdate);
    const find = () => {
      const found = document.querySelector<HTMLElement>(steps[step].selector);
      if (!found) return;
      if (target !== found) {
        if (target) {
          resize.unobserve(target);
          if (originalTabIndex === null) target.removeAttribute("tabindex");
          else target.setAttribute("tabindex", originalTabIndex);
        }
        target = found;
        originalTabIndex = target.getAttribute("tabindex");
        if (originalTabIndex === null) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        resize.observe(target);
        target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      }
      queueUpdate();
    };
    const timer = window.setTimeout(find, 160);
    const mutation = new MutationObserver(find);
    mutation.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    window.addEventListener("resize", queueUpdate);
    window.addEventListener("scroll", queueUpdate, true);
    return () => {
      window.clearTimeout(timer); cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect();
      if (target) {
        if (originalTabIndex === null) target.removeAttribute("tabindex");
        else target.setAttribute("tabindex", originalTabIndex);
      }
      window.removeEventListener("resize", queueUpdate); window.removeEventListener("scroll", queueUpdate, true);
    };
  }, [mode, step, pathname]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(false), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const context = useMemo(() => ({ ready, startTutorial, offerTutorial }), [ready, startTutorial, offerTutorial]);
  const currentStep = steps[step];
  const Icon = currentStep.icon;
  return <TutorialContext.Provider value={context}>
    {children}
    <dialog ref={dialogRef} className="tutorial-intro" aria-labelledby="tutorial-intro-title" onCancel={event => { event.preventDefault(); skip(); }}>
      <button type="button" className="tutorial-close" aria-label="Pular tutorial" onClick={skip}><X size={18} /></button>
      <div className="tutorial-intro-symbol"><Flag size={25} aria-hidden="true" /></div>
      <p className="tutorial-eyebrow">Bem-vindo ao Fluxa</p>
      <h2 id="tutorial-intro-title">Seu dinheiro, um passo de cada vez.</h2>
      <p className="tutorial-intro-description">Um guia rápido para configurar sua renda, definir limites e importar seu primeiro extrato. Você pode pular e voltar quando quiser.</p>
      <ol className="tutorial-intro-steps">{steps.map((item, index) => <li key={item.title}><item.icon size={18} aria-hidden="true" /><span>{item.title}</span><small>{index + 1}</small></li>)}</ol>
      <div className="tutorial-intro-actions"><button type="button" onClick={skip}>Pular por enquanto</button><button type="button" className="tutorial-primary" onClick={() => goToStep(step)}>{step > 0 ? "Continuar tutorial" : "Começar tutorial"}<ArrowRight size={16} aria-hidden="true" /></button></div>
      <p className="tutorial-intro-footnote">As orientações ficam disponíveis em “Como usar”.</p>
    </dialog>
    {mode === "guide" && <>
      {bounds && <div className="tutorial-spotlight" aria-hidden="true" style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }} />}
      <section className="tutorial-guide" aria-labelledby="tutorial-step-title" data-collapsed={collapsed}>
        <div className="tutorial-guide-top"><span><Icon size={16} aria-hidden="true" />Passo {step + 1} de {steps.length}</span><div><button type="button" aria-label={collapsed ? "Expandir orientações" : "Recolher orientações"} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button><button type="button" onClick={skip} aria-label="Pular tutorial"><X size={16} /></button></div></div>
        <h2 id="tutorial-step-title" aria-live="polite">{currentStep.title}</h2>
        {!collapsed && <div className="tutorial-guide-body"><p>{currentStep.description}</p><button type="button" className="tutorial-target-link" onClick={focusCurrentArea}>Ir para esta área<ArrowRight size={13} aria-hidden="true" /></button><div className="tutorial-progress" aria-hidden="true">{steps.map((item, index) => <span key={item.title} className={index <= step ? "is-reached" : undefined}/>)}</div><div className="tutorial-guide-actions"><button type="button" onClick={step ? () => goToStep(step - 1) : skip}>{step ? <><ArrowLeft size={14} aria-hidden="true" />Voltar</> : "Pular tutorial"}</button><button type="button" className="tutorial-primary" onClick={() => goToStep(step + 1)}>{step === steps.length - 1 ? "Concluir tutorial" : "Próximo"}{step === steps.length - 1 ? <Check size={15} aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}</button></div></div>}
      </section>
    </>}
    {notice && <div className="tutorial-notice" role="status"><Check size={16} aria-hidden="true" />Tutorial concluído. Retome em “Como usar” quando precisar.<button type="button" onClick={() => setNotice(false)} aria-label="Fechar aviso"><X size={14} /></button></div>}
  </TutorialContext.Provider>;
}

export function TutorialStarter({ eligible, incomeConfigured, limitsConfigured }: { eligible: boolean; incomeConfigured: boolean; limitsConfigured: boolean }) {
  const { ready, offerTutorial } = useTutorial();
  useEffect(() => {
    if (ready && eligible) offerTutorial(!incomeConfigured ? 0 : !limitsConfigured ? 1 : 2);
  }, [ready, eligible, incomeConfigured, limitsConfigured, offerTutorial]);
  return null;
}

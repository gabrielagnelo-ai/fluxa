import type { CSSProperties } from "react";
import { WhatsAppToastDemo } from "@/components/public/whatsapp-toast-demo";

// Mirrors src/lib/whatsapp/server.ts: text message in, transaction saved, confirmation reply,
// and the same notice the app raises when it arrives (fictional data, nothing saved).
export function WhatsAppExample({ className = "", style, stagger = false, revealGroup = false }: { className?: string; style?: CSSProperties; stagger?: boolean; revealGroup?: boolean }) {
  return (
    <figure className={`card example-card ${className}`} style={style} data-stagger={stagger || undefined} data-reveal-group={revealGroup || undefined} aria-label="Exemplo de registro de gasto pelo WhatsApp">
      <div className="example-header"><span>WhatsApp</span><span className="example-tag">Dados fictícios</span></div>
      <div className="chat">
        <p className="chat-out">gastei 32 no mercado</p>
        <p className="chat-in chat-delay">Registrado no Fluxa: gasto de <span className="num">R$ 32,00</span> em Mercado (<span className="num">30/10</span>).</p>
      </div>
      <WhatsAppToastDemo />
    </figure>
  );
}

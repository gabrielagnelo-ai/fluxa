"use client";

import "./abertura-logo.css";
import { MOTOR_ABERTURA } from "./abertura-logo-motor";

/**
 * Abertura do logo (Correnteza): até 1 s, uma vez por sessão (sessionStorage), sem segurar a página.
 * O script roda inline durante o parse do HTML, antes da hidratação: a camada já existe na primeira
 * pintura e a água corre desde o quadro 0. Um toque ou tecla pula; com reduced-motion, só um fade.
 * No fim o logo encolhe até o logo do cabeçalho (medido no DOM) ou, sem ele, até o canto.
 * Montar uma vez, como primeiro filho do <body> no layout raiz. Detalhes: README-abertura-logo.md.
 */
export function AberturaLogo() {
  return <script id="abertura-logo" dangerouslySetInnerHTML={{ __html: MOTOR_ABERTURA }} />;
}

"use client";

import { MOTOR_ABERTURA_URL } from "./abertura-logo-versao";

/**
 * Abertura do logo (Correnteza): até 1 s, uma vez por sessão, sem segurar a página.
 * Inline vai só o porteiro (< 1 KB): decide a sessão, marca html.abertura-pendente com o CSS crítico e
 * carrega o motor (public/abertura/motor.<hash>.js) só quando a abertura vai tocar. Se o motor não
 * chegar em 700 ms, desiste e mostra a página. Depois de começar, tudo anda no compositor (transform e
 * opacity por Web Animations). Um toque ou tecla pula; com reduced-motion, só um fade.
 * Montar uma vez, como primeiro filho do <body> no layout raiz. Detalhes: README-abertura-logo.md.
 */

const porteiro = (src: string) =>
  `(function(d){try{if(!/[?&]replay/.test(location.search)){if(sessionStorage.getItem('fluxa:abertura-vista'))return;sessionStorage.setItem('fluxa:abertura-vista','1')}}catch(e){}` +
  `d.classList.add('abertura-pendente');var c=document.createElement('style');` +
  `c.textContent='html.abertura-pendente{background:radial-gradient(120% 55% at 50% -14%,#0033af75,#0000 64%) #02050d}html.abertura-pendente body{visibility:hidden}';` +
  `document.head.appendChild(c);var j=document.createElement('script');j.src=${JSON.stringify(src)};j.async=true;` +
  `j.onerror=function(){d.classList.remove('abertura-pendente')};document.head.appendChild(j);` +
  `setTimeout(function(){if(!d.dataset.aberturaMotor){d.dataset.aberturaDesistiu='1';d.classList.remove('abertura-pendente')}},700)})(document.documentElement)`;

export function AberturaLogo() {
  return <script id="abertura-logo" dangerouslySetInnerHTML={{ __html: porteiro(MOTOR_ABERTURA_URL) }} />;
}

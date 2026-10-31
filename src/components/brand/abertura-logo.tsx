"use client";

import { MOTOR_ABERTURA_URL } from "./abertura-logo-versao";

/**
 * Abertura do logo (Correnteza): até 1 s, uma vez por sessão, sem segurar a página.
 * Inline vai só o porteiro: decide a sessão, marca html.abertura-pendente com o CSS crítico, já põe uma
 * corrente em movimento (CSS puro, compositor) e pede o motor (public/abertura/motor.<hash>.js, com preload)
 * só quando a abertura vai tocar. Se o motor não
 * chegar em 700 ms, desiste e mostra a página. Depois de começar, tudo anda no compositor (transform e
 * opacity por Web Animations). Um toque ou tecla pula; com reduced-motion, só um fade.
 * Montar uma vez, como primeiro filho do <body> no layout raiz. Detalhes: README-abertura-logo.md.
 */

// CSS crítico do porteiro. --aw é a largura do logo na abertura (igual ao motor). Enquanto o motor não chega,
// uma corrente na cor do logo sobe até onde a corrente da faixa de baixo está no quadro 0 do motor
// (ponto 59,1 x 123,2 do viewBox, a -42,5 graus): só transform e opacity, anda no compositor desde a 1ª pintura.
// data-abertura-t0 marca esse momento: o motor entra na linha do tempo no ponto já passado.
const CSS =
  "html{--aw:min(74vw,310px)}@media(min-width:768px){html{--aw:clamp(300px,30vw,440px)}}" +
  "html.abertura-pendente{background:radial-gradient(120% 55% at 50% -14%,#0033af75,#0000 64%),radial-gradient(55% 40% at 96% 2%,#0080f82e,#0000 72%),radial-gradient(70% 45% at 0% 100%,#024bcf29,#0000 72%),linear-gradient(#02050d,#000 60%);background-attachment:fixed}" +
  "html.abertura-pendente body{visibility:hidden}" +
  "html.abertura-pendente::after{content:'';position:fixed;z-index:2147483001;left:calc(50vw - var(--aw)*.5355);top:calc(47vh + var(--aw)*.0933);width:calc(var(--aw)*.24);height:calc(var(--aw)*.032);border-radius:9px;background:linear-gradient(90deg,#56d1fe00,#56d1fe 55%,#b5ffff);box-shadow:0 0 12px #56d1fe80;transform-origin:100% 50%;animation:abc .9s cubic-bezier(.25,1,.5,1) both}" +
  ".abertura-ponte::after{animation:abc .9s cubic-bezier(.25,1,.5,1) both,abs .14s both!important}" +
  "@keyframes abc{0%{opacity:.4;transform:rotate(-42.5deg) translateX(calc(var(--aw)*-.3))}25%{opacity:1}to{opacity:1;transform:rotate(-42.5deg)}}@keyframes abs{to{opacity:0}}";

const porteiro = (src: string) =>
  `(function(d){try{if(!/[?&]replay/.test(location.search)){if(sessionStorage.getItem('fluxa:abertura-vista'))return;sessionStorage.setItem('fluxa:abertura-vista','1')}}catch(e){}` +
  `d.classList.add('abertura-pendente');d.dataset.aberturaT0=performance.now();var h=document.head,c=document.createElement('style');c.textContent=${JSON.stringify(CSS)};h.appendChild(c);` +
  `var l=document.createElement('link');l.rel='preload';l.as='script';l.href=${JSON.stringify(src)};l.fetchPriority='high';h.appendChild(l);` +
  `var j=document.createElement('script');j.src=l.href;j.async=true;j.fetchPriority='high';` +
  `j.onerror=function(){d.classList.remove('abertura-pendente')};h.appendChild(j);` +
  `setTimeout(function(){if(!d.dataset.aberturaMotor){d.dataset.aberturaDesistiu='1';d.classList.remove('abertura-pendente')}},700)})(document.documentElement)`;

export function AberturaLogo() {
  return <script id="abertura-logo" dangerouslySetInnerHTML={{ __html: porteiro(MOTOR_ABERTURA_URL) }} />;
}

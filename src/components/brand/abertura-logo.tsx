"use client";

import { MOTOR_ABERTURA_URL } from "./abertura-logo-versao";

/**
 * Abertura do logo (Correnteza): até 1 s, uma vez por sessão, sem segurar a página.
 * O estado final é o PNG original (public/branding/fluxa-logo.png, embutido no motor), pixel a pixel; o SVG serve
 * só de máscara.
 * Inline vai só o porteiro: decide a sessão, marca html.abertura-pendente com o CSS crítico, já põe uma
 * corrente em movimento (CSS puro, compositor) e carrega o motor (public/abertura/motor.<hash>.js) só quando a
 * abertura vai tocar. O preload do motor vai declarado no HTML, para ele baixar junto com o JS da página. Se o motor não
 * entrar em 820 ms (motor e PNG), desiste e mostra a página. Depois de começar, tudo anda no compositor (transform e
 * opacity por Web Animations). Um toque ou tecla pula; com reduced-motion, só um fade.
 * Montar uma vez, como primeiro filho do <body> no layout raiz. Detalhes: README-abertura-logo.md.
 */

// CSS crítico do porteiro. O fundo provisório é o mesmo degradê do body::before de globals.css (azul-marinho). --aw é a largura do logo na abertura (igual ao motor). Enquanto o motor não chega,
// uma corrente na cor do logo sobe até onde a corrente da faixa de baixo está no quadro 0 do motor
// (ponto 59,1 x 123,2 do viewBox, a -42,5 graus): só transform e opacity, anda no compositor desde a 1ª pintura.
// data-abertura-t0 marca esse momento: o motor entra na linha do tempo no ponto já passado.
const CSS =
  "html{--aw:min(74vw,310px)}@media(min-width:768px){html{--aw:clamp(300px,30vw,440px)}}" +
  "html.abertura-pendente{background:radial-gradient(90% 60% at 50% -10%,#0080f84d,#0000 70%),radial-gradient(60% 45% at 100% 10%,#1ea7fd29,#0000 72%),radial-gradient(70% 50% at 0% 70%,#0080f829,#0000 72%),radial-gradient(50% 40% at 90% 100%,#56d1fe1f,#0000 72%),linear-gradient(#24355a,#22314d 50%,#1f2d48);background-attachment:fixed}" +
  "html.abertura-pendente body{visibility:hidden}" +
  "html.abertura-pendente::after{content:'';position:fixed;z-index:2147483001;left:calc(50vw - var(--aw)*.5355);top:calc(47vh + var(--aw)*.0933);width:calc(var(--aw)*.24);height:calc(var(--aw)*.032);border-radius:9px;background:linear-gradient(90deg,#56d1fe00,#56d1fe 55%,#b5ffff);box-shadow:0 0 12px #56d1fe80;transform-origin:100% 50%;animation:abc .9s cubic-bezier(.25,1,.5,1) both}" +
  ".abertura-ponte::after{animation:abc .9s cubic-bezier(.25,1,.5,1) both,abs .14s both!important}" +
  "@keyframes abc{0%{opacity:.4;transform:rotate(-42.5deg) translateX(calc(var(--aw)*-.3))}25%{opacity:1}to{opacity:1;transform:rotate(-42.5deg)}}@keyframes abs{to{opacity:0}}";

const porteiro = (src: string) =>
  `(function(d){try{if(!/[?&]replay/.test(location.search)){if(sessionStorage.getItem('fluxa:abertura-vista'))return;sessionStorage.setItem('fluxa:abertura-vista','1')}}catch(e){}` +
  `d.classList.add('abertura-pendente');d.dataset.aberturaT0=performance.now();var h=document.head,c=document.createElement('style');c.textContent=${JSON.stringify(CSS)};h.appendChild(c);` +
  `var j=document.createElement('script');j.src=${JSON.stringify(src)};j.async=true;j.fetchPriority='high';` +
  `j.onerror=function(){d.classList.remove('abertura-pendente')};h.appendChild(j);` +
  `setTimeout(function(){if(!document.getElementById('abertura')){d.dataset.aberturaDesistiu='1';d.classList.remove('abertura-pendente')}},820)})(document.documentElement)`;

export function AberturaLogo() {
  return (
    <>
      {/* Preload declarado no HTML (o React o sobe para o <head>): o navegador pede o motor junto com o JS da
          página, antes de qualquer script rodar. Script inline espera o CSS, então pedir pelo porteiro chegaria tarde. */}
      <link rel="preload" href={MOTOR_ABERTURA_URL} as="script" fetchPriority="high" />
      <script id="abertura-logo" dangerouslySetInnerHTML={{ __html: porteiro(MOTOR_ABERTURA_URL) }} />
    </>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";

type MonthKey = { month: number; year: number };
const same = (a: MonthKey, b: MonthKey) => a.month === b.month && a.year === b.year;
const href = (key: MonthKey) => `/planning?month=${key.month}&year=${key.year}`;

export function PlanningMonthControl({ selected, current, next }: { selected: MonthKey; current: MonthKey; next: MonthKey }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const other = !same(selected, current) && !same(selected, next);
  return (
    <div className="period-control">
      <div className="segmented" role="group" aria-label="Mês do planejamento">
        <Link href={href(current)} aria-current={same(selected, current) ? "page" : undefined}>Mês atual</Link>
        <Link href={href(next)} aria-current={same(selected, next) ? "page" : undefined}>Próximo mês</Link>
        <button type="button" aria-pressed={other} aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>Outro</button>
      </div>
      <dialog ref={sheet} className="sheet" aria-labelledby="planning-month-title" onClick={event => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
        <form action="/planning" method="get">
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-bar">
            <button type="button" className="btn btn-plain" onClick={() => sheet.current?.close()}>Cancelar</button>
            <h2 id="planning-month-title" className="sheet-title">Outro mês</h2>
            <button type="submit" className="btn btn-plain btn-plain-strong">Abrir</button>
          </div>
          <div className="field-group">
            <label className="field-row"><span>Mês</span><input type="month" name="date" required defaultValue={`${selected.year}-${String(selected.month).padStart(2, "0")}`} /></label>
          </div>
          <p className="field-note">Se o mês ainda não tiver um plano, o último salvo aparece como sugestão.</p>
        </form>
      </dialog>
    </div>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDateInput } from "@/utils/period";

type Preset = { key: string; label: string; shortLabel: string; start: string; end: string };

function monthRange(offset: number, span = 1) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset - (span - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

function presets(): Preset[] {
  return [
    { key: "current", label: "Este mês", shortLabel: "Este mês", ...monthRange(0) },
    { key: "previous", label: "Mês passado", shortLabel: "Anterior", ...monthRange(-1) },
    { key: "quarter", label: "3 meses", shortLabel: "3 meses", ...monthRange(0, 3) }
  ];
}

/** Period as a segmented control (Apple pattern); a custom range opens a sheet with the two dates. */
export function PeriodFilter({ start, end }: { start: Date; end: Date }) {
  const pathname = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);
  const startValue = formatDateInput(start);
  const endValue = formatDateInput(end);
  const options = presets();
  const selected = options.find(option => option.start === startValue && option.end === endValue);

  return (
    <div className="period-control">
      <div className="segmented" role="group" aria-label="Período">
        {options.map(option => (
          <Link key={option.key} href={`${pathname}?start=${option.start}&end=${option.end}`} scroll={false}
            aria-current={selected?.key === option.key ? "page" : undefined} aria-label={option.label}>
            <span className="sm:hidden">{option.shortLabel}</span><span className="hidden sm:inline">{option.label}</span>
          </Link>
        ))}
        <button type="button" aria-pressed={!selected} aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>
          <span>Outro</span>
        </button>
      </div>

      <dialog ref={sheet} className="sheet" aria-labelledby="period-sheet-title" onClick={event => { if (event.target === event.currentTarget) sheet.current?.close(); }}>
        <form action={pathname} method="get">
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-bar">
            <button type="button" className="btn btn-plain" onClick={() => sheet.current?.close()}>Cancelar</button>
            <h2 id="period-sheet-title" className="sheet-title">Outro período</h2>
            <button type="submit" className="btn btn-plain" style={{ fontWeight: 700 }}>Aplicar</button>
          </div>
          <div className="field-group">
            <label className="field-row"><span>Início</span><input name="start" type="date" defaultValue={startValue} required /></label>
            <label className="field-row"><span>Fim</span><input name="end" type="date" defaultValue={endValue} required /></label>
          </div>
          <p className="field-note">Os números da tela passam a considerar só as movimentações entre essas datas.</p>
        </form>
      </dialog>
    </div>
  );
}

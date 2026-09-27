"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { categorizeTransactions } from "@/services/category-service";
import type { ParsedTransaction, TransactionType } from "@/types/finance";
import { isCalendarDate, transactionDate } from "@/lib/transaction-validation";

type RawRow = Record<string, unknown>;

const dateKeys = ["data", "date", "dt", "lançamento", "lancamento"];
const descriptionKeys = ["descrição", "descricao", "description", "histórico", "historico", "memo"];
const amountKeys = ["valor", "amount", "vlr", "quantia"];
const incomeKeys = ["entrada", "receita", "credito", "crédito", "credit"];
const expenseKeys = ["saida", "saída", "despesa", "debito", "débito", "debit"];
const typeKeys = ["tipo", "type", "natureza", "movimento", "entrada/saida", "entrada/saída", "credito/debito", "crédito/débito"];

function findValue(row: RawRow, keys: string[]) {
  const entry = Object.entries(row).find(([key]) => keys.includes(key.trim().toLowerCase()));
  return entry?.[1];
}

function parseAmount(value: unknown) {
  if (typeof value === "number") return value;
  const raw = String(value ?? "0").replace(/\s/g, "");
  const isParenthesized = /^\(.+\)$/.test(raw);
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  const parsed = Number(normalized.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  return isParenthesized ? -Math.abs(parsed) : parsed;
}

function inferType(rawAmount: number, row: RawRow): TransactionType {
  const typeHint = String(findValue(row, typeKeys) ?? "").trim().toLowerCase();

  if (/(entrada|receita|credito|crédito|credit|recebido)/i.test(typeHint)) return "INCOME";
  if (/(saida|saída|despesa|debito|débito|debit|pagamento|compra)/i.test(typeHint)) return "EXPENSE";

  const incomeAmount = parseAmount(findValue(row, incomeKeys));
  const expenseAmount = parseAmount(findValue(row, expenseKeys));

  if (incomeAmount > 0 && expenseAmount === 0) return "INCOME";
  if (expenseAmount > 0 && incomeAmount === 0) return "EXPENSE";

  return rawAmount >= 0 ? "INCOME" : "EXPENSE";
}

export function parseStatementDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) throw new Error("Data inválida no extrato. Corrija o arquivo e envie novamente.");
    const date = `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    if (!isCalendarDate(date)) throw new Error("Data inválida no extrato.");
    return transactionDate(date).toISOString();
  }

  const text = String(value ?? "").trim();
  const brazilian = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilian) {
    const [, day, month, year] = brazilian;
    const date = `${year}-${month}-${day}`;
    if (!isCalendarDate(date)) throw new Error(`Data inválida no extrato: ${text}. Corrija o arquivo e envie novamente.`);
    return transactionDate(date).toISOString();
  }

  if (!isCalendarDate(text.slice(0, 10))) throw new Error(`Data inválida no extrato: ${text}. Use DD/MM/AAAA ou AAAA-MM-DD.`);
  return transactionDate(text).toISOString();
}

function normalizeRow(row: RawRow): ParsedTransaction | null {
  const description = String(findValue(row, descriptionKeys) ?? "").trim();
  const incomeAmount = parseAmount(findValue(row, incomeKeys));
  const expenseAmount = parseAmount(findValue(row, expenseKeys));
  const amountFromSingleColumn = parseAmount(findValue(row, amountKeys));
  const rawAmount = amountFromSingleColumn || incomeAmount || -expenseAmount;
  const rawDate = findValue(row, dateKeys);

  if (!description || !rawDate || rawAmount === 0) return null;

  const type = inferType(rawAmount, row);

  return {
    date: parseStatementDate(rawDate),
    description,
    amount: Math.abs(rawAmount),
    type,
    source: "Upload"
  };
}

export async function parseStatementFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    const text = await file.text();
    const result = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });
    return categorizeTransactions(result.data.map(normalizeRow).filter(Boolean) as ParsedTransaction[]);
  }

  if (extension === "xlsx" || extension === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { raw: true });
    return categorizeTransactions(rows.map(normalizeRow).filter(Boolean) as ParsedTransaction[]);
  }

  if (extension === "pdf") return [];

  throw new Error("Formato não suportado. Use CSV, XLSX ou PDF.");
}

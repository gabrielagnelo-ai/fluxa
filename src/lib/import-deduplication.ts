// Account labels intentionally separate identical payments from different accounts.
// File identity catches retries even when the user later edits a saved transaction.
export type ImportCandidate = {
  date: string; description: string; amount: number; type: string;
  source?: string | null; importId?: string | null; forceImport?: boolean;
};
export type ImportReview = { index: number; status: "new" | "imported" | "possible"; include: boolean };

export function transactionFingerprint(item: ImportCandidate) {
  return JSON.stringify([
    item.date.slice(0, 10), item.description.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR"),
    Math.round(item.amount * 100), item.type
  ]);
}

export function reviewImport(incoming: ImportCandidate[], existing: ImportCandidate[]): ImportReview[] {
  const exact = new Set(existing.map((item) => item.importId).filter(Boolean));
  const remaining = new Map<string, number>();
  const legacy = new Map<string, number>();
  for (const item of existing) {
    const key = transactionFingerprint(item);
    const map = item.source?.startsWith("Extrato · ") ? remaining : legacy;
    const scopedKey = map === remaining ? `${item.source}\0${key}` : key;
    map.set(scopedKey, (map.get(scopedKey) ?? 0) + 1);
  }
  const files = new Map<string, { item: ImportCandidate; index: number }[]>();
  incoming.forEach((item, index) => {
    const file = item.importId?.split(":").slice(0, -1).join(":") ?? "batch";
    const rows = files.get(file) ?? [];
    rows.push({ item, index });
    files.set(file, rows);
  });
  // Resolve explicitly confirmed payments first so a consolidated file selected
  // before them cannot add those same payments a second time.
  const orderedFiles = [...files.values()].sort((a, b) =>
    Number(b.some(({ item }) => item.forceImport)) - Number(a.some(({ item }) => item.forceImport))
  );
  const addedCounts = new Map<string, number>();
  const result: ImportReview[] = new Array(incoming.length);
  for (const rows of orderedFiles) {
    const baselineCounts = new Map<string, number>();
    const occurrences = new Map<string, number>();
    for (const { item, index } of rows) {
      const fingerprint = transactionFingerprint(item);
      const key = `${item.source}\0${fingerprint}`;
      // Freeze this file's baseline: two equal rows in a file remain two real
      // payments. Every included row, including a forced one, increases the
      // effective multiplicity used by subsequent overlapping files.
      if (!baselineCounts.has(key)) baselineCounts.set(key,
        (remaining.get(key) ?? 0) + (legacy.get(fingerprint) ?? 0) + (addedCounts.get(key) ?? 0)
      );
      const occurrence = (occurrences.get(key) ?? 0) + 1;
      occurrences.set(key, occurrence);
      const status = item.importId && exact.has(item.importId) ? "imported" : occurrence <= baselineCounts.get(key)! ? "possible" : "new";
      const include = status !== "imported" && (status === "new" || item.forceImport === true);
      if (item.importId) exact.add(item.importId);
      if (include) addedCounts.set(key, (addedCounts.get(key) ?? 0) + 1);
      result[index] = { index, status, include };
    }
  }
  return result;
}

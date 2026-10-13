type RankedPaper = { id: string; level: number | null; scores: number[] | null };

// The supplied review resolves equal levels by innovation, significance, depth, then ID.
export function compareFactoryPapers(a: RankedPaper, b: RankedPaper) {
  return (
    (b.level ?? -1) - (a.level ?? -1) ||
    (b.scores?.[0] ?? -1) - (a.scores?.[0] ?? -1) ||
    (b.scores?.[1] ?? -1) - (a.scores?.[1] ?? -1) ||
    (b.scores?.[2] ?? -1) - (a.scores?.[2] ?? -1) ||
    a.id.localeCompare(b.id)
  );
}

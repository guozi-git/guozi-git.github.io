/** Display rank only. Stable IDs remain the keys for URLs, PDFs and review data. */
export function rankLabel(id: string, ranks: ReadonlyMap<string, number>): string {
  const rank = ranks.get(id);
  return rank ? `P${String(rank).padStart(3, '0')}` : '未排名';
}

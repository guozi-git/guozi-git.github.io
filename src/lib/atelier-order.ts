/** Lower priorities appear first; accession numbers never change when reordered. */
export function orderAtelierPapers<T extends { priority?: number; collectionNumber: number }>(
  papers: readonly T[],
): T[] {
  return [...papers].sort((a, b) => {
    const priorityA = a.priority ?? Infinity;
    const priorityB = b.priority ?? Infinity;
    return priorityA === priorityB
      ? a.collectionNumber - b.collectionNumber
      : priorityA - priorityB;
  });
}

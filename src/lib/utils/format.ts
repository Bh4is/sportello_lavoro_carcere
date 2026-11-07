/**
 * Converte una durata espressa in minuti
 * nel formato "2h 30m".
 */
export function formatDurata(minuti: number): string {
  const totale = Number(minuti);

  const ore = Math.floor(totale / 60);
  const minutiRestanti = totale % 60;

  return `${ore}h ${String(minutiRestanti).padStart(2, "0")}m`;
}

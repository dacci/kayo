export function formatTime(time: number): string {
  const hours = Math.trunc(time / 3600);
  const minutes = Math.trunc((time % 3600) / 60);
  const seconds = Math.trunc(time % 60);
  return `${0 < hours ? `${hours}:` : ''}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

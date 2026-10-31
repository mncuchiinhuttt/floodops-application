const originPattern = /^http:\/\/(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d):([1-9]\d{0,4})$/;

export function normalizeDevelopmentLanOrigin(origin: string): string | null {
  const match = originPattern.exec(origin);
  if (!match) return null;
  const first = Number(match[1]), second = Number(match[2]), port = Number(match[5]);
  if (port > 65535 || (first !== 10 && !(first === 172 && second >= 16 && second <= 31) && !(first === 192 && second === 168))) return null;
  const host = `${first}.${second}.${Number(match[3])}.${Number(match[4])}`;
  return port === 80 ? `http://${host}` : `http://${host}:${port}`;
}

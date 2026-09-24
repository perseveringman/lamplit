export function cn(...values: (string | false | null | undefined)[]): string { return values.filter(Boolean).join(' '); }
export function formatCount(n: number): string { return n.toLocaleString('zh-CN'); }
export function sourceBook(id: string): number { return Number(id.match(/^b(\d)-/)?.[1] || 0); }
export function lessonFromSentence(id: string): string { return id.split('-s')[0]; }
export function readingTime(words: number): number { return Math.max(1, Math.ceil(words / 100)); }
export function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) { let timer: ReturnType<typeof setTimeout>; return (...args: T) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }
export function reducedMotion(): boolean { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
/** crypto.randomUUID is secure-context-only; local LAN previews may use HTTP. */
export function uniqueId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function')
        return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

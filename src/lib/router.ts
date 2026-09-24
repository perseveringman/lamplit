import { useEffect, useState } from 'react';
export interface Route {
    view: string;
    id: string;
    params: URLSearchParams;
    key: string;
}
const safeDecode = (value: string) => { try {
    return decodeURIComponent(value);
}
catch {
    return value;
} };
export function parseRoute(hash: string): Route { const value = hash.replace(/^#/, '') || '/atlas/g-past'; const [pathname, query] = value.split('?'); const [, view = 'atlas', id = ''] = pathname.split('/'); return { view, id: safeDecode(id), params: new URLSearchParams(query || ''), key: value }; }
export function go(view: string, id = '', params: Record<string, string | undefined> = {}, replace = false) { const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [
    string,
    string
][]).toString(); const hash = `#/${view}${id ? '/' + encodeURIComponent(id) : ''}${query ? '?' + query : ''}`; if (replace) {
    history.replaceState(null, '', hash);
    dispatchEvent(new HashChangeEvent('hashchange'));
}
else
    location.hash = hash; }
export function useRoute() { const [route, setRoute] = useState(() => parseRoute(location.hash)); useEffect(() => { const change = () => setRoute(parseRoute(location.hash)); addEventListener('hashchange', change); return () => removeEventListener('hashchange', change); }, []); return route; }

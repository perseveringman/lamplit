import React from 'react';
export type IconName = 'star' | 'spark' | 'search' | 'book' | 'network' | 'list' | 'route' | 'link' | 'cards' | 'arrow' | 'back' | 'chevron' | 'close' | 'check' | 'plus' | 'minus' | 'focus' | 'filter' | 'help' | 'settings' | 'warning' | 'clock' | 'bookmark' | 'pause' | 'play' | 'reset' | 'trash' | 'layers' | 'expand' | 'menu' | 'sun' | 'return' | 'eye' | 'next';
const paths: Record<IconName, React.ReactNode> = {
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>,
    spark: <><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/><circle cx="12" cy="12" r="4"/></>,
    search: <><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></>,
    book: <><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z"/></>,
    network: <><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="5" cy="20" r="2"/><circle cx="20" cy="19" r="2"/><path d="m7 7 3 3m4 0 4-3m-4 7 4 4m-8-4-4 4"/></>,
    list: <><path d="M9 5h12M9 12h12M9 19h12M3 5h.1M3 12h.1M3 19h.1"/></>,
    route: <><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/></>,
    link: <><path d="m10 14 4-4m-5 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"/></>,
    cards: <><rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12M7 12h6M7 16h4"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, back: <path d="M20 12H4m6-6-6 6 6 6"/>, chevron: <path d="m9 5 7 7-7 7"/>, close: <path d="m6 6 12 12M18 6 6 18"/>, check: <path d="m5 12 4 4L19 6"/>, plus: <path d="M5 12h14M12 5v14"/>, minus: <path d="M5 12h14"/>, focus: <><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/><circle cx="12" cy="12" r="3"/></>, filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2.2c-1.4.8-2 1.1-2 2.3M12 17h.01"/></>, settings: <><circle cx="12" cy="12" r="3"/><path d="m10 3 4 0 1 3 3-1 2 4-2 2 2 3-2 3-3-1-1 3h-4l-1-3-3 1-2-3 2-3-2-2 2-4 3 1Z"/></>, warning: <><path d="m12 3 10 18H2Z"/><path d="M12 9v5m0 3h.01"/></>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>, bookmark: <path d="M5 3h14v18l-7-4-7 4Z"/>, pause: <><path d="M8 5v14M16 5v14"/></>, play: <path d="m8 4 12 8-12 8Z"/>, reset: <><path d="M3 3v6h6M3 9a9 9 0 1 1 0 6"/></>, trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>, layers: <><path d="m12 3 10 6-10 6L2 9Zm-9 11 9 5 9-5M3 18l9 5 9-5"/></>, expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>, menu: <path d="M4 6h16M4 12h16M4 18h16"/>, sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>, return: <path d="M21 4v10a3 3 0 0 1-3 3H4m5-5-5 5 5 5"/>, eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>, next: <><path d="m7 5 10 7-10 7ZM20 5v14"/></>
};
export function Icon({ name, size = 20, className = '', ...props }: {
    name: IconName;
    size?: number;
    className?: string;
} & React.SVGAttributes<SVGSVGElement>) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} {...props}>{paths[name]}</svg>; }

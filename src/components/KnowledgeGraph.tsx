import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCorpus } from '../lib/data';
import { useNavigation } from '../lib/navigation';
import type { Entity, KPType } from '../lib/types';
import { TYPE_LABEL, TYPE_ORDER } from '../lib/types';
import { Icon } from './Icon';
import { Button } from './ui/button';
import { KPPill } from './Common';
export interface MapNode {
    id: string;
    name: string;
    type: KPType | 'lesson';
    entity: Entity;
    x: number;
    y: number;
    center: boolean;
}
export interface MapEdge {
    source: string;
    target: string;
    solid: boolean;
}
const COLORS: Record<KPType | 'lesson', string> = { grammar: '#d6b574', pattern: '#b5a5d5', chunk: '#83b1d0', word: '#88bfae', lesson: '#d49371' };
/** Deterministic small neighbourhood: no force simulation or O(N²) client joins. */
export function useNeighborhood(centerId: string) { const c = useCorpus(); return useMemo(() => { const kp = c.kp(centerId) || c.kp(c.catalog.defaultKP)!; const related = [...(kp.parent ? [kp.parent] : []), ...kp.related, ...kp.contains].filter((id, i, a) => id !== kp.id && a.indexOf(id) === i); const ids = TYPE_ORDER.flatMap(type => related.filter(id => c.kp(id)?.type === type).slice(0, type === 'word' ? 3 : 3)); const nodes: MapNode[] = [{ id: kp.id, name: kp.name, type: kp.type, entity: { kind: 'kp', id: kp.id }, x: 460, y: 270, center: true }]; const neighbors = ids.map(id => ({ id, name: c.kp(id)!.name, type: c.kp(id)!.type, entity: { kind: 'kp', id } as Entity })); const lessons = kp.lessonIds.filter(l => l === c.catalog.defaultLesson).concat(kp.lessonIds.filter(l => l !== c.catalog.defaultLesson)).slice(0, 4).map(id => ({ id, name: c.lessonSummary(id)!.label + '  ' + c.lessonSummary(id)!.title.slice(0, 22), type: 'lesson' as const, entity: { kind: 'lesson', id } as Entity })); [...neighbors, ...lessons].forEach((n, i, arr) => { const angle = 2 * Math.PI * i / arr.length - Math.PI / 2; const r = i % 2 === 0 ? 184 : 220; nodes.push({ ...n, x: 460 + Math.cos(angle) * r * 1.48, y: 270 + Math.sin(angle) * r, center: false }); }); const edges: MapEdge[] = nodes.slice(1).map(n => ({ source: kp.id, target: n.id, solid: n.type === 'lesson' || kp.contains.includes(n.id) || kp.parent === n.id || c.kp(n.id)?.parent === kp.id })); return { nodes, edges, kp }; }, [c, centerId]); }
export function KnowledgeGraph({ centerId, onSelect }: {
    centerId: string;
    onSelect: (e: Entity) => void;
}) {
    const { nodes, edges, kp } = useNeighborhood(centerId);
    const [mobile, setMobile] = useState(window.innerWidth < 640);
    useEffect(() => { const media = matchMedia('(max-width: 639px)'); const change = () => setMobile(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
    return <div className="knowledge-map">{mobile ? <div className="mobile-neighborhood"><div className={'neighborhood-center type-' + kp.type}><span className="eyebrow">当前知识点</span><h2>{kp.name}</h2><p>{kp.meaning}</p><Button variant="outline" onClick={() => onSelect({ kind: 'kp', id: kp.id })}>查看用法<Icon name="arrow" size={16}/></Button></div>{TYPE_ORDER.map(type => { const group = nodes.filter(n => n.type === type && !n.center); return group.length > 0 && <section key={type}><h4>{TYPE_LABEL[type]}</h4><div className="pill-flow">{group.map(n => <button className={'kp-pill type-' + n.type} key={n.id} onClick={() => onSelect(n.entity)}><span className="type-dot"/>{n.name}<Icon name="chevron" size={14}/></button>)}</div></section>; })}<section><h4>在这些课文中遇见</h4>{nodes.filter(n => n.type === 'lesson').map(n => <button className="neighbor-lesson" key={n.id} onClick={() => onSelect(n.entity)}>{n.name}<Icon name="arrow" size={16}/></button>)}</section></div> : <GraphCanvas nodes={nodes} edges={edges} onSelect={onSelect}/>}
 <div className="graph-legend">{[...TYPE_ORDER, 'lesson' as const].map(type => <span key={type} className={'type-' + type}><i className="type-dot"/>{type === 'lesson' ? '课文' : TYPE_LABEL[type]}</span>)}<span className="edge-key"><i />组成 / 出处</span><span className="edge-key dashed"><i />同课出现</span></div></div>;
}
function GraphCanvas({ nodes, edges, onSelect }: {
    nodes: MapNode[];
    edges: MapEdge[];
    onSelect: (e: Entity) => void;
}) {
    const mount = useRef<HTMLDivElement>(null);
    const graph = useRef<import('@antv/g6').Graph | null>(null);
    const select = useRef(onSelect);
    select.current = onSelect;
    const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
    const pointerCache = useRef(new Map<number, {
        x: number;
        y: number;
    }>());
    const lastDistance = useRef(0);
    useEffect(() => { let live = true; let observer: ResizeObserver | undefined; let instance: import('@antv/g6').Graph | undefined; setStatus('loading'); const start = async () => { try {
        const { Graph } = await import('@antv/g6');
        if (!live || !mount.current)
            return;
        instance = new Graph({ container: mount.current, width: mount.current.clientWidth, height: mount.current.clientHeight, autoFit: 'view', padding: 50, animation: false, data: { nodes: nodes.map(n => ({ id: n.id, data: { entity: n.entity }, style: { x: n.x, y: n.y, size: n.center ? 64 : 16, fill: n.center ? COLORS[n.type] : COLORS[n.type], fillOpacity: n.center ? 0.2 : 0.9, stroke: COLORS[n.type], lineWidth: n.center ? 1.5 : 1, labelText: n.name, labelFill: n.center ? '#f4ebd9' : '#c4cfda', labelFontSize: n.center ? 18 : 12, labelPlacement: n.center ? 'center' : 'bottom', labelOffsetY: 10, labelWordWrap: true, labelMaxWidth: 145 } })), edges: edges.map(e => ({ source: e.source, target: e.target, style: { stroke: e.solid ? '#546272' : '#374455', lineWidth: e.solid ? 1 : .8, lineDash: e.solid ? [] : [3, 5], opacity: .75 } })) }, node: { type: 'circle' }, edge: { type: 'line' }, behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'] });
        graph.current = instance;
        instance.on('node:click', (event: unknown) => { const id = (event as {
            target?: {
                id?: string;
            };
        }).target?.id; const node = nodes.find(n => n.id === id); if (node)
            select.current(node.entity); });
        await instance.render();
        if (!live) {
            instance.destroy();
            return;
        }
        setStatus('ready');
        observer = new ResizeObserver(() => { if (instance && mount.current) {
            instance.setSize(mount.current.clientWidth, mount.current.clientHeight);
            void instance.fitView();
        } });
        observer.observe(mount.current);
    }
    catch {
        if (live)
            setStatus('fallback');
    } }; void start(); return () => { live = false; observer?.disconnect(); if (instance && !instance.destroyed)
        instance.destroy(); graph.current = null; }; }, [nodes, edges]);
    const pinch = (e: React.PointerEvent) => { if (e.pointerType !== 'touch')
        return; if (pointerCache.current.has(e.pointerId))
        pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointerCache.current.size === 2) {
        const [a, b] = [...pointerCache.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDistance.current > 0 && graph.current)
            void graph.current.zoomBy(d / lastDistance.current, false);
        lastDistance.current = d;
    } };
    return <div className="graph-viewport" onPointerDown={e => { if (e.pointerType === 'touch')
        pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); }} onPointerMove={pinch} onPointerUp={e => { pointerCache.current.delete(e.pointerId); lastDistance.current = 0; }} onPointerCancel={() => { pointerCache.current.clear(); lastDistance.current = 0; }}>
 <div className="map-coordinate">知识邻域 <span className="mono">{String(nodes.length).padStart(2, '0')} 个节点</span></div>
 <div ref={mount} className="antv-mount" aria-label="可拖动、缩放的知识星图" style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}/>
 {status !== 'ready' && <SVGGraph nodes={nodes} edges={edges} onSelect={onSelect}/>}
 {status === 'ready' && <div className="graph-controls"><Button size="icon" variant="ghost" aria-label="放大星图" onClick={() => void graph.current?.zoomBy(1.2, false)}><Icon name="plus"/></Button><Button size="icon" variant="ghost" aria-label="缩小星图" onClick={() => void graph.current?.zoomBy(.8, false)}><Icon name="minus"/></Button><Button size="icon" variant="ghost" aria-label="适应整个邻域" onClick={() => void graph.current?.fitView()}><Icon name="focus"/></Button></div>}
 <div className="map-hint">拖动探索 · 点亮一个知识点</div>
 {status === 'ready' && <div className="sr-only" aria-label="星图节点键盘导航">{nodes.map(n => <button key={n.id} onClick={() => onSelect(n.entity)}>{n.name}</button>)}</div>}
 </div>;
}
/** Accessible no-dependency renderer used when the optional graph engine cannot load. */
function SVGGraph({ nodes, edges, onSelect }: {
    nodes: MapNode[];
    edges: MapEdge[];
    onSelect: (e: Entity) => void;
}) {
    const [view, setView] = useState({ x: 0, y: 0, k: 1 });
    const pointers = useRef(new Map<number, {
        x: number;
        y: number;
    }>());
    const drag = useRef({ x: 0, y: 0, d: 0, moved: false });
    useEffect(() => setView({ x: 0, y: 0, k: 1 }), [nodes]);
    const zoom = (factor: number) => setView(v => ({ ...v, k: Math.min(2.7, Math.max(.55, v.k * factor)) }));
    return <><svg className="svg-map" viewBox="0 0 920 540" role="img" aria-label="知识关联星图" onWheel={e => zoom(e.deltaY < 0 ? 1.08 : .92)} onPointerDown={e => { if (!(e.target as Element).closest('.svg-node'))
        e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); drag.current = { x: e.clientX, y: e.clientY, d: 0, moved: false }; }} onPointerMove={e => { if (!pointers.current.has(e.pointerId))
        return; pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (drag.current.d)
            zoom(d / drag.current.d);
        drag.current.d = d;
        drag.current.moved = true;
    }
    else {
        const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
        if (Math.abs(dx) + Math.abs(dy) > 2)
            drag.current.moved = true;
        const scale = 920 / e.currentTarget.clientWidth;
        setView(v => ({ ...v, x: v.x + dx * scale, y: v.y + dy * scale }));
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
    } }} onPointerUp={e => { pointers.current.delete(e.pointerId); drag.current.d = 0; }} onPointerCancel={() => pointers.current.clear()}>
 <defs><pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#677887" opacity=".22"/></pattern></defs><rect width="920" height="540" fill="url(#map-grid)"/><g transform={`translate(${460 + view.x},${270 + view.y}) scale(${view.k}) translate(-460,-270)`}>
 {[130, 230].map(r => <ellipse key={r} cx="460" cy="270" rx={r * 1.46} ry={r} fill="none" stroke="#526273" strokeOpacity=".12"/>)}
 {edges.map((e, i) => { const a = nodes.find(n => n.id === e.source)!, b = nodes.find(n => n.id === e.target)!; return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={e.solid ? '#65727d' : '#445569'} strokeOpacity=".55" strokeWidth={e.solid ? 1 : .8} strokeDasharray={e.solid ? undefined : '3 6'}/>; })}
 {nodes.map(n => <g key={n.id} role="button" tabIndex={0} aria-label={n.name} className="svg-node" transform={`translate(${n.x},${n.y})`} onClick={e => { if (!drag.current.moved) {
        e.stopPropagation();
        onSelect(n.entity);
    } }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(n.entity);
    } }}><circle r={n.center ? 47 : 22} fill="transparent"/><circle r={n.center ? 34 : 7} fill={COLORS[n.type]} fillOpacity={n.center ? 0.13 : 0.9} stroke={COLORS[n.type]} strokeWidth={n.center ? 1.2 : 1}/>{n.center && <circle r="43" fill="none" stroke={COLORS[n.type]} strokeOpacity=".13"/>}<text y={n.center ? 5 : 30} textAnchor="middle" fill={n.center ? '#f3e8d0' : '#c5d0dc'} fontFamily="Georgia, PingFang SC, sans-serif" fontSize={n.center ? 18 : 12}>{n.name.length > 26 ? n.name.slice(0, 25) + '…' : n.name}</text></g>)}</g></svg>
 <div className="graph-controls"><Button size="icon" variant="ghost" aria-label="放大星图" onClick={() => zoom(1.2)}><Icon name="plus"/></Button><Button size="icon" variant="ghost" aria-label="缩小星图" onClick={() => zoom(.8)}><Icon name="minus"/></Button><Button size="icon" variant="ghost" aria-label="适应整个邻域" onClick={() => setView({ x: 0, y: 0, k: 1 })}><Icon name="focus"/></Button></div></>;
}

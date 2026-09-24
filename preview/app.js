/*! Lamplit local inspection build. Same TSX source; G6 dynamically falls back to the accessible SVG renderer. Not a Vite production build. */
(function(){const modules={"App":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_1 = __importStar(require("react"));
const data_1 = require("./lib/data");
const store_1 = require("./lib/store");
const navigation_1 = require("./lib/navigation");
const router_1 = require("./lib/router");
const fsrs_1 = require("./lib/fsrs");
const button_1 = require("./components/ui/button");
const dialog_1 = require("./components/ui/dialog");
const Icon_1 = require("./components/Icon");
const Common_1 = require("./components/Common");
const Details_1 = require("./components/Details");
const SearchDialog_1 = require("./components/SearchDialog");
const Atlas = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/Atlas')))), Learn = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/Learn')))), IndexPage = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/IndexPage')))), Connections = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/Connections')))), Reader = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/Reader')))), Cards = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/Cards')))), Review = (0, react_1.lazy)(() => Promise.resolve().then(() => __importStar(require('./pages/Review'))));
function App() {
    const [corpus, setCorpus] = (0, react_1.useState)(null), [error, setError] = (0, react_1.useState)(''), [attempt, setAttempt] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        let live = true;
        setError('');
        (0, data_1.loadJSON)('catalog.json').then(d => {
            if (live)
                setCorpus(new data_1.Corpus(d));
        }).catch(e => {
            if (live)
                setError(e instanceof Error ? e.message : '内容加载失败');
        });
        return () => { live = false; };
    }, [attempt]);
    if (error)
        return react_1.default.createElement("div", { className: "boot-screen" },
            react_1.default.createElement(Common_1.ErrorState, { text: error, onRetry: () => setAttempt(a => a + 1) }));
    if (!corpus)
        return react_1.default.createElement("div", { className: "boot-screen" },
            react_1.default.createElement("div", { className: "boot-brand" },
                "\u2727",
                react_1.default.createElement("span", null, "\u706F\u4E0B")),
            react_1.default.createElement(Common_1.Loader, { label: "\u6B63\u5728\u7FFB\u5F00\u4F60\u7684\u9605\u8BFB\u661F\u56FE\u2026" }));
    return react_1.default.createElement(data_1.CorpusContext.Provider, { value: corpus },
        react_1.default.createElement(store_1.StoreProvider, null,
            react_1.default.createElement(Shell, { corpus: corpus })));
}
function Shell({ corpus: c }) {
    const route = (0, router_1.useRoute)(), store = (0, store_1.useStore)();
    const [selected, setSelected] = (0, react_1.useState)(null), [search, setSearch] = (0, react_1.useState)(false), [help, setHelp] = (0, react_1.useState)(false), [now, setNow] = (0, react_1.useState)(Date.now());
    const [detailHistory, setDetailHistory] = (0, react_1.useState)([]);
    const reader = route.view === 'read', review = route.view === 'review';
    const due = (0, fsrs_1.dueCards)(store.data.cards, Math.max(now, Date.now())).length;
    (0, react_1.useEffect)(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []);
    const openEntity = (0, react_1.useCallback)((entity) => {
        setSearch(false);
        if (selected && selected.id !== entity.id)
            setDetailHistory(x => [...x.slice(-8), selected]);
        setSelected(entity);
    }, [selected]);
    const navigate = (0, react_1.useCallback)((view, id = '', params = {}) => {
        setSelected(null);
        setDetailHistory([]);
        setSearch(false);
        (0, router_1.go)(view, id, params);
        if (view === 'atlas' && params.detail === '1')
            setSelected({ kind: 'kp', id });
    }, []);
    const read = (0, react_1.useCallback)((lessonId, sentenceId, kpId) => { navigate('read', lessonId, { s: sentenceId, kp: kpId, from: route.view === 'review' || route.params.get('from') === 'review' ? 'review' : undefined }); }, [navigate, route.key]);
    const nav = (0, react_1.useMemo)(() => ({ openEntity, navigate, read }), [openEntity, navigate, read]);
    (0, react_1.useEffect)(() => { setSelected(route.view === 'atlas' && route.params.get('detail') === '1' ? { kind: 'kp', id: route.id } : null); setDetailHistory([]); setSearch(false); window.scrollTo({ top: 0 }); document.title = route.view === 'read' ? `${c.lessonSummary(route.id)?.title || '精读'} · 灯下` : '灯下 · 阅读星图'; }, [route.key, c]);
    (0, react_1.useEffect)(() => {
        const key = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSelected(null);
                setSearch(x => !x);
            }
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, []);
    const navs = [{ view: 'atlas', label: '知识星图', short: '星图', icon: 'network' }, { view: 'index', label: '知识索引', short: '索引', icon: 'list' }, { view: 'learn', label: '连学', short: '连学', icon: 'route' }, { view: 'connections', label: '课文共点', short: '共点', icon: 'link' }, { view: 'read', label: '阅读工作台', short: '精读', icon: 'book' }, { view: 'cards', label: '我的卡片', short: '卡片', icon: 'cards' }];
    const page = route.view === 'atlas' ? react_1.default.createElement(Atlas, { id: route.id }) : route.view === 'index' ? react_1.default.createElement(IndexPage, null) : route.view === 'learn' ? react_1.default.createElement(Learn, { id: route.id }) : route.view === 'connections' ? react_1.default.createElement(Connections, null) : reader ? react_1.default.createElement(Reader, { id: route.id, params: route.params }) : route.view === 'cards' ? react_1.default.createElement(Cards, null) : review ? react_1.default.createElement(Review, null) : react_1.default.createElement(Common_1.EmptyState, { title: "\u8FD9\u4E00\u9875\u6682\u65F6\u6CA1\u6709\u5185\u5BB9", action: react_1.default.createElement(button_1.Button, { onClick: () => navigate('atlas', c.catalog.defaultKP) }, "\u56DE\u5230\u661F\u56FE") });
    return react_1.default.createElement(navigation_1.NavigationContext.Provider, { value: nav },
        react_1.default.createElement("div", { className: 'app-shell ' + (reader ? 'reading-shell' : '') + (review ? ' review-shell' : '') },
            react_1.default.createElement("a", { className: "skip-link", href: "#main-content", onClick: e => { e.preventDefault(); document.getElementById('main-content')?.focus(); } }, "\u8DF3\u5230\u4E3B\u8981\u5185\u5BB9"),
            react_1.default.createElement("aside", { className: "app-sidebar" },
                react_1.default.createElement("button", { className: "brand", onClick: () => navigate('atlas', c.catalog.defaultKP), "aria-label": "\u706F\u4E0B\uFF0C\u8FD4\u56DE\u77E5\u8BC6\u661F\u56FE" },
                    react_1.default.createElement("span", { className: "brand-symbol" }, "\u2727"),
                    react_1.default.createElement("span", { className: "brand-name" },
                        "\u706F\u4E0B",
                        react_1.default.createElement("small", null, "READING ATLAS"))),
                react_1.default.createElement("div", { className: "nav-label" }, "\u4F60\u7684\u9605\u8BFB\u7A7A\u95F4"),
                react_1.default.createElement("nav", { "aria-label": "\u4E3B\u8981\u5BFC\u822A" }, navs.map(n => react_1.default.createElement("button", { key: n.view, className: route.view === n.view || (n.view === 'cards' && review) ? 'active' : '', "aria-current": route.view === n.view ? 'page' : undefined, title: n.label, onClick: () => n.view === 'read' ? read(store.data.reading?.lessonId || c.catalog.defaultLesson, store.data.reading?.sentenceId) : navigate(n.view, n.view === 'atlas' ? c.catalog.defaultKP : undefined) },
                    react_1.default.createElement(Icon_1.Icon, { name: n.icon, size: 20 }),
                    react_1.default.createElement("span", { className: "nav-desktop-label" }, n.label),
                    react_1.default.createElement("span", { className: "nav-mobile-label" }, n.short),
                    n.view === 'cards' && due > 0 && react_1.default.createElement("span", { className: "nav-due" }, due > 99 ? '99+' : due)))),
                react_1.default.createElement("div", { className: "sidebar-bottom" },
                    react_1.default.createElement("div", { className: "sidebar-quote" },
                        react_1.default.createElement("span", null, "\u201C"),
                        react_1.default.createElement("p", null,
                            "\u5728\u8BED\u5883\u4E2D\u76F8\u9047\uFF0C",
                            react_1.default.createElement("br", null),
                            "\u5728\u7406\u89E3\u4E2D\u8BB0\u4F4F\u3002"),
                        react_1.default.createElement("i", null)),
                    react_1.default.createElement("button", { className: "help-button", onClick: () => setHelp(true), title: "\u600E\u6837\u5F00\u59CB" },
                        react_1.default.createElement(Icon_1.Icon, { name: "help", size: 18 }),
                        react_1.default.createElement("span", null, "\u600E\u6837\u5F00\u59CB")),
                    react_1.default.createElement("div", { className: "local-indicator" },
                        react_1.default.createElement("span", { className: "status-dot" }),
                        "\u672C\u5730\u9605\u8BFB\u7A7A\u95F4"))),
            react_1.default.createElement("div", { className: "app-body" },
                react_1.default.createElement("header", { className: "app-header" },
                    react_1.default.createElement("div", { className: "header-location" },
                        react_1.default.createElement("span", { className: "mobile-brand" }, "\u2727 \u706F\u4E0B"),
                        react_1.default.createElement("span", { className: "desktop-breadcrumb" },
                            "\u65B0\u6982\u5FF5\u82F1\u8BED ",
                            react_1.default.createElement("span", null, "/"),
                            " ",
                            navs.find(n => n.view === route.view)?.label || '回看')),
                    react_1.default.createElement("button", { className: "global-search", onClick: () => { setSelected(null); setSearch(true); }, "aria-label": "\u6253\u5F00\u5168\u5C40\u641C\u7D22" },
                        react_1.default.createElement(Icon_1.Icon, { name: "search", size: 17 }),
                        react_1.default.createElement("span", null, "\u627E\u4E00\u4E2A\u8868\u8FBE\u3001\u4E00\u7BC7\u8BFE\u6587"),
                        react_1.default.createElement("kbd", null, "\u2318 K")),
                    react_1.default.createElement("div", { className: "header-actions" },
                        due > 0 ? react_1.default.createElement("button", { className: "due-hint", onClick: () => navigate('cards') },
                            react_1.default.createElement("span", { className: "status-dot" }),
                            due,
                            " \u5F20\u5F85\u590D\u4E60") : react_1.default.createElement("span", { className: "header-subtle" }, "\u6162\u6162\u8BFB\uFF0C\u6DF1\u6DF1\u61C2\u3002"),
                        react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u5B66\u4E60\u4F7F\u7528\u5E2E\u52A9", onClick: () => setHelp(true) },
                            react_1.default.createElement(Icon_1.Icon, { name: "help", size: 19 })))),
                store.storageError && react_1.default.createElement("div", { className: "storage-warning", role: "alert" },
                    react_1.default.createElement(Icon_1.Icon, { name: "warning", size: 17 }),
                    store.storageError,
                    " \u5F53\u524D\u4ECD\u53EF\u9605\u8BFB\uFF0C\u4F46\u6807\u8BB0\u4E0D\u80FD\u4FDD\u5B58\u3002"),
                react_1.default.createElement("main", { id: "main-content", tabIndex: -1, className: 'main-content ' + (reader ? 'main-reader' : '') + (review ? ' main-review' : '') },
                    react_1.default.createElement(react_1.Suspense, { fallback: react_1.default.createElement(Common_1.Loader, null) }, store.ready ? page : react_1.default.createElement(Common_1.Loader, { label: "\u8BFB\u53D6\u4F60\u7684\u9605\u8BFB\u4F4D\u7F6E\u2026" })))),
            react_1.default.createElement(dialog_1.Dialog, { open: selected !== null, onClose: () => { setSelected(null); setDetailHistory([]); }, title: "\u77E5\u8BC6\u4E0E\u8BED\u5883", sheet: true, className: "paper entity-sheet" }, selected && react_1.default.createElement(react_1.default.Fragment, null,
                detailHistory.length > 0 && react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => { const previous = detailHistory.at(-1); setDetailHistory(x => x.slice(0, -1)); setSelected(previous); } },
                    react_1.default.createElement(Icon_1.Icon, { name: "back", size: 15 }),
                    "\u4E0A\u4E00\u4E2A"),
                react_1.default.createElement(Details_1.EntityDetail, { entity: selected }))),
            react_1.default.createElement(SearchDialog_1.SearchDialog, { open: search, onClose: () => setSearch(false) }),
            react_1.default.createElement(dialog_1.Dialog, { open: help, onClose: () => setHelp(false), title: "\u4ECE\u4E00\u7BC7\u8BFE\u6587\u5F00\u59CB", description: "\u4E0D\u7528\u5148\u770B\u61C2\u6574\u5F20\u661F\u56FE\u3002\u5148\u8BFB\u4E00\u7BC7\uFF0C\u518D\u8BA9\u77E5\u8BC6\u6162\u6162\u8FDE\u8D77\u6765\u3002" },
                react_1.default.createElement("div", { className: "help-steps" },
                    react_1.default.createElement("section", null,
                        react_1.default.createElement("span", null, "01"),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("h3", null, "\u5148\u9009\u4E00\u4E2A\u60F3\u8868\u8FBE\u7684\u4E8B"),
                            react_1.default.createElement("p", null, "\u5728\u300C\u8FDE\u5B66\u300D\u91CC\u9009\u62E9\u80FD\u529B\u8DEF\u5F84\uFF0C\u70B9\u5F00\u8BFE\u6587\uFF0C\u770B\u770B\u8FD9\u4E00\u8BFE\u4F1A\u7EC3\u4E60\u4EC0\u4E48\u3002"))),
                    react_1.default.createElement("section", null,
                        react_1.default.createElement("span", null, "02"),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("h3", null, "\u5728\u539F\u53E5\u4E2D\u8BFB\u61C2"),
                            react_1.default.createElement("p", null, "\u70B9\u51FB\u53E5\u5B50\u770B\u8BE6\u60C5\u3002\u70B9\u5DE6\u4FA7\u77E5\u8BC6\u80F6\u56CA\uFF0C\u53EF\u4EE5\u627E\u5230\u5B83\u5728\u6587\u4E2D\u7684\u6240\u6709\u51FA\u73B0\u5904\u3002\u7D2B\u8272\u5B9E\u7EBF\u6807\u8BB0\u8303\u53E5\uFF0C\u6A59\u8272\u865A\u7EBF\u63D0\u793A\u957F\u96BE\u53E5\u3002"))),
                    react_1.default.createElement("section", null,
                        react_1.default.createElement("span", null, "03"),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("h3", null, "\u53EA\u7559\u4E0B\u5BF9\u4F60\u6709\u7528\u7684"),
                            react_1.default.createElement("p", null, "\u661F\u6807\u4F1A\u81EA\u52A8\u4FDD\u5B58\u5361\u7247\uFF1B\u300C\u4E0D\u719F\u6089\u300D\u6807\u8BB0\u4F1A\u8BA9\u8868\u8FBE\u66F4\u9192\u76EE\u3002\u5230\u300C\u6211\u7684\u5361\u7247\u300D\u7FFB\u9762\u56DE\u770B\uFF0C\u518D\u6309\u771F\u5B9E\u56DE\u5FC6\u60C5\u51B5\u8BC4\u5206\u3002")))),
                react_1.default.createElement("div", { className: "help-shortcuts" },
                    react_1.default.createElement("span", null,
                        react_1.default.createElement("kbd", null, "\u2318 / Ctrl K"),
                        " \u5168\u5C40\u641C\u7D22"),
                    react_1.default.createElement("span", null,
                        react_1.default.createElement("kbd", null, "Space"),
                        " \u7FFB\u9762"),
                    react_1.default.createElement("span", null,
                        react_1.default.createElement("kbd", null, "1\u20134"),
                        " \u590D\u4E60\u8BC4\u5206")),
                react_1.default.createElement("p", { className: "small muted" }, "\u6240\u6709\u8BB0\u5F55\u53EA\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002\u6CA1\u6709\u8D26\u53F7\uFF0C\u4E5F\u4E0D\u4F1A\u81EA\u52A8\u8DE8\u8BBE\u5907\u540C\u6B65\u3002"),
                react_1.default.createElement(button_1.Button, { className: "full", onClick: () => { setHelp(false); openEntity({ kind: 'lesson', id: c.catalog.defaultLesson }); } },
                    "\u4ECE\u8FD9\u4E00\u8BFE\u5F00\u59CB",
                    react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 17 }))),
            react_1.default.createElement("div", { className: "toast-region", role: "status", "aria-live": "polite" }, store.toasts.map(t => react_1.default.createElement("div", { className: 'toast ' + (t.error ? 'error' : ''), key: t.id },
                react_1.default.createElement(Icon_1.Icon, { name: t.error ? 'warning' : 'check', size: 17 }),
                t.text)))));
}

},
"components/Common":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loader = Loader;
exports.ErrorState = ErrorState;
exports.EmptyState = EmptyState;
exports.KPPill = KPPill;
exports.TypeBadge = TypeBadge;
exports.EntityActions = EntityActions;
exports.LessonCard = LessonCard;
exports.Pagination = Pagination;
exports.BookFilter = BookFilter;
exports.KPGroup = KPGroup;
const react_1 = __importStar(require("react"));
const button_1 = require("./ui/button");
const badge_1 = require("./ui/badge");
const Icon_1 = require("./Icon");
const store_1 = require("../lib/store");
const data_1 = require("../lib/data");
const types_1 = require("../lib/types");
const utils_1 = require("../lib/utils");
function Loader({ label = '正在展开内容…' }) { return react_1.default.createElement("div", { className: "loading-state", role: "status" },
    react_1.default.createElement("span", { className: "spinner" }),
    react_1.default.createElement("span", null, label)); }
function ErrorState({ text, onRetry }) { return react_1.default.createElement("div", { className: "empty-state" },
    react_1.default.createElement(Icon_1.Icon, { name: "warning", size: 28 }),
    react_1.default.createElement("h3", null, text),
    onRetry && react_1.default.createElement(button_1.Button, { variant: "outline", onClick: onRetry }, "\u91CD\u65B0\u52A0\u8F7D")); }
function EmptyState({ title, text, action }) { return react_1.default.createElement("div", { className: "empty-state" },
    react_1.default.createElement("div", { className: "empty-orbit" },
        react_1.default.createElement(Icon_1.Icon, { name: "spark", size: 32 })),
    react_1.default.createElement("h3", null, title),
    text && react_1.default.createElement("p", null, text),
    action); }
function KPPill({ kp, onClick, selected = false, compact = false }) { const { data } = (0, store_1.useStore)(); const f = data.flags['kp:' + kp.id]; return react_1.default.createElement("button", { className: (0, utils_1.cn)('kp-pill', `type-${kp.type}`, selected && 'selected', compact && 'compact', f?.weak && 'is-weak', f?.star && 'is-star'), onClick: onClick, title: kp.meaning || kp.name },
    react_1.default.createElement("span", { className: "type-dot" }),
    kp.name,
    f?.star && react_1.default.createElement(Icon_1.Icon, { name: "star", size: 12 })); }
function TypeBadge({ type }) { return react_1.default.createElement(badge_1.Badge, { className: (0, utils_1.cn)('type-badge', `type-${type}`) },
    react_1.default.createElement("span", { className: "type-dot" }),
    type === 'sentence' ? '句子' : type === 'lesson' ? '课文' : types_1.TYPE_LABEL[type]); }
function EntityActions({ entity, compact = false }) {
    const s = (0, store_1.useStore)();
    const key = (0, types_1.entityKey)(entity), flags = s.data.flags[key];
    const saved = !!s.data.cards[key];
    return react_1.default.createElement("div", { className: (0, utils_1.cn)('entity-actions', compact && 'compact'), onClick: e => e.stopPropagation() },
        react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", className: flags?.star ? 'starred' : '', "aria-label": flags?.star ? '取消重点' : '重点学', title: "\u91CD\u70B9\u5B66\uFF0C\u540C\u65F6\u4FDD\u5B58\u4E3A\u5361\u7247", "aria-pressed": !!flags?.star, onClick: () => (0, store_1.swallow)(s.star(entity)) },
            react_1.default.createElement(Icon_1.Icon, { name: "star" })),
        !compact && react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", className: flags?.weak ? 'weakened' : '', "aria-label": flags?.weak ? '取消不熟悉' : '不熟悉', title: "\u6807\u8BB0\u4E3A\u4E0D\u719F\u6089", "aria-pressed": !!flags?.weak, onClick: () => (0, store_1.swallow)(s.weak(entity)) },
            react_1.default.createElement(Icon_1.Icon, { name: "warning" })),
        react_1.default.createElement(button_1.Button, { variant: compact ? 'ghost' : 'outline', size: compact ? 'icon' : 'sm', "aria-label": saved ? '已保存为知识卡片' : '保存为知识卡片', disabled: saved, onClick: () => (0, store_1.swallow)(s.save(entity)) },
            react_1.default.createElement(Icon_1.Icon, { name: saved ? 'check' : 'bookmark', size: 17 }),
            !compact && (saved ? '已保存' : '保存卡片')));
}
function LessonCard({ lesson, onLesson, onKP, sequence }) {
    const corpus = (0, data_1.useCorpus)(), store = (0, store_1.useStore)();
    return react_1.default.createElement("article", { className: (0, utils_1.cn)('lesson-card', 'book-' + lesson.book) },
        react_1.default.createElement("div", { className: "lesson-card-meta" },
            react_1.default.createElement("span", { className: "mono" },
                sequence !== undefined && react_1.default.createElement("span", { className: "route-number" }, String(sequence + 1).padStart(2, '0')),
                lesson.label),
            react_1.default.createElement("span", null, lesson.genre),
            react_1.default.createElement(EntityActions, { entity: { kind: 'lesson', id: lesson.id }, compact: true })),
        react_1.default.createElement("button", { className: "lesson-card-main", onClick: () => onLesson(lesson.id) },
            react_1.default.createElement("h3", null, lesson.title),
            lesson.titleZh && react_1.default.createElement("p", { className: "lesson-zh" }, lesson.titleZh),
            react_1.default.createElement("p", { className: "lesson-scene" }, lesson.scene),
            react_1.default.createElement("p", { className: "lesson-can-do" }, lesson.canDo)),
        react_1.default.createElement("div", { className: "lesson-card-pills" }, lesson.focus.slice(0, 4).map(id => corpus.kp(id)).filter((k) => !!k).map(k => react_1.default.createElement(KPPill, { key: k.id, kp: k, onClick: () => onKP(k.id), compact: true }))),
        react_1.default.createElement("div", { className: "lesson-card-footer" },
            react_1.default.createElement("span", null,
                react_1.default.createElement(Icon_1.Icon, { name: "clock", size: 14 }),
                (0, utils_1.readingTime)(lesson.wc),
                " \u5206\u949F \u00B7 ",
                lesson.wc,
                " \u8BCD"),
            react_1.default.createElement("button", { onClick: () => onLesson(lesson.id) },
                store.data.bookmarks[lesson.id] ? '继续这一课' : '看看这一课',
                react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 }))));
}
function Pagination({ page, pages, onPage, total }) {
    if (pages <= 1)
        return null;
    return react_1.default.createElement("div", { className: "pagination" },
        total !== undefined && react_1.default.createElement("span", { className: "muted" },
            "\u5171 ",
            total.toLocaleString('zh-CN'),
            " \u9879"),
        react_1.default.createElement("div", null,
            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u4E0A\u4E00\u9875", disabled: page <= 1, onClick: () => onPage(page - 1) },
                react_1.default.createElement(Icon_1.Icon, { name: "back" })),
            react_1.default.createElement("span", { className: "mono" },
                page,
                " / ",
                pages),
            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u4E0B\u4E00\u9875", disabled: page >= pages, onClick: () => onPage(page + 1) },
                react_1.default.createElement(Icon_1.Icon, { name: "arrow" }))));
}
function BookFilter({ value, onChange }) { const c = (0, data_1.useCorpus)(); return react_1.default.createElement("div", { className: "segmented book-filter", "aria-label": "\u6309\u518C\u9009\u62E9" },
    react_1.default.createElement("button", { "aria-pressed": value === 0, className: value === 0 ? 'active' : '', onClick: () => onChange(0) }, "\u5168\u90E8"),
    c.catalog.books.map(b => react_1.default.createElement("button", { "aria-pressed": value === b.id, className: value === b.id ? 'active' : '', key: b.id, onClick: () => onChange(b.id) }, b.name))); }
function KPGroup({ ids, onKP, max = 8 }) {
    const c = (0, data_1.useCorpus)();
    const [expanded, setExpanded] = (0, react_1.useState)(false);
    const filtered = ids.map(id => c.kp(id)).filter((k) => !!k);
    return react_1.default.createElement(react_1.default.Fragment, null,
        types_1.TYPE_ORDER.map(type => {
            const points = filtered.filter(k => k.type === type);
            if (!points.length)
                return null;
            return react_1.default.createElement("section", { className: "kp-group", key: type },
                react_1.default.createElement("h4", null,
                    react_1.default.createElement(TypeBadge, { type: type }),
                    react_1.default.createElement("span", { className: "mono" }, points.length)),
                react_1.default.createElement("div", { className: "pill-flow" }, (expanded ? points : points.slice(0, max)).map(k => react_1.default.createElement(KPPill, { kp: k, key: k.id, onClick: () => onKP(k.id) }))));
        }),
        !expanded && filtered.some(k => filtered.filter(x => x.type === k.type).length > max) && react_1.default.createElement(button_1.Button, { variant: "ghost", onClick: () => setExpanded(true) },
            "\u5C55\u5F00\u6240\u6709\u77E5\u8BC6\u70B9",
            react_1.default.createElement(Icon_1.Icon, { name: "plus", size: 16 })));
}

},
"components/Details":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityDetail = EntityDetail;
exports.SentenceDetailsBody = SentenceDetailsBody;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const store_1 = require("../lib/store");
const navigation_1 = require("../lib/navigation");
const types_1 = require("../lib/types");
const utils_1 = require("../lib/utils");
const button_1 = require("./ui/button");
const Icon_1 = require("./Icon");
const Common_1 = require("./Common");
const HighlightedText_1 = require("./HighlightedText");
function EntityDetail({ entity, onOpen, context }) {
    if (entity.kind === 'kp')
        return react_1.default.createElement(KPDetail, { key: entity.id, id: entity.id, onOpen: onOpen, context: context });
    if (entity.kind === 'lesson')
        return react_1.default.createElement(LessonDetail, { key: entity.id, id: entity.id, onOpen: onOpen });
    return react_1.default.createElement(SentenceDetail, { key: entity.id, id: entity.id, onOpen: onOpen });
}
function UseQuote({ kp, context }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const lid = context && kp.lessonIds.includes(context.lessonId) ? context.lessonId : kp.lessonIds.includes(c.catalog.defaultLesson) ? c.catalog.defaultLesson : kp.lessonIds[0];
    const { data: lesson, loading, error, retry } = (0, data_1.useAsync)(() => c.lesson(lid), [lid]);
    if (loading)
        return react_1.default.createElement("div", { className: "quote-skeleton" });
    if (error)
        return react_1.default.createElement(Common_1.ErrorState, { text: error, onRetry: retry });
    const sentence = lesson?.sentences.find(s => s.id === context?.sentenceId && s.hits.some(([id]) => id === kp.id)) || lesson?.sentences.find(s => s.hits.some(([id]) => id === kp.id));
    if (!sentence)
        return null;
    return react_1.default.createElement("div", { className: "evidence-quote" },
        react_1.default.createElement("span", { className: "quote-mark" }, "\u201C"),
        react_1.default.createElement("p", { lang: "en" },
            react_1.default.createElement(HighlightedText_1.HighlightedText, { sentence: sentence, selectedKP: kp.id, inert: true })),
        react_1.default.createElement("button", { className: "source-link", onClick: () => nav.read(lid, sentence.id, kp.id) },
            lesson?.label,
            " \u00B7 ",
            lesson?.title,
            react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 14 })));
}
function ContextExamples({ kp }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const [page, setPage] = (0, react_1.useState)(1);
    const refs = (0, data_1.useAsync)(() => c.occurrences(kp.id), [kp.id]);
    const ids = (0, react_1.useMemo)(() => [...new Set((refs.data || []).map(x => x[0]))], [refs.data]);
    const list = (0, data_1.useAsync)(() => Promise.all(ids.slice((page - 1) * 5, page * 5).map(id => c.sentence(id))), [ids, page]);
    if (refs.error)
        return react_1.default.createElement(Common_1.ErrorState, { text: refs.error, onRetry: refs.retry });
    if (list.error)
        return react_1.default.createElement(Common_1.ErrorState, { text: list.error, onRetry: list.retry });
    return react_1.default.createElement("div", { className: "context-list" }, refs.loading || list.loading ? react_1.default.createElement(Common_1.Loader, null) : react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("p", { className: "muted small" },
            ids.length,
            " \u53E5\u539F\u6587 \u00B7 \u70B9\u51FB\u56DE\u5230\u5BF9\u5E94\u4F4D\u7F6E"),
        list.data?.map(s => { const l = c.lessonSummary(s.lessonId); return react_1.default.createElement("button", { className: "context-item", key: s.id, onClick: () => nav.read(s.lessonId, s.id, kp.id) },
            react_1.default.createElement("span", { className: "mono" },
                l?.label,
                " \u00B7 \u7B2C ",
                s.index + 1,
                " \u53E5"),
            react_1.default.createElement("p", { lang: "en" },
                react_1.default.createElement(HighlightedText_1.HighlightedText, { sentence: s, selectedKP: kp.id, inert: true })),
            react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 15 })); }),
        react_1.default.createElement(Common_1.Pagination, { page: page, pages: Math.ceil(ids.length / 5), onPage: setPage })));
}
function KPDetail({ id, onOpen, context }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const kp = c.kp(id);
    const [tab, setTab] = (0, react_1.useState)('lessons'), [page, setPage] = (0, react_1.useState)(1);
    const open = onOpen || nav.openEntity;
    if (!kp)
        return react_1.default.createElement(Common_1.ErrorState, { text: "\u6CA1\u6709\u627E\u5230\u8FD9\u4E2A\u77E5\u8BC6\u70B9\u3002" });
    const related = [...(kp.parent ? [kp.parent] : []), ...kp.contains, ...kp.related].filter((x, i, a) => x !== id && a.indexOf(x) === i).map(x => c.kp(x)).filter((k) => !!k).sort((a, b) => types_1.TYPE_ORDER.indexOf(a.type) - types_1.TYPE_ORDER.indexOf(b.type));
    return react_1.default.createElement("div", { className: "entity-detail kp-detail" },
        react_1.default.createElement("div", { className: "detail-kicker" },
            react_1.default.createElement(Common_1.TypeBadge, { type: kp.type }),
            react_1.default.createElement("span", { className: "mono" },
                kp.lessonIds.length,
                " \u7BC7 \u00B7 ",
                kp.frequency,
                " \u6B21")),
        react_1.default.createElement("h2", { className: kp.type === 'word' || kp.type === 'chunk' ? 'english-heading' : '' }, kp.name),
        react_1.default.createElement("p", { className: "detail-meaning" }, kp.meaning || '原文没有附带中文释义，可以先比较它在不同句子中的用法。'),
        react_1.default.createElement(Common_1.EntityActions, { entity: { kind: 'kp', id } }),
        react_1.default.createElement(UseQuote, { kp: kp, context: context }),
        react_1.default.createElement(button_1.Button, { className: "full", onClick: () => nav.read(context && kp.lessonIds.includes(context.lessonId) ? context.lessonId : kp.lessonIds.includes(c.catalog.defaultLesson) ? c.catalog.defaultLesson : kp.lessonIds[0], context?.sentenceId, kp.id) },
            "\u5728\u8BFE\u6587\u4E2D\u7406\u89E3",
            react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 17 })),
        react_1.default.createElement("div", { className: "detail-tabs", role: "tablist", "aria-label": "\u77E5\u8BC6\u70B9\u5185\u5BB9" }, [['lessons', '出现课文'], ['contexts', '原句用法'], ['related', '相关知识']].map(([key, label]) => react_1.default.createElement("button", { key: key, role: "tab", "aria-selected": tab === key, className: tab === key ? 'active' : '', onClick: () => { setTab(key); setPage(1); } }, label))),
        tab === 'lessons' && react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "related-lessons" }, kp.lessonIds.slice((page - 1) * 6, page * 6).map(lid => { const l = c.lessonSummary(lid); return react_1.default.createElement("button", { key: lid, onClick: () => open({ kind: 'lesson', id: lid }) },
                react_1.default.createElement("span", { className: "mono" }, l.label),
                react_1.default.createElement("span", null, l.title),
                react_1.default.createElement(Icon_1.Icon, { name: "chevron", size: 16 })); })),
            react_1.default.createElement(Common_1.Pagination, { page: page, pages: Math.ceil(kp.lessonIds.length / 6), onPage: setPage })),
        tab === 'contexts' && react_1.default.createElement(ContextExamples, { kp: kp }),
        tab === 'related' && react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "relation-note" },
                kp.parent && react_1.default.createElement("p", null,
                    "\u53E5\u578B\u4ECE\u5C5E ",
                    react_1.default.createElement("button", { onClick: () => open({ kind: 'kp', id: kp.parent }) }, c.kp(kp.parent)?.name)),
                kp.contains.length > 0 && react_1.default.createElement("p", null,
                    "\u5305\u542B ",
                    react_1.default.createElement("span", null, kp.contains.length),
                    " \u4E2A\u8BCD\u6216\u76F8\u5173\u8BCD\u5F62")),
            react_1.default.createElement("div", { className: "pill-flow" }, related.map(k => react_1.default.createElement(Common_1.KPPill, { key: k.id, kp: k, onClick: () => open({ kind: 'kp', id: k.id }) }))),
            react_1.default.createElement("p", { className: "small muted" }, "\u5173\u8054\u6765\u81EA\u7EC4\u6210\u5173\u7CFB\u6216\u540C\u8BFE\u51FA\u73B0\uFF0C\u4E0D\u8868\u793A\u8FD1\u4E49\u3002")),
        react_1.default.createElement("details", { className: "source-note" },
            react_1.default.createElement("summary", null, "\u6CE8\u89E3\u6765\u6E90"),
            react_1.default.createElement("p", null,
                kp.provenance === 'source-inline' ? '释义来自上传课文中的中文旁注。' : kp.provenance === 'context' ? '原文语境索引，未自动补写释义。' : '释义为本项目整理的学习提示，不是课本原注。',
                kp.type === 'grammar' || kp.type === 'pattern' ? ' 原句命中由规则识别，学习时请结合上下文核对。' : '')));
}
function LessonDetail({ id, onOpen }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)(), store = (0, store_1.useStore)(), lesson = c.lessonSummary(id), open = onOpen || nav.openEntity;
    if (!lesson)
        return react_1.default.createElement(Common_1.ErrorState, { text: "\u6CA1\u6709\u627E\u5230\u8FD9\u7BC7\u8BFE\u6587\u3002" });
    const idx = c.catalog.lessons.findIndex(l => l.id === id), prev = c.catalog.lessons[idx - 1], next = c.catalog.lessons[idx + 1];
    return react_1.default.createElement("div", { className: "entity-detail lesson-detail" },
        react_1.default.createElement("div", { className: "detail-kicker" },
            react_1.default.createElement(Common_1.TypeBadge, { type: "lesson" }),
            react_1.default.createElement("span", { className: "mono" }, lesson.label)),
        react_1.default.createElement("h2", { className: "english-heading", lang: lesson.book === 4 ? 'zh-CN' : 'en' }, lesson.title),
        lesson.titleZh && react_1.default.createElement("p", { className: "lesson-zh" }, lesson.titleZh),
        react_1.default.createElement("div", { className: "detail-meta" },
            react_1.default.createElement("span", null, lesson.genre),
            react_1.default.createElement("span", null,
                lesson.wc,
                " \u8BCD"),
            react_1.default.createElement("span", null,
                (0, utils_1.readingTime)(lesson.wc),
                " \u5206\u949F")),
        react_1.default.createElement("div", { className: "lesson-intention" },
            react_1.default.createElement("span", { className: "eyebrow" }, "\u8FD9\u4E00\u8BFE\uFF0C\u4F60\u4F1A\u7EC3\u4E60"),
            react_1.default.createElement("h3", null, lesson.scene),
            react_1.default.createElement("p", null, lesson.canDo)),
        react_1.default.createElement(button_1.Button, { className: "full", size: "lg", onClick: () => nav.read(id, store.data.bookmarks[id]) },
            react_1.default.createElement(Icon_1.Icon, { name: "book" }),
            store.data.bookmarks[id] ? '继续精读' : '开始精读',
            react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 17 })),
        react_1.default.createElement(Common_1.EntityActions, { entity: { kind: 'lesson', id } }),
        react_1.default.createElement("section", { className: "detail-section" },
            react_1.default.createElement("h4", null, lesson.summary ? '课文导读' : '内容一瞥'),
            react_1.default.createElement("p", { className: !lesson.summary ? 'english-excerpt' : '' }, lesson.summary || lesson.excerpt)),
        react_1.default.createElement("div", { className: "cluster-links" }, lesson.clusterIds.map(cid => { const cl = c.catalog.clusters.find(x => x.id === cid); return react_1.default.createElement("button", { key: cid, onClick: () => nav.navigate('learn', cid) },
            react_1.default.createElement(Icon_1.Icon, { name: "route", size: 16 }),
            cl.name,
            react_1.default.createElement(Icon_1.Icon, { name: "chevron", size: 14 })); })),
        react_1.default.createElement("section", { className: "detail-section" },
            react_1.default.createElement("h4", null, "\u8FD9\u4E00\u8BFE\u7684\u77E5\u8BC6"),
            react_1.default.createElement(Common_1.KPGroup, { ids: lesson.kpIds, onKP: kid => open({ kind: 'kp', id: kid }), max: 4 })),
        lesson.quality.length > 0 && react_1.default.createElement("details", { className: "source-note" },
            react_1.default.createElement("summary", null, "\u539F\u6587\u6536\u5F55\u8BF4\u660E"),
            lesson.quality.map((q, i) => react_1.default.createElement("p", { key: i }, q)),
            lesson.titleOrigin !== 'source' && react_1.default.createElement("p", null, "\u5217\u8868\u6807\u9898\u4E3A\u9605\u8BFB\u4E3B\u9898\u6807\u7B7E\uFF1B\u539F\u6587\u4EF6\u7684\u6807\u9898\u6587\u672C\u5B8C\u6574\u4FDD\u7559\u5728\u9605\u8BFB\u9875\u4E0E\u6765\u6E90\u6587\u4EF6\u4E2D\u3002")),
        react_1.default.createElement("div", { className: "adjacent-lessons" }, [prev, next].map((l, i) => react_1.default.createElement("button", { key: i, disabled: !l, onClick: () => l && open({ kind: 'lesson', id: l.id }) },
            react_1.default.createElement("span", null, i === 0 ? '上一篇' : '下一篇'),
            react_1.default.createElement("strong", null, l ? `${l.label} · ${l.title}` : '已经到书的边界')))));
}
function SentenceDetailsBody({ sentence, onOpen }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const lesson = c.lessonSummary(sentence.lessonId);
    const open = onOpen || nav.openEntity;
    const why = { model: '适合整句记忆。抓住表达结构，再替换人物、动作或场景。', complex: '先抓主干，再逐层看修饰。顺着句中的语法提示，找到信息之间的关系。', example: '把它作为语境来读。理解词和语块在这里的作用，不必逐句背诵。' }[sentence.tier];
    return react_1.default.createElement("div", { className: "entity-detail sentence-detail" },
        react_1.default.createElement("div", { className: "detail-kicker" },
            react_1.default.createElement("span", { className: 'tier-label tier-' + sentence.tier }, types_1.TIER_LABEL[sentence.tier]),
            react_1.default.createElement("span", { className: "mono" },
                "\u7B2C ",
                String(sentence.index + 1).padStart(2, '0'),
                " \u53E5")),
        react_1.default.createElement("blockquote", { lang: "en" }, sentence.text),
        react_1.default.createElement("div", { className: "detail-meta" },
            react_1.default.createElement("span", null, lesson.label),
            react_1.default.createElement("span", null,
                sentence.wc,
                " \u8BCD"),
            react_1.default.createElement("span", null,
                sentence.clauses,
                " \u5904\u4ECE\u53E5\u7EBF\u7D22")),
        react_1.default.createElement(Common_1.EntityActions, { entity: { kind: 'sentence', id: sentence.id } }),
        react_1.default.createElement("section", { className: "detail-section why-learn" },
            react_1.default.createElement("h4", null, "\u600E\u6837\u8BFB\u8FD9\u4E00\u53E5"),
            react_1.default.createElement("p", null, why)),
        sentence.sourceKind === 'heading' && lesson.quality.length > 0 && react_1.default.createElement("p", { className: "subtle-warning" },
            react_1.default.createElement(Icon_1.Icon, { name: "warning", size: 14 }),
            "\u672C\u53E5\u4FDD\u7559\u4E86\u539F\u6587\u4EF6\u6807\u9898\u4E2D\u7684\u53EF\u89C1\u6587\u5B57\uFF0C\u53EF\u80FD\u4E0D\u5B8C\u6574\u3002"),
        react_1.default.createElement("section", { className: "detail-section" },
            react_1.default.createElement("h4", null, "\u53E5\u4E2D\u77E5\u8BC6\u70B9"),
            react_1.default.createElement(Common_1.KPGroup, { ids: [...new Set(sentence.hits.map(x => x[0]))], onKP: id => open({ kind: 'kp', id }), max: 5 })),
        react_1.default.createElement(button_1.Button, { variant: "outline", className: "full", onClick: () => nav.read(sentence.lessonId, sentence.id) },
            react_1.default.createElement(Icon_1.Icon, { name: "return", size: 16 }),
            "\u56DE\u5230\u8FD9\u4E00\u53E5"));
}
function SentenceDetail({ id, onOpen }) {
    const c = (0, data_1.useCorpus)();
    const { data, loading, error, retry } = (0, data_1.useAsync)(() => c.sentence(id), [id]);
    if (loading)
        return react_1.default.createElement(Common_1.Loader, null);
    if (error)
        return react_1.default.createElement(Common_1.ErrorState, { text: error, onRetry: retry });
    return data ? react_1.default.createElement(SentenceDetailsBody, { sentence: data, onOpen: onOpen }) : null;
}

},
"components/HighlightedText":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighlightedText = HighlightedText;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const store_1 = require("../lib/store");
const highlight_1 = require("../lib/highlight");
const utils_1 = require("../lib/utils");
function HighlightedText({ sentence, selectedKP, inert = false, onKP }) {
    const corpus = (0, data_1.useCorpus)(), { data } = (0, store_1.useStore)();
    const segments = (0, react_1.useMemo)(() => (0, highlight_1.highlightSegments)(sentence, corpus.kpMap, data.layers, data.flags, data.cards, selectedKP), [sentence, corpus, data.layers, data.flags, data.cards, selectedKP]);
    return react_1.default.createElement(react_1.default.Fragment, null, segments.map(s => {
        const classes = (0, utils_1.cn)(s.kpIds.length > 0 && 'hl', s.grammar && 'hl-grammar', s.chunk && 'hl-chunk', s.word && 'hl-word', s.learned && 'hl-learned', s.connective && 'hl-connective', s.emphasis && `hl-${s.emphasis}`);
        if (s.kpIds.length && !inert)
            return react_1.default.createElement("span", { key: s.start, className: classes, role: "button", tabIndex: 0, "data-kp": s.kpIds[0], "data-layer": s.type || '', "aria-label": `${s.text}：${corpus.kp(s.kpIds[0])?.name}`, onClick: e => { e.stopPropagation(); onKP?.(s.kpIds[0]); }, onKeyDown: e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onKP?.(s.kpIds[0]);
                    }
                } }, s.text);
        return react_1.default.createElement("span", { key: s.start, className: classes }, s.text);
    }));
}

},
"components/Icon":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = Icon;
const react_1 = __importDefault(require("react"));
const paths = {
    star: react_1.default.createElement("path", { d: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z" }),
    spark: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M12 2v20M2 12h20M5 5l14 14M19 5 5 19" }),
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "4" })),
    search: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "10.7", cy: "10.7", r: "6.7" }),
        react_1.default.createElement("path", { d: "m16 16 5 5" })),
    book: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" })),
    network: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "3" }),
        react_1.default.createElement("circle", { cx: "5", cy: "5", r: "2" }),
        react_1.default.createElement("circle", { cx: "20", cy: "6", r: "2" }),
        react_1.default.createElement("circle", { cx: "5", cy: "20", r: "2" }),
        react_1.default.createElement("circle", { cx: "20", cy: "19", r: "2" }),
        react_1.default.createElement("path", { d: "m7 7 3 3m4 0 4-3m-4 7 4 4m-8-4-4 4" })),
    list: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M9 5h12M9 12h12M9 19h12M3 5h.1M3 12h.1M3 19h.1" })),
    route: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "5", cy: "5", r: "2" }),
        react_1.default.createElement("circle", { cx: "19", cy: "19", r: "2" }),
        react_1.default.createElement("path", { d: "M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9" })),
    link: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "m10 14 4-4m-5 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" })),
    cards: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("rect", { x: "3", y: "7", width: "14", height: "14", rx: "2" }),
        react_1.default.createElement("path", { d: "M7 3h12a2 2 0 0 1 2 2v12M7 12h6M7 16h4" })),
    arrow: react_1.default.createElement("path", { d: "M4 12h16m-6-6 6 6-6 6" }), back: react_1.default.createElement("path", { d: "M20 12H4m6-6-6 6 6 6" }), chevron: react_1.default.createElement("path", { d: "m9 5 7 7-7 7" }), close: react_1.default.createElement("path", { d: "m6 6 12 12M18 6 6 18" }), check: react_1.default.createElement("path", { d: "m5 12 4 4L19 6" }), plus: react_1.default.createElement("path", { d: "M5 12h14M12 5v14" }), minus: react_1.default.createElement("path", { d: "M5 12h14" }), focus: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6" }),
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "3" })), filter: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M4 6h16M7 12h10M10 18h4" })),
    help: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        react_1.default.createElement("path", { d: "M9 9a3 3 0 1 1 5 2.2c-1.4.8-2 1.1-2 2.3M12 17h.01" })), settings: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "3" }),
        react_1.default.createElement("path", { d: "m10 3 4 0 1 3 3-1 2 4-2 2 2 3-2 3-3-1-1 3h-4l-1-3-3 1-2-3 2-3-2-2 2-4 3 1Z" })), warning: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "m12 3 10 18H2Z" }),
        react_1.default.createElement("path", { d: "M12 9v5m0 3h.01" })), clock: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "9" }),
        react_1.default.createElement("path", { d: "M12 6v6l4 2" })), bookmark: react_1.default.createElement("path", { d: "M5 3h14v18l-7-4-7 4Z" }), pause: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M8 5v14M16 5v14" })), play: react_1.default.createElement("path", { d: "m8 4 12 8-12 8Z" }), reset: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M3 3v6h6M3 9a9 9 0 1 1 0 6" })), trash: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" })), layers: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "m12 3 10 6-10 6L2 9Zm-9 11 9 5 9-5M3 18l9 5 9-5" })), expand: react_1.default.createElement("path", { d: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" }), menu: react_1.default.createElement("path", { d: "M4 6h16M4 12h16M4 18h16" }), sun: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "4" }),
        react_1.default.createElement("path", { d: "M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" })), return: react_1.default.createElement("path", { d: "M21 4v10a3 3 0 0 1-3 3H4m5-5-5 5 5 5" }), eye: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" }),
        react_1.default.createElement("circle", { cx: "12", cy: "12", r: "3" })), next: react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("path", { d: "m7 5 10 7-10 7ZM20 5v14" }))
};
function Icon({ name, size = 20, className = '', ...props }) { return react_1.default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className: className, ...props }, paths[name]); }

},
"components/KnowledgeGraph":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNeighborhood = useNeighborhood;
exports.KnowledgeGraph = KnowledgeGraph;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const types_1 = require("../lib/types");
const Icon_1 = require("./Icon");
const button_1 = require("./ui/button");
const COLORS = { grammar: '#d6b574', pattern: '#b5a5d5', chunk: '#83b1d0', word: '#88bfae', lesson: '#d49371' };
/** Deterministic small neighbourhood: no force simulation or O(N²) client joins. */
function useNeighborhood(centerId) { const c = (0, data_1.useCorpus)(); return (0, react_1.useMemo)(() => { const kp = c.kp(centerId) || c.kp(c.catalog.defaultKP); const related = [...(kp.parent ? [kp.parent] : []), ...kp.related, ...kp.contains].filter((id, i, a) => id !== kp.id && a.indexOf(id) === i); const ids = types_1.TYPE_ORDER.flatMap(type => related.filter(id => c.kp(id)?.type === type).slice(0, type === 'word' ? 3 : 3)); const nodes = [{ id: kp.id, name: kp.name, type: kp.type, entity: { kind: 'kp', id: kp.id }, x: 460, y: 270, center: true }]; const neighbors = ids.map(id => ({ id, name: c.kp(id).name, type: c.kp(id).type, entity: { kind: 'kp', id } })); const lessons = kp.lessonIds.filter(l => l === c.catalog.defaultLesson).concat(kp.lessonIds.filter(l => l !== c.catalog.defaultLesson)).slice(0, 4).map(id => ({ id, name: c.lessonSummary(id).label + '  ' + c.lessonSummary(id).title.slice(0, 22), type: 'lesson', entity: { kind: 'lesson', id } })); [...neighbors, ...lessons].forEach((n, i, arr) => { const angle = 2 * Math.PI * i / arr.length - Math.PI / 2; const r = i % 2 === 0 ? 184 : 220; nodes.push({ ...n, x: 460 + Math.cos(angle) * r * 1.48, y: 270 + Math.sin(angle) * r, center: false }); }); const edges = nodes.slice(1).map(n => ({ source: kp.id, target: n.id, solid: n.type === 'lesson' || kp.contains.includes(n.id) || kp.parent === n.id || c.kp(n.id)?.parent === kp.id })); return { nodes, edges, kp }; }, [c, centerId]); }
function KnowledgeGraph({ centerId, onSelect }) {
    const { nodes, edges, kp } = useNeighborhood(centerId);
    const [mobile, setMobile] = (0, react_1.useState)(window.innerWidth < 640);
    (0, react_1.useEffect)(() => { const media = matchMedia('(max-width: 639px)'); const change = () => setMobile(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
    return react_1.default.createElement("div", { className: "knowledge-map" },
        mobile ? react_1.default.createElement("div", { className: "mobile-neighborhood" },
            react_1.default.createElement("div", { className: 'neighborhood-center type-' + kp.type },
                react_1.default.createElement("span", { className: "eyebrow" }, "\u5F53\u524D\u77E5\u8BC6\u70B9"),
                react_1.default.createElement("h2", null, kp.name),
                react_1.default.createElement("p", null, kp.meaning),
                react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => onSelect({ kind: 'kp', id: kp.id }) },
                    "\u67E5\u770B\u7528\u6CD5",
                    react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 }))),
            types_1.TYPE_ORDER.map(type => { const group = nodes.filter(n => n.type === type && !n.center); return group.length > 0 && react_1.default.createElement("section", { key: type },
                react_1.default.createElement("h4", null, types_1.TYPE_LABEL[type]),
                react_1.default.createElement("div", { className: "pill-flow" }, group.map(n => react_1.default.createElement("button", { className: 'kp-pill type-' + n.type, key: n.id, onClick: () => onSelect(n.entity) },
                    react_1.default.createElement("span", { className: "type-dot" }),
                    n.name,
                    react_1.default.createElement(Icon_1.Icon, { name: "chevron", size: 14 }))))); }),
            react_1.default.createElement("section", null,
                react_1.default.createElement("h4", null, "\u5728\u8FD9\u4E9B\u8BFE\u6587\u4E2D\u9047\u89C1"),
                nodes.filter(n => n.type === 'lesson').map(n => react_1.default.createElement("button", { className: "neighbor-lesson", key: n.id, onClick: () => onSelect(n.entity) },
                    n.name,
                    react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 }))))) : react_1.default.createElement(GraphCanvas, { nodes: nodes, edges: edges, onSelect: onSelect }),
        react_1.default.createElement("div", { className: "graph-legend" },
            [...types_1.TYPE_ORDER, 'lesson'].map(type => react_1.default.createElement("span", { key: type, className: 'type-' + type },
                react_1.default.createElement("i", { className: "type-dot" }),
                type === 'lesson' ? '课文' : types_1.TYPE_LABEL[type])),
            react_1.default.createElement("span", { className: "edge-key" },
                react_1.default.createElement("i", null),
                "\u7EC4\u6210 / \u51FA\u5904"),
            react_1.default.createElement("span", { className: "edge-key dashed" },
                react_1.default.createElement("i", null),
                "\u540C\u8BFE\u51FA\u73B0")));
}
function GraphCanvas({ nodes, edges, onSelect }) {
    const mount = (0, react_1.useRef)(null);
    const graph = (0, react_1.useRef)(null);
    const select = (0, react_1.useRef)(onSelect);
    select.current = onSelect;
    const [status, setStatus] = (0, react_1.useState)('loading');
    const pointerCache = (0, react_1.useRef)(new Map());
    const lastDistance = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        let live = true;
        let observer;
        let instance;
        setStatus('loading');
        const start = async () => {
            try {
                const { Graph } = await Promise.resolve().then(() => __importStar(require('@antv/g6')));
                if (!live || !mount.current)
                    return;
                instance = new Graph({ container: mount.current, width: mount.current.clientWidth, height: mount.current.clientHeight, autoFit: 'view', padding: 50, animation: false, data: { nodes: nodes.map(n => ({ id: n.id, data: { entity: n.entity }, style: { x: n.x, y: n.y, size: n.center ? 64 : 16, fill: n.center ? COLORS[n.type] : COLORS[n.type], fillOpacity: n.center ? 0.2 : 0.9, stroke: COLORS[n.type], lineWidth: n.center ? 1.5 : 1, labelText: n.name, labelFill: n.center ? '#f4ebd9' : '#c4cfda', labelFontSize: n.center ? 18 : 12, labelPlacement: n.center ? 'center' : 'bottom', labelOffsetY: 10, labelWordWrap: true, labelMaxWidth: 145 } })), edges: edges.map(e => ({ source: e.source, target: e.target, style: { stroke: e.solid ? '#546272' : '#374455', lineWidth: e.solid ? 1 : .8, lineDash: e.solid ? [] : [3, 5], opacity: .75 } })) }, node: { type: 'circle' }, edge: { type: 'line' }, behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'] });
                graph.current = instance;
                instance.on('node:click', (event) => {
                    const id = event.target?.id;
                    const node = nodes.find(n => n.id === id);
                    if (node)
                        select.current(node.entity);
                });
                await instance.render();
                if (!live) {
                    instance.destroy();
                    return;
                }
                setStatus('ready');
                observer = new ResizeObserver(() => {
                    if (instance && mount.current) {
                        instance.setSize(mount.current.clientWidth, mount.current.clientHeight);
                        void instance.fitView();
                    }
                });
                observer.observe(mount.current);
            }
            catch {
                if (live)
                    setStatus('fallback');
            }
        };
        void start();
        return () => {
            live = false;
            observer?.disconnect();
            if (instance && !instance.destroyed)
                instance.destroy();
            graph.current = null;
        };
    }, [nodes, edges]);
    const pinch = (e) => {
        if (e.pointerType !== 'touch')
            return;
        if (pointerCache.current.has(e.pointerId))
            pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointerCache.current.size === 2) {
            const [a, b] = [...pointerCache.current.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (lastDistance.current > 0 && graph.current)
                void graph.current.zoomBy(d / lastDistance.current, false);
            lastDistance.current = d;
        }
    };
    return react_1.default.createElement("div", { className: "graph-viewport", onPointerDown: e => {
            if (e.pointerType === 'touch')
                pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }, onPointerMove: pinch, onPointerUp: e => { pointerCache.current.delete(e.pointerId); lastDistance.current = 0; }, onPointerCancel: () => { pointerCache.current.clear(); lastDistance.current = 0; } },
        react_1.default.createElement("div", { className: "map-coordinate" },
            "\u77E5\u8BC6\u90BB\u57DF ",
            react_1.default.createElement("span", { className: "mono" },
                String(nodes.length).padStart(2, '0'),
                " \u4E2A\u8282\u70B9")),
        react_1.default.createElement("div", { ref: mount, className: "antv-mount", "aria-label": "\u53EF\u62D6\u52A8\u3001\u7F29\u653E\u7684\u77E5\u8BC6\u661F\u56FE", style: { visibility: status === 'ready' ? 'visible' : 'hidden' } }),
        status !== 'ready' && react_1.default.createElement(SVGGraph, { nodes: nodes, edges: edges, onSelect: onSelect }),
        status === 'ready' && react_1.default.createElement("div", { className: "graph-controls" },
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u653E\u5927\u661F\u56FE", onClick: () => void graph.current?.zoomBy(1.2, false) },
                react_1.default.createElement(Icon_1.Icon, { name: "plus" })),
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u7F29\u5C0F\u661F\u56FE", onClick: () => void graph.current?.zoomBy(.8, false) },
                react_1.default.createElement(Icon_1.Icon, { name: "minus" })),
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u9002\u5E94\u6574\u4E2A\u90BB\u57DF", onClick: () => void graph.current?.fitView() },
                react_1.default.createElement(Icon_1.Icon, { name: "focus" }))),
        react_1.default.createElement("div", { className: "map-hint" }, "\u62D6\u52A8\u63A2\u7D22 \u00B7 \u70B9\u4EAE\u4E00\u4E2A\u77E5\u8BC6\u70B9"),
        status === 'ready' && react_1.default.createElement("div", { className: "sr-only", "aria-label": "\u661F\u56FE\u8282\u70B9\u952E\u76D8\u5BFC\u822A" }, nodes.map(n => react_1.default.createElement("button", { key: n.id, onClick: () => onSelect(n.entity) }, n.name))));
}
/** Accessible no-dependency renderer used when the optional graph engine cannot load. */
function SVGGraph({ nodes, edges, onSelect }) {
    const [view, setView] = (0, react_1.useState)({ x: 0, y: 0, k: 1 });
    const pointers = (0, react_1.useRef)(new Map());
    const drag = (0, react_1.useRef)({ x: 0, y: 0, d: 0, moved: false });
    (0, react_1.useEffect)(() => setView({ x: 0, y: 0, k: 1 }), [nodes]);
    const zoom = (factor) => setView(v => ({ ...v, k: Math.min(2.7, Math.max(.55, v.k * factor)) }));
    return react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("svg", { className: "svg-map", viewBox: "0 0 920 540", role: "img", "aria-label": "\u77E5\u8BC6\u5173\u8054\u661F\u56FE", onWheel: e => zoom(e.deltaY < 0 ? 1.08 : .92), onPointerDown: e => {
                if (!e.target.closest('.svg-node'))
                    e.currentTarget.setPointerCapture(e.pointerId);
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                drag.current = { x: e.clientX, y: e.clientY, d: 0, moved: false };
            }, onPointerMove: e => {
                if (!pointers.current.has(e.pointerId))
                    return;
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (pointers.current.size === 2) {
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
                }
            }, onPointerUp: e => { pointers.current.delete(e.pointerId); drag.current.d = 0; }, onPointerCancel: () => pointers.current.clear() },
            react_1.default.createElement("defs", null,
                react_1.default.createElement("pattern", { id: "map-grid", width: "32", height: "32", patternUnits: "userSpaceOnUse" },
                    react_1.default.createElement("circle", { cx: "1", cy: "1", r: ".7", fill: "#677887", opacity: ".22" }))),
            react_1.default.createElement("rect", { width: "920", height: "540", fill: "url(#map-grid)" }),
            react_1.default.createElement("g", { transform: `translate(${460 + view.x},${270 + view.y}) scale(${view.k}) translate(-460,-270)` },
                [130, 230].map(r => react_1.default.createElement("ellipse", { key: r, cx: "460", cy: "270", rx: r * 1.46, ry: r, fill: "none", stroke: "#526273", strokeOpacity: ".12" })),
                edges.map((e, i) => { const a = nodes.find(n => n.id === e.source), b = nodes.find(n => n.id === e.target); return react_1.default.createElement("line", { key: i, x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: e.solid ? '#65727d' : '#445569', strokeOpacity: ".55", strokeWidth: e.solid ? 1 : .8, strokeDasharray: e.solid ? undefined : '3 6' }); }),
                nodes.map(n => react_1.default.createElement("g", { key: n.id, role: "button", tabIndex: 0, "aria-label": n.name, className: "svg-node", transform: `translate(${n.x},${n.y})`, onClick: e => {
                        if (!drag.current.moved) {
                            e.stopPropagation();
                            onSelect(n.entity);
                        }
                    }, onKeyDown: e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(n.entity);
                        }
                    } },
                    react_1.default.createElement("circle", { r: n.center ? 47 : 22, fill: "transparent" }),
                    react_1.default.createElement("circle", { r: n.center ? 34 : 7, fill: COLORS[n.type], fillOpacity: n.center ? 0.13 : 0.9, stroke: COLORS[n.type], strokeWidth: n.center ? 1.2 : 1 }),
                    n.center && react_1.default.createElement("circle", { r: "43", fill: "none", stroke: COLORS[n.type], strokeOpacity: ".13" }),
                    react_1.default.createElement("text", { y: n.center ? 5 : 30, textAnchor: "middle", fill: n.center ? '#f3e8d0' : '#c5d0dc', fontFamily: "Georgia, PingFang SC, sans-serif", fontSize: n.center ? 18 : 12 }, n.name.length > 26 ? n.name.slice(0, 25) + '…' : n.name))))),
        react_1.default.createElement("div", { className: "graph-controls" },
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u653E\u5927\u661F\u56FE", onClick: () => zoom(1.2) },
                react_1.default.createElement(Icon_1.Icon, { name: "plus" })),
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u7F29\u5C0F\u661F\u56FE", onClick: () => zoom(.8) },
                react_1.default.createElement(Icon_1.Icon, { name: "minus" })),
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u9002\u5E94\u6574\u4E2A\u90BB\u57DF", onClick: () => setView({ x: 0, y: 0, k: 1 }) },
                react_1.default.createElement(Icon_1.Icon, { name: "focus" }))));
}

},
"components/SearchDialog":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchDialog = SearchDialog;
const react_1 = __importStar(require("react"));
const dialog_1 = require("./ui/dialog");
const input_1 = require("./ui/input");
const Icon_1 = require("./Icon");
const data_1 = require("../lib/data");
const navigation_1 = require("../lib/navigation");
const search_1 = require("../lib/search");
const types_1 = require("../lib/types");
const utils_1 = require("../lib/utils");
function SearchDialog({ open, onClose }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const [query, setQuery] = (0, react_1.useState)(''), [sentences, setSentences] = (0, react_1.useState)([]), [active, setActive] = (0, react_1.useState)(0), [scope, setScope] = (0, react_1.useState)('all');
    const input = (0, react_1.useRef)(null);
    const [error, setError] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (open) {
            const timer = setTimeout(() => input.current?.focus(), 30);
            c.sentences().then(setSentences).catch(() => setError(true));
            return () => clearTimeout(timer);
        }
    }, [open, c]);
    const results = (0, react_1.useMemo)(() => (0, search_1.searchCatalog)(c.catalog, sentences, query, 24, scope), [c, sentences, query, scope]);
    (0, react_1.useEffect)(() => setActive(0), [query, scope]);
    (0, react_1.useEffect)(() => { document.getElementById('search-result-' + active)?.scrollIntoView({ block: 'nearest' }); }, [active]);
    function select(r) {
        onClose();
        if (r.kind === 'kp')
            nav.navigate('atlas', r.id, window.innerWidth < 640 ? { detail: '1' } : {});
        else if (r.kind === 'sentence')
            nav.read((0, utils_1.lessonFromSentence)(r.id), r.id);
        else
            nav.openEntity({ kind: 'lesson', id: r.id });
    }
    const presets = ['一般过去时', '礼貌求助', 'in the end', '私人谈话'];
    return react_1.default.createElement(dialog_1.Dialog, { open: open, onClose: onClose, title: "\u5BFB\u627E\u4E00\u4E2A\u8868\u8FBE\uFF0C\u4E00\u7BC7\u8BFE\u6587", className: "search-dialog" },
        react_1.default.createElement("div", { className: "search-input-wrap" },
            react_1.default.createElement(Icon_1.Icon, { name: "search" }),
            react_1.default.createElement(input_1.Input, { ref: input, autoFocus: true, value: query, placeholder: "\u641C\u7D22\u4E2D\u6587\u77E5\u8BC6\u70B9\u3001\u82F1\u6587\u8868\u8FBE\u6216\u8BFE\u6587\u2026", "aria-label": "\u641C\u7D22\u77E5\u8BC6\u70B9\u3001\u53E5\u5B50\u3001\u8BFE\u6587", role: "combobox", "aria-expanded": results.length > 0, "aria-controls": "search-results", "aria-activedescendant": results.length ? 'search-result-' + active : undefined, onChange: e => setQuery(e.target.value), onKeyDown: e => {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActive(i => Math.min(results.length - 1, i + 1));
                    }
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActive(i => Math.max(0, i - 1));
                    }
                    if (e.key === 'Enter' && results[active]) {
                        e.preventDefault();
                        select(results[active]);
                    }
                } })),
        react_1.default.createElement("div", { className: "search-scopes segmented" }, [['all', '全部'], ['kp', '知识点'], ['lesson', '课文'], ['sentence', '原句']].map(([key, label]) => react_1.default.createElement("button", { className: scope === key ? 'active' : '', onClick: () => setScope(key), key: key }, label))),
        !query && react_1.default.createElement("div", { className: "search-start" },
            react_1.default.createElement("span", { className: "eyebrow" }, "\u4ECE\u719F\u6089\u7684\u5F00\u59CB"),
            react_1.default.createElement("div", { className: "pill-flow" }, presets.map(x => react_1.default.createElement("button", { className: "search-preset", onClick: () => setQuery(x), key: x },
                react_1.default.createElement(Icon_1.Icon, { name: "search", size: 14 }),
                x))),
            react_1.default.createElement("p", null, "\u4E5F\u53EF\u4EE5\u641C\u7D22\u4E00\u53E5\u8BFE\u6587\u4E2D\u7684\u7247\u6BB5\u3002")),
        react_1.default.createElement("div", { id: "search-results", role: "listbox", "aria-label": "\u641C\u7D22\u7ED3\u679C", className: "search-results" }, results.map((r, i) => react_1.default.createElement("button", { id: 'search-result-' + i, role: "option", "aria-selected": i === active, className: i === active ? 'active' : '', onMouseEnter: () => setActive(i), onClick: () => select(r), key: r.kind + r.id },
            react_1.default.createElement("span", { className: 'result-icon type-' + r.type },
                react_1.default.createElement(Icon_1.Icon, { name: r.kind === 'lesson' ? 'book' : r.kind === 'sentence' ? 'list' : 'spark', size: 18 })),
            react_1.default.createElement("span", null,
                react_1.default.createElement("strong", null, r.name),
                react_1.default.createElement("small", null, r.subtitle)),
            react_1.default.createElement("span", { className: "result-type" }, r.kind === 'lesson' ? '课文' : r.kind === 'sentence' ? '原句' : types_1.TYPE_LABEL[r.type]),
            react_1.default.createElement(Icon_1.Icon, { name: "return", size: 15 })))),
        query && !results.length && react_1.default.createElement("div", { className: "search-no-results" },
            react_1.default.createElement("p", null,
                "\u6CA1\u6709\u627E\u5230\u201C",
                query,
                "\u201D"),
            react_1.default.createElement("span", null, "\u8BD5\u8BD5\u66F4\u77ED\u7684\u8BCD\uFF0C\u6216\u53EA\u8F93\u5165\u82F1\u6587\u8868\u8FBE\u7684\u4E00\u90E8\u5206\u3002")),
        error && react_1.default.createElement("p", { className: "small muted" }, "\u539F\u53E5\u7D22\u5F15\u6682\u672A\u52A0\u8F7D\uFF0C\u77E5\u8BC6\u70B9\u4E0E\u8BFE\u6587\u4ECD\u53EF\u641C\u7D22\u3002"),
        react_1.default.createElement("div", { className: "search-hint" },
            react_1.default.createElement("span", null, "\u2191 \u2193 \u9009\u62E9"),
            react_1.default.createElement("span", null, "Enter \u6253\u5F00"),
            react_1.default.createElement("span", null, "Esc \u5173\u95ED")));
}

},
"components/ui/badge":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
const react_1 = __importDefault(require("react"));
const utils_1 = require("../../lib/utils");
function Badge({ className, ...props }) { return react_1.default.createElement("span", { "data-slot": "badge", className: (0, utils_1.cn)('ui-badge', className), ...props }); }

},
"components/ui/button":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
exports.buttonVariants = buttonVariants;
const react_1 = __importDefault(require("react"));
const utils_1 = require("../../lib/utils");
function buttonVariants({ variant = 'default', size = 'default' } = {}) { return (0, utils_1.cn)('ui-button', `ui-button--${variant}`, size === 'default' ? 'ui-button--size-default' : `ui-button--${size}`); }
exports.Button = react_1.default.forwardRef(({ className, variant, size, type = 'button', ...props }, ref) => react_1.default.createElement("button", { type: type, "data-slot": "button", className: (0, utils_1.cn)(buttonVariants({ variant, size }), className), ref: ref, ...props }));
exports.Button.displayName = 'Button';

},
"components/ui/card":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = Card;
exports.CardHeader = CardHeader;
exports.CardTitle = CardTitle;
exports.CardDescription = CardDescription;
exports.CardContent = CardContent;
exports.CardFooter = CardFooter;
const react_1 = __importDefault(require("react"));
const utils_1 = require("../../lib/utils");
function Card({ className, ...props }) { return react_1.default.createElement("div", { "data-slot": "card", className: (0, utils_1.cn)('ui-card', className), ...props }); }
function CardHeader({ className, ...props }) { return react_1.default.createElement("div", { "data-slot": "card-header", className: (0, utils_1.cn)('ui-card-header', className), ...props }); }
function CardTitle({ className, ...props }) { return react_1.default.createElement("h3", { "data-slot": "card-title", className: (0, utils_1.cn)('ui-card-title', className), ...props }); }
function CardDescription({ className, ...props }) { return react_1.default.createElement("p", { "data-slot": "card-description", className: (0, utils_1.cn)('muted', className), ...props }); }
function CardContent({ className, ...props }) { return react_1.default.createElement("div", { "data-slot": "card-content", className: (0, utils_1.cn)('ui-card-content', className), ...props }); }
function CardFooter({ className, ...props }) { return react_1.default.createElement("div", { "data-slot": "card-footer", className: (0, utils_1.cn)('ui-card-footer', className), ...props }); }

},
"components/ui/dialog":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dialog = Dialog;
const react_1 = __importStar(require("react"));
const utils_1 = require("../../lib/utils");
const button_1 = require("./button");
const Icon_1 = require("../Icon");
// Native modal dialog provides focus trapping, Escape and background inertness without JS polyfills.
function Dialog({ open, onClose, title, description, children, className = '', sheet = false }) {
    const ref = (0, react_1.useRef)(null);
    const closeRef = (0, react_1.useRef)(onClose);
    closeRef.current = onClose;
    (0, react_1.useEffect)(() => {
        const el = ref.current;
        if (!el)
            return;
        if (open && !el.open) {
            el.showModal();
        }
        else if (!open && el.open)
            el.close();
    }, [open]);
    (0, react_1.useEffect)(() => {
        if (!open)
            return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [open]);
    return react_1.default.createElement("dialog", { ref: ref, className: (0, utils_1.cn)('dialog', sheet && 'dialog-sheet', className), "aria-label": title, onCancel: event => { event.preventDefault(); closeRef.current(); }, onClick: e => {
            if (e.target === e.currentTarget) {
                const r = e.currentTarget.getBoundingClientRect();
                if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
                    onClose();
            }
        } }, open && react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: "dialog-header" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", null, title),
                description && react_1.default.createElement("p", null, description)),
            react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": "\u5173\u95ED", onClick: onClose },
                react_1.default.createElement(Icon_1.Icon, { name: "close" }))),
        react_1.default.createElement("div", { className: "dialog-body" }, children)));
}

},
"components/ui/input":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const react_1 = __importDefault(require("react"));
const utils_1 = require("../../lib/utils");
exports.Input = react_1.default.forwardRef(({ className, type = 'text', ...props }, ref) => react_1.default.createElement("input", { ref: ref, "data-slot": "input", type: type, className: (0, utils_1.cn)('ui-input', className), ...props }));
exports.Input.displayName = 'Input';

},
"lib/data":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorpusContext = exports.Corpus = void 0;
exports.loadJSON = loadJSON;
exports.useCorpus = useCorpus;
exports.useAsync = useAsync;
const react_1 = require("react");
const utils_1 = require("./utils");
const BASE = './data/';
const requests = new Map();
function loadJSON(name) {
    if (requests.has(name))
        return requests.get(name);
    const promise = (async () => {
        // Static precompressed data also works on a plain static host without content-encoding rules.
        if ('DecompressionStream' in globalThis) {
            try {
                const compressed = await fetch(BASE + name + '.gz');
                if (compressed.ok && compressed.body) {
                    const stream = compressed.body.pipeThrough(new DecompressionStream('gzip'));
                    return await new Response(stream).json();
                }
            }
            catch { /* A plain JSON fallback handles older browsers and hosts transforming gzip files. */ }
        }
        const response = await fetch(BASE + name);
        if (!response.ok)
            throw new Error('课文暂时没有加载成功，请重试。');
        return await response.json();
    })().catch(error => { requests.delete(name); throw error; });
    requests.set(name, promise);
    return promise;
}
class Corpus {
    catalog;
    kpMap;
    lessonMap;
    constructor(catalog) {
        this.catalog = catalog;
        this.kpMap = new Map(catalog.kps.map(k => [k.id, k]));
        this.lessonMap = new Map(catalog.lessons.map(l => [l.id, l]));
    }
    kp(id) { return this.kpMap.get(id); }
    lessonSummary(id) { return this.lessonMap.get(id); }
    async book(book) { return loadJSON(`books/${book}.json`); }
    async lesson(id) {
        const result = (await this.book((0, utils_1.sourceBook)(id))).find(l => l.id === id);
        if (!result)
            throw new Error('没有找到这篇课文。');
        return result;
    }
    async sentence(id) {
        const result = (await this.lesson((0, utils_1.lessonFromSentence)(id))).sentences.find(s => s.id === id);
        if (!result)
            throw new Error('没有找到这句原文。');
        return result;
    }
    async occurrences(id) {
        const bucket = [...id].reduce((v, c) => (v * 31 + c.charCodeAt(0)) >>> 0, 0) % 32;
        const all = await loadJSON(`contexts/${bucket}.json`);
        return all[id] || [];
    }
    async contexts(id) { const occurrences = await this.occurrences(id); const ids = [...new Set(occurrences.map(x => x[0]))]; return Promise.all(ids.map(sid => this.sentence(sid))); }
    pairs() { return loadJSON('pairs.json'); }
    sentences() { return loadJSON('sentences.json'); }
}
exports.Corpus = Corpus;
exports.CorpusContext = (0, react_1.createContext)(null);
function useCorpus() {
    const c = (0, react_1.useContext)(exports.CorpusContext);
    if (!c)
        throw new Error('Corpus is not initialized');
    return c;
}
function useAsync(loader, deps) {
    const [state, setState] = (0, react_1.useState)({ data: null, error: null, loading: true });
    const [retry, setRetry] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        let active = true;
        setState({ data: null, error: null, loading: true });
        loader().then(data => {
            if (active)
                setState({ data, error: null, loading: false });
        }).catch(e => {
            if (active)
                setState({ data: null, error: e instanceof Error ? e.message : '加载失败，请重试。', loading: false });
        });
        return () => { active = false; };
    }, [...deps, retry]);
    return { ...state, retry: () => setRetry(n => n + 1) };
}

},
"lib/fsrs":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY = exports.WEIGHTS = void 0;
exports.initialDifficulty = initialDifficulty;
exports.retrievability = retrievability;
exports.intervalFor = intervalFor;
exports.createCard = createCard;
exports.scheduleOptions = scheduleOptions;
exports.dueCards = dueCards;
exports.intervalLabel = intervalLabel;
exports.localDay = localDay;
/** FSRS-6 equations and default weights, adapted from FSRS4Anki 6.1.1.
 * Reference commit: 724a2f445adfffb2cc3d7fae7a96ab37b948561c.
 * MIT, Copyright (c) 2022 open-spaced-repetition. See THIRD_PARTY_NOTICES.md.
 * This app owns the 1m/10m learning steps, new-card weak prior and session UI.
 * Fuzz is intentionally disabled for a small personal collection and deterministic tests.
 */
exports.WEIGHTS = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
exports.DAY = 86400000;
const DECAY = -exports.WEIGHTS[20];
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value) => Math.round(value * 10000) / 10000;
function initialDifficulty(grade) { return clamp(exports.WEIGHTS[4] - Math.exp(exports.WEIGHTS[5] * (grade - 1)) + 1, 1, 10); }
function retrievability(card, now = Date.now()) {
    if (card.lastReview === null || card.stability <= 0)
        return 0;
    const elapsed = Math.max(0, (now - card.lastReview) / exports.DAY);
    return clamp(Math.pow(1 + FACTOR * elapsed / card.stability, DECAY), 0, 1);
}
function intervalFor(stability, retention = 0.9) {
    if (!Number.isFinite(stability) || stability <= 0)
        throw new Error('稳定度必须为正数');
    if (!Number.isFinite(retention) || retention < 0.75 || retention > 0.97)
        throw new Error('目标保留率应介于 75% 与 97%');
    return clamp(Math.round(stability / FACTOR * (Math.pow(retention, 1 / DECAY) - 1)), 1, 36500);
}
function createCard(entity, weak = false, now = Date.now(), contentVersion = 'nce-source-v1') {
    return { id: `${entity.kind}:${entity.id}`, entity: { ...entity }, createdAt: now, due: now - (weak ? 60000 : 0), lastReview: null, stability: weak ? 0.05 : 0, difficulty: 0, reps: 0, lapses: 0, state: 'new', paused: false, weakAtCreation: weak, contentVersion };
}
function memoryAfter(card, grade, now) {
    if (card.reps === 0 || card.stability <= 0)
        return { difficulty: initialDifficulty(grade), stability: Math.max(0.01, exports.WEIGHTS[grade - 1] * (card.weakAtCreation ? 0.6 : 1)) };
    const s = card.stability, d = card.difficulty, r = retrievability(card, now);
    const delta = -exports.WEIGHTS[6] * (grade - 3);
    const newD = clamp(exports.WEIGHTS[7] * initialDifficulty(4) + (1 - exports.WEIGHTS[7]) * (d + delta * (10 - d) / 9), 1, 10);
    const elapsed = card.lastReview === null ? 0 : Math.max(0, (now - card.lastReview) / exports.DAY);
    let stability;
    if (elapsed < 1) {
        let multiplier = Math.exp(exports.WEIGHTS[17] * (grade - 3 + exports.WEIGHTS[18])) * Math.pow(s, -exports.WEIGHTS[19]);
        if (grade >= 3)
            multiplier = Math.max(multiplier, 1);
        stability = s * multiplier;
    }
    else if (grade === 1) {
        stability = Math.min(exports.WEIGHTS[11] * Math.pow(d, -exports.WEIGHTS[12]) * (Math.pow(s + 1, exports.WEIGHTS[13]) - 1) * Math.exp((1 - r) * exports.WEIGHTS[14]), s / Math.exp(exports.WEIGHTS[17] * exports.WEIGHTS[18]));
    }
    else {
        const hardPenalty = grade === 2 ? exports.WEIGHTS[15] : 1, easyBonus = grade === 4 ? exports.WEIGHTS[16] : 1;
        stability = s * (1 + Math.exp(exports.WEIGHTS[8]) * (11 - d) * Math.pow(s, -exports.WEIGHTS[9]) * (Math.exp((1 - r) * exports.WEIGHTS[10]) - 1) * hardPenalty * easyBonus);
    }
    return { difficulty: round(newD), stability: round(clamp(stability, 0.01, 36500)) };
}
function scheduleOptions(card, retention = 0.9, now = Date.now()) {
    if (card.paused)
        throw new Error('请先恢复这张卡片');
    const options = {};
    for (const grade of [1, 2, 3, 4]) {
        const mem = memoryAfter(card, grade, now);
        const nextState = grade === 1 ? (card.state === 'review' || card.state === 'relearning' ? 'relearning' : 'learning') : grade === 2 && card.state !== 'review' ? (card.state === 'relearning' ? 'relearning' : 'learning') : 'review';
        const days = grade === 1 ? 1 / 1440 : grade === 2 && nextState !== 'review' ? 10 / 1440 : intervalFor(mem.stability, retention);
        const updated = { ...card, ...mem, state: nextState, lastReview: now, reps: card.reps + 1, lapses: card.lapses + (grade === 1 && card.state === 'review' ? 1 : 0), due: now + days * exports.DAY };
        options[grade] = { card: updated, intervalDays: days };
    }
    // Avoid equal rounded intervals on the three successful ratings.
    if (card.state === 'review') {
        options[2].intervalDays = Math.min(options[2].intervalDays, options[3].intervalDays);
        options[3].intervalDays = Math.min(36500, Math.max(options[3].intervalDays, options[2].intervalDays + 1));
    }
    options[4].intervalDays = Math.min(36500, Math.max(options[4].intervalDays, options[3].intervalDays + 1));
    for (const grade of [1, 2, 3, 4])
        options[grade].card.due = now + options[grade].intervalDays * exports.DAY;
    return options;
}
function dueCards(cards, now = Date.now()) { return Object.values(cards).filter(c => !c.paused && c.due <= now).sort((a, b) => a.due - b.due || a.createdAt - b.createdAt); }
function intervalLabel(days) {
    if (days < 1 / 24)
        return `${Math.max(1, Math.round(days * 1440))} 分钟`;
    if (days < 1)
        return `${Math.round(days * 24)} 小时`;
    if (days >= 365)
        return `${(days / 365).toFixed(1)} 年`;
    return `${Math.round(days)} 天`;
}
function localDay(at) { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

},
"lib/highlight":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightSegments = highlightSegments;
function highlightSegments(sentence, kpMap, layers, flags, cards, selectedKP) {
    const active = sentence.hits.filter(([id]) => { const kp = kpMap.get(id); const f = flags['kp:' + id]; return !!kp && (id === selectedKP || f?.star || f?.weak || layers[kp.type]); });
    const bounds = new Set([0, sentence.text.length]);
    active.forEach(([, a, b]) => { bounds.add(a); bounds.add(b); });
    if (layers.connective)
        sentence.connectives.forEach(([a, b]) => { bounds.add(a); bounds.add(b); });
    const sorted = [...bounds].filter(x => x >= 0 && x <= sentence.text.length).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i], b = sorted[i + 1];
        if (a === b)
            continue;
        const hits = active.filter(([, start, end]) => start <= a && end >= b);
        hits.sort(([a], [b]) => { const weight = (id) => id === selectedKP ? 100 : flags['kp:' + id]?.weak ? 90 : flags['kp:' + id]?.star ? 80 : ({ chunk: 50, pattern: 40, word: 30, grammar: 20 }[kpMap.get(id).type]); return weight(b) - weight(a); });
        const ids = [...new Set(hits.map(x => x[0]))];
        const key = ids[0];
        const selected = !!selectedKP && ids.includes(selectedKP);
        const weak = ids.some(id => flags['kp:' + id]?.weak), star = ids.some(id => flags['kp:' + id]?.star);
        const type = key ? kpMap.get(key).type : null;
        result.push({ text: sentence.text.slice(a, b), start: a, end: b, kpIds: ids, type, emphasis: weak ? 'weak' : selected ? 'selected' : star ? 'star' : null, grammar: layers.grammar && ids.some(id => kpMap.get(id)?.type === 'grammar'), chunk: layers.chunk && ids.some(id => kpMap.get(id)?.type === 'chunk'), word: layers.word && ids.some(id => kpMap.get(id)?.type === 'word'), connective: layers.connective && sentence.connectives.some(([start, end]) => start <= a && end >= b), learned: ids.some(id => kpMap.get(id)?.type === 'word' && (cards['kp:' + id]?.reps || 0) > 0) });
    }
    return result;
}

},
"lib/navigation":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationContext = void 0;
exports.useNavigation = useNavigation;
const react_1 = require("react");
exports.NavigationContext = (0, react_1.createContext)(null);
function useNavigation() {
    const nav = (0, react_1.useContext)(exports.NavigationContext);
    if (!nav)
        throw new Error('Navigation is not initialized');
    return nav;
}

},
"lib/router":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRoute = parseRoute;
exports.go = go;
exports.useRoute = useRoute;
const react_1 = require("react");
const safeDecode = (value) => {
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
};
function parseRoute(hash) { const value = hash.replace(/^#/, '') || '/atlas/g-past'; const [pathname, query] = value.split('?'); const [, view = 'atlas', id = ''] = pathname.split('/'); return { view, id: safeDecode(id), params: new URLSearchParams(query || ''), key: value }; }
function go(view, id = '', params = {}, replace = false) {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined)).toString();
    const hash = `#/${view}${id ? '/' + encodeURIComponent(id) : ''}${query ? '?' + query : ''}`;
    if (replace) {
        history.replaceState(null, '', hash);
        dispatchEvent(new HashChangeEvent('hashchange'));
    }
    else
        location.hash = hash;
}
function useRoute() { const [route, setRoute] = (0, react_1.useState)(() => parseRoute(location.hash)); (0, react_1.useEffect)(() => { const change = () => setRoute(parseRoute(location.hash)); addEventListener('hashchange', change); return () => removeEventListener('hashchange', change); }, []); return route; }

},
"lib/search":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchScore = matchScore;
exports.searchCatalog = searchCatalog;
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
function matchScore(name, meaning, query) {
    const n = normalize(name), q = normalize(query), m = normalize(meaning);
    if (!q)
        return 0;
    if (n === q)
        return 100;
    if (n.startsWith(q))
        return 80;
    if (n.includes(q))
        return 60;
    if (m.includes(q))
        return 40;
    const parts = q.split(' ').filter(Boolean);
    if (parts.length > 1 && parts.every(p => n.includes(p)))
        return 30;
    // Single omitted/extra character, restricted to short Latin headwords.
    if (/^[a-z]{4,18}$/.test(q) && /^[a-z-]{3,19}$/.test(n) && Math.abs(n.length - q.length) <= 1) {
        let a = 0, b = 0, diff = 0;
        while (a < n.length && b < q.length) {
            if (n[a] === q[b]) {
                a++;
                b++;
                continue;
            }
            if (++diff > 1)
                return 0;
            if (n.length >= q.length)
                a++;
            if (n.length <= q.length)
                b++;
        }
        if (diff + n.length - a + q.length - b <= 1)
            return 20;
    }
    return 0;
}
function searchCatalog(catalog, sentences, query, limit = 30, scope = 'all') {
    const out = [];
    if (!query.trim())
        return out;
    if (scope === 'all' || scope === 'kp')
        for (const k of catalog.kps) {
            const score = matchScore(k.name, k.meaning, query);
            if (score)
                out.push({ kind: 'kp', id: k.id, name: k.name, subtitle: k.meaning || `${k.lessonIds.length} 篇课文中的用法`, type: k.type, score });
        }
    if (scope === 'all' || scope === 'lesson')
        for (const l of catalog.lessons) {
            const score = matchScore(l.title, `${l.titleZh} ${l.scene} ${l.canDo} ${l.label} 第${l.book}册 第${l.no}课 Lesson ${l.no}`, query);
            if (score)
                out.push({ kind: 'lesson', id: l.id, name: l.title, subtitle: `${l.label} · ${l.scene}`, book: l.book, type: 'lesson', score });
        }
    if (scope === 'all' || scope === 'sentence')
        for (const s of sentences) {
            const score = matchScore(s.text, '', query);
            if (score)
                out.push({ kind: 'sentence', id: s.id, name: s.text, subtitle: s.tier === 'model' ? '范句' : s.tier === 'complex' ? '长难句' : '原文例句', type: 'sentence', score: score === 100 ? 100 : score - 5 });
        }
    return out.sort((a, b) => b.score - a.score || ({ kp: 0, lesson: 1, sentence: 2 }[a.kind] - { kp: 0, lesson: 1, sentence: 2 }[b.kind]) || a.name.length - b.name.length).slice(0, limit);
}

},
"lib/store":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreProvider = StoreProvider;
exports.useStore = useStore;
exports.swallow = swallow;
const react_1 = __importStar(require("react"));
const types_1 = require("./types");
const utils_1 = require("./utils");
const fsrs_1 = require("./fsrs");
const DATABASE = 'lamplit-reader-v1';
const fresh = () => ({ version: 1, revision: 0, cards: {}, flags: {}, reviews: [], retention: 0.9, reading: null, bookmarks: {}, layers: { pattern: true, grammar: true, chunk: true, word: false, connective: false, genre: true }, welcomeDismissed: false, session: null, readerSize: 20 });
function normalize(data) {
    if (!data)
        return fresh();
    const d = data;
    if (d.version !== 1 || typeof d.cards !== 'object' || !Array.isArray(d.reviews))
        throw new Error('本地记录的版本暂时无法读取，原数据未被覆盖。');
    return { ...fresh(), ...d, layers: { ...fresh().layers, ...d.layers }, bookmarks: d.bookmarks || {} };
}
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains('state'))
                request.result.createObjectStore('state');
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('请关闭另一个旧版本页面后重试。'));
    });
}
function readDB(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('state', 'readonly');
        const r = tx.objectStore('state').get('root');
        r.onsuccess = () => {
            try {
                resolve(normalize(r.result));
            }
            catch (e) {
                reject(e);
            }
        };
        r.onerror = () => reject(r.error);
    });
}
// Read-modify-write happens inside ONE transaction: star+card and grade+log are atomic.
function writeDB(db, mutator) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('state', 'readwrite');
        const store = tx.objectStore('state');
        let result;
        const get = store.get('root');
        get.onsuccess = () => {
            try {
                result = normalize(get.result);
                mutator(result);
                result.revision++;
                store.put(result, 'root');
            }
            catch (e) {
                tx.abort();
                reject(e);
            }
        };
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('保存未完成'));
    });
}
const StoreContext = (0, react_1.createContext)(null);
function StoreProvider({ children }) {
    const [data, setData] = (0, react_1.useState)(fresh);
    const [ready, setReady] = (0, react_1.useState)(false);
    const [storageError, setStorageError] = (0, react_1.useState)(null);
    const [toasts, setToasts] = (0, react_1.useState)([]);
    const db = (0, react_1.useRef)(null);
    const channel = (0, react_1.useRef)(null);
    const queue = (0, react_1.useRef)(Promise.resolve());
    const notify = (0, react_1.useCallback)((text, error = false) => { const id = Date.now() + Math.random(); setToasts(t => [...t.slice(-2), { id, text, error }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200); }, []);
    (0, react_1.useEffect)(() => {
        let active = true;
        openDB().then(async (database) => {
            if (!active) {
                database.close();
                return;
            }
            db.current = database;
            const value = await readDB(database);
            if (active) {
                setData(value);
                setReady(true);
            }
            if (typeof BroadcastChannel !== 'undefined') {
                channel.current = new BroadcastChannel(DATABASE);
                channel.current.onmessage = () => {
                    if (db.current)
                        void readDB(db.current).then(value => {
                            if (active)
                                setData(prev => value.revision > prev.revision ? value : prev);
                        }).catch(() => { });
                };
            }
        }).catch(e => {
            if (active) {
                setStorageError(e instanceof Error ? e.message : '本地保存暂不可用，请允许网站存储。');
                setReady(true);
            }
        });
        return () => { active = false; channel.current?.close(); db.current?.close(); };
    }, []);
    const update = (0, react_1.useCallback)((mutator) => {
        const op = queue.current.catch(() => { }).then(async () => {
            if (!db.current)
                throw new Error('本地保存暂不可用，操作尚未保存。');
            const next = await writeDB(db.current, mutator);
            setData(previous => next.revision >= previous.revision ? next : previous);
            channel.current?.postMessage(next.revision);
        });
        queue.current = op;
        return op.catch(e => { notify(e instanceof Error ? e.message : '保存失败，请重试。', true); throw e; });
    }, [notify]);
    const save = (0, react_1.useCallback)(async (e) => {
        let exists = false;
        await update(d => {
            const key = (0, types_1.entityKey)(e);
            exists = !!d.cards[key];
            if (!exists)
                d.cards[key] = (0, fsrs_1.createCard)(e, !!d.flags[key]?.weak);
        });
        notify(exists ? '这张卡片已经保存过了' : '已保存为卡片，随时可以复习');
    }, [update, notify]);
    const star = (0, react_1.useCallback)(async (e) => {
        let marked = false;
        await update(d => {
            const key = (0, types_1.entityKey)(e);
            const f = d.flags[key] || { star: false, weak: false };
            marked = !f.star;
            d.flags[key] = { ...f, star: marked };
            if (marked && !d.cards[key])
                d.cards[key] = (0, fsrs_1.createCard)(e, f.weak);
        });
        notify(marked ? '已标为重点，并加入卡片' : '已取消重点，卡片仍保留');
    }, [update, notify]);
    const weak = (0, react_1.useCallback)(async (e) => {
        let marked = false;
        await update(d => {
            const key = (0, types_1.entityKey)(e);
            const f = d.flags[key] || { star: false, weak: false };
            marked = !f.weak;
            d.flags[key] = { ...f, weak: marked };
            const card = d.cards[key];
            if (marked && card && card.reps === 0) {
                card.weakAtCreation = true;
                card.stability = 0.05;
                card.due = Math.min(card.due, Date.now() - 60000);
            }
        });
        notify(marked ? '已标记为不熟悉' : '已取消不熟悉标记');
    }, [update, notify]);
    const setLayers = (0, react_1.useCallback)((patch) => update(d => { d.layers = { ...d.layers, ...patch }; }), [update]);
    const readPosition = (0, react_1.useCallback)((lessonId, sentenceId) => update(d => { d.reading = { lessonId, sentenceId, at: Date.now() }; d.bookmarks[lessonId] = sentenceId; }), [update]);
    const setRetention = (0, react_1.useCallback)(async (n) => {
        if (n < 0.75 || n > 0.97 || !Number.isFinite(n))
            throw new Error('保留率不在允许范围内');
        await update(d => { d.retention = n; });
        notify('复习频率已更新，将用于下一次评分');
    }, [update, notify]);
    const setReaderSize = (0, react_1.useCallback)((n) => update(d => { d.readerSize = Math.min(26, Math.max(16, n)); }), [update]);
    const dismissWelcome = (0, react_1.useCallback)(() => update(d => { d.welcomeDismissed = true; }), [update]);
    const batch = (0, react_1.useCallback)(async (ids, action) => {
        await update(d => {
            ids.forEach(id => {
                const card = d.cards[id];
                if (!card)
                    return;
                if (action === 'delete') {
                    delete d.cards[id];
                    if (d.flags[id])
                        d.flags[id].star = false;
                }
                else if (action === 'reset') {
                    const reset = (0, fsrs_1.createCard)(card.entity, !!d.flags[id]?.weak);
                    reset.createdAt = card.createdAt;
                    d.cards[id] = reset;
                }
                else
                    card.paused = action === 'pause';
            });
            if (d.session && !d.session.finishedAt) {
                const prefix = d.session.queue.slice(0, d.session.cursor);
                const rest = d.session.queue.slice(d.session.cursor).filter(id => !!d.cards[id] && !d.cards[id].paused);
                d.session.queue = [...prefix, ...rest];
                if (!rest.length)
                    d.session.finishedAt = Date.now();
            }
        });
        notify({ delete: '卡片已删除', pause: '已暂停复习', resume: '已恢复复习', reset: '进度已重置，原始保存时间保留' }[action]);
    }, [update, notify]);
    const startSession = (0, react_1.useCallback)(async () => {
        let started = false;
        await update(d => {
            const active = d.session;
            if (active && !active.finishedAt && active.cursor < active.queue.length) {
                started = true;
                return;
            }
            const cards = (0, fsrs_1.dueCards)(d.cards);
            if (!cards.length)
                return;
            const session = { id: (0, utils_1.uniqueId)(), queue: cards.map(c => c.id), cursor: 0, flipped: false, startedAt: Date.now(), finishedAt: null, ratings: [], intervalDays: [] };
            d.session = session;
            started = true;
        });
        return started;
    }, [update]);
    const flip = (0, react_1.useCallback)(() => update(d => {
        if (d.session && !d.session.finishedAt)
            d.session.flipped = true;
    }), [update]);
    const grade = (0, react_1.useCallback)(async (g) => {
        await update(d => {
            const session = d.session;
            if (!session || session.finishedAt || !session.flipped)
                return;
            const card = d.cards[session.queue[session.cursor]];
            if (!card || card.paused)
                return;
            const now = Date.now();
            const result = (0, fsrs_1.scheduleOptions)(card, d.retention, now)[g];
            d.cards[card.id] = result.card;
            d.reviews.push({ id: (0, utils_1.uniqueId)(), cardId: card.id, at: now, grade: g, previousState: card.state, nextState: result.card.state, intervalDays: result.intervalDays, elapsedDays: card.lastReview === null ? 0 : Math.max(0, (now - card.lastReview) / fsrs_1.DAY), sessionId: session.id });
            session.ratings.push(g);
            session.intervalDays.push(result.intervalDays);
            session.cursor++;
            session.flipped = false;
            if (session.cursor >= session.queue.length)
                session.finishedAt = now;
        });
    }, [update]);
    const endSession = (0, react_1.useCallback)(() => update(d => {
        if (d.session)
            d.session.finishedAt = Date.now();
    }), [update]);
    const api = { data, ready, storageError, toasts, notify, save, star, weak, setLayers, readPosition, setRetention, setReaderSize, dismissWelcome, batch, startSession, flip, grade, endSession };
    return react_1.default.createElement(StoreContext.Provider, { value: api }, children);
}
function useStore() {
    const value = (0, react_1.useContext)(StoreContext);
    if (!value)
        throw new Error('Store is not initialized');
    return value;
}
function swallow(promise) { void promise.catch(() => { }); }

},
"lib/types":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityKey = exports.STATE_LABEL = exports.TIER_LABEL = exports.TYPE_ORDER = exports.TYPE_LABEL = void 0;
exports.TYPE_LABEL = { grammar: '语法', pattern: '句型', chunk: '语块', word: '词' };
exports.TYPE_ORDER = ['grammar', 'pattern', 'chunk', 'word'];
exports.TIER_LABEL = { model: '范句', complex: '长难句', example: '例句' };
exports.STATE_LABEL = { new: '新卡', learning: '学习中', review: '复习中', relearning: '重新学习' };
const entityKey = (entity) => `${entity.kind}:${entity.id}`;
exports.entityKey = entityKey;

},
"lib/utils":function(module,exports,require){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatCount = formatCount;
exports.sourceBook = sourceBook;
exports.lessonFromSentence = lessonFromSentence;
exports.readingTime = readingTime;
exports.debounce = debounce;
exports.reducedMotion = reducedMotion;
exports.uniqueId = uniqueId;
function cn(...values) { return values.filter(Boolean).join(' '); }
function formatCount(n) { return n.toLocaleString('zh-CN'); }
function sourceBook(id) { return Number(id.match(/^b(\d)-/)?.[1] || 0); }
function lessonFromSentence(id) { return id.split('-s')[0]; }
function readingTime(words) { return Math.max(1, Math.ceil(words / 100)); }
function debounce(fn, ms) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }; }
function reducedMotion() { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
/** crypto.randomUUID is secure-context-only; local LAN previews may use HTTP. */
function uniqueId() {
    if (typeof globalThis.crypto?.randomUUID === 'function')
        return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

},
"main":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const App_1 = __importDefault(require("./App"));
require("./index.css");
class ErrorBoundary extends react_1.default.Component {
    state = { error: null };
    static getDerivedStateFromError(error) { return { error }; }
    render() { return this.state.error ? react_1.default.createElement("div", { className: "boot-screen" },
        react_1.default.createElement("h1", null, "\u8FD9\u9875\u6CA1\u6709\u987A\u5229\u6253\u5F00"),
        react_1.default.createElement("p", null, "\u5DF2\u7ECF\u4FDD\u5B58\u7684\u9605\u8BFB\u8BB0\u5F55\u4E0D\u4F1A\u53D7\u5F71\u54CD\u3002"),
        react_1.default.createElement("button", { className: "ui-button ui-button--default", onClick: () => location.reload() }, "\u91CD\u65B0\u6253\u5F00"),
        react_1.default.createElement("details", { className: "source-note" },
            react_1.default.createElement("summary", null, "\u9519\u8BEF\u4FE1\u606F"),
            react_1.default.createElement("pre", null, this.state.error.message))) : this.props.children; }
}
const root = document.getElementById('root');
if (!root)
    throw new Error('Missing root element');
(0, client_1.createRoot)(root).render(react_1.default.createElement(react_1.default.StrictMode, null,
    react_1.default.createElement(ErrorBoundary, null,
        react_1.default.createElement(App_1.default, null))));

},
"pages/Atlas":function(module,exports,require){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Atlas;
const react_1 = __importDefault(require("react"));
const data_1 = require("../lib/data");
const store_1 = require("../lib/store");
const navigation_1 = require("../lib/navigation");
const KnowledgeGraph_1 = require("../components/KnowledgeGraph");
const Details_1 = require("../components/Details");
const button_1 = require("../components/ui/button");
const Icon_1 = require("../components/Icon");
function Atlas({ id }) {
    const c = (0, data_1.useCorpus)(), s = (0, store_1.useStore)(), nav = (0, navigation_1.useNavigation)();
    const center = c.kp(id || '')?.id || c.catalog.defaultKP;
    const select = (e) => {
        if (e.kind === 'kp') {
            if (window.innerWidth < 640 && e.id === center)
                nav.openEntity(e);
            else
                nav.navigate('atlas', e.id, window.innerWidth < 640 ? { detail: '1' } : {});
        }
        else
            nav.openEntity(e);
    };
    const lesson = c.lessonSummary(s.data.reading?.lessonId || c.catalog.defaultLesson);
    return react_1.default.createElement("div", { className: "atlas-page" },
        react_1.default.createElement("div", { className: "page-heading atlas-heading" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { className: "eyebrow" },
                    react_1.default.createElement("span", { className: "tiny-star" }, "\u2727"),
                    " \u77E5\u8BC6\u661F\u56FE"),
                react_1.default.createElement("h1", null,
                    "\u8BA9\u6BCF\u4E00\u6B21\u9605\u8BFB\uFF0C",
                    react_1.default.createElement("em", null, "\u8FDE\u6210\u7406\u89E3\u3002")),
                react_1.default.createElement("p", null, "\u4ECE\u4E00\u4E2A\u77E5\u8BC6\u70B9\u51FA\u53D1\uFF0C\u53D1\u73B0\u5B83\u5728\u8BFE\u6587\u91CC\u7684\u4E0D\u540C\u7528\u6CD5\u3002")),
            react_1.default.createElement("div", { className: "atlas-total" },
                react_1.default.createElement("strong", null, c.catalog.stats.lessons),
                react_1.default.createElement("span", null, "\u7BC7\u8BFE\u6587\uFF0C\u5F7C\u6B64\u76F8\u8FDE"))),
        !s.data.welcomeDismissed && react_1.default.createElement("div", { className: "journey-guide" },
            react_1.default.createElement("div", { className: "guide-step" },
                react_1.default.createElement("span", null, "01"),
                react_1.default.createElement("p", null,
                    "\u9009\u4E00\u7BC7\u8BFE\u6587",
                    react_1.default.createElement("strong", null, "\u4ECE\u719F\u6089\u7684\u8BDD\u9898\u5F00\u59CB"))),
            react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 }),
            react_1.default.createElement("div", { className: "guide-step" },
                react_1.default.createElement("span", null, "02"),
                react_1.default.createElement("p", null,
                    "\u70B9\u5F00\u4E00\u53E5\u539F\u6587",
                    react_1.default.createElement("strong", null, "\u5728\u4E0A\u4E0B\u6587\u4E2D\u7406\u89E3"))),
            react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 }),
            react_1.default.createElement("div", { className: "guide-step" },
                react_1.default.createElement("span", null, "03"),
                react_1.default.createElement("p", null,
                    "\u7559\u4F4F\u503C\u5F97\u5B66\u7684",
                    react_1.default.createElement("strong", null, "\u4FDD\u5B58\u540E\uFF0C\u9002\u65F6\u56DE\u770B"))),
            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u6536\u8D77\u5B66\u4E60\u5F15\u5BFC", onClick: () => (0, store_1.swallow)(s.dismissWelcome()) },
                react_1.default.createElement(Icon_1.Icon, { name: "close", size: 16 }))),
        react_1.default.createElement("div", { className: "atlas-layout" },
            react_1.default.createElement("div", { className: "atlas-left" },
                react_1.default.createElement("div", { className: "map-card" },
                    react_1.default.createElement("div", { className: "map-toolbar" },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("span", { className: "status-dot" }),
                            "\u6B63\u5728\u63A2\u7D22 ",
                            react_1.default.createElement("strong", null, c.kp(center)?.name)),
                        center !== c.catalog.defaultKP && react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => nav.navigate('atlas', c.catalog.defaultKP) },
                            react_1.default.createElement(Icon_1.Icon, { name: "return", size: 15 }),
                            "\u56DE\u5230\u8D77\u70B9")),
                    react_1.default.createElement(KnowledgeGraph_1.KnowledgeGraph, { centerId: center, onSelect: select })),
                react_1.default.createElement("article", { className: "continue-card" },
                    react_1.default.createElement("div", { className: "continue-icon" },
                        react_1.default.createElement(Icon_1.Icon, { name: "book", size: 25 })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "eyebrow" }, s.data.reading ? '上次读到这里' : '从这一课开始'),
                        react_1.default.createElement("h3", null, lesson.title),
                        react_1.default.createElement("p", null,
                            react_1.default.createElement("span", { className: "mono" }, lesson.label),
                            " \u00B7 ",
                            lesson.scene)),
                    react_1.default.createElement(button_1.Button, { variant: "secondary", onClick: () => nav.openEntity({ kind: 'lesson', id: lesson.id }) },
                        s.data.reading ? '继续阅读' : '看看这一课',
                        react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 17 })))),
            react_1.default.createElement("aside", { className: "paper atlas-detail" },
                react_1.default.createElement(Details_1.EntityDetail, { entity: { kind: 'kp', id: center }, onOpen: select }))));
}

},
"pages/Cards":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardTitle = cardTitle;
exports.default = Cards;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const store_1 = require("../lib/store");
const navigation_1 = require("../lib/navigation");
const types_1 = require("../lib/types");
const fsrs_1 = require("../lib/fsrs");
const button_1 = require("../components/ui/button");
const dialog_1 = require("../components/ui/dialog");
const input_1 = require("../components/ui/input");
const Icon_1 = require("../components/Icon");
const Common_1 = require("../components/Common");
function cardTitle(card, c, sentences) { return card.entity.kind === 'kp' ? c.kp(card.entity.id)?.name || '知识点' : card.entity.kind === 'lesson' ? c.lessonSummary(card.entity.id)?.title || '课文' : sentences.get(card.entity.id) || '原文句子'; }
function Cards() {
    const c = (0, data_1.useCorpus)(), s = (0, store_1.useStore)(), nav = (0, navigation_1.useNavigation)();
    const [query, setQuery] = (0, react_1.useState)(''), [type, setType] = (0, react_1.useState)('all'), [mastery, setMastery] = (0, react_1.useState)('all'), [lessonFilter, setLessonFilter] = (0, react_1.useState)('all'), [cluster, setCluster] = (0, react_1.useState)('all'), [page, setPage] = (0, react_1.useState)(1), [selected, setSelected] = (0, react_1.useState)([]), [confirm, setConfirm] = (0, react_1.useState)(null), [settings, setSettings] = (0, react_1.useState)(false), [retention, setRetention] = (0, react_1.useState)(s.data.retention), [sentences, setSentences] = (0, react_1.useState)(new Map()), [filterOpen, setFilterOpen] = (0, react_1.useState)(false), [working, setWorking] = (0, react_1.useState)(false);
    const [now, setNow] = (0, react_1.useState)(Date.now());
    (0, react_1.useEffect)(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
    (0, react_1.useEffect)(() => {
        if (Object.values(s.data.cards).some(k => k.entity.kind === 'sentence'))
            void c.sentences().then(list => setSentences(new Map(list.map(x => [x.id, x.text])))).catch(() => { });
    }, [c, s.data.cards]);
    (0, react_1.useEffect)(() => { setPage(1); setSelected([]); }, [query, type, mastery, lessonFilter, cluster]);
    const all = Object.values(s.data.cards), due = (0, fsrs_1.dueCards)(s.data.cards, now), active = all.filter(x => !x.paused), today = (0, fsrs_1.localDay)(now), logs = s.data.reviews;
    const todayLogs = logs.filter(x => (0, fsrs_1.localDay)(x.at) === today);
    const retentionLogs = logs.filter(x => x.previousState === 'review');
    const actualRetention = retentionLogs.length ? Math.round(100 * retentionLogs.filter(x => x.grade > 1).length / retentionLogs.length) : null;
    const streak = (0, react_1.useMemo)(() => {
        const days = new Set(logs.map(x => (0, fsrs_1.localDay)(x.at)));
        let n = 0, d = new Date(now);
        if (!days.has((0, fsrs_1.localDay)(+d)))
            d.setDate(d.getDate() - 1);
        while (days.has((0, fsrs_1.localDay)(+d))) {
            n++;
            d.setDate(d.getDate() - 1);
        }
        return n;
    }, [logs, today]);
    const kindOf = (card) => card.entity.kind === 'kp' ? c.kp(card.entity.id)?.type || 'word' : card.entity.kind;
    const lessonIds = (card) => card.entity.kind === 'kp' ? c.kp(card.entity.id)?.lessonIds || [] : card.entity.kind === 'lesson' ? [card.entity.id] : [card.entity.id.split('-s')[0]];
    const list = all.filter(card => (type === 'all' || kindOf(card) === type) && (mastery === 'all' || (mastery === 'paused' ? card.paused : mastery === 'due' ? !card.paused && card.due <= now : card.state === mastery)) && (lessonFilter === 'all' || lessonIds(card).includes(lessonFilter)) && (cluster === 'all' || lessonIds(card).some(id => c.lessonSummary(id)?.clusterIds.includes(cluster))) && (!query || cardTitle(card, c, sentences).toLowerCase().includes(query.toLowerCase()) || card.entity.kind === 'kp' && c.kp(card.entity.id)?.meaning.includes(query))).sort((a, b) => a.paused === b.paused ? a.due - b.due : Number(a.paused) - Number(b.paused));
    const visible = list.slice((page - 1) * 30, page * 30);
    const selectedSet = new Set(selected);
    const sourceLessons = [...new Set(all.flatMap(lessonIds))].map(id => c.lessonSummary(id)).filter(Boolean).sort((a, b) => a.book - b.book || a.sequence - b.sequence);
    const start = async () => {
        setWorking(true);
        try {
            if (await s.startSession())
                nav.navigate('review');
            else
                s.notify('还没有到期卡片，稍后再来看看。');
        }
        finally {
            setWorking(false);
        }
    };
    const counts = ['grammar', 'pattern', 'chunk', 'word', 'sentence', 'lesson'].map(type => ({ type, count: all.filter(x => kindOf(x) === type).length }));
    const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - 6 + i); return { day: (0, fsrs_1.localDay)(+d), label: i === 6 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`, count: logs.filter(l => (0, fsrs_1.localDay)(l.at) === (0, fsrs_1.localDay)(+d)).length }; });
    return react_1.default.createElement("div", { className: "cards-page" },
        react_1.default.createElement("div", { className: "page-heading cards-heading" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { className: "eyebrow" }, "\u6211\u7684\u5361\u7247"),
                react_1.default.createElement("h1", null,
                    "\u503C\u5F97\u7559\u4E0B\u7684\uFF0C",
                    react_1.default.createElement("em", null, "\u4F1A\u518D\u6B21\u9047\u89C1\u3002")),
                react_1.default.createElement("p", null, "\u4ECE\u8BFE\u6587\u4E2D\u4FDD\u5B58\uFF0C\u5728\u9700\u8981\u7684\u65F6\u5019\u56DE\u770B\u3002")),
            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => { setRetention(s.data.retention); setSettings(true); } },
                react_1.default.createElement(Icon_1.Icon, { name: "settings", size: 17 }),
                "\u590D\u4E60\u8BBE\u7F6E")),
        react_1.default.createElement("div", { className: "review-dashboard" },
            react_1.default.createElement("div", { className: "due-panel" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { className: "eyebrow" }, "\u73B0\u5728\u53EF\u4EE5\u590D\u4E60"),
                    react_1.default.createElement("strong", null,
                        due.length,
                        react_1.default.createElement("small", null, "\u5F20\u5361\u7247")),
                    react_1.default.createElement("p", null, due.length ? '回到熟悉的语境，再记牢一点。' : all.length ? '已保存的卡片会在合适的时候再出现。' : '先从一篇课文中，留下一张卡片。')),
                react_1.default.createElement(button_1.Button, { size: "lg", disabled: working || (!due.length && (!s.data.session || !!s.data.session.finishedAt)), onClick: () => (0, store_1.swallow)(start()) },
                    s.data.session && !s.data.session.finishedAt ? '继续复习' : '开始复习',
                    react_1.default.createElement(Icon_1.Icon, { name: "arrow" }))),
            react_1.default.createElement("div", { className: "stats-grid" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", null, "\u5168\u90E8\u5361\u7247"),
                    react_1.default.createElement("strong", null, all.length),
                    react_1.default.createElement("small", null,
                        active.length,
                        " \u5F20\u6B63\u5728\u5B66\u4E60")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", null, "\u4ECA\u65E5\u56DE\u770B"),
                    react_1.default.createElement("strong", null, todayLogs.length),
                    react_1.default.createElement("small", null, "\u6B21\u771F\u5B9E\u590D\u4E60")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", null, "\u8FDE\u7EED\u5B66\u4E60"),
                    react_1.default.createElement("strong", null,
                        streak,
                        react_1.default.createElement("i", null, "\u5929")),
                    react_1.default.createElement("small", null, "\u6309\u590D\u4E60\u8BB0\u5F55\u8BA1\u7B97")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", null, "\u56DE\u5FC6\u6210\u529F\u7387"),
                    react_1.default.createElement("strong", null, actualRetention === null ? '—' : actualRetention + '%'),
                    react_1.default.createElement("small", null, actualRetention === null ? '积累复习记录后显示' : '复习期评分不含“忘记”')))),
        all.length > 0 && react_1.default.createElement("div", { className: "cards-insights" },
            react_1.default.createElement("div", { className: "week-chart" },
                react_1.default.createElement("span", { className: "eyebrow" }, "\u8FD1\u4E03\u5929\u56DE\u770B"),
                react_1.default.createElement("div", { className: "week-bars", role: "img", "aria-label": week.map(x => `${x.label}${x.count}次`).join('，') }, week.map(x => react_1.default.createElement("div", { key: x.day },
                    react_1.default.createElement("span", null, x.count || ''),
                    react_1.default.createElement("i", { style: { height: Math.max(3, 52 * x.count / Math.max(1, ...week.map(y => y.count))) } }),
                    react_1.default.createElement("small", null, x.label))))),
            react_1.default.createElement("div", { className: "card-distribution" },
                react_1.default.createElement("span", { className: "eyebrow" }, "\u7559\u4E0B\u7684\u77E5\u8BC6"),
                react_1.default.createElement("div", null, counts.filter(x => x.count > 0).map(x => react_1.default.createElement("span", { key: x.type, className: 'type-' + x.type },
                    react_1.default.createElement("i", { className: "type-dot" }),
                    x.type === 'sentence' ? '句子' : x.type === 'lesson' ? '课文' : types_1.TYPE_LABEL[x.type],
                    react_1.default.createElement("strong", null, x.count)))))),
        all.length === 0 ? react_1.default.createElement(Common_1.EmptyState, { title: "\u4F60\u7684\u7B2C\u4E00\u5F20\u5361\u7247\uFF0C\u4F1A\u4ECE\u9605\u8BFB\u4E2D\u957F\u51FA\u6765", text: "\u6253\u5F00\u4E00\u8BFE\uFF0C\u70B9\u5F00\u4E00\u4E2A\u77E5\u8BC6\u70B9\uFF0C\u8F7B\u70B9\u661F\u6807\u6216\u4FDD\u5B58\u3002", action: react_1.default.createElement(button_1.Button, { onClick: () => nav.openEntity({ kind: 'lesson', id: c.catalog.defaultLesson }) },
                "\u4ECE\u4E00\u7BC7\u8BFE\u6587\u5F00\u59CB",
                react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 17 })) }) : react_1.default.createElement("section", { className: "card-library" },
            react_1.default.createElement("div", { className: "library-toolbar" },
                react_1.default.createElement("h2", null,
                    "\u5361\u7247\u5E93 ",
                    react_1.default.createElement("span", null, all.length)),
                react_1.default.createElement("div", { className: "search-field" },
                    react_1.default.createElement(Icon_1.Icon, { name: "search", size: 17 }),
                    react_1.default.createElement(input_1.Input, { "aria-label": "\u641C\u7D22\u6211\u7684\u5361\u7247", value: query, onChange: e => setQuery(e.target.value), placeholder: "\u627E\u4E00\u5F20\u5361\u7247\u2026" })),
                react_1.default.createElement(button_1.Button, { variant: filterOpen ? 'secondary' : 'outline', onClick: () => setFilterOpen(!filterOpen), "aria-expanded": filterOpen },
                    react_1.default.createElement(Icon_1.Icon, { name: "filter", size: 17 }),
                    "\u7B5B\u9009")),
            filterOpen && react_1.default.createElement("div", { className: "card-filters" },
                react_1.default.createElement("label", null,
                    "\u7C7B\u578B",
                    react_1.default.createElement("select", { value: type, onChange: e => setType(e.target.value) },
                        react_1.default.createElement("option", { value: "all" }, "\u5168\u90E8\u7C7B\u578B"),
                        counts.map(x => react_1.default.createElement("option", { key: x.type, value: x.type }, x.type === 'sentence' ? '句子' : x.type === 'lesson' ? '课文' : types_1.TYPE_LABEL[x.type])))),
                react_1.default.createElement("label", null,
                    "\u5B66\u4E60\u72B6\u6001",
                    react_1.default.createElement("select", { value: mastery, onChange: e => setMastery(e.target.value) },
                        react_1.default.createElement("option", { value: "all" }, "\u5168\u90E8\u72B6\u6001"),
                        react_1.default.createElement("option", { value: "due" }, "\u73B0\u5728\u5230\u671F"),
                        Object.entries(types_1.STATE_LABEL).map(([k, v]) => react_1.default.createElement("option", { value: k, key: k }, v)),
                        react_1.default.createElement("option", { value: "paused" }, "\u5DF2\u6682\u505C"))),
                react_1.default.createElement("label", null,
                    "\u6765\u6E90\u8BFE\u6587",
                    react_1.default.createElement("select", { value: lessonFilter, onChange: e => setLessonFilter(e.target.value) },
                        react_1.default.createElement("option", { value: "all" }, "\u5168\u90E8\u8BFE\u6587"),
                        sourceLessons.map(l => react_1.default.createElement("option", { value: l.id, key: l.id },
                            l.label,
                            " \u00B7 ",
                            l.title)))),
                react_1.default.createElement("label", null,
                    "\u80FD\u529B\u8DEF\u5F84",
                    react_1.default.createElement("select", { value: cluster, onChange: e => setCluster(e.target.value) },
                        react_1.default.createElement("option", { value: "all" }, "\u5168\u90E8\u8DEF\u5F84"),
                        c.catalog.clusters.map(cl => react_1.default.createElement("option", { value: cl.id, key: cl.id }, cl.name))))),
            selected.length > 0 && react_1.default.createElement("div", { className: "bulk-toolbar" },
                react_1.default.createElement("span", null,
                    "\u5DF2\u9009 ",
                    selected.length,
                    " \u5F20"),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => (0, store_1.swallow)(s.batch(selected, 'pause')) },
                    react_1.default.createElement(Icon_1.Icon, { name: "pause", size: 15 }),
                    "\u6682\u505C"),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => (0, store_1.swallow)(s.batch(selected, 'resume')) },
                    react_1.default.createElement(Icon_1.Icon, { name: "play", size: 15 }),
                    "\u6062\u590D"),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setConfirm('reset') },
                    react_1.default.createElement(Icon_1.Icon, { name: "reset", size: 15 }),
                    "\u91CD\u7F6E"),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setConfirm('delete') },
                    react_1.default.createElement(Icon_1.Icon, { name: "trash", size: 15 }),
                    "\u5220\u9664"),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setSelected([]) }, "\u53D6\u6D88")),
            list.length ? react_1.default.createElement("div", { className: "saved-card-list" },
                react_1.default.createElement("div", { className: "saved-header" },
                    react_1.default.createElement("label", { className: "check-label" },
                        react_1.default.createElement("input", { "aria-label": "\u9009\u62E9\u672C\u9875\u5168\u90E8\u5361\u7247", type: "checkbox", checked: visible.length > 0 && visible.every(x => selectedSet.has(x.id)), onChange: e => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map(x => x.id)])] : selected.filter(id => !visible.some(x => x.id === id))) }),
                        "\u9009\u62E9\u672C\u9875"),
                    react_1.default.createElement("span", null,
                        list.length,
                        " \u5F20")),
                visible.map(card => react_1.default.createElement("div", { className: 'saved-card-row ' + (card.paused ? 'paused' : ''), key: card.id },
                    react_1.default.createElement("label", { className: "card-checkbox" },
                        react_1.default.createElement("input", { "aria-label": `选择卡片 ${cardTitle(card, c, sentences)}`, type: "checkbox", checked: selectedSet.has(card.id), onChange: e => setSelected(x => e.target.checked ? [...x, card.id] : x.filter(id => id !== card.id)) })),
                    react_1.default.createElement("button", { className: "saved-card-content", onClick: () => nav.openEntity(card.entity) },
                        react_1.default.createElement(Common_1.TypeBadge, { type: kindOf(card) }),
                        react_1.default.createElement("strong", null, cardTitle(card, c, sentences)),
                        react_1.default.createElement("small", null, card.entity.kind === 'kp' ? c.kp(card.entity.id)?.meaning : lessonIds(card).map(id => c.lessonSummary(id)?.label).join(' / '))),
                    react_1.default.createElement("div", { className: "card-schedule" },
                        react_1.default.createElement("span", null, card.paused ? '已暂停' : card.due <= now ? '待复习' : new Date(card.due).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })),
                        react_1.default.createElement("small", null,
                            types_1.STATE_LABEL[card.state],
                            " \u00B7 ",
                            card.reps,
                            " \u6B21")),
                    react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", "aria-label": card.paused ? '恢复这张卡片' : '暂停这张卡片', onClick: () => (0, store_1.swallow)(s.batch([card.id], card.paused ? 'resume' : 'pause')) },
                        react_1.default.createElement(Icon_1.Icon, { name: card.paused ? 'play' : 'pause', size: 17 }))))) : react_1.default.createElement(Common_1.EmptyState, { title: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u5361\u7247", action: react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => { setQuery(''); setType('all'); setMastery('all'); setLessonFilter('all'); setCluster('all'); } }, "\u6E05\u7A7A\u7B5B\u9009") }),
            react_1.default.createElement(Common_1.Pagination, { page: page, pages: Math.ceil(list.length / 30), total: list.length, onPage: setPage })),
        react_1.default.createElement(dialog_1.Dialog, { open: settings, onClose: () => setSettings(false), title: "\u627E\u5230\u8212\u670D\u7684\u590D\u4E60\u8282\u594F", description: "\u76EE\u6807\u4FDD\u7559\u7387\u8D8A\u9AD8\uFF0C\u56DE\u770B\u7684\u95F4\u9694\u8D8A\u77ED\u3002" },
            react_1.default.createElement("div", { className: "retention-setting" },
                react_1.default.createElement("span", null, "\u76EE\u6807\u4FDD\u7559\u7387"),
                react_1.default.createElement("strong", null,
                    Math.round(retention * 100),
                    react_1.default.createElement("small", null, "%")),
                react_1.default.createElement("input", { "aria-label": "\u76EE\u6807\u4FDD\u7559\u7387", type: "range", min: "75", max: "97", step: "1", value: Math.round(retention * 100), onChange: e => setRetention(Number(e.target.value) / 100) }),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", null, "\u66F4\u8F7B\u677E \u00B7 75%"),
                    react_1.default.createElement("span", null, "\u66F4\u624E\u5B9E \u00B7 97%")),
                react_1.default.createElement("p", null, "\u9ED8\u8BA4 90%\u3002\u8C03\u6574\u7528\u4E8E\u4E0B\u4E00\u6B21\u8BC4\u5206\uFF0C\u4E0D\u4F1A\u7ACB\u5373\u6539\u52A8\u5DF2\u6709\u7684\u5230\u671F\u65E5\u671F\u3002"),
                react_1.default.createElement("p", { className: "small muted" }, "\u5361\u7247\u548C\u5B66\u4E60\u8BB0\u5F55\u4FDD\u5B58\u5728\u8FD9\u4E2A\u6D4F\u89C8\u5668\u3002\u6E05\u9664\u7F51\u7AD9\u6570\u636E\u4F1A\u5220\u9664\u8BB0\u5F55\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u540C\u6B65\u5230\u5176\u4ED6\u8BBE\u5907\u3002"),
                react_1.default.createElement(button_1.Button, { className: "full", onClick: () => (0, store_1.swallow)(s.setRetention(retention).then(() => setSettings(false))) }, "\u4FDD\u5B58\u8BBE\u7F6E"))),
        react_1.default.createElement(dialog_1.Dialog, { open: !!confirm, onClose: () => setConfirm(null), title: confirm === 'delete' ? '删除选中的卡片？' : '重新开始这些卡片？', description: confirm === 'delete' ? '只删除卡片，不改动课文。已有复习记录仍保留在统计中。' : '所选卡片会回到新卡状态，原始保存时间与历史记录仍保留。' },
            react_1.default.createElement("div", { className: "dialog-actions" },
                react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => setConfirm(null) }, "\u53D6\u6D88"),
                react_1.default.createElement(button_1.Button, { variant: confirm === 'delete' ? 'destructive' : 'default', onClick: () => {
                        if (confirm)
                            (0, store_1.swallow)(s.batch(selected, confirm).then(() => { setConfirm(null); setSelected([]); }));
                    } }, confirm === 'delete' ? '确认删除' : '重置进度'))));
}

},
"pages/Connections":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Connections;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const navigation_1 = require("../lib/navigation");
const Common_1 = require("../components/Common");
const Icon_1 = require("../components/Icon");
const button_1 = require("../components/ui/button");
function Connections() { const c = (0, data_1.useCorpus)(); const { data, loading, error, retry } = (0, data_1.useAsync)(() => c.pairs(), []); const [book, setBook] = (0, react_1.useState)(0), [page, setPage] = (0, react_1.useState)(1), [cross, setCross] = (0, react_1.useState)(false); const list = (data || []).filter(p => (!book || c.lessonSummary(p.a)?.book === book || c.lessonSummary(p.b)?.book === book) && (!cross || c.lessonSummary(p.a)?.book !== c.lessonSummary(p.b)?.book)); return react_1.default.createElement("div", { className: "connections-page" },
    react_1.default.createElement("div", { className: "page-heading" },
        react_1.default.createElement("div", { className: "eyebrow" }, "\u8BFE\u6587\u5171\u70B9"),
        react_1.default.createElement("h1", null,
            "\u9694\u7740\u51E0\u9875\uFF0C",
            react_1.default.createElement("em", null, "\u539F\u6765\u662F\u540C\u4E00\u79CD\u8868\u8FBE\u3002")),
        react_1.default.createElement("p", null, "\u628A\u5171\u4EAB\u77E5\u8BC6\u7684\u4E24\u7BC7\u8BFE\u6587\u653E\u5728\u4E00\u8D77\u8BFB\uFF0C\u8BA9\u719F\u6089\u7684\u8868\u8FBE\u5728\u65B0\u8BED\u5883\u91CC\u7559\u4E0B\u6765\u3002")),
    react_1.default.createElement("div", { className: "connections-toolbar" },
        react_1.default.createElement(Common_1.BookFilter, { value: book, onChange: n => { setBook(n); setPage(1); } }),
        react_1.default.createElement("label", { className: "check-label" },
            react_1.default.createElement("input", { type: "checkbox", checked: cross, onChange: e => { setCross(e.target.checked); setPage(1); } }),
            "\u53EA\u770B\u8DE8\u518C\u5173\u8054")),
    loading ? react_1.default.createElement(Common_1.Loader, null) : error ? react_1.default.createElement(Common_1.ErrorState, { text: error, onRetry: retry }) : list.length ? react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("div", { className: "pairs-list" }, list.slice((page - 1) * 10, page * 10).map((p, i) => react_1.default.createElement(PairCard, { key: p.a + p.b, pair: p, index: (page - 1) * 10 + i }))),
        react_1.default.createElement(Common_1.Pagination, { page: page, pages: Math.ceil(list.length / 10), total: list.length, onPage: n => { setPage(n); window.scrollTo({ top: 0 }); } })) : react_1.default.createElement(Common_1.EmptyState, { title: "\u8FD9\u4E00\u7EC4\u7B5B\u9009\u8FD8\u6CA1\u6709\u5171\u70B9\u8BFE\u6587", text: "\u53D6\u6D88\u8DE8\u518C\u9650\u5236\uFF0C\u6216\u67E5\u770B\u5168\u90E8\u518C\u3002", action: react_1.default.createElement(button_1.Button, { onClick: () => { setBook(0); setCross(false); } }, "\u67E5\u770B\u5168\u90E8") })); }
function PairCard({ pair, index }) { const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)(); const [expanded, setExpanded] = (0, react_1.useState)(false); return react_1.default.createElement("article", { className: "pair-card" },
    react_1.default.createElement("div", { className: "pair-top" },
        react_1.default.createElement("span", { className: "pair-number mono" }, String(index + 1).padStart(2, '0')),
        react_1.default.createElement("div", { className: "pair-lessons" }, [pair.a, pair.b].map((id, i) => { const l = c.lessonSummary(id); return react_1.default.createElement(react_1.default.Fragment, { key: id },
            i === 1 && react_1.default.createElement("div", { className: "pair-connection" },
                react_1.default.createElement(Icon_1.Icon, { name: "link", size: 21 }),
                react_1.default.createElement("strong", null, pair.count),
                react_1.default.createElement("small", null, "\u4E2A\u5171\u70B9")),
            react_1.default.createElement("button", { className: "paired-lesson", onClick: () => nav.openEntity({ kind: 'lesson', id }) },
                react_1.default.createElement("span", { className: "mono" },
                    l.label,
                    " ",
                    react_1.default.createElement("i", null,
                        "\u00B7 ",
                        l.genre)),
                react_1.default.createElement("h3", null, l.title),
                react_1.default.createElement("p", null, l.titleZh || l.scene),
                react_1.default.createElement("span", { className: "text-action" },
                    "\u770B\u770B\u8FD9\u4E00\u8BFE",
                    react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 15 })))); }))),
    react_1.default.createElement("div", { className: "pair-pills" },
        react_1.default.createElement("span", { className: "small muted" }, "\u5171\u540C\u7528\u5230"),
        (expanded ? pair.kpIds : pair.kpIds.slice(0, 8)).map(id => c.kp(id)).filter(Boolean).map(k => react_1.default.createElement(Common_1.KPPill, { kp: k, key: k.id, compact: true, onClick: () => nav.openEntity({ kind: 'kp', id: k.id }) })),
        pair.count > 8 && react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setExpanded(!expanded) }, expanded ? '收起' : `+ ${pair.count - 8}`))); }

},
"pages/IndexPage":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = IndexPage;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const navigation_1 = require("../lib/navigation");
const types_1 = require("../lib/types");
const search_1 = require("../lib/search");
const Common_1 = require("../components/Common");
const input_1 = require("../components/ui/input");
const button_1 = require("../components/ui/button");
const Icon_1 = require("../components/Icon");
function IndexPage() {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const [type, setType] = (0, react_1.useState)('all'), [sort, setSort] = (0, react_1.useState)('degree'), [query, setQuery] = (0, react_1.useState)(''), [book, setBook] = (0, react_1.useState)(0), [page, setPage] = (0, react_1.useState)(1);
    const sentences = (0, data_1.useAsync)(() => type === 'model' || type === 'complex' || type === 'example' ? c.sentences() : Promise.resolve([]), [type]);
    (0, react_1.useEffect)(() => setPage(1), [type, sort, query, book]);
    const list = (0, react_1.useMemo)(() => {
        if (type === 'lesson')
            return c.catalog.lessons.filter(l => (!book || l.book === book) && (!query || (0, search_1.matchScore)(l.title + ' ' + l.titleZh + ' ' + l.label, l.scene, query) > 0)).map(l => ({ entity: { kind: 'lesson', id: l.id }, title: l.title, meaning: l.titleZh || l.scene, meta: l.label, number: l.sentenceCount, numberLabel: '句', kind: 'lesson' }));
        if (['model', 'complex', 'example'].includes(type))
            return (sentences.data || []).filter(s => s.tier === type && (!book || c.lessonSummary(s.lessonId)?.book === book) && (!query || (0, search_1.matchScore)(s.text, '', query) > 0)).map(s => ({ entity: { kind: 'sentence', id: s.id }, title: s.text, meaning: c.lessonSummary(s.lessonId)?.title || '', meta: c.lessonSummary(s.lessonId)?.label || '', number: s.wc, numberLabel: '词', kind: 'sentence' }));
        return c.catalog.kps.filter(k => (type === 'all' || k.type === type) && (!book || k.lessonIds.some(l => c.lessonSummary(l)?.book === book)) && (!query || (0, search_1.matchScore)(k.name, k.meaning, query) > 0)).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name, 'zh') : sort === 'lessons' ? b.lessonIds.length - a.lessonIds.length : sort === 'type' ? types_1.TYPE_ORDER.indexOf(a.type) - types_1.TYPE_ORDER.indexOf(b.type) || b.degree - a.degree : b.degree - a.degree).map(k => ({ entity: { kind: 'kp', id: k.id }, title: k.name, meaning: k.meaning, meta: k.lessonIds.length + ' 篇课文', number: k.frequency, numberLabel: '次', kind: k.type }));
    }, [c, type, sort, query, book, sentences.data]);
    const filters = [['all', '全部知识'], ...types_1.TYPE_ORDER.map(t => [t, types_1.TYPE_LABEL[t]]), ['lesson', '课文'], ['model', '范句'], ['complex', '长难句'], ['example', '例句池']];
    return react_1.default.createElement("div", { className: "index-page" },
        react_1.default.createElement("div", { className: "page-heading" },
            react_1.default.createElement("div", { className: "eyebrow" }, "\u77E5\u8BC6\u7D22\u5F15"),
            react_1.default.createElement("h1", null,
                "\u628A\u96F6\u6563\u7684\u9047\u89C1\uFF0C",
                react_1.default.createElement("em", null, "\u6162\u6162\u4E32\u8D77\u6765\u3002")),
            react_1.default.createElement("p", null, "\u67E5\u4E00\u4E2A\u8BCD\u3001\u4E00\u79CD\u8868\u8FBE\uFF0C\u6216\u8005\u627E\u5230\u503C\u5F97\u518D\u8BFB\u7684\u53E5\u5B50\u3002")),
        react_1.default.createElement("div", { className: "index-panel" },
            react_1.default.createElement("div", { className: "filter-tabs", "aria-label": "\u5185\u5BB9\u7C7B\u578B" }, filters.map(([key, label]) => react_1.default.createElement("button", { key: key, className: type === key ? 'active' : '', "aria-pressed": type === key, onClick: () => setType(key) }, label))),
            react_1.default.createElement("div", { className: "index-toolbar" },
                react_1.default.createElement("div", { className: "search-field" },
                    react_1.default.createElement(Icon_1.Icon, { name: "search", size: 18 }),
                    react_1.default.createElement(input_1.Input, { "aria-label": "\u641C\u7D22\u77E5\u8BC6\u7D22\u5F15", placeholder: "\u641C\u7D22\u540D\u79F0\u6216\u91CA\u4E49\u2026", value: query, onChange: e => setQuery(e.target.value) }),
                    query && react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u6E05\u7A7A\u641C\u7D22", onClick: () => setQuery('') },
                        react_1.default.createElement(Icon_1.Icon, { name: "close", size: 14 }))),
                react_1.default.createElement("select", { "aria-label": "\u77E5\u8BC6\u70B9\u6392\u5E8F", value: sort, disabled: type === 'lesson' || ['model', 'complex', 'example'].includes(type), onChange: e => setSort(e.target.value) },
                    react_1.default.createElement("option", { value: "degree" }, "\u6309\u5173\u8054\u5EA6"),
                    react_1.default.createElement("option", { value: "lessons" }, "\u6309\u51FA\u73B0\u8BFE\u6570"),
                    react_1.default.createElement("option", { value: "name" }, "\u6309\u540D\u79F0"),
                    react_1.default.createElement("option", { value: "type" }, "\u6309\u7C7B\u578B"))),
            react_1.default.createElement("div", { className: "index-subtoolbar" },
                react_1.default.createElement(Common_1.BookFilter, { value: book, onChange: setBook }),
                react_1.default.createElement("span", { className: "muted small" },
                    list.length.toLocaleString(),
                    " \u9879")),
            sentences.loading && ['model', 'complex', 'example'].includes(type) ? react_1.default.createElement(Common_1.Loader, null) : sentences.error ? react_1.default.createElement(Common_1.ErrorState, { text: sentences.error, onRetry: sentences.retry }) : list.length ? react_1.default.createElement("div", { className: "knowledge-table" },
                react_1.default.createElement("div", { className: "table-head" },
                    react_1.default.createElement("span", null, "\u77E5\u8BC6\u4E0E\u8868\u8FBE"),
                    react_1.default.createElement("span", null, "\u51FA\u5904"),
                    react_1.default.createElement("span", null, "\u9047\u89C1"),
                    react_1.default.createElement("span", null, "\u7559\u5B58")),
                list.slice((page - 1) * 80, page * 80).map(row => react_1.default.createElement("div", { className: "knowledge-row", key: row.entity.kind + row.entity.id },
                    react_1.default.createElement("button", { className: "knowledge-name", onClick: () => nav.openEntity(row.entity) },
                        react_1.default.createElement(Common_1.TypeBadge, { type: row.kind }),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("strong", { className: row.entity.kind === 'sentence' ? 'sentence-title' : '' }, row.title),
                            row.meaning && react_1.default.createElement("p", null, row.meaning))),
                    react_1.default.createElement("button", { className: "knowledge-source", onClick: () => nav.openEntity(row.entity) }, row.meta),
                    react_1.default.createElement("span", { className: "knowledge-count mono" },
                        row.number,
                        react_1.default.createElement("small", null, row.numberLabel)),
                    react_1.default.createElement(Common_1.EntityActions, { entity: row.entity, compact: true })))) : react_1.default.createElement(Common_1.EmptyState, { title: "\u6CA1\u6709\u627E\u5230\u76F8\u7B26\u7684\u5185\u5BB9", text: "\u8BD5\u8BD5\u66F4\u77ED\u7684\u8BCD\uFF0C\u6216\u6362\u4E00\u4E2A\u7B5B\u9009\u6761\u4EF6\u3002", action: react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => { setQuery(''); setBook(0); setType('all'); } }, "\u6E05\u7A7A\u7B5B\u9009") }),
            react_1.default.createElement(Common_1.Pagination, { page: page, pages: Math.ceil(list.length / 80), total: list.length, onPage: n => { setPage(n); window.scrollTo({ top: 0 }); } })));
}

},
"pages/Learn":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Learn;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const navigation_1 = require("../lib/navigation");
const Common_1 = require("../components/Common");
const Icon_1 = require("../components/Icon");
const button_1 = require("../components/ui/button");
function Learn({ id }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const [book, setBook] = (0, react_1.useState)(0), [page, setPage] = (0, react_1.useState)(1);
    const cluster = c.catalog.clusters.find(x => x.id === id);
    const selected = id && cluster ? cluster.id : 'all';
    (0, react_1.useEffect)(() => { setPage(1); }, [book, id]);
    const stages = ['生存', '日常', '叙事', '读写', '思辨'];
    const sorted = [...c.catalog.clusters].sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage) || b.lessonIds.length - a.lessonIds.length);
    const lessons = c.catalog.lessons.filter(l => (selected === 'all' || cluster.lessonIds.includes(l.id)) && (!book || l.book === book));
    return react_1.default.createElement("div", { className: "learn-page" },
        react_1.default.createElement("div", { className: "page-heading" },
            react_1.default.createElement("div", { className: "eyebrow" }, "\u8FDE\u5B66 \u00B7 \u9009\u62E9\u4F60\u7684\u4E0B\u4E00\u6BB5\u8DEF"),
            react_1.default.createElement("h1", null,
                "\u4E0D\u53EA\u8BFB\u61C2\uFF0C",
                react_1.default.createElement("em", null, "\u66F4\u80FD\u8868\u8FBE\u3002")),
            react_1.default.createElement("p", null, "\u9009\u4E00\u4E2A\u4F60\u60F3\u505A\u5230\u7684\u4E8B\uFF0C\u8BA9\u8BFE\u6587\u6210\u4E3A\u4E00\u6761\u6709\u65B9\u5411\u7684\u8DEF\u5F84\u3002")),
        react_1.default.createElement("div", { className: "mobile-path-picker" },
            react_1.default.createElement("label", { htmlFor: "path-select" }, "\u60F3\u7EC3\u4E60\u54EA\u4E00\u79CD\u8868\u8FBE\uFF1F"),
            react_1.default.createElement("select", { id: "path-select", value: selected, onChange: e => nav.navigate("learn", e.target.value === "all" ? undefined : e.target.value) },
                react_1.default.createElement("option", { value: "all" }, "\u5168\u90E8\u8BFE\u6587 \u00B7 288 \u7BC7"),
                stages.map(stage => react_1.default.createElement("optgroup", { label: stage, key: stage }, sorted.filter(cl => cl.stage === stage).map(cl => react_1.default.createElement("option", { value: cl.id, key: cl.id },
                    cl.name,
                    " \u00B7 ",
                    cl.lessonIds.length,
                    " \u7BC7")))))),
        react_1.default.createElement("div", { className: "learn-layout" },
            react_1.default.createElement("aside", { className: "path-sidebar" },
                react_1.default.createElement("button", { className: 'path-all ' + (selected === 'all' ? 'active' : ''), onClick: () => nav.navigate('learn') },
                    react_1.default.createElement(Icon_1.Icon, { name: "book", size: 18 }),
                    "\u5168\u90E8\u8BFE\u6587",
                    react_1.default.createElement("span", { className: "mono" }, "288")),
                stages.map(stage => react_1.default.createElement("section", { key: stage },
                    react_1.default.createElement("h4", null, stage),
                    sorted.filter(cl => cl.stage === stage).map(cl => react_1.default.createElement("button", { className: 'path-item ' + (selected === cl.id ? 'active' : ''), key: cl.id, onClick: () => nav.navigate('learn', cl.id) },
                        react_1.default.createElement("span", null, cl.name),
                        react_1.default.createElement("small", null, cl.lessonIds.length)))))),
            react_1.default.createElement("main", { className: "path-content" },
                react_1.default.createElement("div", { className: "path-intro" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("span", { className: "eyebrow" }, cluster ? cluster.stage + ' · 能力路径' : '四册 · 原文顺序'),
                        react_1.default.createElement("h2", null, cluster?.name || '从感兴趣的一课开始'),
                        react_1.default.createElement("p", null, cluster?.description || '第一册到第四册，由日常对话走向更丰富的表达。')),
                    react_1.default.createElement("span", { className: "path-count" },
                        lessons.length,
                        react_1.default.createElement("small", null, "\u7BC7\u8BFE\u6587"))),
                react_1.default.createElement(Common_1.BookFilter, { value: book, onChange: setBook }),
                lessons.length ? react_1.default.createElement("div", { className: "lesson-grid" }, lessons.slice((page - 1) * 12, page * 12).map((l, i) => react_1.default.createElement(Common_1.LessonCard, { key: l.id, lesson: l, sequence: selected === 'all' ? undefined : (page - 1) * 12 + i, onLesson: id => nav.openEntity({ kind: 'lesson', id }), onKP: id => nav.openEntity({ kind: 'kp', id }) }))) : react_1.default.createElement(Common_1.EmptyState, { title: "\u8FD9\u518C\u8FD8\u6CA1\u6709\u5BF9\u5E94\u8BFE\u6587", text: "\u6362\u4E00\u518C\uFF0C\u6216\u770B\u770B\u8FD9\u6761\u8DEF\u5F84\u7684\u5168\u90E8\u8BFE\u6587\u3002", action: react_1.default.createElement(button_1.Button, { onClick: () => setBook(0) }, "\u67E5\u770B\u5168\u90E8") }),
                react_1.default.createElement(Common_1.Pagination, { page: page, pages: Math.ceil(lessons.length / 12), total: lessons.length, onPage: n => { setPage(n); document.querySelector('.path-content')?.scrollIntoView({ block: 'start' }); } }))));
}

},
"pages/Reader":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Reader;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const store_1 = require("../lib/store");
const navigation_1 = require("../lib/navigation");
const types_1 = require("../lib/types");
const utils_1 = require("../lib/utils");
const button_1 = require("../components/ui/button");
const dialog_1 = require("../components/ui/dialog");
const Icon_1 = require("../components/Icon");
const Details_1 = require("../components/Details");
const Common_1 = require("../components/Common");
const HighlightedText_1 = require("../components/HighlightedText");
function Reader({ id, params }) {
    const c = (0, data_1.useCorpus)(), nav = (0, navigation_1.useNavigation)();
    const lid = id || c.catalog.defaultLesson;
    const exists = c.lessonSummary(lid);
    const result = (0, data_1.useAsync)(() => exists ? c.lesson(lid) : Promise.reject(new Error('没有找到这篇课文。')), [lid]);
    if (result.loading)
        return react_1.default.createElement(Common_1.Loader, { label: "\u7FFB\u5F00\u8BFE\u6587\u2026" });
    if (result.error)
        return react_1.default.createElement(Common_1.ErrorState, { text: result.error, onRetry: result.retry });
    return result.data ? react_1.default.createElement(ReadingDesk, { key: lid, lesson: result.data, sid: params.get('s') || undefined, kid: params.get('kp') || undefined, fromReview: params.get('from') === 'review' }) : null;
}
function ReadingDesk({ lesson, sid, kid, fromReview }) {
    const c = (0, data_1.useCorpus)(), s = (0, store_1.useStore)(), nav = (0, navigation_1.useNavigation)();
    const [selected, setSelected] = (0, react_1.useState)(sid || s.data.bookmarks[lesson.id] || lesson.sentences[0]?.id), [activeKP, setActiveKP] = (0, react_1.useState)(kid), [detail, setDetail] = (0, react_1.useState)(null), [sheet, setSheet] = (0, react_1.useState)(false), [capsules, setCapsules] = (0, react_1.useState)(false), [layerOpen, setLayerOpen] = (0, react_1.useState)(false), [expanded, setExpanded] = (0, react_1.useState)([]);
    const [width, setWidth] = (0, react_1.useState)(window.innerWidth);
    const scrollTimer = (0, react_1.useRef)();
    (0, react_1.useEffect)(() => { const resize = () => setWidth(window.innerWidth); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
    const locate = (0, react_1.useCallback)((sentenceId, animate = true) => { setSelected(sentenceId); const el = document.getElementById('sentence-' + sentenceId); el?.scrollIntoView({ behavior: animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto', block: 'center' }); (0, store_1.swallow)(s.readPosition(lesson.id, sentenceId)); }, [lesson.id, s.readPosition]);
    (0, react_1.useEffect)(() => {
        const first = kid ? lesson.sentences.find(x => x.hits.some(h => h[0] === kid)) : undefined;
        const target = sid || first?.id || s.data.bookmarks[lesson.id] || lesson.sentences[0]?.id;
        setActiveKP(kid);
        setDetail(null);
        if (target) {
            const shouldScroll = !!(sid || first?.id || s.data.bookmarks[lesson.id]);
            const timer = setTimeout(() => {
                if (shouldScroll)
                    locate(target, false);
                else {
                    setSelected(target);
                    window.scrollTo({ top: 0 });
                    (0, store_1.swallow)(s.readPosition(lesson.id, target));
                }
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [sid, kid, lesson.id]);
    (0, react_1.useEffect)(() => {
        const observer = new IntersectionObserver(entries => {
            const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
            if (visible[0]) {
                clearTimeout(scrollTimer.current);
                const pos = visible[0].target.dataset.sid;
                scrollTimer.current = setTimeout(() => (0, store_1.swallow)(s.readPosition(lesson.id, pos)), 700);
            }
        }, { rootMargin: '-12% 0px -58% 0px', threshold: 0 });
        document.querySelectorAll('.sentence-row').forEach(el => observer.observe(el));
        return () => { observer.disconnect(); clearTimeout(scrollTimer.current); };
    }, [lesson.id, s.readPosition]);
    const sentence = lesson.sentences.find(x => x.id === selected) || lesson.sentences[0];
    const index = c.catalog.lessons.findIndex(l => l.id === lesson.id), prev = c.catalog.lessons[index - 1], next = c.catalog.lessons[index + 1];
    const activeHits = activeKP ? lesson.sentences.filter(x => x.hits.some(h => h[0] === activeKP)) : [];
    const hitIndex = activeHits.findIndex(x => x.id === selected);
    const open = (entity) => {
        setDetail(entity);
        if (entity.kind === 'kp') {
            setActiveKP(entity.id);
            const first = lesson.sentences.find(x => x.hits.some(h => h[0] === entity.id));
            if (first)
                locate(first.id);
        }
        if (width < 1024) {
            setCapsules(false);
            setSheet(true);
        }
    };
    const chooseKP = (id) => {
        setActiveKP(id);
        const first = lesson.sentences.find(x => x.hits.some(h => h[0] === id));
        if (first)
            locate(first.id);
        setDetail({ kind: 'kp', id });
        if (width < 640)
            setCapsules(false);
    };
    const left = react_1.default.createElement("div", { className: "reader-capsules" },
        react_1.default.createElement("div", { className: "capsule-head" },
            react_1.default.createElement("span", { className: "eyebrow" }, "\u672C\u8BFE\u77E5\u8BC6"),
            react_1.default.createElement("span", { className: "mono" }, lesson.kpIds.length)),
        types_1.TYPE_ORDER.map(type => {
            const points = lesson.kpIds.map(id => c.kp(id)).filter((k) => !!k && k.type === type);
            if (!points.length)
                return null;
            return react_1.default.createElement("section", { className: "capsule-group", key: type },
                react_1.default.createElement("h4", null,
                    react_1.default.createElement("span", { className: 'type-dot type-' + type }),
                    types_1.TYPE_LABEL[type],
                    react_1.default.createElement("span", { className: "mono" }, points.length)),
                react_1.default.createElement("div", { className: "capsule-list" }, (expanded.includes(type) ? points : points.slice(0, type === 'word' ? 8 : 7)).map(k => react_1.default.createElement("div", { className: "capsule-item", key: k.id },
                    react_1.default.createElement(Common_1.KPPill, { kp: k, selected: activeKP === k.id, onClick: () => chooseKP(k.id) }),
                    react_1.default.createElement("button", { className: 'capsule-star ' + (s.data.flags['kp:' + k.id]?.star ? 'starred' : ''), "aria-label": `${s.data.flags['kp:' + k.id]?.star ? '取消重点' : '重点学'} ${k.name}`, onClick: () => (0, store_1.swallow)(s.star({ kind: 'kp', id: k.id })) },
                        react_1.default.createElement(Icon_1.Icon, { name: "star", size: 14 }))))),
                points.length > (type === 'word' ? 8 : 7) && react_1.default.createElement("button", { className: "expand-knowledge", onClick: () => setExpanded(x => x.includes(type) ? x.filter(t => t !== type) : [...x, type]) },
                    expanded.includes(type) ? '收起' : `再看 ${points.length - (type === 'word' ? 8 : 7)} 个`,
                    react_1.default.createElement(Icon_1.Icon, { name: "chevron", size: 13 })));
        }));
    const right = detail ? react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("button", { className: "back-to-sentence", onClick: () => setDetail(null) },
            react_1.default.createElement(Icon_1.Icon, { name: "back", size: 15 }),
            "\u56DE\u5230\u5F53\u524D\u53E5"),
        react_1.default.createElement(Details_1.EntityDetail, { entity: detail, onOpen: open, context: { lessonId: lesson.id, sentenceId: sentence.id } })) : react_1.default.createElement(Details_1.SentenceDetailsBody, { sentence: sentence, onOpen: open });
    const readerNav = { ...nav, read: (lid, at, kp) => {
            setSheet(false);
            setCapsules(false);
            setDetail(null);
            nav.read(lid, at, kp);
            if (lid === lesson.id) {
                setActiveKP(kp);
                if (at && lesson.sentences.some(x => x.id === at))
                    setTimeout(() => locate(at), 30);
            }
        } };
    return react_1.default.createElement(navigation_1.NavigationContext.Provider, { value: readerNav },
        react_1.default.createElement("div", { className: "reader-page" },
            react_1.default.createElement("div", { className: "reader-top" },
                react_1.default.createElement("div", { className: "reader-crumb" },
                    react_1.default.createElement("button", { "aria-label": "\u56DE\u5230\u8FDE\u5B66", onClick: () => nav.navigate('learn') },
                        react_1.default.createElement(Icon_1.Icon, { name: "back", size: 18 })),
                    react_1.default.createElement("span", { className: "mono" }, lesson.label),
                    react_1.default.createElement("span", { className: "reader-top-title" }, lesson.title)),
                react_1.default.createElement("div", { className: "reader-tools" },
                    fromReview && react_1.default.createElement(button_1.Button, { variant: "secondary", size: "sm", onClick: () => nav.navigate('review') },
                        react_1.default.createElement(Icon_1.Icon, { name: "return", size: 15 }),
                        "\u56DE\u5230\u590D\u4E60"),
                    react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u4E0A\u4E00\u7BC7\u8BFE\u6587", disabled: !prev, onClick: () => prev && nav.read(prev.id) },
                        react_1.default.createElement(Icon_1.Icon, { name: "back" })),
                    react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u4E0B\u4E00\u7BC7\u8BFE\u6587", disabled: !next, onClick: () => next && nav.read(next.id) },
                        react_1.default.createElement(Icon_1.Icon, { name: "arrow" })),
                    react_1.default.createElement("span", { className: "tool-divider" }),
                    react_1.default.createElement(button_1.Button, { variant: layerOpen ? 'secondary' : 'ghost', size: "sm", "aria-expanded": layerOpen, onClick: () => setLayerOpen(!layerOpen) },
                        react_1.default.createElement(Icon_1.Icon, { name: "layers", size: 17 }),
                        react_1.default.createElement("span", null, "\u9605\u8BFB\u5C42")))),
            layerOpen && react_1.default.createElement("div", { className: "layer-panel" },
                react_1.default.createElement("div", { className: "layer-options" }, [['pattern', '范句标记'], ['grammar', '语法'], ['chunk', '语块'], ['word', '词'], ['connective', '衔接'], ['genre', '体裁']].map(([key, label]) => react_1.default.createElement("label", { key: key, className: 'layer-switch ' + (s.data.layers[key] ? 'active' : '') },
                    react_1.default.createElement("input", { type: "checkbox", checked: s.data.layers[key], onChange: e => (0, store_1.swallow)(s.setLayers({ [key]: e.target.checked })) }),
                    react_1.default.createElement("span", null, label),
                    react_1.default.createElement(Icon_1.Icon, { name: s.data.layers[key] ? 'check' : 'plus', size: 14 })))),
                react_1.default.createElement("div", { className: "reader-size" },
                    react_1.default.createElement("span", null, "\u5B57\u53F7"),
                    react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", disabled: s.data.readerSize <= 16, "aria-label": "\u7F29\u5C0F\u9605\u8BFB\u5B57\u53F7", onClick: () => (0, store_1.swallow)(s.setReaderSize(s.data.readerSize - 1)) }, "A\u2212"),
                    react_1.default.createElement(button_1.Button, { size: "icon", variant: "ghost", disabled: s.data.readerSize >= 26, "aria-label": "\u653E\u5927\u9605\u8BFB\u5B57\u53F7", onClick: () => (0, store_1.swallow)(s.setReaderSize(s.data.readerSize + 1)) }, "A+"))),
            react_1.default.createElement("div", { className: "mobile-reading-tools" },
                react_1.default.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: () => setCapsules(true) },
                    react_1.default.createElement(Icon_1.Icon, { name: "layers", size: 16 }),
                    "\u672C\u8BFE\u77E5\u8BC6 ",
                    react_1.default.createElement("span", { className: "mono" }, lesson.kpIds.length)),
                react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => { setDetail(null); setSheet(true); } },
                    "\u5F53\u524D\u53E5",
                    react_1.default.createElement(Icon_1.Icon, { name: "chevron", size: 15 }))),
            react_1.default.createElement("div", { className: "reader-grid" },
                react_1.default.createElement("aside", { className: "reader-left" }, left),
                react_1.default.createElement("main", { className: "reading-main" },
                    react_1.default.createElement("header", { className: "reading-title" },
                        react_1.default.createElement("div", { className: "eyebrow" },
                            c.catalog.books.find(b => b.id === lesson.book)?.en,
                            " ",
                            react_1.default.createElement("span", { className: "mono" },
                                "/ ",
                                String(lesson.no).padStart(2, '0'))),
                        react_1.default.createElement("h1", { lang: lesson.book === 4 ? 'zh-CN' : 'en' }, lesson.title),
                        lesson.titleZh && react_1.default.createElement("p", { className: "reading-title-zh" }, lesson.titleZh),
                        s.data.layers.genre && react_1.default.createElement("div", { className: "genre-ribbon" },
                            react_1.default.createElement("span", null, lesson.genre),
                            react_1.default.createElement("i", null),
                            lesson.scene),
                        react_1.default.createElement("div", { className: "reading-meta" },
                            react_1.default.createElement("span", null,
                                lesson.wc,
                                " \u8BCD \u00B7 ",
                                lesson.sentences.length,
                                " \u53E5"),
                            react_1.default.createElement(Common_1.EntityActions, { entity: { kind: 'lesson', id: lesson.id }, compact: true }))),
                    activeKP && react_1.default.createElement("div", { className: "active-kp-bar" },
                        react_1.default.createElement("span", { className: 'type-dot type-' + c.kp(activeKP)?.type }),
                        react_1.default.createElement("button", { onClick: () => open({ kind: 'kp', id: activeKP }) }, c.kp(activeKP)?.name),
                        react_1.default.createElement("span", { className: "mono" },
                            activeHits.length,
                            " \u53E5"),
                        activeHits.length > 1 && react_1.default.createElement(react_1.default.Fragment, null,
                            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u4E0A\u4E00\u4E2A\u77E5\u8BC6\u70B9\u51FA\u73B0\u4F4D\u7F6E", onClick: () => locate(activeHits[(hitIndex - 1 + activeHits.length) % activeHits.length].id) },
                                react_1.default.createElement(Icon_1.Icon, { name: "back", size: 14 })),
                            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u4E0B\u4E00\u4E2A\u77E5\u8BC6\u70B9\u51FA\u73B0\u4F4D\u7F6E", onClick: () => locate(activeHits[(hitIndex + 1) % activeHits.length].id) },
                                react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 14 }))),
                        react_1.default.createElement(button_1.Button, { variant: "ghost", size: "icon", "aria-label": "\u53D6\u6D88\u77E5\u8BC6\u70B9\u5B9A\u4F4D", onClick: () => setActiveKP(undefined) },
                            react_1.default.createElement(Icon_1.Icon, { name: "close", size: 14 }))),
                    react_1.default.createElement("div", { className: "reading-text", style: { '--reading-size': s.data.readerSize + 'px' } }, lesson.sentences.map((x, i) => react_1.default.createElement("div", { key: x.id, id: 'sentence-' + x.id, "data-sid": x.id, className: (0, utils_1.cn)('sentence-row', s.data.layers.pattern && 'sentence-' + x.tier, selected === x.id && 'current', activeKP && x.hits.some(h => h[0] === activeKP) && 'kp-located'), role: "group", "aria-label": `第 ${i + 1} 句，${types_1.TIER_LABEL[x.tier]}` },
                        react_1.default.createElement("button", { className: "sentence-number mono", "aria-label": `查看第 ${i + 1} 句详情`, onClick: () => {
                                setSelected(x.id);
                                setDetail(null);
                                (0, store_1.swallow)(s.readPosition(lesson.id, x.id));
                                if (width < 1024)
                                    setSheet(true);
                            } }, String(i + 1).padStart(2, '0')),
                        react_1.default.createElement("p", { lang: "en", tabIndex: 0, role: "button", "aria-label": `阅读第 ${i + 1} 句`, onClick: () => {
                                setSelected(x.id);
                                setDetail(null);
                                (0, store_1.swallow)(s.readPosition(lesson.id, x.id));
                                if (width < 1024)
                                    setSheet(true);
                            }, onKeyDown: e => {
                                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    setSelected(x.id);
                                    setDetail(null);
                                    if (width < 1024)
                                        setSheet(true);
                                }
                            } },
                            react_1.default.createElement(HighlightedText_1.HighlightedText, { sentence: x, selectedKP: activeKP, onKP: id => {
                                    setSelected(x.id);
                                    setActiveKP(id);
                                    setDetail({ kind: 'kp', id });
                                    (0, store_1.swallow)(s.readPosition(lesson.id, x.id));
                                    if (width < 1024)
                                        setSheet(true);
                                } }))))),
                    react_1.default.createElement("div", { className: "reading-end" },
                        react_1.default.createElement("span", { className: "ornament" }, "\u2727"),
                        react_1.default.createElement("h3", null, "\u628A\u8FD9\u4E00\u8BFE\uFF0C\u7559\u5728\u81EA\u5DF1\u7684\u8282\u594F\u91CC\u3002"),
                        react_1.default.createElement("p", null, next ? '继续下一篇，或者回看刚刚留下的卡片。' : '你已经读到这份语料的最后一篇。'),
                        react_1.default.createElement("div", null,
                            next && react_1.default.createElement(button_1.Button, { onClick: () => nav.openEntity({ kind: 'lesson', id: next.id }) },
                                "\u4E0B\u4E00\u7BC7 \u00B7 ",
                                next.label,
                                react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 })),
                            react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => nav.navigate('cards') }, "\u6211\u7684\u5361\u7247"))),
                    react_1.default.createElement("details", { className: "source-note reader-source" },
                        react_1.default.createElement("summary", null, "\u539F\u6587\u4E0E\u6536\u5F55\u8BF4\u660E"),
                        react_1.default.createElement("p", null, "\u6B63\u6587\u6309\u4E0A\u4F20\u6587\u4EF6\u4FDD\u7559\uFF0C\u5386\u53F2\u89C2\u70B9\u548C\u6570\u636E\u5C5E\u4E8E\u8BFE\u6587\u8BED\u5883\uFF1B\u9605\u8BFB\u4E3B\u9898\u3001\u80FD\u529B\u8DEF\u5F84\u4E0E\u5B66\u4E60\u63D0\u793A\u7531\u672C\u9879\u76EE\u6574\u7406\u3002"),
                        lesson.quality.map((q, i) => react_1.default.createElement("p", { key: i }, q)),
                        react_1.default.createElement("p", null,
                            "\u539F\u6587\u4EF6\u6807\u9898\uFF1A",
                            lesson.sourceHeading),
                        react_1.default.createElement("p", { className: "mono" },
                            lesson.sourceFile,
                            " \u00B7 \u7B2C ",
                            lesson.sourceLine,
                            "\u2013",
                            lesson.sourceEndLine,
                            " \u884C"))),
                react_1.default.createElement("aside", { className: "reader-right paper" }, right)),
            react_1.default.createElement(dialog_1.Dialog, { open: capsules && width < 640, onClose: () => setCapsules(false), title: "\u672C\u8BFE\u77E5\u8BC6", sheet: true, className: "capsule-sheet" }, left),
            react_1.default.createElement(dialog_1.Dialog, { open: sheet && width < 1024, onClose: () => setSheet(false), title: "\u9605\u8BFB\u8BE6\u60C5", sheet: true, className: "reader-detail-sheet paper" }, right)));
}

},
"pages/Review":function(module,exports,require){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Review;
const react_1 = __importStar(require("react"));
const data_1 = require("../lib/data");
const store_1 = require("../lib/store");
const navigation_1 = require("../lib/navigation");
const fsrs_1 = require("../lib/fsrs");
const Details_1 = require("../components/Details");
const button_1 = require("../components/ui/button");
const dialog_1 = require("../components/ui/dialog");
const Icon_1 = require("../components/Icon");
const Common_1 = require("../components/Common");
const grades = [{ value: 1, label: '忘记', hint: '完全没想起来' }, { value: 2, label: '困难', hint: '想得很艰难' }, { value: 3, label: '记得', hint: '基本想起来了' }, { value: 4, label: '轻松', hint: '毫不费力' }];
function Review() {
    const c = (0, data_1.useCorpus)(), s = (0, store_1.useStore)(), nav = (0, navigation_1.useNavigation)();
    const session = s.data.session;
    const [exit, setExit] = (0, react_1.useState)(false), [working, setWorking] = (0, react_1.useState)(false);
    const card = session ? s.data.cards[session.queue[session.cursor]] : undefined;
    const flip = () => {
        if (!working)
            (0, store_1.swallow)(s.flip());
    };
    const grade = async (g) => {
        if (working)
            return;
        setWorking(true);
        try {
            await s.grade(g);
        }
        finally {
            setWorking(false);
        }
    };
    (0, react_1.useEffect)(() => {
        const key = (e) => {
            if (exit || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || (e.target?.closest('dialog[open]')))
                return;
            if (!session || session.finishedAt)
                return;
            if (e.code === 'Space' && !session.flipped) {
                e.preventDefault();
                flip();
            }
            else if (session.flipped && ['1', '2', '3', '4'].includes(e.key)) {
                e.preventDefault();
                (0, store_1.swallow)(grade(Number(e.key)));
            }
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [session, working, exit]);
    if (!session)
        return react_1.default.createElement(Common_1.EmptyState, { title: "\u7ED9\u8BB0\u5FC6\u4E00\u70B9\u65F6\u95F4", text: "\u4ECE\u5DF2\u4FDD\u5B58\u7684\u5361\u7247\u91CC\uFF0C\u5F00\u59CB\u4E00\u6B21\u56DE\u770B\u3002", action: react_1.default.createElement(button_1.Button, { onClick: () => nav.navigate('cards') }, "\u56DE\u5230\u6211\u7684\u5361\u7247") });
    if (session.finishedAt || !card) {
        const total = session.ratings.length;
        const minutes = Math.max(1, Math.round(((session.finishedAt || Date.now()) - session.startedAt) / 60000));
        const nextDue = Math.min(...Object.values(s.data.cards).filter(x => !x.paused).map(x => x.due));
        return react_1.default.createElement("div", { className: "review-summary" },
            react_1.default.createElement("div", { className: "summary-orbit" },
                react_1.default.createElement(Icon_1.Icon, { name: "check", size: 42 })),
            react_1.default.createElement("span", { className: "eyebrow" }, "\u8FD9\u4E00\u6BB5\u56DE\u770B\uFF0C\u5DF2\u7559\u4E0B"),
            react_1.default.createElement("h1", null, total ? '又熟悉了一点。' : '按自己的节奏来。'),
            react_1.default.createElement("p", null, total ? `回看 ${total} 张 · 用时约 ${minutes} 分钟` : '这次没有评分，也没有改动卡片进度。'),
            react_1.default.createElement("div", { className: "summary-grades" }, grades.map(g => react_1.default.createElement("div", { key: g.value },
                react_1.default.createElement("strong", null, session.ratings.filter(x => x === g.value).length),
                react_1.default.createElement("span", null, g.label)))),
            total > 0 && react_1.default.createElement("p", { className: "small muted" },
                "\u4E0B\u6B21\u95F4\u9694\u5408\u8BA1 ",
                session.intervalDays.reduce((a, b) => a + b, 0).toFixed(1),
                " \u5929 \u00B7 \u6700\u8FD1\u5230\u671F ",
                Number.isFinite(nextDue) ? nextDue <= Date.now() ? '现在' : (0, fsrs_1.intervalLabel)((nextDue - Date.now()) / fsrs_1.DAY) + '后' : '暂无'),
            react_1.default.createElement("div", { className: "summary-actions" },
                react_1.default.createElement(button_1.Button, { onClick: () => nav.navigate('cards') },
                    "\u56DE\u5230\u6211\u7684\u5361\u7247",
                    react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 16 })),
                react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => nav.navigate('learn') }, "\u7EE7\u7EED\u8BFB\u4E00\u7BC7")));
    }
    const options = (0, fsrs_1.scheduleOptions)(card, s.data.retention);
    return react_1.default.createElement("div", { className: "review-page" },
        react_1.default.createElement("header", { className: "review-header" },
            react_1.default.createElement(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setExit(true) },
                react_1.default.createElement(Icon_1.Icon, { name: "back", size: 17 }),
                "\u6682\u65F6\u79BB\u5F00"),
            react_1.default.createElement("div", { className: "review-progress" },
                react_1.default.createElement("span", { className: "mono" },
                    session.cursor + 1,
                    " ",
                    react_1.default.createElement("i", null,
                        "/ ",
                        session.queue.length)),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("span", { style: { width: 100 * session.cursor / session.queue.length + '%' } }))),
            react_1.default.createElement("span", { className: "review-mode" }, session.flipped ? '回到语境' : '先试着回忆')),
        react_1.default.createElement("div", { className: 'review-card paper ' + (session.flipped ? 'is-flipped' : ''), key: card.id + String(session.flipped) }, session.flipped ? react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { className: "review-card-kicker" },
                react_1.default.createElement(Icon_1.Icon, { name: "return", size: 15 }),
                react_1.default.createElement("span", null, "\u6BCF\u4E00\u5904\u51FA\u5904\uFF0C\u90FD\u80FD\u56DE\u5230\u539F\u6587")),
            react_1.default.createElement(Details_1.EntityDetail, { entity: card.entity })) : react_1.default.createElement(CardFront, { card: card })),
        react_1.default.createElement("div", { className: "review-controls" }, session.flipped ? react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("p", null, "\u521A\u624D\u56DE\u5FC6\u5F97\u600E\u4E48\u6837\uFF1F"),
            react_1.default.createElement("div", { className: "grade-buttons" }, grades.map(g => react_1.default.createElement("button", { className: 'grade-button grade-' + g.value, disabled: working, key: g.value, onClick: () => (0, store_1.swallow)(grade(g.value)) },
                react_1.default.createElement("span", null,
                    react_1.default.createElement("kbd", null, g.value),
                    g.label),
                react_1.default.createElement("small", null, (0, fsrs_1.intervalLabel)(options[g.value].intervalDays)))))) : react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(button_1.Button, { size: "lg", className: "flip-button", onClick: flip },
                "\u770B\u770B\u539F\u6765\u7684\u8BED\u5883",
                react_1.default.createElement(Icon_1.Icon, { name: "arrow", size: 18 })),
            react_1.default.createElement("p", { className: "keyboard-hint" },
                react_1.default.createElement("kbd", null, "Space"),
                " \u7FFB\u9762"))),
        react_1.default.createElement(dialog_1.Dialog, { open: exit, onClose: () => setExit(false), title: "\u6309\u81EA\u5DF1\u7684\u8282\u594F\u6765", description: "\u5DF2\u8BC4\u5206\u7684\u5361\u7247\u5DF2\u7ECF\u4FDD\u5B58\u3002\u6682\u65F6\u79BB\u5F00\u540E\uFF0C\u53EF\u4EE5\u7EE7\u7EED\u8FD9\u6B21\u4F1A\u8BDD\u3002" },
            react_1.default.createElement("div", { className: "dialog-actions" },
                react_1.default.createElement(button_1.Button, { variant: "outline", onClick: () => setExit(false) }, "\u7EE7\u7EED\u56DE\u770B"),
                react_1.default.createElement(button_1.Button, { onClick: () => nav.navigate('cards') }, "\u6682\u65F6\u79BB\u5F00")),
            react_1.default.createElement(button_1.Button, { variant: "ghost", className: "full", onClick: () => (0, store_1.swallow)(s.endSession().then(() => setExit(false))) }, "\u7ED3\u675F\u672C\u6B21\u4F1A\u8BDD")));
}
function CardFront({ card }) {
    const c = (0, data_1.useCorpus)();
    const content = (0, data_1.useAsync)(async () => {
        if (card.entity.kind === 'kp') {
            const k = c.kp(card.entity.id);
            if (!k)
                throw new Error('没有找到这张卡片的来源');
            return { title: k.name, subtitle: k.meaning, type: k.type, instruction: k.type === 'word' ? '想一想，它在原句里表达了什么。' : '回忆它的用法，试着想起一句原文。' };
        }
        if (card.entity.kind === 'lesson') {
            const l = c.lessonSummary(card.entity.id);
            return { title: l.title, subtitle: l.scene, type: 'lesson', instruction: '回想这篇课文的内容，以及其中值得留下的表达。' };
        }
        const sentence = await c.sentence(card.entity.id);
        return { title: sentence.text, subtitle: '', type: 'sentence', instruction: '试着抓住主干，回忆句中表达的含义。' };
    }, [card.id]);
    if (content.loading)
        return react_1.default.createElement(Common_1.Loader, null);
    if (content.error)
        return react_1.default.createElement(Common_1.ErrorState, { text: content.error, onRetry: content.retry });
    const item = content.data;
    return react_1.default.createElement("div", { className: "card-front" },
        react_1.default.createElement(Common_1.TypeBadge, { type: item.type }),
        react_1.default.createElement("span", { className: "card-star" }, "\u2727"),
        react_1.default.createElement("h1", { lang: item.type === 'grammar' || item.type === 'pattern' ? 'zh-CN' : 'en' }, item.title),
        item.subtitle && react_1.default.createElement("p", { className: "card-front-subtitle" }, item.subtitle),
        react_1.default.createElement("p", { className: "card-prompt" }, item.instruction));
}

}};const cache={};function resolve(base,ref){if(!ref.startsWith("."))return ref;const parts=base.split("/");parts.pop();for(const p of ref.split("/")){if(p==="."||!p)continue;if(p==="..")parts.pop();else parts.push(p);}return parts.join("/").replace(/\.tsx?$/,"");}function load(id){if(id==="react")return window.__LAMPlIT_REACT__;if(id==="react-dom/client"||id==="react-dom")return window.__LAMPlIT_REACT_DOM__;if(id.endsWith(".css"))return {};if(id==="@antv/g6")throw new Error("Optional AntV engine not included in the offline inspection build");if(cache[id])return cache[id].exports;if(!modules[id])throw new Error("Missing module "+id);const mod={exports:{}};cache[id]=mod;modules[id](mod,mod.exports,ref=>load(resolve(id,ref)));return mod.exports;}load("main");})();
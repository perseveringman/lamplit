/** Rebuild the included no-install preview from the same TSX source.
 * Requires npm dependencies only for this compilation step. Runtime has no CDN.
 * This is a local preview, NOT a substitute for `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'preview');
if(!fs.existsSync(path.join(out,'vendor.js')))throw new Error('preview/vendor.js is missing. Restore the supplied MIT-licensed cached React runtime.');
const files=[];function scan(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())scan(p);else if(/(?<!\.d)\.tsx?$/.test(f.name))files.push(p);}}scan(path.join(root,'src'));
const diagnostics=[],modules=[];
for(const file of files){const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,esModuleInterop:true,isolatedModules:true}});for(const d of result.diagnostics||[])diagnostics.push({file:path.relative(root,file),code:d.code,message:ts.flattenDiagnosticMessageText(d.messageText,' ')});modules.push(JSON.stringify(path.relative(path.join(root,'src'),file).replaceAll('\\','/').replace(/\.tsx?$/,''))+':function(module,exports,require){\n'+result.outputText+'\n}');}
if(diagnostics.length)throw new Error(JSON.stringify(diagnostics,null,2));
const loader=`(function(){const modules={${modules.join(',\n')}};const cache={};function resolve(base,ref){if(!ref.startsWith('.'))return ref;const parts=base.split('/');parts.pop();for(const p of ref.split('/')){if(p==='.'||!p)continue;if(p==='..')parts.pop();else parts.push(p);}return parts.join('/').replace(/\\.tsx?$/,'');}function load(id){if(id==='react')return window.__LAMPlIT_REACT__;if(id==='react-dom/client'||id==='react-dom')return window.__LAMPlIT_REACT_DOM__;if(id.endsWith('.css'))return {};if(id==='@antv/g6')throw new Error('AntV engine is not included in the no-install preview');if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('Missing module '+id);const mod={exports:{}};cache[id]=mod;modules[id](mod,mod.exports,ref=>load(resolve(id,ref)));return mod.exports;}load('main');})();`;
fs.writeFileSync(path.join(out,'app.js'),'/*! Local preview; not a Vite production build. See README. */\n'+loader);
const css=fs.readFileSync(path.join(root,'src/index.css'),'utf8').replace('@import "tailwindcss";','').replace(/@theme inline\s*\{[^}]+\}/,'');fs.writeFileSync(path.join(out,'styles.css'),css);
console.log(`Rebuilt ${files.length} modules. Syntax checked; full type-check still requires npm run build.`);

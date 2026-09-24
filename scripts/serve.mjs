import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.gz':'application/gzip'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url||'/',`http://${host}`);let pathname=decodeURIComponent(url.pathname);const publicFile=pathname.startsWith('/data/')||pathname==='/favicon.svg';const base=path.join(root,publicFile?'public':'preview');if(pathname==='/')pathname='/index.html';const file=path.resolve(base,'.'+pathname);if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end('Forbidden');return;}const info=await stat(file);if(!info.isFile())throw new Error('Not a file');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));}catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}});
server.on('error',error=>{console.error('无法启动预览：',error.message);process.exitCode=1;});server.listen(port,host,()=>console.log(`灯下预览已打开：http://${host}:${port}\n按 Ctrl+C 关闭。`));

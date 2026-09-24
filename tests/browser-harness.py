"""Offline UI instrumentation. Production code is unchanged.
Uses local fixture fetch + an in-memory IndexedDB-shaped adapter because this
execution environment forbids all browser URL navigation. These tests verify
React interactions, not native IndexedDB durability, Vite output or G6 engine.
"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
ADAPTER=r'''
window.fetch=async function(url){const name=String(url).replace(/^\.\/data\//,'');if(name.endsWith('.gz'))return new Response('',{status:404});try{return new Response(JSON.stringify(await window.__fixture(name)),{headers:{'Content-Type':'application/json'}});}catch{return new Response('',{status:404});}};
const databases=new Map();
Object.defineProperty(window,'indexedDB',{configurable:true,value:{open(name){const req={};setTimeout(()=>{const existed=databases.has(name);if(!existed)databases.set(name,new Map());const values=databases.get(name);const db={objectStoreNames:{contains:()=>existed},createObjectStore(){},close(){},transaction(name,mode){const tx={};let put=false;tx.objectStore=()=>({get(key){const r={};setTimeout(()=>{r.result=structuredClone(values.get(key));r.onsuccess?.();if(!put)setTimeout(()=>tx.oncomplete?.(),0);},0);return r;},put(value,key){put=true;values.set(key,structuredClone(value));setTimeout(()=>tx.oncomplete?.(),0);}});tx.abort=()=>tx.onabort?.();return tx;}};req.result=db;if(!existed)req.onupgradeneeded?.();req.onsuccess?.();},0);return req;}}});
window.BroadcastChannel=class{constructor(){}postMessage(){}close(){}};
window.__testRecords=databases;
'''
def mount(page,route='atlas/g-past'):
    page.expose_function('__fixture',lambda name:json.loads((ROOT/'public/data'/name).read_text()))
    page.set_content('<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div></body></html>')
    page.add_style_tag(content=(ROOT/'preview/styles.css').read_text())
    page.add_script_tag(content=ADAPTER)
    page.evaluate('(hash)=>location.hash=hash','#/'+route)
    page.add_script_tag(content=(ROOT/'preview/vendor.js').read_text())
    page.add_script_tag(content=(ROOT/'preview/app.js').read_text())
    page.wait_for_selector('.app-shell',timeout=20000)
    page.wait_for_timeout(400)

def navigate(page,route):
    page.evaluate('(hash)=>location.hash=hash','#/'+route)
    page.wait_for_timeout(500)

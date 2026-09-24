import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/e2e',fullyParallel:false,timeout:30_000,
 expect:{timeout:8_000},reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4174',trace:'retain-on-failure'},
 projects:[{name:'chromium',use:{...devices['Desktop Chrome'],viewport:{width:1280,height:800}}}],
 webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',url:'http://127.0.0.1:4174',reuseExistingServer:false,timeout:60_000}
});

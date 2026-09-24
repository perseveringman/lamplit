from pathlib import Path
import importlib.util,json,traceback
from playwright.sync_api import sync_playwright
spec=importlib.util.spec_from_file_location('harness',Path(__file__).with_name('browser-harness.py'));h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
ROOT=h.ROOT;checks=[];errors=[]
def record(name,ok=True):assert ok,name;checks.append(name);print('PASS',name,flush=True)
def state(p):return p.evaluate("[...window.__testRecords.values()][0].get('root')")
def no_overflow(p):return p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 p=b.new_page(viewport={'width':375,'height':667},has_touch=True,is_mobile=True,reduced_motion='reduce');p.set_default_timeout(5000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  h.mount(p);record('375px graph replaced by grouped neighbourhood',p.locator('.mobile-neighborhood').is_visible() and p.locator('.antv-mount').count()==0)
  p.get_by_role('button',name='查看用法',exact=False).click();p.wait_for_selector('dialog[open]');record('phone KP opens full detail',p.locator('dialog[open]').inner_text().find('一般过去时')>=0);p.locator('dialog[open]').get_by_role('button',name='关闭',exact=True).click()
  p.locator('.mobile-neighborhood .kp-pill').first.click();p.wait_for_selector('dialog[open]');record('phone neighbour changes focus and reveals detail','detail=1' in p.evaluate('location.hash'));p.locator('dialog[open]').get_by_role('button',name='关闭',exact=True).click()
  h.navigate(p,'learn');record('all 25 paths accessible on phone',p.locator('.mobile-path-picker option').count()==26);record('phone learn no horizontal overflow',no_overflow(p))
  h.navigate(p,'read/b2-001');p.wait_for_selector('.sentence-row');record('phone single-column reading',not p.locator('.reader-left').is_visible() and not p.locator('.reader-right').is_visible());record('phone reader no horizontal overflow',no_overflow(p));record('phone visible highlights',p.locator('.hl-grammar').count()>0 and p.locator('.hl-chunk').count()>0)
  p.screenshot(path=str(ROOT/'docs/screenshots/05-reader-phone.png'),full_page=False)
  p.get_by_role('button',name='查看第 5 句详情',exact=True).click();p.wait_for_selector('.reader-detail-sheet[open]');d=p.locator('.reader-detail-sheet[open]');record('phone sentence detail is modal, not a third column',d.is_visible());d.get_by_role('button',name='保存为知识卡片',exact=True).click();p.wait_for_timeout(150);record('phone saves current sentence',len(state(p)['cards'])==1)
  p.screenshot(path=str(ROOT/'docs/screenshots/06-sentence-phone.png'),full_page=False)
  d.get_by_role('button',name='回到这一句',exact=False).click();p.wait_for_timeout(400);record('return-to-sentence closes sheet',p.locator('dialog[open]').count()==0);record('exact sentence remains selected',p.locator('#sentence-b2-001-s005').get_attribute('class').find('current')>=0)
  p.get_by_role('button',name='本课知识',exact=False).click();p.wait_for_selector('.capsule-sheet[open]');p.locator('.capsule-sheet[open] .kp-pill').filter(has_text='一般过去时').first.click();p.wait_for_timeout(300);record('phone capsule navigation returns to text',p.locator('dialog[open]').count()==0 and p.locator('.kp-located').count()>1)
  p.set_viewport_size({'width':667,'height':375});p.wait_for_timeout(300);record('orientation change keeps card state',len(state(p)['cards'])==1);record('landscape reading no overflow',no_overflow(p))
  p.set_viewport_size({'width':375,'height':667});h.navigate(p,'cards');p.get_by_role('button',name='开始复习',exact=False).click();p.wait_for_selector('.card-front');p.get_by_role('button',name='看看原来的语境',exact=False).click();p.wait_for_selector('.grade-buttons');record('phone rating targets at least 60px',all(x['height']>=60 for x in [p.locator('.grade-button').nth(i).bounding_box() for i in range(4)]));record('phone review no horizontal overflow',no_overflow(p));p.screenshot(path=str(ROOT/'docs/screenshots/07-review-phone.png'),full_page=False)
  p.locator('.grade-button').nth(2).click();p.wait_for_selector('.review-summary');record('phone review completes',len(state(p)['reviews'])==1)
  p.set_viewport_size({'width':768,'height':1024});h.navigate(p,'read/b2-001');p.wait_for_selector('.sentence-row');record('tablet two-column reader',p.locator('.reader-left').is_visible() and not p.locator('.reader-right').is_visible());record('tablet reader no overflow',no_overflow(p));p.screenshot(path=str(ROOT/'docs/screenshots/08-reader-tablet.png'),full_page=False)
  h.navigate(p,'atlas/g-past');p.wait_for_selector('.svg-map');record('tablet graph available',p.locator('.svg-map').is_visible());before=p.locator('.svg-map > g').first.get_attribute('transform');box=p.locator('.svg-map').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp=p.context.new_cdp_session(p);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'id':0,'x':x-30,'y':y},{'id':1,'x':x+30,'y':y}]});p.wait_for_timeout(50);cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'id':0,'x':x-40,'y':y},{'id':1,'x':x+40,'y':y}]});p.wait_for_timeout(50);cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'id':0,'x':x-70,'y':y},{'id':1,'x':x+70,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(200);record('tablet SVG fallback pinch scales viewport',p.locator('.svg-map > g').first.get_attribute('transform')!=before)
  record('no mobile/tablet runtime errors',not errors)
 except Exception as e:
  errors.append('TEST: '+str(e));p.screenshot(path=str(ROOT/'docs/screenshots/test-mobile-failure.png'));traceback.print_exc()
 finally:
  report={'passed':not errors,'checks':checks,'errors':errors,'environment':'Chromium touch-emulated local DOM: fixture fetch, in-memory storage adapter, SVG graph. Not real iOS/iPadOS Safari, G6 pinch, or native IndexedDB testing.'};(ROOT/'docs/ui-mobile-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2));b.close()

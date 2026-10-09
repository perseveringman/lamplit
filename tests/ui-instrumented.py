from pathlib import Path
import importlib.util,json,traceback
from playwright.sync_api import sync_playwright
spec=importlib.util.spec_from_file_location('harness',Path(__file__).with_name('browser-harness.py'));h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
ROOT=h.ROOT;results=[];errors=[]
def record(name,ok=True):
    assert ok,name
    results.append(name);print("PASS",name,flush=True)
def state(p): return p.evaluate("[...window.__testRecords.values()][0].get('root')")
def wait(p):p.wait_for_timeout(250)
def no_overflow(p):return p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 p=b.new_page(viewport={'width':1280,'height':800},reduced_motion='reduce');p.set_default_timeout(5000);p.on('pageerror',lambda e:errors.append(str(e)))
 try:
  h.mount(p);record('desktop atlas opens at useful hub',p.locator('h2').filter(has_text='一般过去时').count()>0)
  node=p.locator('.svg-node').filter(has_text='一般现在时').first
  if not node.count():node=p.locator('.svg-node').nth(1)
  old=p.evaluate('location.hash');node.click();wait(p);record('SVG neighbour click changes focus',p.evaluate('location.hash')!=old)
  p.get_by_role('button',name='打开全局搜索',exact=True).click();p.get_by_role('combobox').fill('一般过去时');wait(p);p.get_by_role('combobox').press('Enter');wait(p);record('Chinese global search selects true KP','g-past' in p.evaluate('location.hash'))
  h.navigate(p,'read/b2-001');p.wait_for_selector('.sentence-row');record('desktop three reading columns',all(p.locator(c).is_visible() for c in ['.reader-left','.reading-main','.reader-right']))
  record('desktop no horizontal overflow',no_overflow(p));record('default grammar, chunk and pattern layers',p.locator('.hl-pattern').count()>0 and p.locator('.hl-grammar').count()>0 and p.locator('.hl-chunk').count()>0)
  p.get_by_role('button',name='查看第 6 句详情',exact=True).click();wait(p);record('sentence panel follows selection',p.locator('.reader-right').inner_text().find('They were talking loudly.')>=0)
  p.locator('.reader-right').get_by_role('button',name='重点学',exact=True).click();wait(p);record('star atomically saves sentence card',len(state(p)['cards'])==1)
  p.locator('.reader-left .kp-pill').filter(has_text='一般过去时').first.click();wait(p);record('capsule locates all actual occurrences',p.locator('.kp-located').count()>1)
  p.locator('.reader-right').get_by_role('button',name='保存为知识卡片',exact=True).click();wait(p)
  p.locator('.reader-right').get_by_role('button',name='不熟悉',exact=True).click();wait(p);record('weak flag preserved',state(p)['flags']['kp:g-past']['weak'])
  record('two source entities saved without duplicates',len(state(p)['cards'])==2)
  p.screenshot(path=str(ROOT/'docs/screenshots/02-reader-desktop.png'),full_page=False)
  h.navigate(p,'cards');p.get_by_role('button',name='开始复习',exact=False).click();p.wait_for_selector('.card-front');record('review front starts without answers',p.locator('.grade-buttons').count()==0)
  p.keyboard.press('Space');p.wait_for_selector('.grade-buttons');record('Space reveals context',state(p)['session']['flipped'])
  link=p.locator('.review-card').get_by_role('button',name='回到这一句',exact=False)
  if link.count():link.click()
  else:p.locator('.review-card').get_by_role('button',name='在课文中理解',exact=False).click()
  p.wait_for_selector('.reading-main');record('review context jump preserves return route','from=review' in p.evaluate('location.hash'))
  p.get_by_role('button',name='回到复习',exact=False).click();p.wait_for_selector('.grade-buttons');record('unfinished review resumes flipped card',state(p)['session']['flipped'])
  p.keyboard.press('3');wait(p);record('rating is committed once',len(state(p)['reviews'])==1 and state(p)['session']['cursor']==1)
  p.keyboard.press('Space');p.wait_for_selector('.grade-buttons');p.screenshot(path=str(ROOT/'docs/screenshots/03-review-desktop.png'),full_page=False);p.keyboard.press('1');p.wait_for_selector('.review-summary');record('session completes with two real ratings',len(state(p)['reviews'])==2)
  h.navigate(p,'cards');p.get_by_role('checkbox',name='选择本页全部卡片').check();p.locator('.bulk-toolbar').get_by_role('button',name='暂停',exact=True).click();wait(p);record('batch pause',all(x['paused'] for x in state(p)['cards'].values()))
  p.locator('.bulk-toolbar').get_by_role('button',name='恢复',exact=True).click();wait(p);record('batch resume',all(not x['paused'] for x in state(p)['cards'].values()))
  p.locator('.bulk-toolbar').get_by_role('button',name='重置',exact=True).click();p.locator('dialog[open]').get_by_role('button',name='重置进度').click();wait(p);record('reset keeps history and returns to new',all(x['reps']==0 for x in state(p)['cards'].values()) and len(state(p)['reviews'])==2)
  p.screenshot(path=str(ROOT/'docs/screenshots/04-cards-desktop.png'),full_page=False)
  record('no runtime errors desktop',not errors)
 except Exception as e:
  errors.append('TEST: '+str(e));p.screenshot(path=str(ROOT/'docs/screenshots/test-failure.png'));traceback.print_exc()
 finally:
  report={'passed':not errors,'checks':results,'errors':errors,'environment':'Chromium local DOM instrumentation: real React, fixture fetch, in-memory IndexedDB adapter, SVG graph fallback. Not production Vite/G6/native persistence testing.'};(ROOT/'docs/ui-desktop-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2));b.close()

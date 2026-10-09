import {test,expect} from '@playwright/test';
// These are production-dependency acceptance tests. They were supplied but not
// executed here: registry DNS and browser URL navigation are unavailable here.
test('real G6 engine renders the initial neighbourhood',async({page})=>{
 // 默认视图已从星图改为今日页，这条用例要显式进入星图
 await page.goto('/#/atlas/g-past');
 await expect(page.locator('.antv-mount')).toBeVisible();
 await expect(page.locator('.svg-map')).toHaveCount(0);
 await page.getByRole('button',{name:'放大星图',exact:true}).click();
 await page.getByRole('button',{name:'适应整个邻域',exact:true}).click();
});
test('native IndexedDB saves a star across full page reload and schedules a review',async({page})=>{
 await page.goto('/#/read/b2-001');
 await expect(page.locator('.sentence-row')).toHaveCount(17);
 await page.getByRole('button',{name:'查看第 6 句详情',exact:true}).click();
 await page.locator('.reader-right').getByRole('button',{name:'重点学',exact:true}).click();
 await expect(page.locator('.reader-right').getByRole('button',{name:'取消重点',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.reload();
 await page.getByRole('button',{name:'查看第 6 句详情',exact:true}).click();
 await expect(page.locator('.reader-right').getByRole('button',{name:'取消重点',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.goto('/#/cards');
 await expect(page.locator('.saved-card-row')).toHaveCount(1);
 await page.getByRole('button',{name:'开始复习',exact:false}).click();
 await expect(page.locator('.card-front')).toBeVisible();
 await page.keyboard.press('Space');
 await expect(page.locator('.grade-buttons')).toBeVisible();
 await page.keyboard.press('3');
 await expect(page.locator('.review-summary')).toBeVisible();
 await page.reload();
 await expect(page.locator('.review-summary')).toBeVisible();
});
test('phone: details return to the exact sentence without covering the next one',async({page})=>{
 await page.setViewportSize({width:375,height:667});
 await page.goto('/#/read/b2-001');
 await page.getByRole('button',{name:'查看第 5 句详情',exact:true}).click();
 await expect(page.locator('.reader-detail-sheet[open]')).toBeVisible();
 await page.locator('.reader-detail-sheet[open]').getByRole('button',{name:'回到这一句',exact:false}).click();
 await expect(page.locator('dialog[open]')).toHaveCount(0);
 await expect(page.locator('#sentence-b2-001-s005')).toHaveClass(/current/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 await page.goto('/#/atlas/g-past');
 await expect(page.locator('.mobile-neighborhood')).toBeVisible();
 await expect(page.locator('.antv-mount')).toHaveCount(0);
});
test('Chinese search and all ability paths are reachable',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'打开全局搜索',exact:true}).click();
 await page.getByRole('combobox').fill('一般过去时');
 await page.getByRole('combobox').press('Enter');
 await expect(page).toHaveURL(/g-past/);
 await page.setViewportSize({width:375,height:667});
 await page.goto('/#/learn');
 await expect(page.locator('.mobile-path-picker option')).toHaveCount(26);
});

from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright
BASE=Path(__file__).resolve().parents[1]
html=(BASE/'index.html').read_text()
css=(BASE/'styles.css').read_text()
js=(BASE/'app.js').read_text()
engine=(BASE/'decision-engine.js').read_text()
model=(BASE/'model.json').read_text()
html=html.replace('<link rel="stylesheet" href="styles.css">',f'<style>{css}</style>').replace('<script defer src="app.js"></script>','').replace('<script defer src="decision-engine.js"></script>','')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height,name in [(1440,900,'desktop'),(390,844,'mobile')]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.evaluate(f'window.fetch = async () => ({{ok:true,json:async () => ({model})}})')
        page.add_script_tag(content=engine)
        page.add_script_tag(content=js)
        page.evaluate('init()')
        page.wait_for_function("document.querySelector('#engine-text').textContent === 'Trained model ready'",timeout=30000)
        print(name,'mae',page.locator('#kpi-mae').inner_text(),'funding',page.locator('#kpi-funding').inner_text(),'ETA',page.locator('#eta').inner_text())
        before=page.locator('#kpi-funding').inner_text()
        page.locator('#delay').fill('90');page.locator('#delay').dispatch_event('input')
        print(name,'stressed funding',page.locator('#kpi-funding').inner_text())
        page.locator('#product').select_option('Repo')
        print(name,'repo ETA',page.locator('#eta').inner_text())
        assert page.locator('#risk-title').inner_text()!='Calculating simulated surplus…'
        page.locator('.action-choice').first.click()
        assert page.locator('#approve-action').is_enabled()
        page.locator('#approve-action').click()
        assert 'Approved in demonstration:' in page.locator('#approval-status').inner_text()
        assert page.locator('#audit-events .audit-item').count()==1
        assert page.locator('#chart-container svg path').count()==4
        page.locator('#drift').fill('150')
        page.locator('#drift').dispatch_event('input')
        assert 'Model review triggered' in page.locator('#monitor-flag').inner_text()
        print(name,'risk',page.locator('#risk-label').inner_text(),'monitor MAE',page.locator('#monitor-mae').inner_text())
        page.screenshot(path=str(BASE/f'preview-{name}.png'),full_page=True)
        print('overflow',page.evaluate('document.documentElement.scrollWidth > window.innerWidth'), 'errors',errors)
        assert not errors, errors
        assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
        page.close()
    browser.close()

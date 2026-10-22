from pathlib import Path
import json
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
for ref,filename in [('styles.css','styles.css'),('cockpit.css','cockpit.css')]:
 html=html.replace(f'<link rel="stylesheet" href="{ref}">',f'<style>{(base/filename).read_text()}</style>')
for ref in ['decision-engine.js','cockpit-engine.js','cockpit-ui.js','app.js']:
 html=html.replace(f'<script defer src="{ref}"></script>','')
model=(base/'model.json').read_text()
if True:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height,mode in [(1440,900,'desktop'),(390,844,'mobile')]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html,wait_until='domcontentloaded')
   page.evaluate(f'window.fetch = async () => ({{ok:true,json:async () => ({model})}})')
   for src in ['decision-engine.js','cockpit-engine.js','cockpit-ui.js','app.js']:
    page.add_script_tag(content=(base/src).read_text())
   page.evaluate('init()')
   page.wait_for_function("document.querySelector('#engine-text').textContent === 'Trained model ready'",timeout=30000)
   page.wait_for_function("document.querySelector('#cp-group-surplus').textContent.includes('$')",timeout=10000)
   print(mode,'group',page.locator('#cp-group-surplus').inner_text(),'entities',page.locator('.cp-entity-card').count(),'ml',page.locator('#kpi-mae').inner_text())
   assert page.locator('.cp-entity-card').count()==3
   assert page.locator('#cp-payments tr').count()==8
   assert page.locator('#cp-agents .cp-agent-event').count()==4
   assert page.locator('#cp-approve').is_enabled()
   groupBefore=page.locator('#cp-group-surplus').inner_text()
   assert page.locator('#cp-before').inner_text()==page.locator('#cp-after').inner_text(), 'transfer creates Group cash'
   page.locator('#cp-approve').click()
   assert 'Approved in simulation only' in page.locator('#cp-action-status').inner_text()
   assert page.locator('#cp-audit .cp-audit-record').count()==1
   assert page.locator('#cp-chart svg path').count()==3
   page.locator('#cp-view').select_option('international-branch')
   assert page.locator('#cp-payments tr').count()>=1
   assert page.locator('#cp-chart-subtitle').inner_text().startswith('International Branch')
   page.locator('#cp-product').select_option('Repo')
   assert page.locator('#cp-payments tr').count()>=1
   page.locator('.cp-type[data-type="repo"]').click()
   assert 'Previous demonstration approval invalidated' in page.locator('#cp-action-status').inner_text()
   assert page.locator('#cp-approve').is_enabled()
   assert 'CHECK PASSED' in page.locator('#cp-eligibility').inner_text()
   page.locator('#cp-approve').click()
   assert page.locator('#cp-chart svg path').count()==3
   page.locator('#delay').fill('120');page.locator('#delay').dispatch_event('input')
   assert page.locator('#cp-audit .cp-audit-record').count()>=3
   page.locator('#cp-amount').fill('300');page.locator('#cp-amount').dispatch_event('input')
   assert page.locator('#cp-approve').is_disabled(), 'collateral haircuts should constrain repo funding'
   assert page.locator('#cp-group-surplus').inner_text()!= '—'
   assert page.locator('#kpi-surplus').inner_text()!= '—'
   overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
   print('WIDE ELEMENTS',page.evaluate("Array.from(document.querySelectorAll('body *')).map(e=>({tag:e.tagName,id:e.id,cls:e.className?.toString().slice(0,70),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(x=>x.right>window.innerWidth+1 && x.width>0).slice(0,35)")) if overflow else None
   print(mode,'overflow',overflow,'JS errors',errors,'audit',page.locator('#cp-audit .cp-audit-record').count())
   assert not errors, errors
   assert not overflow
   # Restore showcase state: fresh simulated data after resets, then save full-page screenshot.
   page.locator('#reset').click()
   page.locator('#cp-view').select_option('all')
   page.locator('#cp-product').select_option('all')
   page.locator('.cp-type[data-type="transfer"]').click()
   page.locator('#cp-amount').fill('80');page.locator('#cp-amount').dispatch_event('input')
   page.screenshot(path=str(base/f'preview-v4-{mode}.png'),full_page=True)
   page.close()
  browser.close()

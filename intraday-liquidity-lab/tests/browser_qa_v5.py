from pathlib import Path
import json
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
for ref in ['styles.css','cockpit.css','optimiser.css']:
 html=html.replace(f'<link rel="stylesheet" href="{ref}">',f'<style>{(base/ref).read_text()}</style>')
for ref in ['decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','app.js']:
 html=html.replace(f'<script defer src="{ref}"></script>','')
model=(base/'model.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,mode in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate(f'window.fetch = async () => ({{ok:true,json:async () => ({model})}})')
  for src in ['decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','app.js']:
   page.add_script_tag(content=(base/src).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#engine-text').textContent === 'Trained model ready'",timeout=35000)
  page.wait_for_function("document.querySelector('#op-list .op-plan')",timeout=25000)
  n=page.locator('.op-plan').count()
  assert n>=2,(mode,n)
  assert page.locator('#op-approve').is_enabled(),mode
  assert 'Local floors covered' in page.locator('#op-list').inner_text()
  assert page.locator('#op-entity-effects .op-entity-effect').count()==3
  assert page.locator('#op-controls li').count()==8
  assert '30m' in page.locator('#op-rationale').inner_text()
  page.locator('#op-approve').click()
  assert 'Approved for demonstration only' in page.locator('#op-decision').inner_text()
  assert page.locator('#op-audit .op-audit-item').count()==1
  assert page.locator('#cp-chart svg path').count()==3,'third chart path shows approved optimiser plan'
  # Disable premature approval after changing the scenario and show partial coverage.
  page.locator('#delay').fill('120');page.locator('#delay').dispatch_event('input')
  assert page.locator('#op-audit .op-audit-item').count()==2
  assert 'Previous approvals cannot be reused' in page.locator('#op-decision').inner_text()
  assert 'Residual shortfall' in page.locator('#op-list').inner_text()
  # Longer planning window only permits actions settling after the as-of cut-off.
  page.locator('#op-asof').select_option('900')
  page.locator('#op-maxactions').select_option('2')
  assert page.locator('#op-list .op-plan').count()>=1
  # Demand more than two actions doesn't retroactively change executed business day.
  page.locator('#op-asof').select_option('720')
  page.locator('#delay').fill('60');page.locator('#delay').dispatch_event('input')
  page.locator('#op-list .op-plan').nth(1).click()
  assert page.locator('#op-plan-title').inner_text()
  page.locator('#op-reject').click()
  assert 'Rejected' in page.locator('#op-decision').inner_text()
  # Restore best scenario for final showcase.
  page.locator('#reset').click()
  page.locator('#op-maxactions').select_option('3')
  page.locator('#op-asof').select_option('720')
  page.locator('#optimisation-agent').screenshot(path=str(base/f'preview-v5-optimiser-{mode}.png'))
  page.screenshot(path=str(base/f'preview-v5-{mode}.png'),full_page=True)
  overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth')
  if overflow:
   print('WIDE ITEMS:',page.evaluate("Array.from(document.querySelectorAll('body *')).map(e=>({tag:e.tagName,id:e.id,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(x=>x.right>window.innerWidth+1 && x.width>0).slice(0,30)"))
  print('QA',mode,'candidate plans',n,'overflow',overflow,'JS errors',errors,'group surplus',page.locator('#cp-group-surplus').inner_text())
  assert not overflow, 'mobile page overflow'
  assert not errors, errors
  page.close()
 browser.close()
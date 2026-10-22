"""Chromium smoke regression of FLOWSTATE v9 paired stress funding plans, approvals and mobile."""
from pathlib import Path
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
styles=['styles.css','cockpit.css','optimiser.css','diagnostics.css','confidence.css','distribution.css','risk-plan.css']
scripts=['cashflow-engine.js','decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','confidence-engine.js','confidence-ui.js','distribution-engine.js','distribution-ui.js','risk-plan-engine.js','risk-plan-ui.js','app.js']
for name in styles: html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(base/name).read_text()}</style>')
for name in scripts: html=html.replace(f'<script defer src="{name}"></script>','')
model=(base/'model.json').read_text();cal=(base/'model-calibration.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,device in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate(f'''window.fetch=async url=>({{ok:true,json:async()=>url.includes('calibration')?({cal}):({model})}})''')
  for src in scripts:page.add_script_tag(content=(base/src).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#ra-before-p').textContent.includes('%')",timeout=20000)
  assert page.locator('#ra-plan-list button').count()>=2
  before=page.locator('#ra-before-p').inner_text();after=page.locator('#ra-after-p').inner_text()
  assert page.locator('#ra-entities tr').count()==3
  assert page.locator('#mc-chart svg path').count()>=4
  assert page.locator('#op-list .op-plan').count()>0
  page.locator('#ra-priority').select_option('group')
  assert page.locator('#ra-after-p').inner_text().endswith('%')
  page.locator('#ra-priority').select_option('local')
  # Select a useful plan then approve only after pressing explicit user control.
  plans=page.locator('#ra-plan-list .ra-plan')
  found=False
  for i in range(plans.count()):
   plans.nth(i).click()
   if not page.locator('#ra-approve').is_disabled():
    found=True;break
  if found:
   page.locator('#ra-approve').click()
   assert 'demo approval' in page.locator('#ra-decision').inner_text().lower()
   page.locator('#mc-shock-delay').fill('105');page.locator('#mc-shock-delay').dispatch_event('input')
   page.wait_for_function("document.querySelector('#mc-shock-delay-value').textContent==='105 min'",timeout=15000)
   page.wait_for_timeout(350)
   assert 'invalidated' in page.locator('#ra-decision').inner_text().lower()
  # Changing decision time recomputes as-of probability, and should not leave stale summary.
  page.locator('#op-asof').select_option('780')
  page.wait_for_function("document.querySelector('#ra-asof').value==='780'",timeout=15000)
  assert page.locator('#ra-plan-list button').count()>=1
  assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth+1'),f'{device} overflow'
  page.locator('#risk-aware-plans').scroll_into_view_if_needed()
  page.locator('#risk-aware-plans').screenshot(path=str(base/f'preview-v9-risk-plans-{device}.png'))
  print('v9 QA',device,'local risk before/after',before,after,'approve-enabled',found,'JS errors',errors)
  assert not errors
  page.close()
 browser.close()
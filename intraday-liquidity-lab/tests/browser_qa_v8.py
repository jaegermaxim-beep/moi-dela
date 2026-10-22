"""Chromium checks synthetic Monte Carlo controls, payment P90 coupling, entity drill down & mobile responsiveness."""
from pathlib import Path
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
styles=['styles.css','cockpit.css','optimiser.css','diagnostics.css','confidence.css','distribution.css']
scripts=['decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','confidence-engine.js','confidence-ui.js','distribution-engine.js','distribution-ui.js','app.js']
for filename in styles: html=html.replace(f'<link rel="stylesheet" href="{filename}">',f'<style>{(base/filename).read_text()}</style>')
for filename in scripts: html=html.replace(f'<script defer src="{filename}"></script>','')
model=(base/'model.json').read_text();cal=(base/'model-calibration.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,device in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate(f'''window.fetch=async url=>({{ok:true,json:async()=>url.includes('calibration')?({cal}):({model})}})''')
  for src in scripts:page.add_script_tag(content=(base/src).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#mc-stress-surplus').textContent.includes('$')",timeout=30000)
  assert page.locator('#mc-entity-body tr').count()==3
  assert page.locator('#mc-chart svg path').count()>=4
  old=page.locator('#mc-stress-surplus').inner_text()
  page.locator('#mc-haircut').fill('30');page.locator('#mc-haircut').dispatch_event('input')
  page.wait_for_function("document.querySelector('#mc-haircut-value').textContent==='30%'",timeout=15000)
  new=page.locator('#mc-stress-surplus').inner_text()
  assert float(new.replace('$','').replace('m','').replace('−','-'))<float(old.replace('$','').replace('m','').replace('−','-')),(device,'haircut did not lower surplus',old,new)
  page.locator('#mc-reset').click()
  page.wait_for_function("document.querySelector('#mc-haircut-value').textContent==='15%'",timeout=15000)
  restored=page.locator('#mc-stress-surplus').inner_text()
  assert restored==old,(device,restored,old)
  assert page.locator('#op-list .op-plan').count()>0
  page.locator('#mc-entity-body [data-target="investment-bank"]').click()
  assert page.locator('#cp-view').input_value()=='investment-bank'
  page.locator('#cp-view').select_option('all')
  page.locator('#confidence-payment').select_option(index=2)
  # Apply P90 if chosen option remains within same-day simulation horizon
  if not page.locator('#confidence-apply').is_disabled():
   page.locator('#confidence-apply').click()
   page.wait_for_timeout(350)
   assert page.locator('#mc-summary').inner_text().startswith('500 synthetic')
   page.locator('#confidence-reset').click()
   page.wait_for_timeout(350)
   assert page.locator('#mc-stress-surplus').inner_text()==old
  overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth+1')
  page.locator('#mc-distribution').scroll_into_view_if_needed()
  page.locator('#mc-distribution').screenshot(path=str(base/f'preview-v8-monte-carlo-{device}.png'))
  print('FLOWSTATE v8 QA',device,'before',old,'30% haircut',new,'restore',restored,'errors',errors,'overflow',overflow)
  assert not overflow
  assert not errors
  page.close()
 browser.close()
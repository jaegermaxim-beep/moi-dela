from pathlib import Path
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
styles=['styles.css','cockpit.css','optimiser.css','diagnostics.css','confidence.css','distribution.css','risk-plan.css','funding-lifecycle.css','executive.css']
scripts=['decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','confidence-engine.js','confidence-ui.js','distribution-engine.js','distribution-ui.js','funding-lifecycle-engine.js','funding-lifecycle-ui.js','risk-plan-engine.js','risk-plan-ui.js','app.js','executive-engine.js','executive-ui.js']
for name in styles: html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(base/name).read_text()}</style>')
for name in scripts: html=html.replace(f'<script defer src="{name}"></script>','')
model=(base/'model.json').read_text();cal=(base/'model-calibration.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,name in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate(f"""window.fetch=async url=>({{ok:true,json:async()=>url.includes('calibration')?({cal}):({model})}})""")
  for src in scripts: page.add_script_tag(content=(base/src).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#ex-surplus').textContent.includes('$')",timeout=18000)
  page.wait_for_function("document.querySelector('#ex-chart svg')!==null",timeout=12000)
  page.wait_for_function("document.querySelector('#ex-risk').textContent.includes('%')",timeout=25000)
  assert page.locator('.ex-entity-row').count()==3
  assert page.locator('.ex-alert').count()>=3
  before=page.locator('#ex-surplus').inner_text()
  page.locator('#ex-story-launch').click()
  assert not page.locator('#ex-walkthrough').is_hidden()
  assert '01 / 05' in page.locator('#ex-step-counter').inner_text()
  page.locator('#ex-next').click();assert page.locator('#ex-guide-title').inner_text()=='Forecast incoming USD settlement'
  page.locator('#ex-next').click();assert page.locator('#ex-guide-title').inner_text()=='Stress the intraday position'
  page.locator('#ex-exit').click();assert page.locator('#ex-walkthrough').is_hidden()
  page.locator('#delay').evaluate('(el)=>{el.value=60;el.dispatchEvent(new Event("input",{bubbles:true}))}')
  page.wait_for_function(f'document.querySelector("#ex-surplus").textContent!=={before!r}',timeout=12000)
  assert page.locator('#ex-surplus').inner_text()!=before
  page.locator('#ex-entity-list [data-ex-entity="investment-bank"]').click()
  assert page.locator('#cp-view').input_value()=='investment-bank'
  page.locator('#ex-launch').click();page.locator('#ex-reset').click()
  assert page.locator('#delay').input_value()=='0'
  page.locator('#ex-exit').click()
  assert not errors,errors
  overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
  assert not overflow,f'{name} horizontal page overflow: '+str(page.evaluate('[document.documentElement.scrollWidth,window.innerWidth]'))
  page.locator('#executive').screenshot(path=str(base/f'preview-v11-executive-{name}.png'))
  print('PASS v11',name,'Group surplus:',page.locator('#ex-surplus').inner_text(),'Stress breach:',page.locator('#ex-risk').inner_text(),'errors:',len(errors))
  page.close()
 browser.close()

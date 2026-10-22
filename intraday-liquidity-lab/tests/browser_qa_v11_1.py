from pathlib import Path
from playwright.sync_api import sync_playwright
import json
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
styles=['styles.css','cockpit.css','optimiser.css','diagnostics.css','confidence.css','distribution.css','risk-plan.css','funding-lifecycle.css','executive.css','client-studio.css']
scripts=['cashflow-engine.js','decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','confidence-engine.js','confidence-ui.js','distribution-engine.js','distribution-ui.js','funding-lifecycle-engine.js','funding-lifecycle-ui.js','risk-plan-engine.js','risk-plan-ui.js','app.js','executive-engine.js','executive-ui.js','client-studio-engine.js','client-studio-ui.js']
for name in styles:html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(base/name).read_text()}</style>')
for name in scripts:html=html.replace(f'<script defer src="{name}"></script>','')
data={name:json.loads((base/name).read_text()) for name in ['model.json','model-calibration.json','model/training_report.json','model/calibration_report.json','model/challenger_report.json']}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h,device in [(1440,900,'desktop'),(390,844,'mobile')]:
   page=browser.new_page(viewport={'width':w,'height':h});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html,wait_until='domcontentloaded')
   page.evaluate("""(d)=>{window.fetch=async(url)=>({ok:true,json:async()=>{let key=String(url).includes('training_report')?'model/training_report.json':String(url).includes('calibration_report')?'model/calibration_report.json':String(url).includes('challenger_report')?'model/challenger_report.json':String(url).includes('model-calibration')?'model-calibration.json':'model.json';return d[key]}})}""",data)
   for name in scripts: page.add_script_tag(content=(base/name).read_text())
   page.evaluate('init()')
   page.wait_for_function("document.querySelector('#studio-holdout')?.textContent.includes('min vs')",timeout=35000)
   page.wait_for_function("document.querySelector('#studio-before')?.textContent.includes('$')",timeout=20000)
   assert 'Group Treasury' in page.locator('#studio-entity').inner_text()
   assert '31.2 min' in page.locator('#studio-challenger').inner_text() or '31.3 min' in page.locator('#studio-challenger').inner_text()
   page.locator('[data-studio-mode="validation"]').click()
   assert 'Model Risk' in page.locator('#studio-audience-title').inner_text()
   page.locator('[data-studio-mode="treasury"]').click()
   assert page.locator('#studio-open').get_attribute('href')=='#group-cockpit'
   page.locator('[data-studio-mode="executive"]').click()
   page.locator('#studio-entity').select_option('international-branch')
   page.locator('#studio-funding').evaluate('(e)=>{e.value="50";e.dispatchEvent(new Event("input",{bubbles:true}))}')
   page.locator('#studio-tenor').select_option('overnight')
   page.locator('[data-studio-scenario="late"]').click()
   page.wait_for_timeout(500)
   assert 'cost' in page.locator('#studio-cost').inner_text()
   gap_overnight=page.locator('#studio-reserve-after').inner_text()
   page.locator('#studio-tenor').select_option('same_day')
   gap_same=page.locator('#studio-reserve-after').inner_text()
   assert gap_same != gap_overnight, (gap_same,gap_overnight)
   page.locator('[data-studio-scenario="stress"]').click()
   assert page.locator('#delay').input_value()=='120'
   page.locator('#studio-reset').click()
   assert page.locator('#delay').input_value()=='0'
   assert page.locator('.studio-architecture>div').count()==6
   assert not errors,errors
   overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth+1')
   assert not overflow,(device,page.evaluate('[document.documentElement.scrollWidth,window.innerWidth]'))
   page.locator('#client-studio').screenshot(path=str(base/f'preview-v11-1-client-studio-{device}.png'))
   print('PASS v11.1',device,'studio',gap_overnight,'→',gap_same,'browser errors',len(errors))
   page.close()
 browser.close()

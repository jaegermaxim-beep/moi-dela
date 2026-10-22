"""Offline Chromium QA for v7 including prediction confidence -> scenario -> optimisation integration."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
css=['styles.css','cockpit.css','optimiser.css','diagnostics.css','confidence.css']
js=['decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','confidence-engine.js','confidence-ui.js','app.js']
for ref in css:html=html.replace(f'<link rel="stylesheet" href="{ref}">',f'<style>{(base/ref).read_text()}</style>')
for ref in js:html=html.replace(f'<script defer src="{ref}"></script>','')
model=(base/'model.json').read_text();cal=(base/'model-calibration.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,mode in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate(f'''window.fetch = async url => ({{ok:true,json:async () => url.includes('calibration')?({cal}):({model})}})''')
  for src in js:page.add_script_tag(content=(base/src).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#engine-text').textContent === 'Trained model ready'",timeout=30000)
  page.wait_for_function("document.querySelector('#confidence-probability').textContent.includes('%')",timeout=30000)
  assert page.locator('#confidence-payment option').count()==155,(mode,'selection count')
  assert '1719' in page.locator('#confidence-calibration').inner_text().replace(',','')
  prob_before=page.locator('#confidence-probability').inner_text()
  page.locator('#confidence-cutoff').fill('17:00')
  page.locator('#confidence-cutoff').dispatch_event('change')
  prob_after=page.locator('#confidence-probability').inner_text()
  assert float(prob_after.rstrip('%'))>=float(prob_before.rstrip('%')),(mode,prob_before,prob_after)
  page.locator('#confidence-cutoff').fill('14:00');page.locator('#confidence-cutoff').dispatch_event('change')
  # Choose an early in-session P90 payment to guarantee we can apply it.
  page.evaluate('''() => { const o=[...document.querySelectorAll('#confidence-payment option')].find(o => {const label=o.textContent;return label.includes('Client payment')});if(o){document.getElementById('confidence-payment').value=o.value;document.getElementById('confidence-payment').dispatchEvent(new Event('change'))}}''')
  assert not page.locator('#confidence-apply').is_disabled(),(mode,page.locator('#confidence-scenario-note').inner_text())
  old=page.locator('#cp-group-lnncp').inner_text()
  assert page.locator('#op-list .op-plan').count()>0
  page.locator('#confidence-apply').click()
  assert page.locator('#confidence-reset').is_enabled()
  assert 'simulated' in page.locator('#op-decision').inner_text().lower() or 'scenario' in page.locator('#op-decision').inner_text().lower()
  changed=page.locator('#cp-group-lnncp').inner_text()
  page.locator('#confidence-reset').click()
  restored=page.locator('#cp-group-lnncp').inner_text()
  assert restored==old,(mode,'RF forecast was not restored',old,changed,restored)
  assert page.locator('#confidence-reset').is_disabled()
  assert page.locator('#confidence-window').inner_text().count(':')==2
  assert page.locator('#confidence-sample').inner_text().startswith(tuple(str(n) for n in range(1,10))),page.locator('#confidence-sample').inner_text()
  assert page.locator('#op-list .op-plan').count()>0
  page.locator('#confidence-cutoff').fill('13:30');page.locator('#confidence-cutoff').dispatch_event('change')
  page.locator('#settlement-confidence').screenshot(path=str(base/f'preview-v7-confidence-{mode}.png'))
  # Guard against overflowing the page (internal overflow within transaction table is intentional)
  overflow=page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
  print('BROWSER QA',mode,'probability',prob_before,'->',prob_after,'LNNCP',old,'->',changed,'->',restored,'overflow',overflow,'errors',errors)
  assert not overflow,'document has horizontal overflow'
  assert not errors,'JS page error'
  page.close()
 browser.close()
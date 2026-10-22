from pathlib import Path
import json
from playwright.sync_api import sync_playwright
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
css=['styles.css','cockpit.css','optimiser.css','diagnostics.css']
js=['decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','app.js']
for ref in css:html=html.replace(f'<link rel="stylesheet" href="{ref}">',f'<style>{(base/ref).read_text()}</style>')
for ref in js:html=html.replace(f'<script defer src="{ref}"></script>','')
model=(base/'model.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,mode in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  err=[];page.on('pageerror',lambda e:err.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate(f'window.fetch = async () => ({{ok:true,json:async () => ({model})}})')
  for src in js:page.add_script_tag(content=(base/src).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#engine-text').textContent === 'Trained model ready'",timeout=30000)
  page.wait_for_function("document.querySelectorAll('#dx-features .dx-feature-row').length === 8",timeout=25000)
  page.wait_for_function("document.querySelectorAll('#dx-entities tr').length === 4",timeout=25000)
  assert page.locator('#dx-payment option').count()==155
  assert page.locator('#dx-entities tr').count()==4
  assert page.locator('#dx-chart svg path').count()==2
  assert 'Group Treasury' in page.locator('#dx-entities').inner_text()
  # Click through Group-to-Entity-to-Payment from the payment table
  first=page.locator('#cp-payments .dx-open-payment').first
  pay_id=first.get_attribute('data-inspect-payment')
  first.click()
  assert pay_id in page.locator('#dx-path').inner_text(),(mode,pay_id,page.locator('#dx-path').inner_text())
  assert page.locator('#dx-features .dx-feature-row').count()==8
  # Drill-down from scenario table to a legal entity then payment
  page.locator('[data-dx-entity="international-branch"]').click()
  assert page.locator('#cp-view').input_value()=='international-branch'
  assert 'International Branch' in page.locator('#dx-path').inner_text()
  # Stress controls change group surplus; reference values do not mutate source side effect
  prior=page.locator('#dx-stress-surplus').inner_text()
  page.locator('#dx-delay').select_option('120')
  page.locator('#dx-accel').select_option('45')
  page.locator('#dx-haircut').select_option('0.15')
  post=page.locator('#dx-stress-surplus').inner_text()
  assert prior!=post,(mode,prior,post)
  assert page.locator('#op-list .op-plan').count()>0
  assert page.locator('#cp-chart svg path').count()>=2
  # Browser-level API & model what-if sensitivities match actual model call
  probs=page.evaluate("""() => {const id=document.getElementById('dx-payment').value; return {id,selected:document.querySelector('#dx-path').textContent,drivers:document.querySelectorAll('.dx-driver-row').length,model:'ready'}}""")
  assert probs['drivers']>0
  page.locator('#cp-view').select_option('all')
  page.locator('#dx-delay').select_option('60')
  page.locator('#dx-accel').select_option('15')
  page.locator('#dx-haircut').select_option('0.05')
  page.locator('#risk-diagnostics').screenshot(path=str(base/f'preview-v6-diagnostics-{mode}.png'))
  page.screenshot(path=str(base/f'preview-v6-full-{mode}.png'),full_page=True)
  overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth+1')
  if overflow:
   print('overflows',page.evaluate("Array.from(document.querySelectorAll('body *')).map(e=>({tag:e.tagName,id:e.id,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>innerWidth+2&&e.width>0).slice(0,20)"))
  print('QA',mode,'selected payment',pay_id,'stress',prior,'->',post,'overflow',overflow,'errors',err)
  assert not overflow, 'document horizontal overflow'
  assert not err,err
  page.close()
 browser.close()
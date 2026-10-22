from pathlib import Path
from playwright.sync_api import sync_playwright
import json,re
base=Path(__file__).resolve().parents[1]
html=(base/'index.html').read_text()
styles=re.findall(r'<link rel="stylesheet" href="([^"]+)"',html)
scripts=re.findall(r'<script defer src="([^"]+)"></script>',html)
for name in styles:html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(base/name).read_text()}</style>')
for name in scripts:html=html.replace(f'<script defer src="{name}"></script>','')
data={name:json.loads((base/name).read_text()) for name in ['model.json','model-calibration.json','model/training_report.json','model/calibration_report.json','model/challenger_report.json']}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,device in [(1440,900,'desktop'),(390,844,'mobile')]:
  page=browser.new_page(viewport={'width':width,'height':height});errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''d=>{window.fetch=async url=>({ok:true,json:async()=>d[String(url).includes('training_report')?'model/training_report.json':String(url).includes('calibration_report')?'model/calibration_report.json':String(url).includes('challenger_report')?'model/challenger_report.json':String(url).includes('model-calibration')?'model-calibration.json':'model.json']})}''',data)
  for name in scripts:page.add_script_tag(content=(base/name).read_text())
  page.evaluate('init()')
  page.wait_for_function("document.querySelector('#ex-surplus')?.textContent.includes('$')",timeout=20000)
  page.wait_for_function("document.querySelector('#op-plan-title')?.textContent.includes('Treasury') || document.querySelector('#op-plan-title')?.textContent.includes('Maintain')",timeout=20000)
  state=page.evaluate('DecisionState.snapshot()')
  if device=='desktop':page.screenshot(path=str(base/'preview-v11-2-client-desktop.png'),full_page=False)
  assert state['scenario']['paymentCount']>=200 and state['revision']>=1,state
  assert page.locator('#ds-status').inner_text()=='NO ACTIVE APPROVAL'
  # Test group action & central audit record
  page.locator('#cp-amount').fill('35')
  page.locator('#cp-approve').click()
  page.wait_for_function("DecisionState.snapshot().active?.source==='group'",timeout=2000)
  assert 'APPROVED IN DEMO' in page.locator('#ds-status').inner_text()
  # Another module's approval replaces and invalidates the group's local approval
  can=page.locator('#op-approve').is_enabled()
  if can:
   page.locator('#op-approve').click()
   page.wait_for_function("DecisionState.snapshot().active?.source==='optimiser'",timeout=3500)
   assert page.locator('#cp-action-status').inner_text().startswith('Previous approval')
  if page.locator('#fl-approve').is_enabled():
   page.locator('#fl-approve').click()
   page.wait_for_function("DecisionState.snapshot().active?.source==='funding-lifecycle'",timeout=3000)
  # All active approvals must be invalidated after changing the payment scenario
  previous=page.evaluate('DecisionState.snapshot().revision')
  page.locator('#delay').evaluate('(el)=>{el.value=75;el.dispatchEvent(new Event("input",{bubbles:true}))}')
  page.wait_for_function("DecisionState.snapshot().active===null",timeout=2000)
  assert page.evaluate('DecisionState.snapshot().revision')>previous
  assert page.evaluate("DecisionState.snapshot().audit.some(r=>r.type==='INVALIDATED')")
  # Stale manual proposal must be rejected by coordinator
  stale=page.evaluate("DecisionState.decide('group','APPROVED','not staged',DecisionState.snapshot().revision-1)")
  assert not stale['ok'],stale
  assert 'scenario' in page.locator('#ds-meta').inner_text().lower()
  assert page.evaluate("DecisionState.toCSV().includes('INVALIDATED')")
  assert not errors,errors
  overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth+1')
  assert not overflow,(device,page.evaluate('[document.documentElement.scrollWidth,window.innerWidth]'))
  page.locator('#decision-governance').screenshot(path=str(base/f'preview-v11-2-governance-{device}.png'))
  print('PASS v11.2',device,'scenario',state['scenario']['paymentCount'],'revision',page.evaluate('DecisionState.snapshot().revision'),'events',page.evaluate('DecisionState.snapshot().audit.length'),'errors',len(errors))
  page.close()
 browser.close()
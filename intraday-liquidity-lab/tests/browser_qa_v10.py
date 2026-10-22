"""FLOWSTATE v10: real HTTP, real Chromium, desktop & mobile lifecycle/funding tests."""
from pathlib import Path
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

BASE=Path(__file__).resolve().parents[1]
html=(BASE/'index.html').read_text()
styles=['styles.css','cockpit.css','optimiser.css','diagnostics.css','confidence.css','distribution.css','risk-plan.css','funding-lifecycle.css']
scripts=['cashflow-engine.js','decision-engine.js','cockpit-engine.js','cockpit-ui.js','optimiser-engine.js','optimiser-ui.js','diagnostics-engine.js','diagnostics-ui.js','confidence-engine.js','confidence-ui.js','distribution-engine.js','distribution-ui.js','funding-lifecycle-engine.js','funding-lifecycle-ui.js','risk-plan-engine.js','risk-plan-ui.js','app.js']
for name in styles: html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(BASE/name).read_text()}</style>')
for name in scripts: html=html.replace(f'<script defer src="{name}"></script>','')
model=(BASE/'model.json').read_text();cal=(BASE/'model-calibration.json').read_text()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for width,height,device in [(1440,900,'desktop'),(390,844,'mobile')]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content(html,wait_until='domcontentloaded')
   page.evaluate(f'''window.fetch=async url=>({{ok:true,json:async()=>url.includes('calibration')?({cal}):({model})}})''')
   for src in scripts:page.add_script_tag(content=(BASE/src).read_text())
   page.evaluate('init()')
   page.wait_for_function("document.querySelector('#fl-status').textContent.includes('CONTROLS PASSED')",timeout=20000)
   page.wait_for_function("document.querySelector('#ra-before-p').textContent.includes('%')",timeout=25000)
   assert page.locator('#fl-ledger tr').count()==1,'overnight repo has one settlement event'
   assert page.locator('#fl-debt').inner_text()!='$0.0m'
   page.locator('#fl-tenor').select_option('same_day')
   assert page.locator('#fl-ledger tr').count()==2,'same day has funding and repayment'
   assert page.locator('#fl-debt').inner_text()=='$0.0m','no T+1 outstanding after same-day repo'
   page.locator('#fl-second').check()
   page.locator('#fl-amount').fill('300')
   page.locator('#fl-amount2').fill('300')
   page.locator('#fl-tenor2').select_option('same_day')
   page.locator('#fl-when2').select_option('840')
   assert 'ACTION BLOCKED' in page.locator('#fl-status').inner_text(),'collateral double pledge rejected'
   page.locator('#fl-when2').select_option('900')
   assert 'CONTROLS PASSED' in page.locator('#fl-status').inner_text(),'collateral reuse after release is eligible'
   page.locator('#fl-approve').click()
   assert 'funding action' in page.locator('#fl-decision').inner_text().lower()
   page.locator('#fl-amount').fill('295')
   assert 'invalidated' in page.locator('#fl-decision').inner_text().lower()
   page.locator('#fl-second').uncheck()
   page.locator('#fl-type').select_option('central_bank')
   page.locator('#fl-amount').fill('50')
   page.locator('#fl-when').select_option('780')
   assert 'CONTROLS PASSED' in page.locator('#fl-status').inner_text(),'central-bank facility with lead time is eligible'
   page.locator('#fl-entity').select_option('international-branch')
   assert 'ACTION BLOCKED' in page.locator('#fl-status').inner_text(),'central-bank restriction matters'
   page.locator('#fl-entity').select_option('group-treasury')
   page.locator('#ra-repo-tenor').select_option('same_day')
   page.wait_for_function("document.querySelector('#ra-before-p').textContent.includes('%')",timeout=15000)
   assert page.locator('#ra-plan-list button').count()>=2
   page.locator('#ra-repo-tenor').select_option('overnight')
   page.wait_for_timeout(350)
   if device=='mobile': print('MOBILE OVERFLOW',page.evaluate('''() => ({scroll:document.documentElement.scrollWidth,window:innerWidth,top:[...document.querySelectorAll('body *')].map(e=>({tag:e.tagName,id:e.id,cl:e.className?.baseVal??e.className,r:e.getBoundingClientRect().right,w:e.getBoundingClientRect().width})).filter(x=>x.r>innerWidth+1).sort((a,b)=>b.r-a.r).slice(0,12)})'''))
   assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'),f'{device} page horizontal overflow'
   page.locator('#funding-lifecycle').screenshot(path=str(BASE/f'preview-v10-funding-lifecycle-{device}.png'))
   print('PASS v10 Chromium',device,'Funding debt',page.locator('#fl-debt').inner_text(),'risk cards',page.locator('#ra-plan-list button').count(),'page errors',len(errors))
   assert not errors,errors
   page.close()
  browser.close()
finally: pass
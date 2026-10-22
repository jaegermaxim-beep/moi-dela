"""Chromium widget QA with Python-bridged localhost API; network navigation is restricted in QA container."""
import json, os, re, subprocess, tempfile, time
from pathlib import Path
import requests
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
styles=re.findall(r'<link rel="stylesheet" href="([^"]+)"',html)
scripts=re.findall(r'<script defer src="([^"]+)"></script>',html)
for name in styles:
    html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(ROOT/name).read_text()}</style>')
for name in scripts:
    html=html.replace(f'<script defer src="{name}"></script>','')
with tempfile.TemporaryDirectory(prefix='flowstate_qa_') as d:
    env={**os.environ,'FLOWSTATE_DB':str(Path(d)/'test.sqlite')}
    proc=subprocess.Popen(['python','-m','uvicorn','enterprise.server:app','--host','127.0.0.1','--port','8768','--log-level','error'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
    try:
        for _ in range(60):
            try:
                if requests.get('http://127.0.0.1:8768/api/health',timeout=.25).ok:break
            except requests.RequestException: time.sleep(.15)
        else:raise RuntimeError('Demo API failed to start')
        def bridge(_source,request):
            url=request['url'].split('?')[0]
            if url.startswith('/api/'):
                r=requests.request(request['method'],'http://127.0.0.1:8768'+url,
                                   headers=request.get('headers') or {},data=request.get('body'),timeout=10)
                return {'ok':r.ok,'status':r.status_code,'text':r.text}
            path=ROOT/url.lstrip('/')
            if not path.is_file() or ROOT not in path.resolve().parents:
                return {'ok':False,'status':404,'text':'not found'}
            return {'ok':True,'status':200,'text':path.read_text()}
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
            for name,width,height in [('desktop',1440,900),('mobile',390,844)]:
                page=browser.new_page(viewport={'width':width,'height':height})
                errs=[]
                page.on('pageerror',lambda e:errs.append(str(e)))
                page.expose_binding('__qa_api',bridge)
                page.set_content(html,wait_until='domcontentloaded')
                page.evaluate('''() => {
                  window.__flowstate_test_local = true;
                  window.fetch = async (input, options = {}) => {
                    const response = await window.__qa_api({url:String(input),method:options.method||'GET',headers:options.headers||{},body:options.body||null});
                    return {ok:response.ok,status:response.status,text:async()=>response.text,json:async()=>JSON.parse(response.text)};
                  };
                }''')
                for file in scripts:page.add_script_tag(content=(ROOT/file).read_text())
                page.evaluate('init()')
                page.wait_for_function("document.querySelector('#ent-service')?.textContent.includes('LOCAL API CONNECTED')",timeout=15000)
                page.wait_for_function("window.DecisionState?.snapshot()?.scenario?.paymentCount>=250",timeout=20000)
                page.locator('#enterprise-readiness').scroll_into_view_if_needed()
                page.locator('#ent-capture').click()
                page.wait_for_function("document.querySelector('#ent-message')?.textContent.startsWith('Saved scenario')",timeout=12000)
                page.locator('#ent-draft').click()
                page.wait_for_function("document.querySelector('#ent-workflow')?.textContent.includes('DRAFT')",timeout=12000)
                page.locator('#ent-submit').click()
                page.wait_for_function("document.querySelector('#ent-workflow')?.textContent.includes('PENDING_RISK')",timeout=12000)
                page.locator('#ent-actor').select_option('risk_morgan')
                page.locator('#ent-risk-approve').click()
                page.wait_for_function("document.querySelector('#ent-workflow')?.textContent.includes('PENDING_TREASURY')",timeout=12000)
                page.locator('#ent-actor').select_option('treasury_chris')
                page.locator('#ent-treasury-approve').click()
                page.wait_for_function("document.querySelector('#ent-workflow')?.textContent.includes('APPROVED')",timeout=12000)
                page.locator('#ent-verify').click()
                page.wait_for_function("document.querySelector('#ent-ledger-status')?.textContent.includes('Hash chain consistent')",timeout=12000)
                assert page.locator('.ent-ledger-row').count()>=6
                page.locator('#delay').evaluate('(el)=>{el.value=75;el.dispatchEvent(new Event("input",{bubbles:true}))}')
                page.wait_for_function("document.querySelector('#ent-status-details')?.textContent.includes('LOCAL CHANGES NOT SAVED')",timeout=12000)
                assert page.locator('#ent-draft').is_disabled()
                page.locator('#ent-capture').click()
                page.wait_for_function("document.querySelector('#ent-message')?.textContent.includes('revision 2')",timeout=12000)
                assert not errs,errs
                assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1'),(name,page.evaluate('[document.documentElement.scrollWidth,window.innerWidth]'))
                page.locator('#enterprise-readiness').screenshot(path=str(ROOT/f'preview-v12-enterprise-{name}.png'))
                print('PASS v12 browser',name,'synthetic payments',page.evaluate('DecisionState.snapshot().scenario.paymentCount'),'no errors')
                page.close()
            browser.close()
        stats=requests.get('http://127.0.0.1:8768/api/overview').json()
        assert stats['scenarios']==4 and stats['approved']==0 and stats['ledger']>=20,stats
        assert requests.get('http://127.0.0.1:8768/api/ledger/verify').json()['valid']
        print('PASS SQLite persistence',stats)
    finally:
        proc.terminate()
        try:proc.wait(timeout=5)
        except subprocess.TimeoutExpired:proc.kill()
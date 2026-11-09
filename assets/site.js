// ふりがな・文字の大きさの切り替え。保存できない環境でも動くように try で包む
(function(){
  var d=document.documentElement;
  function get(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  var rb=document.getElementById('t-ruby');
  function isOn(){return !d.classList.contains('noruby')}
  function paint(){if(rb)rb.setAttribute('aria-pressed',String(isOn()))}
  if(rb){rb.addEventListener('click',function(){var on=!isOn();d.classList.toggle('noruby',!on);set('ruby',on?'1':'0');paint()})}
  paint();
  var fb=document.getElementById('t-size');var steps=['','fs-l','fs-xl'];
  if(fb){fb.addEventListener('click',function(){var cur=steps.findIndex(function(s){return s&&d.classList.contains(s)});if(cur<0)cur=0;if(steps[cur])d.classList.remove(steps[cur]);var n=(cur+1)%3;if(steps[n])d.classList.add(steps[n]);set('fs',steps[n]);fb.setAttribute('aria-pressed',String(n>0))});
    if(steps.indexOf(get('fs'))>0)fb.setAttribute('aria-pressed','true')}
  // 問題カード
  var card=document.getElementById('qcard');
  if(card){
    var TR=JSON.parse(document.getElementById('tr-data').textContent),out=document.getElementById('trText');
    var b=document.getElementById('q-ruby');
    b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));card.classList.toggle('off',!on)});
    document.getElementById('q-langs').addEventListener('click',function(e){var x=e.target.closest('button');if(!x)return;
      [].forEach.call(this.querySelectorAll('button'),function(y){y.setAttribute('aria-pressed',String(y===x))});
      out.textContent=TR[x.dataset.l];out.lang=x.dataset.l==='zh'?'zh-Hans':x.dataset.l});
  }
  // ことばの表
  var sel=document.getElementById('w-lang');
  if(sel){
    function show(l){[].forEach.call(document.querySelectorAll('[data-wl]'),function(n){n.hidden=n.dataset.wl!==l})}
    var saved=get('wlang'),nav=(navigator.language||'').slice(0,2),first=saved||(['ne','zh','vi','id','si','my'].indexOf(nav)>=0?nav:'en');
    sel.value=first;show(first);sel.addEventListener('change',function(){set('wlang',sel.value);show(sel.value)});
  }

  // 試験までの日数
  [].forEach.call(document.querySelectorAll('[data-until]'),function(n){var t=new Date(n.dataset.until+'T00:00:00+09:00')-new Date(),dd=Math.ceil(t/864e5);if(dd>0)n.textContent=n.dataset.pre+dd+n.dataset.post});
  // サイト内検索（サーバーへ送らない）
  [].forEach.call(document.querySelectorAll('.search'),function(f){
    var inp=f.querySelector('input'),box=f.querySelector('.sr'),root=f.dataset.root,idx=null;
    function esc(s){return s.replace(/[&<]/g,function(c){return c==='&'?'&amp;':'&lt;'})}
    function run(){var q=inp.value.trim().toLowerCase();if(!q){box.hidden=true;return}
      var r=idx.map(function(p){var i=(p.t+' '+p.h).toLowerCase().indexOf(q)>=0?2:((p.d+' '+p.b).toLowerCase().indexOf(q)>=0?1:0);return [i,p]}).filter(function(x){return x[0]}).sort(function(a,b){return b[0]-a[0]}).slice(0,8);
      box.innerHTML=r.length?r.map(function(x){return '<a href="'+root+x[1].u+'"><b>'+esc(x[1].t)+'</b><span>'+esc(x[1].d.slice(0,48))+'…</span></a>'}).join(''):'<p>'+f.dataset.none+'</p>';box.hidden=false}
    function load(cb){if(idx)return cb();fetch(root+'assets/search.json').then(function(r){return r.json()}).then(function(j){idx=j;cb()}).catch(function(){box.innerHTML='<p>'+f.dataset.none+'</p>';box.hidden=false})}
    inp.addEventListener('input',function(){load(run)});
    f.addEventListener('submit',function(e){e.preventDefault();load(run)});
    document.addEventListener('click',function(e){if(!f.contains(e.target))box.hidden=true});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')box.hidden=true});
  });
})();

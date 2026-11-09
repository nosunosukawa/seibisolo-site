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
})();

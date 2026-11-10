// サイトを組み立てる: node _src/build.mjs
// _src/pages の本文に共通の枠を付け、日本語の本文に <ruby> を付けて、ルート以下へ書き出す
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import kuromoji from 'kuromoji';
const SRC=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.dirname(SRC),BASE='https://nosunosukawa.github.io/seibisolo-site/';
const STORE='https://apps.apple.com/app/apple-store/id6827350748?pt=129256714&ct=lp&mt=8';
const LANGS=[['ja','日本語','./'],['en','English','en.html'],['ne','नेपाली','lang/ne.html'],['zh-Hans','中文','lang/zh.html'],['vi','Tiếng Việt','lang/vi.html'],['id','Bahasa Indonesia','lang/id.html'],['si','සිංහල','lang/si.html'],['my','မြန်မာ','lang/my.html']];
const SECTIONS=[{title:'試験を知る',items:[['試験を知る','exam/'],['総合への変更','sogo.html'],['2級の学科試験','exam/k2.html'],['3級の学科試験','exam/k3.html'],['1級の学科試験','exam/k1.html'],['母語が日本語でない人の勉強','exam/foreign.html'],['問題文によく出ることば','exam/words.html']]},{title:'アプリを知る',items:[['できること・できないこと','app/'],['収録している問題','app/contents.html'],['無料の範囲と料金','app/price.html'],['使い方','app/guide.html'],['実際の画面','screens.html']]},{title:'学校の先生へ',items:[['先生へのご案内','school/'],['印刷できる1枚','school/flyer.html']]},{title:'作り方と誤り',items:[['作っている人','about/'],['作り方の決まり','about/editorial.html'],['誤りの報告と訂正','about/errata.html'],['変更の記録','about/changelog.html'],['読みやすさの方針','about/accessibility.html']]},{title:'困ったとき',items:[['サポート','support.html'],['プライバシー','privacy.html']]}];
const NAV=[['試験','exam/'],['アプリ','app/'],['先生へ','school/'],['作り方','about/'],['困ったとき','support.html']];
const tok=await new Promise((ok,ng)=>kuromoji.builder({dicPath:path.join(SRC,'node_modules/kuromoji/dict')}).build((e,t)=>e?ng(e):ok(t)));
const FIX=JSON.parse(fs.readFileSync(path.join(SRC,'data/ruby-fix.json'),'utf8'));
const FIXK=Object.keys(FIX).sort((a,b)=>b.length-a.length);
const KANJI=/[\u4E00-\u9FFF々]/,audit=new Map();
const hira=s=>s.replace(/[\u30A1-\u30F6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const rb=(k,r)=>`<ruby>${k}<rp>(</rp><rt>${r}</rt><rp>)</rp></ruby>`;
function align(surface,reading){ // 読み方→読(よ)み方(かた) のように送り仮名を分ける
  const parts=surface.split(/([^\u4E00-\u9FFF々]+)/).filter(Boolean);
  if(parts.length===1)return rb(surface,reading);
  const re=new RegExp('^'+parts.map(p=>KANJI.test(p)?'(.+?)':p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/[\u30A1-\u30F6]/g,c=>hira(c))).join('')+'$');
  const m=reading.match(re);
  if(!m)return rb(surface,reading);
  let i=1;return parts.map(p=>KANJI.test(p)?rb(p,m[i++]):p).join('');
}
function rubyText(t){
  // 数のあとの助数詞と、決まった語を先に引く
  let out='',rest=t;
  const seg=[];let pos=0;
  while(pos<rest.length){
    let hit=null;for(const k of FIXK){if(rest.startsWith(k,pos)){hit=k;break}}
    if(hit){seg.push([hit,FIX[hit]]);pos+=hit.length;continue}
    let e=pos+1;while(e<rest.length&&!FIXK.some(k=>rest.startsWith(k,e)))e++;
    seg.push([rest.slice(pos,e),null]);pos=e;
  }
  for(const [s,r] of seg){
    if(r){audit.set(s,r);out+=align(s,r);continue}
    if(!KANJI.test(s)){out+=s;continue}
    const ts=tok.tokenize(s);
    ts.forEach((w,i)=>{
      const f=w.surface_form;
      if(!KANJI.test(f)){out+=f;return}
      if(!w.reading||w.reading==='*'){out+=f;audit.set(f,'(読めず)');return}
      let rd=hira(w.reading);
      const prev=i>0?ts[i-1].surface_form:'';
      if(/[0-9０-９〜]$/.test(prev)||/[一二三四五六七八九十百千]$/.test(prev)){
        const c={'分':'ふん','月':'がつ','日':'にち','年':'ねん','回':'かい','問':'もん','時':'じ','級':'きゅう','人':'にん','語':'ご','円':'えん','本':'ほん','枚':'まい','歳':'さい','か':'か'}[f];if(c)rd=c}
      audit.set(f+'|'+rd,(audit.get(f+'|'+rd)||[]).concat(s.slice(0,40)).slice(0,3));out+=align(f,rd);
    });
  }
  return out;
}
function addRuby(html){ // タグと、ふりがなを付けない所を避けて、文字にだけ付ける
  const parts=html.split(/(<[^>]+>)/);const stack=[];let out='';
  const VOID=['img','br','hr','meta','link','input'];
  for(const p of parts){
    if(p.startsWith('<')){
      const m=p.match(/^<(\/)?([a-zA-Z0-9]+)/);
      if(m){const name=m[2].toLowerCase();
        if(m[1]){const i=stack.map(x=>x.n).lastIndexOf(name);if(i>=0)stack.splice(i)}
        else if(!VOID.includes(name)&&!/\/>$/.test(p)){
          stack.push({n:name,skip:/\bdata-noruby\b/.test(p)||/\blang="(?!ja)/.test(p)||['script','style','code','ruby','title','option'].includes(name)})}
      }
      out+=p;continue}
    out+=stack.some(x=>x.skip)?p:rubyText(p);
  }
  return out;
}
function walk(d,a=[]){for(const n of fs.readdirSync(d)){const f=path.join(d,n);fs.statSync(f).isDirectory()?walk(f,a):a.push(f)}return a}
const all=[];
for(const f of walk(path.join(SRC,'pages')).filter(f=>f.endsWith('.html'))){
  let s=fs.readFileSync(f,'utf8');const m=s.match(/^<!--(\{[\s\S]*?\})-->\s*/);if(!m)throw new Error('見出し情報が無い '+f);
  all.push({f,meta:JSON.parse(m[1]),body:s.slice(m[0].length),out:path.relative(path.join(SRC,'pages'),f)});
}
const generated=fs.existsSync(path.join(SRC,'gen.mjs'))?(await import(path.join(SRC,'gen.mjs'))).default():[];
all.push(...generated);
const urlOf=o=>o.replace(/index\.html$/,'');
const sitemap=[];const searchIndex=[];
for(const pg of all){
  const {meta:M,out}=pg;const depth=out.split('/').length-1,up='../'.repeat(depth);
  if(M.raw){const html=pg.body.replace(/@\//g,up||'./').replaceAll('{{STORE}}',STORE);const b=html.indexOf('<body');const dest=path.join(ROOT,out);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html.slice(0,b)+addRuby(html.slice(b)));continue}
  const lang=M.lang||'ja',isJa=lang==='ja';
  const rel=s=>s.replace(/@\//g,up||'./').replace(/\.\/\.\//g,'./');
  const here=urlOf(out);
  const canon=BASE+here;
  const crumbs=M.crumbs||[];
  const nameHome=isJa?'トップ':'Home';
  const crumbHtml=(here===''||M.nocrumb)?'':`<nav class="crumb" aria-label="${isJa?'いまいる場所':'Breadcrumb'}"><ol><li><a href="@/">${nameHome}</a></li>${crumbs.map(([t,u])=>`<li><a href="@/${u}">${t}</a></li>`).join('')}<li aria-current="page">${M.short||M.title}</li></ol></nav>`;
  const hre=M.intl?LANGS.map(([l,,u])=>`<link rel="alternate" hreflang="${l}" href="${BASE}${u==='./'?'':u}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${BASE}">`:'';
  const nav=NAV.map(([t,u])=>`<li><a href="@/${u}"${here.startsWith(u)||(u==='exam/'&&here==='sogo.html')||(u==='app/'&&here==='screens.html')?' aria-current="true"':''}>${t}</a></li>`).join('');
  const langs=LANGS.map(([l,n,u])=>{const cur=(u==='./'?'':u)===here;return `<li lang="${l}"><a href="@/${u==='./'?'':u}"${cur?' class="now" aria-current="page"':''}>${n}</a></li>`}).join('');
  const ld=[];
  if(crumbs.length||here!==''){ld.push({'@type':'BreadcrumbList',itemListElement:[{name:nameHome,item:BASE},...crumbs.map(([t,u])=>({name:t,item:BASE+u})),{name:M.short||M.title,item:canon}].map((x,i)=>({'@type':'ListItem',position:i+1,...x}))})}
  if(M.article)ld.push({'@type':'Article',headline:M.title,dateModified:M.updated,inLanguage:lang,author:{'@type':'Organization',name:'のす工房（Nosu Works）'},publisher:{'@type':'Organization',name:'のす工房（Nosu Works）'}});
  if(M.ld)ld.push(...M.ld);
  const uiJa=isJa;
  const head=`<!doctype html>
<html lang="${lang}"${uiJa?'':' class="noruby"'}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${M.title}${M.title.includes('ふりがな整備士')?'':'｜ふりがな整備士'}</title>
<meta name="description" content="${M.desc}">
${M.noindex?'<meta name="robots" content="noindex">':`<link rel="canonical" href="${canon}">`}
${hre}
<meta property="og:title" content="${M.title}">
<meta property="og:description" content="${M.desc}">
<meta property="og:type" content="${M.article?'article':'website'}">
<meta property="og:url" content="${canon}">
<meta property="og:site_name" content="ふりがな整備士">
<meta property="og:image" content="${BASE}img/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="apple-itunes-app" content="app-id=6827350748">
<link rel="icon" href="@/img/icon.png"><link rel="apple-touch-icon" href="@/img/icon.png">
<link rel="stylesheet" href="@/assets/site.css?v=20261110f">
${uiJa?`<script>(function(){var d=document.documentElement,r=null,f=null;try{r=localStorage.getItem('ruby');f=localStorage.getItem('fs')}catch(e){}var ja=/^ja/i.test(navigator.language||'ja');if(r==='0'||(r===null&&ja))d.classList.add('noruby');if(f)d.classList.add(f)})()</script>`:`<script>(function(){try{var f=localStorage.getItem('fs');if(f)document.documentElement.classList.add(f)}catch(e){}})()</script>`}
${ld.length?`<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':ld})}</script>`:''}
</head>`;
  const skip=isJa?'本文へ移る':(M.skip||'Skip to content');
  const search=uiJa?`<form class="search" role="search" data-root="@/" data-none="見つかりませんでした"><input type="search" aria-label="サイト内を検索" placeholder="サイト内を検索"><button type="submit">検索</button><div class="sr" hidden></div></form>`:'';
  const top=`<body>
<a class="skip" href="#main">${skip}</a>
<div class="lang-row"><div class="w"><ul>${langs}</ul></div></div>
<header class="top"><div class="w top-in">
<a class="brand" href="@/">ふりがな整備士<small>${uiJa?'自動車整備士 学科試験の情報と過去問アプリ':'Japan automotive mechanic exam'}</small></a>
${uiJa?`<nav class="nav" aria-label="サイトの案内"><ul>${nav}</ul></nav>`:''}
<div class="tools">${search}${uiJa?`<button class="tool" id="t-ruby" type="button" aria-pressed="false"><span>ふりがな</span></button>`:''}<button class="tool" id="t-size" type="button" aria-pressed="false" aria-label="${uiJa?'文字を大きくする':(M.sizeLabel||'Text size')}" data-noruby><span>${uiJa?'文字＋':'A＋'}</span></button></div>
</div></header>`;
  const pageFoot=M.updated?`<div class="pagefoot">${isJa?`このページの更新日: ${M.updated}　・　<a href="@/about/errata.html">このページの誤りを知らせる</a>`:`${M.updatedLabel||'Last updated'}: ${M.updated} · <a href="mailto:nosunosukawa@gmail.com">${M.errLabel||'Report a mistake'}</a>`}</div>`:'';
  const foot=isJa?`<footer class="foot"><div class="w">
<div class="foot-g">
<div><h2>試験を知る</h2><ul><li><a href="@/sogo.html">総合への変更</a></li><li><a href="@/exam/k2.html">2級の試験</a></li><li><a href="@/exam/k3.html">3級の試験</a></li><li><a href="@/exam/k1.html">1級の試験</a></li><li><a href="@/exam/foreign.html">母語が日本語でない人の勉強</a></li><li><a href="@/exam/words.html">問題文によく出ることば</a></li></ul></div>
<div><h2>アプリを知る</h2><ul><li><a href="@/app/">できること・できないこと</a></li><li><a href="@/app/contents.html">収録している問題</a></li><li><a href="@/app/price.html">無料の範囲と料金</a></li><li><a href="@/app/guide.html">使い方</a></li><li><a href="@/screens.html">画面</a></li><li><a href="@/demo.html">5問を体験する</a></li></ul></div>
<div><h2>学校・職場の方へ</h2><ul><li><a href="@/school/">先生へのご案内</a></li><li><a href="@/school/flyer.html">印刷できる1枚</a></li></ul></div>
<div><h2>作り方と誤り</h2><ul><li><a href="@/about/">作っている人</a></li><li><a href="@/about/editorial.html">作り方の決まり</a></li><li><a href="@/about/errata.html">誤りの報告と訂正</a></li><li><a href="@/about/changelog.html">変更の記録</a></li><li><a href="@/about/accessibility.html">読みやすさの方針</a></li></ul></div>
<div><h2>困ったとき</h2><ul><li><a href="@/support.html">サポート</a></li><li><a href="@/privacy.html">プライバシー</a></li><li><a href="mailto:nosunosukawa@gmail.com">お問い合わせ</a></li></ul></div>
</div>
<p class="disc" data-noruby>このアプリとサイトは個人が作成したもので、一般社団法人 日本自動車整備振興会連合会（日整連）の公認・監修は受けていません。公開されている過去問にふりがな・訳・解説を付けて提供することについては、2026年10月に日整連へ書面で問い合わせ、許諾は不要との回答を得ています。試験の正式な情報は、日整連と各地の自動車整備振興会の発表で確かめてください。<br>© 2026 のす工房（Nosu Works）</p>
</div></footer>`:`<footer class="foot"><div class="w"><p class="disc">${M.disc||'This app and site are made by an individual and are not endorsed or supervised by JASPA. In October 2026 we asked JASPA in writing about offering its published past questions with furigana, translations and explanations, and JASPA replied that permission is not required.'}<br>© 2026 Nosu Works · <a href="mailto:nosunosukawa@gmail.com">nosunosukawa@gmail.com</a></p></div></footer>`;
  const sec=SECTIONS.find(x=>x.items.some(([,u])=>u===here));
  const sideList=sec?sec.items.map(([t,u])=>`<li><a href="@/${u}"${u===here?' aria-current="page"':''}>${t}</a></li>`).join(''):'';
  const side=sec?`<aside class="side" aria-label="${sec.title}のページ"><h2><a href="@/${sec.items[0][1]}">${sec.title}</a></h2><ul>${sideList}</ul></aside>`:'';
  const sideM=sec?`<details class="side-m"><summary>${sec.title}のページ一覧</summary><ul>${sideList}</ul></details>`:'';
  const toc=M.toc&&isJa?(()=>{const hs=[...pg.body.matchAll(/<h2 id="([^"]+)"[^>]*>(.*?)<\/h2>/g)];return hs.length>2?`<nav class="toc" aria-label="このページの内容"><b>このページの内容</b><ul>${hs.map(h=>`<li><a href="#${h[1]}">${h[2]}</a></li>`).join('')}</ul></nav>`:''})():'';
  let body;
  if(M.full){body=`<main id="main">${pg.body}${pageFoot?`<div class="w">${pageFoot}</div>`:''}</main>`}
  else{const inner=`${sideM}<main id="main">${(M.h1?`<h1>${M.h1}</h1>`:'')}${toc}${pg.body}${pageFoot}</main>`;
    body=`<div class="w">${crumbHtml}${sec?`<div class="layout">${side}<div class="content">${inner}</div></div>`:`<div class="single">${inner}</div>`}</div>`}
  if(isJa){body=addRuby(body)}
  const navR=isJa?addRuby(top):top,footR=isJa?addRuby(foot):foot;
  let html=rel(head+'\n'+navR+'\n'+body+'\n'+footR+`\n<script src="@/assets/site.js?v=20261110d" defer></script>\n</body></html>\n`).replaceAll(STORE,STORE);
  html=html.replaceAll('{{STORE}}',STORE);
  if(isJa&&!M.noindex){const pl=x=>x.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');searchIndex.push({u:here,t:(M.short||M.title),d:M.desc,h:[...pg.body.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>/g)].map(x=>pl(x[1])).join(' '),b:pl(pg.body).slice(0,1500)})}
  const dest=path.join(ROOT,out);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);
  if(!M.noindex)sitemap.push(`<url><loc>${canon}</loc><lastmod>${M.updated||'2026-11-09'}</lastmod></url>`);
}
for(const [u,d] of [['demo.html','2026-11-07'],['sample-k1.html','2026-10-30'],['sample-k2.html','2026-10-30'],['sample-k3.html','2026-10-30']])sitemap.push(`<url><loc>${BASE}${u}</loc><lastmod>${d}</lastmod></url>`);
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(SRC,'ruby-audit.txt'),[...audit.entries()].sort().map(([a,b])=>a+'\t'+b).join('\n'));
fs.writeFileSync(path.join(ROOT,'assets/search.json'),JSON.stringify(searchIndex));
console.log('pages',all.length,'読みの種類',audit.size);

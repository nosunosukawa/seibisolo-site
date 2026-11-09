// データから作るページ: よく出ることば
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const SRC=path.dirname(fileURLToPath(import.meta.url));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
export default function(){
  const W=JSON.parse(fs.readFileSync(path.join(SRC,'data/read-words.json'),'utf8'));
  const L=[['en','English','en'],['ne','नेपाली','ne'],['zh','中文','zh-Hans'],['vi','Tiếng Việt','vi'],['ind','Indonesia','id'],['si','සිංහල','si'],['my','မြန်မာ','my']];
  const rows=W.map(w=>`<div class="w-row"><h3 data-noruby><ruby>${esc(w.ja)}<rp>(</rp><rt>${esc(w.yomi)}</rt><rp>)</rp></ruby></h3>${L.map(([k,,h])=>`<div class="tr" data-wl="${h==='zh-Hans'?'zh':h}" lang="${h}">${esc(w[k])}</div>`).join('')}<p style="margin:6px 0">${esc(w.easy)}</p><p class="ex" data-noruby>例: ${w.exr?esc(w.exr).replace(/\{([^|}]*)\|([^}]*)\}/g,'<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>'):esc(w.ex)}</p></div>`).join('\n');
  const body=`<p class="lead">自動車整備士の過去問によく出る30語です。問題文を読むときに出会うことが多いことばを選びました。誰でも無料で読めます。</p>
<p class="small">出る回数の多い順です。やさしい説明と訳は、アプリの「基本の言葉」と同じものです。訳は AI で作った参考で、例文は過去問です（出典: 日整連 自動車整備技能登録試験）。</p>
<p><label for="w-lang"><b>訳のことば</b></label><br><select id="w-lang" class="tool" style="min-width:220px">${L.map(([,n,h])=>`<option value="${h==='zh-Hans'?'zh':h}">${n}</option>`).join('')}</select></p>
${rows}`;
  return [{f:'gen',out:'exam/words.html',body,meta:{title:'自動車整備士の問題文によく出ることば30語（やさしい説明・7か国語の訳）',short:'よく出ることば',crumbs:[['試験を知る','exam/']],desc:'適切・不適切・次のうち・記述など、自動車整備士の過去問によく出ることばを、ふりがな、やさしい日本語、英語・ネパール語・中国語・ベトナム語・インドネシア語・シンハラ語・ミャンマー語の訳でまとめました。',h1:'問題文によく出ることば 30語',updated:'2026-11-09',article:true}}];
}

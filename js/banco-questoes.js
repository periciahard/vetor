(function(){
 'use strict';
 const A=()=>window.VETOR;
 const letras=['A','B','C','D','E'];
 const norm=v=>String(v??'').trim();
 const safe=v=>A()?.safe?A().safe(v):String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
 const desc=v=>{const m=norm(v).toUpperCase().match(/D\s*0*([0-9]{1,2})/);return m?'D'+parseInt(m[1],10):norm(v).toUpperCase();};
 const examples={
  'Língua Portuguesa':['notícia escolar','crônica curta','charge','artigo de opinião','infográfico','campanha educativa','texto instrucional','tirinha','resenha','relato de experiência'],
  'Matemática':['porcentagem em compras','gráfico de desempenho','medidas de uma quadra','função em aplicativo','probabilidade em sorteio','volume de recipiente','tabela de consumo','mapa com escala','sequência numérica','estatística escolar']
 };
 function uid(){return 'Q'+Date.now().toString(36)+Math.random().toString(36).slice(2,7).toUpperCase()}
 function localQuestion(descCode,i,disc){return {id:'local-'+descCode+'-'+i,discipline:disc,descriptor:descCode,difficulty:'Média',key:'C',source:'Modelo interno',bncc:'',time:3,textBase:'Texto ou situação-problema gerado para teste.',enunciado:`Questão ${i+1}. Resolva uma situação relacionada ao descritor ${descCode} e assinale a alternativa correta.`,alts:['A) Alternativa incorreta.','B) Alternativa parcialmente correta.','C) Alternativa correta.','D) Alternativa com erro comum.','E) Alternativa incompatível.']};}
 function builtIn(){
  const out=[];
  const cfg={'Língua Portuguesa':21,'Matemática':35};
  Object.entries(cfg).forEach(([disc,max])=>{
   for(let n=1;n<=max;n++){
    for(let j=0;j<10;j++){
     const descriptor='D'+n, difficulty=j<4?'Fácil':j<8?'Média':'Difícil', key=letras[(n+j)%5];
     const tema=(examples[disc]||[])[(n+j)%(examples[disc]||['contexto escolar']).length]||'contexto escolar';
     const textBase=disc==='Língua Portuguesa'?`Texto-base fictício sobre ${tema}, produzido apenas para testar o banco de questões por descritor.`:`Situação-problema fictícia sobre ${tema}, produzida apenas para testar o banco de questões por descritor.`;
     out.push({id:`BASE-${disc.startsWith('Língua')?'LP':'MAT'}-${descriptor}-${j+1}`,builtin:true,discipline:disc,descriptor,difficulty,key,source:'Banco interno',bncc:'',time:difficulty==='Fácil'?2:difficulty==='Média'?3:4,textBase,enunciado:`(${descriptor}) Questão-modelo ${j+1}. Leia a situação e escolha a alternativa que melhor responde ao comando do descritor.`,alts:letras.map(l=>`${l}) ${l===key?'Resposta correta construída para o descritor.':'Distrator plausível para teste do sistema.'}`)});
    }
   }
  });
  return out;
 }
 function userBank(){const st=A()?.state;if(!st)return[];if(!Array.isArray(st.bank))st.bank=[];return st.bank;}
 function allBank(){return [...userBank(),...builtIn()];}
 function normalizeQuestion(raw){
  const q={}; const get=(...keys)=>{for(const k of keys){if(raw[k]!=null&&norm(raw[k])!=='')return raw[k]; const found=Object.keys(raw).find(x=>x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')===k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')); if(found&&norm(raw[found])!=='')return raw[found];} return '';};
  q.id=norm(get('ID','Id','id'))||uid();
  q.discipline=norm(get('Disciplina','discipline','Materia','Componente'))||'Língua Portuguesa';
  q.descriptor=desc(get('Descritor','descriptor','D'))||'D1';
  q.difficulty=norm(get('Nivel','Nível','Dificuldade','difficulty'))||'Média';
  q.key=(norm(get('Gabarito','Resposta','key')).toUpperCase().match(/[A-E]/)||['C'])[0];
  q.source=norm(get('Fonte','source'))||'Importado';
  q.bncc=norm(get('Habilidades','Habilidade','Habilidade Habilidades'));
  q.time=Number(get('Tempo','Tempo estimado','time'))||3;
  q.textBase=norm(get('TextoBase','Texto-base','Texto base','Contexto'));
  q.enunciado=norm(get('Enunciado','Questao','Questão','Pergunta','Texto'));
  q.alts=letras.map(l=>norm(get(l,'Alternativa '+l,'Alt '+l))).filter(Boolean).map((v,i)=>/^[A-E]\)/i.test(v)?v:`${letras[i]}) ${v}`);
  if(!q.enunciado && q.textBase) q.enunciado='Questão vinculada ao texto-base informado.';
  if(q.alts.length<5) q.alts=letras.map((l,i)=>q.alts[i]||`${l}) Alternativa ${l}`);
  return q.enunciado?q:null;
 }
 function csvEscape(v){v=String(v??'');return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
 function bankToCSV(list=userBank()){
  const head=['ID','Disciplina','Descritor','Nivel','TextoBase','Enunciado','A','B','C','D','E','Gabarito','Fonte','Habilidades','Tempo'];
  const rows=list.map(q=>[q.id,q.discipline,q.descriptor,q.difficulty,q.textBase,q.enunciado,...letras.map((l,i)=>(q.alts||[])[i]||''),q.key,q.source,q.bncc,q.time]);
  return [head,...rows].map(r=>r.map(csvEscape).join(';')).join('\n');
 }
 function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(x=>x.trim()); if(!lines.length)return[];
  const sep=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';
  const split=line=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===sep&&!q){out.push(cur);cur='';}else cur+=ch;}out.push(cur);return out;};
  const head=split(lines.shift()).map(x=>x.trim());
  return lines.map(line=>{const vals=split(line);const obj={};head.forEach((h,i)=>obj[h]=vals[i]||'');return obj;});
 }
 function download(name,content,type='text/plain'){A()?.download?A().download(name,content,type):(()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)})()}
 function downloadBlob(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},900)}
 function wordTemplateText(){
  return `MODELO PARA IMPORTAR QUESTÕES NO BANCO VETOR

Preencha uma ou várias questões seguindo este padrão. Duplique o bloco QUESTÃO quantas vezes precisar.

QUESTÃO 1
Disciplina: Língua Portuguesa
Descritor: D15
Dificuldade: Média
Gabarito: A
Fonte: Autoral
Habilidade: habilidade ou competência relacionada
Tempo: 3
Texto-base:
Cole aqui o texto-base, imagem descrita ou situação-problema. Se não houver, escreva "sem texto-base".
Enunciado:
Cole aqui o comando da questão.
A) Alternativa A
B) Alternativa B
C) Alternativa C
D) Alternativa D
E) Alternativa E

QUESTÃO 2
Disciplina: Matemática
Descritor: D12
Dificuldade: Fácil
Gabarito: C
Fonte: Autoral
Habilidade:
Tempo: 4
Texto-base:
Uma situação-problema pode ficar aqui.
Enunciado:
Qual alternativa resolve corretamente a situação?
A) Alternativa A
B) Alternativa B
C) Alternativa C
D) Alternativa D
E) Alternativa E
`;
 }
 async function downloadWordTemplate(){
  if(!window.docx){download('modelo-banco-questoes-word.txt',wordTemplateText(),'text/plain;charset=utf-8');return;}
  const {Document,Packer,Paragraph,TextRun}=window.docx;
  const lines=wordTemplateText().split('\n');
  const children=lines.map(line=>new Paragraph({children:[new TextRun({text:line,bold:/^(MODELO|QUESTÃO\s+\d+)/i.test(line)})]}));
  const doc=new Document({sections:[{children}]});
  const blob=await Packer.toBlob(doc);
  downloadBlob('modelo-banco-questoes-vetor.docx',blob);
 }
 function valueAfter(block,label){
  const re=new RegExp('^\\s*'+label+'\\s*:\\s*(.*)$','im');
  const m=String(block||'').match(re);
  return m?norm(m[1]):'';
 }
 function sectionText(block,label,nextLabels){
  const labels=nextLabels.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const re=new RegExp(label+'\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:'+labels+')\\s*:|\\n\\s*[A-E]\\)|$)','i');
  const m=String(block||'').match(re);
  return m?norm(m[1].replace(/sem texto-base\.?/i,'')):'';
 }
 function parseWordQuestions(text){
  const clean=String(text||'').replace(/\r/g,'').replace(/\u00a0/g,' ');
  const blocks=clean.split(/\n\s*QUEST(?:ÃO|AO|AO\.?|ÃO\.?)\s*\d+[\s:.-]*/i).map(x=>x.trim()).filter(Boolean);
  const usable=blocks.length>1?blocks:clean.split(/\n\s*-{3,}\s*\n/).map(x=>x.trim()).filter(Boolean);
  return usable.map(block=>{
   const alternatives={};
   ['A','B','C','D','E'].forEach(l=>{
    const re=new RegExp('(?:^|\\n)\\s*'+l+'\\)\\s*([\\s\\S]*?)(?=\\n\\s*[A-E]\\)|$)','i');
    const m=block.match(re);
    alternatives[l]=m?norm(m[1]):'';
   });
   const enunciado=sectionText(block,'Enunciado',['A)','B)','C)','D)','E)','Gabarito','Fonte','Habilidade','Tempo']);
   const q=normalizeQuestion({
    Disciplina:valueAfter(block,'Disciplina'),
    Descritor:valueAfter(block,'Descritor'),
    Nivel:valueAfter(block,'Dificuldade')||valueAfter(block,'Nível')||valueAfter(block,'Nivel'),
    Gabarito:valueAfter(block,'Gabarito')||valueAfter(block,'Resposta'),
    Fonte:valueAfter(block,'Fonte'),
    Habilidades:valueAfter(block,'Habilidade')||valueAfter(block,'Habilidades'),
    Tempo:valueAfter(block,'Tempo'),
    TextoBase:sectionText(block,'Texto-base',['Enunciado','A)','B)','C)','D)','E)','Gabarito']),
    Enunciado:enunciado,
    A:alternatives.A,
    B:alternatives.B,
    C:alternatives.C,
    D:alternatives.D,
    E:alternatives.E
   });
   return q;
  }).filter(Boolean);
 }
 function stats(){
  const user=userBank(), base=builtIn(), all=allBank();
  const byDisc={}, byDesc={};
  all.forEach(q=>{byDisc[q.discipline]=(byDisc[q.discipline]||0)+1; const k=q.discipline+'|'+q.descriptor; byDesc[k]=(byDesc[k]||0)+1;});
  return {user:user.length,base:base.length,total:all.length,byDisc,byDesc};
 }
 function priorityDescriptors(studentIndex){
  const r=A().getResults(); const s=r.students[studentIndex]; if(!s)return[]; const map={};
  s.correct.forEach((c,i)=>{if(!c){const d=A().state.assessment.descriptors[i]||'Sem descritor';map[d]=(map[d]||0)+1;}});
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([descriptor,errors])=>({descriptor,errors})).slice(0,5);
 }
 function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 function selectQuestions(priorities,disc,total=10,opts={}){
  const pool=allBank().filter(q=>!disc||q.discipline===disc);
  const descs=(priorities&&priorities.length?priorities:[{descriptor:'D1',errors:1},{descriptor:'D2',errors:1},{descriptor:'D3',errors:1}]).map(p=>({descriptor:desc(p.descriptor),errors:Number(p.errors)||1}));
  const selected=[]; const weightSum=descs.reduce((s,p)=>s+p.errors,0)||descs.length;
  const difOrder=opts.balance===false?null:['Fácil','Média','Difícil'];
  descs.forEach((p,idx)=>{
    const quota=idx===descs.length-1?total-selected.length:Math.max(1,Math.round(total*(p.errors/weightSum)));
    let by=shuffle(pool.filter(q=>q.descriptor===p.descriptor));
    if(difOrder){by=shuffle(difOrder.flatMap(d=>by.filter(q=>q.difficulty===d)));}
    for(let i=0;i<quota&&selected.length<total;i++) selected.push(by[i]||localQuestion(p.descriptor,i,disc||'Língua Portuguesa'));
  });
  while(selected.length<total){const p=descs[selected.length%descs.length];selected.push(shuffle(pool.filter(q=>q.descriptor===p.descriptor))[0]||localQuestion(p.descriptor,selected.length,disc||'Língua Portuguesa'));}
  return selected.slice(0,total);
 }
 function descriptorInfo(descCode,disc){return (window.Descritores?.list(disc)||[]).find(x=>x.codigo===descCode)||{codigo:descCode,texto:'Descritor não cadastrado na biblioteca.',erros:'Dificuldade específica observada nas respostas do aluno.',estrategias:'Retomar o conceito, resolver exemplos guiados e propor exercícios graduados.'};}
 function studentMissedQuestions(student){const a=A().state.assessment;return (student.correct||[]).map((ok,i)=>ok?null:{q:a.questions[i]||('Q'+(i+1)),desc:a.descriptors[i]||'Sem descritor',ans:student.answers[i]||'-',key:a.key[i]||'-'}).filter(Boolean);}
 function generateSheet(){
  const idx=Number(A().$('#sheetStudent')?.value); const r=A().getResults(); const s=r.students[idx]; if(!s){A().$('#sheetOutput').value='Selecione um aluno.';return;}
  const pr=priorityDescriptors(idx); const disc=A().state.assessment.discipline; const questions=selectQuestions(pr,disc,10,{balance:true});
  const txt=`FICHA DE EXERCÍCIOS INDIVIDUALIZADA\nAluno: ${s.name}\nDisciplina: ${disc}\nDescritores prioritários: ${pr.map(p=>p.descriptor+' ('+p.errors+' erro(s))').join(', ')||'sem prioridade'}\n\n`+questions.map((q,i)=>`${i+1}. [${q.descriptor} • ${q.difficulty}]\n${q.textBase?('Texto-base: '+q.textBase+'\n'):''}${q.enunciado}\n${(q.alts||[]).join('\n')}`).join('\n\n')+`\n\nGABARITO\n`+questions.map((q,i)=>`${i+1}) ${q.key||'C'}`).join('\n');
  A().$('#sheetOutput').value=txt;
 }
 function levelPlan(student,priorities){if(student.percent<30)return{ritmo:'recomposição intensiva',tom:'O aluno necessita intervenção imediata, com retomada dos fundamentos e acompanhamento próximo.',meta:'elevar o domínio dos descritores prioritários antes de avançar para itens mais complexos.'};if(student.percent<60)return{ritmo:'reforço orientado',tom:'O aluno apresenta domínio parcial e precisa consolidar procedimentos e leitura dos comandos.',meta:'reduzir erros recorrentes nos descritores com maior incidência.'};if(priorities.length)return{ritmo:'consolidação e refinamento',tom:'O aluno apresenta desempenho razoável, mas ainda possui lacunas localizadas.',meta:'corrigir pontos específicos e ampliar segurança na resolução.'};return{ritmo:'aprofundamento',tom:'O aluno não apresentou descritores críticos nesta avaliação.',meta:'manter desempenho e trabalhar itens de maior complexidade.'};}
 function buildWeekPlan(student,priorities,disc){const base=priorities.length?priorities:[{descriptor:'Revisão geral',errors:1}];return Array.from({length:4},(_,w)=>{const p=base[w%base.length];return{n:w+1,p,info:descriptorInfo(p.descriptor,disc),qtd:Math.max(2,Math.min(6,p.errors+2)),foco:['retomada guiada','exercícios graduados','simulado curto e correção','revisão final e autonomia'][w]};});}
 function generateMap(){
  const idx=Number(A().$('#mapStudent')?.value); const r=A().getResults(); const s=r.students[idx]; const box=A().$('#mapaOutput'); if(!s||!box)return;
  const disc=A().state.assessment.discipline||A().state.settings.discipline; const pr=priorityDescriptors(idx); const missed=studentMissedQuestions(s); const plan=levelPlan(s,pr); const weeks=buildWeekPlan(s,pr,disc);
  const top=pr.slice(0,3).map(p=>{const info=descriptorInfo(p.descriptor,disc);const qs=missed.filter(m=>m.desc===p.descriptor).map(m=>m.q).slice(0,8).join(', ')||'questões não localizadas';return `<div class="question-card"><b>${safe(p.descriptor)} — ${safe(info.texto)}</b><p><b>Erros:</b> ${p.errors}. <b>Questões:</b> ${safe(qs)}.</p><p><b>Estratégia:</b> ${safe(info.estrategias)}</p></div>`;}).join('')||'<p class="hint">Nenhum descritor crítico identificado. Use o plano para aprofundamento.</p>';
  box.innerHTML=`<h3>Mapa da Mina — ${safe(s.name)}</h3><div class="map-summary"><div><b>${s.percent}%</b><br>desempenho</div><div><b>${safe(s.level)}</b><br>status</div><div><b>${s.total}/${r.summary.nQuestions}</b><br>acertos</div><div><b>${pr.length}</b><br>descritores prioritários</div></div><p><b>Diagnóstico:</b> ${safe(plan.tom)} Meta: ${safe(plan.meta)}</p><p><b>Ritmo sugerido:</b> ${safe(plan.ritmo)}. Regras pedagógicas locais; não usa IA paga.</p><h4>Prioridades do aluno</h4>${top}<h4>Cronograma de 4 semanas</h4>`+weeks.map(w=>`<div class="question-card"><b>Semana ${w.n} — ${safe(w.p.descriptor)} • ${safe(w.foco)}</b><p><b>1h de estudo:</b> revisar ${safe(w.info.texto)} com exemplos resolvidos e análise dos erros.</p><p><b>1h de exercícios:</b> resolver ${w.qtd} a ${w.qtd+2} questões do descritor ${safe(w.p.descriptor)}.</p></div>`).join('');
 }
 function fillForm(q={}){const app=A();[['#bankDisc',q.discipline||'Língua Portuguesa'],['#bankDesc',q.descriptor||''],['#bankDiff',q.difficulty||'Média'],['#bankKey',q.key||'C'],['#bankSource',q.source||''],['#bankBncc',q.bncc||''],['#bankTime',q.time||''],['#bankBase',q.textBase||''],['#bankText',q.enunciado||''],['#bankAlts',(q.alts||[]).join('\n')]].forEach(([sel,val])=>{const e=app.$(sel); if(e)e.value=val;});}
 function addQuestion(){const app=A(); const q=normalizeQuestion({Disciplina:app.$('#bankDisc')?.value,Descritor:app.$('#bankDesc')?.value,Nivel:app.$('#bankDiff')?.value,Gabarito:app.$('#bankKey')?.value,Fonte:app.$('#bankSource')?.value,Habilidades:app.$('#bankBncc')?.value,Tempo:app.$('#bankTime')?.value,TextoBase:app.$('#bankBase')?.value,Enunciado:app.$('#bankText')?.value,A:(app.$('#bankAlts')?.value||'').split(/\n+/)[0],B:(app.$('#bankAlts')?.value||'').split(/\n+/)[1],C:(app.$('#bankAlts')?.value||'').split(/\n+/)[2],D:(app.$('#bankAlts')?.value||'').split(/\n+/)[3],E:(app.$('#bankAlts')?.value||'').split(/\n+/)[4]}); if(!q)return alert('Informe pelo menos o descritor e o enunciado.'); q.id=uid(); userBank().push(q); app.save(); fillForm({}); render();}
 async function importBankFile(e){
  const f=e.target.files?.[0]; if(!f)return; let arr=[];
  try{
   if(/\.json$/i.test(f.name)){const data=JSON.parse(await f.text()); arr=Array.isArray(data)?data:(data.questoes||data.questions||[]);}
   else if(/\.docx$/i.test(f.name)){
    if(!window.mammoth)throw new Error('Leitor de Word não carregou. Verifique a conexão ou use o modelo em TXT/CSV.');
    const result=await window.mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()});
    const qs=parseWordQuestions(result.value||'');
    if(!qs.length)throw new Error('Nenhuma questão válida encontrada no Word. Use os títulos QUESTÃO 1, QUESTÃO 2 e os campos do modelo.');
    userBank().push(...qs); A().save(); const st=A().$('#bankImportStatus'); if(st)st.textContent=`Importadas ${qs.length} questão(ões) do Word para o banco local.`; render(); e.target.value=''; return;
   }
   else if(/\.txt$/i.test(f.name)){
    const qs=parseWordQuestions(await f.text());
    if(!qs.length)throw new Error('Nenhuma questão válida encontrada no texto. Use os títulos QUESTÃO 1, QUESTÃO 2 e os campos do modelo.');
    userBank().push(...qs); A().save(); const st=A().$('#bankImportStatus'); if(st)st.textContent=`Importadas ${qs.length} questão(ões) do modelo textual para o banco local.`; render(); e.target.value=''; return;
   }
   else if(/\.csv$/i.test(f.name)||/\.txt$/i.test(f.name)){arr=parseCSV(await f.text());}
   else {const data=await f.arrayBuffer(); const wb=XLSX.read(data,{type:'array'}); const ws=wb.Sheets[wb.SheetNames[0]]; arr=XLSX.utils.sheet_to_json(ws,{defval:''});}
   const qs=arr.map(normalizeQuestion).filter(Boolean); if(!qs.length)throw new Error('Nenhuma questão válida encontrada.');
   userBank().push(...qs); A().save(); const st=A().$('#bankImportStatus'); if(st)st.textContent=`Importadas ${qs.length} questão(ões) para o banco local.`; render();
  }catch(err){alert('Não foi possível importar o banco: '+err.message);}
  e.target.value='';
 }
 function filtered(){
  const app=A(); const disc=app.$('#bankFilterDisc')?.value||''; const d=desc(app.$('#bankFilterDesc')?.value||''); const diff=app.$('#bankFilterDiff')?.value||''; const search=norm(app.$('#bankSearch')?.value).toLowerCase();
  return allBank().filter(q=>(!disc||q.discipline===disc)&&(!d||q.descriptor===d)&&(!diff||q.difficulty===diff)&&(!search||JSON.stringify(q).toLowerCase().includes(search)));
 }
 function render(){
  const app=A(); const list=app.$('#bankList'); const smart=app.$('#smartBankPanel'); if(!list&&!smart)return;
  const st=stats(); if(smart){const cover=Object.entries(st.byDisc).map(([k,v])=>`<span class="pill">${safe(k)}: ${v}</span>`).join(''); smart.innerHTML=`<div class="bankStats"><span class="pill"><b>${st.total}</b> questões disponíveis</span><span class="pill"><b>${st.user}</b> próprias/importadas</span><span class="pill"><b>${st.base}</b> internas de teste</span>${cover}</div>`;}
  if(!list)return; const data=filtered();
  list.innerHTML=data.slice(0,80).map((q,i)=>`<div class="bankItem"><header><div><b>${safe(q.id||'sem ID')}</b><div class="meta"><span>${safe(q.discipline)}</span><span>${safe(q.descriptor)}</span><span>${safe(q.difficulty)}</span><span>Gabarito: ${safe(q.key)}</span><span>${q.builtin?'interno':'próprio'}</span></div></div><div>${q.builtin?'':`<button class="smallBtn secondary" data-editbank="${i}">Editar</button> <button class="smallBtn danger" data-delbank="${i}">Excluir</button>`}</div></header>${q.textBase?`<p class="hint"><b>Texto-base:</b> ${safe(q.textBase)}</p>`:''}<pre>${safe(q.enunciado)}\n${safe((q.alts||[]).join('\n'))}</pre></div>`).join('')+(data.length>80?`<p class="hint">Mostrando 80 de ${data.length}. Use os filtros para refinar.</p>`:'');
  list.querySelectorAll('[data-delbank]').forEach(btn=>btn.onclick=()=>{const q=data[Number(btn.dataset.delbank)]; const idx=userBank().findIndex(x=>x.id===q.id); if(idx>=0&&confirm('Excluir esta questão do banco próprio?')){userBank().splice(idx,1);app.save();render();}});
  list.querySelectorAll('[data-editbank]').forEach(btn=>btn.onclick=()=>{const q=data[Number(btn.dataset.editbank)]; const idx=userBank().findIndex(x=>x.id===q.id); if(idx>=0){fillForm(q); userBank().splice(idx,1); app.save(); render(); app.showView('bancoQuestoes'); window.scrollTo({top:0,behavior:'smooth'});}});
 }
 function previewRandom(){const app=A(); const disc=app.$('#bankPreviewDisc')?.value||app.state.settings.discipline; const descs=(app.$('#bankPreviewDesc')?.value||'D1,D2,D3').split(/[,;\s]+/).filter(Boolean).map(x=>({descriptor:desc(x),errors:1})); const total=Number(app.$('#bankPreviewCount')?.value)||10; const qs=selectQuestions(descs,disc,total,{balance:app.$('#bankPreviewBalance')?.value!=='nao'}); const out=app.$('#bankPreviewOutput'); if(out)out.innerHTML=qs.map((q,i)=>`<div class="bankItem"><b>${i+1}. ${safe(q.descriptor)} • ${safe(q.difficulty)}</b><p>${safe(q.enunciado)}</p><p class="hint">Fonte: ${safe(q.source||'-')} • Gabarito: ${safe(q.key||'-')}</p></div>`).join('');}
 function bind(){
  const app=A(); if(!app)return;
  app.$('#generateSheet')&&(app.$('#generateSheet').onclick=generateSheet); app.$('#downloadSheet')&&(app.$('#downloadSheet').onclick=()=>download('ficha-individual.txt',app.$('#sheetOutput')?.value||'')); app.$('#printSheet')&&(app.$('#printSheet').onclick=()=>window.Exportacao?.printReport(app.$('#sheetOutput')?.value||'','Ficha individualizada'));
  app.$('#generateMap')&&(app.$('#generateMap').onclick=generateMap); app.$('#printMap')&&(app.$('#printMap').onclick=()=>window.Exportacao?.printReport(app.$('#mapaOutput')?.innerText||'','Mapa da Mina'));
  app.$('#addBankQuestion')&&(app.$('#addBankQuestion').onclick=addQuestion); app.$('#clearBankForm')&&(app.$('#clearBankForm').onclick=()=>fillForm({})); app.$('#importBank')&&(app.$('#importBank').onchange=importBankFile);
  app.$('#exportBank')&&(app.$('#exportBank').onclick=()=>download('banco-questoes-v56.json',JSON.stringify(userBank(),null,2),'application/json'));
  app.$('#exportBankCsv')&&(app.$('#exportBankCsv').onclick=()=>download('banco-questoes-v56.csv',bankToCSV(),'text/csv;charset=utf-8'));
  app.$('#downloadBankTemplate')&&(app.$('#downloadBankTemplate').onclick=()=>download('modelo-banco-questoes.csv','Disciplina;Descritor;Nivel;TextoBase;Enunciado;A;B;C;D;E;Gabarito;Fonte;Habilidades;Tempo\nLíngua Portuguesa;D1;Fácil;Texto-base de teste;Enunciado da questão;Alternativa A;Alternativa B;Alternativa C;Alternativa D;Alternativa E;A;Autoral;;3','text/csv;charset=utf-8'));
  app.$('#downloadBankWordTemplate')&&(app.$('#downloadBankWordTemplate').onclick=downloadWordTemplate);
  ['#bankFilterDisc','#bankFilterDesc','#bankFilterDiff','#bankSearch'].forEach(sel=>app.$(sel)&&(app.$(sel).oninput=app.$(sel).onchange=render)); app.$('#previewBankQuestions')&&(app.$('#previewBankQuestions').onclick=previewRandom);
 }
 window.BancoQuestoes={render,generateSheet,generateMap,priorityDescriptors,allBank,builtIn,selectQuestions,stats}; document.addEventListener('DOMContentLoaded',bind);
})();

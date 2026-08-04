
(function(){
 'use strict';
 const A=()=>window.VETOR;
 const B=()=>window.BancoQuestoes;
 const I=()=>window.Intervencoes;
 const $=s=>document.querySelector(s);
 const $$=s=>Array.from(document.querySelectorAll(s));
 const letras=['A','B','C','D','E'];
 function safe(s){return A()?.safe?A().safe(s??''):String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
 function norm(s){return String(s??'').trim();}
 function desc(x){let s=norm(x).toUpperCase(); if(!s)return ''; s=s.replace(/^DESCRITOR\s*/,'').replace(/^D\s*/,'D'); if(/^\d+$/.test(s))s='D'+s; return s;}
 function download(name, content, type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},600);}
 function assessment(){return A()?.state?.assessment||{};}
 function results(){return A()?.getResults?A().getResults():{students:[],descriptorStats:[],summary:{nStudents:0,nQuestions:0,avg:0}};}
 function getUsage(){try{return JSON.parse(localStorage.getItem('vetor_question_usage')||localStorage.getItem('vetor_question_usage')||'{}')}catch{return {}}}
 function setUsage(u){localStorage.setItem('vetor_question_usage',JSON.stringify(u)); localStorage.setItem('vetor_question_usage',JSON.stringify(u));}
 function qKey(q){return q.id||[q.discipline,q.descriptor,q.enunciado].join('|').slice(0,160);}
 function recordUsage(name, qs){if(!name)return; const u=getUsage(); u[name]=u[name]||[]; qs.forEach(q=>{const id=qKey(q); if(!u[name].includes(id))u[name].push(id)}); setUsage(u);}
 function normalizeQuestion(q){
   const alts=Array.isArray(q.alts)?q.alts:letras.map(l=>q[l]||q['alt'+l]||q['Alternativa '+l]).filter(Boolean);
   return {...q, alts:alts.length?alts:letras.map(l=>`${l}) Alternativa ${l}`), key:(q.key||q.gabarito||'C').toString().toUpperCase().match(/[A-E]/)?.[0]||'C'};
 }
 function descriptorText(disc, code){return (window.Descritores?.list(disc)||[]).find(x=>x.codigo===code)?.texto || 'Descritor priorizado para recomposição da aprendizagem.';}
 function manualPriorities(){
   const raw=$('#v59ManualDesc')?.value||'';
   return raw.split(/[,;\s]+/).map(desc).filter(Boolean).map(d=>({descriptor:d,errors:1}));
 }
 function classPriorities(){
   const r=results();
   return (r.descriptorStats||[]).slice().sort((a,b)=>(a.percent||0)-(b.percent||0)).slice(0,4).map(d=>({descriptor:d.descritor||d.descriptor,errors:Math.max(1,100-(d.percent||0))})).filter(x=>x.descriptor);
 }
 function studentPriorities(studentIndex){
   if(B()?.priorityDescriptors){
     const pr=B().priorityDescriptors(studentIndex)||[];
     if(pr.length)return pr.map(p=>({descriptor:desc(p.descriptor||p.descritor||p),errors:p.errors||1})).filter(x=>x.descriptor);
   }
   const r=results(); const st=(r.students||[])[studentIndex];
   if(!st)return classPriorities();
   const arr=[];
   const ds=r.descriptorStats||[];
   ds.forEach(d=>{ const code=d.descritor||d.descriptor; arr.push({descriptor:code,errors:Math.max(1,100-(d.percent||0))}); });
   return arr.sort((a,b)=>b.errors-a.errors).slice(0,4);
 }
 function selectQuestions(priorities, disc, count, studentName){
   let qs=[];
   if(B()?.selectQuestions){
     qs=B().selectQuestions(priorities,disc,count*4,{balance:($('#v59Difficulty')?.value||'balanceada')==='balanceada'})||[];
   } else {
     qs=(B()?.allBank?B().allBank():[]).filter(q=>(!disc||q.discipline===disc)&&priorities.some(p=>desc(p.descriptor)===desc(q.descriptor)));
     qs.sort(()=>Math.random()-.5);
   }
   qs=qs.map(normalizeQuestion);
   const difficulty=$('#v59Difficulty')?.value||'balanceada';
   if(difficulty!=='balanceada'){
     const map={facil:'Fácil',media:'Média',dificil:'Difícil'}; const pref=map[difficulty];
     qs=qs.sort((a,b)=>(a.difficulty===pref?-1:1)-(b.difficulty===pref?-1:1));
   }
   if($('#v59AvoidUsed')?.checked && studentName){
     const used=new Set((getUsage()[studentName]||[]));
     const filtered=qs.filter(q=>!used.has(qKey(q)));
     if(filtered.length>=count)qs=filtered;
   }
   if(qs.length<count){
     const fallback=(B()?.allBank?B().allBank():[]).map(normalizeQuestion).filter(q=>(!disc||q.discipline===disc));
     fallback.sort(()=>Math.random()-.5);
     for(const q of fallback){ if(!qs.some(x=>qKey(x)===qKey(q))) qs.push(q); if(qs.length>=count)break; }
   }
   return qs.slice(0,count);
 }
 function interventionText(priorities, disc){
   if(!$('#v59IncludePlan')?.checked)return '';
   if(I()?.suggestText)return I().suggestText(priorities,disc,4);
   return priorities.slice(0,4).map(p=>`${p.descriptor}: retomar ${descriptorText(disc,p.descriptor)} com explicação curta, exemplo resolvido, prática guiada e correção comentada.`).join('\n');
 }
 function htmlQuestion(q,i){
   const alts=(q.alts||[]).map(a=>`<li>${safe(a)}</li>`).join('');
   return `<div class="print-question"><p><b>${i}. (${safe(q.descriptor||'')})</b> ${safe(q.enunciado||'Questão de treino.')}</p>${q.textBase?`<div class="print-textbase">${safe(q.textBase)}</div>`:''}<ol type="A">${alts}</ol></div>`;
 }
 function textQuestion(q,i){
   return `${i}. (${q.descriptor||''}) ${q.enunciado||'Questão de treino.'}\n${q.textBase?`Texto-base: ${q.textBase}\n`:''}${(q.alts||[]).join('\n')}\n`;
 }
 function buildSheet(student, idx, opts={}){
   const a=assessment(); const r=results(); const disc=a.discipline||a.disciplina||A()?.state?.settings?.discipline||'Língua Portuguesa';
   const count=Math.max(1,Math.min(40,Number($('#v59Count')?.value)||10));
   let pr=manualPriorities(); if(!pr.length) pr=idx>=0?studentPriorities(idx):classPriorities(); if(!pr.length) pr=[{descriptor:'D1',errors:1}];
   const qs=selectQuestions(pr,disc,count,student?.name||student?.nome);
   if(opts.record!==false && student?.name)recordUsage(student.name,qs);
   const key=$('#v59IncludeKey')?.checked!==false;
   const orient=interventionText(pr,disc);
   const title=student?`Ficha de Recuperação Individual`:`Ficha de Recuperação da Turma`;
   const aluno=student?.name||student?.nome||'Turma';
   const turma=a.turma||'';
   const desempenho=student?`${student.total||0}/${r.summary?.nQuestions||0} acertos (${student.percent||0}%) • ${student.level||''}`:`Média da turma: ${r.summary?.avg||0}`;
   const prHtml=pr.map(p=>`<span class="mini-tag">${safe(p.descriptor)}</span>`).join(' ');
   const qsHtml=qs.map((q,i)=>htmlQuestion(q,i+1)).join('');
   const keyHtml=key?`<div class="print-key"><b>Gabarito:</b> ${qs.map((q,i)=>`${i+1}-${q.key||'C'}`).join(' | ')}</div>`:'';
   const orientHtml=orient?`<div class="print-orient"><b>Orientação pedagógica:</b><br>${safe(orient).replace(/\n/g,'<br>')}</div>`:'';
   const html=`<article class="print-sheet">
     <header class="print-head"><div><b>VETOR</b><br><span>${safe(a.title||'Avaliação')}</span></div><div><b>${safe(title)}</b><br>${new Date().toLocaleDateString('pt-BR')}</div></header>
     <div class="print-meta"><b>Aluno:</b> ${safe(aluno)} &nbsp; <b>Turma:</b> ${safe(turma)} &nbsp; <b>Disciplina:</b> ${safe(disc)}<br><b>Desempenho atual:</b> ${safe(desempenho)}<br><b>Descritores prioritários:</b> ${prHtml}</div>
     ${orientHtml}
     ${qsHtml}
     ${keyHtml}
   </article>`;
   const text=`VETOR\n${title}\nAluno: ${aluno}\nTurma: ${turma}\nDisciplina: ${disc}\nDesempenho atual: ${desempenho}\nDescritores prioritários: ${pr.map(p=>p.descriptor).join(', ')}\n\n${orient?`Orientação pedagógica:\n${orient}\n\n`:''}${qs.map((q,i)=>textQuestion(q,i+1)).join('\n')}${key?`\nGabarito: ${qs.map((q,i)=>`${i+1}-${q.key||'C'}`).join(' | ')}\n`:''}`;
   return {html,text,questions:qs,priorities:pr,student:aluno};
 }
 function selectedStudents(){
   const r=results(); const students=r.students||[]; const type=$('#v59PackType')?.value||'turma';
   const threshold=Number($('#v59Threshold')?.value)||60;
   if(type==='individual'){
     const idx=Number($('#v59Student')?.value||0);
     return students[idx]?[{student:students[idx],idx}]:[];
   }
   if(type==='risco')return students.map((s,idx)=>({student:s,idx})).filter(x=>(x.student.percent||0)<threshold);
   if(type==='descritor')return [{student:null,idx:-1}];
   return students.map((s,idx)=>({student:s,idx}));
 }
 function generate(){
   const r=results(); if(!(r.summary?.nQuestions||0)){setStatus('Importe ou abra uma avaliação antes de gerar fichas.','error'); return;}
   const selected=selectedStudents();
   if(!selected.length){setStatus('Nenhum aluno encontrado para o critério selecionado.','error'); return;}
   const pageBreaks=$('#v59PageBreaks')?.checked!==false;
   const sheets=selected.map(x=>buildSheet(x.student,x.idx));
   const sep=pageBreaks?'<div class="page-break"></div>':'<hr>';
   const html=sheets.map(x=>x.html).join(sep);
   const text=sheets.map(x=>x.text).join('\n\n------------------------------\n\n');
   $('#v59Preview')&&($('#v59Preview').innerHTML=html);
   $('#v59Output')&&($('#v59Output').value=text);
   window.__IMPRESSAO_LAST={html,text,count:sheets.length,sheets};
   setStatus(`${sheets.length} ficha(s) gerada(s). Revise a prévia antes de imprimir.`, 'ok');
 }
 function setStatus(msg,type='work'){const el=$('#v59Status'); if(A()?.status)A().status(el,msg,type); else if(el)el.textContent=msg;}
 function printNow(){
   if(!window.__IMPRESSAO_LAST)generate();
   const content=window.__IMPRESSAO_LAST?.html||$('#v59Preview')?.innerHTML||'';
   const w=window.open('','_blank');
   if(!w){alert('Permita pop-ups para imprimir.');return;}
   const css=document.querySelector('link[href*="style.css"]')?.outerHTML||'';
   w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Impressão V68.7</title>${css}<style>body{background:#fff}.print-sheet{box-shadow:none;border:1px solid #ddd;margin:0 0 18px}.page-break{page-break-after:always}@media print{button{display:none}.print-sheet{page-break-inside:avoid}}</style></head><body>${content}</body></html>`);
   w.document.close(); setTimeout(()=>w.print(),500);
 }
 function downloadWord(){
   if(!window.__IMPRESSAO_LAST)generate();
   const html=`<html><head><meta charset="utf-8"></head><body>${window.__IMPRESSAO_LAST?.html||''}</body></html>`;
   download(`fichas_${Date.now()}.doc`, html, 'application/msword;charset=utf-8');
 }
 function downloadTxt(){
   if(!window.__IMPRESSAO_LAST)generate();
   download(`fichas_${Date.now()}.txt`, window.__IMPRESSAO_LAST?.text||'', 'text/plain;charset=utf-8');
 }
 function summary(){
   const r=results(); const pr=classPriorities(); const a=assessment();
   const txt=`RELATÓRIO DE IMPRESSÃO / RECUPERAÇÃO - V68.7\n\nTurma: ${a.turma||''}\nDisciplina: ${a.discipline||''}\nAvaliação: ${a.title||''}\nAlunos: ${r.summary?.nStudents||0}\nQuestões da avaliação: ${r.summary?.nQuestions||0}\nMédia: ${r.summary?.avg||0}\n\nDescritores prioritários:\n${pr.map(p=>'- '+p.descriptor+' - '+descriptorText(a.discipline,p.descriptor)).join('\n')}\n\nAções sugeridas:\n${interventionText(pr,a.discipline)}\n`;
   $('#v59Output')&&($('#v59Output').value=txt);
   $('#v59Preview')&&($('#v59Preview').innerHTML='<pre class="print-report">'+safe(txt)+'</pre>');
   window.__IMPRESSAO_LAST={html:'<pre>'+safe(txt)+'</pre>',text:txt,count:1,sheets:[]};
   setStatus('Relatório da coordenação gerado.', 'ok');
 }
 function populateStudents(){
   const sel=$('#v59Student'); if(!sel)return;
   const old=sel.value; const sts=results().students||[];
   sel.innerHTML=sts.map((s,i)=>`<option value="${i}">${safe(s.name||s.nome||('Aluno '+(i+1)))}</option>`).join('');
   if(old && sel.querySelector(`option[value="${old}"]`))sel.value=old;
 }
 function render(){populateStudents();}
 function bind(){
   $('#v59Generate')&&($('#v59Generate').onclick=generate);
   $('#v59Print')&&($('#v59Print').onclick=printNow);
   $('#v59Word')&&($('#v59Word').onclick=downloadWord);
   $('#v59Txt')&&($('#v59Txt').onclick=downloadTxt);
   $('#v59Summary')&&($('#v59Summary').onclick=summary);
   ['v59PackType','v59Student','v59Count','v59Threshold','v59ManualDesc','v59Difficulty'].forEach(id=>{const el=$('#'+id); if(el)el.onchange=()=>{ if(window.__IMPRESSAO_LAST) generate(); };});
 }
 window.Impressao={render,generate,printNow,downloadWord,downloadTxt,summary};
 document.addEventListener('DOMContentLoaded',()=>{bind();render();});
})();

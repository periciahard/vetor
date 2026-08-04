(function(){
 const A=()=>window.VETOR; const B=()=>window.BancoQuestoes;
 function $(s){return document.querySelector(s)}
 function safe(s){return A()?.safe?A().safe(s??''):String(s??'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));}
 function normDesc(x){return String(x||'').trim().toUpperCase().replace(/^DESCRITOR\s*/,'').replace(/^D\s*/,'D');}
 function download(name, content, type='text/plain;charset=utf-8'){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);}
 function assessment(){return A()?.state?.assessment||{};}
 function results(){return A()?.getResults?A().getResults():{students:[],summary:{},descriptorStats:[]};}
 function getUsage(){try{return JSON.parse(localStorage.getItem('vetor_question_usage')||'{}')}catch{return {}}}
 function setUsage(u){localStorage.setItem('vetor_question_usage',JSON.stringify(u));}
 function questionKey(q){return q.id||[q.discipline,q.descriptor,q.enunciado].join('|').slice(0,160);}
 function recordUsage(studentName, qs){const u=getUsage(); const k=studentName||'turma'; u[k]=u[k]||[]; qs.forEach(q=>{const id=questionKey(q); if(!u[k].includes(id))u[k].push(id)}); setUsage(u);}
 function prioritiesForStudent(idx){return B()?.priorityDescriptors?B().priorityDescriptors(idx):[];}
 function prioritiesForClass(){const r=results(); return (r.descriptorStats||[]).slice().sort((a,b)=>a.percent-b.percent).slice(0,4).map(d=>({descriptor:d.descritor,errors:Math.max(1,100-d.percent)}));}
 function manualPriorities(){const raw=$('#v57ManualDesc')?.value||''; return raw.split(/[,;\s]+/).map(normDesc).filter(Boolean).map(d=>({descriptor:d,errors:1}));}
 function selectQs(priorities, disc, count, studentName){
   let qs=(B()?.selectQuestions?B().selectQuestions(priorities,disc,count*3,{balance:($('#v57Difficulty')?.value||'balanceada')==='balanceada'}):[]);
   const difficulty=$('#v57Difficulty')?.value||'balanceada';
   if(difficulty!=='balanceada'){
     const map={facil:'Fácil',media:'Média',dificil:'Difícil'}; const pref=map[difficulty];
     qs=qs.sort((a,b)=>(a.difficulty===pref?-1:1)-(b.difficulty===pref?-1:1));
   }
   if($('#v57AvoidUsed')?.checked && studentName){
     const used=new Set((getUsage()[studentName]||[]));
     const filtered=qs.filter(q=>!used.has(questionKey(q)));
     if(filtered.length>=count) qs=filtered;
   }
   return qs.slice(0,count);
 }
 function descriptorText(disc, code){const item=(window.Descritores?.list(disc)||[]).find(x=>x.codigo===code); return item?.texto||'Descritor priorizado para recomposição da aprendizagem.';}
 function intervention(pr, disc){
   if(window.Intervencoes?.suggestText) return window.Intervencoes.suggestText(pr,disc,3);
   if(!pr.length) return 'Manter rotina de aprofundamento com itens variados e correção comentada.';
   return pr.slice(0,3).map(p=>`${p.descriptor}: retomar ${descriptorText(disc,p.descriptor)} com leitura guiada, exemplos resolvidos, exercícios graduados e devolutiva comentada.`).join(' ');
 }
 function buildSheet(student, idx, opts={}){
   const a=assessment(); const r=results(); const disc=a.discipline||a.disciplina||A()?.state?.settings?.discipline||'Língua Portuguesa'; const count=Number($('#v57Count')?.value)||10;
   let pr=manualPriorities(); if(!pr.length) pr=(idx>=0?prioritiesForStudent(idx):prioritiesForClass());
   if(!pr.length) pr=[{descriptor:'D1',errors:1},{descriptor:'D2',errors:1},{descriptor:'D3',errors:1}];
   const qs=selectQs(pr,disc,count,student?.name); if(opts.record!==false && student?.name) recordUsage(student.name,qs);
   const key=$('#v57IncludeKey')?.checked!==false;
   const plan=$('#v57IncludePlan')?.checked!==false;
   const metaStudent=student?`${student.name}`:'Turma';
   const desempenho=student?`${student.total||0}/${r.summary?.nQuestions||0} acertos (${student.percent||0}%) • ${student.level||''}`:`Média da turma: ${r.summary?.avg||0}`;
   return {student:metaStudent, questions:qs, priorities:pr, html:`<div class="ficha-page"><div class="ficha-head"><div><h2>VETOR</h2><div>Ficha de Recuperação / Recomposição da Aprendizagem</div></div><div><b>fichas</b></div></div><div class="ficha-meta"><div><b>Aluno:</b> ${safe(metaStudent)}</div><div><b>Turma:</b> ${safe(a.turma||a.className||'')}</div><div><b>Disciplina:</b> ${safe(disc)}</div><div><b>Avaliação:</b> ${safe(a.title||a.nome||'')}</div><div><b>Desempenho atual:</b> ${safe(desempenho)}</div><div><b>Descritores prioritários:</b> ${safe(pr.map(p=>p.descriptor).join(', ')||'-')}</div></div>${plan?`<div class="texto-base"><b>Orientação pedagógica:</b> ${safe(intervention(pr,disc))}</div>`:''}${qs.map((q,i)=>`<div class="qitem"><b>${i+1}. [${safe(q.descriptor)} • ${safe(q.difficulty||'Média')}]</b>${q.textBase?`<div class="texto-base">${safe(q.textBase)}</div>`:''}<p>${safe(q.enunciado)}</p><div>${safe((q.alts||[]).join('\n')).replace(/\n/g,'<br>')}</div></div>`).join('')}${key?`<div class="keybox"><b>Gabarito:</b> ${qs.map((q,i)=>`${i+1}) ${q.key||'C'}`).join(' • ')}</div>`:''}</div>`, text:`VETOR\nFicha de Recuperação / Recomposição da Aprendizagem\nAluno: ${metaStudent}\nTurma: ${a.turma||''}\nDisciplina: ${disc}\nAvaliação: ${a.title||''}\nDesempenho atual: ${desempenho}\nDescritores prioritários: ${pr.map(p=>p.descriptor).join(', ')||'-'}\n\n${plan?'Orientação pedagógica: '+intervention(pr,disc)+'\n\n':''}${qs.map((q,i)=>`${i+1}. [${q.descriptor} • ${q.difficulty||'Média'}]\n${q.textBase?'Texto-base: '+q.textBase+'\n':''}${q.enunciado}\n${(q.alts||[]).join('\n')}`).join('\n\n')}${key?'\n\nGABARITO\n'+qs.map((q,i)=>`${i+1}) ${q.key||'C'}`).join('\n'):''}`};
 }
 function buildAll(){
   const r=results(); const scope=$('#v57Scope')?.value||'individual'; const idx=Number($('#sheetStudent')?.value); const threshold=Number($('#v57Threshold')?.value)||60;
   let students=[];
   if(scope==='individual'){
     const s=r.students?.[idx]; if(!s) throw new Error('Selecione um aluno.'); students=[{s,idx}];
   } else if(scope==='turma') students=(r.students||[]).map((s,idx)=>({s,idx}));
   else if(scope==='risco') students=(r.students||[]).map((s,idx)=>({s,idx})).filter(x=>(x.s.percent||0)<threshold);
   else if(scope==='descritor') students=[{s:null,idx:-1}];
   if(!students.length) throw new Error('Nenhum estudante encontrado para esse critério.');
   const sheets=students.map(x=>buildSheet(x.s,x.idx));
   return {html:`<div class="ficha-doc">${sheets.map(s=>s.html).join('')}</div>`, text:sheets.map(s=>s.text).join('\n\n==============================\n\n'), count:sheets.length};
 }
 let current={html:'',text:''};
 function render(){
   try{current=buildAll(); $('#v57Preview').classList.remove('empty'); $('#v57Preview').innerHTML=current.html; $('#sheetOutput').value=current.text; $('#v57Status').textContent=`Gerado com sucesso: ${current.count} ficha(s).`;}
   catch(e){$('#v57Status').textContent=e.message; $('#v57Preview').classList.add('empty'); $('#v57Preview').textContent='Não foi possível gerar a ficha.';}
 }
 function print(){if(!current.html) render(); const w=window.open('','_blank'); w.document.write(`<html><head><title>Fichas fichas</title><style>body{font-family:Arial,sans-serif}.ficha-page{page-break-after:always;padding:18px}.ficha-head{border-bottom:2px solid #0f2e5f;margin-bottom:12px}.ficha-head h2{color:#0f2e5f;margin:0}.ficha-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}.qitem{margin:10px 0;padding:8px;border:1px solid #ddd}.texto-base{background:#f4f7fb;border-left:4px solid #0f2e5f;padding:8px;margin:6px 0}.keybox{border-top:1px dashed #999;margin-top:12px;padding-top:8px}</style></head><body>${current.html}</body></html>`); w.document.close(); setTimeout(()=>w.print(),400);}
 function word(){if(!current.html) render(); const html=`<html><head><meta charset="utf-8"><style>body{font-family:Arial}.ficha-page{page-break-after:always}.ficha-head{border-bottom:2px solid #0f2e5f}.qitem{margin:10px 0}.texto-base{background:#f4f7fb;border-left:4px solid #0f2e5f;padding:8px}</style></head><body>${current.html}</body></html>`; download('fichas-recuperacao.doc',html,'application/msword;charset=utf-8');}
 function bind(){
   $('#v57Generate')&&($('#v57Generate').onclick=render); $('#v57Print')&&($('#v57Print').onclick=print); $('#v57Doc')&&($('#v57Doc').onclick=word); $('#v57Txt')&&($('#v57Txt').onclick=()=>{if(!current.text)render(); download('fichas-recuperacao.txt',current.text);});
   $('#v57ClearUsage')&&($('#v57ClearUsage').onclick=()=>{if(confirm('Limpar histórico de questões já usadas?')){localStorage.removeItem('vetor_question_usage');$('#v57Status').textContent='Histórico de uso limpo.';}});
 }
 document.addEventListener('DOMContentLoaded',bind);
 window.Fichas={render,buildAll,print,word};
})();

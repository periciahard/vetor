
(function(){
 'use strict';
 const A=()=>window.VETOR;
 const $=s=>document.querySelector(s);
 function safe(s){return A()?.safe?A().safe(s??''):String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));}
 function norm(s){return String(s??'').trim();}
 function compute(a){return window.Diagnostico?.compute(a)||{students:[],descriptorStats:[],summary:{avg:0,nStudents:0,nQuestions:0,levels:{}}};}
 function list(){
   const cur=A()?.state?.assessment;
   const arr=(A()?.state?.assessments||[]).slice();
   if(cur?.id && (cur.students||[]).length && (cur.questions||[]).length && !arr.some(x=>x.id===cur.id)) arr.unshift(cur);
   return arr.filter(x=>(x.students||[]).length && (x.questions||[]).length).sort((a,b)=>(a.date||'').localeCompare(b.date||'') || label(a).localeCompare(label(b),'pt-BR'));
 }
 function typeLabel(t){
   const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
   for(let i=1;i<=10;i++)map['simulado'+i]='Simulado '+i;
   return map[t]||t||'Avaliação';
 }
 function label(a){return `${a.turma||'Turma?'} • ${a.discipline||'Disciplina?'} • ${typeLabel(a.tipo)} • ${a.title||''} • ${a.date||''}`;}
 function filtered(){
   const turma=$('#evoTurma')?.value||'', disc=$('#evoDisc')?.value||'';
   return list().filter(a=>(!turma||a.turma===turma)&&(!disc||a.discipline===disc));
 }
 function unique(arr){return [...new Set(arr.filter(Boolean))];}
 function renderSelects(){
   const all=list();
   const turmas=unique(all.map(a=>a.turma)).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
   const turmaSel=$('#evoTurma'); if(turmaSel){const old=turmaSel.value; turmaSel.innerHTML='<option value="">Todas</option>'+turmas.map(t=>`<option value="${safe(t)}">${safe(t)}</option>`).join(''); if(turmas.includes(old))turmaSel.value=old;}
   const arr=filtered();
   const opts='<option value="">Selecione</option>'+arr.map(a=>`<option value="${safe(a.id)}">${safe(label(a))}</option>`).join('');
   ['#evoA','#evoB'].forEach(id=>{const el=$(id); if(el){const old=el.value; el.innerHTML=opts; if(arr.some(a=>a.id===old))el.value=old;}});
   const stSel=$('#evoStudent'); if(stSel){
      const names=unique(arr.flatMap(a=>(a.students||[]).map(s=>s.name||s.nome))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
      const old=stSel.value; stSel.innerHTML='<option value="">Selecione</option>'+names.map(n=>`<option value="${safe(n)}">${safe(n)}</option>`).join(''); if(names.includes(old))stSel.value=old;
   }
 }
 function bar(percent){const p=Math.max(0,Math.min(100,Number(percent)||0)); return `<div class="evo-bar"><span style="width:${p}%"></span><b>${p}%</b></div>`;}
 function renderTimeline(){
   const box=$('#evoTimeline'); if(!box)return;
   const arr=filtered(); if(!arr.length){box.innerHTML='<p class="empty">Nenhuma avaliação salva para os filtros selecionados.</p>'; return;}
   const rows=arr.map(a=>({a,r:compute(a)}));
   box.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Avaliação</span><span>Data</span><span>Alunos</span><span>Média</span><span>Evolução visual</span></div>'+
     rows.map(x=>`<div class="preview-row"><span><b>${safe(typeLabel(x.a.tipo))}</b><br>${safe(x.a.title||'')}</span><span>${safe(x.a.date||'-')}</span><span>${x.r.summary.nStudents}</span><span><b>${x.r.summary.avg}%</b></span><span>${bar(x.r.summary.avg)}</span></div>`).join('')+'</div>';
 }
 function byId(id){return list().find(a=>a.id===id);}
 function mapDesc(r){return Object.fromEntries((r.descriptorStats||[]).map(d=>[d.descritor||d.descriptor,d.percent]));}
 function directCompare(){
   const box=$('#evoDirectCompare'); if(!box)return;
   const a=byId($('#evoA')?.value), b=byId($('#evoB')?.value);
   if(!a||!b){box.innerHTML='<p class="hint">Escolha duas avaliações para comparar diretamente.</p>'; return;}
   const ra=compute(a), rb=compute(b), diff=Math.round(((rb.summary.avg||0)-(ra.summary.avg||0))*10)/10;
   const cls=diff>=0?'ok':'bad';
   const elemA=(ra.summary.levels?.['Elementar I']||0)+(ra.summary.levels?.['Elementar II']||0);
   const elemB=(rb.summary.levels?.['Elementar I']||0)+(rb.summary.levels?.['Elementar II']||0);
   const txt=diff>0?`Houve crescimento de ${diff} ponto(s) percentuais.`:diff<0?`Houve queda de ${Math.abs(diff)} ponto(s) percentuais.`:'O desempenho médio ficou estável.';
   box.innerHTML=`<div class="cards small"><div class="card"><span>Avaliação inicial</span><b>${ra.summary.avg}%</b></div><div class="card"><span>Avaliação final</span><b>${rb.summary.avg}%</b></div><div class="card ${cls}"><span>Diferença</span><b>${diff>0?'+':''}${diff} p.p.</b></div><div class="card"><span>Elementar I/II</span><b>${elemA} → ${elemB}</b></div></div><p class="hint"><b>Leitura:</b> ${txt} Verifique abaixo os descritores que mais cresceram e os que ainda precisam de intervenção.</p>`;
   renderDescriptor();
 }
 function renderDescriptor(){
   const box=$('#evoDescriptor'); if(!box)return;
   const a=byId($('#evoA')?.value), b=byId($('#evoB')?.value);
   if(!a||!b){box.innerHTML='<p class="hint">A comparação por descritor aparecerá após escolher duas avaliações.</p>'; return;}
   const ma=mapDesc(compute(a)), mb=mapDesc(compute(b));
   const codes=unique([...Object.keys(ma),...Object.keys(mb)]).sort((x,y)=>x.localeCompare(y,'pt-BR',{numeric:true}));
   const rows=codes.map(d=>({d,pa:ma[d],pb:mb[d],diff:Math.round(((mb[d]??0)-(ma[d]??0))*10)/10})).sort((x,y)=>x.diff-y.diff);
   box.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Descritor</span><span>Inicial</span><span>Final</span><span>Diferença</span><span>Leitura</span></div>'+
     rows.map(r=>`<div class="preview-row"><span><b>${safe(r.d)}</b></span><span>${r.pa==null?'-':r.pa+'%'}</span><span>${r.pb==null?'-':r.pb+'%'}</span><span class="${r.diff>=0?'oktext':'badtext'}">${r.diff>0?'+':''}${r.diff} p.p.</span><span>${r.diff>=10?'Crescimento relevante':r.diff>=0?'Estável/leve melhora':'Precisa de retomada'}</span></div>`).join('')+'</div>';
 }
 function studentScore(a, name){
   const r=compute(a); const s=(r.students||[]).find(x=>(x.name||x.nome||'').toUpperCase()===name.toUpperCase());
   return s?{percent:s.percent,level:s.level,total:s.total,n:r.summary.nQuestions}:null;
 }
 function renderStudent(){
   const box=$('#evoStudentPanel'); if(!box)return;
   const name=$('#evoStudent')?.value; if(!name){box.innerHTML='<p class="hint">Selecione um aluno para visualizar sua evolução.</p>'; return;}
   const arr=filtered().map(a=>({a,score:studentScore(a,name)})).filter(x=>x.score);
   if(!arr.length){box.innerHTML='<p class="empty">Aluno não encontrado nas avaliações filtradas.</p>'; return;}
   box.innerHTML=`<h4>${safe(name)}</h4><div class="preview-table evo-table"><div class="preview-row"><span>Avaliação</span><span>Data</span><span>Desempenho</span><span>Nível</span><span>Evolução visual</span></div>`+
    arr.map(x=>`<div class="preview-row"><span><b>${safe(typeLabel(x.a.tipo))}</b><br>${safe(x.a.title||'')}</span><span>${safe(x.a.date||'-')}</span><span>${x.score.percent}% (${x.score.total}/${x.score.n})</span><span>${safe(x.score.level)}</span><span>${bar(x.score.percent)}</span></div>`).join('')+'</div>';
 }
 function exportTxt(){
   const arr=filtered(); const a=byId($('#evoA')?.value), b=byId($('#evoB')?.value);
   let txt='RELATÓRIO DE EVOLUÇÃO - V68.7.1\n\n';
   txt+='Avaliações filtradas:\n'+arr.map(x=>`- ${label(x)} | média ${compute(x).summary.avg}%`).join('\n')+'\n\n';
   if(a&&b){const ra=compute(a),rb=compute(b); txt+=`Comparação direta:\nInicial: ${label(a)} - ${ra.summary.avg}%\nFinal: ${label(b)} - ${rb.summary.avg}%\nDiferença: ${Math.round((rb.summary.avg-ra.summary.avg)*10)/10} p.p.\n`;}
   A()?.download?.('relatorio_evolucao.txt',txt);
 }
 function status(){
   const el=$('#evoStatus'); if(!el)return; const n=filtered().length;
   el.className='statusbox '+(n>=2?'status-ok':'status-work');
   el.innerHTML=n>=2?`✅ ${n} avaliação(ões) salva(s) disponível(is) para evolução.`:'Salve pelo menos duas avaliações com dados para comparar evolução.';
 }
 function render(){renderSelects(); renderTimeline(); directCompare(); renderStudent(); status();}
 function bind(){
   ['#evoTurma','#evoDisc','#evoA','#evoB','#evoStudent'].forEach(id=>{const el=$(id); if(el)el.onchange=render;});
   $('#evoCompare')&&($('#evoCompare').onclick=()=>{directCompare(); renderDescriptor();});
   $('#evoStudentBtn')&&($('#evoStudentBtn').onclick=renderStudent);
   $('#evoExport')&&($('#evoExport').onclick=exportTxt);
 }
 window.Evolucao={render,directCompare,renderStudent,exportTxt};
 document.addEventListener('DOMContentLoaded',()=>{bind();render();});
})();


(function(){
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const A=()=>window.VETOR;
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const norm=s=>String(s??'').trim();

function tipoLabel(t){
 const map={diagnostica:'Diagnóstica',simulado:'Simulado',recuperacao:'Recuperação',avaliacao:'Avaliação',bimestral:'Avaliação',personalizada:'Personalizada'};
 for(let i=1;i<=10;i++)map['simulado'+i]='Simulado '+i;
 return map[t]||t||'Avaliação';
}
function assessments(){return (A()?.state?.assessments||[]);}
function withData(){return assessments().filter(x=>(x.students||[]).length&&(x.questions||[]).length);}
function turmaList(){return Object.keys(window.TurmasVetor?.getTurmas?.()||{}).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));}

function patchImportLayout(){
 const sec=$('#importar'); if(!sec)return;
 const model=sec.querySelector('.modelbox');
 const tabs=sec.querySelector('.import-tabs');
 const excel=$('#excelTab');
 const validation=sec.querySelector('.validationGate');
 const active=sec.querySelector('.activeAssessmentPanel');
 const history=$('#assessmentHistory')?.closest('.panel');
 if(model && tabs && excel && validation){
   model.after(tabs); tabs.after(excel); excel.after(validation);
   if(active) validation.after(active);
   if(history && active) active.after(history);
 }
 $('#loadExample')?.remove();
 $('#duplicateStructure')?.remove();
 const histText=history?.querySelector('.hint');
 if(histText)histText.textContent='Abra avaliações já salvas. O histórico preserva diagnósticas, simulados e recuperações já importadas.';
}

function populateTurmaSelect(){
 const sel=$('#assessmentClass'); if(!sel)return;
 const cur=sel.value || A()?.state?.assessment?.turma || '';
 const list=turmaList();
 if(sel.tagName.toLowerCase()==='select'){
   const multi=A()?.MULTI_TURMAS_VALUE||'__varias_turmas__';
   sel.innerHTML='<option value="">Selecione a turma</option>'+`<option value="${multi}">Várias turmas (identificar pelas planilhas)</option>`+list.map(t=>`<option value="${safe(t)}">${safe(t)}</option>`).join('');
   if(cur && (cur===multi || list.includes(cur)))sel.value=cur;
 }
}

function usedTypeSet(turma,disc,currentId){
 return new Set();
}
function refreshTypeOptions(){
 const app=A(); if(!app)return;
 const sel=$('#assessmentType'); if(!sel)return;
 $$('option',sel).forEach(opt=>{
   if(!opt.value)return;
   opt.hidden=false;
   opt.disabled=false;
 });
}

function isDuplicateCandidate(meta,currentId){
 const title=norm(meta.title).toLowerCase();
 return assessments().find(x=>{
   if(x.id===currentId)return false;
   const sameBase=norm(x.turma)===norm(meta.turma) && norm(x.discipline)===norm(meta.discipline);
   if(!sameBase)return false;
   if(title && norm(x.title).toLowerCase()===title)return true;
   return false;
 });
}

function patchSaveDuplicateBlock(){
 const app=A(); if(!app || app.__savePatch)return;
 app.__savePatch=true;
 const old=app.saveAssessmentMeta.bind(app);
 app.saveAssessmentMeta=function(){
   this.syncMetaFromInputs(false);
   const a=this.state.assessment||{};
   const box=$('#assessmentSaveStatus');
   const duplicate=isDuplicateCandidate(a,a.id);
   if(duplicate){
     const msg=`Já existe uma avaliação cadastrada para esta turma/disciplina com o mesmo nome: <b>${safe(duplicate.title||tipoLabel(duplicate.tipo))}</b>. Abra a avaliação existente no histórico ou altere o nome.`;
     this.status(box,msg,'error');
     this.updateImportLock?.();
     return;
   }
   return old();
 };
}

function patchHome(){
 const box=$('#homeInsights'); if(!box)return;
 const app=A(); const a=app?.state?.assessment||{}; const r=app?.getResults?.();
 if(!r || !r.summary?.nStudents){
   box.innerHTML='<h3>Resumo rápido</h3><p class="hint">Escolha uma turma, importe uma avaliação e confirme os dados para visualizar o diagnóstico.</p>';
   return;
 }
 box.innerHTML=`<h3>Resumo rápido</h3><div class="cards small"><div class="card"><span>Turma</span><b>${safe(a.turma||'-')}</b></div><div class="card"><span>Disciplina</span><b>${safe(a.discipline||'-')}</b></div><div class="card"><span>Avaliação</span><b>${safe(a.title||tipoLabel(a.tipo))}</b></div><div class="card"><span>Média</span><b>${r.summary.avg}</b></div></div>`;
}

function patchCloudAndJson(){
 $('.cloud-panel')?.classList.add('hidden-tecnico');
 $('#cloudStatusMini') && ($('#cloudStatusMini').textContent='Modo local');
 const cfg=$('#config');
 if(cfg){
   const p=cfg.querySelector('.panel p');
   if(p)p.textContent='Os dados ficam salvos neste dispositivo. Para segurança, faça backup técnico periodicamente.';
 }
}

function alunosDaAvaliacao(){
 return A()?.getResults?.().students||[];
}
function populateRiskSelect(selector,scopeSelector,thresholdSelector){
 const sel=$(selector); if(!sel)return;
 const scope=$(scopeSelector)?.value||'individual';
 const threshold=Number($(thresholdSelector)?.value)||60;
 let arr=alunosDaAvaliacao().map((s,i)=>({s,i}));
 if(scope==='risco')arr=arr.filter(x=>(x.s.percent||0)<threshold);
 const cur=sel.value;
 sel.innerHTML='<option value="">Selecione</option>'+arr.map(x=>`<option value="${x.i}">${safe(x.s.name||x.s.nome||'Aluno '+(x.i+1))} — ${x.s.percent||0}%</option>`).join('');
 if(arr.some(x=>String(x.i)===String(cur)))sel.value=cur;
}
function patchFichaSelectors(){
 populateRiskSelect('#sheetStudent','#v57Scope','#v57Threshold');
 populateRiskSelect('#v59Student','#v59PackType','#v59Threshold');
}

function ensurePrintNotBlank(){
 // Corrige comportamento comum: se a prévia estiver vazia, gera antes de imprimir/exportar.
 const oldPrint=window.Impressao?.printNow;
 if(window.Impressao && !window.Impressao.__correcoesPatch){
   window.Impressao.__correcoesPatch=true;
   window.Impressao.printNow=function(){
     const preview=$('#v59Preview');
     if(!window.__IMPRESSAO_LAST || !preview || !preview.textContent.trim() || preview.classList.contains('empty')){
       window.Impressao.generate?.();
     }
     const html=window.__IMPRESSAO_LAST?.html||preview?.innerHTML||'';
     if(!html.trim()){alert('Não há conteúdo para imprimir. Gere o pacote primeiro.');return;}
     return oldPrint ? oldPrint() : window.print();
   };
 }
}

function listFiltered(){
 const turma=$('#evoTurma')?.value||'';
 const disc=$('#evoDisc')?.value||'';
 return withData().filter(a=>(!turma||a.turma===turma)&&(!disc||a.discipline===disc))
   .sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.tipo||'').localeCompare(b.tipo||'', 'pt-BR', {numeric:true}));
}
function compute(a){return window.Diagnostico?.compute(a)||{students:[],descriptorStats:[],summary:{avg:0,nStudents:0,nQuestions:0,levels:{}}};}
function bar(p){p=Math.max(0,Math.min(100,Number(p)||0)); return `<div class="evo-bar"><span style="width:${p}%"></span><b>${p}%</b></div>`;}
function renderEvolucaoAutomatica(){
 if(!$('#evoTimeline'))return;
 const app=A(); if(!app)return;
 // selectors
 const turmas=[...new Set(withData().map(a=>a.turma).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
 const oldTurma=$('#evoTurma')?.value||'';
 if($('#evoTurma')){
   $('#evoTurma').innerHTML='<option value="">Todas</option>'+turmas.map(t=>`<option value="${safe(t)}">${safe(t)}</option>`).join('');
   if(turmas.includes(oldTurma))$('#evoTurma').value=oldTurma;
 }
 const list=listFiltered();
 const st=$('#evoStatus');
 if(st){st.className='statusbox '+(list.length>=2?'status-ok':'status-work'); st.innerHTML=list.length?`${list.length} avaliação(ões) encontrada(s) para os filtros selecionados.`:'Nenhuma avaliação encontrada para os filtros selecionados.';}
 const timeline=$('#evoTimeline');
 timeline.innerHTML=list.length?'<div class="preview-table evo-table"><div class="preview-row"><span>Avaliação</span><span>Turma</span><span>Data</span><span>Alunos</span><span>Média</span><span>Evolução</span></div>'+
  list.map(a=>{const r=compute(a); return `<div class="preview-row"><span><b>${safe(tipoLabel(a.tipo))}</b><br>${safe(a.title||'')}</span><span>${safe(a.turma||'-')}</span><span>${safe(a.date||'-')}</span><span>${r.summary.nStudents}</span><span><b>${r.summary.avg}</b></span><span>${bar(r.summary.avg)}</span></div>`}).join('')+'</div>':'<p class="hint">Salve avaliações para visualizar evolução.</p>';
 // automatic comparison between consecutive evaluations
 const direct=$('#evoDirectCompare');
 if(direct){
   if(list.length<2) direct.innerHTML='<p class="hint">Salve pelo menos duas avaliações para comparar automaticamente.</p>';
   else {
    let rows='';
    for(let i=1;i<list.length;i++){
      const a=list[i-1], b=list[i], ra=compute(a), rb=compute(b);
      const diff=Math.round(((rb.summary.avg||0)-(ra.summary.avg||0))*10)/10;
      rows+=`<div class="preview-row"><span>${safe(tipoLabel(a.tipo))} → ${safe(tipoLabel(b.tipo))}</span><span>${ra.summary.avg}%</span><span>${rb.summary.avg}%</span><span class="${diff>=0?'oktext':'badtext'}">${diff>0?'+':''}${diff}%</span><span>${diff>=0?'Melhora/estabilidade':'Queda'}</span></div>`;
    }
    direct.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Comparação</span><span>Antes</span><span>Depois</span><span>Diferença</span><span>Leitura</span></div>'+rows+'</div>';
   }
 }
 // descriptor evolution, first vs last
 const desc=$('#evoDescriptor');
 if(desc){
  if(list.length<2) desc.innerHTML='<p class="hint">A evolução por descritor aparecerá quando houver duas avaliações ou mais.</p>';
  else {
    const first=compute(list[0]), last=compute(list[list.length-1]);
    const m1=Object.fromEntries((first.descriptorStats||[]).map(d=>[d.descritor,d.percent]));
    const m2=Object.fromEntries((last.descriptorStats||[]).map(d=>[d.descritor,d.percent]));
    const codes=[...new Set([...Object.keys(m1),...Object.keys(m2)])].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
    desc.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Descritor</span><span>Inicial</span><span>Final</span><span>Diferença</span><span>Leitura</span></div>'+
      codes.map(d=>{const diff=Math.round(((m2[d]||0)-(m1[d]||0))*10)/10;return `<div class="preview-row"><span><b>${safe(d)}</b></span><span>${m1[d]??'-'}%</span><span>${m2[d]??'-'}%</span><span class="${diff>=0?'oktext':'badtext'}">${diff>0?'+':''}${diff}%</span><span>${diff>=0?'Avanço/estabilidade':'Retomar descritor'}</span></div>`}).join('')+'</div>';
  }
 }
 renderEvolucaoEntreTurmas();
 renderAlunoSelectEvolucao(list);
}
function renderEvolucaoEntreTurmas(){
 const box=$('#evoClassCompare'); if(!box)return;
 const disc=$('#evoDisc')?.value||'';
 const list=withData().filter(a=>(!disc||a.discipline===disc));
 const lastByTurma={};
 list.forEach(a=>{if(!a.turma)return; if(!lastByTurma[a.turma] || (a.date||'')>=(lastByTurma[a.turma].date||''))lastByTurma[a.turma]=a;});
 const rows=Object.values(lastByTurma).map(a=>({a,r:compute(a)})).sort((x,y)=>y.r.summary.avg-x.r.summary.avg);
 box.innerHTML=rows.length?'<div class="preview-table evo-table"><div class="preview-row"><span>Turma</span><span>Última avaliação</span><span>Disciplina</span><span>Alunos</span><span>Média</span><span>Visual</span></div>'+
  rows.map(x=>`<div class="preview-row"><span><b>${safe(x.a.turma)}</b></span><span>${safe(tipoLabel(x.a.tipo))}<br>${safe(x.a.date||'')}</span><span>${safe(x.a.discipline||'-')}</span><span>${x.r.summary.nStudents}</span><span><b>${x.r.summary.avg}%</b></span><span>${bar(x.r.summary.avg)}</span></div>`).join('')+'</div>':'<p class="hint">Cadastre avaliações de mais de uma turma para comparar.</p>';
}
function renderAlunoSelectEvolucao(list=listFiltered()){
 const sel=$('#evoStudent'); if(!sel)return;
 const names=[...new Set(list.flatMap(a=>(a.students||[]).map(s=>s.name||s.nome).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 const old=sel.value;
 sel.innerHTML='<option value="">Selecione</option>'+names.map(n=>`<option value="${safe(n)}">${safe(n)}</option>`).join('');
 if(names.includes(old))sel.value=old;
 renderAlunoEvolucao();
}
function renderAlunoEvolucao(){
 const box=$('#evoStudentPanel'); if(!box)return;
 const name=$('#evoStudent')?.value||'';
 if(!name){box.innerHTML='<p class="hint">Selecione um aluno para visualizar sua evolução.</p>';return;}
 const list=listFiltered().map(a=>{const r=compute(a); const s=(r.students||[]).find(x=>(x.name||x.nome||'').toUpperCase()===name.toUpperCase()); return s?{a,r,s}:null;}).filter(Boolean);
 box.innerHTML=list.length?`<h4>${safe(name)}</h4><div class="preview-table evo-table"><div class="preview-row"><span>Avaliação</span><span>Data</span><span>Acertos</span><span>Desempenho</span><span>Nível</span><span>Visual</span></div>`+
  list.map(x=>`<div class="preview-row"><span>${safe(tipoLabel(x.a.tipo))}<br>${safe(x.a.title||'')}</span><span>${safe(x.a.date||'-')}</span><span>${x.s.total}/${x.r.summary.nQuestions}</span><span>${x.s.percent}%</span><span>${safe(x.s.level)}</span><span>${bar(x.s.percent)}</span></div>`).join('')+'</div>':'<p class="hint">Aluno não encontrado nas avaliações filtradas.</p>';
}
function patchEvolucao(){
 if(window.Evolucao && !window.Evolucao.__correcoesPatch){
   window.Evolucao.__correcoesPatch=true;
   window.Evolucao.render=renderEvolucaoAutomatica;
 }
 renderEvolucaoAutomatica();
}

function generatePptx(){
 const app=A(); if(!app)return;
 const list=withData();
 if(!list.length){alert('Não há avaliações com dados para gerar apresentação.');return;}
 if(!window.pptxgen){alert('Biblioteca de PowerPoint ainda não carregou. Tente novamente em alguns segundos.');return;}
 const pptx=new pptxgen();
 pptx.layout='LAYOUT_WIDE';
 pptx.author='VETOR';
 const title='Diagnóstico Pedagógico';
 let slide=pptx.addSlide();
 slide.addText('Diagnóstico Pedagógico', {x:0.6,y:0.6,w:12,h:0.6,fontSize:30,bold:true,color:'0F2E5F'});
 slide.addText('VETOR', {x:0.6,y:1.3,w:12,h:0.4,fontSize:18,color:'333333'});
 slide.addText('Relatório gerado automaticamente pela plataforma', {x:0.6,y:1.8,w:12,h:0.4,fontSize:14,color:'666666'});
 const rows=list.slice(0,10).map(a=>{const r=compute(a); return [a.turma||'', a.discipline||'', tipoLabel(a.tipo), String(r.summary.avg)+'%'];});
 slide=pptx.addSlide();
 slide.addText('Resumo das avaliações', {x:0.5,y:0.4,w:12,h:0.4,fontSize:24,bold:true,color:'0F2E5F'});
 slide.addTable([['Turma','Disciplina','Avaliação','Média'],...rows], {x:0.5,y:1.0,w:12,h:4.8,fontSize:11,border:{type:'solid',color:'CCCCCC'}});
 const current=app.state.assessment;
 if((current.students||[]).length){
   const r=compute(current);
   slide=pptx.addSlide();
   slide.addText('Avaliação atual', {x:0.5,y:0.4,w:12,h:0.4,fontSize:24,bold:true,color:'0F2E5F'});
   slide.addText(`Turma: ${current.turma||'-'}\nDisciplina: ${current.discipline||'-'}\nAvaliação: ${current.title||tipoLabel(current.tipo)}\nAlunos: ${r.summary.nStudents}\nMédia: ${r.summary.avg}\nAlunos em Elementar I/II: ${r.summary.priority}`, {x:0.7,y:1.0,w:5.6,h:2.5,fontSize:18,breakLine:false});
   slide.addText('Descritores críticos', {x:6.6,y:1.0,w:5,h:0.3,fontSize:18,bold:true,color:'0F2E5F'});
   slide.addText(r.descriptorStats.slice(0,8).map(d=>`${d.descritor}: ${d.percent}%`).join('\n')||'Sem dados', {x:6.6,y:1.4,w:5.5,h:3,fontSize:16});
 }
 slide=pptx.addSlide();
 slide.addText('Encaminhamentos', {x:0.5,y:0.4,w:12,h:0.4,fontSize:24,bold:true,color:'0F2E5F'});
 slide.addText('1. Priorizar os descritores com menor aproveitamento.\n2. Gerar fichas por aluno ou por turma.\n3. Aplicar intervenção pedagógica.\n4. Comparar evolução no próximo simulado.\n5. Registrar evidências para coordenação.', {x:0.8,y:1.0,w:11,h:4,fontSize:18});
 pptx.writeFile({fileName:'vetor-diagnostico-v68-7.pptx'});
}

function bind(){
 patchImportLayout();
 populateTurmaSelect();
 refreshTypeOptions();
 patchSaveDuplicateBlock();
 patchHome();
 patchCloudAndJson();
 patchFichaSelectors();
 ensurePrintNotBlank();
 patchEvolucao();
 $('#generatePptxReport')&&($('#generatePptxReport').onclick=generatePptx);
 ['assessmentClass','assessmentDiscipline','assessmentType','assessmentTitle','assessmentDate'].forEach(id=>{
   const el=$('#'+id); if(el) el.addEventListener('change',()=>{refreshTypeOptions(); setTimeout(()=>{populateTurmaSelect(); refreshTypeOptions();},20);});
 });
 ['v57Scope','v57Threshold','v59PackType','v59Threshold'].forEach(id=>{
   const el=$('#'+id); if(el) el.addEventListener('change',()=>setTimeout(patchFichaSelectors,10));
 });
 ['evoTurma','evoDisc','evoStudent'].forEach(id=>{const el=$('#'+id); if(el)el.addEventListener('change',()=>setTimeout(renderEvolucaoAutomatica,10));});
 $('#evoCompare')&&($('#evoCompare').onclick=renderEvolucaoAutomatica);
 $('#evoStudentBtn')&&($('#evoStudentBtn').onclick=renderAlunoEvolucao);
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,350));
const oldSetInterval=setInterval(()=>{try{patchHome(); patchFichaSelectors();}catch(e){}},2500);
window.Correcoes={renderEvolucaoAutomatica,generatePptx,patchFichaSelectors};
})();

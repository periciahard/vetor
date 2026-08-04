
(function(){
'use strict';
const $=s=>document.querySelector(s);
const A=()=>window.VETOR;
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function tipoLabel(t){
 const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
 for(let i=1;i<=10;i++)map['simulado'+i]='Simulado '+i;
 return map[t]||t||'Avaliação';
}
function validAssessments(){
 return (A()?.state?.assessments||[]).filter(x=>(x.students||[]).length&&(x.questions||[]).length);
}
function compute(a){
 return window.Diagnostico?.compute(a)||{summary:{avg:0,nStudents:0,nQuestions:0},descriptorStats:[],students:[]};
}
function download(name, content, type='text/plain;charset=utf-8'){
 const blob=new Blob([content],{type});
 const a=document.createElement('a');
 a.href=URL.createObjectURL(blob);
 a.download=name;
 document.body.appendChild(a);
 a.click();
 setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
}
function relatorioConsolidado(){
 const list=validAssessments();
 if(!list.length){alert('Não há avaliações salvas com dados.');return;}
 let txt='RELATÓRIO CONSOLIDADO — VETOR\n\n';
 const byTurma={};
 list.forEach(a=>{const k=(a.turma||'Turma não informada')+' | '+(a.discipline||'Disciplina não informada'); (byTurma[k]??=[]).push(a);});
 Object.entries(byTurma).forEach(([k,arr])=>{
   txt+='\n'+k+'\n';
   txt+='='.repeat(k.length)+'\n';
   arr.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.tipo||'').localeCompare(b.tipo||'')).forEach(a=>{
     const r=compute(a);
     txt+=`- ${tipoLabel(a.tipo)} | ${a.title||''} | ${a.date||''} | Média: ${r.summary.avg} | Alunos: ${r.summary.nStudents}\n`;
     const crit=(r.descriptorStats||[]).slice(0,3).map(d=>`${d.descritor}: ${d.percent}%`).join('; ');
     txt+=`  Descritores críticos: ${crit||'-'}\n`;
   });
 });
 txt+='\nENCAMINHAMENTO GERAL\n';
 txt+='1. Comparar a evolução das turmas por disciplina.\n';
 txt+='2. Priorizar descritores com menor aproveitamento.\n';
 txt+='3. Gerar fichas de recuperação para alunos abaixo da meta.\n';
 txt+='4. Reaplicar simulado ou atividade curta após a intervenção.\n';
 download('relatorio-consolidado-vetor-v68-7.txt', txt);
}
function backupSimples(){
 const app=A();
 if(!app)return;
 const data=JSON.stringify(app.state||{},null,2);
 download('backup-vetor-v68-7.json', data, 'application/json;charset=utf-8');
}
function painelResumoInicial(){
 const app=A(); const box=$('#homeInsights');
 if(!app||!box)return;
 const list=validAssessments();
 const r=app.getResults?.();
 if(r?.summary?.nStudents){
   box.innerHTML=`<h3>Resumo da avaliação ativa</h3><div class="cards small"><div class="card"><span>Turma</span><b>${safe(app.state.assessment.turma||'-')}</b></div><div class="card"><span>Disciplina</span><b>${safe(app.state.assessment.discipline||'-')}</b></div><div class="card"><span>Média</span><b>${r.summary.avg}</b></div><div class="card"><span>Avaliações salvas</span><b>${list.length}</b></div></div>`;
 } else {
   box.innerHTML=`<h3>Resumo do sistema</h3><div class="cards small"><div class="card"><span>Avaliações salvas</span><b>${list.length}</b></div><div class="card"><span>Turmas avaliadas</span><b>${new Set(list.map(a=>a.turma).filter(Boolean)).size}</b></div><div class="card"><span>Disciplinas</span><b>${new Set(list.map(a=>a.discipline).filter(Boolean)).size}</b></div></div><p class="hint">Importe uma avaliação para visualizar o diagnóstico da turma.</p>`;
 }
}
function verificarImportacao(){
 const file=$('#fileInput');
 const status=$('#extractStatus');
 if(file && status && !file.__melhoriasPatch){
   file.__melhoriasPatch=true;
   file.addEventListener('change',()=>{if(file.files?.length)status.textContent='Arquivo selecionado. Clique em "Ler arquivo" para continuar.';});
 }
}
function bind(){
 $('#evoConsolidado')&&($('#evoConsolidado').onclick=relatorioConsolidado);
 $('#quickBackupBtn')&&($('#quickBackupBtn').onclick=backupSimples);
 painelResumoInicial();
 verificarImportacao();
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,500));
setInterval(()=>{try{painelResumoInicial();}catch(e){}},4000);
window.Melhorias={relatorioConsolidado,backupSimples,painelResumoInicial};
})();

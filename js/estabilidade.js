
(function(){
'use strict';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const A=()=>window.VETOR;
function user(){return window.AuthSupabase?.user?.()||null}
function tipoLabel(t){const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};for(let i=1;i<=10;i++)map['simulado'+i]='Simulado '+i;return map[t]||t||'Avaliação'}
function compute(a){return window.Diagnostico?.compute(a)||{summary:{avg:0,nStudents:0,priority:0,nQuestions:0},students:[],descriptorStats:[]}}
function allowedAssessments(){return window.AuthSupabase?.filteredAssessments?.() || (A()?.state?.assessments||[])}
function turmaLabel(t){return A()?.cleanTurmaName?A().cleanTurmaName(t):String(t||'').replace(/\s*(?:[•-])\s*(?:Língua Portuguesa|Português|Portugues|Matemática|Matematica)\s*$/i,'').trim()}
function turmaKey(a){return turmaLabel(a?.turma)+'|'+(a?.discipline||'')}
function withCleanTurma(a){return {...a,turma:turmaLabel(a?.turma)}}
function latestByClass(){const m={};allowedAssessments().forEach(raw=>{const a=withCleanTurma(raw);if(!a.turma)return;const k=turmaKey(a);if(!m[k]||(a.date||'')>=(m[k].date||''))m[k]=a});return Object.values(m).sort((a,b)=>(a.turma||'').localeCompare(b.turma||'','pt-BR',{numeric:true})||(a.discipline||'').localeCompare(b.discipline||'','pt-BR'))}
function avg(arr){return arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10:0}
function bar(p){p=Math.max(0,Math.min(100,Number(p)||0));return `<div class="v64-bar"><span style="width:${p}%"></span><b>${p}%</b></div>`}
function renderMinhasTurmas(){
 const u=user();if(!u)return;
 const list=allowedAssessments().map(withCleanTurma);const latest=latestByClass();
 const cards=$('#minhasTurmasCards');
 if(cards){const medias=latest.map(a=>compute(a).summary.avg||0);cards.innerHTML=`<div class="card"><span>Usuário</span><b>${safe(u.nome)}</b></div><div class="card"><span>Perfil</span><b>${safe(u.perfil)}</b></div><div class="card"><span>Série(s)</span><b>${safe((u.anos||[]).join(', ')||'Todas')}</b></div><div class="card"><span>Disciplina(s)</span><b>${safe((u.disciplinas||[]).join(', ')||'Todas')}</b></div><div class="card"><span>Turmas avaliadas</span><b>${latest.length}</b></div><div class="card"><span>Média das turmas</span><b>${avg(medias)}%</b></div>`}
 const comp=$('#minhasTurmasComparacao');
 if(comp){comp.innerHTML=latest.length?`<div class="preview-table v64-table"><div class="preview-row"><span>Turma</span><span>Disciplina</span><span>Última avaliação</span><span>Alunos</span><span>Média</span><span>Visual</span></div>${latest.map(a=>{const r=compute(a);return `<div class="preview-row"><span><b>${safe(turmaLabel(a.turma))}</b></span><span>${safe(a.discipline||'-')}</span><span>${safe(a.title||tipoLabel(a.tipo))}<br>${safe(a.date||'')}</span><span>${r.summary.nStudents||0}</span><span><b>${r.summary.avg||0}</b></span><span>${bar(r.summary.avg||0)}</span></div>`}).join('')}</div>`:'<p class="hint">Nenhuma avaliação disponível para seu perfil.</p>'}
 const evo=$('#minhasTurmasEvolucao');
 if(evo){const groups={};list.forEach(a=>{const k=turmaKey(a);(groups[k]??=[]).push(a)});Object.values(groups).forEach(arr=>arr.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.tipo||'').localeCompare(b.tipo||'')));evo.innerHTML=Object.entries(groups).length?`<div class="preview-table v64-table"><div class="preview-row"><span>Turma</span><span>Disciplina</span><span>Primeira</span><span>Última</span><span>Diferença</span><span>Visual</span></div>${Object.values(groups).map(arr=>{const a0=arr[0],a1=arr[arr.length-1],r0=compute(a0).summary.avg||0,r1=compute(a1).summary.avg||0,d=Math.round((r1-r0)*10)/10;return `<div class="preview-row"><span><b>${safe(turmaLabel(a1.turma)||'-')}</b></span><span>${safe(a1.discipline||'-')}</span><span>${r0}%</span><span>${r1}%</span><span class="${d>=0?'oktext':'badtext'}">${d>0?'+':''}${d}%</span><span>${bar(r1)}</span></div>`}).join('')}</div>`:'<p class="hint">Salve duas avaliações de uma turma para ver evolução.</p>'}
 const aval=$('#minhasTurmasAvaliacoes');
 if(aval){aval.innerHTML=list.length?list.map(a=>`<div class="assessment-item"><div><b>${safe(a.title||tipoLabel(a.tipo))}</b><br>${safe(turmaLabel(a.turma)||'-')} • ${safe(a.discipline||'-')} • ${safe(a.date||'')}<br><small>${(a.students||[]).length} alunos • ${(a.questions||[]).length} questões</small></div><button class="smallBtn" data-v64-open="${safe(a.id)}">Abrir diagnóstico</button></div>`).join(''):'<p class="hint">Nenhuma avaliação disponível.</p>';aval.querySelectorAll('[data-v64-open]').forEach(b=>b.onclick=()=>A()?.openAssessment?.(b.dataset.v64Open))}
}
function patchBankAuthor(){
 const app=A();if(!app||app.__v64Bank)return;app.__v64Bank=true;
 const oldSave=app.save?.bind(app);
 app.save=function(){const u=user();if(u&&Array.isArray(this.state.bank)){this.state.bank=this.state.bank.map(q=>q&&typeof q==='object'?{...q,autor:q.autor||q.author||u.login,perfilAutor:q.perfilAutor||u.perfil,updatedBy:u.login,updatedAt:q.updatedAt||new Date().toISOString()}:q)}return oldSave?oldSave():localStorage.setItem('vetor_diagnostico_atual',JSON.stringify(this.state))}
}
function restrictBankForProfessor(){const u=user();if(!u||u.all)return;$$('#bankTable tbody tr,.question-card,.bq-item').forEach(el=>{const t=el.textContent||'';const allowed=(u.disciplinas||[]).some(d=>t.includes(d))||!(t.includes('Língua Portuguesa')||t.includes('Matemática'));el.style.display=allowed?'':'none'})}
function patchNav(){const u=user();if(!u)return;const mt=$('[data-view="minhasTurmas"]');if(mt)mt.style.display=u.role==='prof'?'':'none'}
function apply(){document.querySelector('.login-help')?.remove();patchBankAuthor();patchNav();renderMinhasTurmas();restrictBankForProfessor()}
document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,1000));
setInterval(()=>{try{apply()}catch(e){}},3000);
window.Estabilidade={renderMinhasTurmas,allowedAssessments,latestByClass};
})();

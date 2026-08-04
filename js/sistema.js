
(function(){
 'use strict';
 const $=s=>document.querySelector(s);
 function check(){
   const A=window.VETOR;
   const out=$('#systemCheckOutput');
   if(!out)return;
   const modules=[
    ['Núcleo',!!A],
    ['Importação',!!window.Importacao],
    ['Diagnóstico',!!window.Diagnostico],
    ['Evolução',!!window.Evolucao],
    ['Turmas',!!window.TurmasVetor],
    ['Banco de Questões',!!window.BancoQuestoes],
    ['Fichas',!!window.Fichas],
    ['Intervenções',!!window.Intervencoes],
    ['Impressão',!!window.Impressao],
    ['Exportação',!!window.Exportacao],
    ['Excel',!!window.XLSX]
   ];
   const a=A?.state?.assessment||{};
   const checks=[
    ['Avaliação salva',!!(a.id&&A.state.activeAssessmentId)],
    ['Questões importadas',(a.questions||[]).length>0],
    ['Descritores importados',(a.descriptors||[]).length>0],
    ['Gabarito importado',(a.key||[]).length>0],
    ['Alunos importados',(a.students||[]).length>0]
   ];
   const html='<h4>Verificação do sistema</h4><ul>'+
     modules.map(([n,ok])=>`<li>${ok?'✅':'❌'} ${n}</li>`).join('')+
     '</ul><h4>Avaliação atual</h4><ul>'+
     checks.map(([n,ok])=>`<li>${ok?'✅':'⚠️'} ${n}</li>`).join('')+
     '</ul>';
   out.className='statusbox '+(modules.every(x=>x[1])?'status-ok':'status-error');
   out.innerHTML=html;
 }
 async function clearCache(){
   try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const r of regs) await r.unregister();
    }
    if(window.caches){
      const names=await caches.keys();
      for(const n of names) await caches.delete(n);
    }
    alert('Cache limpo. A página será recarregada.');
    location.reload();
   }catch(e){alert('Não foi possível limpar cache automaticamente: '+e.message);}
 }
 function bind(){
   $('#runSystemCheck')&&($('#runSystemCheck').onclick=check);
   $('#clearPageCache')&&($('#clearPageCache').onclick=clearCache);
   const footer=document.querySelector('footer');
   if(footer)footer.textContent='VETOR • Plataforma de Inteligência Educacional • V68.7';
   const box=$('#changelogBox');
   if(box)box.innerHTML='<h3>V68.7 - Limpeza Técnica Final</h3><p class="hint">Inteligência Pedagógica: metas, alertas, descritores críticos, alunos prioritários e plano de intervenção com dados do Supabase.</p>';
 }
 document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,100));
 window.SistemaVetor={check,clearCache};
})();

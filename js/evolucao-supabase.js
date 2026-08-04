(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const A=()=>window.VETOR;
  const Cloud=()=>window.VETORSupabase;
  const safe=v=>A()?.safe?A().safe(v??''):String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
  const pct=(a,b)=>b?Math.round((a/b)*1000)/10:0;
  const normDisc=d=>String(d||'').includes('matematica')||/mat/i.test(String(d||''))?'Matemática':'Língua Portuguesa';
  const dbDisc=d=>/mat/i.test(String(d||''))?'matematica':'lingua_portuguesa';
  const typeLabel=t=>({diagnostica:'Diagnóstica',diagnostico:'Diagnóstico',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada',simulado1:'Simulado 1',simulado2:'Simulado 2',simulado3:'Simulado 3',simulado4:'Simulado 4',simulado5:'Simulado 5'}[t]||t||'Avaliação');
  const state={loading:false,loaded:false,assessments:[],resultsById:{},lastError:''};
  function clearCloudHistory(){
    state.loading=false; state.loaded=true; state.assessments=[]; state.resultsById={}; state.lastError='';
    renderCloud();
    renderCoordCloudEvolution();
    setStatus('Histórico da nuvem limpo. Nenhuma avaliação salva foi encontrada.','work');
  }
  function level(percent){return A()?.performanceLevel?A().performanceLevel(percent).label:(percent<25?'Elementar I':percent<50?'Elementar II':percent<75?'Básico':'Desejável');}
  function bar(percent){const p=Math.max(0,Math.min(100,Number(percent)||0)); return `<div class="evo-bar"><span style="width:${p}%"></span><b>${p}%</b></div>`;}
  function label(av){return `${av.turma||'Turma?'} • ${av.discipline||'Disciplina?'} • ${typeLabel(av.tipo)} • ${av.title||av.nome||''} • ${av.date||''}`;}
  function setStatus(msg,type='work'){
    const el=$('#evoStatus'); if(el){el.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work'); el.innerHTML=msg;}
  }
  function ensureControls(){
    const status=$('#evoStatus');
    if(status && !$('#evoCloudRefresh')){
      const div=document.createElement('div'); div.className='actions compact'; div.style.marginTop='10px';
      div.innerHTML='<button id="evoCloudRefresh" class="secondary">Atualizar histórico da nuvem</button><button id="evoCloudOpenGestao" class="secondary">Abrir painel institucional</button>';
      status.insertAdjacentElement('afterend',div);
      $('#evoCloudRefresh').onclick=()=>loadCloudHistory(true);
      $('#evoCloudOpenGestao').onclick=()=>A()?.showView?.('coordenacao');
    }
  }
  function hasCloud(){return !!(Cloud()?.client && Cloud()?.profile);}
  async function loadCloudHistory(force=false){
    ensureControls();
    const C=Cloud();
    if(!C?.client){setStatus('Supabase ainda não carregado. Faça login para consultar o histórico institucional.','work'); return false;}
    if(!C.profile){try{await C.restoreSession?.();}catch(e){} }
    if(!C.profile){setStatus('Faça login para carregar histórico e evolução da nuvem.','work'); return false;}
    if(state.loading)return false;
    if(state.loaded && !force)return true;
    state.loading=true; state.lastError=''; setStatus('Carregando histórico institucional do Supabase...', 'work');
    try{
      const {data:avs,error}=await C.client.from('avaliacoes')
        .select('id,nome,titulo,tipo,disciplina,data_aplicacao,data_avaliacao,criado_em,turma_id,professor_id,questoes_json,descritores_json,gabarito_json,turmas(nome,serie)')
        .order('data_aplicacao',{ascending:true})
        .order('criado_em',{ascending:true})
        .limit(300);
      if(error)throw error;
      const ids=(avs||[]).map(x=>x.id);
      const by={}; ids.forEach(id=>by[id]=[]);
      const chunk=80;
      for(let i=0;i<ids.length;i+=chunk){
        const part=ids.slice(i,i+chunk);
        if(!part.length)continue;
        const {data:rows,error:rErr}=await C.client.from('resultados_alunos').select('*').in('avaliacao_id',part).order('aluno_nome');
        if(rErr)throw rErr;
        (rows||[]).forEach(r=>{(by[r.avaliacao_id]??=[]).push(r);});
      }
      // Deduplica avaliações equivalentes no painel histórico.
      const normalized=(avs||[]).map(av=>normalizeAssessment(av,by[av.id]||[]));
      const dedup=new Map();
      normalized.forEach(a=>{
        const key=[a.turma_id||a.turma, a.disciplina_db||a.discipline, String(a.title||'').trim().toLowerCase(), a.date||''].join('|');
        const old=dedup.get(key);
        if(!old || String(a.createdAt||'')>String(old.createdAt||'')) dedup.set(key,a);
      });
      state.assessments=[...dedup.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt).localeCompare(String(b.createdAt)));
      state.resultsById=by; state.loaded=true; state.loading=false;
      setStatus(`✅ Histórico da nuvem carregado: ${state.assessments.length} avaliação(ões) institucional(is) consolidada(s).`,'ok');
      renderCloud();
      renderCoordCloudEvolution();
      return true;
    }catch(e){state.loading=false; state.lastError=e.message; setStatus('Erro ao carregar histórico da nuvem: '+safe(e.message),'error'); return false;}
  }
  function normalizeAssessment(av,rows){
    const key=Array.isArray(av.gabarito_json)?av.gabarito_json:[];
    const descriptors=Array.isArray(av.descritores_json)?av.descritores_json:[];
    const nQ=key.length || Number(rows[0]?.total)||0;
    const students=(rows||[]).map(r=>{
      const ans=Array.isArray(r.respostas_json)?r.respostas_json:[];
      let total=Number(r.total)||nQ||ans.length; let acertos=Number(r.acertos);
      if((!Number.isFinite(acertos)||Number.isNaN(acertos)) && key.length){acertos=ans.filter((x,i)=>String(x||'').toUpperCase()===String(key[i]||'').toUpperCase()).length;}
      if(!Number.isFinite(acertos)||Number.isNaN(acertos))acertos=0;
      const percent=Number(r.percentual)!=null && !Number.isNaN(Number(r.percentual))?Number(r.percentual):pct(acertos,total);
      return {id:r.aluno_id,name:r.aluno_nome||'Aluno',answers:ans,acertos,total,percent:Math.round(percent*10)/10,level:level(percent),crit:r.descritores_criticos||[]};
    });
    const avg=students.length?Math.round((students.reduce((s,x)=>s+(Number(x.percent)||0),0)/students.length)*10)/10:0;
    const levels={}; students.forEach(s=>levels[s.level]=(levels[s.level]||0)+1);
    const descriptorStats=computeDescriptorStats(students,key,descriptors);
    return {id:av.id, title:av.titulo||av.nome||'Avaliação', nome:av.nome, tipo:av.tipo||'diagnostica', date:av.data_avaliacao||av.data_aplicacao||'', discipline:normDisc(av.disciplina), disciplina_db:av.disciplina, turma:av.turmas?.nome||'Turma não informada', turma_id:av.turma_id, createdAt:av.criado_em, questions:av.questoes_json||[], descriptors, key, students, summary:{nStudents:students.length,nQuestions:nQ,avg,levels}, descriptorStats};
  }
  function computeDescriptorStats(students,key,descriptors){
    const map={};
    descriptors.forEach((d,i)=>{if(!d)return; if(!map[d])map[d]={descritor:d,total:0,correct:0,wrong:0};});
    if(key?.length){
      students.forEach(s=>{(descriptors||[]).forEach((d,i)=>{if(!d||!map[d])return; const ok=String((s.answers||[])[i]||'').toUpperCase()===String(key[i]||'').toUpperCase(); map[d].total++; if(ok)map[d].correct++; else map[d].wrong++;});});
    }else{
      students.forEach(s=>(s.crit||[]).forEach(c=>{const d=c.descritor||c.descriptor; if(!d)return; if(!map[d])map[d]={descritor:d,total:0,correct:0,wrong:0}; map[d].wrong+=Number(c.erros)||1;}));
    }
    return Object.values(map).map(x=>({...x,percent:pct(x.correct,x.total)})).sort((a,b)=>a.percent-b.percent || a.descritor.localeCompare(b.descritor,'pt-BR',{numeric:true}));
  }
  function filtered(){
    const turma=$('#evoTurma')?.value||'', disc=$('#evoDisc')?.value||'';
    return state.assessments.filter(a=>(!turma||a.turma===turma)&&(!disc||a.discipline===disc));
  }
  function unique(arr){return [...new Set(arr.filter(Boolean))];}
  function renderSelects(){
    const all=state.assessments;
    const turmas=unique(all.map(a=>a.turma)).sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
    const turmaSel=$('#evoTurma'); if(turmaSel){const old=turmaSel.value; turmaSel.innerHTML='<option value="">Todas</option>'+turmas.map(t=>`<option value="${safe(t)}">${safe(t)}</option>`).join(''); if(turmas.includes(old))turmaSel.value=old;}
    const arr=filtered();
    const opts='<option value="">Selecione</option>'+arr.map(a=>`<option value="${safe(a.id)}">${safe(label(a))}</option>`).join('');
    ['#evoA','#evoB'].forEach(id=>{const el=$(id); if(el){const old=el.value; el.innerHTML=opts; if(arr.some(a=>a.id===old))el.value=old;}});
    const stSel=$('#evoStudent'); if(stSel){const names=unique(arr.flatMap(a=>a.students.map(s=>s.name))).sort((a,b)=>a.localeCompare(b,'pt-BR')); const old=stSel.value; stSel.innerHTML='<option value="">Selecione</option>'+names.map(n=>`<option value="${safe(n)}">${safe(n)}</option>`).join(''); if(names.includes(old))stSel.value=old;}
  }
  function renderTimeline(){
    const box=$('#evoTimeline'); if(!box)return; const arr=filtered();
    if(!arr.length){box.innerHTML='<p class="empty">Nenhuma avaliação salva na nuvem para os filtros selecionados.</p>';return;}
    const by={}; arr.forEach(a=>{const k=(a.turma||'')+'|'+(a.discipline||''); (by[k]??=[]).push(a);});
    Object.values(by).forEach(list=>list.sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt).localeCompare(String(b.createdAt))));
    const prevMap={}; Object.values(by).forEach(list=>list.forEach((a,i)=>{prevMap[a.id]=i?list[i-1]:null;}));
    box.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Avaliação</span><span>Data</span><span>Alunos</span><span>Média</span><span>Δ anterior</span><span>Evolução visual</span></div>'+arr.map(a=>{const prev=prevMap[a.id]; const delta=prev?Math.round((a.summary.avg-prev.summary.avg)*10)/10:null; return `<div class="preview-row"><span><b>${safe(typeLabel(a.tipo))}</b><br>${safe(a.turma)} • ${safe(a.title)}</span><span>${safe(a.date||'-')}</span><span>${a.summary.nStudents}</span><span><b>${a.summary.avg}</b></span><span class="${delta==null?'':delta>=0?'oktext':'badtext'}">${delta==null?'-':(delta>0?'+':'')+delta+' p.p.'}</span><span>${bar(a.summary.avg)}</span></div>`;}).join('')+'</div>';
  }
  function byId(id){return state.assessments.find(a=>a.id===id);}
  function directCompare(){
    const box=$('#evoDirectCompare'); if(!box)return; const a=byId($('#evoA')?.value), b=byId($('#evoB')?.value);
    if(!a||!b){box.innerHTML='<p class="hint">Escolha duas avaliações da nuvem para comparar diretamente.</p>'; return;}
    const diff=Math.round(((b.summary.avg||0)-(a.summary.avg||0))*10)/10;
    const elemA=(a.summary.levels['Elementar I']||0)+(a.summary.levels['Elementar II']||0);
    const elemB=(b.summary.levels['Elementar I']||0)+(b.summary.levels['Elementar II']||0);
    box.innerHTML=`<div class="cards small"><div class="card"><span>Inicial</span><b>${a.summary.avg}</b></div><div class="card"><span>Final</span><b>${b.summary.avg}</b></div><div class="card ${diff>=0?'ok':'bad'}"><span>Diferença</span><b>${diff>0?'+':''}${diff} p.p.</b></div><div class="card"><span>Elementar I/II</span><b>${elemA} → ${elemB}</b></div></div><p class="hint"><b>Leitura:</b> ${diff>0?'houve crescimento geral.':diff<0?'houve queda geral.':'a média permaneceu estável.'} A coordenação deve observar os descritores abaixo para definir recomposição.</p>`;
    renderDescriptor();
  }
  function renderDescriptor(){
    const box=$('#evoDescriptor'); if(!box)return; const a=byId($('#evoA')?.value), b=byId($('#evoB')?.value);
    const source=(a&&b)?[a,b]:filtered();
    if(!source.length){box.innerHTML='<p class="hint">Sem dados de descritores na nuvem.</p>'; return;}
    if(a&&b){
      const ma=Object.fromEntries(a.descriptorStats.map(d=>[d.descritor,d.percent])); const mb=Object.fromEntries(b.descriptorStats.map(d=>[d.descritor,d.percent]));
      const codes=unique([...Object.keys(ma),...Object.keys(mb)]).sort((x,y)=>x.localeCompare(y,'pt-BR',{numeric:true}));
      const rows=codes.map(d=>({d,pa:ma[d],pb:mb[d],diff:Math.round(((mb[d]??0)-(ma[d]??0))*10)/10})).sort((x,y)=>x.diff-y.diff);
      box.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Descritor</span><span>Inicial</span><span>Final</span><span>Diferença</span><span>Leitura</span></div>'+rows.map(r=>`<div class="preview-row"><span><b>${safe(r.d)}</b></span><span>${r.pa==null?'-':r.pa+'%'}</span><span>${r.pb==null?'-':r.pb+'%'}</span><span class="${r.diff>=0?'oktext':'badtext'}">${r.diff>0?'+':''}${r.diff} p.p.</span><span>${r.diff>=10?'Crescimento relevante':r.diff>=0?'Estável/leve melhora':'Priorizar retomada'}</span></div>`).join('')+'</div>';
    }else{
      const agg={}; source.forEach(av=>av.descriptorStats.forEach(d=>{if(!agg[d.descritor])agg[d.descritor]={d:d.descritor,total:0,correct:0}; agg[d.descritor].total+=d.total||0; agg[d.descritor].correct+=d.correct||0;}));
      const rows=Object.values(agg).map(x=>({...x,percent:pct(x.correct,x.total)})).sort((a,b)=>a.percent-b.percent).slice(0,12);
      box.innerHTML='<h4>Descritores prioritários no histórico filtrado</h4><ol>'+rows.map(r=>`<li><b>${safe(r.d)}</b> — ${r.percent}% de acerto no histórico (${r.correct}/${r.total})</li>`).join('')+'</ol>';
    }
  }
  function renderClassCompare(){
    const box=$('#evoClassCompare'); if(!box)return; const arr=filtered(); const by={};
    arr.forEach(a=>{const k=a.turma||'Sem turma'; (by[k]??=[]).push(a);});
    const rows=Object.entries(by).map(([turma,avs])=>{const last=avs[avs.length-1]; const first=avs[0]; const avg=last?.summary.avg||0; const diff=last&&first?Math.round((last.summary.avg-first.summary.avg)*10)/10:0; const elem=(last?.summary.levels['Elementar I']||0)+(last?.summary.levels['Elementar II']||0); return {turma,n:avs.length,avg,diff,elem,last:last?.date||''};}).sort((a,b)=>a.avg-b.avg);
    if(!rows.length){box.innerHTML='<p class="hint">Sem turmas no histórico filtrado.</p>';return;}
    box.innerHTML='<div class="preview-table evo-table"><div class="preview-row"><span>Turma</span><span>Avaliações</span><span>Última média</span><span>Variação</span><span>Elementar I/II</span></div>'+rows.map(r=>`<div class="preview-row"><span><b>${safe(r.turma)}</b><br>${safe(r.last)}</span><span>${r.n}</span><span>${r.avg}%</span><span class="${r.diff>=0?'oktext':'badtext'}">${r.diff>0?'+':''}${r.diff} p.p.</span><span>${r.elem}</span></div>`).join('')+'</div>';
  }
  function renderStudent(){
    const box=$('#evoStudentPanel'); if(!box)return; const name=$('#evoStudent')?.value;
    if(!name){box.innerHTML='<p class="hint">Selecione um aluno para visualizar sua evolução institucional.</p>';return;}
    const arr=filtered().map(a=>({a,score:a.students.find(s=>s.name.toUpperCase()===name.toUpperCase())})).filter(x=>x.score);
    if(!arr.length){box.innerHTML='<p class="empty">Aluno não encontrado no histórico filtrado.</p>';return;}
    box.innerHTML=`<h4>${safe(name)}</h4><div class="preview-table evo-table"><div class="preview-row"><span>Avaliação</span><span>Data</span><span>Desempenho</span><span>Nível</span><span>Evolução visual</span></div>`+arr.map(x=>`<div class="preview-row"><span><b>${safe(typeLabel(x.a.tipo))}</b><br>${safe(x.a.turma)} • ${safe(x.a.title)}</span><span>${safe(x.a.date||'-')}</span><span>${x.score.percent}% (${x.score.acertos}/${x.score.total})</span><span>${safe(x.score.level)}</span><span>${bar(x.score.percent)}</span></div>`).join('')+'</div>';
  }
  function exportTxt(){
    const arr=filtered(); let txt='RELATÓRIO DE HISTÓRICO E EVOLUÇÃO - VETOR V68.7\nFonte: Supabase institucional\n\n';
    txt+=arr.map(a=>`${label(a)} | alunos: ${a.summary.nStudents} | média: ${a.summary.avg}`).join('\n');
    A()?.download?.('relatorio-historico-evolucao-vetor-v68-7.txt',txt);
  }
  function renderCloud(){
    ensureControls(); renderSelects(); renderTimeline(); directCompare(); renderClassCompare(); renderStudent(); renderDescriptor();
    if(state.loaded){const n=filtered().length; setStatus(n?`✅ ${n} avaliação(ões) da nuvem disponível(is) para histórico e evolução.`:'Histórico da nuvem carregado, mas sem avaliações para os filtros selecionados.', n?'ok':'work');}
  }
  function renderCoordCloudEvolution(){
    const box=$('#cloudCoordDashboard'); if(!box||!state.loaded)return;
    const arr=state.assessments; const by={}; arr.forEach(a=>(by[a.turma]??=[]).push(a));
    const rows=Object.entries(by).map(([turma,avs])=>{avs.sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.createdAt).localeCompare(String(b.createdAt))); const first=avs[0], last=avs[avs.length-1]; return {turma,n:avs.length,first:first.summary.avg,last:last.summary.avg,diff:Math.round((last.summary.avg-first.summary.avg)*10)/10,alunos:last.summary.nStudents,elem:(last.summary.levels['Elementar I']||0)+(last.summary.levels['Elementar II']||0)};}).sort((a,b)=>a.last-b.last);
    const totalAlunos=rows.reduce((s,r)=>s+r.alunos,0); const media=arr.length?Math.round((arr.reduce((s,a)=>s+a.summary.avg,0)/arr.length)*10)/10:0;
    box.innerHTML=`<h3>Painel institucional da nuvem — Histórico e Evolução V68.7</h3><p class="hint">Leitura feita diretamente das tabelas <b>avaliacoes</b> e <b>resultados_alunos</b> do Supabase.</p><div class="cards small"><div class="card"><span>Avaliações</span><b>${arr.length}</b></div><div class="card"><span>Turmas</span><b>${rows.length}</b></div><div class="card"><span>Alunos na última leitura</span><b>${totalAlunos}</b></div><div class="card"><span>Média histórica</span><b>${media}%</b></div></div><div class="preview-table"><div class="preview-row"><span>Turma</span><span>Avaliações</span><span>1ª média</span><span>Última média</span><span>Evolução</span><span>Elementar I/II</span></div>${rows.map(r=>`<div class="preview-row"><span><b>${safe(r.turma)}</b></span><span>${r.n}</span><span>${r.first}%</span><span>${r.last}%</span><span class="${r.diff>=0?'oktext':'badtext'}">${r.diff>0?'+':''}${r.diff} p.p.</span><span>${r.elem}</span></div>`).join('')}</div>`;
  }
  async function render(){
    ensureControls();
    if(hasCloud()||Cloud()?.client){const ok=await loadCloudHistory(false); if(ok){renderCloud(); return;}}
    // fallback: mantém a evolução local se não houver login/nuvem
    if(window.EvolucaoLocal?.render) window.EvolucaoLocal.render();
  }
  function bind(){
    ['#evoTurma','#evoDisc','#evoA','#evoB','#evoStudent'].forEach(id=>{const el=$(id); if(el)el.onchange=()=>renderCloud();});
    $('#evoCompare')&&($('#evoCompare').onclick=()=>renderCloud());
    $('#evoStudentBtn')&&($('#evoStudentBtn').onclick=()=>renderStudent());
    $('#evoExport')&&($('#evoExport').onclick=()=>exportTxt());
    const oldShow=A()?.showView; if(oldShow&&!A().__evolucaoShowPatched){A().__evolucaoShowPatched=true; A().showView=function(id){oldShow.call(this,id); if(id==='evolucao')setTimeout(()=>render(),80); if(id==='coordenacao')setTimeout(()=>{loadCloudHistory(false).then(()=>renderCoordCloudEvolution());},120);};}
  }
  const old=window.Evolucao; window.EvolucaoLocal=old; window.Evolucao={render, directCompare:()=>renderCloud(), renderStudent, exportTxt, loadCloudHistory, renderCoordCloudEvolution, clearCloudHistory};
  document.addEventListener('DOMContentLoaded',()=>{bind(); setTimeout(()=>render(),600);});
})();

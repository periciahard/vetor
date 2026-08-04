(function(){
  'use strict';
  const VERSION='67.0';
  const A=()=>window.VETOR;
  const safe=(v)=>A()?.safe?A().safe(v):String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pct=(n)=>Number.isFinite(Number(n))?Number(n).toFixed(1).replace('.',','):'0,0';
  const avg=(arr)=>arr.length?arr.reduce((s,x)=>s+Number(x||0),0)/arr.length:0;
  const uniq=(arr)=>[...new Set(arr.filter(Boolean))];
  const by=(arr,fn)=>arr.reduce((m,x)=>{const k=fn(x);(m[k]||(m[k]=[])).push(x);return m;},{});
  const dateOf=(av)=>av?.data_avaliacao||av?.data_aplicacao||av?.criado_em||'';
  const sortDate=(a,b)=>String(dateOf(a)).localeCompare(String(dateOf(b)));
  const norm=(s)=>String(s||'').trim();

  const IA={
    rows:[], avs:[], turmas:[], loadedAt:null,
    clear(){
      this.rows=[];
      this.avs=[];
      this.loadedAt=null;
      this.renderAll();
      this.renderStatus('Sem avaliações salvas na nuvem. A inteligência pedagógica será atualizada quando novos dados forem salvos.','work');
      const txt=document.querySelector('#vetorPlanoTexto'); if(txt)txt.value='';
    },
    turmaName(id){return this.turmas.find(t=>t.id===id)?.nome||'Turma sem nome';},
    discName(d){return d==='matematica'?'Matemática':'Língua Portuguesa';},
    latestByTurmaDisc(){
      const avs=[...this.avs].sort(sortDate);
      const groups=by(avs,av=>(av.turma_id||'')+'|'+(av.disciplina||''));
      return Object.values(groups).map(list=>list[list.length-1]).filter(Boolean);
    },
    resultsFor(avId){return this.rows.filter(r=>r.avaliacao_id===avId);},
    avgFor(avId){return avg(this.resultsFor(avId).map(r=>r.percentual));},
    async load(show=true){
      const cloud=window.VETORSupabase;
      const c=cloud?.client;
      if(!c || !cloud?.profile){this.renderStatus('Faça login para carregar a Inteligência Pedagógica V68.7.','work');return false;}
      try{

        const [avRes,rowRes,turmaRes]=await Promise.all([
          c.from('avaliacoes').select('id,titulo,nome,tipo,disciplina,turma_id,professor_id,data_aplicacao,data_avaliacao,criado_em').order('data_aplicacao',{ascending:true}),
          c.from('resultados_alunos').select('id,avaliacao_id,aluno_id,aluno_nome,percentual,acertos,total,descritores_criticos').order('aluno_nome',{ascending:true}),
          c.from('turmas').select('id,nome,serie').order('nome',{ascending:true})
        ]);
        if(avRes.error)throw avRes.error;
        if(rowRes.error)throw rowRes.error;
        if(turmaRes.error)throw turmaRes.error;
        this.avs=avRes.data||[]; this.rows=rowRes.data||[]; this.turmas=turmaRes.data||[]; this.loadedAt=new Date();
        this.renderAll();
        if(show)this.renderStatus(`Inteligência V68.7 atualizada: ${this.avs.length} avaliações e ${this.rows.length} resultados lidos do Supabase.`, 'ok');
        return true;
      }catch(e){this.renderStatus('Erro ao carregar Inteligência V68.7: '+e.message,'error');return false;}
    },
    renderStatus(msg,type){
      ['#vetorStatus','#vetorStatusCoord','#vetorStatusEvo'].forEach(sel=>{const el=document.querySelector(sel); if(el){el.textContent=msg; el.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work');}});
    },
    buildResumo(){
      const latest=this.latestByTurmaDisc();
      const medias=latest.map(av=>this.avgFor(av.id));
      const allStudents=uniq(this.rows.map(r=>r.aluno_id||r.aluno_nome));
      const crit=this.rankingDescritores().slice(0,1)[0];
      return {avaliacoes:this.avs.length,turmas:uniq(this.avs.map(a=>a.turma_id)).length,alunos:allStudents.length,media:avg(medias),critico:crit};
    },
    rankingTurmas(){
      return this.latestByTurmaDisc().map(av=>{
        const rows=this.resultsFor(av.id); const media=avg(rows.map(r=>r.percentual));
        const elem=rows.filter(r=>Number(r.percentual)<50).length;
        const abaixo=rows.filter(r=>Number(r.percentual)<60).length;
        return {av, turma:this.turmaName(av.turma_id), disciplina:this.discName(av.disciplina), titulo:av.titulo||av.nome, data:dateOf(av), media, alunos:uniq(rows.map(r=>r.aluno_id||r.aluno_nome)).length, elem, abaixo};
      }).sort((a,b)=>a.media-b.media);
    },
    rankingDescritores(){
      const m={};
      this.rows.forEach(r=>{
        let arr=r.descritores_criticos||[];
        if(typeof arr==='string'){try{arr=JSON.parse(arr);}catch(e){arr=[];}}
        (Array.isArray(arr)?arr:[]).forEach(x=>{const d=x.descritor||x.codigo||x[0]||'Sem descritor'; const erros=Number(x.erros||x.n||x[1]||1); m[d]=(m[d]||0)+erros;});
      });
      return Object.entries(m).map(([descritor,erros])=>({descritor,erros})).sort((a,b)=>b.erros-a.erros);
    },
    alunosPrioritarios(){
      const latestIds=new Set(this.latestByTurmaDisc().map(a=>a.id));
      return this.rows.filter(r=>latestIds.has(r.avaliacao_id)&&Number(r.percentual)<50).map(r=>{
        const av=this.avs.find(a=>a.id===r.avaliacao_id)||{};
        return {nome:r.aluno_nome, percentual:Number(r.percentual), turma:this.turmaName(av.turma_id), disciplina:this.discName(av.disciplina), avaliacao:av.titulo||av.nome};
      }).sort((a,b)=>a.percentual-b.percentual);
    },
    evolucaoTurmas(){
      const groups=by(this.avs,av=>(av.turma_id||'')+'|'+(av.disciplina||''));
      return Object.values(groups).map(list=>{
        list=[...list].sort(sortDate);
        const pontos=list.map(av=>({av,media:this.avgFor(av.id)})).filter(p=>this.resultsFor(p.av.id).length);
        if(!pontos.length)return null;
        const first=pontos[0], last=pontos[pontos.length-1];
        return {turma:this.turmaName(last.av.turma_id), disciplina:this.discName(last.av.disciplina), n:pontos.length, first:first.media, last:last.media, delta:last.media-first.media, pontos};
      }).filter(Boolean).sort((a,b)=>a.delta-b.delta);
    },
    metas(){
      return this.rankingTurmas().map(t=>{
        const alvo=Math.min(85, Math.max(t.media+10, t.media<50?60:70));
        let prioridade='Manutenção';
        if(t.media<50)prioridade='Intervenção imediata'; else if(t.media<60)prioridade='Recuperação focal'; else if(t.media<70)prioridade='Consolidação';
        return {...t, alvo, prioridade};
      });
    },
    planoIntervencao(){
      const desc=this.rankingDescritores().slice(0,5);
      const alunos=this.alunosPrioritarios().slice(0,8);
      const turmas=this.metas().slice(0,5);
      const linhas=[];
      linhas.push('PLANO DE INTERVENÇÃO PEDAGÓGICA V68.7');
      linhas.push('Fonte: Supabase institucional');
      linhas.push('');
      linhas.push('1. Descritores prioritários');
      desc.forEach((d,i)=>linhas.push(`${i+1}. ${d.descritor}: ${d.erros} erro(s) acumulado(s).`));
      linhas.push(''); linhas.push('2. Turmas prioritárias e metas');
      turmas.forEach(t=>linhas.push(`- ${t.turma} (${t.disciplina}): média ${pct(t.media)}%, meta ${pct(t.alvo)}% — ${t.prioridade}.`));
      linhas.push(''); linhas.push('3. Alunos para acompanhamento próximo');
      alunos.forEach(a=>linhas.push(`- ${a.nome} — ${a.turma} — ${pct(a.percentual)}%.`));
      linhas.push(''); linhas.push('4. Ação recomendada');
      linhas.push('Reensino dos descritores críticos, ficha curta de recuperação, nova checagem em 2 semanas e acompanhamento individual dos alunos abaixo de 50%.');
      return linhas.join('\n');
    },
    renderAll(){this.renderMain(); this.renderCoord(); this.renderEvo();},
    cardsResumo(){
      const r=this.buildResumo();
      return `<div class="cards small"><div class="card"><span>Avaliações</span><b>${r.avaliacoes}</b></div><div class="card"><span>Turmas</span><b>${r.turmas}</b></div><div class="card"><span>Alunos</span><b>${r.alunos}</b></div><div class="card"><span>Média atual</span><b>${pct(r.media)}%</b></div></div>`;
    },
    renderMain(){
      const box=document.querySelector('#vetorIntelligenceDashboard'); if(!box)return;
      const turmas=this.metas().slice(0,8); const desc=this.rankingDescritores().slice(0,8); const alunos=this.alunosPrioritarios().slice(0,10); const evo=this.evolucaoTurmas();
      box.innerHTML=`${this.cardsResumo()}<div class="grid2"><div class="panel"><h3>Turmas prioritárias e metas</h3><div class="preview-table"><div class="preview-row"><span>Turma</span><span>Média</span><span>Meta</span><span>Prioridade</span></div>${turmas.map(t=>`<div class="preview-row"><span><b>${safe(t.turma)}</b><br><small>${safe(t.disciplina)}</small></span><span>${pct(t.media)}%</span><span>${pct(t.alvo)}%</span><span>${safe(t.prioridade)}</span></div>`).join('')||'<p class="hint">Sem dados.</p>'}</div></div><div class="panel"><h3>Descritores críticos</h3><div class="preview-table"><div class="preview-row"><span>Descritor</span><span>Erros</span></div>${desc.map(d=>`<div class="preview-row"><span>${safe(d.descritor)}</span><span><b>${d.erros}</b></span></div>`).join('')||'<p class="hint">Sem dados.</p>'}</div></div></div><div class="grid2"><div class="panel"><h3>Alunos prioritários</h3><div class="preview-table"><div class="preview-row"><span>Aluno</span><span>Turma</span><span>%</span></div>${alunos.map(a=>`<div class="preview-row"><span>${safe(a.nome)}</span><span>${safe(a.turma)}</span><span>${pct(a.percentual)}%</span></div>`).join('')||'<p class="hint">Sem alunos abaixo de 50% nas últimas avaliações.</p>'}</div></div><div class="panel"><h3>Evolução das turmas</h3><div class="preview-table"><div class="preview-row"><span>Turma</span><span>Inicial</span><span>Atual</span><span>Δ</span></div>${evo.map(e=>`<div class="preview-row"><span>${safe(e.turma)}<br><small>${safe(e.disciplina)}</small></span><span>${pct(e.first)}%</span><span>${pct(e.last)}%</span><span class="${e.delta>=0?'oktext':'badtext'}">${e.delta>=0?'+':''}${pct(e.delta)} p.p.</span></div>`).join('')||'<p class="hint">São necessárias pelo menos duas avaliações da mesma turma/disciplina.</p>'}</div></div></div>`;
      const txt=document.querySelector('#vetorPlanoTexto'); if(txt)txt.value=this.planoIntervencao();
    },
    renderCoord(){
      const box=document.querySelector('#vetorCoordPanel'); if(!box)return;
      const r=this.buildResumo(); const metas=this.metas(); const graves=metas.filter(t=>t.media<50).length; const desc=this.rankingDescritores()[0];
      box.innerHTML=`<h3>🧠 Inteligência Pedagógica V68.7</h3><p class="hint">Leitura institucional direta do Supabase: metas, alertas, descritores críticos e alunos prioritários.</p>${this.cardsResumo()}<div class="cards small"><div class="card"><span>Turmas em alerta</span><b>${graves}</b></div><div class="card"><span>Descritor mais crítico</span><b>${desc?safe(desc.descritor):'-'}</b></div><div class="card"><span>Alunos abaixo de 50%</span><b>${this.alunosPrioritarios().length}</b></div></div><div class="actions compact"><button id="vetorCoordRefresh">Atualizar inteligência</button><button class="secondary" id="vetorCoordExport">Baixar plano</button></div>`;
      const btn=document.querySelector('#vetorCoordRefresh'); if(btn)btn.onclick=()=>this.load(true);
      const ex=document.querySelector('#vetorCoordExport'); if(ex)ex.onclick=()=>this.downloadPlan();
    },
    renderEvo(){
      const box=document.querySelector('#vetorEvoPanel'); if(!box)return;
      const evo=this.evolucaoTurmas();
      box.innerHTML=`<h3>Resumo da evolução da turma</h3><div class="preview-table"><div class="preview-row"><span>Turma</span><span>Avaliações</span><span>1ª média</span><span>Última média</span><span>Evolução</span></div>${evo.map(e=>`<div class="preview-row"><span><b>${safe(e.turma)}</b><br><small>${safe(e.disciplina)}</small></span><span>${e.n}</span><span>${pct(e.first)}%</span><span>${pct(e.last)}%</span><span class="${e.delta>=0?'oktext':'badtext'}">${e.delta>=0?'+':''}${pct(e.delta)} p.p.</span></div>`).join('')||'<p class="hint">Ainda não há histórico suficiente para evolução.</p>'}</div>`;
    },
    downloadPlan(){
      const txt=this.planoIntervencao(); const blob=new Blob([txt],{type:'text/plain;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='plano_intervencao_v68_6.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    },
    bind(){
      document.querySelector('#vetorRefresh')&&(document.querySelector('#vetorRefresh').onclick=()=>this.load(true));
      document.querySelector('#vetorExport')&&(document.querySelector('#vetorExport').onclick=()=>this.downloadPlan());
      document.querySelector('#vetorCopy')&&(document.querySelector('#vetorCopy').onclick=async()=>{const t=this.planoIntervencao(); try{await navigator.clipboard.writeText(t); this.renderStatus('Plano copiado.','ok');}catch(e){const box=document.querySelector('#vetorPlanoTexto'); if(box){box.focus(); box.select();}}});
    }
  };
  window.InteligenciaV684=IA;
  document.addEventListener('DOMContentLoaded',()=>{
    IA.bind();
    setTimeout(()=>IA.load(false),1600);
  });
})();

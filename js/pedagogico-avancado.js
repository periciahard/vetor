(function(){
  const A=()=>window.VETOR;
  const levels=['Elementar I','Elementar II','Básico','Desejável'];
  const qs=(s,root=document)=>root.querySelector(s);
  const qsa=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const pct=(n,d)=>d?Math.round((n/d)*1000)/10:0;
  const safe=s=>A()?.safe?A().safe(s??''):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function current(){return A()?.state?.assessment||{};}
  function results(a=current()){return window.Diagnostico?.compute?window.Diagnostico.compute(a):{students:[],items:[],descriptorStats:[],summary:{}};}
  function descInfo(code,disc){return window.Descritores?.get?.(disc||current().discipline,code)||{codigo:code,texto:'Descritor não localizado na matriz selecionada.',topico:'Não identificado',estrategias:'Retomar conceitos associados, resolver exemplos guiados e aplicar itens graduados.'};}
  function bar(data,maxVal=100){const max=maxVal||Math.max(1,...data.map(d=>d.value||0));return `<div class="bar-chart">${data.map(d=>`<div class="bar-row"><span class="bar-label">${safe(d.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2,pct(d.value,max))}%"></div></div><span class="bar-value">${safe(d.value)}${d.suffix||''}</span></div>`).join('')}</div>`;}
  function riskLabel(avg,priority,students){
    const pr=pct(priority,students);
    if(avg<40||pr>=50)return {label:'Alto',cls:'bad',text:'Há concentração relevante de estudantes nos níveis Elementar I/II. A coordenação deve organizar intervenção imediata, com metas semanais e monitoramento nominal.'};
    if(avg<60||pr>=30)return {label:'Moderado',cls:'warn',text:'A turma apresenta lacunas importantes, mas há base para recuperação com intervenção focada nos descritores prioritários.'};
    return {label:'Baixo',cls:'ok',text:'A turma apresenta desempenho mais estável. A ação principal é consolidar habilidades intermediárias e ampliar desafios.'};
  }
  function profileTurma(){
    const box=qs('#turmaProfile'); if(!box)return;
    const r=results(), a=current();
    if(!r.summary.nStudents){box.innerHTML='';return;}
    const dominant=levels.map(l=>({l,n:r.summary.levels?.[l]||0})).sort((x,y)=>y.n-x.n)[0]||{l:'Sem nível',n:0};
    const strong=r.descriptorStats.filter(d=>d.percent>=70).slice(-5).reverse();
    const critical=r.descriptorStats.filter(d=>d.percent<50).slice(0,5);
    const risk=riskLabel(r.summary.avg,r.summary.priority,r.summary.nStudents);
    box.innerHTML=`<div class="panel advanced-panel"><h3>Perfil pedagógico da turma</h3><div class="cards small"><div class="card"><span>Predomínio</span><b>${safe(dominant.l)}</b></div><div class="card"><span>Risco pedagógico</span><b><span class="badge ${risk.cls}">${risk.label}</span></b></div><div class="card"><span>Alunos prioritários</span><b>${r.summary.priority||0}</b></div><div class="card"><span>Avaliação</span><b style="font-size:16px">${safe(a.turma||'Turma não informada')}</b></div></div><p><b>Leitura:</b> ${safe(risk.text)}</p><div class="grid2"><div><h4>Descritores dominados</h4><ul>${strong.length?strong.map(d=>`<li><b>${safe(d.descritor)}</b> — ${d.percent}% • ${safe(descInfo(d.descritor,a.discipline).texto)}</li>`).join(''):'<li>Ainda não há descritores acima de 70%.</li>'}</ul></div><div><h4>Descritores críticos</h4><ul>${critical.length?critical.map(d=>`<li><b>${safe(d.descritor)}</b> — ${d.percent}% • ${safe(descInfo(d.descritor,a.discipline).texto)}</li>`).join(''):'<li>Nenhum descritor abaixo de 50%.</li>'}</ul></div></div></div>`;
  }
  function radar(){
    const box=qs('#descriptorRadar'); if(!box)return;
    const r=results(); if(!r.summary.nStudents){box.innerHTML='';return;}
    const data=r.descriptorStats.slice(0,8).map(d=>({label:d.descritor,value:d.percent}));
    const n=data.length; if(!n){box.innerHTML='';return;}
    const cx=130,cy=130,maxR=100;
    const pts=data.map((d,i)=>{const ang=(-90+(360/n)*i)*Math.PI/180;const rr=maxR*(d.value/100);return [cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr];}).map(p=>p.join(',')).join(' ');
    const axes=data.map((d,i)=>{const ang=(-90+(360/n)*i)*Math.PI/180;const x=cx+Math.cos(ang)*maxR,y=cy+Math.sin(ang)*maxR;const tx=cx+Math.cos(ang)*(maxR+24),ty=cy+Math.sin(ang)*(maxR+24);return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle">${safe(d.label)}</text>`;}).join('');
    box.innerHTML=`<div class="panel advanced-panel"><h3>Radar de descritores</h3><p class="hint">Quanto mais distante do centro, maior o domínio. Os eixos mostram os descritores com menor aproveitamento, para orientar a recomposição.</p><div class="radar-wrap"><svg viewBox="0 0 260 260" class="radar"><circle cx="130" cy="130" r="100"/><circle cx="130" cy="130" r="66"/><circle cx="130" cy="130" r="33"/>${axes}<polygon points="${pts}"/></svg><div>${bar(data.map(d=>({label:d.label,value:d.value,suffix:'%'})),100)}</div></div></div>`;
  }
  function evolution(){
    const box=qs('#studentEvolutionPanel'); if(!box)return;
    const snaps=A()?.state?.snapshots||[];
    const r=results(); if(!r.summary.nStudents){box.innerHTML='';return;}
    const rows=snaps.slice(-6).map(s=>({label:s.name||s.tipo||s.date,value:s.avg||0}));
    const actual={label:(current().tipo||'Atual'),value:r.summary.avg};
    const data=[...rows,actual];
    box.innerHTML=`<div class="panel advanced-panel"><h3>Evolução histórica da turma</h3><p class="hint">Use o botão “Salvar diagnóstico atual” na Coordenação para registrar Diagnóstica, Simulado 1, Simulado 2 e Recuperação.</p>${data.length>1?bar(data.map(x=>({label:x.label,value:x.value,suffix:'%'})),100):'<p class="hint">Ainda não há histórico suficiente para comparação.</p>'}</div>`;
  }
  function studentAppend(){
    const box=qs('#studentDetail'); if(!box||box.dataset.advanced==='1')return;
    const title=box.querySelector('.student-head h3'); if(!title)return;
    const name=title.textContent.trim(); const r=results(); const s=r.students.find(x=>x.name===name); if(!s)return;
    const a=current(); const stats={};
    s.correct.forEach((ok,i)=>{const d=a.descriptors[i]||'Sem descritor';stats[d]??={d,total:0,correct:0};stats[d].total++;stats[d].correct+=ok?1:0;});
    const descData=Object.values(stats).map(x=>({label:x.d,value:pct(x.correct,x.total),suffix:'%'})).sort((a,b)=>a.value-b.value);
    const missed=s.correct.map((ok,i)=>ok?null:{q:a.questions[i]||('Q'+(i+1)),desc:a.descriptors[i]||'Sem descritor'}).filter(Boolean);
    const text=s.percent<30?'Intervenção intensiva e acompanhamento semanal. Priorizar retomada de fundamentos e poucos descritores por vez.':s.percent<60?'Reforço orientado, com foco nos descritores mais recorrentes e correção comentada.':s.percent<75?'Consolidação de lacunas localizadas e introdução gradual de itens mais complexos.':'Aprofundamento, monitorando manutenção do desempenho e desafios de maior complexidade.';
    const html=`<div class="panel mini-panel advanced-student"><h4>Análise avançada do aluno</h4><div class="grid2"><div><h5>Desempenho por descritor</h5>${bar(descData,100)}</div><div><h5>Questões erradas por prioridade</h5><ul>${missed.slice(0,12).map(m=>`<li>${safe(m.q)} — <b>${safe(m.desc)}</b>: ${safe(descInfo(m.desc,a.discipline).texto)}</li>`).join('')||'<li>Sem erros registrados.</li>'}</ul></div></div><p><b>Encaminhamento ao professor:</b> ${safe(text)}</p><ol><li>Na devolutiva, peça ao aluno que explique o motivo do erro antes de refazer a questão.</li><li>Monte uma ficha com 10 itens concentrados nos 2 ou 3 descritores mais frágeis.</li><li>Reavalie em até 4 semanas usando itens do mesmo descritor, mas com contexto diferente.</li></ol></div>`;
    box.insertAdjacentHTML('beforeend',html); box.dataset.advanced='1';
  }
  function riskPanel(){
    const box=qs('#schoolRiskPanel'); if(!box)return;
    const r=results(); if(!r.summary.nStudents){box.innerHTML='';return;}
    const risk=riskLabel(r.summary.avg,r.summary.priority,r.summary.nStudents);
    const critical=r.descriptorStats.filter(d=>d.percent<40).length;
    box.innerHTML=`<div class="panel advanced-panel"><h3>Painel de risco escolar</h3><div class="cards small"><div class="card"><span>Risco</span><b><span class="badge ${risk.cls}">${risk.label}</span></b></div><div class="card"><span>Alunos em risco</span><b>${r.summary.priority}</b></div><div class="card"><span>Descritores críticos</span><b>${critical}</b></div><div class="card"><span>Média</span><b>${r.summary.avg}</b></div></div><p>${safe(risk.text)}</p></div>`;
  }
  function conselho(){
    const box=qs('#autoConselhoPanel'); if(!box)return;
    const r=results(), a=current(); if(!r.summary.nStudents){box.innerHTML='';return;}
    const crit=r.descriptorStats.slice(0,3); const risk=riskLabel(r.summary.avg,r.summary.priority,r.summary.nStudents);
    const txt=`A turma ${a.turma||'não informada'}, em ${a.discipline||'disciplina não informada'}, apresenta média de ${r.summary.avg} e predomínio de estudantes nos níveis ${Object.entries(r.summary.levels||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||'não identificado'}. O risco pedagógico estimado é ${risk.label.toLowerCase()}, com ${r.summary.priority} estudante(s) em Elementar I/II. Os descritores que exigem prioridade são ${crit.map(d=>d.descritor+' ('+d.percent+'%)').join(', ')||'não identificados'}. Recomenda-se organizar intervenção de quatro semanas, com agrupamentos por descritor, devolutiva comentada das questões críticas e nova verificação ao final do ciclo.`;
    box.innerHTML=`<div class="panel advanced-panel"><h3>Conselho de Classe automático</h3><p class="hint">Parecer pedagógico pronto para copiar e ajustar na ata.</p><textarea class="report-output" readonly>${safe(txt)}</textarea><div class="actions"><button id="copyAutoConselho" class="secondary">Copiar parecer</button></div></div>`;
    qs('#copyAutoConselho')?.addEventListener('click',()=>navigator.clipboard?.writeText(txt));
  }
  function bankSmart(){
    const box=qs('#smartBankPanel'); if(!box)return;
    const r=results(), a=current(); if(!r.summary.nStudents){box.innerHTML='';return;}
    const crit=r.descriptorStats.slice(0,5); const bank=(window.BancoQuestoes?.allBank?.()||[]).filter(q=>q.discipline===a.discipline);
    box.innerHTML=`<div class="panel advanced-panel"><h3>Banco de questões inteligente</h3><p>Com base nos descritores críticos, o sistema deve priorizar fichas e simulados com:</p><ul>${crit.map(d=>{const n=bank.filter(q=>q.descriptor===d.descritor).length;return `<li><b>${safe(d.descritor)}</b> — ${d.percent}% de acerto; ${n} questão(ões) disponível(is) no banco. ${n<5?'<span class="badge warn">ampliar banco</span>':'<span class="badge ok">cobertura adequada</span>'}</li>`;}).join('')}</ul><p><b>Ação recomendada:</b> cadastrar ao menos 10 questões por descritor crítico, em três níveis de dificuldade, para permitir recuperação, simulado e reavaliação.</p></div>`;
  }
  function renderAll(){profileTurma();radar();evolution();riskPanel();conselho();bankSmart();studentAppend();}
  function patch(){
    const app=A(); if(!app||app.__advancedPatch)return; app.__advancedPatch=true;
    const old=app.renderAll?.bind(app); if(old){app.renderAll=function(){old();setTimeout(renderAll,30);};}
    const target=qs('#studentDetail'); if(target){new MutationObserver(()=>setTimeout(studentAppend,20)).observe(target,{childList:true,subtree:false});}
    renderAll();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(patch,100));
  window.PedagogicoAvancado={renderAll,profileTurma,radar,studentAppend,riskPanel,conselho,bankSmart};
})();

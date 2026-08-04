
(function(){
'use strict';

const $ = s => document.querySelector(s);
const safe = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const A = () => window.VETOR;

function tipoLabel(t){
  const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
  for(let i=1;i<=10;i++) map['simulado'+i]='Simulado '+i;
  return map[t] || t || 'Avaliação';
}
function listaAvaliacoes(){
  return (A()?.state?.assessments || [])
    .filter(x => (x.students||[]).length && (x.questions||[]).length)
    .sort((a,b)=>(a.turma||'').localeCompare(b.turma||'','pt-BR',{numeric:true}) || (a.date||'').localeCompare(b.date||'') || (a.tipo||'').localeCompare(b.tipo||'','pt-BR',{numeric:true}));
}
function compute(a){
  return window.Diagnostico?.compute(a) || {students:[],descriptorStats:[],summary:{avg:0,nStudents:0,nQuestions:0,priority:0,levels:{}}};
}
function keyTurmaDisc(a){ return (a.turma||'Turma não informada') + ' | ' + (a.discipline||'Disciplina não informada'); }
function agruparPorTurmaDisc(){
  const groups={};
  listaAvaliacoes().forEach(a => (groups[keyTurmaDisc(a)] ??= []).push(a));
  Object.values(groups).forEach(arr => arr.sort((a,b)=>(a.date||'').localeCompare(b.date||'') || (a.tipo||'').localeCompare(b.tipo||'','pt-BR',{numeric:true})));
  return groups;
}
function ultimasPorTurma(){
  const m={};
  listaAvaliacoes().forEach(a => {
    const k = a.turma || 'Turma não informada';
    if(!m[k] || (a.date||'') >= (m[k].date||'')) m[k]=a;
  });
  return Object.values(m);
}
function diff(a,b){ return Math.round(((b||0)-(a||0))*10)/10; }
function descritorMap(res){ return Object.fromEntries((res.descriptorStats||[]).map(d=>[d.descritor||d.descriptor, d.percent||0])); }
function baixar(nome, conteudo, tipo='text/plain;charset=utf-8'){
  const blob=new Blob([conteudo],{type:tipo});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
}
function resumoInstitucional(){
  const avals=listaAvaliacoes();
  const turmas=[...new Set(avals.map(a=>a.turma).filter(Boolean))];
  const alunos=new Set();
  avals.forEach(a=>(a.students||[]).forEach(s=>alunos.add((a.turma||'')+'|'+(s.name||s.nome||''))));
  const medias=avals.map(a=>compute(a).summary.avg||0);
  const mediaGeral=medias.length ? Math.round(medias.reduce((a,b)=>a+b,0)/medias.length*10)/10 : 0;
  const ultimaTurmas=ultimasPorTurma().map(a=>({a,r:compute(a)})).sort((x,y)=>(y.r.summary.avg||0)-(x.r.summary.avg||0));
  return {avals,turmas,alunos,mediaGeral,ultimaTurmas};
}
function renderPainel(){
  const box=$('#coordInstitucionalResumo');
  const det=$('#coordInstitucionalDetalhes');
  if(!box || !det) return;
  const r=resumoInstitucional();
  const melhor=r.ultimaTurmas[0];
  const atencao=r.ultimaTurmas[r.ultimaTurmas.length-1];
  box.innerHTML = `
    <div class="card"><span>Avaliações salvas</span><b>${r.avals.length}</b></div>
    <div class="card"><span>Turmas avaliadas</span><b>${r.turmas.length}</b></div>
    <div class="card"><span>Alunos mapeados</span><b>${r.alunos.size}</b></div>
    <div class="card"><span>Média institucional</span><b>${r.mediaGeral}%</b></div>
    <div class="card"><span>Melhor turma</span><b>${safe(melhor?.a?.turma || '-')}</b></div>
    <div class="card"><span>Maior atenção</span><b>${safe(atencao?.a?.turma || '-')}</b></div>
  `;
  const rows = r.ultimaTurmas.map(x=>`
    <div class="preview-row">
      <span><b>${safe(x.a.turma||'-')}</b></span>
      <span>${safe(x.a.discipline||'-')}</span>
      <span>${safe(tipoLabel(x.a.tipo))}<br>${safe(x.a.date||'')}</span>
      <span>${x.r.summary.nStudents}</span>
      <span><b>${x.r.summary.avg}%</b></span>
      <span>${x.r.summary.priority||0}</span>
    </div>
  `).join('');
  det.innerHTML = `
    <div class="panel">
      <h3>Ranking por última avaliação da turma</h3>
      <div class="preview-table coord-table">
        <div class="preview-row"><span>Turma</span><span>Disciplina</span><span>Última avaliação</span><span>Alunos</span><span>Média</span><span>Abaixo da meta</span></div>
        ${rows || '<p class="hint">Nenhuma avaliação com dados.</p>'}
      </div>
    </div>
  `;
}
function relatorioTexto(){
  const groups=agruparPorTurmaDisc();
  let out='RELATÓRIO DA COORDENAÇÃO PEDAGÓGICA — VETOR\n\n';
  const inst=resumoInstitucional();
  out+=`Avaliações salvas: ${inst.avals.length}\nTurmas avaliadas: ${inst.turmas.length}\nAlunos mapeados: ${inst.alunos.size}\nMédia institucional: ${inst.mediaGeral}%\n\n`;
  for(const [k,arr] of Object.entries(groups)){
    out+=`\n${k}\n${'='.repeat(k.length)}\n`;
    arr.forEach(a=>{
      const r=compute(a);
      out+=`- ${tipoLabel(a.tipo)} | ${a.title||''} | ${a.date||''} | Média: ${r.summary.avg} | Alunos: ${r.summary.nStudents} | Abaixo da meta: ${r.summary.priority||0}\n`;
      out+=`  Críticos: ${(r.descriptorStats||[]).slice(0,5).map(d=>`${d.descritor}: ${d.percent}%`).join('; ') || '-'}\n`;
    });
    if(arr.length>=2){
      const first=compute(arr[0]).summary.avg||0;
      const last=compute(arr[arr.length-1]).summary.avg||0;
      out+=`  Evolução inicial-final: ${first}% → ${last}% (${diff(first,last)>0?'+':''}${diff(first,last)}%)\n`;
    }
  }
  out+='\nENCAMINHAMENTOS\n1. Priorizar turmas com menor média na última avaliação.\n2. Trabalhar descritores críticos recorrentes.\n3. Gerar fichas para estudantes abaixo da meta.\n4. Reaplicar avaliação curta após intervenção.\n5. Registrar evidências para acompanhamento pedagógico.\n';
  return out;
}
function baixarRelatorio(){ baixar('relatorio-coordenacao-vetor-v68-7.txt', relatorioTexto()); }

function addBar(slide, label, value, x, y, w, color='1D6B42'){
  const pct=Math.max(0,Math.min(100,Number(value)||0));
  slide.addText(label,{x,y,w:3.6,h:0.25,fontSize:9,color:'333333',bold:true});
  slide.addShape('rect',{x:x+3.8,y:y+0.03,w:w,h:0.16,fill:{color:'E6ECF5'},line:{color:'E6ECF5'}});
  slide.addShape('rect',{x:x+3.8,y:y+0.03,w:w*(pct/100),h:0.16,fill:{color},line:{color}});
  slide.addText(String(pct)+'%',{x:x+3.8+w+0.1,y:y-0.02,w:0.7,h:0.25,fontSize:9,color:'333333'});
}
async function gerarPowerPointInstitucional(){
  if(!window.PptxGenJS){ alert('A biblioteca de PowerPoint não carregou. Atualize a página e tente novamente.'); return; }
  const avals=listaAvaliacoes();
  if(!avals.length){ alert('Não há avaliações com dados para gerar a apresentação.'); return; }

  const pptx=new PptxGenJS();
  pptx.layout='LAYOUT_WIDE';
  pptx.author='VETOR';
  pptx.subject='Diagnóstico Pedagógico';
  pptx.title='Diagnóstico Pedagógico Institucional';

  const blue='0F2E5F', green='1D6B42', yellow='FFD23F', red='B42318', gray='666666';

  function baseSlide(title, subtitle=''){
    const slide=pptx.addSlide();
    slide.background={color:'FFFFFF'};
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.18,fill:{color:yellow},line:{color:yellow}});
    slide.addText(title,{x:0.45,y:0.35,w:12.3,h:0.42,fontSize:22,bold:true,color:blue});
    if(subtitle) slide.addText(subtitle,{x:0.47,y:0.82,w:12,h:0.28,fontSize:10,color:gray});
    slide.addText('VETOR',{x:0.45,y:7.05,w:7,h:0.25,fontSize:9,color:gray});
    return slide;
  }

  // 1 Capa
  let slide=baseSlide('Diagnóstico Pedagógico Institucional','Resultados, evolução, descritores críticos, estudantes abaixo da meta e encaminhamentos');
  slide.addText('Coordenação Pedagógica',{x:0.65,y:2.0,w:12,h:0.5,fontSize:28,bold:true,color:green});
  slide.addText(new Date().toLocaleDateString('pt-BR'),{x:0.65,y:2.65,w:5,h:0.35,fontSize:16,color:gray});

  // 2 Resumo institucional
  const inst=resumoInstitucional();
  slide=baseSlide('Resumo institucional','Panorama das avaliações salvas no sistema');
  const cards=[
    ['Avaliações',inst.avals.length],
    ['Turmas',inst.turmas.length],
    ['Alunos mapeados',inst.alunos.size],
    ['Média institucional',inst.mediaGeral+'%'],
    ['Melhor turma',inst.ultimaTurmas[0]?.a?.turma||'-'],
    ['Atenção prioritária',inst.ultimaTurmas[inst.ultimaTurmas.length-1]?.a?.turma||'-']
  ];
  cards.forEach((c,i)=>{
    const x=0.7+(i%3)*4.1, y=1.35+Math.floor(i/3)*1.55;
    slide.addShape(pptx.ShapeType.roundRect,{x,y,w:3.6,h:1.0,rectRadius:0.08,fill:{color:'F8FBFF'},line:{color:'D9E2EF'}});
    slide.addText(c[0],{x:x+0.18,y:y+0.15,w:3.2,h:0.22,fontSize:10,color:gray,bold:true});
    slide.addText(String(c[1]),{x:x+0.18,y:y+0.45,w:3.2,h:0.34,fontSize:18,color:blue,bold:true,fit:'shrink'});
  });

  // 3 Ranking turmas
  slide=baseSlide('Ranking das turmas','Última avaliação registrada por turma');
  const rankRows=[['Turma','Disciplina','Avaliação','Média','Abaixo']];
  inst.ultimaTurmas.slice(0,12).forEach(x=>rankRows.push([x.a.turma||'',x.a.discipline||'',tipoLabel(x.a.tipo),String(x.r.summary.avg)+'%',String(x.r.summary.priority||0)]));
  slide.addTable(rankRows,{x:0.45,y:1.15,w:12.4,h:5.4,fontSize:8,border:{type:'solid',color:'CCCCCC'},fill:{color:'F8FBFF'}});

  // 4 Evolução por turma/disciplina
  const groups=agruparPorTurmaDisc();
  slide=baseSlide('Evolução por turma e disciplina','Comparação entre primeira e última avaliação salva');
  let y=1.25;
  Object.entries(groups).slice(0,10).forEach(([k,arr])=>{
    const first=compute(arr[0]).summary.avg||0, last=compute(arr[arr.length-1]).summary.avg||0;
    const d=diff(first,last);
    slide.addText(k,{x:0.6,y,w:4.6,h:0.22,fontSize:8,bold:true,color:'333333',fit:'shrink'});
    addBar(slide, `${first}% → ${last}% (${d>0?'+':''}${d}%)`, last, 4.8, y, 5.2, d>=0?green:red);
    y+=0.48;
  });

  // 5 Avaliação ativa
  const current=A()?.state?.assessment||avals[0];
  const curRes=compute(current);
  slide=baseSlide('Avaliação ativa','Indicadores gerais da avaliação selecionada');
  slide.addText(`Turma: ${current.turma||'-'}\nDisciplina: ${current.discipline||'-'}\nAvaliação: ${current.title||tipoLabel(current.tipo)}\nData: ${current.date||'-'}\nAlunos: ${curRes.summary.nStudents||0}\nQuestões: ${curRes.summary.nQuestions||0}\nMédia: ${curRes.summary.avg||0}%\nAbaixo da meta: ${curRes.summary.priority||0}`,{x:0.65,y:1.25,w:5.6,h:3.8,fontSize:15,color:'222222',breakLine:false});
  slide.addText('Distribuição pedagógica',{x:6.6,y:1.25,w:5.8,h:0.28,fontSize:15,bold:true,color:blue});
  const levels=curRes.summary.levels||{};
  let yy=1.75;
  ['Elementar I','Elementar II','Básico','Desejável'].forEach(l=>{addBar(slide,l,curRes.summary.nStudents?Math.round((levels[l]||0)/curRes.summary.nStudents*100):0,6.6,yy,3.8,l.includes('Elementar')?red:green); yy+=0.5;});

  // 6 Descritores críticos
  slide=baseSlide('Descritores críticos','Menores aproveitamentos da avaliação ativa');
  y=1.2;
  (curRes.descriptorStats||[]).slice(0,10).forEach(d=>{addBar(slide,`${d.descritor} — ${d.percent}%`, d.percent,0.7,y,7.5,d.percent<60?red:green); y+=0.48;});

  // 7 Descritores fortes
  slide=baseSlide('Descritores fortes','Maiores aproveitamentos da avaliação ativa');
  y=1.2;
  (curRes.descriptorStats||[]).slice().sort((a,b)=>b.percent-a.percent).slice(0,10).forEach(d=>{addBar(slide,`${d.descritor} — ${d.percent}%`, d.percent,0.7,y,7.5,green); y+=0.48;});

  // 8 Evolução por descritor (se houver duas avaliações no mesmo grupo)
  const currGroup=groups[keyTurmaDisc(current)]||[];
  slide=baseSlide('Evolução por descritor','Primeira avaliação × última avaliação da turma/disciplina');
  if(currGroup.length>=2){
    const r1=compute(currGroup[0]), r2=compute(currGroup[currGroup.length-1]);
    const m1=descritorMap(r1), m2=descritorMap(r2);
    const codes=[...new Set([...Object.keys(m1),...Object.keys(m2)])].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true}));
    y=1.2;
    codes.slice(0,12).forEach(d=>{
      const val1=m1[d]||0, val2=m2[d]||0, dd=diff(val1,val2);
      slide.addText(`${d}: ${val1}% → ${val2}% (${dd>0?'+':''}${dd}%)`,{x:0.7,y,w:4.2,h:0.24,fontSize:9,bold:true,color:'333333'});
      addBar(slide,'',val2,4.6,y,5.4,dd>=0?green:red);
      y+=0.42;
    });
  } else {
    slide.addText('Ainda não há duas avaliações salvas para esta turma/disciplina.',{x:0.8,y:1.4,w:10,h:0.5,fontSize:18,color:gray});
  }

  // 9 Alunos abaixo da meta
  slide=baseSlide('Estudantes abaixo da meta','Lista de prioridade para intervenção');
  const abaixo=(curRes.students||[]).filter(s=>(s.percent||0)<60).sort((a,b)=>a.percent-b.percent).slice(0,16);
  const rows=[['Estudante','%','Nível']];
  abaixo.forEach(s=>rows.push([s.name||s.nome||'', String(s.percent)+'%', s.level||'']));
  slide.addTable(rows,{x:0.55,y:1.1,w:12.1,h:5.6,fontSize:8,border:{type:'solid',color:'CCCCCC'},fill:{color:'F8FBFF'}});

  // 10 Plano de intervenção
  slide=baseSlide('Plano de intervenção','Encaminhamentos automáticos para coordenação e professores');
  const crit=(curRes.descriptorStats||[]).slice(0,5).map((d,i)=>`${i+1}. ${d.descritor}: retomar habilidade, resolver itens guiados e aplicar verificação curta. Aproveitamento atual: ${d.percent}%.`).join('\n');
  slide.addText(crit || 'Importe dados para gerar plano por descritor.',{x:0.7,y:1.25,w:11.8,h:2.5,fontSize:15,color:'222222',breakLine:false});
  slide.addText('Ações gerais:\n• Gerar fichas para estudantes abaixo da meta.\n• Reaplicar atividade curta após intervenção.\n• Comparar evolução no próximo simulado.\n• Registrar evidências para reunião pedagógica.',{x:0.7,y:4.0,w:11.8,h:2.0,fontSize:15,color:'222222',breakLine:false});

  // 11 Encerramento
  slide=baseSlide('Síntese para tomada de decisão','Uso pedagógico dos dados');
  slide.addText('O objetivo do diagnóstico não é classificar estudantes, mas orientar intervenções objetivas, acompanhar evolução e apoiar o planejamento coletivo da escola.',{x:0.9,y:1.6,w:11.5,h:1.2,fontSize:24,color:blue,bold:true,fit:'shrink'});
  slide.addText('Próximo passo: aplicar intervenção focada nos descritores críticos e comparar a evolução na próxima avaliação.',{x:0.9,y:3.2,w:11.5,h:0.8,fontSize:18,color:green});

  await pptx.writeFile({fileName:'vetor-diagnostico-institucional-v68-7.pptx'});
}

function bind(){
  renderPainel();
  $('#coordInstitucionalAtualizar') && ($('#coordInstitucionalAtualizar').onclick=renderPainel);
  $('#coordInstitucionalTxt') && ($('#coordInstitucionalTxt').onclick=baixarRelatorio);
  $('#coordInstitucionalPptx') && ($('#coordInstitucionalPptx').onclick=gerarPowerPointInstitucional);
  $('#coordenacaoPptxBtn') && ($('#coordenacaoPptxBtn').onclick=gerarPowerPointInstitucional);
  $('#generatePptxReport') && ($('#generatePptxReport').onclick=gerarPowerPointInstitucional);
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,900));
setInterval(()=>{try{renderPainel();}catch(e){}},5000);

window.CoordenacaoInstitucional={renderPainel,gerarPowerPointInstitucional,baixarRelatorio,relatorioTexto};
})();

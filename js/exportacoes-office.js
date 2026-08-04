
(function(){
'use strict';

const LOGOS = ["vetor-logo.png"];
const $ = s => document.querySelector(s);
const A = () => window.VETOR;
const safe = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const text = s => String(s ?? '').replace(/\s+/g,' ').trim();

function tipoLabel(t){
  const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
  for(let i=1;i<=10;i++) map['simulado'+i]='Simulado '+i;
  return map[t] || t || 'Avaliação';
}
function avalNome(a){
  if(!a) a = A()?.state?.assessment || {};
  const title = (a.title && a.title !== 'Avaliação' && a.title !== 'Nova avaliação') ? a.title : '';
  return title || tipoLabel(a.tipo) || 'Avaliação';
}
function assessment(){ return A()?.state?.assessment || {}; }
function results(){ return A()?.getResults?.() || {students:[],summary:{},descriptorStats:[]}; }
function compute(a){ return window.Diagnostico?.compute(a) || {students:[],summary:{avg:0,nStudents:0,nQuestions:0,priority:0,levels:{}},descriptorStats:[]}; }
function avaliacoes(){ return (A()?.state?.assessments||[]).filter(x=>(x.students||[]).length&&(x.questions||[]).length); }
function fileSafe(s){ return String(s||'documento').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() || 'documento'; }

async function fetchArrayBuffer(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error('Falha ao carregar: '+url);
  return await r.arrayBuffer();
}
async function fetchDataUri(url){
  const r = await fetch(url);
  if(!r.ok) return null;
  const blob = await r.blob();
  return await new Promise(resolve=>{
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsDataURL(blob);
  });
}
function inferInfo(turma){
  const t=String(turma||'').toUpperCase();
  const serie = t.includes('3') ? '3º Ano' : t.includes('2') ? '2º Ano' : '1º Ano';
  const curso = t.includes('RED') ? 'Red' : (t.includes('ADM') || t.includes('ADMIN')) ? 'Adm' : '';
  const letra = /\bA\b/.test(t) ? 'A' : /\bB\b/.test(t) ? 'B' : '';
  return {serie, curso, letra};
}
function selectedStudentName(){
  const sels=['#sheetStudent','#v59Student','#mapStudent'];
  for(const s of sels){
    const el=$(s);
    if(el && el.value!==''){
      const st = results().students?.[Number(el.value)];
      if(st?.name || st?.nome) return st.name || st.nome;
    }
  }
  return '_________________________________________________________';
}
function extractQuestions(){
  let html='';
  if(window.Fichas?.render){
    const prev=$('#v57Preview');
    if(!prev || prev.classList.contains('empty') || !prev.textContent.trim()) window.Fichas.render();
    html = $('#v57Preview')?.innerHTML || '';
  }
  if(!html && window.Impressao?.generate){
    window.Impressao.generate();
    html = window.__IMPRESSAO_LAST?.html || $('#v59Preview')?.innerHTML || '';
  }

  const div=document.createElement('div');
  div.innerHTML=html;
  let nodes=[...div.querySelectorAll('.qitem,.print-question,.questao-modelo')];
  if(!nodes.length){
    const a=assessment();
    nodes=(a.questions||[]).map((q,i)=>({textContent:q, querySelector:()=>null, __idx:i}));
  }
  return nodes.map((node,i)=>{
    const idx=i+1;
    const base = node.querySelector?.('.texto-base,.print-textbase')?.textContent?.trim() || '';
    const p = node.querySelector?.('p')?.textContent?.trim() || '';
    const raw = node.textContent ? node.textContent.replace(/\s+/g,' ').trim() : '';
    let enunciado = p || raw || `Texto da questão ${idx}`;
    let alts=[];
    const altContainer=[...node.querySelectorAll?.('div,p,ol')||[]].map(x=>x.textContent.trim()).find(x=>/A\)/.test(x)&&/B\)/.test(x));
    if(altContainer) alts=altContainer.split(/(?=[A-E]\))/).map(x=>x.trim()).filter(Boolean);
    const a=assessment();
    if(!alts.length && a.key?.length){
      alts=['A) ________________________________','B) ________________________________','C) ________________________________','D) ________________________________','E) ________________________________'];
    }
    return {n:idx, base, enunciado, alts};
  }).filter(q=>q.enunciado || q.base);
}
function headerHtml(aluno){
  const a=assessment(), info=inferInfo(a.turma);
  const data=a.date ? a.date.split('-').reverse().join(' / ') : '___ / ___ / 2026';
  const logoHtml = LOGOS.map(l=>`<img src="assets/${l}" />`).join('');
  return `
  <div class="modelo-doc-header">
    <div class="logos">${logoHtml}</div>
    <div class="campos">
      <p><b>Estudante:</b> ${safe(aluno)} <span class="right"><b>Turma:</b> ${info.letra==='A'?'( X )A':'(   )A'} &nbsp; ${info.letra==='B'?'( X )B':'(   )B'}</span></p>
      <p><b>Série:</b> ${info.serie==='1º Ano'?'( X ) 1º Ano':'(    ) 1º Ano'} &nbsp; ${info.serie==='2º Ano'?'( X ) 2º Ano':'(    ) 2º Ano'} &nbsp; ${info.serie==='3º Ano'?'( X ) 3º Ano':'(    ) 3º Ano'} <span class="right"><b>Curso:</b> ${info.curso==='Adm'?'( X ) Adm':'(   ) Adm'} &nbsp; ${info.curso==='Red'?'( X ) Red':'(   ) Red'}</span></p>
      <p><b>Data:</b> ${safe(data)} <span class="disc"><b>Disciplina:</b> ${safe(a.discipline||'')}</span> <span class="prof"><b>Professor:</b> Felipe Camargo</span> <b>${safe(avalNome(a))}</b></p>
    </div>
  </div>`;
}
function docHtml(aluno){
  const qs=extractQuestions();
  const body=qs.length ? qs.map(q=>{
    const comando = q.base ? `<p>${safe(q.base)}</p><p>${safe(q.enunciado)}</p>` : `<p>${safe(q.enunciado)}</p>`;
    const alternativas = q.alts?.length ? `<p class="alts">${q.alts.map(safe).join('<br>')}</p>` : '';
    return `<div class="questao-doc"><p><b>QUESTÃO ${String(q.n).padStart(2,'0')}</b> – ${comando.replace(/^<p>|<\/p>$/g,'')}</p>${alternativas}</div>`;
  }).join('') : '<div class="questao-doc"><p><b>QUESTÃO 01</b> – Texto da questão ..............................................................................................................................................................</p></div>';

  return `<div class="modelo-doc-page">${headerHtml(aluno)}${body}</div>`;
}
function fullDocHtml(aluno){
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:A4;margin:12mm}
  body{font-family:Arial,Helvetica,sans-serif;color:#111;background:white;font-size:11.5pt;line-height:1.28}
  .modelo-doc-page{width:185mm;margin:0 auto;background:white}
  .modelo-doc-header{border-bottom:1px solid #222;margin-bottom:20px;padding-bottom:8px}
  .modelo-doc-header .logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;min-height:45px}
  .modelo-doc-header .logos img{max-height:45px;max-width:180px;object-fit:contain}
  .modelo-doc-header p{margin:5px 0}
  .modelo-doc-header .right{float:right}
  .modelo-doc-header .disc{margin-left:25px}
  .modelo-doc-header .prof{margin-left:30px}
  .questao-doc{margin:16px 0;page-break-inside:avoid}
  .questao-doc p{margin:6px 0}
  .alts{margin-left:14px}
  .texto-base,.qitem{background:transparent!important;border:0!important;padding:0!important}
  </style></head><body>${docHtml(aluno)}</body></html>`;
}
function downloadBlob(name, blob){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);
}
async function gerarPdf(){
  const aluno=selectedStudentName();
  const html=fullDocHtml(aluno);
  const holder=document.createElement('div');
  holder.innerHTML=html;
  const page=holder.querySelector('.modelo-doc-page');
  page.style.background='white';
  page.style.width='185mm';
  page.style.minHeight='260mm';
  page.style.padding='0';
  page.style.margin='0 auto';

  const wrap=document.createElement('div');
  wrap.id='pdf-render-institucional';
  wrap.style.background='white';
  wrap.style.position='relative';
  wrap.style.zIndex='999999';
  wrap.style.padding='12mm';
  wrap.style.width='210mm';
  wrap.style.minHeight='297mm';
  wrap.appendChild(page);
  document.body.appendChild(wrap);

  try{
    if(!window.html2pdf){
      alert('Biblioteca de PDF não carregou. Atualize a página e tente novamente.');
      return;
    }
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    await html2pdf().set({
      margin: 0,
      filename: 'ficha-institucional-vetor.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css','legacy'], avoid: ['.questao-doc'] }
    }).from(wrap).save();
  }finally{
    setTimeout(()=>wrap.remove(),500);
  }
}
async function gerarWord(){
  const aluno=selectedStudentName();
  const a=assessment(), info=inferInfo(a.turma);
  const qs=extractQuestions();
  const data=a.date ? a.date.split('-').reverse().join(' / ') : '___ / ___ / 2026';

  if(!window.docx){
    const blob=new Blob([fullDocHtml(aluno)],{type:'application/msword;charset=utf-8'});
    downloadBlob('ficha-institucional-vetor.doc',blob);
    return;
  }

  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ImageRun, HeadingLevel } = window.docx;
  const children=[];

  // logo VETOR
  if(LOGOS.length){
    const logoRuns=[];
    for(const l of LOGOS.slice(0,3)){
      try{
        const buf=await fetchArrayBuffer('assets/'+l);
        logoRuns.push(new ImageRun({data:buf, transformation:{width:120,height:42}}));
        logoRuns.push(new TextRun({text:'     '}));
      }catch(e){}
    }
    if(logoRuns.length) children.push(new Paragraph({children:logoRuns, alignment:AlignmentType.CENTER, spacing:{after:120}}));
  }

  const cell = (content, width=5000) => new TableCell({width:{size:width,type:WidthType.DXA}, children:Array.isArray(content)?content:[new Paragraph({children:[new TextRun({text:String(content), size:22})]})]});
  children.push(new Table({
    width:{size:100,type:WidthType.PERCENTAGE},
    borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.NONE}},
    rows:[
      new TableRow({children:[
        cell([new Paragraph({children:[new TextRun({text:'Estudante: ',bold:true,size:22}),new TextRun({text:aluno,size:22})]})],7500),
        cell([new Paragraph({children:[new TextRun({text:'Turma: ',bold:true,size:22}),new TextRun({text:`${info.letra==='A'?'( X )A':'(   )A'}   ${info.letra==='B'?'( X )B':'(   )B'}`,size:22})]})],2500)
      ]}),
      new TableRow({children:[
        cell([new Paragraph({children:[new TextRun({text:'Série: ',bold:true,size:22}),new TextRun({text:`${info.serie==='1º Ano'?'( X ) 1º Ano':'(    ) 1º Ano'}   ${info.serie==='2º Ano'?'( X ) 2º Ano':'(    ) 2º Ano'}   ${info.serie==='3º Ano'?'( X ) 3º Ano':'(    ) 3º Ano'}`,size:22})]})],6500),
        cell([new Paragraph({children:[new TextRun({text:'Curso: ',bold:true,size:22}),new TextRun({text:`${info.curso==='Adm'?'( X ) Adm':'(   ) Adm'}   ${info.curso==='Red'?'( X ) Red':'(   ) Red'}`,size:22})]})],3500)
      ]}),
      new TableRow({children:[
        cell([new Paragraph({children:[new TextRun({text:'Data: ',bold:true,size:22}),new TextRun({text:data,size:22}),new TextRun({text:'     Disciplina: ',bold:true,size:22}),new TextRun({text:a.discipline||'',size:22}),new TextRun({text:'     Professor: ',bold:true,size:22}),new TextRun({text:'Felipe Camargo',size:22}),new TextRun({text:'     '+avalNome(a),bold:true,size:22})]})],10000)
      ]})
    ]
  }));
  children.push(new Paragraph({text:'', border:{bottom:{color:'222222',space:1,style:BorderStyle.SINGLE,size:6}}, spacing:{after:220}}));

  qs.forEach(q=>{
    children.push(new Paragraph({children:[new TextRun({text:`QUESTÃO ${String(q.n).padStart(2,'0')} – `,bold:true,size:23}),new TextRun({text:q.base || q.enunciado || '',size:23})], spacing:{before:160,after:80}}));
    if(q.base && q.enunciado) children.push(new Paragraph({children:[new TextRun({text:q.enunciado,size:23})], spacing:{after:80}}));
    (q.alts||[]).forEach(alt=>children.push(new Paragraph({children:[new TextRun({text:alt,size:22})], spacing:{after:35}})));
  });

  const doc=new Document({
    sections:[{properties:{page:{margin:{top:680,right:680,bottom:680,left:680}}},children}]
  });
  const blob=await Packer.toBlob(doc);
  downloadBlob('ficha-institucional-vetor.docx',blob);
}

function avg(values){return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:0}
function latestByTurma(avals){
  const m={};
  avals.forEach(a=>{if(!m[a.turma] || (a.date||'') >= (m[a.turma].date||''))m[a.turma]=a});
  return Object.values(m);
}
function groupKey(a){return (a.turma||'Turma')+' | '+(a.discipline||'Disciplina')}
function bar(slide,pptx,label,value,x,y,w,color){
  value=Math.max(0,Math.min(100,Number(value)||0));
  slide.addText(label,{x,y,w:4.4,h:0.22,fontSize:9,bold:true,color:'28364A',fit:'shrink'});
  slide.addShape(pptx.ShapeType.roundRect,{x:x+4.6,y:y+0.01,w,h:0.18,rectRadius:0.03,fill:{color:'E9EEF6'},line:{color:'E9EEF6'}});
  slide.addShape(pptx.ShapeType.roundRect,{x:x+4.6,y:y+0.01,w:w*value/100,h:0.18,rectRadius:0.03,fill:{color},line:{color}});
  slide.addText(value+'%',{x:x+4.6+w+0.1,y:y-0.02,w:0.65,h:0.22,fontSize:9,color:'28364A'});
}
async function gerarPptProfissional(){
  if(!window.PptxGenJS){alert('PowerPoint não carregou. Atualize a página.');return;}
  const pptx=new PptxGenJS();
  pptx.layout='LAYOUT_WIDE';
  pptx.author='VETOR';

  const blue='0F2E5F', green='1D6B42', yellow='FFD23F', red='B42318', amber='C98200', gray='64748B', light='F7FAFC';
  const avals=avaliacoes();
  if(!avals.length){alert('Não há avaliações salvas com dados.');return;}

  let logoData=null;
  if(LOGOS[0]) logoData=await fetchDataUri('assets/'+LOGOS[0]);

  function slideBase(title,subtitle=''){
    const slide=pptx.addSlide();
    slide.background={color:'FFFFFF'};
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.23,fill:{color:yellow},line:{color:yellow}});
    slide.addShape(pptx.ShapeType.rect,{x:0,y:0.23,w:13.33,h:0.06,fill:{color:blue},line:{color:blue}});
    if(logoData) slide.addImage({data:logoData,x:11.55,y:0.38,w:1.25,h:0.55});
    slide.addText(title,{x:0.48,y:0.42,w:10.8,h:0.36,fontSize:22,bold:true,color:blue,margin:0});
    if(subtitle) slide.addText(subtitle,{x:0.5,y:0.83,w:10.9,h:0.25,fontSize:9.5,color:gray,margin:0});
    slide.addText('VETOR',{x:0.5,y:7.04,w:6.5,h:0.2,fontSize:8.5,color:gray});
    return slide;
  }
  function card(slide,title,value,x,y,w=2.8,h=1.05,color=blue){
    slide.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.09,fill:{color:'FFFFFF'},line:{color:'D7E0ED',width:1}});
    slide.addShape(pptx.ShapeType.rect,{x,y,w:0.08,h,fill:{color},line:{color}});
    slide.addText(title,{x:x+0.18,y:y+0.14,w:w-0.25,h:0.2,fontSize:8.5,color:gray,bold:true,margin:0});
    slide.addText(String(value),{x:x+0.18,y:y+0.45,w:w-0.25,h:0.36,fontSize:18,color:blue,bold:true,fit:'shrink',margin:0});
  }

  // 1 capa
  let slide=pptx.addSlide();
  slide.background={color:blue};
  slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.25,fill:{color:yellow},line:{color:yellow}});
  if(logoData) slide.addImage({data:logoData,x:0.8,y:0.65,w:1.6,h:0.75});
  slide.addText('DIAGNÓSTICO\nPEDAGÓGICO', {x:0.8,y:1.85,w:8.5,h:1.25,fontSize:38,bold:true,color:'FFFFFF',breakLine:false,margin:0});
  slide.addText('Resultados, evolução e plano de intervenção', {x:0.84,y:3.28,w:9,h:0.35,fontSize:17,color:yellow,margin:0});
  slide.addText('VETOR', {x:0.84,y:6.4,w:8,h:0.3,fontSize:14,color:'FFFFFF',margin:0});
  slide.addText(new Date().toLocaleDateString('pt-BR'), {x:10.2,y:6.4,w:2.3,h:0.3,fontSize:14,color:'FFFFFF',align:'right',margin:0});

  // dados
  const turmas=[...new Set(avals.map(a=>a.turma).filter(Boolean))];
  const alunos=new Set(); avals.forEach(a=>(a.students||[]).forEach(s=>alunos.add((a.turma||'')+'|'+(s.name||s.nome||''))));
  const medias=avals.map(a=>compute(a).summary.avg||0);
  const latest=latestByTurma(avals).map(a=>({a,r:compute(a)})).sort((x,y)=>y.r.summary.avg-x.r.summary.avg);

  // 2 resumo
  slide=slideBase('Resumo institucional','Panorama geral das avaliações salvas no sistema');
  card(slide,'Avaliações',avals.length,0.7,1.35,2.7,1.05,blue);
  card(slide,'Turmas',turmas.length,3.7,1.35,2.7,1.05,green);
  card(slide,'Alunos mapeados',alunos.size,6.7,1.35,2.7,1.05,amber);
  card(slide,'Média geral',avg(medias)+'%',9.7,1.35,2.7,1.05,red);
  slide.addText('Leitura rápida', {x:0.75,y:3.05,w:4,h:0.3,fontSize:16,bold:true,color:blue});
  const melhor=latest[0], pior=latest[latest.length-1];
  slide.addText(`Melhor desempenho atual: ${melhor?.a?.turma||'-'} (${melhor?.r?.summary?.avg||0}%).\nTurma de maior atenção: ${pior?.a?.turma||'-'} (${pior?.r?.summary?.avg||0}%).\nA média institucional considera todas as avaliações salvas no histórico institucional.`, {x:0.78,y:3.5,w:11.7,h:1.2,fontSize:16,color:'263238',breakLine:false});

  // 3 ranking
  slide=slideBase('Ranking das turmas','Última avaliação registrada por turma');
  latest.slice(0,10).forEach((x,i)=>{
    const y=1.25+i*0.48;
    const col=x.r.summary.avg<50?red:(x.r.summary.avg<70?amber:green);
    slide.addText(`${i+1}. ${x.a.turma||'-'}`,{x:0.75,y,w:4.8,h:0.25,fontSize:11,bold:true,color:'28364A',fit:'shrink'});
    slide.addText(`${x.a.discipline||''} • ${tipoLabel(x.a.tipo)} • ${x.r.summary.priority||0} abaixo`,{x:5.15,y,w:3.0,h:0.25,fontSize:9,color:gray,fit:'shrink'});
    bar(slide,pptx,'',x.r.summary.avg,8.3,y,3.3,col);
  });

  // 4 evolução
  slide=slideBase('Evolução por turma e disciplina','Primeira avaliação × última avaliação');
  const groups={}; avals.forEach(a=>(groups[groupKey(a)]??=[]).push(a));
  Object.values(groups).forEach(arr=>arr.sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.tipo||'').localeCompare(b.tipo||'')));
  let y=1.2;
  Object.entries(groups).slice(0,10).forEach(([k,arr])=>{
    const r1=compute(arr[0]).summary.avg||0, r2=compute(arr[arr.length-1]).summary.avg||0, d=Math.round((r2-r1)*10)/10;
    slide.addText(k,{x:0.72,y,w:4.2,h:0.2,fontSize:8.5,bold:true,color:'28364A',fit:'shrink'});
    slide.addText(`${r1}% → ${r2}% (${d>0?'+':''}${d}%)`,{x:4.85,y,w:2.0,h:0.2,fontSize:9,color:d>=0?green:red,bold:true});
    bar(slide,pptx,'',r2,6.65,y,4.0,d>=0?green:red);
    y+=0.46;
  });

  // 5 ativa
  const a=assessment();
  const r=results();
  slide=slideBase('Avaliação ativa',`${a.turma||'-'} • ${a.discipline||'-'} • ${avalNome(a)}`);
  card(slide,'Alunos',r.summary.nStudents||0,0.7,1.3,2.4,0.95,blue);
  card(slide,'Questões',r.summary.nQuestions||0,3.35,1.3,2.4,0.95,green);
  card(slide,'Média',`${r.summary.avg||0}`,6.0,1.3,2.4,0.95,amber);
  card(slide,'Abaixo da meta',r.summary.priority||0,8.65,1.3,2.8,0.95,red);
  slide.addText('Distribuição pedagógica', {x:0.72,y:2.75,w:5,h:0.3,fontSize:16,bold:true,color:blue});
  const levels=r.summary.levels||{};
  y=3.25;
  ['Elementar I','Elementar II','Básico','Desejável'].forEach(l=>{
    const pct=r.summary.nStudents?Math.round((levels[l]||0)/r.summary.nStudents*100):0;
    bar(slide,pptx,l,pct,0.75,y,6.0,l.includes('Elementar')?red:(l==='Básico'?amber:green));
    y+=0.5;
  });

  // 6 críticos
  slide=slideBase('Descritores críticos','Menores aproveitamentos da avaliação ativa');
  y=1.2;
  (r.descriptorStats||[]).slice(0,10).forEach(d=>{
    const color=d.percent<50?red:(d.percent<70?amber:green);
    bar(slide,pptx,`${d.descritor}`,d.percent,0.8,y,8.5,color);
    y+=0.48;
  });

  // 7 fortes
  slide=slideBase('Descritores fortes','Maiores aproveitamentos da avaliação ativa');
  y=1.2;
  (r.descriptorStats||[]).slice().sort((a,b)=>b.percent-a.percent).slice(0,10).forEach(d=>{
    bar(slide,pptx,`${d.descritor}`,d.percent,0.8,y,8.5,green);
    y+=0.48;
  });

  // 8 evolução descritor
  slide=slideBase('Evolução por descritor','Comparação da primeira e da última avaliação da turma/disciplina ativa');
  const g=groups[groupKey(a)]||[];
  if(g.length>=2){
    const m1=Object.fromEntries((compute(g[0]).descriptorStats||[]).map(d=>[d.descritor,d.percent]));
    const m2=Object.fromEntries((compute(g[g.length-1]).descriptorStats||[]).map(d=>[d.descritor,d.percent]));
    const codes=[...new Set([...Object.keys(m1),...Object.keys(m2)])].sort((x,y)=>x.localeCompare(y,'pt-BR',{numeric:true}));
    y=1.15;
    codes.slice(0,12).forEach(d=>{
      const v1=m1[d]||0, v2=m2[d]||0, delta=Math.round((v2-v1)*10)/10;
      slide.addText(`${d}: ${v1}% → ${v2}% (${delta>0?'+':''}${delta}%)`,{x:0.75,y,w:4.2,h:0.22,fontSize:9,bold:true,color:delta>=0?green:red,fit:'shrink'});
      bar(slide,pptx,'',v2,4.9,y,5.4,delta>=0?green:red);
      y+=0.43;
    });
  } else slide.addText('Ainda não há duas avaliações salvas para esta turma/disciplina.',{x:0.8,y:1.6,w:10,h:0.4,fontSize:18,color:gray});

  // 9 abaixo da meta
  slide=slideBase('Estudantes abaixo da meta','Prioridade para intervenção pedagógica');
  const abaixo=(r.students||[]).filter(s=>(s.percent||0)<60).sort((a,b)=>a.percent-b.percent).slice(0,14);
  y=1.15;
  abaixo.forEach((s,i)=>{
    const color=s.percent<40?red:(s.percent<60?amber:green);
    slide.addText(`${i+1}. ${s.name||s.nome||''}`,{x:0.75,y,w:5.5,h:0.22,fontSize:8.5,bold:true,color:'28364A',fit:'shrink'});
    slide.addText(s.level||'',{x:6.0,y,w:1.4,h:0.22,fontSize:8.5,color:gray});
    bar(slide,pptx,'',s.percent,7.2,y,3.7,color);
    y+=0.4;
  });

  // 10 plano
  slide=slideBase('Plano de intervenção','Encaminhamentos para o próximo ciclo');
  const crit=(r.descriptorStats||[]).slice(0,5);
  y=1.2;
  crit.forEach((d,i)=>{
    slide.addShape(pptx.ShapeType.roundRect,{x:0.8,y:y-0.06,w:11.6,h:0.5,rectRadius:0.05,fill:{color:light},line:{color:'E2E8F0'}});
    slide.addText(`${i+1}. ${d.descritor}`,{x:1.0,y,w:0.8,h:0.25,fontSize:13,bold:true,color:blue});
    slide.addText(`Retomar habilidade, resolver itens guiados e aplicar verificação curta. Aproveitamento: ${d.percent}%.`,{x:1.85,y,w:10.1,h:0.25,fontSize:11,color:'28364A',fit:'shrink'});
    y+=0.65;
  });
  slide.addText('Ações gerais: gerar fichas, organizar grupos por descritor, reaplicar atividade curta e registrar evidências para a coordenação.',{x:0.85,y:5.2,w:11.4,h:0.55,fontSize:15,color:green,bold:true,fit:'shrink'});

  // 11 final
  slide=slideBase('Síntese para decisão pedagógica','Uso dos dados para intervenção e acompanhamento');
  slide.addText('O diagnóstico deve orientar ações objetivas, acompanhar evolução e apoiar o planejamento coletivo da escola.',{x:0.9,y:1.5,w:11.5,h:1.0,fontSize:26,bold:true,color:blue,fit:'shrink'});
  slide.addText('Próximo passo recomendado: intervenção focada nos descritores críticos e nova comparação no próximo simulado.',{x:0.9,y:3.2,w:11.5,h:0.6,fontSize:18,color:green,bold:true});

  await pptx.writeFile({fileName:'vetor-diagnostico-profissional-v68-7.pptx'});
}

async function gerarPptSEPCEditavel(){
  if(!window.PptxGenJS){alert('PowerPoint não carregou. Atualize a página.');return;}
  const pptx=new PptxGenJS();
  pptx.layout='LAYOUT_WIDE';
  pptx.author='VETOR';
  pptx.subject='Apresentação editável dos resultados da avaliação';
  pptx.title='Resultados SEPC - VETOR';

  const blue='0F2E5F', green='009B61', yellow='FFD23F', red='E63242', orange='F4A62A', cyan='2563EB', ink='102033', muted='64748B', line='D9E2EF', bg='F6F8FC';
  const a=assessment();
  const r=compute(a);
  if(!r.summary?.nStudents){alert('Importe uma avaliação antes de gerar a apresentação.');return;}
  const avals=avaliacoes();
  const latest=latestByTurma(avals).map(av=>({a:av,r:compute(av)})).sort((x,y)=>(y.r.summary.avg||0)-(x.r.summary.avg||0));
  const school=A()?.state?.settings?.schoolName || A()?.state?.settings?.escola || A()?.state?.settings?.nomeEscola || 'Escola Técnica Estadual Professor José Luiz de Mendonça';
  const turma=a.turma||'Turma';
  const disciplina=a.discipline||'Língua Portuguesa';
  const data=a.date ? new Date(a.date+'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  const totalAlunos=r.summary.nStudents||0;
  const validos=r.summary.validStudents||0;
  const questoes=r.summary.nQuestions||0;
  const levels=r.summary.levels||{};
  const coherent=(r.students||[]).filter(s=>s.validForStats&&!s.incoerente).length;
  const incoherent=(r.students||[]).filter(s=>s.validForStats&&s.incoerente).length;
  const coherencePct=validos?Math.round(coherent/validos*100):0;
  const incoherencePct=validos?Math.round(incoherent/validos*100):0;
  const levelNames=['Elementar I','Elementar II','Básico','Desejável'];
  const levelColors=[red,orange,green,cyan];
  const levelValues=levelNames.map(l=>levels[l]||0);
  const levelPerc=levelValues.map(v=>validos?Math.round(v/validos*100):0);
  const priorityDesc=[...(r.descriptorStats||[])].sort((x,y)=>x.percent-y.percent).slice(0,6);
  const bestDesc=[...(r.descriptorStats||[])].sort((x,y)=>y.percent-x.percent).slice(0,3);
  const items=[...(r.items||[])];

  function tx(v){return String(v??'').replace(/\s+/g,' ').trim();}
  function pct(v){return `${Math.round(Number(v)||0)}%`;}
  function slide(title,subtitle=''){
    const s=pptx.addSlide();
    s.background={color:'FFFFFF'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.18,fill:{color:yellow},line:{color:yellow}});
    s.addShape(pptx.ShapeType.rect,{x:0,y:0.18,w:13.33,h:0.06,fill:{color:blue},line:{color:blue}});
    s.addText(title,{x:0.55,y:0.42,w:11.8,h:0.45,fontSize:25,bold:true,color:blue,margin:0,fit:'shrink'});
    if(subtitle)s.addText(subtitle,{x:0.57,y:0.88,w:11.6,h:0.24,fontSize:10.5,color:muted,margin:0,fit:'shrink'});
    s.addText('VETOR • apresentação editável',{x:0.55,y:7.08,w:5.8,h:0.18,fontSize:8,color:muted,margin:0});
    return s;
  }
  function card(s,label,value,x,y,w=2.7,h=1.05,color=blue){
    s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,fill:{color:'FFFFFF'},line:{color:line,width:1}});
    s.addShape(pptx.ShapeType.rect,{x,y,w:0.08,h,fill:{color},line:{color}});
    s.addText(label,{x:x+0.18,y:y+0.15,w:w-0.28,h:0.22,fontSize:9,bold:true,color:muted,margin:0,fit:'shrink'});
    s.addText(String(value),{x:x+0.18,y:y+0.48,w:w-0.28,h:0.35,fontSize:20,bold:true,color:ink,margin:0,fit:'shrink'});
  }
  function simpleTable(s,headers,rows,x,y,widths,rowH=0.36){
    let cx=x;
    headers.forEach((h,i)=>{s.addShape(pptx.ShapeType.rect,{x:cx,y,w:widths[i],h:rowH,fill:{color:'EAF0F8'},line:{color:line}});s.addText(h,{x:cx+0.05,y:y+0.08,w:widths[i]-0.1,h:0.16,fontSize:8.5,bold:true,color:blue,margin:0,fit:'shrink'});cx+=widths[i];});
    rows.forEach((row,ri)=>{cx=x;row.forEach((cell,i)=>{s.addShape(pptx.ShapeType.rect,{x:cx,y:y+rowH*(ri+1),w:widths[i],h:rowH,fill:{color:ri%2?'FFFFFF':'F8FBFF'},line:{color:line}});s.addText(String(cell),{x:cx+0.05,y:y+rowH*(ri+1)+0.08,w:widths[i]-0.1,h:0.16,fontSize:8.4,color:ink,margin:0,fit:'shrink'});cx+=widths[i];});});
  }
  function hBar(s,label,value,x,y,w,color=green){
    value=Math.max(0,Math.min(100,Number(value)||0));
    s.addText(label,{x,y,w:1.2,h:0.22,fontSize:10,bold:true,color:ink,margin:0,fit:'shrink'});
    s.addShape(pptx.ShapeType.roundRect,{x:x+1.35,y:y+0.03,w,h:0.16,rectRadius:0.03,fill:{color:'E9EEF6'},line:{color:'E9EEF6'}});
    s.addShape(pptx.ShapeType.roundRect,{x:x+1.35,y:y+0.03,w:w*value/100,h:0.16,rectRadius:0.03,fill:{color},line:{color}});
    s.addText(pct(value),{x:x+1.45+w,y:y-0.02,w:0.7,h:0.22,fontSize:9,color:ink,margin:0});
  }
  function vBar(s,label,value,x,y,maxH,color=blue){
    const h=maxH*(Math.max(0,Math.min(500,Number(value)||0))/500);
    s.addShape(pptx.ShapeType.rect,{x,y:y+maxH-h,w:0.65,h,fill:{color},line:{color}});
    s.addText(String(value),{x:x-0.1,y:y+maxH-h-0.28,w:0.85,h:0.18,fontSize:8.5,bold:true,color:ink,align:'center',margin:0});
    s.addText(label,{x:x-0.35,y:y+maxH+0.12,w:1.35,h:0.3,fontSize:8.2,color:ink,align:'center',fit:'shrink',margin:0});
  }
  function addEditablePie(s,x,y,w,h){
    try{
      s.addChart(pptx.ChartType.pie,[{name:'Distribuição',labels:levelNames,values:levelPerc}],{
        x,y,w,h,showLegend:false,showTitle:false,
        dataLabelPosition:'bestFit',showValue:false,showCategoryName:false,showPercent:true,
        ser:{dataLabelPosition:'bestFit'}
      });
    }catch(e){
      levelNames.forEach((l,i)=>hBar(s,l,levelPerc[i],x,y+i*0.48,w-1.8,levelColors[i]));
    }
  }
  function insight(s,title,body,x,y,w,h,color=blue){
    s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,fill:{color:'F8FBFF'},line:{color:line,width:1}});
    s.addShape(pptx.ShapeType.rect,{x,y,w:0.08,h,fill:{color},line:{color}});
    s.addText(title,{x:x+0.22,y:y+0.14,w:w-0.35,h:0.24,fontSize:12,bold:true,color,margin:0,fit:'shrink'});
    s.addText(body,{x:x+0.22,y:y+0.48,w:w-0.35,h:h-0.58,fontSize:13.5,color:ink,margin:0.02,fit:'shrink',breakLine:false});
  }
  function actionGrid(s,actions,x,y,w){
    actions.slice(0,4).forEach((text,i)=>{
      const bx=x+(i%2)*(w/2), by=y+Math.floor(i/2)*0.82;
      s.addShape(pptx.ShapeType.roundRect,{x:bx,y:by,w:w/2-0.18,h:0.58,rectRadius:0.06,fill:{color:i%2?'FFFFFF':'F8FBFF'},line:{color:line}});
      s.addText(String(i+1),{x:bx+0.16,y:by+0.15,w:0.28,h:0.2,fontSize:12,bold:true,color:green,margin:0});
      s.addText(text,{x:bx+0.52,y:by+0.12,w:w/2-0.78,h:0.26,fontSize:12.5,bold:true,color:ink,fit:'shrink',margin:0});
    });
  }
  function aiText(){
    const baixos=priorityDesc.slice(0,2).map(d=>d.descritor).join(' e ') || 'descritores prioritários';
    const fortes=bestDesc.map(d=>d.descritor).join(', ') || 'habilidades já consolidadas';
    return `A análise indica que a turma apresenta melhor domínio em ${fortes}. Entretanto, observa-se desempenho reduzido em ${baixos}, o que exige intervenção pedagógica planejada. Recomenda-se intensificar atividades de leitura crítica, resolução guiada de itens e retomada semanal dos descritores prioritários.`;
  }

  // Slide 1
  let s=pptx.addSlide();
  s.background={color:bg};
  s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:bg},line:{color:bg}});
  s.addShape(pptx.ShapeType.rect,{x:9.0,y:0.75,w:3.6,h:0.18,fill:{color:'DCE8F8',transparency:18},line:{color:'DCE8F8',transparency:18}});
  s.addShape(pptx.ShapeType.rect,{x:9.0,y:1.25,w:2.6,h:0.18,fill:{color:'E9F4EF',transparency:10},line:{color:'E9F4EF',transparency:10}});
  s.addText('SEPC',{x:8.9,y:4.8,w:3.6,h:0.7,fontSize:44,bold:true,color:'DCE8F8',transparency:20,align:'right',margin:0});
  s.addText('Resultados da avaliação',{x:0.75,y:1.15,w:8.6,h:0.62,fontSize:34,bold:true,color:blue,margin:0});
  s.addText(school,{x:0.78,y:2.0,w:8,h:0.34,fontSize:18,bold:true,color:ink,margin:0});
  s.addText(`${turma}\n${disciplina}\n${data}`,{x:0.8,y:2.65,w:6.2,h:1.25,fontSize:22,color:ink,breakLine:false,margin:0.02});
  s.addText('VETOR',{x:0.8,y:6.65,w:2.5,h:0.3,fontSize:16,bold:true,color:blue,margin:0});

  // Slide 2
  s=slide('Resumo executivo','Os indicadores principais mostram tamanho da amostra, proficiência e coerência da avaliação.');
  card(s,'Total de alunos',totalAlunos,0.75,1.55,2.85,1.25,blue);
  card(s,'Proficiência média',r.summary.avg||0,3.95,1.55,2.85,1.25,green);
  card(s,'Coerência média',coherencePct+'%',7.15,1.55,2.85,1.25,orange);
  card(s,'Questões',questoes,10.35,1.55,2.2,1.25,red);
  s.addText(`Participação: ${r.summary.participation||0}% • Avaliados: ${validos} • Faltosos: ${r.summary.absent||0} • Incompletas: ${r.summary.incomplete||0}`,{x:0.8,y:3.4,w:11.8,h:0.34,fontSize:16,color:ink,fit:'shrink'});
  insight(s,'Leitura para reunião',`A proficiência da turma deve ser interpretada com ${validos} estudantes válidos. Faltosos e avaliações incompletas não entram no cálculo, evitando distorção dos resultados.`,0.8,4.05,5.9,1.45,blue);
  insight(s,'Próxima decisão',`Comece pelos descritores ${priorityDesc.slice(0,3).map(d=>d.descritor).join(', ')||'prioritários'} e acompanhe a evolução no próximo simulado.`,7.05,4.05,5.45,1.45,green);

  // Slide 3
  s=slide('Mais da metade abaixo do básico exige ação focalizada','Distribuição dos estudantes por nível de proficiência.');
  addEditablePie(s,0.8,1.3,4.5,4.2);
  levelNames.forEach((l,i)=>{s.addShape(pptx.ShapeType.rect,{x:5.65,y:1.45+i*0.55,w:0.18,h:0.18,fill:{color:levelColors[i]},line:{color:levelColors[i]}});s.addText(`${l}: ${levelPerc[i]}%`,{x:5.9,y:1.39+i*0.55,w:2.8,h:0.28,fontSize:14,bold:true,color:ink,margin:0});});
  const below=(levelPerc[0]||0)+(levelPerc[1]||0);
  s.addText(below>50?'Mais da metade dos estudantes encontra-se abaixo do nível Básico, indicando necessidade de intervenções pedagógicas prioritárias.':'A maior parte dos estudantes já alcança Básico ou Desejável, mas ainda há grupo que demanda recomposição focalizada.',{x:8.3,y:1.45,w:4.0,h:2.4,fontSize:20,bold:true,color:blue,fit:'shrink'});
  actionGrid(s,['Agrupar por nível','Retomar descritores críticos','Aplicar atividade curta','Registrar evidências'],5.9,4.25,6.2);

  // Slide 4
  s=slide('Comparação entre turmas evidencia diferenças de desempenho','Proficiência média por turma na última avaliação salva.');
  latest.slice(0,6).forEach((x,i)=>vBar(s,x.a.turma||`Turma ${i+1}`,x.r.summary.avg||0,1.0+i*1.75,2.05,3.5,[blue,green,orange,red,cyan,'7C3AED'][i%6]));
  s.addShape(pptx.ShapeType.line,{x:0.75,y:5.55,w:11.5,h:0,line:{color:line,width:1}});

  // Slide 5
  s=slide('Ranking das turmas organiza prioridades de acompanhamento','Tabela editável com proficiência média por turma.');
  simpleTable(s,['Turma','Proficiência'],latest.slice(0,10).map(x=>[x.a.turma||'-',x.r.summary.avg||0]),0.9,1.35,[6.6,2.4],0.42);

  // Slide 6
  s=slide('Itens muito fáceis e muito difíceis ajudam a calibrar a prova','Índice de acerto, peso automático e classificação por questão.');
  simpleTable(s,['Questão','Descritor','IA','Peso','Classificação'],items.slice(0,14).map(it=>[it.question||`Q${it.index+1}`,it.descritor||'-',pct(it.percent),String(it.peso).replace('.',','),it.diff]),0.55,1.12,[1.3,1.7,1.2,1.2,3.1],0.34);
  insight(s,'Leitura dos itens','Itens com IA muito baixo indicam onde a turma mais errou; itens muito altos podem confirmar habilidades já consolidadas.',9.45,1.2,2.8,1.9,orange);

  // Slide 7
  s=slide('Descritores mostram onde a turma sustenta ou perde desempenho','Aproveitamento por descritor em barras horizontais.');
  [...(r.descriptorStats||[])].sort((a,b)=>b.percent-a.percent).slice(0,11).forEach((d,i)=>hBar(s,d.descritor,d.percent,0.75,1.15+i*0.43,8.8,d.percent<50?red:(d.percent<70?orange:green)));
  insight(s,'Radar pedagógico','Use os descritores com menor aproveitamento para montar grupos temporários e selecionar itens comentados.',10.0,1.25,2.45,2.3,blue);

  // Slide 8
  s=slide('Habilidades prioritárias definem a intervenção pedagógica','Descritores com menor aproveitamento exigem ação mais rápida.');
  simpleTable(s,['Descritor','Percentual','Prioridade','Ação'],priorityDesc.slice(0,8).map(d=>[d.descritor,pct(d.percent),d.percent<40?'Alta':d.percent<60?'Média':'Monitorar',d.percent<60?'Reensino + item guiado':'Acompanhar']),0.55,1.2,[1.55,1.65,1.55,3.55],0.42);
  actionGrid(s,['Escolher 2 descritores','Preparar itens comentados','Corrigir coletivamente','Verificar em 7 dias'],8.9,1.35,3.45);

  // Slide 9
  s=slide('A coerência mostra a estabilidade das respostas','Estudantes incoerentes exigem leitura cuidadosa do padrão de acertos.');
  card(s,'Coerentes',coherencePct+'%',1.0,1.55,3.6,1.45,green);
  card(s,'Incoerentes',incoherencePct+'%',5.0,1.55,3.6,1.45,red);
  s.addText('A coerência compara acertos em itens fáceis e difíceis. Quando o padrão é incomum, a plataforma sinaliza possível inconsistência para interpretação pedagógica mais prudente.',{x:1.05,y:3.7,w:10.8,h:1.15,fontSize:20,color:ink,fit:'shrink'});

  // Slide 10
  s=slide('A inteligência pedagógica transforma dados em orientação','Síntese automática para leitura da coordenação e dos professores.');
  s.addShape(pptx.ShapeType.roundRect,{x:0.9,y:1.35,w:11.4,h:3.7,rectRadius:0.08,fill:{color:'F8FBFF'},line:{color:line}});
  s.addText(aiText(),{x:1.25,y:1.75,w:10.7,h:2.75,fontSize:22,color:ink,fit:'shrink',breakLine:false,margin:0.02});

  // Slide 11
  s=slide('Recomendações para o próximo ciclo','Ações objetivas para organizar a intervenção.');
  const recs=[
    `Reforçar ${priorityDesc[0]?.descritor||'descritor prioritário'}`,
    `Reforçar ${priorityDesc[1]?.descritor||'segundo descritor prioritário'}`,
    disciplina.toLowerCase().includes('port')?'Trabalhar leitura inferencial':'Trabalhar resolução guiada de problemas',
    'Aplicar novo simulado em 30 dias'
  ];
  simpleTable(s,['Ação','Responsável','Prazo','Evidência'],[
    [recs[0],'Professor','7 dias','Atividade corrigida'],
    [recs[1],'Professor','7 dias','Item comentado'],
    [recs[2],'Professor','Próxima aula','Registro da aula'],
    [recs[3],'Equipe','30 dias','Nova proficiência']
  ],0.55,1.25,[4.4,2.0,1.45,2.7],0.52);
  insight(s,'Fechamento','As ações foram organizadas para acompanhamento prático: o que fazer, quem faz, prazo e evidência.',0.6,5.2,11.4,0.8,green);

  // Slide 12 - perfil pedagógico da turma
  s=slide('Perfil pedagógico da turma','Síntese dos cards de prioridade, participação e níveis.');
  card(s,'Avaliados',validos,0.8,1.25,2.35,1.05,blue);
  card(s,'Participação',`${r.summary.participation||0}%`,3.45,1.25,2.35,1.05,green);
  card(s,'Faltosos',r.summary.absent||0,6.1,1.25,2.35,1.05,orange);
  card(s,'Incompletas',r.summary.incomplete||0,8.75,1.25,2.35,1.05,red);
  s.addText(`Leitura: ${below>50?'a turma precisa de recomposição prioritária antes de avançar para habilidades mais complexas.':'a turma apresenta base razoável, com intervenção pontual nos descritores críticos.'}`,{x:0.85,y:3.0,w:11.3,h:0.75,fontSize:20,bold:true,color:blue,fit:'shrink'});
  priorityDesc.slice(0,4).forEach((d,i)=>hBar(s,d.descritor,d.percent,0.9,4.1+i*0.45,7.8,d.percent<50?red:orange));

  // Slide 13 - evolução histórica da turma
  s=slide('Evolução histórica da turma','Histórico de avaliações salvas para a mesma turma e disciplina.');
  const hist=avals.filter(av=>(av.turma||'')===(a.turma||'')&&(av.discipline||'')===(a.discipline||'')).sort((x,y)=>(x.date||'').localeCompare(y.date||'')||(x.tipo||'').localeCompare(y.tipo||''));
  if(hist.length){
    simpleTable(s,['Avaliação','Data','Proficiência','Avaliados'],hist.slice(-10).map(av=>{const cr=compute(av);return [avalNome(av),av.date||'-',cr.summary.avg||0,cr.summary.validStudents||0];}),0.8,1.25,[3.7,1.6,1.9,1.6],0.4);
  }else{
    s.addText('Ainda não há histórico suficiente para evolução.',{x:0.9,y:1.5,w:10,h:0.4,fontSize:20,color:muted});
  }

  // Slide 14 - mapa de calor resumido
  s=slide('Mapa de calor em síntese','Alunos com menor aproveitamento para análise rápida.');
  const heatRows=[...(r.students||[])].sort((x,y)=>(x.percent||0)-(y.percent||0)).slice(0,12).map(st=>[st.name||st.nome||'-',`${st.total||0}/${questoes}`,`${st.percent||0}%`,st.statusLabel||st.level||'-']);
  simpleTable(s,['Aluno','Acertos','%','Status'],heatRows,0.55,1.1,[5.8,1.4,1.0,2.4],0.34);
  insight(s,'Uso cuidadoso','O mapa de calor serve para priorizar apoio, não para expor estudantes. Use com foco em encaminhamento pedagógico.',9.9,1.15,2.4,1.8,red);

  await pptx.writeFile({fileName:`vetor-sepc-${fileSafe(turma)}-${fileSafe(disciplina)}.pptx`});
}

function selectedAssessmentsForPpt(){
  const all=avaliacoes();
  const activeId=$('#diagnosticAssessmentSelect')?.value || A()?.state?.activeAssessmentId || assessment().id;
  const active=all.find(x=>x.id===activeId) || assessment();
  const ids=[...document.querySelectorAll('#diagnosticCompareOptions input[type="checkbox"]:checked')].map(x=>x.value);
  let selected=[active,...ids.map(id=>all.find(x=>x.id===id)).filter(Boolean)].filter(Boolean);
  if(selected.length<2) selected=latestByTurma(all).slice(0,4);
  const seen=new Set();
  return selected.filter(a=>a?.id&&!seen.has(a.id)&&seen.add(a.id));
}

async function gerarPptSEPCCompilado(groupOverride=null,pptxOverride=null,writeFile=true){
  if(!window.PptxGenJS){alert('PowerPoint não carregou. Atualize a página.');return;}
  const group=groupOverride||selectedAssessmentsForPpt();
  const discKey=a=>String(a?.discipline||'Sem disciplina').trim().toLowerCase();
  if(!groupOverride){
    const groupsByDisc=Object.values(group.reduce((acc,a)=>{const k=discKey(a);(acc[k]??=[]).push(a);return acc;},{}));
    if(groupsByDisc.length>1){
      const pptx=new PptxGenJS();
      pptx.layout='LAYOUT_WIDE';
      pptx.author='VETOR';
      pptx.title='Compilado SEPC por disciplinas - VETOR';
      for(const g of groupsByDisc.filter(g=>g.length)){
        await gerarPptSEPCCompilado(g,pptx,false);
      }
      await pptx.writeFile({fileName:'vetor-sepc-compilado-por-disciplinas.pptx'});
      return;
    }
  }
  if(group.length<2){alert('Selecione ao menos duas turmas para gerar o compilado.');return;}
  const pptx=pptxOverride||new PptxGenJS();
  if(!pptxOverride){
    pptx.layout='LAYOUT_WIDE';
    pptx.author='VETOR';
    pptx.title='Compilado SEPC - VETOR';
  }
  const blue='0F2E5F', green='009B61', yellow='FFD23F', red='E63242', orange='F4A62A', cyan='2563EB', ink='102033', muted='64748B', line='D9E2EF', bg='F6F8FC';
  const rows=group.map(a=>({a,r:compute(a)}));
  const disciplina=rows[0]?.a?.discipline||'Disciplina';
  const school=A()?.state?.settings?.schoolName || A()?.state?.settings?.escola || A()?.state?.settings?.nomeEscola || 'Escola Técnica Estadual Professor José Luiz de Mendonça';
  const total=rows.reduce((s,x)=>s+(x.r.summary.nStudents||0),0);
  const valid=rows.reduce((s,x)=>s+(x.r.summary.validStudents||0),0);
  const avgProf=valid?Math.round(rows.reduce((s,x)=>s+(x.r.summary.avg||0)*(x.r.summary.validStudents||0),0)/valid*10)/10:0;
  const coherent=rows.reduce((s,x)=>s+(x.r.students||[]).filter(st=>st.validForStats&&!st.incoerente).length,0);
  const incoherent=rows.reduce((s,x)=>s+(x.r.students||[]).filter(st=>st.validForStats&&st.incoerente).length,0);
  const coherence=valid?Math.round(coherent/valid*100):0;
  const questionCount=rows[0]?.r?.summary?.nQuestions||0;
  const levels=['Elementar I','Elementar II','Básico','Desejável'];
  const levelColors=[red,orange,green,cyan];
  const levelCounts=Object.fromEntries(levels.map(l=>[l,rows.reduce((s,x)=>s+(x.r.summary.levels?.[l]||0),0)]));
  const levelPerc=levels.map(l=>valid?Math.round(levelCounts[l]/valid*100):0);
  const allDesc={};
  rows.forEach(({r})=>(r.descriptorStats||[]).forEach(d=>{const o=allDesc[d.descritor]??={descritor:d.descritor,correct:0,total:0};o.correct+=d.correct||0;o.total+=d.total||0;}));
  const descStats=Object.values(allDesc).map(d=>({...d,percent:d.total?Math.round(d.correct/d.total*1000)/10:0})).sort((a,b)=>a.percent-b.percent);
  const itemBase=rows[0].r.items||[];
  function itemDescriptor(it,i,assessment=rows[0]?.a){
    return it?.descriptor||it?.descritor||assessment?.descriptors?.[i]||rows.find(x=>x.a?.descriptors?.[i])?.a?.descriptors?.[i]||'-';
  }
  const items=itemBase.map((it,i)=>{
    const correct=rows.reduce((s,x)=>s+(x.r.items?.[i]?.correct||0),0);
    const totalIt=rows.reduce((s,x)=>s+(x.r.items?.[i]?.total||0),0);
    const percent=totalIt?Math.round(correct/totalIt*1000)/10:0;
    return {...it,descriptor:itemDescriptor(it,i),correct,total:totalIt,percent};
  });
  function slide(title,subtitle=''){
    const s=pptx.addSlide();s.background={color:'FFFFFF'};
    s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.18,fill:{color:yellow},line:{color:yellow}});
    s.addShape(pptx.ShapeType.rect,{x:0,y:0.18,w:13.33,h:0.06,fill:{color:blue},line:{color:blue}});
    s.addText(title,{x:0.55,y:0.42,w:11.8,h:0.45,fontSize:25,bold:true,color:blue,margin:0,fit:'shrink'});
    if(subtitle)s.addText(subtitle,{x:0.57,y:0.88,w:11.6,h:0.24,fontSize:10.5,color:muted,margin:0,fit:'shrink'});
    s.addText('VETOR • compilado editável',{x:0.55,y:7.08,w:5.8,h:0.18,fontSize:8,color:muted,margin:0});
    return s;
  }
  function card(s,label,value,x,y,w=2.7,h=1.05,color=blue){s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,fill:{color:'FFFFFF'},line:{color:line,width:1}});s.addShape(pptx.ShapeType.rect,{x,y,w:0.08,h,fill:{color},line:{color}});s.addText(label,{x:x+0.18,y:y+0.15,w:w-0.28,h:0.22,fontSize:9,bold:true,color:muted,margin:0,fit:'shrink'});s.addText(String(value),{x:x+0.18,y:y+0.48,w:w-0.28,h:0.35,fontSize:20,bold:true,color:ink,margin:0,fit:'shrink'});}
  function table(s,headers,data,x,y,widths,rowH=0.36){let cx=x;headers.forEach((h,i)=>{s.addShape(pptx.ShapeType.rect,{x:cx,y,w:widths[i],h:rowH,fill:{color:'EAF0F8'},line:{color:line}});s.addText(h,{x:cx+0.05,y:y+0.08,w:widths[i]-0.1,h:0.16,fontSize:8.5,bold:true,color:blue,margin:0,fit:'shrink'});cx+=widths[i];});data.forEach((row,ri)=>{cx=x;row.forEach((cell,i)=>{s.addShape(pptx.ShapeType.rect,{x:cx,y:y+rowH*(ri+1),w:widths[i],h:rowH,fill:{color:ri%2?'FFFFFF':'F8FBFF'},line:{color:line}});s.addText(String(cell),{x:cx+0.05,y:y+rowH*(ri+1)+0.08,w:widths[i]-0.1,h:0.16,fontSize:8.2,color:ink,margin:0,fit:'shrink'});cx+=widths[i];});});}
  function hBar(s,label,value,x,y,w,color=green){value=Math.max(0,Math.min(100,Number(value)||0));s.addText(label,{x,y,w:1.4,h:0.22,fontSize:9.5,bold:true,color:ink,margin:0,fit:'shrink'});s.addShape(pptx.ShapeType.roundRect,{x:x+1.55,y:y+0.03,w,h:0.16,rectRadius:0.03,fill:{color:'E9EEF6'},line:{color:'E9EEF6'}});s.addShape(pptx.ShapeType.roundRect,{x:x+1.55,y:y+0.03,w:w*value/100,h:0.16,rectRadius:0.03,fill:{color},line:{color}});s.addText(`${Math.round(value)}%`,{x:x+1.65+w,y:y-0.02,w:0.7,h:0.22,fontSize:9,color:ink,margin:0});}
  function scoreBar(s,label,value,x,y,w,color=green){const score=Math.max(0,Math.min(500,Number(value)||0));s.addText(label,{x,y,w:2.5,h:0.22,fontSize:8.8,bold:true,color:ink,margin:0,fit:'shrink'});s.addShape(pptx.ShapeType.roundRect,{x:x+2.7,y:y+0.03,w,h:0.18,rectRadius:0.03,fill:{color:'E9EEF6'},line:{color:'E9EEF6'}});s.addShape(pptx.ShapeType.roundRect,{x:x+2.7,y:y+0.03,w:w*score/500,h:0.18,rectRadius:0.03,fill:{color},line:{color}});s.addText(String(score),{x:x+2.82+w,y:y-0.01,w:0.72,h:0.22,fontSize:9,bold:true,color:ink,margin:0});}
  function chunks(arr,size){const out=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out;}
  function heatColor(value){
    const v=Math.max(0,Math.min(100,Number(value)||0));
    if(v<20)return 'FEE2E2';
    if(v<40)return 'FECACA';
    if(v<60)return 'FED7AA';
    if(v<75)return 'FEF3C7';
    return 'DCFCE7';
  }
  function anonymizeName(name){
    const parts=String(name||'-').trim().split(/\s+/).filter(Boolean);
    if(parts.length<=1)return parts[0]||'-';
    return `${parts[0]} ${parts[parts.length-1].charAt(0)}.`;
  }
  function heatTable(s,headers,data,x,y,widths,rowH=0.32){
    let cx=x;
    headers.forEach((h,i)=>{s.addShape(pptx.ShapeType.rect,{x:cx,y,w:widths[i],h:rowH,fill:{color:'EAF0F8'},line:{color:line}});s.addText(h,{x:cx+0.05,y:y+0.08,w:widths[i]-0.1,h:0.16,fontSize:8.5,bold:true,color:blue,margin:0,fit:'shrink'});cx+=widths[i];});
    data.forEach((row,ri)=>{cx=x;headers.forEach((_,i)=>{const cell=row[i];const isHeat=i>=3;const fill=isHeat?heatColor(row[5]):(ri%2?'FFFFFF':'F8FBFF');s.addShape(pptx.ShapeType.rect,{x:cx,y:y+rowH*(ri+1),w:widths[i],h:rowH,fill:{color:fill},line:{color:line}});s.addText(String(cell),{x:cx+0.05,y:y+rowH*(ri+1)+0.08,w:widths[i]-0.1,h:0.16,fontSize:8.2,color:ink,margin:0,fit:'shrink'});cx+=widths[i];});});
  }
  function vBar(s,label,value,x,y,maxH,color=blue){const h=maxH*(Math.max(0,Math.min(500,Number(value)||0))/500);s.addShape(pptx.ShapeType.rect,{x,y:y+maxH-h,w:0.7,h,fill:{color},line:{color}});s.addText(String(value),{x:x-0.08,y:y+maxH-h-0.28,w:0.85,h:0.18,fontSize:8.5,bold:true,color:ink,align:'center',margin:0});s.addText(label,{x:x-0.45,y:y+maxH+0.12,w:1.6,h:0.34,fontSize:8,color:ink,align:'center',fit:'shrink',margin:0});}
  function pie(s,x,y,w,h){try{s.addChart(pptx.ChartType.pie,[{name:'Distribuição',labels:levels,values:levelPerc}],{x,y,w,h,showLegend:false,showPercent:true,showValue:false});}catch(e){levels.forEach((l,i)=>hBar(s,l,levelPerc[i],x,y+i*0.5,w-1.8,levelColors[i]));}}
  function insight(s,title,body,x,y,w,h,color=blue){
    s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.08,fill:{color:'F8FBFF'},line:{color:line,width:1}});
    s.addShape(pptx.ShapeType.rect,{x,y,w:0.08,h,fill:{color},line:{color}});
    s.addText(title,{x:x+0.22,y:y+0.14,w:w-0.35,h:0.24,fontSize:12,bold:true,color,margin:0,fit:'shrink'});
    s.addText(body,{x:x+0.22,y:y+0.48,w:w-0.35,h:h-0.58,fontSize:13.5,color:ink,margin:0.02,fit:'shrink',breakLine:false});
  }
  function metricRow(s,items,x,y,w){
    const cw=w/items.length;
    items.forEach((it,i)=>{
      const bx=x+i*cw;
      s.addShape(pptx.ShapeType.roundRect,{x:bx,y,w:cw-0.15,h:0.68,rectRadius:0.06,fill:{color:'FFFFFF'},line:{color:line}});
      s.addText(it.label,{x:bx+0.14,y:y+0.1,w:cw-0.35,h:0.16,fontSize:7.8,bold:true,color:muted,margin:0,fit:'shrink'});
      s.addText(String(it.value),{x:bx+0.14,y:y+0.32,w:cw-0.35,h:0.22,fontSize:15,bold:true,color:it.color||ink,margin:0,fit:'shrink'});
    });
  }
  function actionGrid(s,actions,x,y,w){
    actions.slice(0,4).forEach((text,i)=>{
      const bx=x+(i%2)*(w/2), by=y+Math.floor(i/2)*0.82;
      s.addShape(pptx.ShapeType.roundRect,{x:bx,y:by,w:w/2-0.18,h:0.58,rectRadius:0.06,fill:{color:i%2?'FFFFFF':'F8FBFF'},line:{color:line}});
      s.addText(String(i+1),{x:bx+0.16,y:by+0.15,w:0.28,h:0.2,fontSize:12,bold:true,color:green,margin:0});
      s.addText(text,{x:bx+0.52,y:by+0.12,w:w/2-0.78,h:0.26,fontSize:12.5,bold:true,color:ink,fit:'shrink',margin:0});
    });
  }

  let s=pptx.addSlide();
  s.background={color:bg};
  s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:bg},line:{color:bg}});
  s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.25,fill:{color:yellow},line:{color:yellow}});
  s.addShape(pptx.ShapeType.rect,{x:8.8,y:0.95,w:3.4,h:4.9,fill:{color:'EAF0F8'},line:{color:'EAF0F8'}});
  s.addText('Compilado das turmas',{x:0.8,y:0.98,w:8.3,h:0.58,fontSize:34,bold:true,color:blue,margin:0});
  s.addText(`${school}\n${disciplina}`,{x:0.84,y:1.86,w:6.9,h:0.7,fontSize:20,bold:true,color:ink,fit:'shrink',margin:0});
  s.addText(rows.map(x=>x.a.turma).join('  |  '),{x:0.84,y:2.92,w:7.2,h:0.7,fontSize:16,color:muted,fit:'shrink',margin:0});
  metricRow(s,[{label:'Turmas',value:rows.length,color:blue},{label:'Alunos',value:total,color:green},{label:'Média',value:avgProf,color:orange},{label:'Questões',value:questionCount,color:red}],0.85,4.42,7.5);
  s.addText('VETOR',{x:0.85,y:6.65,w:2.5,h:0.3,fontSize:16,bold:true,color:blue,margin:0});
  s.addText('Apresentação editável para reuniões pedagógicas',{x:8.95,y:5.0,w:3.0,h:0.5,fontSize:17,bold:true,color:blue,fit:'shrink',margin:0});
  s=slide('Resumo executivo do compilado','Indicadores consolidados das turmas selecionadas.');
  card(s,'Total de alunos',total,0.75,1.4,2.7,1.15,blue);card(s,'Avaliados',valid,3.75,1.4,2.7,1.15,green);card(s,'Proficiência média',avgProf,6.75,1.4,2.7,1.15,orange);card(s,'Coerência média',coherence+'%',9.75,1.4,2.7,1.15,red);
  s.addText(`Questões: ${questionCount} • Turmas no compilado: ${rows.length} • Incoerentes: ${incoherent}`,{x:0.8,y:3.2,w:11.7,h:0.35,fontSize:16,color:ink});
  insight(s,'Leitura para a equipe',`A média consolidada deve ser lida junto da participação. Foram considerados ${valid} estudantes válidos de ${total} registrados; faltosos e incompletos não distorcem a proficiência.`,0.8,4.05,5.9,1.45,blue);
  insight(s,'Decisão sugerida',`Priorizar os descritores ${descStats.slice(0,3).map(d=>d.descritor).join(', ')||'críticos'} e comparar estratégias entre as turmas com maior e menor média.`,7.05,4.05,5.45,1.45,green);
  s=slide('Distribuição consolidada por nível','Percentuais calculados apenas com avaliações válidas.');
  pie(s,0.65,1.2,5.0,4.55);levels.forEach((l,i)=>{s.addShape(pptx.ShapeType.rect,{x:6.0,y:1.35+i*0.62,w:0.22,h:0.22,fill:{color:levelColors[i]},line:{color:levelColors[i]}});s.addText(`${l}: ${levelPerc[i]}% (${levelCounts[l]||0})`,{x:6.35,y:1.29+i*0.62,w:3.25,h:0.28,fontSize:15,bold:true,color:ink});});
  insight(s,'Conclusão automática',((levelPerc[0]+levelPerc[1])>50?'Mais da metade está abaixo do Básico; a intervenção deve ser articulada por descritores comuns.':'A maior parte está em Básico/Desejável, mas os descritores críticos ainda pedem acompanhamento.'),8.95,1.25,3.45,1.8,blue);
  actionGrid(s,['Agrupar estudantes por nível','Definir descritores comuns','Planejar recomposição curta','Reavaliar em 30 dias'],6.0,4.35,6.4);
  const sortedRows=rows.slice().sort((a,b)=>(b.r.summary.avg||0)-(a.r.summary.avg||0));
  chunks(sortedRows,10).forEach((chunk,ci)=>{
    s=slide(`Comparação direta entre turmas${ci?` (${ci+1})`:''}`,`Proficiência média válida por turma - ${disciplina}.`);
    chunk.forEach((x,i)=>scoreBar(s,x.a.turma||`Turma ${i+1}`,x.r.summary.avg||0,0.75,1.25+i*0.43,7.1,[blue,green,orange,red,cyan][i%5]));
    if(ci===0){
      const bestLocal=sortedRows[0], worstLocal=sortedRows[sortedRows.length-1];
      insight(s,'Maior proficiência',`${bestLocal?.a?.turma||'-'}: ${bestLocal?.r?.summary?.avg||0}`,9.5,1.25,2.8,1.0,green);
      insight(s,'Ponto de atenção',`${worstLocal?.a?.turma||'-'}: ${worstLocal?.r?.summary?.avg||0}`,9.5,2.55,2.8,1.0,red);
      insight(s,'Uso pedagógico','Compare práticas, ritmo de correção e descritores críticos antes de transformar a diferença em ranking isolado.',9.5,3.85,2.8,1.35,blue);
    }
  });
  const best=sortedRows[0], worst=sortedRows[sortedRows.length-1];
  chunks(sortedRows,10).forEach((chunk,ci)=>{
    s=slide(`Ranking das turmas${ci?` (${ci+1})`:''}`,`Ordenação por proficiência média válida - ${disciplina}.`);
    table(s,['Turma','Avaliados','Proficiência','Elem. I/II'],chunk.map(x=>[x.a.turma||'-',`${x.r.summary.validStudents||0}/${x.r.summary.nStudents||0}`,x.r.summary.avg||0,x.r.summary.priority||0]),0.65,1.2,[4.6,1.8,1.8,1.7],0.38);
    if(ci===0)insight(s,'Como ler',`O ranking deve indicar onde observar boas práticas e onde apoiar mais de perto. Priorize turmas com menor proficiência e maior concentração em Elementar I/II.`,9.95,1.25,2.5,2.2,blue);
  });
  s=slide('Questões no compilado','IA consolidado, peso e classificação dos itens.');
  table(s,['Questão','Descritor','IA','Peso','Classificação'],items.slice(0,14).map((it,i)=>[it.question||`Q${it.index+1}`,itemDescriptor(it,it.index??i),`${Math.round(it.percent)}%`,String(it.peso).replace('.',','),it.diff]),0.5,1.1,[1.2,1.55,1.0,1.0,2.65],0.32);
  insight(s,'Legenda','IA = índice de acerto da questão. Peso = valor pedagógico calculado pelo motor escolhido; itens mais difíceis tendem a pesar mais.',8.2,1.2,4.05,1.28,orange);
  s=slide('Descritores consolidados','Aproveitamento agregado das turmas selecionadas.');
  descStats.slice(0,11).forEach((d,i)=>hBar(s,d.descritor,d.percent,0.7,1.15+i*0.43,6.4,d.percent<50?red:(d.percent<70?orange:green)));
  insight(s,'Ranking de descritores',`As barras ordenam as habilidades com menor aproveitamento. Os menores percentuais devem orientar agrupamentos e atividades da semana.`,9.35,1.25,3.0,2.05,blue);
  s=slide('Habilidades prioritárias do compilado','Descritores com menor aproveitamento no conjunto.');
  table(s,['Descritor','Percentual','Prioridade','Ação'],descStats.slice(0,8).map(d=>[d.descritor,`${Math.round(d.percent)}%`,d.percent<40?'Alta':d.percent<60?'Média':'Monitorar',d.percent<60?'Reensino + item guiado':'Acompanhar']),0.55,1.2,[1.55,1.65,1.55,3.55],0.42);
  actionGrid(s,['Escolher 2 descritores para a semana','Separar grupos por dificuldade','Usar questões comentadas','Registrar evidências'],8.9,1.35,3.45);
  s=slide('Coerência do compilado','Leitura da estabilidade das respostas.');
  card(s,'Coerentes',coherence+'%',0.9,1.35,3.3,1.35,green);card(s,'Incoerentes',valid?Math.round(incoherent/valid*100)+'%':'0%',4.55,1.35,3.3,1.35,red);card(s,'Avaliados válidos',valid,8.2,1.35,3.3,1.35,blue);
  insight(s,'Explicação',`A coerência ajuda a identificar padrões incomuns de resposta. Alunos incoerentes devem ser analisados com cuidado antes de decisões pedagógicas individuais.`,0.95,3.45,5.6,1.65,blue);
  insight(s,'Encaminhamento',`Quando a incoerência subir, revise gabarito, presença, preenchimento da planilha e possíveis respostas aleatórias.`,6.95,3.45,5.2,1.65,orange);
  s=slide('Inteligência pedagógica do compilado','Síntese automática para coordenação.');
  const low=descStats.slice(0,3).map(d=>d.descritor).join(', ');
  const high=descStats.slice().sort((a,b)=>b.percent-a.percent).slice(0,3).map(d=>d.descritor).join(', ');
  s.addShape(pptx.ShapeType.roundRect,{x:0.9,y:1.35,w:11.4,h:3.8,rectRadius:0.08,fill:{color:'F8FBFF'},line:{color:line}});
  s.addText(`A análise consolidada indica melhor desempenho em ${high||'descritores de maior aproveitamento'}. As maiores fragilidades concentram-se em ${low||'descritores prioritários'}, recomendando intervenção comum entre turmas, acompanhamento por grupos e nova verificação em curto prazo.`,{x:1.25,y:1.75,w:10.7,h:2.8,fontSize:22,color:ink,fit:'shrink'});
  chunks(rows,10).forEach((chunk,ci)=>{
    s=slide(`Perfil pedagógico das turmas${ci?` (${ci+1})`:''}`,`Participação, avaliações válidas e estudantes em atenção - ${disciplina}.`);
    table(s,['Turma','Avaliados/total','Faltosos','Incompletas','Elem. I/II','Média'],chunk.map(x=>[x.a.turma||'-',`${x.r.summary.validStudents||0}/${x.r.summary.nStudents||0}`,x.r.summary.absent||0,x.r.summary.incomplete||0,x.r.summary.priority||0,x.r.summary.avg||0]),0.35,1.1,[2.8,1.65,1.25,1.45,1.45,1.35],0.36);
    if(ci===0)insight(s,'Leitura rápida','Este slide junta participação e nível. Uma turma com média baixa e muitos faltosos exige plano diferente de uma turma com média baixa e alta participação.',10.4,1.15,2.0,2.5,blue);
  });
  const all=avaliacoes(), evoRows=rows.map(({a})=>{
    const hist=all.filter(av=>(av.turma||'')===(a.turma||'')&&(av.discipline||'')===(a.discipline||'')).sort((x,y)=>(x.date||'').localeCompare(y.date||'')||(x.tipo||'').localeCompare(y.tipo||''));
    if(hist.length<2)return [a.turma||'-','sem histórico','-','-'];
    const first=compute(hist[0]).summary.avg||0, last=compute(hist[hist.length-1]).summary.avg||0, delta=Math.round((last-first)*10)/10;
    return [a.turma||'-',first,last,(delta>0?'+':'')+delta];
  });
  if(evoRows.some(row=>row[1]!=='sem histórico')){
    s=slide('Evolução histórica das turmas','Primeira e última avaliação salva por turma/disciplina.');
    table(s,['Turma','1ª média','Última média','Evolução'],evoRows.filter(row=>row[1]!=='sem histórico'),0.7,1.25,[4.2,1.8,1.8,1.8],0.44);
    insight(s,'Acompanhamento','Crescimento ou queda aparecem apenas para turmas com duas ou mais avaliações salvas na mesma disciplina.',0.75,5.55,11.2,0.8,green);
  }
  s=slide('Mapa de calor consolidado','Alunos com menor aproveitamento; cores mais vermelhas indicam menor percentual.');
  const lowStudents=rows.flatMap(({a,r})=>(r.students||[]).filter(st=>st.validForStats).map(st=>({turma:a.turma||'-',name:st.name||st.nome||'-',percent:st.percent||0,total:st.total||0,n:r.summary.nQuestions||0,level:st.level||'-'}))).sort((x,y)=>x.percent-y.percent).slice(0,12);
  heatTable(s,['Turma','Aluno','Acertos','%','Nível'],lowStudents.map(st=>[st.turma,anonymizeName(st.name),`${st.total}/${st.n}`,`${st.percent}%`,st.level,st.percent]),0.35,1.2,[2.0,4.6,1.2,0.9,1.8],0.32);
  insight(s,'Uso cuidadoso','O mapa de calor serve para priorizar apoio, não para expor estudantes. Use em reunião pedagógica com foco em encaminhamento.',0.55,5.7,11.6,0.78,red);

  rows.forEach(({a,r},idx)=>{
    const turma=a.turma||`Turma ${idx+1}`;
    const validTurma=r.summary.validStudents||0;
    const nQuestions=r.summary.nQuestions||0;
    const totalCorrect=(r.students||[]).filter(st=>st.validForStats).reduce((sum,st)=>sum+(Number(st.total)||0),0);
    const tctDen=validTurma*nQuestions;
    const tctPct=tctDen?Math.round(totalCorrect/tctDen*1000)/10:0;
    const indivCounts=levels.map(l=>r.summary.levels?.[l]||0);
    const indivPerc=levels.map((l,i)=>validTurma?Math.round(indivCounts[i]/validTurma*100):0);
    const indivDesc=[...(r.descriptorStats||[])].sort((x,y)=>(x.percent||0)-(y.percent||0));
    const indivItems=[...(r.items||[])].sort((x,y)=>(x.percent||0)-(y.percent||0));
    const attention=[...(r.students||[])].filter(st=>st.validForStats).sort((x,y)=>(x.percent||0)-(y.percent||0)).slice(0,8);
    s=slide(`Resultado individual - ${turma}`,`${a.discipline||disciplina} - ${avalNome(a)} - ${a.date||'data nao informada'}`);
    card(s,'Proficiência',r.summary.avg||0,0.65,1.2,2.45,1.05,blue);
    card(s,'TCT / acertos',`${tctPct}%`,3.35,1.2,2.45,1.05,green);
    card(s,'Avaliados',`${validTurma}/${r.summary.nStudents||0}`,6.05,1.2,2.45,1.05,orange);
    card(s,'Elem. I/II',r.summary.priority||0,8.75,1.2,2.45,1.05,red);
    s.addText('Distribuição da turma por nível',{x:0.72,y:2.68,w:4.1,h:0.26,fontSize:14,bold:true,color:blue,margin:0});
    levels.forEach((l,i)=>hBar(s,l,indivPerc[i],0.75,3.08+i*0.42,3.55,levelColors[i]));
    insight(s,'Leitura da turma',`A turma ${turma} apresenta proficiência ${r.summary.avg||0}, TCT de ${tctPct}% e ${r.summary.priority||0} estudante(s) em Elementar I/II.`,6.55,2.75,5.55,1.28,blue);
    table(s,['Indicador','Valor'],[['Faltosos',r.summary.absent||0],['Incompletas',r.summary.incomplete||0],['Questões',nQuestions],['Descritores críticos',indivDesc.filter(d=>(d.percent||0)<40).length]],6.55,4.35,[3.0,1.35],0.34);
    s=slide(`Prioridades da turma - ${turma}`,'Descritores e questões com menor aproveitamento.');
    table(s,['Descritor','Acerto','Prioridade'],indivDesc.slice(0,7).map(d=>[d.descritor||'-',`${Math.round(d.percent||0)}%`,(d.percent||0)<40?'Alta':(d.percent||0)<60?'Média':'Monitorar']),0.55,1.1,[1.15,1.0,1.25],0.36);
    indivDesc.slice(0,7).forEach((d,i)=>hBar(s,d.descritor||'-',d.percent||0,3.55,1.18+i*0.40,6.35,(d.percent||0)<50?red:orange));
    table(s,['Questão','Descritor','IA','Classificação'],indivItems.slice(0,8).map((it,i)=>[it.question||`Q${(it.index||0)+1}`,itemDescriptor(it,it.index??i,a),`${Math.round(it.percent||0)}%`,it.diff||'-']),0.55,4.45,[1.1,1.45,0.9,2.05],0.29);
    insight(s,'Encaminhamento',`Retomar ${indivDesc.slice(0,3).map(d=>d.descritor).join(', ')||'descritores críticos'} com correção comentada, itens guiados e nova verificação curta.`,7.55,4.55,4.65,1.15,green);
    s=slide(`Alunos em atenção - ${turma}`,'Lista de apoio para planejamento pedagógico.');
    table(s,['Aluno','Acertos','%','Nível'],attention.map(st=>[st.name||st.nome||'-',`${st.total||0}/${nQuestions}`,`${st.percent||0}%`,st.level||'-']),0.55,1.15,[5.4,1.3,1.0,2.0],0.38);
    insight(s,'Uso recomendado','Use esta lista para organizar grupos temporários de apoio. A finalidade é planejar intervenção, devolutiva e reavaliação, não ranquear estudantes.',0.7,5.55,11.2,0.78,red);
  });
  s=slide('Recomendações para as turmas','Encaminhamentos do compilado.');
  table(s,['Ação','Responsável','Prazo','Evidência'],[
    [`Intervir nos descritores ${low||'prioritários'}`,'Professor','7 dias','Atividade corrigida'],
    ['Comparar práticas entre turmas','Coordenação','15 dias','Registro da reunião'],
    ['Organizar grupos por descritor','Professor','Próxima aula','Lista de grupos'],
    ['Aplicar novo simulado','Equipe','30 dias','Nova proficiência']
  ],0.55,1.25,[4.4,2.0,1.45,2.7],0.52);
  insight(s,'Fechamento','As recomendações foram organizadas para virar pauta de acompanhamento: ação, responsável, prazo e evidência.',0.6,5.2,11.4,0.8,green);
  if(writeFile)await pptx.writeFile({fileName:`vetor-sepc-compilado-${fileSafe(disciplina)}.pptx`});
}

function bind(){
  const idsPdf=['#v57Print','#v59Print','#printSheet','#printMap'];
  idsPdf.forEach(id=>{const el=$(id); if(el) el.onclick=gerarPdf;});
  const idsWord=['#v57Doc','#v59Word'];
  idsWord.forEach(id=>{const el=$(id); if(el) el.onclick=gerarWord;});
  const turmaBtn=$('#generatePptxReport'); if(turmaBtn) turmaBtn.onclick=()=>gerarPptSEPCEditavel();
  const compBtn=$('#coordenacaoPptxBtn'); if(compBtn) compBtn.onclick=()=>gerarPptSEPCCompilado();
  const instBtn=$('#coordInstitucionalPptx'); if(instBtn) instBtn.onclick=()=>gerarPptSEPCCompilado();
  // Corrigir label da avaliação quando estiver genérico.
  setInterval(()=>document.querySelectorAll('*').forEach(el=>{
    if(el.childNodes && el.childNodes.length===1 && el.textContent==='Avaliação: Avaliação') el.textContent='Avaliação: '+avalNome();
  }),2500);
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,900));
window.ExportacoesOffice={gerarPdf,gerarWord,gerarPptProfissional,gerarPptSEPCEditavel,gerarPptSEPCCompilado,fullDocHtml,docHtml};
})();

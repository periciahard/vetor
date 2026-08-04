
(function(){
'use strict';

const $ = s => document.querySelector(s);
const A = () => window.VETOR;
const safe = s => String(s ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const txt = s => String(s ?? '').replace(/\s+/g,' ').trim();

function tipoLabel(t){
  const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
  for(let i=1;i<=10;i++) map['simulado'+i]='Simulado '+i;
  return map[t] || t || 'Avaliação';
}
function results(){
  return A()?.getResults?.() || {students:[],summary:{},descriptorStats:[]};
}
function assessment(){
  return A()?.state?.assessment || {};
}
function ensureFichaGenerated(){
  const preview = $('#v57Preview');
  if(window.Fichas?.render && (!preview || preview.classList.contains('empty') || !preview.textContent.trim())){
    window.Fichas.render();
  }
  return preview?.innerHTML || '';
}
function ensurePrintGenerated(){
  const preview = $('#v59Preview');
  if(window.Impressao?.generate && (!window.__IMPRESSAO_LAST || !preview || preview.classList.contains('empty') || !preview.textContent.trim() || preview.textContent.includes('aparecerá aqui'))){
    window.Impressao.generate();
  }
  return window.__IMPRESSAO_LAST?.html || preview?.innerHTML || '';
}
function cleanHtml(html){
  const div=document.createElement('div');
  div.innerHTML=html || '';
  div.querySelectorAll('textarea,script,button,.actions,.statusbox').forEach(e=>e.remove());
  div.querySelectorAll('.texto-base').forEach(e=>{
    e.style.background='transparent';
    e.style.border='0';
    e.style.padding='0';
  });
  return div.innerHTML;
}
async function gerarPdfFromHtml(html, filename='documento.pdf'){
  html = cleanHtml(html);
  if(!html || !html.replace(/<[^>]+>/g,'').trim()){
    alert('Nenhum conteúdo foi gerado para o PDF. Gere a ficha/pacote primeiro.');
    return;
  }
  const holder=document.createElement('div');
  holder.className='docx-modelo-preview';
  holder.style.position='fixed';
  holder.style.left='-10000px';
  holder.style.top='0';
  holder.style.width='794px';
  holder.innerHTML=html;
  document.body.appendChild(holder);
  try{
    if(window.html2pdf){
      await html2pdf().set({
        margin: [10,10,10,10],
        filename,
        image: {type:'jpeg', quality:0.98},
        html2canvas: {scale:2, useCORS:true},
        jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
        pagebreak: {mode:['css','legacy'], avoid:['.qitem','.questao-modelo','.print-question']}
      }).from(holder).save();
    }else{
      const w=window.open('','_blank');
      if(!w){alert('Permita pop-ups para imprimir.'); return;}
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(filename)}</title><style>body{font-family:Arial,sans-serif;padding:18mm}.texto-base{background:transparent!important;border:0!important;padding:0!important}.qitem{border:0!important;page-break-inside:avoid}.ficha-page,.print-sheet{page-break-after:always}@media print{@page{size:A4;margin:12mm}}</style></head><body>${html}<script>setTimeout(()=>window.print(),700)<\/script></body></html>`);
      w.document.close();
    }
  }finally{
    holder.remove();
  }
}

function inferSerieTurmaCurso(turma){
  const t=String(turma||'').toUpperCase();
  const serie = t.includes('3') ? '3º Ano' : t.includes('2') ? '2º Ano' : '1º Ano';
  const curso = t.includes('RED') ? 'Red' : t.includes('ADMIN') || t.includes('ADM') ? 'Adm' : '';
  const letra = /\bA\b/.test(t) ? 'A' : /\bB\b/.test(t) ? 'B' : '';
  return {serie, curso, letra};
}
function extractQuestionsFromPreview(){
  let html = ensureFichaGenerated();
  if(!html) html=ensurePrintGenerated();
  const div=document.createElement('div');
  div.innerHTML=html;
  const items=[...div.querySelectorAll('.qitem,.print-question')];
  return items.map((item,i)=>{
    const textBase = item.querySelector('.texto-base,.print-textbase')?.textContent?.trim() || '';
    const raw = item.textContent.replace(/\s+/g,' ').trim();
    const title = item.querySelector('b')?.textContent?.trim() || `QUESTÃO ${String(i+1).padStart(2,'0')}`;
    let enunciado = '';
    const p = item.querySelector('p');
    if(p) enunciado=p.textContent.trim();
    let alts = [];
    const ol = item.querySelector('ol');
    if(ol) alts=[...ol.querySelectorAll('li')].map((li,j)=>`${String.fromCharCode(65+j)}) ${li.textContent.trim()}`);
    else {
      const divs=[...item.querySelectorAll('div')].map(d=>d.textContent.trim()).filter(Boolean);
      const altText=divs.find(x=>/A\)/.test(x)&&/B\)/.test(x));
      if(altText) alts=altText.split(/(?=[A-E]\))/).map(x=>x.trim()).filter(Boolean);
    }
    return {title,textBase,enunciado,alts,raw};
  });
}
function modeloHtmlInstitucional(aluno='_________________________________________________________'){
  const a=assessment();
  const info=inferSerieTurmaCurso(a.turma);
  const data = a.date ? a.date.split('-').reverse().join(' / ') : '___ / ___ / 2026';
  const questoes = extractQuestionsFromPreview();
  const atividade = a.title || tipoLabel(a.tipo) || 'Nome da atividade';
  const header = `
  <div class="cabecalho-modelo">
    <p><b>Estudante:</b> ${safe(aluno)} &nbsp;&nbsp; <b>Turma:</b> ${info.letra==='A'?'( X )A':'(  )A'} &nbsp; ${info.letra==='B'?'( X )B':'(  )B'}</p>
    <p><b>Série:</b> ${info.serie==='1º Ano'?'( X ) 1º Ano':'(   ) 1º Ano'} &nbsp; ${info.serie==='2º Ano'?'( X ) 2º Ano':'(   ) 2º Ano'} &nbsp; ${info.serie==='3º Ano'?'( X ) 3º Ano':'(   ) 3º Ano'} &nbsp;&nbsp;&nbsp; <b>Curso:</b> ${info.curso==='Adm'?'( X ) Adm':'(   ) Adm'} &nbsp; ${info.curso==='Red'?'( X ) Red':'(   ) Red'}</p>
    <p><b>Data:</b> ${safe(data)} &nbsp;&nbsp;&nbsp;&nbsp; <b>Disciplina:</b> ${safe(a.discipline||'')} &nbsp;&nbsp;&nbsp;&nbsp; <b>Professor:</b> Felipe Camargo &nbsp;&nbsp;&nbsp;&nbsp; <b>${safe(atividade)}</b></p>
  </div>`;
  const body = questoes.length ? questoes.map((q,i)=>`
    <div class="questao-modelo">
      <p><b>QUESTÃO ${String(i+1).padStart(2,'0')}</b> – ${safe(q.textBase || q.enunciado || q.raw)}</p>
      ${q.textBase && q.enunciado ? `<p>${safe(q.enunciado)}</p>` : ''}
      ${q.alts?.length ? `<p>${q.alts.map(safe).join('<br>')}</p>` : ''}
    </div>`).join('') : '<p><b>QUESTÃO 01</b> – Texto da questão ..............................................................................................................................................................</p>';
  return `<div class="docx-modelo-preview">${header}${body}</div>`;
}
function downloadBlob(name, blob){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);
}
async function gerarWordInstitucional(){
  const a=assessment();
  let aluno='_________________________________________________________';
  const sel=$('#sheetStudent')||$('#v59Student');
  if(sel && sel.value!==''){
    const st=results().students?.[Number(sel.value)];
    if(st?.name) aluno=st.name;
  }
  const html=modeloHtmlInstitucional(aluno);
  if(window.htmlDocx){
    const blob = window.htmlDocx.asBlob('<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>');
    downloadBlob('ficha-institucional-vetor.docx', blob);
  }else{
    const blob = new Blob(['<html><head><meta charset="utf-8"><style>body{font-family:Arial}.texto-base{background:transparent;border:0}</style></head><body>'+html+'</body></html>'], {type:'application/msword;charset=utf-8'});
    downloadBlob('ficha-institucional-vetor.doc', blob);
  }
}
function gerarPdfFicha(){
  const html=modeloHtmlInstitucional();
  gerarPdfFromHtml(html,'ficha-institucional-vetor.pdf');
}
function gerarPdfImpressao(){
  const html=ensurePrintGenerated();
  gerarPdfFromHtml(html,'fichas-em-lote-vetor.pdf');
}

function patchPowerPoint(){
  const old=window.Melhorias?.relatorioConsolidado;
  window.gerarPowerPointVetor = async function(){
    if(!window.PptxGenJS){
      alert('Biblioteca de PowerPoint não carregou. Atualize a página e tente novamente.');
      return;
    }
    const app=A();
    const list=(app?.state?.assessments||[]).filter(x=>(x.students||[]).length&&(x.questions||[]).length);
    if(!list.length){alert('Não há avaliações com dados para gerar apresentação.');return;}
    const pptx=new PptxGenJS();
    pptx.layout='LAYOUT_WIDE';
    pptx.author='VETOR';
    pptx.subject='Diagnóstico Pedagógico';
    pptx.title='VETOR';
    const blue='0F2E5F', green='1D6B42', yellow='FFD23F';

    function titleSlide(title,subtitle){
      const slide=pptx.addSlide();
      slide.background={color:'FFFFFF'};
      slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.18,fill:{color:yellow},line:{color:yellow}});
      slide.addText(title,{x:0.6,y:0.55,w:12,h:0.6,fontSize:30,bold:true,color:blue});
      slide.addText(subtitle,{x:0.6,y:1.25,w:12,h:0.5,fontSize:16,color:'444444'});
      slide.addText('VETOR',{x:0.6,y:6.75,w:10,h:0.3,fontSize:11,color:'666666'});
      return slide;
    }
    titleSlide('Diagnóstico Pedagógico','Resultados, evolução, descritores críticos e encaminhamentos');

    const rows=list.slice(0,12).map(a=>{
      const r=window.Diagnostico?.compute(a)||{summary:{avg:0,nStudents:0}};
      return [a.turma||'', a.discipline||'', tipoLabel(a.tipo), a.date||'', String(r.summary.avg)+'%'];
    });
    let slide=titleSlide('Resumo das avaliações','Visão geral das avaliações salvas no sistema');
    slide.addTable([['Turma','Disciplina','Avaliação','Data','Média'],...rows],{x:0.45,y:1.6,w:12.4,h:4.5,fontSize:10,border:{type:'solid',color:'CCCCCC'},fill:{color:'F8FBFF'}});

    const current=assessment();
    const r=results();
    slide=titleSlide('Avaliação ativa','Indicadores gerais da avaliação selecionada');
    slide.addText(`Turma: ${current.turma||'-'}\nDisciplina: ${current.discipline||'-'}\nAvaliação: ${current.title||tipoLabel(current.tipo)}\nAlunos: ${r.summary.nStudents||0}\nQuestões: ${r.summary.nQuestions||0}\nMédia: ${r.summary.avg||0}\nAbaixo da meta: ${r.summary.priority||0}`,{x:0.7,y:1.4,w:5.6,h:3.5,fontSize:18,color:'222222',breakLine:false});
    slide.addText('Descritores críticos',{x:6.7,y:1.4,w:5,h:0.4,fontSize:20,bold:true,color:blue});
    slide.addText((r.descriptorStats||[]).slice(0,8).map(d=>`${d.descritor}: ${d.percent}%`).join('\n')||'Sem dados',{x:6.7,y:1.95,w:5.6,h:3.2,fontSize:16,color:'222222'});

    slide=titleSlide('Encaminhamentos pedagógicos','Ações recomendadas para o próximo ciclo');
    slide.addText('1. Retomar descritores críticos em aulas curtas e objetivas.\n2. Gerar fichas individualizadas para estudantes abaixo da meta.\n3. Aplicar nova verificação após a intervenção.\n4. Comparar a evolução no próximo simulado.\n5. Registrar evidências para acompanhamento da coordenação.',{x:0.9,y:1.4,w:11.5,h:4,fontSize:20,color:'222222',breakLine:false});

    await pptx.writeFile({fileName:'vetor-diagnostico-v68-7.pptx'});
  };
}

function bind(){
  patchPowerPoint();

  const pptBtn=$('#generatePptxReport');
  if(pptBtn)pptBtn.onclick=()=>window.gerarPowerPointVetor();

  const fichaPdf=$('#v57Print');
  if(fichaPdf)fichaPdf.onclick=gerarPdfFicha;

  const fichaDoc=$('#v57Doc');
  if(fichaDoc)fichaDoc.onclick=gerarWordInstitucional;

  const printPdf=$('#v59Print');
  if(printPdf)printPdf.onclick=gerarPdfImpressao;

  const printWord=$('#v59Word');
  if(printWord)printWord.onclick=gerarWordInstitucional;

  // remove sombreamento já renderizado
  document.addEventListener('click',()=>setTimeout(()=>{
    document.querySelectorAll('.texto-base').forEach(e=>{e.style.background='transparent';e.style.borderLeft='0';e.style.padding='0';});
  },100));
}

document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,700));
window.ExportacoesPDF={gerarPdfFicha,gerarPdfImpressao,gerarWordInstitucional,gerarPdfFromHtml};
})();

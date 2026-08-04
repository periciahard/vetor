(function(){
  'use strict';
  const A=()=>window.VETOR;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const fileSafe=s=>String(s||'vetor').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'vetor';

  function metaTitle(){
    const a=A()?.state?.assessment||{};
    return `${a.title||'Diagnóstico pedagógico'}${a.turma?' - '+a.turma:''}`;
  }
  function selectedPanels(mode='geral'){
    const ids=mode==='coordenacao'
      ? ['coordExecutivePanel','coordDashboard','coordDescriptorComparePanel','coordLongitudinalPanel','schoolRiskPanel','autoConselhoPanel','disciplineComparison','cloudCoordDashboard','vetorCoordPanel']
      : ['diagnostico','descritores','evolucao','recuperacao','coordenacao'];
    const panels=[];
    ids.forEach(id=>{
      const el=document.getElementById(id);
      if(!el)return;
      if(el.classList?.contains('view')){
        panels.push(...$$('.panel,.cards,.chart-grid,.preview-table',el).filter(visibleAndUseful));
      }else if(visibleAndUseful(el)){
        panels.push(el);
      }
    });
    let unique=panels.filter((el,i,arr)=>arr.indexOf(el)===i);
    if(mode==='coordenacao' && unique.length<3){
      unique=selectedPanels('geral');
    }
    return unique.slice(0,18);
  }
  function visibleAndUseful(el){
    const txt=(el.textContent||'').trim();
    if(!txt || txt.length<8)return false;
    if(/aguardando|nenhuma avaliação|sem dados/i.test(txt) && txt.length<80)return false;
    return true;
  }
  function makeShell(panels,mode){
    const shell=document.createElement('div');
    shell.id='vetorVisualExportShell';
    shell.innerHTML=`<style>
      #vetorVisualExportShell{position:fixed;left:-12000px;top:0;width:1120px;background:#f5f7fb;color:#0f172a;padding:28px;font-family:Arial,Helvetica,sans-serif}
      #vetorVisualExportShell .export-cover{background:#0f2e5f;color:white;border-radius:0;padding:28px 32px;margin-bottom:18px;border-top:10px solid #ffd23f}
      #vetorVisualExportShell .export-cover h1{margin:0 0 8px;font-size:30px}
      #vetorVisualExportShell .export-cover p{margin:4px 0;color:#e5edf8}
      #vetorVisualExportShell .export-page{background:white;border:1px solid #d9e2ef;border-radius:8px;margin:0 0 18px;padding:18px;break-inside:avoid;page-break-inside:avoid;box-shadow:none}
      #vetorVisualExportShell .panel,#vetorVisualExportShell .card,#vetorVisualExportShell .preview-table{box-shadow:none!important}
      #vetorVisualExportShell button,#vetorVisualExportShell input,#vetorVisualExportShell select,#vetorVisualExportShell textarea,#vetorVisualExportShell .actions,#vetorVisualExportShell .help-dot{display:none!important}
    </style>`;
    const a=A()?.state?.assessment||{};
    const cover=document.createElement('div');
    cover.className='export-cover';
    cover.innerHTML=`<h1>${safe(mode==='coordenacao'?'Gestão escolar':'Resultados da avaliação')}</h1><p>${safe(metaTitle())}</p><p>${safe(a.discipline||'')} ${a.date?('• '+safe(a.date)):''}</p><p>VETOR • Exportação fiel aos painéis da plataforma</p>`;
    shell.appendChild(cover);
    panels.forEach((panel,i)=>{
      const page=document.createElement('section');
      page.className='export-page';
      const clone=panel.cloneNode(true);
      clone.querySelectorAll('button,input,select,textarea,.actions,.help-dot,script').forEach(n=>n.remove());
      page.appendChild(clone);
      shell.appendChild(page);
    });
    document.body.appendChild(shell);
    return shell;
  }
  async function waitFonts(){
    try{await document.fonts?.ready;}catch(e){}
    await new Promise(r=>setTimeout(r,120));
  }
  async function toCanvas(el){
    if(!window.html2canvas)throw new Error('Biblioteca de captura visual não carregou.');
    return html2canvas(el,{scale:2,backgroundColor:'#ffffff',useCORS:true,scrollX:0,scrollY:0,windowWidth:1280});
  }
  async function exportPdf(mode='geral'){
    const panels=selectedPanels(mode);
    if(!panels.length){alert('Não encontrei painéis com dados para exportar. Abra/atualize a tela de resultados primeiro.');return;}
    const shell=makeShell(panels,mode);
    try{
      await waitFonts();
      await html2pdf().set({
        margin:[8,8,8,8],
        filename:fileSafe(`${mode==='coordenacao'?'gestao-escolar':'resultados'}-${metaTitle()}`)+'.pdf',
        image:{type:'jpeg',quality:0.98},
        html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},
        pagebreak:{mode:['css','legacy'],avoid:['.export-page','.panel','.card']}
      }).from(shell).save();
    }finally{shell.remove();}
  }
  async function exportPpt(mode='geral'){
    const a=A()?.state?.assessment||{};
    if(!((a.students||[]).length && (a.questions||[]).length)){
      alert('Abra uma avaliação com dados antes de gerar o PowerPoint. Esta avaliação ainda está sem alunos/questões importados.');
      return;
    }
    const panels=selectedPanels(mode);
    if(!panels.length){alert('Não encontrei painéis com dados para exportar. Abra/atualize a tela de resultados primeiro.');return;}
    if(!window.PptxGenJS){alert('PowerPoint não carregou. Atualize a página.');return;}
    const shell=makeShell(panels,mode);
    try{
      await waitFonts();
      const pptx=new PptxGenJS();
      pptx.layout='LAYOUT_WIDE';
      pptx.author='VETOR';
      pptx.subject='Exportação visual fiel';
      pptx.title=metaTitle();
      const slides=$$('.export-cover,.export-page',shell);
      for(const el of slides){
        const canvas=await toCanvas(el);
        const img=canvas.toDataURL('image/png');
        const slide=pptx.addSlide();
        slide.background={color:'FFFFFF'};
        const ratio=canvas.width/canvas.height;
        let w=12.7, h=w/ratio;
        if(h>6.85){h=6.85; w=h*ratio;}
        slide.addImage({data:img,x:(13.333-w)/2,y:(7.5-h)/2,w,h});
      }
      await pptx.writeFile({fileName:fileSafe(`${mode==='coordenacao'?'gestao-escolar':'resultados'}-${metaTitle()}`)+'.pptx'});
    }finally{shell.remove();}
  }
  function bind(){
    const run=async(fn)=>{
      try{await fn();}
      catch(e){
        console.error('Falha na exportação visual:',e);
        alert('Não foi possível gerar o documento agora: '+(e.message||e));
      }
    };
    const docAction=(id)=>{
      if(!['v57Print','v57Doc','v59Print','v59Word'].includes(id))return;
      let fn=null;
      if(id==='v57Print')fn=window.ExportacoesPDF?.gerarPdfFicha || window.ExportacoesOffice?.gerarPdf;
      if(id==='v57Doc')fn=window.ExportacoesPDF?.gerarWordInstitucional || window.ExportacoesOffice?.gerarWord;
      if(id==='v59Print')fn=window.ExportacoesPDF?.gerarPdfImpressao || window.Impressao?.printNow;
      if(id==='v59Word')fn=window.ExportacoesPDF?.gerarWordInstitucional || window.Impressao?.downloadWord;
      if(typeof fn!=='function'){alert('O gerador deste documento ainda não carregou. Atualize a página e tente novamente.');return;}
      return run(()=>fn());
    };
    const pptAction=(mode='turma')=>{
      const fn=mode==='compilado'
        ? (window.ExportacoesOffice?.gerarPptSEPCCompilado || window.ExportacoesOffice?.gerarPptSEPCEditavel || window.ExportacoesOffice?.gerarPptProfissional)
        : (window.ExportacoesOffice?.gerarPptSEPCEditavel || window.ExportacoesOffice?.gerarPptProfissional);
      if(typeof fn!=='function'){alert('O gerador de PowerPoint ainda não carregou. Atualize a página e tente novamente.');return;}
      return run(()=>fn());
    };
    const ppt=$('#generatePptxReport'); if(ppt)ppt.onclick=()=>pptAction('turma');
    const coord=$('#coordenacaoPptxBtn'); if(coord)coord.onclick=()=>pptAction('compilado');
    const reportPdf=$('#exportReportPdf'); if(reportPdf)reportPdf.onclick=()=>run(()=>exportPdf('coordenacao'));
    ['v57Print','v57Doc','v59Print','v59Word'].forEach(id=>{const el=$('#'+id); if(el)el.onclick=()=>docAction(id);});
    if(!document.__vetorVisualExportCapture){
      document.__vetorVisualExportCapture=true;
      document.addEventListener('click',e=>{
        const btn=e.target.closest?.('#generatePptxReport,#coordenacaoPptxBtn,#exportReportPdf,#v57Print,#v57Doc,#v59Print,#v59Word');
        if(!btn)return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if(btn.id==='generatePptxReport')pptAction('turma');
        if(btn.id==='coordenacaoPptxBtn')pptAction('compilado');
        if(btn.id==='exportReportPdf')run(()=>exportPdf('coordenacao'));
        docAction(btn.id);
      },true);
    }
    window.ExportacaoVisual={exportPdf,exportPpt,selectedPanels};
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,1800));
})();


(function(){
'use strict';
const $=s=>document.querySelector(s);
const A=()=>window.VETOR;
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const norm=s=>String(s??'').trim();
const HEADER='assets/vetor-logo.svg';

function tipoLabel(t){
 const map={diagnostica:'Diagnóstica',recuperacao:'Recuperação',bimestral:'Bimestral',personalizada:'Personalizada'};
 for(let i=1;i<=10;i++)map['simulado'+i]='Simulado '+i;
 return map[t]||t||'Avaliação';
}
function assessment(){return A()?.state?.assessment||{}}
function results(){return A()?.getResults?.()||{students:[],summary:{},descriptorStats:[]}}
function compute(a){return window.Diagnostico?.compute(a)||{students:[],summary:{avg:0,nStudents:0,nQuestions:0,priority:0,levels:{}},descriptorStats:[]}}
function avalNome(a=assessment()){
 const t=norm(a.title);
 return (t && !/^avaliação$/i.test(t) && !/^nova avaliação$/i.test(t)) ? t : tipoLabel(a.tipo);
}
function currentStudentName(){
 for(const id of ['#sheetStudent','#v59Student','#mapStudent']){
   const el=$(id);
   if(el && el.value!==''){
     const st=results().students?.[Number(el.value)];
     if(st?.name||st?.nome)return st.name||st.nome;
   }
 }
 return '_________________________________________________________';
}
function infoFromTurma(turma){
 const t=String(turma||'').toUpperCase();
 return {A:/\bA\b/.test(t),B:/\bB\b/.test(t),adm:t.includes('ADM')||t.includes('ADMIN'),red:t.includes('RED'),s1:t.includes('1'),s2:t.includes('2'),s3:t.includes('3')};
}
function ensureFichas(){
 if(window.Fichas?.render){
  const p=$('#v57Preview');
  if(!p || p.classList.contains('empty') || !p.textContent.trim()) window.Fichas.render();
 }
}
function ensureImpressao(){
 if(window.Impressao?.generate){
  const p=$('#v59Preview');
  if(!window.__IMPRESSAO_LAST || !p || p.classList.contains('empty') || !p.textContent.trim() || /aparecerá aqui/i.test(p.textContent)) window.Impressao.generate();
 }
}
function extractQuestions(){
 ensureFichas();
 let html=$('#v57Preview')?.innerHTML||'';
 if(!html){ensureImpressao(); html=window.__IMPRESSAO_LAST?.html||$('#v59Preview')?.innerHTML||'';}
 const div=document.createElement('div'); div.innerHTML=html;
 const nodes=[...div.querySelectorAll('.qitem,.print-question,.questao-modelo')];
 return nodes.map((node,i)=>{
   const base=node.querySelector('.texto-base,.print-textbase')?.textContent?.trim()||'';
   const all=Array.from(node.querySelectorAll('p,div,ol')).map(e=>e.textContent.trim()).filter(Boolean);
   let enun='';
   const p=node.querySelector('p');
   if(p)enun=p.textContent.trim();
   let altTxt=all.find(x=>/A\)/.test(x)&&/B\)/.test(x))||'';
   let alts=altTxt?altTxt.split(/(?=[A-E]\))/).map(x=>x.trim()).filter(Boolean):[];
   const raw=node.textContent.replace(/\s+/g,' ').trim();
   if(!enun) enun=raw;
   return {n:i+1,base,enun,alts,raw};
 }).filter(q=>q.base||q.enun);
}
function fichaHeaderHtml(student){
 const a=assessment(), info=infoFromTurma(a.turma);
 const data=a.date?a.date.split('-').reverse().join(' / '):'___ / ___ / 2026';
 return `<div class="v62-header">
   <img src="${HEADER}" class="v62-header-img"/>
   <div class="v62-overlay">
     <div class="row r1"><b>Estudante:</b> ${safe(student)} <span><b>Turma:</b> ${info.A?'( X )A':'(   )A'} &nbsp; ${info.B?'( X )B':'(   )B'}</span></div>
     <div class="row r2"><b>Série:</b> ${info.s1?'( X ) 1º Ano':'(   ) 1º Ano'} &nbsp; ${info.s2?'( X ) 2º Ano':'(   ) 2º Ano'} &nbsp; ${info.s3?'( X ) 3º Ano':'(   ) 3º Ano'} <span><b>Curso:</b> ${info.adm?'( X ) Adm':'(   ) Adm'} &nbsp; ${info.red?'( X ) Red':'(   ) Red'}</span></div>
     <div class="row r3"><b>Data:</b> ${safe(data)} <span class="disc"><b>Disciplina:</b> ${safe(a.discipline||'')}</span> <span class="prof"><b>Professor:</b> Felipe Camargo</span></div>
     <div class="atividade">${safe(avalNome(a))}</div>
   </div>
 </div>`;
}
function fichaHtml(student=currentStudentName()){
 const qs=extractQuestions();
 const body=qs.map(q=>{
   const text=q.base||q.enun||q.raw;
   const enun=q.base?q.enun:'';
   return `<div class="v62-question"><p><b>QUESTÃO ${String(q.n).padStart(2,'0')} - </b>${safe(text)}</p>${enun?`<p>${safe(enun)}</p>`:''}${q.alts.length?`<p>${q.alts.map(safe).join('<br>')}</p>`:''}</div>`;
 }).join('');
 return `<!doctype html><html><head><meta charset="utf-8"><style>${documentStyle()}</style></head><body><div class="v62-page">${fichaHeaderHtml(student)}<div class="v62-questions">${body||'<p><b>QUESTÃO 01 - </b>Texto da questão ..............................................................................................................................................................</p>'}</div></div></body></html>`;
}
function documentStyle(){
 return `@page{size:A4;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;color:#111;margin:0;background:#fff}.v62-page{width:190mm;margin:0 auto;background:#fff}.v62-header{position:relative;width:190mm;height:48mm;margin:0 0 5mm 0;overflow:hidden}.v62-header-img{position:absolute;left:0;top:0;width:190mm;height:48mm;object-fit:fill}.v62-overlay{position:absolute;left:8mm;right:8mm;top:25mm;font-size:9.8pt;line-height:1.1}.v62-overlay .row{margin:1.3mm 0;font-weight:400}.v62-overlay .row span{float:right}.v62-overlay .disc{float:none;margin-left:21mm}.v62-overlay .prof{float:none;margin-left:24mm}.v62-overlay .atividade{position:absolute;left:0;right:0;top:19.2mm;border:1px solid #222;text-align:center;font-weight:bold;padding:1.8mm 0;background:#fff}.v62-questions{column-count:2;column-gap:8mm;column-rule:1px solid #111;text-align:justify}.v62-question{break-inside:avoid;margin:0 0 5mm 0}.v62-question p{margin:0 0 2.2mm 0}.texto-base,.qitem,.print-question{background:transparent!important;border:0!important;padding:0!important}@media print{body{margin:0}.v62-page{width:auto}.v62-questions{column-count:2}}`;
}
function downloadBlob(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},900)}
async function gerarPdfInstitucional(){
 const html=fichaHtml();
 const holder=document.createElement('iframe');
 holder.style.position='fixed'; holder.style.left='-10000px'; holder.style.top='0'; holder.style.width='210mm'; holder.style.height='297mm';
 document.body.appendChild(holder);
 const doc=holder.contentDocument;
 doc.open(); doc.write(html); doc.close();
 await new Promise(r=>setTimeout(r,700));
 if(window.html2pdf){
   const page=doc.querySelector('.v62-page');
   await html2pdf().set({margin:0,filename:'ficha-institucional-vetor-v62.pdf',image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},pagebreak:{mode:['css','legacy'],avoid:['.v62-question']}}).from(page).save();
 } else {
   const w=window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),600);
 }
 holder.remove();
}
async function fetchBuffer(url){const r=await fetch(url);if(!r.ok)throw new Error(url);return await r.arrayBuffer()}
async function gerarWordInstitucional(){
 const a=assessment(), info=infoFromTurma(a.turma), student=currentStudentName(), qs=extractQuestions(), date=a.date?a.date.split('-').reverse().join(' / '):'___ / ___ / 2026';
 if(!window.docx){
   downloadBlob('ficha-institucional-vetor-v62.doc', new Blob([fichaHtml(student)],{type:'application/msword;charset=utf-8'})); return;
 }
 const {Document,Packer,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,BorderStyle,AlignmentType,ImageRun,VerticalAlign,SectionType}=window.docx;
 const children=[];
 try{
   const header=await fetchBuffer(HEADER);
   children.push(new Paragraph({children:[new ImageRun({data:header,transformation:{width:720,height:181}})],alignment:AlignmentType.CENTER,spacing:{after:80}}));
 }catch(e){}
 const p=(runs)=>new Paragraph({children:runs,spacing:{after:50}});
 children.push(p([new TextRun({text:'Estudante: ',bold:true}),new TextRun(student),new TextRun({text:'      Turma: ',bold:true}),new TextRun(`${info.A?'( X )A':'(   )A'}   ${info.B?'( X )B':'(   )B'}`)]));
 children.push(p([new TextRun({text:'Série: ',bold:true}),new TextRun(`${info.s1?'( X ) 1º Ano':'(   ) 1º Ano'}   ${info.s2?'( X ) 2º Ano':'(   ) 2º Ano'}   ${info.s3?'( X ) 3º Ano':'(   ) 3º Ano'}`),new TextRun({text:'        Curso: ',bold:true}),new TextRun(`${info.adm?'( X ) Adm':'(   ) Adm'}   ${info.red?'( X ) Red':'(   ) Red'}`)]));
 children.push(p([new TextRun({text:'Data: ',bold:true}),new TextRun(date),new TextRun({text:'        Disciplina: ',bold:true}),new TextRun(a.discipline||''),new TextRun({text:'        Professor: ',bold:true}),new TextRun('Felipe Camargo')]));
 children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[new TableCell({children:[new Paragraph({children:[new TextRun({text:avalNome(a),bold:true})],alignment:AlignmentType.CENTER})]})]})]}));
 // Two-column table for questions
 const left=[], right=[];
 qs.forEach((q,i)=>{(i<Math.ceil(qs.length/2)?left:right).push(q)});
 function qparas(arr){
   const out=[];
   arr.forEach(q=>{
     out.push(new Paragraph({children:[new TextRun({text:`QUESTÃO ${String(q.n).padStart(2,'0')} - `,bold:true}),new TextRun(q.base||q.enun||q.raw)],spacing:{before:140,after:70}}));
     if(q.base&&q.enun)out.push(new Paragraph({children:[new TextRun(q.enun)],spacing:{after:70}}));
     (q.alts||[]).forEach(alt=>out.push(new Paragraph({children:[new TextRun(alt)],spacing:{after:35}})));
   });
   return out.length?out:[new Paragraph('')];
 }
 children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE},insideH:{style:BorderStyle.NONE},insideV:{style:BorderStyle.SINGLE,size:8,color:'000000'}},rows:[new TableRow({children:[new TableCell({width:{size:50,type:WidthType.PERCENTAGE},children:qparas(left)}),new TableCell({width:{size:50,type:WidthType.PERCENTAGE},children:qparas(right)})]})]}));
 const doc=new Document({sections:[{properties:{page:{margin:{top:567,right:567,bottom:567,left:567}}},children}]});
 const blob=await Packer.toBlob(doc); downloadBlob('ficha-institucional-vetor-v62.docx',blob);
}
function avaliacoes(){return (A()?.state?.assessments||[]).filter(x=>(x.students||[]).length&&(x.questions||[]).length)}
function avg(arr){return arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length*10)/10:0}
function byLatestTurma(avals){const m={};avals.forEach(a=>{if(!m[a.turma]||(a.date||'')>=(m[a.turma].date||''))m[a.turma]=a});return Object.values(m).map(a=>({a,r:compute(a)})).sort((x,y)=>y.r.summary.avg-x.r.summary.avg)}
async function gerarPptInstitucional(){
 if(!window.PptxGenJS){alert('PowerPoint não carregou.');return}
 const pptx=new PptxGenJS(); pptx.layout='LAYOUT_WIDE'; pptx.author='VETOR';
 const blue='0B2146', yellow='F4C430', green='198754', red='C1121F', orange='F77F00', light='F6F8FB', gray='5B6472';
 let headerData=null; try{headerData=await new Promise(async res=>{const b=await fetch(HEADER).then(r=>r.blob());const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(b)})}catch(e){}
 function base(title,sub=''){
   const sl=pptx.addSlide(); sl.background={color:'FFFFFF'};
   sl.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.18,fill:{color:yellow},line:{color:yellow}});
   sl.addShape(pptx.ShapeType.rect,{x:0,y:0.18,w:13.33,h:0.10,fill:{color:blue},line:{color:blue}});
   sl.addText(title,{x:0.55,y:0.45,w:8.8,h:0.38,fontSize:23,bold:true,color:blue,margin:0});
   if(sub) sl.addText(sub,{x:0.58,y:0.88,w:8.7,h:0.25,fontSize:10,color:gray,margin:0});
   if(headerData) sl.addImage({data:headerData,x:10.1,y:0.38,w:2.5,h:0.62});
   sl.addText('VETOR',{x:0.55,y:7.0,w:5,h:0.18,fontSize:8,color:gray,margin:0});
   return sl;
 }
 function card(sl,title,value,x,y,w=2.55,color=blue){
   sl.addShape(pptx.ShapeType.roundRect,{x,y,w,h:1.05,rectRadius:0.08,fill:{color:light},line:{color:'DCE3EF'}});
   sl.addShape(pptx.ShapeType.rect,{x,y,w:0.09,h:1.05,fill:{color},line:{color}});
   sl.addText(title,{x:x+0.2,y:y+0.14,w:w-0.25,h:0.2,fontSize:9,color:gray,bold:true,margin:0});
   sl.addText(String(value),{x:x+0.2,y:y+0.44,w:w-0.25,h:0.35,fontSize:19,bold:true,color:blue,fit:'shrink',margin:0});
 }
 function bar(sl,label,p,x,y,w=6,color=green){
   p=Math.max(0,Math.min(100,Number(p)||0));
   sl.addText(label,{x,y,w:3.2,h:0.22,fontSize:9,bold:true,color:'243447',fit:'shrink',margin:0});
   sl.addShape(pptx.ShapeType.roundRect,{x:x+3.4,y:y+0.03,w,h:0.18,rectRadius:0.04,fill:{color:'E8EEF7'},line:{color:'E8EEF7'}});
   sl.addShape(pptx.ShapeType.roundRect,{x:x+3.4,y:y+0.03,w:w*p/100,h:0.18,rectRadius:0.04,fill:{color},line:{color}});
   sl.addText(p+'%',{x:x+3.4+w+0.08,y:y-0.02,w:0.6,h:0.22,fontSize:9,color:'243447',margin:0});
 }
 const avals=avaliacoes(), r=results(), a=assessment();
 if(!avals.length){alert('Não há avaliações salvas.');return}
 let sl=pptx.addSlide(); sl.background={color:blue}; sl.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.33,h:0.22,fill:{color:yellow},line:{color:yellow}}); if(headerData)sl.addImage({data:headerData,x:0.75,y:0.65,w:4.0,h:0.95}); sl.addText('DIAGNÓSTICO\nPEDAGÓGICO',{x:0.8,y:2.0,w:7,h:1.0,fontSize:36,bold:true,color:'FFFFFF',margin:0}); sl.addText('Análise institucional de aprendizagem e intervenção',{x:0.84,y:3.25,w:8,h:0.3,fontSize:15,color:yellow,margin:0}); sl.addText(new Date().toLocaleDateString('pt-BR'),{x:10.5,y:6.5,w:2,h:0.25,fontSize:12,color:'FFFFFF',align:'right'});
 const turmas=[...new Set(avals.map(x=>x.turma).filter(Boolean))]; const alunos=new Set();avals.forEach(x=>(x.students||[]).forEach(s=>alunos.add((x.turma||'')+'|'+(s.name||s.nome||'')))); const medias=avals.map(x=>compute(x).summary.avg||0);
 sl=base('Resumo executivo','Indicadores gerais do acompanhamento pedagógico'); card(sl,'Avaliações',avals.length,0.75,1.35,2.4,blue); card(sl,'Turmas',turmas.length,3.45,1.35,2.4,green); card(sl,'Alunos',alunos.size,6.15,1.35,2.4,orange); card(sl,'Média geral',avg(medias)+'%',8.85,1.35,2.8,red); sl.addText('Leitura para coordenação',{x:0.8,y:3.0,w:5,h:0.32,fontSize:17,bold:true,color:blue}); sl.addText('Use os dados para priorizar descritores, orientar fichas de recomposição e acompanhar evolução entre simulados.',{x:0.8,y:3.48,w:11.5,h:0.8,fontSize:18,color:'263238',fit:'shrink'});
 sl=base('Desempenho por turma','Última avaliação de cada turma'); let y=1.25; byLatestTurma(avals).slice(0,10).forEach((x,i)=>{sl.addText(`${i+1}. ${x.a.turma}`,{x:0.8,y,w:3.8,h:0.25,fontSize:10,bold:true,color:'243447',fit:'shrink'}); sl.addText(`${x.a.discipline} • ${tipoLabel(x.a.tipo)}`,{x:4.55,y,w:2.6,h:0.25,fontSize:8,color:gray,fit:'shrink'}); const c=x.r.summary.avg<50?red:x.r.summary.avg<70?orange:green; bar(sl,'',x.r.summary.avg,7.1,y,3.6,c); y+=0.5});
 sl=base('Avaliação ativa',`${a.turma||'-'} • ${a.discipline||'-'} • ${avalNome(a)}`); card(sl,'Alunos',r.summary.nStudents||0,0.75,1.3,2.2,blue); card(sl,'Questões',r.summary.nQuestions||0,3.25,1.3,2.2,green); card(sl,'Média',`${r.summary.avg||0}`,5.75,1.3,2.2,orange); card(sl,'Abaixo da meta',r.summary.priority||0,8.25,1.3,2.8,red); y=3.0; const levels=r.summary.levels||{}; ['Elementar I','Elementar II','Básico','Desejável'].forEach(l=>{const pct=r.summary.nStudents?Math.round((levels[l]||0)/r.summary.nStudents*100):0;bar(sl,l,pct,0.9,y,6,l.includes('Elementar')?red:(l==='Básico'?orange:green));y+=0.55});
 sl=base('Descritores críticos','Prioridades para intervenção'); y=1.15; (r.descriptorStats||[]).slice(0,10).forEach(d=>{bar(sl,d.descritor,d.percent,0.9,y,7.8,d.percent<50?red:d.percent<70?orange:green); y+=0.48});
 sl=base('Estudantes abaixo da meta','Lista de atenção pedagógica'); y=1.15; (r.students||[]).filter(s=>(s.percent||0)<60).sort((a,b)=>a.percent-b.percent).slice(0,12).forEach((s,i)=>{sl.addText(`${i+1}. ${s.name||s.nome||''}`,{x:0.8,y,w:5.4,h:0.25,fontSize:9,bold:true,color:'243447',fit:'shrink'}); sl.addText(s.level||'',{x:6.2,y,w:1.4,h:0.25,fontSize:8,color:gray}); bar(sl,'',s.percent,7.4,y,3.5,s.percent<40?red:orange); y+=0.43});
 sl=base('Plano de intervenção','Encaminhamentos objetivos para o próximo ciclo'); y=1.25; (r.descriptorStats||[]).slice(0,5).forEach((d,i)=>{sl.addShape(pptx.ShapeType.roundRect,{x:0.8,y:y-0.05,w:11.6,h:0.48,rectRadius:0.05,fill:{color:light},line:{color:'DCE3EF'}}); sl.addText(`${i+1}. ${d.descritor}`,{x:1.0,y,w:0.8,h:0.22,fontSize:12,bold:true,color:blue}); sl.addText(`Retomar a habilidade, resolver itens guiados e aplicar verificação curta. Aproveitamento atual: ${d.percent}%.`,{x:1.8,y,w:10.2,h:0.22,fontSize:10,color:'243447',fit:'shrink'}); y+=0.65}); sl.addText('Próximo passo: gerar fichas, organizar grupos por descritor e comparar evolução no próximo simulado.',{x:0.9,y:5.4,w:11,h:0.4,fontSize:15,bold:true,color:green});
 await pptx.writeFile({fileName:'vetor-diagnostico-v68-7.pptx'});
}
function bind(){
 ['#v57Print','#v59Print','#printSheet','#printMap'].forEach(id=>{const e=$(id); if(e)e.onclick=gerarPdfInstitucional});
 ['#v57Doc','#v59Word'].forEach(id=>{const e=$(id); if(e)e.onclick=gerarWordInstitucional});
 ['#generatePptxReport','#coordenacaoPptxBtn','#coordInstitucionalPptx'].forEach(id=>{const e=$(id); if(e)e.onclick=gerarPptInstitucional});
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,1200));
window.Institucional={gerarPdfInstitucional,gerarWordInstitucional,gerarPptInstitucional,fichaHtml};
})();

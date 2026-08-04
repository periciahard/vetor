(function(){
 const A=()=>window.VETOR;
 const esc=s=>(A()?.safe?A().safe(String(s??'')):String(s??'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])));
 function fileSafe(s){return String(s||'vetor').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'vetor'}
 function exportJson(){A().download('backup-vetor.json',JSON.stringify(A().state,null,2),'application/json')}
 function exportExcel(){const a=A().state.assessment;const rows=[['Aluno',...a.questions],['Descritores',...a.descriptors],['Gabarito',...a.key],...a.students.map(s=>[s.name,...s.answers])];A().download('avaliacao-vetor.xls',A().toTSV(rows),'application/vnd.ms-excel;charset=utf-8');}
 function metaBlock(){const a=A().state.assessment||{}; const r=A().getResults?.()||{summary:{}}; return `<div class="meta-grid"><div><b>Turma</b><span>${esc(a.turma||'Não informada')}</span></div><div><b>Disciplina</b><span>${esc(a.discipline||'Não informada')}</span></div><div><b>Avaliação</b><span>${esc(a.title||'Avaliação atual')}</span></div><div><b>Tipo</b><span>${esc(a.tipo||'Não informado')}</span></div><div><b>Data</b><span>${esc(a.date||'Não informada')}</span></div><div><b>Alunos</b><span>${esc(r.summary?.nStudents||0)}</span></div><div><b>Média</b><span>${esc(r.summary?.avg||0)}</span></div><div><b>Versão</b><span>V68.7.1</span></div></div>`;}
 function textToSections(text){
  const raw=String(text||'').trim(); if(!raw)return '<section><p>Nenhum conteúdo gerado.</p></section>';
  const lines=raw.split(/\r?\n/);
  let html='', open=false;
  for(const line of lines){const l=line.trim(); if(!l){if(open){html+='</ul>'; open=false;} html+='<br>'; continue;}
    if(/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 _-]{6,}$/.test(l) && l.length<80){if(open){html+='</ul>'; open=false;} html+=`<h2>${esc(l)}</h2>`;}
    else if(/^[-•]\s+/.test(l)){if(!open){html+='<ul>'; open=true;} html+=`<li>${esc(l.replace(/^[-•]\s+/,''))}</li>`;}
    else if(/^\d+[.)]\s+/.test(l)){if(!open){html+='<ol>'; open=true;} html+=`<li>${esc(l.replace(/^\d+[.)]\s+/,''))}</li>`;}
    else {if(open){html+='</ul>'; open=false;} html+=`<p>${esc(l)}</p>`;}
  }
  if(open)html+='</ul>'; return html;
 }
 function printReport(text,title='Relatório VETOR'){
  const a=A().state.assessment||{}; const filename=fileSafe(`${title}-${a.turma||''}-${a.discipline||''}`);
  const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  :root{--blue:#0f2e5f;--green:#1d6b42;--yellow:#ffd23f;--red:#b42318;--line:#d9e2ef;--muted:#64748b}
  *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#0f172a;background:#f6f8fb} .page{max-width:960px;margin:0 auto;background:white;min-height:100vh;padding:34px}
  .head{display:flex;gap:18px;align-items:center;border-bottom:6px solid var(--yellow);padding-bottom:16px;margin-bottom:20px}.logo{width:82px;height:82px;object-fit:contain}.head h1{margin:0;color:var(--blue);font-size:25px}.head p{margin:4px 0;color:var(--muted)}
  .meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.meta-grid div{border:1px solid var(--line);border-radius:14px;padding:10px;background:#f8fbff}.meta-grid b{display:block;color:var(--blue);font-size:11px;text-transform:uppercase}.meta-grid span{display:block;font-size:14px;margin-top:4px}
  h2{color:var(--blue);border-left:5px solid var(--green);padding-left:10px;margin-top:22px} p{line-height:1.48} li{margin:5px 0;line-height:1.45}.foot{border-top:1px solid var(--line);margin-top:28px;padding-top:12px;color:var(--muted);font-size:12px}.watermark{float:right;color:#94a3b8;font-weight:bold}
  @media print{body{background:white}.page{padding:18mm;max-width:none}.no-print{display:none}.meta-grid{grid-template-columns:repeat(4,1fr)}@page{margin:12mm}}
  </style></head><body><div class="page"><button class="no-print" onclick="window.print()" style="float:right;padding:10px 14px;border:0;border-radius:10px;background:#0f2e5f;color:#fff">Imprimir / Salvar PDF</button><div class="head"><img class="logo" src="assets/vetor-logo.svg" onerror="this.style.display='none'"><div><h1>${esc(title)}</h1><p>VETOR</p><p>Plataforma de Inteligência Educacional • Criado por Felipe Camargo</p></div></div>${metaBlock()}<main>${textToSections(text)}</main><div class="foot"><span class="watermark">V68.7.1</span>Documento gerado pela plataforma VETOR. A classificação pedagógica é estimada e não substitui a escala oficial do SAEPE/SAEB.</div></div><script>document.title=${JSON.stringify(filename)}; setTimeout(()=>window.print(),300)<\/script></body></html>`;
  const w=window.open('','_blank'); if(!w){alert('Permita pop-ups para gerar o PDF.');return;} w.document.write(html); w.document.close();
 }
 async function restore(file){const data=JSON.parse(await file.text());A().state={...A().state,...data};A().save();A().renderAll();}
 function bind(){A().$('#exportJson')&&(A().$('#exportJson').onclick=exportJson);A().$('#exportFullBackup')&&(A().$('#exportFullBackup').onclick=exportJson);A().$('#exportExcelBackup')&&(A().$('#exportExcelBackup').onclick=exportExcel);A().$('#importJson')&&(A().$('#importJson').onchange=e=>e.target.files[0]&&restore(e.target.files[0]));A().$('#importFullBackup')&&(A().$('#importFullBackup').onchange=e=>e.target.files[0]&&restore(e.target.files[0]));A().$('#restoreBackup')&&(A().$('#restoreBackup').onclick=()=>A().status('#backupStatus','Escolha um arquivo JSON de backup para restaurar.','work'));}
 window.Exportacao={exportJson,exportExcel,restore,printReport};document.addEventListener('DOMContentLoaded',bind);
})();

(function(){
 const A=()=>window.VETOR;
 function importGeneration(){return Number(window.__vetorImportGeneration||0);}
 function bumpImportGeneration(){window.__vetorImportGeneration=importGeneration()+1;return window.__vetorImportGeneration;}
 function isCurrentGeneration(generation){return generation===undefined || generation===importGeneration();}
 function staleImport(generation){if(isCurrentGeneration(generation))return false; console.warn('Resultado de importacao antigo descartado.'); return true;}
 function expectedQuestionCount(){
  const input=A().$('#assessmentQuestionCount');
  const n=Number(input?.value||A().state?.assessment?.questionCount||0);
  return Number.isFinite(n)&&n>0?Math.min(100,Math.floor(n)):0;
 }
 function isPlaceholderStudentName(nome){
  const n=A().norm(nome).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  return !n || /^ALUNO(?:\s*(?:\d+|X+|SEM\s+NOME))?$/.test(n) || /^NOME\s+DO\s+ALUNO$/.test(n) || /^ESTUDANTE(?:\s*(?:\d+|X+))?$/.test(n);
 }
 function rowsToAssessment(rows){
  rows=(rows||[]).filter(r=>r&&r.some(c=>A().norm(c))); if(rows.length<3) throw new Error('A planilha precisa ter pelo menos 3 linhas: questões, descritores e gabarito.');
  const first=rows[0], second=rows[1], third=rows[2];
  const firstCell=A().norm(first[0]).toLowerCase();
  const secondCell=A().norm(second[0]).toLowerCase();
  const thirdCell=A().norm(third[0]).toLowerCase();
  // Aceita dois modelos:
  // A) Q1 | Q2 | Q3...
  //    D1 | D2 | D3...
  //    A  | B  | C...
  // B) Nome | Q1 | Q2 | Q3...
  //    Descritores | D1 | D2 | D3...
  //    Gabarito | A | B | C...
  // No modelo B, a primeira coluna é ignorada na validação e usada como nome dos alunos.
  const labelWords=['aluno','alunos','nome','nomes','estudante','estudantes','discente','discentes'];
  const rowLabelWords=['descritor','descritores','gabarito','resposta','respostas'];
  const hasLabelColumn=labelWords.some(w=>firstCell.includes(w)) || rowLabelWords.some(w=>secondCell.includes(w)||thirdCell.includes(w)) || firstCell==='';
  const start=hasLabelColumn?1:0;
  const expected=expectedQuestionCount();
  const rawWindow=expected?first.slice(start,start+expected):first.slice(start);
  const descWindow=expected?second.slice(start,start+expected):second.slice(start);
  const keyWindow=expected?third.slice(start,start+expected):third.slice(start);
  let lastQuestionCol=-1;
  for(let i=0;i<Math.max(rawWindow.length,descWindow.length,keyWindow.length);i++){
    const hasQuestion=A().norm(rawWindow[i]);
    const hasDescriptor=A().desc(descWindow[i])||A().norm(descWindow[i]);
    const hasKey=A().letter(keyWindow[i])||A().norm(keyWindow[i]);
    if(hasQuestion||hasDescriptor||hasKey) lastQuestionCol=i;
  }
  const actualQuestionCount=lastQuestionCol+1;
  if(expected&&actualQuestionCount&&actualQuestionCount!==expected){
    const input=A().$('#assessmentQuestionCount');
    if(input) input.value=actualQuestionCount;
    if(A().state?.assessment) A().state.assessment.questionCount=actualQuestionCount;
  }
  const questions=rawWindow.slice(0,actualQuestionCount).map((v,i)=>A().norm(v)||'Q'+(i+1));
  const descriptors=descWindow.slice(0,actualQuestionCount).map(v=>A().desc(v)||A().norm(v));
  const key=keyWindow.slice(0,actualQuestionCount).map(v=>A().letter(v));
  const students=rows.slice(3).map((r)=>{
    const first=A().norm(r[0]);
    const name=hasLabelColumn ? first : (first && !A().letter(first) ? first : '');
    const answerStart=hasLabelColumn ? start : (name ? 1 : 0);
    return {name,answers:r.slice(answerStart,answerStart+questions.length).map(v=>A().letter(v))};
  }).filter(s=>s.name&&!isPlaceholderStudentName(s.name));
  const issues=[]; if(!questions.length)issues.push('Nenhuma questão encontrada.'); if(descriptors.some(x=>!x))issues.push('Há questões sem descritor entre Q1 e Q'+questions.length+'.'); if(key.some(x=>!x))issues.push('Há itens sem gabarito A-E entre Q1 e Q'+questions.length+'.'); students.forEach(s=>{if(s.answers.length<questions.length)issues.push('Aluno '+s.name+' possui respostas incompletas.')});
  const disc=A().$('#assessmentDiscipline')?.value||A().state?.assessment?.discipline||A().state?.settings?.discipline||'Língua Portuguesa';
  const validCodes=window.Descritores?.validCodes?.(disc);
  if(validCodes){const invalid=[...new Set(descriptors.filter(d=>d&&!validCodes.has(d)))]; if(invalid.length)issues.push('Descritores fora da matriz da 3ª série do Ensino Médio em '+disc+': '+invalid.join(', '));}
  return {questions,descriptors,key,students,issues,discipline:disc,questionCount:questions.length};
 }
 function renderValidation(data,generation){if(staleImport(generation))return false; window.Importacao.pending=data; const box=A().$('#validationResult'); const ok=!data.issues.length; const turmas=(data.turmas||[]).length; const turmaTxt=turmas?`<div><b>${turmas}</b><br>turma(s)</div>`:''; const html=`<b>${ok?'Estrutura válida — análise liberada':'Conferência necessária — análise bloqueada'}</b><div class="checkgrid"><div><b>${data.questions.length}</b><br>questões</div><div><b>${data.descriptors.filter(Boolean).length}</b><br>descritores</div><div><b>${data.key.filter(Boolean).length}</b><br>gabaritos</div><div><b>${data.students.length}</b><br>alunos</div>${turmaTxt}</div>${data.issues.length?'<ul>'+data.issues.map(i=>`<li>${A().safe(i)}</li>`).join('')+'</ul>':'<p>Todos os campos essenciais foram identificados. Clique em Confirmar e analisar.</p>'}`;
  if(box){box.className='statusbox '+(ok?'status-ok':'status-error'); box.innerHTML=html;}
  const gate=A().$('#importGate'); if(gate){gate.className='statusbox '+(ok?'status-ok':'status-error'); gate.innerHTML=ok?`✅ Estrutura válida. Confira os números abaixo e clique em <b>2. Confirmar e analisar</b>.<div class="checkgrid"><div><b>${data.questions.length}</b><br>questões</div><div><b>${data.descriptors.filter(Boolean).length}</b><br>descritores</div><div><b>${data.key.filter(Boolean).length}</b><br>gabaritos</div><div><b>${data.students.length}</b><br>alunos</div>${turmaTxt}</div>`:'⚠️ Corrija a estrutura antes de analisar. A análise fica bloqueada para evitar relatórios incorretos.';}
  const confirm=A().$('#confirmImport'); if(confirm) confirm.disabled=(!ok || !A().isAssessmentActiveSaved?.());
  const prev=A().$('#previewImport'); if(prev){prev.innerHTML='<div class="preview-table"><div class="preview-row"><span>Aluno</span>'+data.questions.slice(0,10).map(q=>`<span>${A().safe(q)}</span>`).join('')+'</div>'+data.students.slice(0,5).map(s=>`<div class="preview-row"><span>${A().safe(s.name)}</span>${s.answers.slice(0,10).map(x=>`<span>${A().safe(x)}</span>`).join('')}</div>`).join('')+'</div>';}
  A().renderWizard?.(); A().updateImportLock?.(); if(ok&&A().isAssessmentActiveSaved?.()){const c=A().$('#confirmImport'); if(c)c.disabled=false;} return true;
 }
 function parseTextTable(text){return text.trim().split(/\n+/).map(line=>line.split(/\t|;|,/).map(x=>x.trim()));}
 function turmaFromFileName(name){return A().norm(String(name||'').replace(/\.(xlsx|xls|csv|txt)$/i,'').replace(/C[oó]pia de/gi,'').replace(/BRANCO/gi,'').replace(/_/g,' '))||'Turma';}
 function sameArray(a,b){return (a||[]).length===(b||[]).length && (a||[]).every((v,i)=>A().norm(v).toUpperCase()===A().norm((b||[])[i]).toUpperCase());}
 function mergeAssessments(parts){const first=parts[0]; const issues=[...(first.issues||[])]; const students=[]; const turmas=[]; parts.forEach((part,idx)=>{const turma=part.turma||('Turma '+(idx+1)); if(!turmas.includes(turma))turmas.push(turma); if(idx>0){ if(!sameArray(first.questions,part.questions))issues.push('A planilha '+turma+' possui questões diferentes da primeira planilha.'); if(!sameArray(first.descriptors,part.descriptors))issues.push('A planilha '+turma+' possui descritores diferentes da primeira planilha.'); if(!sameArray(first.key,part.key))issues.push('A planilha '+turma+' possui gabarito diferente da primeira planilha.'); issues.push(...(part.issues||[])); } (part.students||[]).forEach(st=>students.push({...st,turma})); }); return {...first,students,issues:[...new Set(issues)],turmas,multiTurmas:turmas.length};}
 function mergeAssessments(parts){const first=parts[0]; const issues=[]; const students=[]; const turmas=[]; const normalizedParts=parts.map((part,idx)=>{const turma=part.turma||('Turma '+(idx+1)); if(!turmas.includes(turma))turmas.push(turma); (part.issues||[]).forEach(i=>issues.push(turma+': '+i)); (part.students||[]).forEach(st=>students.push({...st,turma})); return {...part,turma,students:(part.students||[]).map(st=>({...st,turma}))};}); return {...first,students,issues:[...new Set(issues)],turmas,multiTurmas:turmas.length,parts:normalizedParts};}
 async function readExcel(file){const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});let best=null;for(const name of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:false,defval:''}); if(!best||rows.length>(best.rows?.length||0))best={name,rows};}return best.rows;}
 async function readPdf(file){if(!window.pdfjsLib)throw new Error('Biblioteca PDF não carregada.'); pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; const ab=await file.arrayBuffer(); const pdf=await pdfjsLib.getDocument({data:ab}).promise; let text=''; for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const tc=await page.getTextContent(); text+=tc.items.map(i=>i.str).join(' ')+'\n';} return text;}
 function confirmData(data=window.Importacao.pending){if(!A().isAssessmentActiveSaved?.()) return A().status('#importGate','Salve uma avaliação antes de confirmar dados.','error'); if(!data) return A().status('#validationResult','Valide ou importe uma tabela primeiro.','error'); if(data.issues?.length){A().status('#validationResult','Análise bloqueada: corrija a estrutura antes de confirmar.','error'); const gate=A().$('#importGate'); if(gate) A().status(gate,'Análise bloqueada: '+data.issues.join('; ')+'.','error'); return;} const saved=A().confirmAssessmentData?.(data); if(!saved){A().status('#importGate','Não foi possível localizar a avaliação ativa salva. Salve a identificação novamente antes de confirmar.','error');return;} A().status('#validationResult','Dados confirmados e analisados.','ok'); A().status('#importGate','✅ Dados confirmados. Diagnóstico disponível. Salvando na nuvem, se houver login ativo...','ok'); window.Importacao.pending=null; A().renderAll?.(); setTimeout(()=>window.VETORSupabase?.autoSaveCurrentAssessment?.(),600);}
 function turmaUploadInputs(){return Array.from(document.querySelectorAll('#turmaUploadSlots input[data-turma-upload]'));}
 async function readInputFile(input,generation){
  const f=input.files?.[0];
  if(!f)throw new Error('Selecione a planilha de '+(input.dataset.turmaUpload||'uma turma')+'.');
  let rows;
  if(/\.xlsx?$|\.xls$/i.test(f.name)) rows=await readExcel(f);
  else rows=parseTextTable(await f.text());
  if(staleImport(generation))return null;
  const part=rowsToAssessment(rows);
  part.turma=A().norm(input.dataset.turmaUpload||turmaFromFileName(f.name));
  return part;
 }
 function bind(){
  A().$('#extractFile')&&(A().$('#extractFile').onclick=async()=>{const generation=bumpImportGeneration(); try{if(!A().isAssessmentActiveSaved?.())throw new Error('Salve uma avaliação antes de importar.'); const slotInputs=turmaUploadInputs(); const parts=[]; if(slotInputs.length){A().status('#extractStatus','Lendo '+slotInputs.length+' planilha(s), uma por turma...'); for(const input of slotInputs){const part=await readInputFile(input,generation); if(!part)return; parts.push(part);}}else{const files=Array.from(A().$('#fileInput').files||[]); if(!files.length)throw new Error('Selecione um arquivo Excel, CSV ou TXT.'); A().status('#extractStatus','Lendo '+files.length+' arquivo(s)...'); const selected=A().getSelectedAssessmentTurmas?.()||[]; for(const f of files){let rows;if(/\.xlsx?$|\.xls$/i.test(f.name)) rows=await readExcel(f); else rows=parseTextTable(await f.text()); if(staleImport(generation))return; const part=rowsToAssessment(rows); part.turma=selected.length===1?selected[0]:turmaFromFileName(f.name); parts.push(part);}} const data=mergeAssessments(parts); if(!renderValidation(data,generation))return; A().status('#extractStatus',parts.length===1?'Arquivo lido. Confira a validação antes de confirmar.':'Planilhas lidas por turma e consolidadas. Confira a validação antes de confirmar.','ok');}catch(e){if(isCurrentGeneration(generation))A().status('#extractStatus',A().safe(e.message),'error');}});
  A().$('#readPdfOnly')&&(A().$('#readPdfOnly').onclick=async()=>{const generation=bumpImportGeneration(); try{if(!A().isAssessmentActiveSaved?.())throw new Error('Salve uma avaliação antes de importar.'); const f=A().$('#pdfOnlyInput').files[0];if(!f)throw new Error('Selecione um PDF.');const t=await readPdf(f); if(staleImport(generation))return; A().$('#pasteData').value=t;A().status('#validationResult','Texto extraído do PDF e enviado para a digitação manual. Revise a tabela antes de confirmar.','work');document.querySelector('[data-tab="manualTab"]').click();}catch(e){if(isCurrentGeneration(generation))A().status('#validationResult','Falha no PDF: '+A().safe(e.message),'error');}});
  A().$('#validateData')&&(A().$('#validateData').onclick=()=>{const generation=bumpImportGeneration(); try{if(!A().isAssessmentActiveSaved?.())throw new Error('Salve uma avaliação antes de validar dados.'); renderValidation(rowsToAssessment(parseTextTable(A().$('#pasteData').value)),generation);}catch(e){if(isCurrentGeneration(generation))A().status('#validationResult',A().safe(e.message),'error');}});
  A().$('#validateDataGate')&&(A().$('#validateDataGate').onclick=()=>{const generation=bumpImportGeneration(); try{if(!A().isAssessmentActiveSaved?.())throw new Error('Salve uma avaliação antes de validar dados.'); if(window.Importacao.pending) renderValidation(window.Importacao.pending,generation); else renderValidation(rowsToAssessment(parseTextTable(A().$('#pasteData').value)),generation);}catch(e){if(isCurrentGeneration(generation))A().status('#importGate',A().safe(e.message),'error');}});
  A().$('#confirmImport')&&(A().$('#confirmImport').onclick=()=>confirmData());
  A().$('#loadExample')&&(A().$('#loadExample').onclick=()=>{const generation=bumpImportGeneration(); if(!A().isAssessmentActiveSaved?.())return A().status('#extractStatus','Salve uma avaliação antes de carregar exemplo.','error'); const qs=Array.from({length:expectedQuestionCount()||26},(_,i)=>'Q'+(i+1));const ds=qs.map((_,i)=>'D'+((i%10)+1));const key=qs.map((_,i)=>'ABCDE'[i%5]);const students=['Ana Silva','Bruno Lima','Carla Souza','Daniel Alves','Eduarda Costa'].map((n,j)=>[n,...qs.map((_,i)=>'ABCDE'[(i+j)%5])]);const rows=[['Aluno',...qs],['Descritores',...ds],['Gabarito',...key],...students];const data=rowsToAssessment(rows);renderValidation(data,generation);A().$('#pasteData').value=A().toTSV(rows);});
 }
 window.Importacao={rowsToAssessment,renderValidation,pending:null,bind,confirmData,importGeneration,bumpImportGeneration,isCurrentGeneration};document.addEventListener('DOMContentLoaded',bind);
})();

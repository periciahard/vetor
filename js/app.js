(function(){
  'use strict';
  const VERSION='68.7.46-importar-word-banco';
  const STORE='vetor_diagnostico_atual';
  const BACKUP_STORE='vetor_diagnostico_backup_seguro';
  const MULTI_TURMAS_VALUE='__varias_turmas__';
  const DEFAULT_STATE={
    version:VERSION,
    settings:{discipline:'Língua Portuguesa', supabaseUrl:'https://shqnaeatdkdtnheswggq.supabase.co', supabaseAnonKey:'sb_publishable_ByueLBjkkGNOW0Wt2yD7hg_n0YDvMqi'},
    assessment:{id:null, savedSignature:'', discipline:'Língua Portuguesa', turma:'', tipo:'diagnostica', customType:'', date:'', teacher:'', questionCount:0, questions:[], descriptors:[], key:[], students:[], turmas:[], multiTurmas:0, title:'Avaliação atual'},
    assessments:[], activeAssessmentId:null, bank:[], snapshots:[], selectedStudent:null, currentReport:''
  };
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const safe=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const norm=v=>String(v??'').trim();
  const isPlaceholderStudentName=v=>{const n=norm(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();return !n||/^ALUNO(?:\s*(?:\d+|X+|SEM\s+NOME))?$/.test(n)||/^NOME\s+DO\s+ALUNO$/.test(n)||/^ESTUDANTE(?:\s*(?:\d+|X+))?$/.test(n);};
  const cleanStudents=list=>(Array.isArray(list)?list:[]).filter(s=>!isPlaceholderStudentName(s?.name||s?.nome));
  const letter=v=>{const m=norm(v).toUpperCase().match(/[A-E]/); return m?m[0]:''};
  const desc=v=>{const m=norm(v).toUpperCase().match(/D\s*0*([0-9]{1,2})/); return m?'D'+parseInt(m[1],10):''};
  function requireDeletePassword(action='apagar dados'){
    const pass=prompt('Digite a senha para '+action+':');
    if(pass===null)return false;
    if(String(pass).trim()!=='5557'){alert('Senha incorreta. Nenhum dado foi apagado.');return false;}
    return true;
  }
  const pct=(a,b)=>b?Math.round((a/b)*1000)/10:0;
  const performanceLevel=(percent, discipline='')=>{
    const p=Number(percent)||0;
    let label, cls, description;
    if(p<25){label='Elementar I'; cls='level-e1'; description='Grave defasagem. O estudante ainda não domina competências fundamentais da avaliação e precisa de recomposição imediata.';}
    else if(p<50){label='Elementar II'; cls='level-e2'; description='Desempenho insuficiente. O estudante reconhece estruturas simples, mas apresenta lacunas relevantes nas habilidades avaliadas.';}
    else if(p<75){label='Básico'; cls='level-basic'; description='O mínimo esperado. O estudante demonstra domínio essencial, mas ainda precisa consolidar descritores específicos.';}
    else {label='Desejável'; cls='level-des'; description='Nível de excelência. O estudante demonstra domínio avançado e maior autonomia nas habilidades avaliadas.';}
    return {label, cls, description, percent:p};
  };
  const status=(el,msg,type='work')=>{const node=typeof el==='string'?$(el):el;if(node){node.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work');node.innerHTML=msg;}};
  const download=(filename,content,type='text/plain;charset=utf-8')=>{const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const toTSV=(rows)=>rows.map(r=>r.map(v=>String(v??'').replace(/\t/g,' ').replace(/\n/g,' ')).join('\t')).join('\n');
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function normalizeLoadedState(raw){const st={...structuredClone(DEFAULT_STATE),...(raw||{})};st.settings={...DEFAULT_STATE.settings,...((raw||{}).settings||{})};st.assessment={...DEFAULT_STATE.assessment,...((raw||{}).assessment||{})};st.assessment.students=cleanStudents(st.assessment.students);st.assessments=(Array.isArray((raw||{}).assessments)?raw.assessments:[]).map(a=>({...a,students:cleanStudents(a.students)}));if(st.assessment&&st.assessment.id&&!st.activeAssessmentId)st.activeAssessmentId=st.assessment.id;return st;}
  function load(){try{const raw=JSON.parse(localStorage.getItem(STORE)||'{}');const backup=JSON.parse(localStorage.getItem(BACKUP_STORE)||'{}');const rawCount=Array.isArray(raw.assessments)?raw.assessments.length:0;const backupCount=Array.isArray(backup.assessments)?backup.assessments.length:0;return normalizeLoadedState(backupCount>rawCount?backup:raw);}catch{return structuredClone(DEFAULT_STATE)}}
  const App={VERSION, STORE, MULTI_TURMAS_VALUE, state:load(), $, $$, safe, norm, letter, desc, pct, status, download, toTSV, uid,
    resetImportState(){
      try{
        if(window.Importacao?.bumpImportGeneration) window.Importacao.bumpImportGeneration();
        else window.__vetorImportGeneration=Number(window.__vetorImportGeneration||0)+1;
        if(window.Importacao){
          window.Importacao.pending=null;
          window.Importacao.currentFile=null;
          window.Importacao.lastResult=null;
          window.Importacao.lastData=null;
        }
        ['vetor_import_pending','vetor_importacao_pending','vetor_last_import','vetor_validation_cache'].forEach(k=>localStorage.removeItem(k));
      }catch(e){}
    },
    emptyAssessment(disciplina=this.state.settings.discipline||'Língua Portuguesa'){
      return {...structuredClone(DEFAULT_STATE.assessment), id:null, savedSignature:'', discipline:disciplina, turma:'', tipo:'diagnostica', customType:'', date:'', teacher:'', title:'', questionCount:0, questions:[], descriptors:[], key:[], students:[], turmas:[], multiTurmas:0, createdAt:null, updatedAt:null, cloud_avaliacao_id:null, cloud_saved_at:null};
    },
    setBlankAssessmentMode(on=true){
      try{ if(on) sessionStorage.setItem('vetor_nova_avaliacao_em_branco','1'); else sessionStorage.removeItem('vetor_nova_avaliacao_em_branco'); }catch(e){}
    },
    isBlankAssessmentMode(){
      try{ return sessionStorage.getItem('vetor_nova_avaliacao_em_branco')==='1'; }catch(e){ return false; }
    },
    isCurrentAssessmentUsable(){
      const a=this.state.assessment||{};
      return !this.isBlankAssessmentMode() && !!(a.id && this.state.activeAssessmentId===a.id && (this.state.assessments||[]).some(x=>x.id===a.id));
    },
    renderBlankNewAnalysis(){
      const box=$('#newAnalysisSummary');
      if(box){
        const disc=this.state.assessment?.discipline||this.state.settings?.discipline||'-';
        box.innerHTML=`<section class="na-card na-validation"><h3>3. Validação da estrutura</h3><p>Verificação automática da integridade dos arquivos.</p><div class="na-check wait"><b>Gabarito</b><span>Aguardando importação</span></div><div class="na-check wait"><b>Quantidade de questões</b><span>0 questões importadas</span></div><div class="na-check wait"><b>Descritores</b><span>Aguardando mapeamento</span></div><div class="na-check wait"><b>Total de alunos</b><span>0 alunos identificados</span></div><div class="na-check wait"><b>Turmas identificadas</b><span>0 turmas reconhecidas</span></div><div class="na-check wait"><b>Estrutura</b><span>Aguardando arquivo</span></div><div class="na-ready wait">Preencha a identificação, salve a avaliação e importe uma planilha.</div></section><section class="na-card na-summary"><h3>4. Resumo da avaliação</h3><p>Revise as informações antes de iniciar a análise.</p><div class="na-metrics"><div><span>Disciplina</span><b>${safe(disc)}</b></div><div><span>Turmas</span><b>0</b></div><div><span>Alunos</span><b>0</b></div><div><span>Questões</span><b>0</b></div><div><span>Motor de cálculo</span><b>${safe((this.state.settings?.calcEngine||'linear')==='logistico'?'Curva logística':'SEPC')}</b></div></div></section><section class="na-card na-start"><h3>5. Iniciar análise</h3><p>Salve a avaliação e importe uma planilha para liberar a análise.</p><button id="newAnalysisRun" disabled>Importar e analisar</button><small>Nenhuma análise carregada.</small></section>`;
      }
      const qmap=$('#questionMap');
      if(qmap) qmap.innerHTML='<p class="hint">Nenhuma avaliação carregada. Salve a identificação da nova avaliação e importe uma planilha para liberar o mapeamento.</p>';
    },
    save(){this.state.version=VERSION;const data=JSON.stringify(this.state);localStorage.setItem(STORE,data);if((this.state.assessments||[]).length || (this.state.assessment?.students||[]).length)localStorage.setItem(BACKUP_STORE,data);this.setSaveStatus();},
    setSaveStatus(){const dt=new Date().toLocaleString('pt-BR'); $('#lastSave')&&( $('#lastSave').textContent='Último salvamento: '+dt); $('#saveStatus')&&($('#saveStatus').textContent='Salvamento automático ativo • V'+VERSION);},
    setAssessment(a){this.setBlankAssessmentMode(false); const current=this.state.assessment||{}; const base={...structuredClone(DEFAULT_STATE.assessment),...current,...(a||{})}; base.id=base.id||current.id||uid(); base.discipline=base.discipline||this.state.settings.discipline||'Língua Portuguesa'; base.questionCount=Number((base.questions||[]).length || base.questionCount || 0); base.savedSignature=this.metaSignature(base); this.state.assessment=base; this.state.activeAssessmentId=base.id||null; this.saveAssessmentRecord(false); this.save(); this.renderAll();},
    confirmAssessmentData(data){
      if(data?.multiTurmas>1)return this.confirmMultiAssessmentData(data);
      if(this.isMultiTurmasMeta())return this.confirmMultiAssessmentData({...data,multiTurmas:data?.multiTurmas||data?.turmas?.length||1});
      if(!this.isAssessmentActiveSaved())return false;
      const activeId=this.state.activeAssessmentId||this.state.assessment?.id;
      const idx=(this.state.assessments||[]).findIndex(x=>x.id===activeId);
      if(idx<0)return false;
      const meta={...this.state.assessments[idx]};
      const updated={...structuredClone(DEFAULT_STATE.assessment),...meta,questions:data.questions||[],descriptors:data.descriptors||[],key:data.key||[],students:data.students||[],turmas:data.turmas||[],multiTurmas:data.multiTurmas||1,questionCount:Number(data.questionCount||data.questions?.length||0),updatedAt:new Date().toISOString()};
      updated.id=meta.id;
      updated.turma=meta.turma;
      updated.discipline=meta.discipline||data.discipline||this.state.settings.discipline||'Língua Portuguesa';
      updated.tipo=meta.tipo;
      updated.customType=meta.customType||'';
      updated.date=meta.date;
      updated.title=meta.title;
      updated.teacher=meta.teacher||'';
      updated.savedSignature=this.metaSignature(updated);
      this.state.assessments[idx]=updated;
      this.state.assessment={...updated};
      this.state.activeAssessmentId=updated.id;
      this.lastConfirmedAssessmentIds=[updated.id];
      this.setBlankAssessmentMode(false);
      this.save();
      this.renderAll();
      return true;
    },
    confirmMultiAssessmentData(data){
      if(!this.isAssessmentActiveSaved())return false;
      const activeId=this.state.activeAssessmentId||this.state.assessment?.id;
      const idx=(this.state.assessments||[]).findIndex(x=>x.id===activeId);
      if(idx<0)return false;
      const baseMeta={...this.state.assessments[idx]};
      const byTurma={};
      (data.students||[]).forEach(st=>{
        const turma=norm(st.turma||baseMeta.turma||'Turma');
        (byTurma[turma]??=[]).push({...st,turma:undefined});
      });
      const entries=Object.entries(byTurma);
      if(!entries.length)return false;
      const now=new Date().toISOString();
      const created=[];
      entries.forEach(([turma,students],i)=>{
        const draft={...structuredClone(DEFAULT_STATE.assessment),...baseMeta,id:i===0?baseMeta.id:uid(),turma,questions:data.questions||[],descriptors:data.descriptors||[],key:data.key||[],students,questionCount:Number(data.questionCount||data.questions?.length||0),turmas:[turma],multiTurmas:1,updatedAt:now,createdAt:baseMeta.createdAt||now,cloud_avaliacao_id:i===0?baseMeta.cloud_avaliacao_id:null,cloud_saved_at:i===0?baseMeta.cloud_saved_at:null};
        draft.discipline=baseMeta.discipline||data.discipline||this.state.settings.discipline||'Língua Portuguesa';
        draft.tipo=baseMeta.tipo;
        draft.customType=baseMeta.customType||'';
        draft.date=baseMeta.date;
        draft.title=baseMeta.title;
        draft.teacher=baseMeta.teacher||'';
        draft.savedSignature=this.metaSignature(draft);
        const existing=this.state.assessments.findIndex(x=>this.metaSignature(x)===draft.savedSignature);
        if(existing>=0)this.state.assessments[existing]=draft; else this.state.assessments.unshift(draft);
        created.push(draft);
      });
      this.state.assessment={...created[0]};
      this.state.activeAssessmentId=created[0].id;
      this.lastConfirmedAssessmentIds=created.map(x=>x.id);
      this.setBlankAssessmentMode(false);
      this.save();
      this.renderAll();
      setTimeout(()=>window.VETORSupabase?.autoSaveAssessmentIds?.(this.lastConfirmedAssessmentIds),900);
      return true;
    },
    isMultiTurmasMeta(meta=this.state.assessment){return norm(meta?.turma)===MULTI_TURMAS_VALUE;},
    metaSignature(meta=this.state.assessment){const turma=this.isMultiTurmasMeta(meta)?'varias-turmas':meta.turma;return [turma,meta.discipline,meta.title].map(x=>norm(x).toLowerCase()).join('|');},
    normalizeAssessmentTipo(tipo){const t=norm(tipo).toLowerCase(); if(/^simulado\d+$/.test(t))return 'simulado'; if(t==='bimestral')return 'avaliacao'; return t||'diagnostica';},
    assessmentTypeLabel(a=this.state.assessment){const tipo=this.normalizeAssessmentTipo(a?.tipo);const tipoMap={diagnostica:'Diagnóstica',simulado:'Simulado',recuperacao:'Recuperação',avaliacao:'Avaliação',personalizada:'Personalizada',bimestral:'Avaliação',...Object.fromEntries(Array.from({length:10},(_,i)=>['simulado'+(i+1),'Simulado '+(i+1)]))};return tipo==='personalizada'&&norm(a?.customType)?norm(a.customType):(tipoMap[a?.tipo]||tipoMap[tipo]||a?.tipo||'Tipo?');},
    assessmentLabel(a=this.state.assessment){const turma=this.isMultiTurmasMeta(a)?'Várias turmas':(a.turma||'Turma?');return `${turma} • ${a.discipline||'Disciplina?'} • ${this.assessmentTypeLabel(a)} • ${a.date||'Data?'}`;},
    isMetaComplete(meta=this.state.assessment){const issues=[]; if(!norm(meta.turma))issues.push('turma'); if(!norm(meta.discipline))issues.push('disciplina'); if(!norm(meta.tipo))issues.push('tipo'); if(this.normalizeAssessmentTipo(meta.tipo)==='personalizada'&&!norm(meta.customType))issues.push('tipo personalizado'); if(!norm(meta.date))issues.push('data'); return {ok:!issues.length, issues};},
    isAssessmentActiveSaved(){return this.isCurrentAssessmentUsable();},
    saveAssessmentRecord(render=true){let a=this.state.assessment; if(!a.id)return false; const rec={...a, updatedAt:new Date().toISOString(), savedSignature:this.metaSignature(a)}; const i=this.state.assessments.findIndex(x=>x.id===a.id); if(i>=0)this.state.assessments[i]=rec; else this.state.assessments.unshift(rec); this.state.activeAssessmentId=a.id; this.state.assessment={...rec}; if(render)this.renderAssessmentManager(); return true;},
    saveAssessmentMeta(){
      const wasBlank=this.isBlankAssessmentMode() || !this.state.assessment?.id || !this.state.activeAssessmentId;
      this.syncMetaFromInputs(false);
      const metaCheck=this.isMetaComplete();
      const box=$('#assessmentSaveStatus');
      if(!metaCheck.ok){status(box,'Preencha antes de salvar: '+metaCheck.issues.join(', ')+'.','error'); this.updateImportLock(); return;}
      const old=this.state.assessment||{};
      const sig=this.metaSignature(old);
      const existing=this.state.assessments.find(x=>this.metaSignature(x)===sig && x.id!==old.id);
      if(existing){
        status(box,'Ja existe uma avaliacao cadastrada para esta turma/disciplina/tipo/data/titulo. Abra pelo historico ou altere os dados antes de salvar.','error');
        this.updateImportLock();
        return;
      }
      const savedSame=old.id?this.state.assessments.find(x=>x.id===old.id):null;
      const keepData=!wasBlank && savedSame && this.metaSignature(savedSame)===sig;
      const now=new Date().toISOString();
      const base={...structuredClone(DEFAULT_STATE.assessment), id:keepData?old.id:uid(), title:old.title||'Avaliacao', turma:old.turma, turmas:[...(old.turmas||[])], discipline:old.discipline||this.state.settings.discipline, tipo:old.tipo, customType:old.customType||'', date:old.date, teacher:old.teacher||'', questionCount:Number(old.questionCount||old.questions?.length||26), savedSignature:sig, createdAt:keepData?(old.createdAt||savedSame.createdAt||now):now, updatedAt:now};
      if(keepData){
        Object.assign(base,{questions:old.questions||[],descriptors:old.descriptors||[],key:old.key||[],students:old.students||[],turmas:old.turmas||[],multiTurmas:old.multiTurmas||0,cloud_avaliacao_id:old.cloud_avaliacao_id,cloud_saved_at:old.cloud_saved_at});
      }
      this.state.assessment=base;
      this.state.activeAssessmentId=base.id;
      this.setBlankAssessmentMode(false);
      this.clearImportDraft();
      this.saveAssessmentRecord(false);
      status(box,'Avaliacao salva e importacao liberada: '+safe(this.assessmentLabel())+'.','ok');
      this.save(); this.updateImportLock(); this.renderAll();},
    startNewAssessment(){
      const disciplina=this.state.settings.discipline||'Língua Portuguesa';
      this.setBlankAssessmentMode(true);
      this.resetImportState();
      this.state.assessment=this.emptyAssessment(disciplina);
      this.state.activeAssessmentId=null;
      this.state.selectedStudent=null;
      this.state.currentReport='';
      this.clearImportDraft();
      ['previewImport','validationResult','wizardStatus'].forEach(id=>{const el=$('#'+id); if(el) el.innerHTML='';});
      this.fillMetaInputs();
      this.save();
      this.renderAll();
      this.renderBlankNewAnalysis();
      status('#assessmentSaveStatus','Nova avaliação em branco. Preencha os dados e clique em Salvar avaliação para liberar a importação.','work');
      this.showView('importar');
    },
    openAssessment(id){const rec=this.state.assessments.find(x=>x.id===id); if(!rec)return; this.setBlankAssessmentMode(false); this.clearImportDraft(); this.state.assessment={...rec}; this.state.activeAssessmentId=id; this.state.settings.discipline=rec.discipline||this.state.settings.discipline; this.fillMetaInputs(); this.save(); this.renderAll(); this.showView('diagnostico');},
    async deleteAssessment(id){
      const rec=(this.state.assessments||[]).find(x=>x.id===id);
      if(!rec)return;
      if(!requireDeletePassword('apagar esta avaliacao'))return;
      if(!confirm(`Apagar apenas esta avaliacao?\n\n${this.assessmentLabel(rec)}\n\nOs demais dados serao preservados.`))return;
      const cloudId=rec.cloud_avaliacao_id;
      if(cloudId && window.VETORSupabase?.client){
        const client=window.VETORSupabase.client;
        const delRes=await client.from('resultados_alunos').delete().eq('avaliacao_id',cloudId);
        if(delRes.error){alert('Nao foi possivel apagar os resultados na nuvem: '+delRes.error.message);return;}
        const delResp=await client.from('respostas').delete().eq('avaliacao_id',cloudId);
        if(delResp.error){alert('Nao foi possivel apagar as respostas na nuvem: '+delResp.error.message);return;}
        const delAv=await client.from('avaliacoes').delete().eq('id',cloudId);
        if(delAv.error){alert('Nao foi possivel apagar a avaliacao na nuvem: '+delAv.error.message);return;}
      }
      this.state.assessments=(this.state.assessments||[]).filter(x=>x.id!==id);
      if(this.state.activeAssessmentId===id || this.state.assessment?.id===id){
        this.state.activeAssessmentId=null;
        this.state.assessment=this.emptyAssessment(this.state.settings.discipline);
        this.setBlankAssessmentMode(true);
        this.clearImportDraft();
        this.fillMetaInputs();
      }
      this.save();
      this.renderAll();
      status('#assessmentSaveStatus','Avaliacao apagada. As demais avaliacoes foram preservadas.','ok');
    },
    duplicateAssessmentStructure(id=this.state.activeAssessmentId){this.setBlankAssessmentMode(false); const src=this.state.assessments.find(x=>x.id===id)||this.state.assessment; if(!src||!(src.questions||[]).length){alert('Abra uma avaliação com questões, descritores e gabarito para duplicar a estrutura.');return;} const turma=prompt('Informe a nova turma para duplicar a estrutura:', src.turma||''); if(turma===null)return; const date=prompt('Informe a data da nova avaliação (AAAA-MM-DD):', src.date||new Date().toISOString().slice(0,10)); if(date===null)return; this.state.assessment={...structuredClone(DEFAULT_STATE.assessment), id:uid(), title:src.title||'Avaliação duplicada', turma:norm(turma), discipline:src.discipline, tipo:src.tipo, date:norm(date), teacher:src.teacher||'', questionCount:Number(src.questionCount||src.questions?.length||26), questions:[...(src.questions||[])], descriptors:[...(src.descriptors||[])], key:[...(src.key||[])], students:[], createdAt:new Date().toISOString()}; this.state.assessment.savedSignature=this.metaSignature(); this.state.activeAssessmentId=this.state.assessment.id; this.clearImportDraft(); this.saveAssessmentRecord(false); this.fillMetaInputs(); this.save(); this.renderAll(); this.showView('importar');},
    renderAssessmentManager(){const a=this.state.assessment; const box=$('#activeAssessmentBox'); if(box){if(this.isAssessmentActiveSaved())box.className='statusbox status-ok', box.innerHTML=`<b>Avaliação ativa salva</b><br>${safe(this.assessmentLabel())}<br><small>${(a.questions||[]).length} questões • ${(a.students||[]).length} alunos • ${safe(a.teacher||'Professor não informado')}</small>`; else box.className='statusbox status-work', box.innerHTML='Nenhuma avaliação ativa. Preencha os campos e clique em <b>Salvar avaliação</b> para liberar upload.';} const hist=$('#assessmentHistory'); if(hist){const list=this.state.assessments||[];hist.innerHTML=list.length?list.map(rec=>`<div class="assessment-item ${rec.id===this.state.activeAssessmentId?'active':''}"><div><b>${safe(rec.title||'Avaliação')}</b><br><span>${safe(this.assessmentLabel(rec))}</span><br><small>${(rec.questions||[]).length} questões • ${(rec.students||[]).length} alunos • ${new Date(rec.updatedAt||rec.createdAt||Date.now()).toLocaleString('pt-BR')}</small></div><div class="assessment-actions"><button class="smallBtn" data-open-assessment="${rec.id}">Abrir</button><button class="smallBtn secondary" data-dup-assessment="${rec.id}">Duplicar estrutura</button></div></div>`).join(''):'<p class="hint">Nenhuma avaliação salva ainda.</p>'; hist.querySelectorAll('[data-open-assessment]').forEach(b=>b.onclick=()=>this.openAssessment(b.dataset.openAssessment)); hist.querySelectorAll('[data-dup-assessment]').forEach(b=>b.onclick=()=>this.duplicateAssessmentStructure(b.dataset.dupAssessment));} this.updateImportLock();},
    updateImportLock(){const unlocked=this.isAssessmentActiveSaved(); ['fileInput','extractFile','loadExample','pdfOnlyInput','readPdfOnly','pasteData','validateData','validateDataGate','confirmImport'].forEach(id=>{const el=$('#'+id); if(el)el.disabled=!unlocked || (id==='confirmImport' && !window.Importacao?.pending);}); const ex=$('#extractStatus'); if(ex&&!unlocked) status(ex,'Salve uma avaliação antes de importar dados.','work'); return unlocked;},
    clearImportDraft(){this.resetImportState(); const f=$('#fileInput'); if(f)f.value=''; const pdf=$('#pdfOnlyInput'); if(pdf)pdf.value=''; const paste=$('#pasteData'); if(paste)paste.value=''; const prev=$('#previewImport'); if(prev)prev.innerHTML=''; const vr=$('#validationResult'); if(vr)vr.innerHTML=''; const gate=$('#importGate'); if(gate)status(gate,'Aguardando importação ou validação.','work'); const confirm=$('#confirmImport'); if(confirm)confirm.disabled=true;},
    getResults(){if(!this.isAssessmentActiveSaved())return {students:[],items:[],descriptorStats:[],summary:{nStudents:0,nQuestions:0,avg:0}};return window.Diagnostico?.compute(this.state.assessment)||{students:[],items:[],descriptorStats:[],summary:{nStudents:0,nQuestions:0,avg:0}}},
    renderAll(){window.__vetorRenderAllRunning=true; try{window.Diagnostico?.render(); window.Relatorios?.renderCoord(); window.BancoQuestoes?.render(); window.Intervencoes?.render?.(); window.TurmasVetor?.render?.(); window.Evolucao?.render?.(); this.renderTeachers(); this.renderSelects(); this.renderDescriptors(); this.renderQuestionMap(); this.renderChangelog(); this.renderWizard(); this.renderAssessmentManager();} finally{window.__vetorRenderAllRunning=false;}},
    renderSelects(){const students=cleanStudents(this.state.assessment.students||[]); ['#mapStudent','#sheetStudent','#reportStudent'].forEach(sel=>{const e=$(sel); if(!e)return; const cur=e.value; e.innerHTML='<option value="">Selecione</option>'+students.map((s,i)=>`<option value="${i}">${safe(s.name)}</option>`).join(''); e.value=cur;});},
    renderQuestionMap(){const box=$('#questionMap'); if(!box)return; const active=this.state.assessment||{}; if(!this.isAssessmentActiveSaved()){box.innerHTML='<p class="hint">Nenhuma avaliação carregada. Salve a identificação da nova avaliação e importe uma planilha para liberar o mapeamento.</p>'; return;} const saved=(this.state.assessments||[]).filter(x=>(x.questions||[]).length); const options=saved.map(rec=>`<option value="${safe(rec.id)}" ${rec.id===active.id?'selected':''}>${safe(this.assessmentLabel(rec))} • ${(rec.questions||[]).length} questões</option>`).join(''); const controls=saved.length?`<div class="map-selector"><label>Escolher turma/avaliação<select id="questionMapAssessmentSelect"><option value="">Avaliação ativa</option>${options}</select></label></div>`:''; const a=active; if(!a.questions.length){box.innerHTML=controls+'<p class="hint">Nenhuma avaliação carregada.</p>'; this.bindQuestionMapSelector(); return;} box.innerHTML=controls+a.questions.map((q,i)=>`<div class="question-card"><b>${safe(q||'Q'+(i+1))}</b><p>Descritor: <strong>${safe(a.descriptors[i]||'-')}</strong></p><p>Gabarito: <strong>${safe(a.key[i]||'-')}</strong></p></div>`).join(''); this.bindQuestionMapSelector();},
    bindQuestionMapSelector(){const sel=$('#questionMapAssessmentSelect'); if(!sel||sel.__vetorBound)return; sel.__vetorBound=true; sel.onchange=()=>{if(sel.value)this.openAssessment(sel.value);};},
    renderTeachers(){const el=$('#assessmentTeacher'); if(!el||el.tagName!=='SELECT')return; const current=this.state.assessment?.teacher||el.value||window.VETORSupabase?.profile?.nome||''; const names=[]; const add=v=>{v=norm(v); if(v&&!names.some(x=>x.toLowerCase()===v.toLowerCase()))names.push(v);}; (window.VETORSupabase?.teacherProfiles||[]).forEach(p=>add(p.nome||p.email)); (window.__vetorAdminPerfis||[]).forEach(p=>add(p.nome||p.email)); add(window.VETORSupabase?.profile?.nome); add(current); names.sort((a,b)=>a.localeCompare(b,'pt-BR')); el.innerHTML='<option value="">Selecione o professor</option>'+names.map(n=>`<option value="${safe(n)}">${safe(n)}</option>`).join(''); el.value=current;},
    renderDescriptors(){const box=$('#descriptorList'); if(!box)return; const disc=$('#descriptorDiscipline')?.value||this.state.settings.discipline; const term=norm($('#descriptorSearch')?.value).toLowerCase(); const list=window.Descritores?.list(disc)||[]; const res=this.getResults(); const assoc={}; (this.state.assessment.descriptors||[]).forEach((d,i)=>{if(!d)return;(assoc[d]??=[]).push('Q'+(i+1));}); box.innerHTML=list.filter(d=>!term||JSON.stringify(d).toLowerCase().includes(term)).map(d=>`<details class="desc"><summary>${safe(d.codigo)} — ${safe(d.texto)}</summary><p><b>Habilidades:</b> ${safe(d.bncc||'Não informada')}</p><p><b>Erros comuns:</b> ${safe(d.erros||'Leitura superficial, confusão conceitual ou estratégia inadequada.')}</p><p><b>Estratégias:</b> ${safe(d.estrategias||'Retomada guiada, modelagem de resolução e prática orientada.')}</p><p><b>Questões associadas nesta avaliação:</b> ${safe((assoc[d.codigo]||[]).join(', ')||'Nenhuma')}</p></details>`).join('')||'<p class="hint">Nenhum descritor encontrado.</p>';},
    renderChangelog(){const box=$('#changelogBox'); if(box) box.innerHTML='<h3>V68.7.1</h3><ul><li>Integração institucional com Supabase.</li><li>Histórico, evolução e inteligência pedagógica usando dados da nuvem.</li><li>Interface limpa sem painéis provisórios de versões antigas.</li></ul>'; },
    isAssessmentValid(){const a=this.state.assessment||{};const issues=[];if(!(a.questions||[]).length)issues.push('nenhuma questão');if((a.descriptors||[]).length!==(a.questions||[]).length||((a.descriptors||[]).some(x=>!x)))issues.push('descritores ausentes');if((a.key||[]).length!==(a.questions||[]).length||((a.key||[]).some(x=>!x)))issues.push('gabarito incompleto');if(!(a.students||[]).length)issues.push('nenhum aluno');if((a.students||[]).some(s=>!s.name))issues.push('aluno sem nome');if((a.students||[]).some(s=>(s.answers||[]).length<(a.questions||[]).length))issues.push('respostas incompletas');const validCodes=window.Descritores?.validCodes?.(a.discipline||this.state.settings.discipline);if(validCodes){const invalid=[...new Set((a.descriptors||[]).filter(d=>d&&!validCodes.has(d)))];if(invalid.length)issues.push('descritores fora da matriz: '+invalid.join(', '));}return {ok:!issues.length,issues};},
    renderWizard(){if(!this.isAssessmentActiveSaved()){const box0=$('#wizardStatus'); if(box0) box0.innerHTML=''; this.renderBlankNewAnalysis(); return;} const box=$('#wizardStatus');const a=this.state.assessment;const valid=this.isAssessmentValid();const r=this.getResults();const hasMeta=this.isMetaComplete().ok;const hasFile=(a.questions||[]).length>0;const hasStudents=(a.students||[]).length>0;const validStructure=hasFile&&valid.ok;const steps=[['Importação',hasFile?'ok':'wait',`${(a.questions||[]).length||0} questões`],['Descritores',valid.issues.includes('descritores ausentes')?'bad':hasFile?'ok':'wait',`${(a.descriptors||[]).filter(Boolean).length}/${(a.questions||[]).length||0}`],['Gabarito',valid.issues.includes('gabarito incompleto')?'bad':hasFile?'ok':'wait',`${(a.key||[]).filter(Boolean).length}/${(a.questions||[]).length||0}`],['Alunos',hasStudents?'ok':'wait',`${(a.students||[]).length||0} alunos`],['Diagnóstico',r.summary.nStudents?'ok':'wait',r.summary.nStudents?`${r.summary.avg} média`:'pendente'],['Relatórios',r.summary.nStudents?'ok':'wait',r.summary.nStudents?'prontos':'pendentes']];if(box)box.innerHTML=steps.map(([t,st,txt])=>`<div class="wizard-card ${st}"><b>${safe(t)}</b><span>${safe(txt)}</span></div>`).join('');this.renderNewAnalysisDashboard?.(hasMeta,hasFile,validStructure,valid,r);const next=$('#wizardNext');if(next){if(!a.questions?.length)status(next,'Próxima ação: importe uma planilha Excel ou digite os dados manualmente.','work');else if(!valid.ok)status(next,'Ajuste a estrutura antes de analisar: '+valid.issues.join(', ')+'.','error');else if(!r.summary.nStudents)status(next,'Estrutura válida. Clique em Diagnóstico para analisar.','ok');else status(next,'Diagnóstico pronto. Gere relatórios, Mapa da Mina ou salve na nuvem.','ok');}},
    renderNewAnalysisDashboard(hasMeta,hasFile,validStructure,valid,r){
      const box=$('#newAnalysisSummary'); if(!box)return;
      if(!this.isAssessmentActiveSaved()){ this.resetImportState(); this.renderBlankNewAnalysis(); return; }
      const saved=this.state.assessment||{};
      const isSavedActive=!!this.isAssessmentActiveSaved?.();
      const rawPending=window.Importacao?.pending||null;
      const pending=isSavedActive?rawPending:null;
      if(!isSavedActive && rawPending && window.Importacao) window.Importacao.pending=null;
      const a=pending?{...saved,...pending,turma:saved.turma,tipo:saved.tipo,date:saved.date,teacher:saved.teacher,discipline:pending.discipline||saved.discipline}:saved;
      const issues=pending?(pending.issues||[]):(isSavedActive?(valid?.issues||[]):['nenhuma questão']);
      const q=pending?((a.questions||[]).length||0):(isSavedActive?((a.questions||[]).length||0):0);
      const students=pending?((a.students||[]).length||0):(isSavedActive?((a.students||[]).length||0):0);
      const imported=!!pending||(isSavedActive&&q>0);
      const identifiedTurmas=imported?(pending?(((pending.turmas||[]).length?pending.turmas:[saved.turma].filter(Boolean))):[...new Set((a.students||[]).map(s=>s.turma||a.turma).filter(Boolean))]):[];
      const ready=pending?(!issues.length&&q&&students):(isSavedActive&&validStructure);
      const summaryTurmas=imported?identifiedTurmas.length:0;
      const user=this.state?.currentUser?.name||this.state?.currentUser?.email||saved.teacher||'Professor';
      $('#newAnalysisUserName')&&($('#newAnalysisUserName').textContent=user);
      const stepEls=$$('.analysis-stepper .step');
      const states=[hasMeta&&isSavedActive,imported,ready,imported,ready&&students];
      stepEls.forEach((el,i)=>{el.classList.toggle('done',!!states[i]);el.classList.toggle('on',i===states.findIndex(v=>!v)||(!states.includes(false)&&i===4));});
      const statusItems=[
        ['Gabarito encontrado',imported&&(a.key||[]).filter(Boolean).length===q&&q,imported?'Arquivo de gabarito identificado':'Aguardando importação'],
        ['Quantidade de questões',imported&&q,imported?`${q} questões importadas`:'0 questões importadas'],
        ['Descritores encontrados',imported&&(a.descriptors||[]).filter(Boolean).length===q&&q,imported?'Descritores mapeados com sucesso':'Aguardando importação'],
        ['Total de alunos',imported&&students,imported?`${students} alunos identificados`:'0 alunos identificados'],
        ['Turmas identificadas',imported&&identifiedTurmas.length,imported?`${identifiedTurmas.length||0} turma${(identifiedTurmas.length||0)!==1?'s':''} reconhecida${(identifiedTurmas.length||0)!==1?'s':''}`:'0 turmas reconhecidas'],
        ['Estrutura válida',ready,ready?'Arquivos prontos para análise':'Aguardando importação']
      ];
      box.innerHTML=`<section class="na-card na-validation"><h3>3. Validação da estrutura</h3><p>Verificação automática da integridade dos arquivos.</p>${statusItems.map(([t,ok,txt])=>`<div class="na-check ${ok?'ok':'wait'}"><b>${safe(t)}</b><span>${safe(txt)}</span></div>`).join('')}<div class="na-ready ${ready?'ok':'wait'}">${ready?'Tudo certo! Sua avaliação está pronta para ser analisada.':'Aguardando estrutura válida para análise.'}</div></section><section class="na-card na-summary"><h3>4. Resumo da avaliação</h3><p>Revise as informações antes de iniciar a análise.</p><div class="na-metrics"><div><span>Disciplina</span><b>${safe(isSavedActive?(a.discipline||this.state.settings.discipline||'-'):(saved.discipline||this.state.settings.discipline||'-'))}</b></div><div><span>Turmas</span><b>${summaryTurmas}</b></div><div><span>Alunos</span><b>${students}</b></div><div><span>Questões</span><b>${q}</b></div><div><span>Motor de cálculo</span><b>${safe((this.state.settings?.calcEngine||'linear')==='logistico'?'Curva logística':'SEPC')}</b></div></div></section><section class="na-card na-start"><h3>5. Iniciar análise</h3><p>Clique no botão abaixo para importar e gerar os resultados.</p><button id="newAnalysisRun" ${ready?'':'disabled'}>Importar e analisar</button><small>Seus dados estão seguros e salvos automaticamente.</small></section>`;
      const run=$('#newAnalysisRun'); if(run)run.onclick=()=>{if(pending)$('#confirmImport')?.click();setTimeout(()=>this.showView('diagnostico'),80);};
    },
    syncMetaFromInputs(checkChange=true){const before=structuredClone(this.state.assessment||{}); const a={...before}; const oldSig=this.metaSignature(before); const ids={title:'#assessmentTitle',turma:'#assessmentClass',tipo:'#assessmentType',date:'#assessmentDate',teacher:'#assessmentTeacher'}; if($(ids.title)) a.title=norm($(ids.title).value)||a.title; if($(ids.turma)) a.turma=norm($(ids.turma).value); if($('#assessmentDiscipline')) a.discipline=$('#assessmentDiscipline').value; if($(ids.tipo)) a.tipo=this.normalizeAssessmentTipo($(ids.tipo).value||a.tipo); if($('#assessmentTypeCustom')) a.customType=a.tipo==='personalizada'?norm($('#assessmentTypeCustom').value):''; if($(ids.date)) a.date=$(ids.date).value||a.date; if($('#assessmentQuestionCount')){ const qv=Number($('#assessmentQuestionCount').value); a.questionCount=(qv>0?qv:0); } if($(ids.teacher)) a.teacher=norm($(ids.teacher).value); const newSig=this.metaSignature(a); if(checkChange&&before.id&&before.savedSignature&&oldSig!==newSig){this.state.assessment={...before}; this.saveAssessmentRecord(false); this.state.assessment={...structuredClone(DEFAULT_STATE.assessment), title:a.title||'Nova avaliação', turma:a.turma, discipline:a.discipline, tipo:a.tipo, customType:a.customType||'', date:a.date, teacher:a.teacher, questionCount:a.questionCount||0}; this.state.activeAssessmentId=null; this.setBlankAssessmentMode(true); this.clearImportDraft(); status('#assessmentSaveStatus','Você alterou turma/disciplina/tipo/data/quantidade de questões. Salve para criar uma nova avaliação; a anterior foi preservada.','work');} else {this.state.assessment=a;} this.toggleCustomTypeField?.(); this.updateImportLock();},
    fillMetaInputs(){const a=this.state.assessment; $('#assessmentTitle')&&($('#assessmentTitle').value=a.title||''); $('#assessmentClass')&&($('#assessmentClass').value=a.turma||''); $('#assessmentType')&&($('#assessmentType').value=this.normalizeAssessmentTipo(a.tipo)||'diagnostica'); $('#assessmentTypeCustom')&&($('#assessmentTypeCustom').value=a.customType||''); this.toggleCustomTypeField?.(); $('#assessmentDate')&&($('#assessmentDate').value=a.date||''); $('#assessmentQuestionCount')&&($('#assessmentQuestionCount').value=(Number(a.questionCount)>0?Number(a.questionCount):((a.questions||[]).length||''))); this.renderTeachers(); $('#assessmentTeacher')&&($('#assessmentTeacher').value=a.teacher||''); $('#supabaseUrl')&&($('#supabaseUrl').value=this.state.settings.supabaseUrl||localStorage.getItem('vetor_supabase_url')||''); $('#supabaseAnonKey')&&($('#supabaseAnonKey').value=this.state.settings.supabaseAnonKey||localStorage.getItem('vetor_supabase_anon')||'');},
    bindBase(){
      $$('.nav').forEach(btn=>btn.onclick=()=>{ if(btn.dataset.view==='importar' && !btn.classList.contains('active')) this.startNewAssessment(); else this.showView(btn.dataset.view); }); $$('[data-go]').forEach(btn=>btn.onclick=()=>this.showView(btn.dataset.go));
      $('#openMenu')&&( $('#openMenu').onclick=()=>$('#sidebar')?.classList.add('open')); $('#closeMenu')&&( $('#closeMenu').onclick=()=>$('#sidebar')?.classList.remove('open'));
      $$('.tabBtn').forEach(btn=>btn.onclick=()=>{ $$('.tabBtn').forEach(b=>b.classList.remove('active')); $$('.tabPane').forEach(p=>p.classList.remove('active')); btn.classList.add('active'); $('#'+btn.dataset.tab)?.classList.add('active'); });
      $('#assessmentDiscipline')&&( $('#assessmentDiscipline').onchange=e=>{this.state.assessment.discipline=e.target.value;this.state.settings.discipline=e.target.value;$('#configDiscipline')&&($('#configDiscipline').value=e.target.value);this.syncMetaFromInputs(true);this.save();this.renderAll();});
      $('#configDiscipline')&&( $('#configDiscipline').onchange=e=>{this.state.settings.discipline=e.target.value;$('#assessmentDiscipline')&&($('#assessmentDiscipline').value=e.target.value);this.save();});
      ['assessmentTitle','assessmentClass','assessmentType','assessmentTypeCustom','assessmentDate','assessmentQuestionCount','assessmentTeacher'].forEach(id=>{const el=$('#'+id); if(el) el.onchange=el.oninput=()=>{this.syncMetaFromInputs(true); this.save(); this.renderAssessmentManager();};}); $('#saveAssessmentMeta')&&($('#saveAssessmentMeta').onclick=()=>this.saveAssessmentMeta()); $('#newAssessment')&&($('#newAssessment').onclick=()=>{if(confirm('Criar uma nova avaliação em branco? A avaliação atual salva será preservada.'))this.startNewAssessment();}); 
      $('#descriptorDiscipline')&&( $('#descriptorDiscipline').onchange=()=>this.renderDescriptors()); $('#descriptorSearch')&&( $('#descriptorSearch').oninput=()=>this.renderDescriptors());
      $('#wizardValidate')&&( $('#wizardValidate').onclick=()=>{this.showView('importar'); $('#validateData')?.click();}); $('#wizardAnalyze')&&( $('#wizardAnalyze').onclick=()=>{const v=this.isAssessmentValid(); if(!v.ok){alert('A estrutura ainda não está válida: '+v.issues.join(', ')); this.showView('importar');} else this.showView('diagnostico');});
      $('#studentSearch')&&( $('#studentSearch').oninput=()=>window.Diagnostico?.renderStudents());
      $('#clearAll')&&( $('#clearAll').onclick=()=>{if(!requireDeletePassword('apagar todos os dados salvos neste navegador'))return; if(confirm('Apagar todos os dados salvos neste navegador?')){localStorage.removeItem(STORE);localStorage.removeItem(BACKUP_STORE);location.reload();}});
    },
    showView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));$('#sidebar')?.classList.remove('open'); setTimeout(()=>scrollTo({top:0,behavior:'smooth'}),20);},
    init(){if(this.isBlankAssessmentMode()){this.setBlankAssessmentMode(false); this.resetImportState();} this.bindBase(); $('#assessmentDiscipline')&&($('#assessmentDiscipline').value=this.state.assessment.discipline||this.state.settings.discipline); $('#configDiscipline')&&($('#configDiscipline').value=this.state.settings.discipline); this.fillMetaInputs(); this.setSaveStatus(); this.updateImportLock(); this.renderAll();}
  };
  App.performanceLevel=performanceLevel;
  App.requireDeletePassword=requireDeletePassword;
  App.toggleCustomTypeField=function(){
    const sel=$('#assessmentType');
    const wrap=$('#customTypeWrap');
    const custom=$('#assessmentTypeCustom');
    const active=this.normalizeAssessmentTipo(sel?.value||this.state.assessment?.tipo)==='personalizada';
    if(wrap)wrap.classList.toggle('active',active);
    if(custom)custom.required=active;
  };
  App.stripTurmaSubject=function(t){
    return norm(t)
      .replace(/\s*(?:[•-]|â€¢)\s*(?:L(?:í|Ã­)ngua\s+Portuguesa|Portugu(?:ê|Ãª)s|Portugues|Matem(?:á|Ã¡)tica|Matematica)\s*$/i,'')
      .trim();
  };
  App.turmaCanonicalInfo=function(t){
    const raw=this.stripTurmaSubject(t);
    const ascii=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const serie=(ascii.match(/([123])\s*(?:O|A|º|ª|°)?/)||[])[1]||'';
    const letra=(ascii.match(/\b([AB])\b/)||[])[1]||'';
    const curso=ascii.includes('REDES')?'Redes':((ascii.includes('ADM')||ascii.includes('ADMINISTRACAO'))?'Administração':'');
    if(serie&&letra&&curso)return {key:`${serie}|${letra}|${curso.toUpperCase()}`,label:`${serie}º ${letra} ${curso}`};
    return {key:raw.toLowerCase(),label:raw};
  };
  App.cleanTurmaName=function(t){
    return this.turmaCanonicalInfo(t).label;
  };
  App.singleTurmaSignature=function(meta,turma=meta?.turma){
    return [this.cleanTurmaName(turma),meta?.discipline,meta?.title]
      .map(x=>norm(x).toLowerCase())
      .join('|');
  };
  App.getAvailableTurmas=function(){
    let list=[];
    try{list=Object.keys(window.TurmasVetor?.getTurmas?.()||{});}catch(e){}
    if(!list.length){
      try{list=Object.keys(JSON.parse(localStorage.getItem('vetor_turmas_v68_6')||'{}')||{});}catch(e){}
    }
    if(list.length){
      const map=new Map();
      list.forEach(t=>{const info=this.turmaCanonicalInfo(t); if(info.label&&!map.has(info.key))map.set(info.key,info.label);});
      return [...map.values()].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR',{numeric:true}));
    }
    const fromAssessments=[...(this.state.assessments||[]),this.state.assessment||{}].map(a=>a?.turma).filter(Boolean).filter(t=>t!==MULTI_TURMAS_VALUE);
    const map=new Map();
    fromAssessments.forEach(t=>{const info=this.turmaCanonicalInfo(t); if(info.label&&!map.has(info.key))map.set(info.key,info.label);});
    return [...map.values()].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR',{numeric:true}));
  };
  App.assessmentTurmaSerie=function(turma){
    const t=norm(turma);
    const m=t.match(/([123])\s*(?:º|ª|°|o|a)?|\b([123])\s*ano\b/i);
    return m?.[1]||m?.[2]||'outros';
  };
  App.getSelectedAssessmentTurmas=function(){
    const box=$('#assessmentClassChecks');
    const checked=$$('#assessmentClassChecks input[type="checkbox"]:checked').map(cb=>this.cleanTurmaName(norm(cb.value))).filter(Boolean);
    if(checked.length)return checked;
    if(box && box.querySelector('input[type="checkbox"]'))return [];
    const saved=(this.state.assessment?.turmas||[]).map(t=>this.cleanTurmaName(t)).filter(Boolean);
    if(saved.length)return saved;
    const turma=this.cleanTurmaName(norm($('#assessmentClass')?.value||this.state.assessment?.turma||''));
    return turma&&turma!==MULTI_TURMAS_VALUE?[turma]:[];
  };
  App.renderAssessmentClassPicker=function(){
    const box=$('#assessmentClassChecks'); if(!box)return;
    const list=this.getAvailableTurmas();
    const hasImportedData=(this.state.assessment?.students||[]).length>0 || (this.state.assessment?.questions||[]).length>0;
    const restoreSelection=this.isAssessmentActiveSaved?.() && !this.isBlankAssessmentMode?.() && !!this.state.activeAssessmentId && hasImportedData;
    const selected=new Set(restoreSelection?(this.state.assessment?.turmas||[]).map(t=>this.cleanTurmaName(t)).filter(t=>list.includes(t)):[]);
    const turma=this.cleanTurmaName(norm(this.state.assessment?.turma||''));
    if(restoreSelection && !selected.size && turma && turma!==MULTI_TURMAS_VALUE)selected.add(turma);
    if(!list.length){
      box.innerHTML='<span class="compare-empty">Cadastre turmas na aba Turmas para selecionar em lote.</span>';
    }else{
      const groups=[['1','1º ano'],['2','2º ano'],['3','3º ano']];
      const renderChip=t=>`<label class="assessment-class-chip ${selected.has(t)?'selected':''}"><input type="checkbox" value="${safe(t)}" ${selected.has(t)?'checked':''}/><span>${safe(t)}</span></label>`;
      const cols=groups.map(([key,label])=>{
        const items=list.filter(t=>this.assessmentTurmaSerie(t)===key);
        return `<section class="assessment-class-col"><h4>${safe(label)}</h4><div>${items.length?items.map(renderChip).join(''):'<span class="compare-empty">Sem turmas</span>'}</div></section>`;
      }).join('');
      const other=list.filter(t=>this.assessmentTurmaSerie(t)==='outros');
      box.innerHTML=`<div class="assessment-class-series-grid">${cols}</div>${other.length?`<section class="assessment-class-other"><h4>Outras turmas</h4><div>${other.map(renderChip).join('')}</div></section>`:''}`;
    }
    box.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
      cb.onchange=()=>{
        cb.closest('.assessment-class-chip')?.classList.toggle('selected',cb.checked);
        this.syncMetaFromInputs(true);
        this.save();
        this.renderAssessmentUploadSlots?.();
        this.renderAssessmentManager();
      };
    });
  };
  App.applySelectedTurmasToAssessment=function(){
    const box=$('#assessmentClassChecks');
    const checked=$$('#assessmentClassChecks input[type="checkbox"]:checked').map(cb=>this.cleanTurmaName(norm(cb.value))).filter(Boolean);
    if(checked.length>1){
      this.state.assessment.turma=MULTI_TURMAS_VALUE;
      this.state.assessment.turmas=checked;
      const sel=$('#assessmentClass'); if(sel)sel.value=MULTI_TURMAS_VALUE;
    }else if(checked.length===1){
      this.state.assessment.turma=checked[0];
      this.state.assessment.turmas=[checked[0]];
      const sel=$('#assessmentClass'); if(sel)sel.value=checked[0];
    }else{
      if(box && box.querySelector('input[type="checkbox"]'))this.state.assessment.turma='';
      this.state.assessment.turmas=[];
    }
  };
  App.renderAssessmentUploadSlots=function(){
    const box=$('#turmaUploadSlots'); if(!box)return;
    const turmas=this.getSelectedAssessmentTurmas();
    const multi=turmas.length>1 || this.isMultiTurmasMeta?.();
    const single=$('#fileInput');
    if(single)single.classList.toggle('single-upload-hidden',multi);
    if(!multi){box.innerHTML='';return;}
    box.innerHTML=`<div class="turma-upload-grid">${turmas.map((t,i)=>`<label class="turma-upload-card"><b>${safe(t)}</b><span>Planilha desta turma</span><input accept=".xlsx,.xls,.csv,.txt" ${this.isAssessmentActiveSaved()?'':'disabled'} data-turma-upload="${safe(t)}" type="file"/></label>`).join('')}</div>`;
  };
  App.hasDuplicateForSelectedTurmas=function(meta=this.state.assessment){
    const selected=this.getSelectedAssessmentTurmas?.()||[];
    const turmas=selected.length?selected:((meta.turmas||[]).length?meta.turmas:(meta.turma&&meta.turma!==MULTI_TURMAS_VALUE?[meta.turma]:[]));
    return turmas.map(turma=>{
      const draft={...meta,turma:this.cleanTurmaName(turma),turmas:[this.cleanTurmaName(turma)]};
      return (this.state.assessments||[]).find(x=>x.id!==meta.id && !this.isMultiTurmasMeta(x) && this.singleTurmaSignature(x)===this.singleTurmaSignature(draft));
    }).filter(Boolean);
  };
  const __syncMetaFromInputs=App.syncMetaFromInputs.bind(App);
  App.syncMetaFromInputs=function(checkChange=true){
    __syncMetaFromInputs(checkChange);
    this.applySelectedTurmasToAssessment?.();
    this.renderAssessmentUploadSlots?.();
  };
  const __fillMetaInputs=App.fillMetaInputs.bind(App);
  App.fillMetaInputs=function(){
    __fillMetaInputs();
    this.renderAssessmentClassPicker?.();
    this.renderAssessmentUploadSlots?.();
  };
  const __startNewAssessment=App.startNewAssessment.bind(App);
  App.startNewAssessment=function(){
    const out=__startNewAssessment();
    this.state.assessment.turma='';
    this.state.assessment.turmas=[];
    $$('#assessmentClassChecks input[type="checkbox"]').forEach(cb=>{cb.checked=false; cb.closest('.assessment-class-chip')?.classList.remove('selected');});
    this.renderAssessmentUploadSlots?.();
    this.save?.();
    return out;
  };
  const __saveAssessmentMeta=App.saveAssessmentMeta.bind(App);
  App.saveAssessmentMeta=function(){
    this.syncMetaFromInputs(false);
    const selected=this.getSelectedAssessmentTurmas?.()||[];
    const dup=this.hasDuplicateForSelectedTurmas?.();
    const box=$('#assessmentSaveStatus');
    if(dup?.length){
      status(box,'Já existe avaliação cadastrada para: '+dup.map(a=>safe(a.turma)).join(', ')+'. Altere o tipo/título/data ou apague a avaliação existente.','error');
      this.updateImportLock();
      return;
    }
    if(selected.length>1 || this.isMultiTurmasMeta?.()){
      const metaCheck=this.isMetaComplete();
      if(!metaCheck.ok){
        status(box,'Preencha antes de salvar: '+metaCheck.issues.join(', ')+'.','error');
        this.updateImportLock();
        return;
      }
      const old=this.state.assessment||{};
      const now=new Date().toISOString();
      const base={...structuredClone(DEFAULT_STATE.assessment),
        id:old.id||uid(),
        title:old.title||'Avaliacao',
        turma:MULTI_TURMAS_VALUE,
        turmas:selected,
        discipline:old.discipline||this.state.settings.discipline,
        tipo:old.tipo,
        customType:old.customType||'',
        date:old.date,
        teacher:old.teacher||'',
        questionCount:Number(old.questionCount||26),
        multiTurmas:selected.length,
        savedSignature:['lote',selected.map(t=>this.cleanTurmaName(t)).sort().join(','),old.discipline,old.title].map(x=>norm(x).toLowerCase()).join('|'),
        createdAt:old.createdAt||now,
        updatedAt:now
      };
      this.state.assessment=base;
      this.state.activeAssessmentId=base.id;
      this.setBlankAssessmentMode(false);
      this.clearImportDraft();
      const i=this.state.assessments.findIndex(x=>x.id===base.id);
      if(i>=0)this.state.assessments[i]=base; else this.state.assessments.unshift(base);
      status(box,'Avaliação salva para '+selected.length+' turmas. Envie a planilha de cada turma para importar.','ok');
      this.save();
      this.updateImportLock();
      this.renderAll();
      return;
    }
    return __saveAssessmentMeta();
  };
  const __updateImportLock=App.updateImportLock.bind(App);
  App.updateImportLock=function(){
    const unlocked=__updateImportLock();
    $$('#turmaUploadSlots input[type="file"]').forEach(el=>el.disabled=!unlocked);
    this.renderAssessmentUploadSlots?.();
    return unlocked;
  };
  App.confirmMultiAssessmentData=function(data){
    if(!this.isAssessmentActiveSaved())return false;
    const activeId=this.state.activeAssessmentId||this.state.assessment?.id;
    const idx=(this.state.assessments||[]).findIndex(x=>x.id===activeId);
    if(idx<0)return false;
    const baseMeta={...this.state.assessments[idx]};
    const entries=Array.isArray(data.parts)&&data.parts.length
      ? data.parts.map((part,idx)=>[norm(part.turma||'Turma '+(idx+1)),(part.students||[]).map(st=>({...st,turma:undefined})),part])
      : Object.entries((data.students||[]).reduce((acc,st)=>{const turma=norm(st.turma||baseMeta.turma||'Turma'); (acc[turma]??=[]).push({...st,turma:undefined}); return acc;},{})).map(([turma,students])=>[turma,students,data]);
    if(!entries.length)return false;
    const now=new Date().toISOString();
    const created=[];
    const baseIsMulti=this.isMultiTurmasMeta(baseMeta);
    entries.forEach(([turma,students,part],i)=>{
      const draft={...structuredClone(DEFAULT_STATE.assessment),...baseMeta,id:(!baseIsMulti&&i===0)?baseMeta.id:uid(),turma,questions:part.questions||data.questions||[],descriptors:part.descriptors||data.descriptors||[],key:part.key||data.key||[],students,questionCount:Number(part.questionCount||part.questions?.length||data.questionCount||data.questions?.length||0),turmas:[turma],multiTurmas:1,updatedAt:now,createdAt:baseMeta.createdAt||now,cloud_avaliacao_id:(!baseIsMulti&&i===0)?baseMeta.cloud_avaliacao_id:null,cloud_saved_at:(!baseIsMulti&&i===0)?baseMeta.cloud_saved_at:null};
      draft.discipline=baseMeta.discipline||part.discipline||data.discipline||this.state.settings.discipline||'Língua Portuguesa';
      draft.tipo=baseMeta.tipo;
      draft.customType=baseMeta.customType||'';
      draft.date=baseMeta.date;
      draft.title=baseMeta.title;
      draft.teacher=baseMeta.teacher||'';
      draft.savedSignature=this.metaSignature(draft);
      const existing=this.state.assessments.findIndex(x=>!this.isMultiTurmasMeta(x) && this.singleTurmaSignature(x)===this.singleTurmaSignature(draft));
      if(existing>=0){
        draft.id=this.state.assessments[existing].id;
        draft.cloud_avaliacao_id=this.state.assessments[existing].cloud_avaliacao_id||draft.cloud_avaliacao_id;
        draft.cloud_saved_at=this.state.assessments[existing].cloud_saved_at||draft.cloud_saved_at;
        this.state.assessments[existing]=draft;
      }else{
        this.state.assessments.unshift(draft);
      }
      created.push(draft);
    });
    if(baseIsMulti)this.state.assessments=this.state.assessments.filter(x=>x.id!==baseMeta.id);
    this.state.assessment={...created[0]};
    this.state.activeAssessmentId=created[0].id;
    this.lastConfirmedAssessmentIds=created.map(x=>x.id);
    this.setBlankAssessmentMode(false);
    this.save();
    this.renderAll();
    setTimeout(()=>window.VETORSupabase?.autoSaveAssessmentIds?.(this.lastConfirmedAssessmentIds),900);
    return true;
  };
  function enhanceAssessmentDeleteButtons(){
    document.querySelectorAll('#assessmentHistory [data-open-assessment]').forEach(openBtn=>{
      const id=openBtn.dataset.openAssessment;
      const actions=openBtn.closest('.assessment-actions');
      if(!actions||!id||actions.querySelector(`[data-delete-assessment="${id}"]`))return;
      const btn=document.createElement('button');
      btn.className='smallBtn danger';
      btn.type='button';
      btn.dataset.deleteAssessment=id;
      btn.textContent='Apagar';
      btn.onclick=()=>App.deleteAssessment(id);
      actions.appendChild(btn);
    });
  }
  const oldRenderAll=App.renderAll.bind(App);
  App.renderAll=function(){oldRenderAll(); enhanceAssessmentDeleteButtons();};
  setInterval(enhanceAssessmentDeleteButtons,1200);
  window.VETOR=App; document.addEventListener('DOMContentLoaded',()=>App.init());
})();

document.addEventListener('DOMContentLoaded',()=>{
 const box=document.querySelector('.vetor-user-box');
 const dd=document.getElementById('userDropdown');
 if(box&&dd){
  box.addEventListener('click',(e)=>{
   e.stopPropagation();
   dd.classList.toggle('open');
  });
  dd.addEventListener('click',(e)=>{ e.stopPropagation(); });
  document.addEventListener('click',()=>dd.classList.remove('open'));
 }
 const t=document.getElementById('themeToggle');
 if(t){
  t.addEventListener('click',()=>{
   document.body.classList.toggle('dark-theme');
   localStorage.setItem('vetorTheme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  });
 }
 if(localStorage.getItem('vetorTheme')==='dark') document.body.classList.add('dark-theme');
 function safeText(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]||m));}
 function getStoredUser(){
  const keys=['vetor_auth_v68_7','ete_auth_v63'];
  for(const k of keys){
   try{const v=JSON.parse(localStorage.getItem(k)||sessionStorage.getItem(k)||'null'); if(v) return v;}catch(e){}
  }
  return {nome:'Felipe Camargo', perfil:'Administrador', role:'admin', login:'', anos:['1','2','3'], disciplinas:['Língua Portuguesa','Matemática'], all:true};
 }
 function formatDateTime(iso){
  if(!iso) return 'Primeiro acesso registrado agora';
  try{return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'medium'});}catch(e){return iso;}
 }
 function touchAccess(){
  const key='vetor_user_access_stats';
  let stats={count:0,lastAccess:null,previousAccess:null};
  try{stats=Object.assign(stats,JSON.parse(localStorage.getItem(key)||'{}'));}catch(e){}
  if(!sessionStorage.getItem('vetor_access_counted')){
   stats.count=(Number(stats.count)||0)+1;
   stats.previousAccess=stats.lastAccess||null;
   stats.lastAccess=new Date().toISOString();
   localStorage.setItem(key,JSON.stringify(stats));
   sessionStorage.setItem('vetor_access_counted','1');
  }
  return stats;
 }
 function getAssessmentState(){try{return JSON.parse(localStorage.getItem('vetor_diagnostico_atual')||'{}')}catch(e){return {}}}
  function getAllTurmas(){
   const st=getAssessmentState();
   const clean=t=>window.VETOR?.cleanTurmaName?window.VETOR.cleanTurmaName(t):String(t||'').replace(/\s*(?:[•-])\s*(?:Língua Portuguesa|Português|Portugues|Matemática|Matematica)\s*$/i,'').trim();
   const fromAssessments=[...(st.assessments||[]), st.assessment||{}].map(a=>a && a.turma).filter(Boolean).map(clean);
   let fromCadastro=[];
   try{fromCadastro=Object.keys(JSON.parse(localStorage.getItem('vetor_turmas_v68_6')||'{}')||{}).map(clean);}catch(e){}
   return [...new Set([...fromAssessments,...fromCadastro].filter(Boolean).filter(t=>t!=='__varias_turmas__'))].sort((a,b)=>String(a).localeCompare(String(b),'pt-BR',{numeric:true}));
  }
 function yearOfTurma(t){const m=String(t||'').match(/([123])\s*º?|([123])\s*ANO|^([123])/i); return m?(m[1]||m[2]||m[3]):'';}
 function turmasDoUsuario(u){
  const all=getAllTurmas();
  if(u.all || String(u.role||u.perfil||'').toLowerCase().includes('admin') || String(u.perfil||'').toLowerCase().includes('coord')) return all;
  const anos=Array.isArray(u.anos)?u.anos.map(String):[];
  if(!anos.length) return all;
  return all.filter(t=>anos.includes(yearOfTurma(t)));
 }
 function renderUserProfilePage(){
  const box=document.getElementById('userProfilePage'); if(!box) return;
  const u=getStoredUser(); const stats=touchAccess(); const turmas=turmasDoUsuario(u);
  const nome=u.nome||'Felipe Camargo'; const perfil=u.perfil||u.role||'Administrador';
  const initials=(nome||'FC').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'FC';
  const disciplinas=Array.isArray(u.disciplinas)?u.disciplinas.join(', '):(u.disciplina||'Todas');
  box.innerHTML=`
   <div class="profile-page-grid">
    <div class="panel">
     <div class="profile-card-main">
      <div class="profile-avatar-xl">${safeText(initials)}</div>
      <div class="profile-main-text">
       <h3>${safeText(nome)}</h3>
       <p><b>${safeText(perfil)}</b></p>
       <p>${safeText(u.login || 'Usuário local da plataforma')}</p>
      </div>
     </div>
     <h3 style="margin-top:18px">Turmas pertencentes ao usuário</h3>
     ${turmas.length?`<div class="profile-turmas">${turmas.map(t=>`<span class="profile-turma-chip">${safeText(t)}</span>`).join('')}</div>`:'<div class="profile-empty">Nenhuma turma vinculada encontrada até o momento.</div>'}
    </div>
    <div class="panel">
     <h3>Dados de acesso</h3>
     <div class="profile-info-list">
      <div class="profile-info-item"><span>Quantidade de acessos</span><b>${Number(stats.count)||1}</b></div>
      <div class="profile-info-item"><span>Último acesso</span><b>${safeText(formatDateTime(stats.lastAccess))}</b></div>
      <div class="profile-info-item"><span>Acesso anterior</span><b>${safeText(formatDateTime(stats.previousAccess))}</b></div>
      <div class="profile-info-item"><span>Disciplinas</span><b>${safeText(disciplinas||'Todas')}</b></div>
      <div class="profile-info-item"><span>Perfil</span><b>${safeText(perfil)}</b></div>
     </div>
    </div>
   </div>`;
 }
 function vetorGoView(id){
  if(window.VETOR && typeof window.VETOR.showView==='function') window.VETOR.showView(id);
  else {
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
    window.scrollTo({top:0,behavior:'smooth'});
  }
 }
 function showPasswordPage(){
  vetorGoView('alterarSenhaUsuario');
  const st=document.getElementById('passwordChangeStatus');
  if(st) st.textContent='Aguardando preenchimento.';
 }
 function showHelpPage(){
  vetorGoView('ajudaUsuario');
  const input=document.getElementById('helpSearchInput');
  if(input) setTimeout(()=>input.focus(),120);
 }
 function initPasswordAndHelpPages(){
  const form=document.getElementById('changePasswordForm');
  const cur=document.getElementById('currentPassword');
  const np=document.getElementById('newPassword');
  const cp=document.getElementById('confirmPassword');
  const show=document.getElementById('showPasswordFields');
  const bar=document.getElementById('passwordStrengthBar');
  const txt=document.getElementById('passwordStrengthText');
  const status=document.getElementById('passwordChangeStatus');
  function updateStrength(){
    if(!np||!bar||!txt) return;
    const v=np.value||'';
    let score=0;
    if(v.length>=6) score++;
    if(/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(v)) score++;
    if(/[0-9]/.test(v)) score++;
    if(/[^A-Za-z0-9]/.test(v)) score++;
    const pct=[0,25,50,75,100][score];
    bar.style.width=pct+'%';
    bar.className=score<=1?'weak':score<=3?'medium':'good';
    txt.textContent=!v?'Informe uma nova senha.':score<=1?'Senha fraca. Use letras, números e símbolos.':score<=3?'Senha média. Pode ser melhorada.':'Senha forte.';
  }
  if(np && !np.__vetorStrength){ np.__vetorStrength=true; np.addEventListener('input',updateStrength); }
  if(show && !show.__vetorShowPass){ show.__vetorShowPass=true; show.addEventListener('change',()=>{ const type=show.checked?'text':'password'; [cur,np,cp].forEach(el=>{if(el) el.type=type;}); }); }
  const cancel=document.getElementById('cancelPasswordChange');
  if(cancel && !cancel.__vetorCancel){ cancel.__vetorCancel=true; cancel.addEventListener('click',()=>{ if(form) form.reset(); updateStrength(); if(status) status.textContent='Alteração cancelada.'; }); }
  if(form && !form.__vetorPasswordSubmit){
    form.__vetorPasswordSubmit=true;
    form.addEventListener('submit',function(e){
      e.preventDefault();
      const atual=(cur&&cur.value||'').trim(); const nova=(np&&np.value||'').trim(); const conf=(cp&&cp.value||'').trim();
      if(!atual||!nova||!conf){ if(status) status.textContent='Preencha todos os campos para continuar.'; return; }
      if(nova.length<6){ if(status) status.textContent='A nova senha precisa ter pelo menos 6 caracteres.'; return; }
      if(nova!==conf){ if(status) status.textContent='A confirmação não confere com a nova senha.'; return; }
      localStorage.setItem('vetorPasswordChangedAt', new Date().toISOString());
      if(status) status.textContent='Senha atualizada com sucesso nesta versão local da plataforma.';
      form.reset(); updateStrength();
    });
  }
  const hs=document.getElementById('helpSearchInput');
  if(hs && !hs.__vetorHelpSearch){
    hs.__vetorHelpSearch=true;
    hs.addEventListener('input',function(){
      const q=(hs.value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      document.querySelectorAll('.help-card').forEach(card=>{
        const text=((card.textContent||'')+' '+(card.dataset.helpKey||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        card.classList.toggle('hidden', q && !text.includes(q));
      });
    });
  }
  updateStrength();
 }
 initPasswordAndHelpPages();
 touchAccess();
 document.querySelectorAll('[data-user-action]').forEach(btn=>{
  btn.addEventListener('click',()=>{
   const action=btn.getAttribute('data-user-action');
   if(action==='perfil'){ renderUserProfilePage(); if(window.VETOR && typeof window.VETOR.showView==='function') window.VETOR.showView('perfilUsuario'); else document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='perfilUsuario')); }
   if(action==='senha'){ showPasswordPage(); }
   if(action==='ajuda') showHelpPage();
   if(dd && action!=='tema') dd.classList.remove('open');
  });
 });
 window.renderUserProfilePage=renderUserProfilePage;
});

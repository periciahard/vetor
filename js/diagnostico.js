(function(){
 const A=()=>window.VETOR;
 const levelsOrder=['Elementar I','Elementar II','Básico','Desejável'];
 function isPlaceholderStudentName(nome){
  const n=String(nome||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  return !n || /^ALUNO(?:\s*(?:\d+|X+|SEM\s+NOME))?$/.test(n) || /^NOME\s+DO\s+ALUNO$/.test(n) || /^ESTUDANTE(?:\s*(?:\d+|X+))?$/.test(n);
 }
function levelBadge(level){
 if(level==='Elementar I')return 'bad level-e1';
 if(level==='Elementar II')return 'warn level-e2';
 if(level==='Básico')return 'warn level-basic';
 if(level==='Faltoso'||level==='Avaliação incompleta')return 'no-answer';
 return 'ok level-des';
}
 function descInfo(code, discipline){return window.Descritores?.get?.(discipline||A().state.assessment.discipline,code)||{codigo:code,texto:'Descritor não localizado na matriz selecionada.',topico:'Não identificado',estrategias:'Confirmar se a disciplina selecionada corresponde à matriz usada na prova.'};}
 function sepcDisciplina(disc){
  const d=String(disc||'').toLowerCase();
  return d.includes('mat')?'matematica':'portugues';
 }
 const CORTES_500={
  portugues:{elementar1:225,elementar2:270,basico:305},
  matematica:{elementar1:250,elementar2:290,basico:325}
 };
 function nivelProficiência(score,discipline){
  const c=CORTES_500[sepcDisciplina(discipline)]||CORTES_500.portugues;
  const p=Number(score)||0;
  if(p<=c.elementar1)return {label:'Elementar I',cls:'level-e1',description:'Grave defasagem. O estudante ainda não domina competências fundamentais da avaliação e precisa de recomposição imediata.'};
  if(p<=c.elementar2)return {label:'Elementar II',cls:'level-e2',description:'Desempenho insuficiente. O estudante reconhece estruturas simples, mas apresenta lacunas relevantes nas habilidades avaliadas.'};
  if(p<=c.basico)return {label:'Básico',cls:'level-basic',description:'O estudante alcança o mínimo esperado na escala de proficiência, mas ainda precisa consolidar descritores específicos.'};
  return {label:'Desejável',cls:'level-des',description:'O estudante demonstra desempenho desejável na escala de proficiência e maior autonomia nas habilidades avaliadas.'};
 }
 function dificuldadeItem(ia){
  if(ia>=0.85)return 'Muito Fácil';
  if(ia>=0.70)return 'Fácil';
  if(ia>=0.50)return 'Média';
  if(ia>=0.30)return 'Difícil';
  return 'Muito Difícil';
 }

 const CALC_ENGINES={
  linear:{id:'linear',label:'SEPC Compatível (Linear)',description:'Peso = 1 + 4 × (1 − IA). Mantém a regra original compatível com o motor SEPC pedagógico.'},
  logistico:{id:'logistico',label:'Curva Logística',description:'Peso = 1 + 4 / (1 + e^(6 × (IA − 0,5))). Mantém escala 0–500 e níveis, sem penalizar acertos em itens difíceis.'},
  tri1pl:{id:'tri1pl',label:'TRI 1PL / Rasch',description:'Estima a dificuldade das questões e a proficiência dos alunos pelo modelo Rasch 1PL, mantendo a escala VETOR 0–500.'},
  tri2pl:{id:'tri2pl',label:'TRI 2PL Experimental',description:'Estima dificuldade e discriminação das questões. Recomendado para comparar resultados antes de uso oficial, especialmente com muitas turmas.'},
  comparativo:{id:'comparativo',label:'Comparativo',description:'Executa os cálculos Linear e Logístico lado a lado para comparar média, níveis e mudanças por aluno.'}
 };
 function calcEngine(){
  const v=A().state?.settings?.calcEngine||'logistico';
  return CALC_ENGINES[v]?v:'linear';
 }
 function effectiveEngine(engine){return engine==='comparativo'?'linear':(CALC_ENGINES[engine]?engine:'linear');}
 function setCalcEngine(v){
  if(!CALC_ENGINES[v])v='logistico';
  localStorage.setItem('vetor.calcEngine',v);
  A().state.settings=A().state.settings||{};
  A().state.settings.calcEngine=v;
  A().save?.();
 }
 function isAdminUser(){
  const u=A().currentUser?.()||{};
  const role=String(u.role||u.perfil||'').toLowerCase();
  return !!(u.all||role.includes('admin'));
 }
 function bindAdminCalcEngineConfig(){
  const sel=A().$('#adminCalcEngineSelect');
  const hint=A().$('#adminCalcEngineHint');
  if(!sel)return;
  sel.value=calcEngine();
  if(hint)hint.textContent=CALC_ENGINES[sel.value]?.description||'';
  sel.onchange=()=>{
    setCalcEngine(sel.value);
    if(hint)hint.textContent=CALC_ENGINES[sel.value]?.description||'';
    render();
  };
 }
 function pesoLinear(ia){return 1+4*(1-ia);}
 function pesoLogistico(ia){return 1+4/(1+Math.exp(6*(ia-0.5)));}
 function calcularPesoItem(ia,engine){
  const e=effectiveEngine(engine||calcEngine());
  const peso=e==='logistico'?pesoLogistico(ia):pesoLinear(ia);
  return Math.round(peso*1000000)/1000000;
 }
 function engineLabel(engine){return CALC_ENGINES[engine||calcEngine()]?.label||CALC_ENGINES.linear.label;}
 function normKey(v){return String(v||'').trim().toLowerCase();}
 function questionSignature(a){
  return JSON.stringify({q:(a.questions||[]).map(normKey),k:(a.key||[]).map(x=>A().letter(x)),d:(a.descriptors||[]).map(normKey)});
 }
 function seriesKey(a){
  const turma=normKey(a?.turma||a?.className||'');
  const m=turma.match(/(\d+)\s*(?:º|°|o|ª|a)?/);
  return m?m[1]:turma;
 }
 function assessmentCycleKey(a){
  return normKey(a?.tipo||a?.title||'');
 }
function sameApplication(a,b){
 if(!a||!b)return false;
 if(normKey(a.discipline)!==normKey(b.discipline))return false;
 if(seriesKey(a)!==seriesKey(b))return false;
 if(assessmentCycleKey(a)&&assessmentCycleKey(b)&&assessmentCycleKey(a)!==assessmentCycleKey(b))return false;
 return true;
}
 function sepcApplicationGroup(assessment){
  const all=(A().state.assessments||[]).filter(x=>(x.students||[]).length&&(x.questions||[]).length);
  const group=all.filter(x=>sameApplication(assessment,x));
  if(assessment?.students?.length&&assessment?.questions?.length&&!group.some(x=>x.id===assessment.id))group.unshift(assessment);
  return group.length?group:[assessment];
 }
 function minCompletionRate(){
  const raw=Number(A().state?.settings?.minCompletionRate);
  return raw>0&&raw<=1?raw:0.8;
 }
 function studentParticipation(s,q){
  const answers=s.answers||[];
  const attempted=q.map((_,i)=>!!A().letter(answers[i]));
  const answered=attempted.filter(Boolean).length;
  const rate=q.length?answered/q.length:0;
  if(!answered)return {attempted,answered,rate,valid:false,noAnswers:true,incomplete:false,status:'faltoso',statusLabel:'Faltoso'};
  if(rate<minCompletionRate())return {attempted,answered,rate,valid:false,noAnswers:false,incomplete:true,status:'incompleta',statusLabel:'Avaliação incompleta'};
  return {attempted,answered,rate,valid:true,noAnswers:false,incomplete:false,status:'valida',statusLabel:'Avaliação válida'};
 }
 function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0));}
 function round1(n){return Math.round((Number(n)||0)*10)/10;}
 function round2(n){return Math.round((Number(n)||0)*100)/100;}
 function logit(p){const x=clamp(p,0.01,0.99);return Math.log(x/(1-x));}
 function logistic(x){return 1/(1+Math.exp(-x));}
 function raschScore(theta){
  return round1(clamp(300+(55*theta),0,500));
 }
 function raschRowsFromStudents(students,q,key){
  return (students||[]).map(s=>{
    const part=studentParticipation(s,q);
    if(!part.valid)return null;
    const answers=s.answers||[];
    const responses=q.map((_,i)=>A().letter(answers[i])===A().letter(key[i])?1:0);
    return {student:s,part,responses,total:responses.reduce((a,b)=>a+b,0)};
  }).filter(Boolean);
 }
 function estimateRaschAbility(responses,difficulties){
  const nItems=responses.length;
  const total=responses.reduce((a,b)=>a+b,0);
  let theta=logit((total+0.5)/(nItems+1));
  for(let step=0;step<10;step++){
    let expected=0, info=0;
    for(let i=0;i<nItems;i++){
      const p=logistic(theta-(difficulties[i]||0));
      expected+=p;
      info+=p*(1-p);
    }
    if(info<0.000001)break;
    theta=clamp(theta+((total-expected)/info),-4,4);
  }
  return theta;
 }
 function estimateRasch1PL(rows,nItems){
  const itemCorrect=Array(nItems).fill(0), itemTotal=Array(nItems).fill(rows.length);
  rows.forEach(row=>row.responses.forEach((v,i)=>{itemCorrect[i]+=v?1:0;}));
  const difficulties=itemCorrect.map(c=>-logit((c+0.5)/(rows.length+1)));
  return {itemCorrect,itemTotal,difficulties};
 }
 function mean(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;}
 function sd(arr){
  if(arr.length<2)return 0;
  const m=mean(arr);
  return Math.sqrt(arr.reduce((s,x)=>s+Math.pow(x-m,2),0)/(arr.length-1));
 }
 function correlation(xs,ys){
  if(xs.length!==ys.length||xs.length<3)return 0;
  const mx=mean(xs), my=mean(ys), sx=sd(xs), sy=sd(ys);
  if(!sx||!sy)return 0;
  return xs.reduce((sum,x,i)=>sum+((x-mx)/sx)*((ys[i]-my)/sy),0)/(xs.length-1);
 }
 function estimateTri2PL(rows,nItems){
  const itemCorrect=Array(nItems).fill(0), itemTotal=Array(nItems).fill(rows.length);
  const totals=rows.map(row=>row.total);
  rows.forEach(row=>row.responses.forEach((v,i)=>{itemCorrect[i]+=v?1:0;}));
  const difficulties=itemCorrect.map(c=>-logit((c+0.5)/(rows.length+1)));
  const discriminations=itemCorrect.map((_,i)=>{
    const item=rows.map(row=>row.responses[i]||0);
    const rest=rows.map(row=>row.total-(row.responses[i]||0));
    const r=Math.max(0,correlation(item,rest)||correlation(item,totals)||0);
    return round2(clamp(0.65+(2.2*r),0.45,2.85));
  });
  return {itemCorrect,itemTotal,difficulties,discriminations};
 }
 function estimateTri2PLAbility(responses,difficulties,discriminations){
  const nItems=responses.length;
  const total=responses.reduce((a,b)=>a+b,0);
  let theta=logit((total+0.5)/(nItems+1));
  for(let step=0;step<12;step++){
    let expected=0, observed=0, info=0;
    for(let i=0;i<nItems;i++){
      const a=discriminations[i]||1;
      const p=logistic(a*(theta-(difficulties[i]||0)));
      observed+=a*(responses[i]||0);
      expected+=a*p;
      info+=a*a*p*(1-p);
    }
    if(info<0.000001)break;
    theta=clamp(theta+((observed-expected)/info),-4,4);
  }
  return theta;
 }
 function applyTri1PL(base,assessment,calibrationGroup){
  const q=assessment.questions||[], desc=assessment.descriptors||[], key=assessment.key||[];
  const calibrationStudents=(calibrationGroup||[]).flatMap(a=>(a.students||[]).filter(s=>!isPlaceholderStudentName(s.name||s.nome)));
  const calibrationRows=raschRowsFromStudents(calibrationStudents,q,key);
  if(!q.length||!calibrationRows.length)return {...base,summary:{...base.summary,calcEngine:'tri1pl',calcEngineLabel:engineLabel('tri1pl')}};
  const model=estimateRasch1PL(calibrationRows,q.length);
  const descMap={};
  let absent=0, incomplete=0;
  const students=(base.students||[]).filter(s=>!isPlaceholderStudentName(s.name||s.nome)).map((s,idx)=>{
    const part=studentParticipation(s,q);
    const correct=q.map((_,i)=>A().letter((s.answers||[])[i])===A().letter(key[i])?1:0);
    const total=correct.reduce((a,b)=>a+b,0);
    if(part.noAnswers)absent++;
    if(part.incomplete)incomplete++;
    correct.forEach((c,i)=>{
      if(!part.valid)return;
      const d=desc[i]||'Sem descritor';
      (descMap[d]??={descritor:d,total:0,correct:0,students:[],items:[]});
      descMap[d].total++;
      descMap[d].correct+=c;
      descMap[d].items.push(i);
      if(!c)descMap[d].students.push(s.name);
    });
    if(!part.valid){
      const levelLabel=part.noAnswers?'Faltoso':'Avaliação incompleta';
      return {...s,index:idx,attempted:part.attempted,answered:part.answered,completionRate:part.rate,noAnswers:part.noAnswers,incomplete:part.incomplete,validForStats:false,status:part.status,statusLabel:part.statusLabel,correct,total,percent:A().pct(total,q.length),score:0,proficiency:0,theta:null,level:levelLabel,levelClass:'no-answer',levelDescription:part.statusLabel};
    }
    const theta=estimateRaschAbility(correct,model.difficulties);
    const score=raschScore(theta);
    const levelObj=nivelProficiência(score,assessment.discipline);
    return {...s,index:idx,attempted:part.attempted,answered:part.answered,completionRate:part.rate,noAnswers:false,incomplete:false,validForStats:true,status:part.status,statusLabel:part.statusLabel,correct,total,percent:A().pct(total,q.length),score,proficiency:score,theta:round2(theta),level:levelObj.label,levelClass:levelObj.cls,levelDescription:levelObj.description};
  });
  const validResults=students.filter(s=>s.validForStats);
  const items=q.map((name,i)=>{
    const ia=model.itemTotal[i]?model.itemCorrect[i]/model.itemTotal[i]:0;
    const b=model.difficulties[i]||0;
    return {index:i,question:name||'Q'+(i+1),descriptor:desc[i]||'',key:key[i]||'',correct:model.itemCorrect[i]||0,total:model.itemTotal[i]||0,percent:A().pct(model.itemCorrect[i]||0,model.itemTotal[i]||0),ia,diff:dificuldadeItem(ia),peso:round2(clamp(3+b,0.5,5)),raschDifficulty:round2(b)};
  });
  const descriptorStats=Object.values(descMap).map(d=>({...d,percent:A().pct(d.correct,d.total),students:[...new Set(d.students)],items:[...new Set(d.items)]})).sort((a,b)=>a.percent-b.percent);
  const levels={}; validResults.forEach(s=>levels[s.level]=(levels[s.level]||0)+1);
  const avg=validResults.length?round1(validResults.reduce((sum,s)=>sum+s.score,0)/validResults.length):0;
  const avgPercent=A().pct(validResults.reduce((sum,s)=>sum+s.total,0),validResults.length*q.length);
  return {students,items,descriptorStats,summary:{...base.summary,validStudents:validResults.length,present:validResults.length,absent,incomplete,participation:A().pct(validResults.length,students.length),completionThreshold:Math.round(minCompletionRate()*100),avg,avgPercent,scoreScale:'0-500',sepcGroupSize:calibrationRows.length,noAnswers:absent,priority:validResults.filter(s=>s.level==='Elementar I'||s.level==='Elementar II').length,levels,notaMaxima:q.length,calcEngine:'tri1pl',calcEngineLabel:engineLabel('tri1pl')}};
 }
 function applyTri2PL(base,assessment,calibrationGroup){
  const q=assessment.questions||[], desc=assessment.descriptors||[], key=assessment.key||[];
  const calibrationStudents=(calibrationGroup||[]).flatMap(a=>(a.students||[]).filter(s=>!isPlaceholderStudentName(s.name||s.nome)));
  const calibrationRows=raschRowsFromStudents(calibrationStudents,q,key);
  if(!q.length||!calibrationRows.length)return {...base,summary:{...base.summary,calcEngine:'tri2pl',calcEngineLabel:engineLabel('tri2pl')}};
  const model=estimateTri2PL(calibrationRows,q.length);
  const descMap={};
  let absent=0, incomplete=0;
  const students=(base.students||[]).filter(s=>!isPlaceholderStudentName(s.name||s.nome)).map((s,idx)=>{
    const part=studentParticipation(s,q);
    const correct=q.map((_,i)=>A().letter((s.answers||[])[i])===A().letter(key[i])?1:0);
    const total=correct.reduce((a,b)=>a+b,0);
    if(part.noAnswers)absent++;
    if(part.incomplete)incomplete++;
    correct.forEach((c,i)=>{
      if(!part.valid)return;
      const d=desc[i]||'Sem descritor';
      (descMap[d]??={descritor:d,total:0,correct:0,students:[],items:[]});
      descMap[d].total++;
      descMap[d].correct+=c;
      descMap[d].items.push(i);
      if(!c)descMap[d].students.push(s.name);
    });
    if(!part.valid){
      const levelLabel=part.noAnswers?'Faltoso':'Avaliação incompleta';
      return {...s,index:idx,attempted:part.attempted,answered:part.answered,completionRate:part.rate,noAnswers:part.noAnswers,incomplete:part.incomplete,validForStats:false,status:part.status,statusLabel:part.statusLabel,correct,total,percent:A().pct(total,q.length),score:0,proficiency:0,theta:null,level:levelLabel,levelClass:'no-answer',levelDescription:part.statusLabel};
    }
    const theta=estimateTri2PLAbility(correct,model.difficulties,model.discriminations);
    const score=raschScore(theta);
    const levelObj=nivelProficiência(score,assessment.discipline);
    return {...s,index:idx,attempted:part.attempted,answered:part.answered,completionRate:part.rate,noAnswers:false,incomplete:false,validForStats:true,status:part.status,statusLabel:part.statusLabel,correct,total,percent:A().pct(total,q.length),score,proficiency:score,theta:round2(theta),level:levelObj.label,levelClass:levelObj.cls,levelDescription:levelObj.description};
  });
  const validResults=students.filter(s=>s.validForStats);
  const items=q.map((name,i)=>{
    const ia=model.itemTotal[i]?model.itemCorrect[i]/model.itemTotal[i]:0;
    const b=model.difficulties[i]||0;
    const a=model.discriminations[i]||1;
    return {index:i,question:name||'Q'+(i+1),descriptor:desc[i]||'',key:key[i]||'',correct:model.itemCorrect[i]||0,total:model.itemTotal[i]||0,percent:A().pct(model.itemCorrect[i]||0,model.itemTotal[i]||0),ia,diff:dificuldadeItem(ia),peso:round2(clamp((3+b)*a,0.5,6)),raschDifficulty:round2(b),discrimination:round2(a)};
  });
  const descriptorStats=Object.values(descMap).map(d=>({...d,percent:A().pct(d.correct,d.total),students:[...new Set(d.students)],items:[...new Set(d.items)]})).sort((a,b)=>a.percent-b.percent);
  const levels={}; validResults.forEach(s=>levels[s.level]=(levels[s.level]||0)+1);
  const avg=validResults.length?round1(validResults.reduce((sum,s)=>sum+s.score,0)/validResults.length):0;
  const avgPercent=A().pct(validResults.reduce((sum,s)=>sum+s.total,0),validResults.length*q.length);
  return {students,items,descriptorStats,summary:{...base.summary,validStudents:validResults.length,present:validResults.length,absent,incomplete,participation:A().pct(validResults.length,students.length),completionThreshold:Math.round(minCompletionRate()*100),avg,avgPercent,scoreScale:'0-500',sepcGroupSize:calibrationRows.length,noAnswers:absent,priority:validResults.filter(s=>s.level==='Elementar I'||s.level==='Elementar II').length,levels,notaMaxima:q.length,calcEngine:'tri2pl',calcEngineLabel:engineLabel('tri2pl')}};
 }
 const computeCache=new Map();
 function studentSignature(s){
  return `${s?.name||''}:${(s?.answers||[]).map(x=>A().letter(x)).join('')}`;
 }
 function assessmentSignature(a){
  if(!a)return '';
  return [
   a.id||'',a.updatedAt||'',a.createdAt||'',a.turma||'',a.discipline||'',a.tipo||'',a.date||'',
   (a.questions||[]).join('|'),(a.descriptors||[]).join('|'),(a.key||[]).map(x=>A().letter(x)).join(''),
   (a.students||[]).length,(a.students||[]).map(studentSignature).join('~')
  ].join('§');
 }
 function cacheSet(key,value){
  computeCache.set(key,value);
  while(computeCache.size>80)computeCache.delete(computeCache.keys().next().value);
  return value;
 }
 function clearCache(){computeCache.clear();}
 function compute(assessment, engine){
  assessment=assessment||{};
  const q=assessment.questions||[], desc=assessment.descriptors||[], key=assessment.key||[], students=(assessment.students||[]).filter(s=>!isPlaceholderStudentName(s.name||s.nome));
  const itemCorrect=Array(q.length).fill(0), itemTotal=Array(q.length).fill(0), descMap={};
  const calibrationGroup=sepcApplicationGroup(assessment);
  const mode=effectiveEngine(engine||calcEngine());
  const cacheKey=[mode,assessmentSignature(assessment),calibrationGroup.map(assessmentSignature).join('¶')].join('||');
  const cached=computeCache.get(cacheKey);
  if(cached)return cached;
  const calibrationStudents=calibrationGroup.flatMap(a=>(a.students||[]).filter(s=>!isPlaceholderStudentName(s.name||s.nome)));

  // MOTOR SEPC CONSOLIDADO:
  // - junta todas as turmas da mesma aplicação antes de calcular IA/pesos;
  // - depois calcula e exibe os resultados da turma ativa;
  // - não exclui aluno por percentual mínimo respondido;
  // - no IA da questão, só conta no denominador quem marcou alguma alternativa;
  // - resposta em branco do aluno conta como erro na nota individual;
  // - peso depende do motor escolhido: linear SEPC compatível ou curva logística;
  // - acertos em itens difíceis continuam valendo o peso integral;
  // - a antiga penalização por "incoerência" foi removida para não derrubar alunos que acertam itens difíceis.
  calibrationStudents.forEach(s=>{
    const answers=s.answers||[];
    q.forEach((_,i)=>{
      const resp=A().letter(answers[i]);
      if(resp!==''){
        itemTotal[i]++;
        if(resp===A().letter(key[i])) itemCorrect[i]++;
      }
    });
  });

  const itemMeta=q.map((_,i)=>{
    const ia=itemTotal[i]?itemCorrect[i]/itemTotal[i]:0;
    const dificuldade=dificuldadeItem(ia);
    const peso=calcularPesoItem(ia,engine);
    return {ia,dificuldade,peso};
  });
  const notaMaxima=itemMeta.reduce((sum,it)=>sum+it.peso,0);

  const results=students.map((s,idx)=>{
    const answers=s.answers||[];
    const attempted=q.map((_,i)=>!!A().letter(answers[i]));
    const answered=attempted.filter(Boolean).length;
    const noAnswers=answered===0;
    const correct=q.map((_,i)=>A().letter(answers[i])===A().letter(key[i])?1:0);
    const total=correct.reduce((a,b)=>a+b,0);
    const percent=A().pct(total,q.length);
    let faceis=0, medias=0, dificeis=0, muitoDificeis=0, notaBruta=0, incoerente=false;

    correct.forEach((c,i)=>{
      if(c){
        const dif=itemMeta[i].dificuldade;
        if(dif==='Muito Fácil'||dif==='Fácil')faceis++;
        else if(dif==='Média')medias++;
        else if(dif==='Difícil')dificeis++;
        else muitoDificeis++;
        notaBruta+=itemMeta[i].peso;
      }
    });

    incoerente=false;

    const proficiency=notaMaxima?(notaBruta/notaMaxima)*500:0;
    const score=Math.round(proficiency*10)/10;
    const levelObj=nivelProficiência(score,assessment.discipline);

    correct.forEach((c,i)=>{
      const d=desc[i]||'Sem descritor';
      (descMap[d]??={descritor:d,total:0,correct:0,students:[],items:[]});
      descMap[d].total++;
      descMap[d].correct+=c;
      descMap[d].items.push(i);
      if(!c)descMap[d].students.push(s.name);
    });

    return {...s,index:idx,attempted,answered,completionRate:q.length?answered/q.length:0,noAnswers,incomplete:false,validForStats:true,status:noAnswers?'sem_resposta':'valida',statusLabel:noAnswers?'Sem resposta':'Avaliação válida',correct,total,percent,score,proficiency:score,notaBruta:Math.round(notaBruta*100)/100,incoerente,faceis,medias,dificeis,muitoDificeis,level:levelObj.label,levelClass:levelObj.cls,levelDescription:levelObj.description};
  });

  const validResults=results; // SEPC contabiliza todos os alunos importados com nome.
  const items=q.map((name,i)=>({index:i,question:name||'Q'+(i+1),descriptor:desc[i]||'',key:key[i]||'',correct:itemCorrect[i],total:itemTotal[i],percent:A().pct(itemCorrect[i],itemTotal[i]),ia:itemMeta[i].ia,diff:itemMeta[i].dificuldade,peso:Math.round(itemMeta[i].peso*100)/100}));
  const descriptorStats=Object.values(descMap).map(d=>({...d,percent:A().pct(d.correct,d.total),students:[...new Set(d.students)],items:[...new Set(d.items)]})).sort((a,b)=>a.percent-b.percent);
  const counts={}; validResults.forEach(s=>counts[s.level]=(counts[s.level]||0)+1);
  const avgScore=validResults.length?Math.round((validResults.reduce((a,s)=>a+s.score,0)/validResults.length)*10)/10:0;
  const avgPercent=A().pct(validResults.reduce((a,s)=>a+s.total,0),validResults.length*q.length);
  const present=results.length, absent=0, incomplete=0;
  const output={students:results,items,descriptorStats,summary:{nStudents:students.length,nQuestions:q.length,validStudents:validResults.length,present,absent,incomplete,participation:A().pct(present,students.length),completionThreshold:0,avg:avgScore,avgPercent,scoreScale:'0-500',sepcGroupSize:calibrationStudents.length,noAnswers:results.filter(s=>s.noAnswers).length,priority:validResults.filter(s=>s.level==='Elementar I'||s.level==='Elementar II').length,levels:counts,notaMaxima:Math.round(notaMaxima*100)/100,calcEngine:effectiveEngine(engine||calcEngine()),calcEngineLabel:engineLabel(engine||calcEngine())}};
  let finalOutput=output;
  if(mode==='tri1pl')finalOutput=applyTri1PL(output,assessment,calibrationGroup);
  if(mode==='tri2pl')finalOutput=applyTri2PL(output,assessment,calibrationGroup);
  return cacheSet(cacheKey,finalOutput);
 }

 function assessmentName(a){
  const tipo=String(a?.tipo||'').toLowerCase();
  const normalized=/^simulado\d+$/.test(tipo)?'simulado':(tipo==='bimestral'?'avaliacao':tipo);
  const tipoMap={diagnostica:'Diagnóstica',simulado:'Simulado',recuperacao:'Recuperação',avaliacao:'Avaliação',personalizada:'Personalizada',bimestral:'Avaliação',...Object.fromEntries(Array.from({length:10},(_,i)=>['simulado'+(i+1),'Simulado '+(i+1)]))};
  const label=normalized==='personalizada'&&(a.customType||'').trim()?(a.customType||'').trim():(tipoMap[a.tipo]||tipoMap[normalized]||a.tipo||'Tipo?');
  return `${a.turma||'Turma?'} • ${a.discipline||'Disciplina?'} • ${label}`;
 }
 function validSavedAssessments(){
  const list=(A().state.assessments||[]).filter(x=>(x.students||[]).length && (x.questions||[]).length);
  const cur=A().state.assessment;
  if(cur && cur.id && (cur.students||[]).length && (cur.questions||[]).length && !list.some(x=>x.id===cur.id)) list.unshift(cur);
  return list;
 }
 function assessmentSerie(a){
  const t=String(a?.turma||assessmentName(a)||'');
  const m=t.match(/([123])\s*[ºªo]|\b([123])\s*ano\b|\b([123])\s*[AB]\b/i);
  return (m?.[1]||m?.[2]||m?.[3]||'outros');
 }
 function assessmentDisc(a){
  return /mat/i.test(String(a?.discipline||''))?'Matemática':'Língua Portuguesa';
 }
 function sortAssessmentList(list){
  return [...list].sort((a,b)=>assessmentDisc(a).localeCompare(assessmentDisc(b),'pt-BR')||(a.turma||'').localeCompare(b.turma||'','pt-BR',{numeric:true})||(a.title||'').localeCompare(b.title||'','pt-BR',{numeric:true})||String(a.date||'').localeCompare(String(b.date||'')));
 }
 function activateAssessmentInPlace(id){
  const found=validSavedAssessments().find(x=>x.id===id);
  if(!found)return;
  A().state.assessment=JSON.parse(JSON.stringify(found));
  A().state.activeAssessmentId=found.id;
  A().state.settings.discipline=found.discipline||A().state.settings.discipline;
  A().clearImportDraft?.();
  A().fillMetaInputs?.();
  A().save?.();
  clearCache();
  renderStudents();
  const detail=A().$('#studentDetail');
  if(detail)detail.className='panel empty',detail.innerHTML='Selecione um aluno.';
 }
 let compareSelectedIds=[];
 function renderAssessmentChooser(){
  const select=A().$('#diagnosticAssessmentSelect'), optionsBox=A().$('#diagnosticCompareOptions');
  if(!select||!optionsBox)return;
  const list=validSavedAssessments();
  const active=A().state.activeAssessmentId||A().state.assessment.id||'';
  const opts=list.map(x=>`<option value="${A().safe(x.id)}">${A().safe(assessmentName(x))} • ${(x.students||[]).length} alunos</option>`).join('');
  select.innerHTML=opts||'<option value="">Nenhuma avaliação salva com dados</option>';
  select.value=list.some(x=>x.id===active)?active:(list[0]?.id||'');
  select.onchange=()=>{ if(select.value && select.value!==A().state.activeAssessmentId){ A().openAssessment(select.value); } };
  renderCompareOptions(list,select.value);
  renderCalcEngineSelector();
  renderComparison();
 }
 function renderCalcEngineSelector(){
  // A escolha do motor fica restrita ao administrador em Configurações.
  // Na tela do professor, a aba Resultados mostra apenas os resultados pedagógicos.
  const wrap=A().$('#calcEngineWrap');
  if(wrap)wrap.remove();
  bindAdminCalcEngineConfig();
 }
 function renderCompareOptions(list,currentId){
  const optionsBox=A().$('#diagnosticCompareOptions'); if(!optionsBox)return;
  const choices=list.filter(x=>x.id!==currentId);
  compareSelectedIds=compareSelectedIds.filter(id=>choices.some(x=>x.id===id));
  if(!choices.length){ optionsBox.innerHTML='<span class="hint">Nenhuma outra turma/avaliação salva para comparar.</span>'; return; }
  const series=[['1','1º ano'],['2','2º ano'],['3','3º ano']];
  const renderItem=x=>{const checked=compareSelectedIds.includes(x.id);return `<label class="compare-assessment-chip ${checked?'selected':''}"><input type="checkbox" value="${A().safe(x.id)}" ${checked?'checked':''}/><span>${A().safe(assessmentName(x))}</span><small>${(x.students||[]).length} alunos</small></label>`;};
  const cols=series.map(([key,label])=>{
    const inSerie=sortAssessmentList(choices.filter(x=>assessmentSerie(x)===key));
    const rows=['Língua Portuguesa','Matemática'].map(disc=>{
      const items=inSerie.filter(x=>assessmentDisc(x)===disc);
      return `<div class="compare-disc-row"><div class="compare-disc-title">${A().safe(disc)}</div><div class="compare-disc-items">${items.length?items.map(renderItem).join(''):'<span class="compare-empty">Sem avaliações</span>'}</div></div>`;
    }).join('');
    return `<section class="compare-serie-col"><h4>${label}</h4>${rows}</section>`;
  }).join('');
  const other=choices.filter(x=>assessmentSerie(x)==='outros');
  optionsBox.innerHTML=`<div class="compare-series-grid">${cols}</div>${other.length?`<div class="compare-other-row"><h4>Outras avaliações</h4>${other.map(renderItem).join('')}</div>`:''}`;
  optionsBox.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.onchange=()=>{
      if(cb.checked){
        if(!compareSelectedIds.includes(cb.value)) compareSelectedIds.push(cb.value);
      }else{
        compareSelectedIds=compareSelectedIds.filter(id=>id!==cb.value);
      }
      renderCompareOptions(list,currentId);
      renderComparison();
      renderSummary();
    };
  });
 }
 function comparisonAdvice(group){
  const sorted=[...group].sort((x,y)=>y.r.summary.avg-x.r.summary.avg);
  const best=sorted[0], worst=sorted[sorted.length-1];
  const diff=(best.r.summary.avg||0)-(worst.r.summary.avg||0);
  const descCount={};
  group.forEach(({r})=>{ r.descriptorStats.slice(0,3).forEach(d=>{ descCount[d.descritor]=(descCount[d.descritor]||0)+1; }); });
  const threshold=Math.max(2,Math.ceil(group.length/2));
  const common=Object.entries(descCount).filter(([,c])=>c>=threshold).map(([d])=>d);
  const critical=common.length?common.join(', '):(worst.r.descriptorStats.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', ')||'não identificados');
  if(group.length<=2){
    if(Math.abs(diff)<5) return `As turmas apresentam desempenho próximo. A coordenação deve observar descritores críticos comuns e propor uma intervenção integrada por disciplina. Descritores de atenção: ${critical}.`;
    return `${assessmentName(worst.a)} está ${Math.abs(diff).toFixed(1).replace('.',',')} pontos percentuais abaixo de ${assessmentName(best.a)}. Recomenda-se revisar planejamento, comparar estratégias de correção, observar frequência/participação e propor reforço focado nos descritores críticos: ${critical}.`;
  }
  if(diff<5) return `As ${group.length} turmas/avaliações comparadas apresentam desempenho próximo (variação de ${diff.toFixed(1).replace('.',',')} p.p. entre a maior e a menor média). A coordenação deve observar descritores críticos recorrentes e propor uma intervenção integrada por disciplina. Descritores de atenção recorrentes: ${critical}.`;
  return `Entre as ${group.length} turmas/avaliações comparadas, ${assessmentName(worst.a)} está ${diff.toFixed(1).replace('.',',')} pontos percentuais abaixo de ${assessmentName(best.a)}, a maior média do grupo. Recomenda-se revisar o planejamento da(s) turma(s) com menor média, comparar estratégias de correção entre os grupos e propor reforço focado nos descritores críticos recorrentes: ${critical}.`;
 }
 function descriptorComparisonRows(group){
  const maps=group.map(({r})=>Object.fromEntries((r.descriptorStats||[]).map(d=>[d.descritor,d.percent])));
  const all=[...new Set(maps.flatMap(m=>Object.keys(m)))];
  return all.map(d=>{
    const vals=maps.map(m=>m[d]??null);
    const present=vals.filter(v=>v!=null);
    const min=present.length?Math.min(...present):101;
    const max=present.length?Math.max(...present):0;
    return {d,vals,min,amplitude:present.length?max-min:0};
  }).filter(x=>x.vals.some(v=>v!=null)).sort((a,b)=>a.min-b.min||b.amplitude-a.amplitude);
 }
function renderComparison(){
  const box=A().$('#diagnosticComparison'); if(!box)return;
  const list=validSavedAssessments(); const activeId=A().$('#diagnosticAssessmentSelect')?.value||A().state.activeAssessmentId||A().state.assessment.id;
  const current=list.find(x=>x.id===activeId)||A().state.assessment;
  const others=compareSelectedIds.map(id=>list.find(x=>x.id===id)).filter(Boolean);
  const ranking=list.map(a=>({a,r:compute(a, calcEngine())})).sort((x,y)=>y.r.summary.avg-x.r.summary.avg);
  let html='';
  if(others.length){
    const group=[current,...others].map(a=>({a,r:compute(a, calcEngine())}));
    const drows=descriptorComparisonRows(group).slice(0,8);
    const head=group.map(({a})=>`<th>${A().safe(assessmentName(a))}</th>`).join('');
    const rowMedia=group.map(({r})=>`<td><b>${r.summary.avg}</b></td>`).join('');
    const rowAlunos=group.map(({r})=>`<td>${r.summary.validStudents}/${r.summary.nStudents}</td>`).join('');
    const rowElem=group.map(({r})=>{const e=(r.summary.levels['Elementar I']||0)+(r.summary.levels['Elementar II']||0);return `<td>${e} aluno(s)</td>`;}).join('');
    const rowCrit=group.map(({r})=>`<td>${r.descriptorStats.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', ')||'-'}</td>`).join('');
    const descHead=group.map(({a})=>`<th>${A().safe(a.turma||assessmentName(a))}</th>`).join('');
    const descBody=drows.map(x=>`<tr><td><b>${A().safe(x.d)}</b></td>${x.vals.map(v=>`<td>${v==null?'-':v+'%'}</td>`).join('')}<td>${Math.round(x.amplitude*10)/10} p.p.</td></tr>`).join('');
    html+=`<div class="panel mini-panel"><h4>Comparação direta entre turmas/avaliações (${group.length} turmas)</h4><div class="comparison-table"><table><thead><tr><th>Indicador</th>${head}</tr></thead><tbody><tr><td>Média válida</td>${rowMedia}</tr><tr><td>Avaliados/total</td>${rowAlunos}</tr><tr><td>Elementar I/II</td>${rowElem}</tr><tr><td>Descritores críticos</td>${rowCrit}</tr></tbody></table></div><h4>Diferença por descritor</h4><div class="comparison-table"><table><thead><tr><th>Descritor</th>${descHead}<th>Amplitude</th></tr></thead><tbody>${descBody}</tbody></table></div><p class="hint"><b>Leitura da coordenação:</b> ${A().safe(comparisonAdvice(group))}</p></div>`;
  }
  html+=`<details class="panel mini-panel"><summary><b>Ranking de turmas/avaliações salvas</b></summary><div class="comparison-table"><table><thead><tr><th>Turma/Avaliação</th><th>Disciplina</th><th>Avaliados/total</th><th>Média válida</th><th>Elementar I/II</th></tr></thead><tbody>${ranking.map(({a,r})=>{const elem=(r.summary.levels['Elementar I']||0)+(r.summary.levels['Elementar II']||0);return `<tr><td>${A().safe(assessmentName(a))}</td><td>${A().safe(a.discipline||'')}</td><td>${r.summary.validStudents}/${r.summary.nStudents}</td><td><b>${r.summary.avg}</b></td><td>${elem}</td></tr>`;}).join('')||'<tr><td colspan="5">Nenhuma avaliação salva com dados.</td></tr>'}</tbody></table></div></details>`;
  box.innerHTML=html;
 }

function renderAdvancedResultBlocks(){
 const advanced=window.PedagogicoAvancado;
 if(advanced?.renderAll){
  advanced.renderAll();
 }else{
  const empty=(id,msg)=>{
   const box=A().$('#'+id);
   if(box&&!box.innerHTML.trim())box.innerHTML=`<p class="hint">${A().safe(msg)}</p>`;
  };
  empty('turmaProfile','Carregue uma avaliação para visualizar o perfil pedagógico da turma.');
  empty('descriptorRadar','Carregue uma avaliação para visualizar o radar de descritores.');
  empty('studentEvolutionPanel','Carregue uma avaliação para visualizar a evolução histórica.');
 }
}
function renderResultModuleContent(id){
 if(id==='resultado-comparacao')renderComparison();
 if(id==='resultado-prioridades')renderClassReport();
 if(id==='resultado-perfil')renderAdvancedResultBlocks();
 if(id==='resultado-radar')renderAdvancedResultBlocks();
 if(id==='resultado-graficos')renderCharts();
 if(id==='resultado-evolucao')renderAdvancedResultBlocks();
 if(id==='resultado-sugestoes'){renderInsights();renderTomorrow();}
 if(id==='resultado-mapa')renderHeatmap();
}
function bindResultModules(){
 const grid=A().$('#resultsModuleGrid'); if(!grid)return;
 const cards=[...grid.querySelectorAll('[data-result-target]')];
 const sections=[...document.querySelectorAll('.result-section-card')];
 const show=(id,scroll=true)=>{
  renderResultModuleContent(id);
  sections.forEach(sec=>sec.classList.toggle('active',sec.id===id));
  cards.forEach(card=>card.classList.toggle('active',card.dataset.resultTarget===id));
  if(scroll)document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
 };
 const back=()=>{
  sections.forEach(sec=>sec.classList.remove('active'));
  cards.forEach(card=>card.classList.remove('active'));
  grid.scrollIntoView({behavior:'smooth',block:'start'});
 };
 cards.forEach(card=>card.onclick=()=>show(card.dataset.resultTarget));
 document.querySelectorAll('[data-results-top]').forEach(btn=>btn.onclick=back);
 if(!sections.some(sec=>sec.classList.contains('active')))sections.forEach(sec=>sec.classList.remove('active'));
}
function render(){renderAssessmentChooser();renderSummary();renderComparison();renderClassReport();renderCharts();renderInsights();renderHeatmap();renderStudents();renderTomorrow();renderAdvancedResultBlocks();bindResultModules();A().renderSelects();if(!window.__vetorRenderAllRunning)A().renderWizard?.();}
function iconSvg(name){
 const icons={
  users:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  cap:'<svg viewBox="0 0 24 24"><path d="m22 10-10-5-10 5 10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  alert:'<svg viewBox="0 0 24 24"><path d="m21.7 18.8-8.9-15.4a1 1 0 0 0-1.7 0L2.3 18.8a1 1 0 0 0 .9 1.5h17.6a1 1 0 0 0 .9-1.5Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  chart:'<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/><path d="M18 9h1v1"/></svg>',
  target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  file:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>',
  clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>'
 };
 return icons[name]||icons.chart;
}
function tctLevel(percent){
 if(percent<50)return {label:'Abaixo do esperado',cls:'level-e1'};
 if(percent<60)return {label:'Atenção',cls:'level-e2'};
 if(percent<70)return {label:'Básico',cls:'level-basic'};
 return {label:'Adequado',cls:'level-des'};
}
function tctSummary(r){
 const students=(r.students||[]).filter(s=>s.validForStats!==false);
 const nQuestions=r.summary?.nQuestions||0;
 const totalPossible=students.length*nQuestions;
 const totalCorrect=students.reduce((sum,s)=>sum+(Number(s.total)||0),0);
 const avgCorrect=students.length?Math.round((totalCorrect/students.length)*10)/10:0;
 const percent=totalPossible?A().pct(totalCorrect,totalPossible):0;
 const level=tctLevel(percent);
 return {students,totalCorrect,totalPossible,avgCorrect,percent,level,nQuestions};
}
function renderSummary(){
 const r=compute(A().state.assessment, calcEngine());const box=A().$('#summaryCards'); if(!box)return;
 if(!r.summary.nStudents){box.innerHTML='<div class="results-empty-panel">Selecione ou importe uma avaliação para visualizar o painel.</div>';return;}
 const tct=tctSummary(r);
 const list=validSavedAssessments();
 const activeId=A().$('#diagnosticAssessmentSelect')?.value||A().state.activeAssessmentId||A().state.assessment.id;
 const current=list.find(x=>x.id===activeId)||A().state.assessment;
 const selected=compareSelectedIds.map(id=>list.find(x=>x.id===id)).filter(Boolean);
 const group=[current,...selected].filter(Boolean);
 const rows=(group.length?group:[current]).map(a=>({a,r:compute(a, calcEngine())}));
 const serieAvg=rows.length?Math.round(rows.reduce((s,x)=>s+(x.r.summary.avg||0),0)/rows.length):r.summary.avg;
 const level=nivelProficiência(r.summary.avg,A().state.assessment.discipline);
 const activeLevelClass=level.cls||'level-des';
 const levelsTotal=Object.fromEntries(levelsOrder.map(l=>[l,rows.reduce((s,x)=>s+(x.r.summary.levels?.[l]||0),0)]));
 const totalLevels=levelsOrder.reduce((s,l)=>s+(levelsTotal[l]||0),0);
 const levelPct=l=>A().pct(levelsTotal[l]||0,totalLevels||1);
 const colors={'Elementar I':'#ef4444','Elementar II':'#f59e0b','Básico':'#f7c948','Desejável':'#22a65a'};
 let acc=0;
 const pieStops=levelsOrder.map(l=>{const start=acc;acc+=totalLevels?((levelsTotal[l]||0)/totalLevels)*100:0;return `${colors[l]} ${start}% ${acc}%`;}).join(',');
 const maxAvg=Math.max(500,...rows.map(x=>x.r.summary.avg||0));
 const turmaRows=rows.slice().sort((a,b)=>(b.r.summary.avg||0)-(a.r.summary.avg||0));
 const tableRows=turmaRows.map(({a,r})=>{
   const nl=nivelProficiência(r.summary.avg,a.discipline);
   return `<tr><td><i class="status-dot ${nl.cls}"></i>${A().safe(a.turma||assessmentName(a))}</td><td><b>${r.summary.avg}</b></td><td><span class="level-chip ${nl.cls}">${A().safe(nl.label)}</span></td><td>${r.summary.validStudents||0}</td></tr>`;
 }).join('');
 const bars=turmaRows.map(({a,r})=>{
   const nl=nivelProficiência(r.summary.avg,a.discipline);
   const width=Math.max(4,Math.round(((r.summary.avg||0)/maxAvg)*100));
   return `<div class="prof-bar-row"><span>${A().safe(a.turma||assessmentName(a))}</span><div><i class="${nl.cls}" style="width:${width}%"></i></div><b>${r.summary.avg}</b></div>`;
 }).join('');
 const levelCards=levelsOrder.slice().reverse().map(l=>`<button class="level-total-card" type="button" data-level-list="${A().safe(l)}"><span class="level-icon" style="color:${colors[l]}">${iconSvg(l==='Desejável'?'chart':l==='Básico'?'target':l==='Elementar II'?'clock':'alert')}</span><b>${A().safe(l)}</b><strong>${levelsTotal[l]||0}</strong><em>${levelPct(l)}%</em><i><span style="width:${levelPct(l)}%;background:${colors[l]}"></span></i><small>Clique para ver alunos</small></button>`).join('');
 box.innerHTML=`<div class="professor-results-dashboard">
 <section class="prof-main-grid">
 <div class="prof-score-card ${activeLevelClass}">
   <span>Proficiência da turma</span>
   <strong>${r.summary.avg}</strong><em>pontos</em>
   <b>Nível: ${A().safe(level.label)}</b>
   <div class="scale-line"><i></i><i></i><i></i><i></i><mark style="left:${Math.min(98,Math.max(2,(r.summary.avg||0)/5))}%"></mark></div>
   <div class="scale-labels"><span>0</span><span>125</span><span>250</span><span>375</span><span>500</span></div>
  </div>
  <div class="tct-score-card">
   <span>Resultado TCT</span>
   <strong>${tct.percent}%</strong><em>média de acertos</em>
   <b>${A().safe(tct.level.label)}</b>
   <div class="tct-mini-grid">
    <div><small>Média</small><strong>${tct.avgCorrect}</strong><span>de ${tct.nQuestions} questões</span></div>
    <div><small>Total</small><strong>${tct.totalCorrect}</strong><span>acertos válidos</span></div>
   </div>
   <p>Leitura clássica: considera o percentual de acertos da prova, sem modelar dificuldade dos itens.</p>
  </div>
  <div class="prof-metric-grid">
   <div class="metric-tile green"><span class="metric-icon">${iconSvg('users')}</span><span>Participação</span><b>${r.summary.participation}%</b><small>${r.summary.validStudents} de ${r.summary.nStudents} alunos</small></div>
   <div class="metric-tile blue"><span class="metric-icon">${iconSvg('cap')}</span><span>Avaliados</span><b>${r.summary.validStudents}</b><small>alunos</small></div>
   <div class="metric-tile orange"><span class="metric-icon">${iconSvg('spark')}</span><span>Elementar I/II</span><b>${r.summary.priority}</b><small>alunos (${A().pct(r.summary.priority,r.summary.validStudents||1)}%)</small></div>
   <div class="metric-tile purple"><span class="metric-icon">${iconSvg('target')}</span><span>Média das turmas</span><b>${serieAvg}</b><small>pontos</small></div>
   <div class="metric-tile green"><span class="metric-icon">${iconSvg('users')}</span><span>Matriculados</span><b>${r.summary.nStudents}</b><small>alunos</small></div>
   <div class="metric-tile red"><span class="metric-icon">${iconSvg('alert')}</span><span>Faltosos</span><b>${r.summary.absent}</b><small>alunos</small></div>
   <div class="metric-tile yellow"><span class="metric-icon">${iconSvg('clock')}</span><span>Incompletas</span><b>${r.summary.incomplete}</b><small>alunos</small></div>
   <div class="metric-tile red"><span class="metric-icon">${iconSvg('alert')}</span><span>Descritores críticos</span><b>${r.descriptorStats.filter(d=>d.percent<40).length}</b><small>descritores</small></div>
  </div>
 </section>
 <section class="prof-panel prof-comparison-panel"><h3>Proficiência das turmas</h3><div class="prof-comparison-grid"><div class="comparison-table"><table><thead><tr><th>Turma</th><th>Proficiência média</th><th>Nível</th><th>Alunos</th></tr></thead><tbody>${tableRows}</tbody><tfoot><tr><td>Média das turmas (${rows.length} turma${rows.length===1?'':'s'})</td><td colspan="3"><b>${serieAvg}</b> pontos</td></tr></tfoot></table></div><div class="prof-bars"><p>Gráfico comparativo (0 - 500 pontos)</p><div class="prof-axis"><span>0</span><span>125</span><span>250</span><span>375</span><span>500</span></div>${bars}<div class="prof-legend"><span>Elementar I</span><span>Elementar II</span><span>Básico</span><span>Desejável</span></div></div></div></section>
 <section class="prof-panel prof-levels-panel"><h3>Distribuição total dos alunos por níveis (${rows.length} turma${rows.length===1?'':'s'})</h3><div class="levels-total-grid"><div class="donut" style="background:conic-gradient(${pieStops})"><span>${totalLevels}<small>alunos<br>no total</small></span></div>${levelCards}</div><div id="levelStudentsPanel" class="level-students-panel"></div></section>
 </div>`;
 bindLevelStudentCards(rows);
}
function bindLevelStudentCards(rows){
 const panel=A().$('#levelStudentsPanel'); if(!panel)return;
 document.querySelectorAll('[data-level-list]').forEach(btn=>{
  btn.onclick=()=>{
   const level=btn.dataset.levelList;
   const students=rows.flatMap(({a,r})=>(r.students||[]).filter(s=>s.validForStats&&s.level===level).map(s=>({turma:a.turma||assessmentName(a),name:s.name||s.nome||'-',score:s.score,percent:s.percent,total:s.total,answered:s.answered})));
   panel.innerHTML=`<div class="level-students-header"><h4>Alunos em ${A().safe(level)} (${students.length})</h4><button type="button" id="closeLevelStudents">Fechar</button></div><div class="level-students-table"><table><thead><tr><th>Aluno</th><th>Turma</th><th>Proficiência</th><th>Acertos</th><th>Respondidas</th></tr></thead><tbody>${students.map(s=>`<tr><td>${A().safe(s.name)}</td><td>${A().safe(s.turma)}</td><td><b>${s.score}</b></td><td>${s.total}</td><td>${s.answered}</td></tr>`).join('')||'<tr><td colspan="5">Nenhum aluno neste nível.</td></tr>'}</tbody></table></div>`;
   panel.classList.add('active');
   A().$('#closeLevelStudents')&&(A().$('#closeLevelStudents').onclick=()=>panel.classList.remove('active'));
   panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
 });
}

 function comparativeEnginePanel(){ if(!isAdminUser())return '';
  if(calcEngine()!=='comparativo')return '';
  const linear=compute(A().state.assessment,'linear');
  const logistico=compute(A().state.assessment,'logistico');
  const mapLog=new Map(logistico.students.map(s=>[s.index,s]));
  const valid=linear.students.filter(s=>mapLog.has(s.index));
  const diffs=valid.map(s=>(mapLog.get(s.index).score||0)-(s.score||0));
  const diffMed=diffs.length?Math.round((diffs.reduce((a,b)=>a+b,0)/diffs.length)*10)/10:0;
  const mudouNivel=valid.filter(s=>mapLog.get(s.index).level!==s.level).length;
  const rows=valid.map(s=>{
    const l=mapLog.get(s.index);
    const delta=Math.round(((l.score||0)-(s.score||0))*10)/10;
    return `<tr><td>${A().safe(s.name)}</td><td>${s.score}</td><td>${l.score}</td><td>${delta>0?'+':''}${delta}</td><td>${A().safe(s.level)}</td><td>${A().safe(l.level)}</td></tr>`;
  }).join('');
  const nivelResumo=levelsOrder.map(n=>`<tr><td>${n}</td><td>${linear.summary.levels[n]||0}</td><td>${logistico.summary.levels[n]||0}</td></tr>`).join('');
  return `<div class="panel descriptor-first"><h3>Comparativo dos motores de cálculo</h3><p class="hint">O modo Comparativo executa os dois cálculos na mesma aplicação. A tela principal continua usando o Linear como referência, e este quadro mostra a diferença para a Curva Logística.</p><div class="cards"><div class="card"><span>Média Linear</span><b>${linear.summary.avg}</b></div><div class="card"><span>Média Logística</span><b>${logistico.summary.avg}</b></div><div class="card"><span>Diferença média</span><b>${diffMed>0?'+':''}${diffMed}</b></div><div class="card"><span>Mudaram de nível</span><b>${mudouNivel}</b></div></div><div class="comparison-table"><table><thead><tr><th>Nível</th><th>Linear</th><th>Logístico</th></tr></thead><tbody>${nivelResumo}</tbody></table></div><details><summary><b>Ver aluno por aluno</b></summary><div class="comparison-table"><table><thead><tr><th>Aluno</th><th>Linear</th><th>Logístico</th><th>Diferença</th><th>Nível linear</th><th>Nível logístico</th></tr></thead><tbody>${rows||'<tr><td colspan="6">Sem alunos.</td></tr>'}</tbody></table></div></details></div>`;
 }
function renderClassReport(){
 const r=compute(A().state.assessment, calcEngine());const box=A().$('#classReport'); if(!box)return; const valid=A().isAssessmentValid?.();
  if(valid&&!valid.ok&&A().state.assessment.questions?.length){box.innerHTML='<div class="panel statusbox status-error"><b>Análise bloqueada pela validação.</b><p>Volte à Importação e corrija: '+A().safe(valid.issues.join(', '))+'.</p></div>';return;}
  if(!r.summary.nStudents){box.innerHTML='<div class="panel empty">Importe uma avaliação para gerar o diagnóstico.</div>';return;}
  const critical=r.descriptorStats.slice(0,5);
  const strengths=r.descriptorStats.filter(d=>d.percent>=70).slice(-5).reverse();
  const crit=critical.map(d=>{const info=descInfo(d.descritor);return `<li><b>${A().safe(d.descritor)}</b> — ${d.percent}%: ${A().safe(info.texto)} <span class="hint">(${A().safe(info.topico||'tópico não identificado')})</span></li>`;}).join('');
  const lvlCards=levelsOrder.map(l=>`<div class="card"><span>${l}</span><b>${r.summary.levels[l]||0}</b></div>`).join('')+`<div class="card"><span>Faltosos</span><b>${r.summary.absent||0}</b></div><div class="card"><span>Incompletas</span><b>${r.summary.incomplete||0}</b></div>`;
  const strengthHtml=strengths.length?strengths.map(d=>`<span class="pill ok">${A().safe(d.descritor)} • ${d.percent}%</span>`).join(''):'<span class="hint">Ainda não há descritores acima de 70%.</span>';
 const risk=(r.summary.priority/(r.summary.validStudents||1))>=.5?'Alto':r.summary.avg<300?'Moderado':'Controlado';
 const tct=tctSummary(r);
  box.innerHTML=`${comparativeEnginePanel()}<div class="panel descriptor-first"><h3>Prioridades pedagógicas da turma</h3><ol>${crit}</ol><p><b>Risco pedagógico:</b> ${risk}. <b>Ação imediata:</b> planejar intervenção curta para os 3 primeiros descritores e reavaliar em até 4 semanas.</p><p><b>Pontos fortes:</b> ${strengthHtml}</p></div><div class="cards"><div class="card"><span>TRI / Proficiência</span><b>${r.summary.avg}</b></div><div class="card"><span>TCT / Acertos</span><b>${tct.percent}%</b></div><div class="card"><span>Média de acertos</span><b>${tct.avgCorrect}/${tct.nQuestions}</b></div>${lvlCards}<div class="card"><span>Disciplina</span><b style="font-size:18px">${A().safe(A().state.assessment.discipline)}</b></div></div><div class="statusbox status-work"><b>Resultado TCT:</b> média clássica de acertos da turma. É útil para leitura rápida da prova, mas não estima proficiência nem calibra dificuldade como a TRI.</div><div class="statusbox status-work"><b>Regra de participação:</b> faltosos não entram no cálculo. Avaliações com menos de ${r.summary.completionThreshold}% respondido ficam como incompletas e também saem da calibração. Questões em branco de avaliações válidas contam como erro.</div><div class="statusbox status-work"><b>Escala de proficiência:</b> resultados apresentados na escala 0–500, com classificação por padrões de desempenho do Ensino Médio conforme a disciplina.</div>`;
}
 function barRows(data, opts={}){const max=Math.max(1,...data.map(x=>Number(x.value)||0));return `<div class="bar-chart ${opts.compact?'bar-compact':''}">`+data.map(x=>{const val=Number(x.value)||0;const w=Math.max(3,Math.round((val/max)*100));return `<div class="bar-row"><span class="bar-label">${A().safe(x.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span class="bar-value">${A().safe(x.suffix?val+x.suffix:val)}</span></div>`;}).join('')+`</div>`;}
 function pieChart(levels){const total=levelsOrder.reduce((a,l)=>a+(levels[l]||0),0);if(!total)return '<p class="hint">Sem dados para gráfico.</p>';const colors=['#e63242','#f4a62a','#ffd23f','#009b61'];let acc=0;const stops=levelsOrder.map((l,i)=>{const start=acc;acc+=((levels[l]||0)/total)*100;return `${colors[i]} ${start}% ${acc}%`;}).join(',');return `<div class="pie-wrap"><div class="pie" style="background:conic-gradient(${stops})"><span>${total}<small>alunos</small></span></div><div class="legend">${levelsOrder.map((l,i)=>`<span><i style="background:${colors[i]}"></i>${l}: <b>${levels[l]||0}</b></span>`).join('')}</div></div>`;}
 function renderCharts(){const box=A().$('#resultCharts'); if(!box)return; const r=compute(A().state.assessment, calcEngine());if(!r.summary.nStudents){box.innerHTML='';return;}const levelsPie=pieChart(r.summary.levels||{});const descBars=barRows(r.descriptorStats.slice(0,8).map(d=>({label:d.descritor,value:d.percent,suffix:'%'})),{compact:true});const itemBars=barRows([...r.items].sort((a,b)=>a.percent-b.percent).slice(0,8).map(it=>({label:`${it.question} • ${it.descriptor||'sem descritor'}`,value:it.percent,suffix:'%'})),{compact:true});const levelBars=barRows(levelsOrder.map(l=>({label:l,value:r.summary.levels?.[l]||0})),{compact:true});box.innerHTML=`<div class="chart-grid"><div class="panel chart-card"><h3>Distribuição por nível</h3><p class="hint">Classificação pedagógica estimada da turma.</p>${levelsPie}</div><div class="panel chart-card"><h3>Níveis em barras</h3><p class="hint">Quantidade de alunos em cada faixa.</p>${levelBars}</div><div class="panel chart-card"><h3>Descritores críticos</h3><p class="hint">Menores aproveitamentos por descritor.</p>${descBars}</div><div class="panel chart-card"><h3>Questões críticas</h3><p class="hint">Itens com menor percentual de acerto.</p>${itemBars}</div></div>`;}
 function renderInsights(){
  const box=A().$('#teacherInsights'); if(!box)return; const r=compute(A().state.assessment, calcEngine());
  if(!r.summary.nStudents){box.innerHTML='<p class="hint">Importe os dados para receber sugestões pedagógicas.</p>';return;}
  const low=r.descriptorStats.filter(d=>d.percent<40), high=r.descriptorStats.filter(d=>d.percent>=70), topLow=low.slice(0,3), itemLow=[...r.items].sort((a,b)=>a.percent-b.percent).slice(0,5);
  const elem=(r.summary.levels['Elementar I']||0)+(r.summary.levels['Elementar II']||0), elemPct=A().pct(elem,r.summary.validStudents);
  let focus;if(elemPct>=50) focus='A turma exige recomposição estruturada antes de avançar. Há predominância de alunos nos níveis Elementar I/II, indicando necessidade de retomada guiada, exercícios modelados e verificação frequente.';else if(r.summary.avg<300) focus='A turma está em zona intermediária. O trabalho deve alternar revisão objetiva dos descritores críticos, prática semanal e avaliação curta de consolidação.';else focus='A turma apresenta bom desempenho geral. A intervenção deve ser pontual nos descritores críticos e pode incluir desafios para alunos em Básico/Desejável.';
  const groups=topLow.map(d=>{const info=descInfo(d.descritor);return `<li><b>${A().safe(d.descritor)} — ${A().safe(info.topico||'')}</b>: ${d.percent}% de aproveitamento. Habilidade: ${A().safe(info.texto)}. Sugestão: ${A().safe(info.estrategias||info.intervencao)}</li>`;}).join('');
  box.innerHTML=`<div class="insight-grid"><div class="insight"><b>Leitura geral</b><p>${A().safe(focus)}</p></div><div class="insight"><b>Alunos em atenção</b><p>${elem} aluno(s) em Elementar I/II (${elemPct}%). Priorize acompanhamento individual, devolutiva por descritor e Mapa da Mina.</p></div><div class="insight"><b>Pontos fortes</b><p>${high.length?high.slice(0,3).map(d=>`${d.descritor} (${d.percent}%)`).join(', '):'Ainda não há descritores com domínio consolidado acima de 70%.'}</p></div></div><h4>Plano de ação sugerido</h4><ol class="action-list">${groups||'<li>Não há descritores abaixo de 40%. Faça manutenção com questões de revisão e ampliação.</li>'}<li><b>Correção estratégica:</b> retome ${itemLow.length} questões com menor acerto (${itemLow.map(it=>A().safe(it.question)).join(', ')}), explorando comando, alternativa correta, distratores e justificativa do raciocínio.</li><li><b>Reagrupamento flexível:</b> forme grupos temporários por descritor crítico, não por nota geral. Um aluno pode estar bem na média e ainda necessitar intervenção em um descritor específico.</li><li><b>Registro de progresso:</b> salve esta avaliação no histórico e reaplique 3 a 5 itens de verificação por descritor após duas semanas.</li></ol>`;
 }
 function renderHeatmap(){const r=compute(A().state.assessment, calcEngine());const box=A().$('#heatmap'); if(!box)return; const questions=(A().state.assessment.questions||[]).map((q,i)=>q||`Q${i+1}`); if(!r.students.length){box.innerHTML='<p class="hint">Sem dados.</p>';return;} box.innerHTML=`<div class="heatmap-wrap" style="--q-count:${questions.length||26}"><div class="heatrow heathead"><span class="heatname">Aluno</span>${questions.map((q,i)=>`<span class="heatq" title="${A().safe(q)}">Q${i+1}</span>`).join('')}</div>${r.students.map(s=>`<div class="heatrow"><span class="heatname" title="${A().safe(s.name)}">${A().safe(s.name)}</span>${(s.correct||[]).map((c,i)=>`<span class="cell c${c}" title="${A().safe(s.name)} - Q${i+1}: ${c?'acerto':'erro'}"></span>`).join('')}</div>`).join('')}</div>`;}
function renderStudentAssessmentChooser(){
 const box=A().$('#studentAssessmentOptions'); if(!box)return;
 const list=validSavedAssessments();
 const active=A().state.activeAssessmentId||A().state.assessment.id||'';
 if(!list.length){box.innerHTML='<span class="compare-empty">Nenhuma avaliação salva com alunos.</span>';return;}
 const series=[['1','1º ano'],['2','2º ano'],['3','3º ano']];
 const renderItem=x=>{
  const selected=x.id===active;
  return `<button type="button" class="student-assessment-chip ${selected?'selected':''}" data-student-assessment="${A().safe(x.id)}"><span>${A().safe(assessmentName(x))}</span><small>${(x.students||[]).length} alunos</small></button>`;
 };
 const cols=series.map(([key,label])=>{
  const inSerie=sortAssessmentList(list.filter(x=>assessmentSerie(x)===key));
  const rows=['Língua Portuguesa','Matemática'].map(disc=>{
   const items=inSerie.filter(x=>assessmentDisc(x)===disc);
   return `<div class="compare-disc-row"><div class="compare-disc-title">${A().safe(disc)}</div><div class="compare-disc-items">${items.length?items.map(renderItem).join(''):'<span class="compare-empty">Sem avaliações</span>'}</div></div>`;
  }).join('');
  return `<section class="compare-serie-col"><h4>${label}</h4>${rows}</section>`;
 }).join('');
 const other=sortAssessmentList(list.filter(x=>assessmentSerie(x)==='outros'));
 box.innerHTML=`<div class="compare-series-grid student-series-grid">${cols}</div>${other.length?`<div class="compare-other-row"><h4>Outras avaliações</h4>${other.map(renderItem).join('')}</div>`:''}`;
 box.querySelectorAll('[data-student-assessment]').forEach(btn=>btn.onclick=()=>activateAssessmentInPlace(btn.dataset.studentAssessment));
}
function persistStudentEdits(message){
 const app=A(), a=app.state.assessment||{};
 if(!a.id)return false;
 a.updatedAt=new Date().toISOString();
 a.savedSignature=app.metaSignature?.(a)||a.savedSignature||'';
 const idx=(app.state.assessments||[]).findIndex(x=>x.id===a.id);
 if(idx>=0)app.state.assessments[idx]=JSON.parse(JSON.stringify(a));
 app.state.assessment=a;
 clearCache();
 app.save?.();
 app.renderAll?.();
 if(message)alert(message);
 if(a.cloud_avaliacao_id||a.id)setTimeout(()=>window.VETORSupabase?.autoSaveAssessmentIds?.([a.id]),800);
 return true;
}
function addAbsentStudent(){
 const app=A(), a=app.state.assessment||{}, q=a.questions||[];
 if(!a.id||!q.length){alert('Abra uma avaliação salva com questões antes de adicionar aluno.');return;}
 const name=app.norm(prompt('Nome do aluno faltoso:', '')||'');
 if(!name)return;
 const exists=(a.students||[]).some(s=>app.norm(s.name||s.nome).toLowerCase()===name.toLowerCase());
 if(exists && !confirm('Já existe um aluno com esse nome nesta avaliação. Adicionar mesmo assim?'))return;
 a.students=a.students||[];
 a.students.push({name,answers:Array(q.length).fill(''),status:'faltoso',manual:true});
 persistStudentEdits('Aluno faltoso adicionado. Ele aparece na lista, mas fica fora dos cálculos até receber respostas.');
}
function saveStudentAnswers(i){
 const app=A(), a=app.state.assessment||{}, st=(a.students||[])[i], q=a.questions||[];
 if(!st)return;
 const name=app.norm(app.$('#studentEditName')?.value||st.name||'');
 if(!name){alert('Informe o nome do aluno.');return;}
 const status=app.$('#studentEditStatus')?.value||'presente';
 st.name=name;
 st.answers=q.map((_,idx)=>status==='faltoso'?'':app.letter(app.$(`#studentAnswer_${idx}`)?.value||''));
 st.status=status==='faltoso'?'faltoso':(status==='incompleta'?'incompleta':'presente');
 st.manual=true;
 persistStudentEdits('Dados do aluno salvos e resultados recalculados.');
 renderStudentDetail(i);
}
function bindStudentEdit(i){
 A().$('#addAbsentStudent')&&(A().$('#addAbsentStudent').onclick=addAbsentStudent);
 A().$('#saveStudentAnswers')&&(A().$('#saveStudentAnswers').onclick=()=>saveStudentAnswers(i));
 A().$('#markStudentAbsent')&&(A().$('#markStudentAbsent').onclick=()=>{const sel=A().$('#studentEditStatus'); if(sel)sel.value='faltoso'; saveStudentAnswers(i);});
 const statusSel=A().$('#studentEditStatus');
 if(statusSel)statusSel.onchange=()=>{
  const absent=statusSel.value==='faltoso';
  document.querySelectorAll('.student-answer-select').forEach(el=>el.disabled=absent);
 };
}
function renderStudents(){
 renderStudentAssessmentChooser();
 const r=compute(A().state.assessment, calcEngine()), list=A().$('#studentList');
 if(!list)return;
 const term=A().norm(A().$('#studentSearch')?.value).toLowerCase(), level=A().$('#studentLevelFilter')?.value||'';
 const rows=r.students.filter(s=>(!term||String(s.name||'').toLowerCase().includes(term))&&(!level||s.level===level));
 const toolbar=`<div class="student-edit-toolbar"><button type="button" id="addAbsentStudent">Adicionar aluno faltoso</button><small>Inclui o estudante sem respostas e fora dos cálculos.</small></div>`;
 list.innerHTML=toolbar+(rows.map(s=>{const scoreTxt=s.validForStats?s.score:'fora do cálculo';return `<button data-student="${s.index}"><b>${A().safe(s.name)}</b><br><span class="badge ${levelBadge(s.level)}">${s.level}</span>${!s.validForStats?' <span class="badge no-answer">'+A().safe(s.statusLabel)+'</span>':''} ${s.answered}/${r.summary.nQuestions} respondidas • ${scoreTxt}</button>`;}).join('')||'<p class="hint">Nenhum aluno encontrado com o filtro selecionado.</p>');
 A().$('#addAbsentStudent')&&(A().$('#addAbsentStudent').onclick=addAbsentStudent);
 list.querySelectorAll('button[data-student]').forEach(b=>b.onclick=()=>renderStudentDetail(Number(b.dataset.student)));
}
function studentDescriptorStats(s){if(!s.validForStats)return [];const a=A().state.assessment, map={};s.correct.forEach((c,i)=>{const d=a.descriptors[i]||'Sem descritor';(map[d]??={descriptor:d,total:0,correct:0,errors:0,items:[]});map[d].total++;map[d].correct+=c;map[d].errors+=c?0:1;map[d].items.push({i,ok:c,question:a.questions[i]||'Q'+(i+1)});});return Object.values(map).map(x=>({...x,percent:A().pct(x.correct,x.total)})).sort((a,b)=>a.percent-b.percent||b.errors-a.errors);}
function masteryText(s,stats){const weak=stats.filter(x=>x.percent<50), partial=stats.filter(x=>x.percent>=50&&x.percent<70), strong=stats.filter(x=>x.percent>=70);let txt;if(s.noAnswers)txt='O estudante consta na turma, mas não respondeu nenhuma questão. Status: Faltoso. Ele não entra na calibração das questões, na proficiência, nas estatísticas da turma nem nos percentuais por nível.';else if(s.incomplete)txt='O estudante iniciou a avaliação, mas respondeu menos do que o mínimo exigido. Status: Avaliação incompleta. Ele fica fora da calibração e das estatísticas de proficiência para evitar distorção.';else if(s.level==='Elementar I')txt='O estudante apresenta defasagem grave na avaliação aplicada. A prioridade é reduzir a quantidade de habilidades simultâneas, trabalhar leitura do comando, modelar resolução e acompanhar evidências semanais.';else if(s.level==='Elementar II')txt='O estudante reconhece parte das habilidades, mas ainda não sustenta autonomia. Precisa de intervenção focalizada nos descritores prioritários e exercícios graduados com devolutiva rápida.';else if(s.level==='Básico')txt='O estudante alcança o mínimo esperado na avaliação interna, porém ainda precisa consolidar descritores frágeis para ganhar estabilidade e reduzir erros por distração ou procedimento.';else txt='O estudante demonstra desempenho desejável. Recomenda-se manter revisão dos descritores com erro e oferecer desafios de maior complexidade, sem retirar acompanhamento.';return {txt,weak,partial,strong};}
 function renderStudentDetail(i){
  const r=compute(A().state.assessment, calcEngine()), s=r.students.find(x=>x.index===i), box=A().$('#studentDetail'); if(!s||!box)return;
  const stats=studentDescriptorStats(s), read=masteryText(s,stats), weak=read.weak, partial=read.partial, strong=read.strong;
  const scoreBars=s.validForStats?barRows([{label:'Acertos',value:s.percent,suffix:'%'},{label:'Erros/brancos',value:100-s.percent,suffix:'%'}],{compact:true}):`<p class="hint">${A().safe(s.statusLabel)}: ${s.answered}/${r.summary.nQuestions} questão(ões) respondida(s). Este registro aparece para gestão de participação, mas não compõe a proficiência.</p>`;
  const descBars=barRows(stats.map(d=>({label:`${d.descriptor} (${d.correct}/${d.total})`,value:d.percent,suffix:'%'})),{compact:true});
  const questionStrip=`<div class="student-question-strip">${s.correct.map((c,k)=>`<span class="qdot ${c?'ok':'bad'}" title="${A().safe((A().state.assessment.questions[k]||'Q'+(k+1))+' • '+(A().state.assessment.descriptors[k]||''))}">${k+1}</span>`).join('')}</div>`;
  const weakList=weak.slice(0,5).map(d=>{const info=descInfo(d.descriptor);return `<li><b>${A().safe(d.descriptor)}</b> — ${d.errors} erro(s), ${d.percent}% no descritor. <br><span class="hint">${A().safe(info.texto)} | Intervenção: ${A().safe(info.estrategias||info.intervencao)}</span></li>`;}).join('')||'<li>Nenhum descritor abaixo de 50%.</li>';
  const partialList=partial.slice(0,4).map(d=>`<li>${A().safe(d.descriptor)} — ${d.percent}%: consolidar com treino curto.</li>`).join('')||'<li>Nenhum descritor em zona intermediária.</li>';
  const strongList=strong.slice(-4).reverse().map(d=>`<li>${A().safe(d.descriptor)} — ${d.percent}%: manter e ampliar.</li>`).join('')||'<li>Ainda não há descritores consolidados acima de 70%.</li>';
  const actions=weak.slice(0,3).map((d,idx)=>{const info=descInfo(d.descriptor);return `<li><b>Prioridade ${idx+1}: ${A().safe(d.descriptor)}</b> — aplicar 3 momentos: retomada curta do conceito, 4 itens guiados, 2 itens autônomos. Foco: ${A().safe(info.texto)}</li>`;}).join('')||'<li>Propor desafios de aprofundamento e monitorar manutenção do desempenho.</li>';
  const scoreTxt=s.validForStats?s.score:'-';
  const raw=(A().state.assessment.students||[])[i]||{};
  const q=A().state.assessment.questions||[];
  const statusValue=s.noAnswers?'faltoso':(s.incomplete?'incompleta':'presente');
  const answerOptions=v=>['','A','B','C','D','E'].map(opt=>`<option value="${opt}" ${A().letter(v)===opt?'selected':''}>${opt||'Branco'}</option>`).join('');
  const answerEditor=`<div class="panel mini-panel student-edit-panel"><h4>Editar resultado do aluno</h4><div class="student-edit-grid"><label>Nome do aluno<input id="studentEditName" value="${A().safe(raw.name||s.name||'')}"/></label><label>Status<select id="studentEditStatus"><option value="presente" ${statusValue==='presente'?'selected':''}>Presente</option><option value="faltoso" ${statusValue==='faltoso'?'selected':''}>Faltoso</option><option value="incompleta" ${statusValue==='incompleta'?'selected':''}>Avaliação incompleta</option></select></label></div><div class="answer-edit-grid">${q.map((qq,k)=>`<label><span>Q${k+1}</span><select class="student-answer-select" id="studentAnswer_${k}" ${statusValue==='faltoso'?'disabled':''}>${answerOptions((raw.answers||[])[k])}</select></label>`).join('')}</div><p class="hint">Se marcar Faltoso, as respostas ficam em branco e o aluno não entra na proficiência, descritores, médias ou níveis.</p><div class="actions compact"><button id="saveStudentAnswers" type="button">Salvar e recalcular</button><button id="markStudentAbsent" class="secondary" type="button">Marcar como faltoso</button></div></div>`;
  box.innerHTML=`<div class="student-report"><div class="student-head"><div><h3>${A().safe(s.name)}</h3><p><span class="badge ${levelBadge(s.level)}">${s.level}</span>${!s.validForStats?' <span class="badge no-answer">'+A().safe(s.statusLabel)+'</span>':''} <b>${scoreTxt}</b> pontos • ${s.total}/${r.summary.nQuestions} acertos (${s.percent}%)</p></div><div class="mini-score"><b>${scoreTxt}</b><span>proficiência</span></div></div>${answerEditor}<p><b>Leitura pedagógica:</b> ${A().safe(read.txt)}</p><div class="student-grid"><div class="panel mini-panel"><h4>Acertos x erros</h4>${scoreBars}</div><div class="panel mini-panel"><h4>Questões</h4>${questionStrip}<p class="hint">Verde = acerto; vermelho = erro ou branco em avaliação válida.</p></div></div><div class="panel mini-panel"><h4>Desempenho por descritor do aluno</h4>${descBars}</div><div class="student-grid"><div class="panel mini-panel"><h4>Descritores prioritários</h4><ul>${weakList}</ul></div><div class="panel mini-panel"><h4>Descritores em consolidação</h4><ul>${partialList}</ul></div></div><div class="panel mini-panel"><h4>Pontos fortes</h4><ul>${strongList}</ul></div><div class="panel mini-panel"><h4>Ações sugeridas ao professor</h4><ol>${actions}<li>Registrar no Mapa da Mina uma rotina de 4 semanas com 1h de estudo e 1h de exercícios semanais.</li><li>Na devolutiva, pedir que o estudante explique o erro em pelo menos uma questão prioritária antes de refazer itens semelhantes.</li></ol></div><div class="actions compact"><button onclick="VETOR.showView('recuperacao');document.querySelector('#mapStudent').value='${i}';document.querySelector('#sheetStudent').value='${i}'">Gerar recuperação</button></div></div>`;
  bindStudentEdit(i);
 }
 function renderTomorrow(){const r=compute(A().state.assessment, calcEngine());const box=A().$('#tomorrowPlan'); if(!box)return; const top=r.descriptorStats.slice(0,3); box.innerHTML=top.length?`<ol>${top.map((d,i)=>{const info=descInfo(d.descritor);return `<li><b>Prioridade ${i+1}: ${A().safe(d.descritor)}</b> — ${d.percent}% de aproveitamento. ${A().safe(info.texto)}. Ação: retomar conceito, resolver itens guiados e aplicar verificação curta.</li>`;}).join('')}</ol>`:'<p class="hint">Importe dados para gerar prioridade.</p>';}
 window.Diagnostico={compute,render,renderStudents,renderStudentDetail,levelBadge,barRows,pieChart,setCalcEngine,calcEngine,clearCache};
})();

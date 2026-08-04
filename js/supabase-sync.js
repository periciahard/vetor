(function(){
  'use strict';
  const SUPABASE_URL='https://shqnaeatdkdtnheswggq.supabase.co';
  const SUPABASE_KEY='sb_publishable_ByueLBjkkGNOW0Wt2yD7hg_n0YDvMqi';
  const A=()=>window.VETOR;
  const URL_KEY='vetor_supabase_url';
  const ANON_KEY='vetor_supabase_anon';
  const has=v=>v!==undefined && v!==null && String(v).trim()!=='';
  const Cloud={
    client:null, session:null, profile:null, turmas:[], assessments:[], teacherProfiles:[], selectedCloudAssessment:null,
    uiDiscToDb(d){return /mat/i.test(String(d||''))?'matematica':'lingua_portuguesa'},
    dbDiscToUi(d){return d==='matematica'?'Matemática':'Língua Portuguesa'},
    isCoord(){return ['admin','coordenacao','coordenação','coordenador'].includes(String(this.profile?.perfil||'').toLowerCase())},
    getConfig(){
      const st=A()?.state?.settings||{};
      const url=(st.supabaseUrl||localStorage.getItem(URL_KEY)||SUPABASE_URL).trim();
      const anon=(st.supabaseAnonKey||localStorage.getItem(ANON_KEY)||SUPABASE_KEY).trim();
      return {url:url.replace(/\/rest\/v1\/?$/,''),anon};
    },
    setStatus(msg,type='work'){
      if(A()?.status && !/^Conectado como /i.test(String(msg||''))) A().status('#cloudStatus',msg,type);
      const mini=document.querySelector('#cloudStatusMini');
      if(mini){mini.textContent= type==='ok' ? 'Nuvem conectada' : 'Aguardando login'; mini.className='cloud-mini '+(type==='ok'?'ok':'');}
      const quick=document.querySelector('#cloudQuickStatus');
      if(quick){ if(/^Conectado como /i.test(String(msg||''))){ quick.style.display='none'; quick.textContent=''; } else { quick.style.display='block'; quick.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work'); quick.textContent=msg; } }
    },
    friendlyError(e){
      const raw=String(e?.message||e||'').trim();
      if(/failed to fetch|networkerror|load failed|fetch/i.test(raw)){
        return 'Nao foi possivel conectar ao Supabase. Verifique internet, bloqueio de rede/firewall e abertura por servidor local.';
      }
      if(/invalid login credentials/i.test(raw))return 'E-mail ou senha invalidos no Supabase.';
      if(/email not confirmed/i.test(raw))return 'E-mail ainda nao confirmado no Supabase.';
      return raw||'Falha ao conectar ao Supabase.';
    },
    bind(){
      document.querySelector('#saveSupabaseConfig')&&(document.querySelector('#saveSupabaseConfig').onclick=()=>this.saveConfig());
      document.querySelector('#testSupabaseConfig')&&(document.querySelector('#testSupabaseConfig').onclick=()=>this.testConfig());
      document.querySelector('#cloudLogin')&&(document.querySelector('#cloudLogin').onclick=()=>this.login());
      document.querySelector('#cloudLogout')&&(document.querySelector('#cloudLogout').onclick=()=>this.logout());
      document.querySelector('#cloudRefresh')&&(document.querySelector('#cloudRefresh').onclick=()=>this.loadCloudContext());
      document.querySelector('#cloudSaveAssessment')&&(document.querySelector('#cloudSaveAssessment').onclick=()=>this.saveCurrentAssessment());
      document.querySelector('#cloudQuickSave')&&(document.querySelector('#cloudQuickSave').onclick=()=>this.saveCurrentAssessment());
      document.querySelector('#cloudLoadAssessments')&&(document.querySelector('#cloudLoadAssessments').onclick=()=>this.listAssessments());
      document.querySelector('#adminAtualizarResumoAvaliacoes')&&(document.querySelector('#adminAtualizarResumoAvaliacoes').onclick=()=>this.adminRefreshAssessmentPurgeSummary());
      document.querySelector('#adminApagarAvaliacoes')&&(document.querySelector('#adminApagarAvaliacoes').onclick=()=>this.adminPurgeAllAssessments());
    },
    init(){
      this.bind();
      const cfg=this.getConfig();
      const u=document.querySelector('#supabaseUrl'), k=document.querySelector('#supabaseAnonKey');
      if(u)u.value=cfg.url; if(k)k.value=cfg.anon;
      if(!this.initClient())return;
      this.restoreSession();
    },
    initClient(){
      const cfg=this.getConfig();
      if(!window.supabase){this.setStatus('Biblioteca Supabase não carregou. O  continua funcionando.','error');return false;}
      try{this.client=window.supabase.createClient(cfg.url,cfg.anon);return true;}catch(e){this.setStatus('Erro ao criar cliente Supabase: '+e.message,'error');return false;}
    },
    saveConfig(){
      const url=(document.querySelector('#supabaseUrl')?.value||SUPABASE_URL).trim().replace(/\/rest\/v1\/?$/,'');
      const anon=(document.querySelector('#supabaseAnonKey')?.value||SUPABASE_KEY).trim();
      if(!url||!anon){this.setStatus('Informe URL do Supabase e chave pública.','error');return;}
      if(/secret|service_role/i.test(anon)){this.setStatus('Essa chave parece ser secreta/service role. Não salve chave secreta no site.','error');return;}
      if(A()?.state?.settings){A().state.settings.supabaseUrl=url; A().state.settings.supabaseAnonKey=anon; A().save?.();}
      localStorage.setItem(URL_KEY,url); localStorage.setItem(ANON_KEY,anon);
      this.client=null; this.session=null; this.profile=null; this.initClient();
      this.setStatus('Configuração salva. Faça login institucional.','ok');
    },
    async testConfig(){
      this.saveConfig(); if(!this.client)return;
      try{const {error}=await this.client.from('perfis').select('id').limit(1); if(error)throw error; this.setStatus('Conexão com Supabase funcionando.','ok');}
      catch(e){this.setStatus('Falha no teste: '+this.friendlyError(e),'error');}
    },
    async restoreSession(){
      if(!this.client&&!this.initClient())return;
      try{const {data}=await this.client.auth.getSession(); this.session=data.session||null; if(this.session) await this.loadCloudContext(); else this.setStatus('Supabase configurado. Faça login institucional para sincronizar.','work');}
      catch(e){this.setStatus('Nao foi possivel verificar sessao: '+this.friendlyError(e),'error');}
    },
    async mainLogin(email,password){
      if(!this.client&&!this.initClient())return null;
      const {data,error}=await this.client.auth.signInWithPassword({email,password});
      if(error)throw error;
      this.session=data.session;
      await this.loadCloudContext();
      return this.profile;
    },
    async login(){
      const email=document.querySelector('#cloudEmail')?.value.trim(); const password=document.querySelector('#cloudPassword')?.value;
      if(!email||!password){this.setStatus('Informe e-mail e senha cadastrados no Supabase.','error');return;}
      try{this.setStatus('Entrando...', 'work'); await this.mainLogin(email,password);}
      catch(e){this.setStatus('Erro no login: '+this.friendlyError(e),'error');}
    },
    async logout(){
      try{if(this.client)await this.client.auth.signOut({scope:'local'});}catch(e){console.warn('Erro ao encerrar sessão Supabase:',e.message);}
      try{[localStorage,sessionStorage].forEach(st=>Object.keys(st).forEach(k=>{const kk=String(k).toLowerCase(); if(kk.includes('supabase.auth')||kk.startsWith('sb-')||kk.startsWith('vetor_auth')||kk.startsWith('vetor_session')) st.removeItem(k);}));}catch(e){}
      this.session=null; this.profile=null; this.turmas=[]; this.assessments=[];
      const turma=document.querySelector('#cloudTurma'); if(turma)turma.innerHTML='<option value="">Faça login para carregar turmas</option>';
      const list=document.querySelector('#cloudAssessmentsList'); if(list)list.innerHTML='';
      const user=document.querySelector('#cloudUserBox'); if(user)user.innerHTML='';
      const dash=document.querySelector('#cloudCoordDashboard'); if(dash)dash.innerHTML='';
      this.setStatus('Sessão institucional encerrada.','work');
    },
    async loadCloudContext(){
      if(!this.client&&!this.initClient())return;
      if(!this.session){const {data}=await this.client.auth.getSession(); this.session=data.session||null;}
      if(!this.session){this.setStatus('Faça login para carregar dados.','work');return;}
      const uid=this.session.user.id;
      const {data:profile,error:pErr}=await this.client.from('perfis').select('*').eq('id',uid).maybeSingle();
      if(pErr)throw pErr;
      if(!profile)throw new Error('Usuário autenticado, mas sem perfil na tabela perfis.');
      this.profile=profile;
      await this.loadTurmas();
      await this.loadTeacherProfiles();
      try{await window.TurmasVetor?.syncFromSupabase?.();}catch(e){console.warn('Falha ao sincronizar turmas/alunos',e);}
      this.renderUserBox();
      this.setStatus(`Conectado como ${profile.nome} (${profile.perfil}).`,'ok');
      await this.listAssessments(false);
    },
    async loadTeacherProfiles(){
      this.teacherProfiles=[];
      try{
        const {data,error}=await this.client.from('perfis').select('id,nome,email,perfil').order('nome');
        if(error)throw error;
        this.teacherProfiles=(data||[]).filter(p=>/prof|coord|admin/i.test(String(p.perfil||'')));
      }catch(e){
        if(this.profile)this.teacherProfiles=[this.profile];
        console.warn('Não foi possível carregar lista de professores:', e.message);
      }
      A()?.renderTeachers?.();
    },
    async loadTurmas(){
      if(this.isCoord()){
        const {data,error}=await this.client.from('turmas').select('*').order('nome');
        if(error){this.setStatus('Erro ao carregar turmas: '+error.message,'error');this.turmas=[];return;}
        this.turmas=(data||[]).map(t=>({turma:t,disciplina:null,permissao:'gerenciar'}));
        this.renderTurmas();
        return;
      }
      // Professor: preferir vínculos explícitos professor_turmas. Se a tabela ainda não existir, cai para turmas visíveis pelo RLS.
      let rel=await this.client.from('professor_turmas').select('disciplina,turma:turmas(*)').eq('professor_id',this.profile.id).order('disciplina');
      if(!rel.error && rel.data?.length){
        this.turmas=rel.data.filter(x=>x.turma).map(x=>({turma:x.turma,disciplina:x.disciplina,permissao:'editar'}));
        this.renderTurmas();
        return;
      }
      const {data,error}=await this.client.from('turmas').select('*').order('nome');
      if(error){this.setStatus('Erro ao carregar turmas: '+error.message,'error');this.turmas=[];return;}
      this.turmas=(data||[]).map(t=>({turma:t,disciplina:null,permissao:'editar'}));
      this.renderTurmas();
    },
    renderUserBox(){
      const box=document.querySelector('#cloudUserBox'); if(!box||!this.profile)return;
      const vinc=this.isCoord()?'Acesso de coordenação/admin: visualiza e salva dados institucionais.':`${this.turmas.length} vínculo(s) de turma disponível(is).`;
      box.innerHTML=`<div class="cloud-card"><b>${A().safe(this.profile.nome)}</b><br><span>${A().safe(this.profile.email)}</span><br><span class="badge ok">${A().safe(this.profile.perfil)}</span><p class="hint">${vinc}</p></div>`;
    },
    isAdmin(){return String(this.profile?.perfil||'').toLowerCase()==='admin'},
    setAdminPurgeStatus(msg,type='work'){
      const box=document.querySelector('#adminAssessmentPurgeStatus');
      if(box){box.className='statusbox '+(type==='ok'?'status-ok':type==='error'?'status-error':'status-work'); box.textContent=msg;}
    },
    async countTable(table, filter){
      let q=this.client.from(table).select('id',{count:'exact',head:true});
      if(filter) q=filter(q);
      const {count,error}=await q;
      if(error)throw error;
      return count||0;
    },
    async adminRefreshAssessmentPurgeSummary(){
      if(!this.client&&!this.initClient())return;
      if(!this.profile){try{await this.restoreSession();}catch(e){}}
      if(!this.profile){this.setAdminPurgeStatus('Faça login institucional antes de consultar as avaliações.','error');return;}
      if(!this.isAdmin()){this.setAdminPurgeStatus('Somente usuários com perfil admin podem apagar avaliações.','error');return;}
      try{
        this.setAdminPurgeStatus('Consultando avaliações salvas na nuvem...','work');
        const avaliacoes=await this.countTable('avaliacoes',q=>q.not('id','is',null));
        const resultados=await this.countTable('resultados_alunos',q=>q.not('avaliacao_id','is',null));
        let respostas=0;
        try{respostas=await this.countTable('respostas',q=>q.not('avaliacao_id','is',null));}
        catch(e){console.warn('Tabela respostas indisponível ou sem permissão:',e.message);}
        this.setAdminPurgeStatus(`${avaliacoes} avaliação(ões), ${resultados} resultado(s) de aluno e ${respostas} resposta(s) item a item encontrados.`, avaliacoes?'work':'ok');
      }catch(e){this.setAdminPurgeStatus('Erro ao consultar resumo: '+e.message,'error');}
    },
    clearLocalAssessmentCache(){
      const app=A(); if(!app?.state)return;
      try{
        app.state.assessment={id:null,savedSignature:'',discipline:app.state.settings?.discipline||'Língua Portuguesa',turma:'',tipo:'diagnostica',date:'',teacher:'',questionCount:26,questions:[],descriptors:[],key:[],students:[],title:'Avaliação atual'};
        app.state.assessments=[];
        app.state.snapshots=[];
        app.state.activeAssessmentId=null;
        app.save?.(); app.fillMetaInputs?.(); app.renderAll?.();
        window.Evolucao?.clearCloudHistory?.();
        window.InteligenciaV684?.clear?.();
        window.Intervencoes?.render?.();
      }catch(e){console.warn('Não foi possível limpar cache local de avaliações:',e.message);}
    },
    async adminPurgeAllAssessments(){
      if(!this.client&&!this.initClient())return;
      if(!this.profile){try{await this.restoreSession();}catch(e){}}
      if(!this.profile){this.setAdminPurgeStatus('Faça login institucional antes de apagar avaliações.','error');return;}
      if(!this.isAdmin()){this.setAdminPurgeStatus('Somente usuários com perfil admin podem apagar avaliações.','error');return;}
      const passOk=window.VETOR?.requireDeletePassword ? window.VETOR.requireDeletePassword('apagar todas as avaliações da plataforma') : String(prompt('Digite a senha de administrador para confirmar a exclusão:')||'').trim()==='5557';
      if(!passOk){this.setAdminPurgeStatus('Operação cancelada. Senha de confirmação incorreta.','work');return;}
      const first=confirm('Apagar TODAS as avaliações da plataforma?\n\nIsso remove avaliações, resultados dos alunos e respostas. Usuários, turmas e alunos serão preservados.');
      if(!first)return;
      try{
        this.setAdminPurgeStatus('Apagando dados de avaliação na nuvem...','work');
        const delRes=await this.client.from('resultados_alunos').delete({count:'exact'}).not('avaliacao_id','is',null);
        if(delRes.error)throw delRes.error;
        try{
          const delResp=await this.client.from('respostas').delete({count:'exact'}).not('avaliacao_id','is',null);
          if(delResp.error)console.warn('Não foi possível limpar respostas item a item:',delResp.error.message);
        }catch(e){console.warn('Tabela respostas indisponível ou sem permissão:',e.message);}
        const delAv=await this.client.from('avaliacoes').delete({count:'exact'}).not('id','is',null);
        if(delAv.error)throw delAv.error;
        this.assessments=[];
        this.selectedCloudAssessment=null;
        this.renderAssessments();
        this.renderCoordCloudDashboard();
        this.clearLocalAssessmentCache();
        try{await window.Evolucao?.loadCloudHistory?.(true);}catch(e){}
        try{await window.InteligenciaV684?.load?.(false);}catch(e){}
        this.setAdminPurgeStatus(`Avaliações apagadas com sucesso. Removidas ${delAv.count||0} avaliação(ões) e ${delRes.count||0} resultado(s) de aluno.`, 'ok');
      }catch(e){this.setAdminPurgeStatus('Erro ao apagar avaliações: '+e.message,'error');}
    },
    renderTurmas(){
      const sel=document.querySelector('#cloudTurma'); if(!sel)return;
      if(!this.turmas.length){sel.innerHTML='<option value="">Nenhuma turma cadastrada ainda</option>';return;}
      sel.innerHTML='<option value="">Selecione a turma</option>'+this.turmas.map((x,i)=>`<option value="${i}">${A().safe(x.turma.nome||'Turma')} ${x.turma.serie?('— '+A().safe(x.turma.serie)):''}</option>`).join('');
    },
    selectedTurmaLink(){
      const sel=document.querySelector('#cloudTurma');
      const raw=sel?.value;
      if(raw!==undefined && raw!==null && raw!=='' && !Number.isNaN(Number(raw))){
        const idx=Number(raw); if(idx>=0 && this.turmas[idx]) return this.turmas[idx];
      }
      const nome=A()?.state?.assessment?.turma||'';
      if(nome){
        const n=A().norm(nome).toLowerCase();
        return this.turmas.find(x=>A().norm(x.turma?.nome||'').toLowerCase()===n)||null;
      }
      return null;
    },
    async ensureTurmaForAssessment(){
      let link=this.selectedTurmaLink();
      if(link)return link;
      const nome=A()?.state?.assessment?.turma||'';
      if(!nome) return null;
      const clean=A().norm(nome)||'Turma sem nome';
      let {data,error}=await this.client.from('turmas').select('*').ilike('nome',clean).maybeSingle();
      if(error && !/multiple/i.test(error.message||'')) throw error;
      if(data){link={turma:data,disciplina:null,permissao:this.isCoord()?'gerenciar':'editar'}; this.turmas.push(link); this.renderTurmas(); return link;}
      const {data:created,error:cErr}=await this.client.from('turmas').insert({nome:clean,serie:'Não informada'}).select('*').single();
      if(cErr) throw cErr;
      link={turma:created,disciplina:null,permissao:this.isCoord()?'gerenciar':'editar'}; this.turmas.push(link); this.renderTurmas(); return link;
    },
    isPlaceholderStudentName(nome){
      const n=String(nome||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
      return !n || /^ALUNO(?:\s*(?:\d+|X+|SEM\s+NOME))?$/.test(n) || /^NOME\s+DO\s+ALUNO$/.test(n) || /^ESTUDANTE(?:\s*(?:\d+|X+))?$/.test(n);
    },
    async ensureAluno(nome,turma_id){
      const clean=String(nome||'').trim()||'Aluno sem nome';
      if(this.isPlaceholderStudentName(clean))return null;
      let {data,error}=await this.client.from('alunos').select('id').eq('turma_id',turma_id).eq('nome',clean).maybeSingle();
      if(error)throw error; if(data?.id)return data.id;
      let ins=await this.client.from('alunos').insert({nome:clean,turma_id}).select('id').single();
      if(ins.error)throw ins.error; return ins.data.id;
    },
    async saveCurrentAssessment(opts={}){
      const manual = opts.manual!==false;
      if(!this.profile){this.setStatus('Faça login antes de salvar na nuvem.','error');return null;}
      let link=null;
      try{link=await this.ensureTurmaForAssessment();}
      catch(e){this.setStatus('Erro ao localizar/criar turma no Supabase: '+e.message,'error');return null;}
      if(!link){this.setStatus('Selecione ou informe uma turma antes de salvar.','error');return null;}

      if(opts.syncMeta!==false) A().syncMetaFromInputs?.();
      const a=A().state.assessment;
      if(!a.questions?.length||!a.students?.length){this.setStatus('Importe e analise uma avaliação antes de salvar.','error');return null;}

      const disciplina=this.uiDiscToDb(a.discipline);
      const titulo=(document.querySelector('#cloudAssessmentTitle')?.value||a.title||'Avaliação').trim();
      const tipo=document.querySelector('#cloudAssessmentType')?.value||a.tipo||'diagnostica';
      const data_avaliacao=document.querySelector('#cloudAssessmentDate')?.value||a.date||new Date().toISOString().slice(0,10);
      this.setStatus('Salvando diagnóstico na nuvem...', 'work');

      const payload={
        nome:titulo,
        titulo,
        tipo,
        disciplina,
        turma_id:link.turma.id,
        professor_id:this.profile.id,
        data_aplicacao:data_avaliacao,
        data_avaliacao,
        questoes_json:a.questions,
        descritores_json:a.descriptors,
        gabarito_json:a.key
      };

      // Consolidação definitiva contra duplicação.
      // Estratégia:
      // 1) se houver cloud_avaliacao_id válido, atualiza;
      // 2) procura avaliação existente por turma + disciplina + título + data;
      // 3) para títulos genéricos ("Avaliação atual"), procura por turma + disciplina + título,
      //    ignorando horário/data, para evitar múltiplas cópias acidentais;
      // 4) antes de inserir, repete a checagem para reduzir corrida entre salvamentos automáticos.
      const tituloNorm=String(titulo||'').trim().toLowerCase();
      const tituloGenerico=/^(avalia[cç][aã]o atual|avalia[cç][aã]o|diagn[oó]stico atual)$/i.test(tituloNorm);
      let av=null, existingId=a.cloud_avaliacao_id||null;

      async function findExisting(){
        let q=await Cloud.client.from('avaliacoes')
          .select('id,criado_em')
          .eq('turma_id',link.turma.id)
          .eq('disciplina',disciplina)
          .eq('titulo',titulo)
          .eq('data_aplicacao',data_avaliacao)
          .order('criado_em',{ascending:false})
          .limit(1);
        if(!q.error && q.data?.[0]?.id) return q.data[0].id;
        if(tituloGenerico){
          q=await Cloud.client.from('avaliacoes')
            .select('id,criado_em')
            .eq('turma_id',link.turma.id)
            .eq('disciplina',disciplina)
            .eq('titulo',titulo)
            .order('data_aplicacao',{ascending:false})
            .order('criado_em',{ascending:false})
            .limit(1);
          if(!q.error && q.data?.[0]?.id) return q.data[0].id;
        }
        return null;
      }

      if(existingId){
        const chk=await this.client.from('avaliacoes').select('id,turma_id,disciplina,titulo,data_aplicacao,data_avaliacao').eq('id',existingId).maybeSingle();
        if(chk.error){console.warn('Não foi possível conferir avaliação existente:', chk.error.message);}
        const oldDate=String(chk.data?.data_aplicacao||chk.data?.data_avaliacao||'');
        const sameCloudRecord=chk.data?.id && chk.data.turma_id===link.turma.id && chk.data.disciplina===disciplina && String(chk.data.titulo||'')===String(titulo||'') && oldDate===String(data_avaliacao||'');
        if(!chk.error && sameCloudRecord) existingId=chk.data.id; else existingId=null;
      }
      if(!existingId){
        try{ existingId=await findExisting(); }
        catch(e){ console.warn('Não foi possível procurar duplicidade de avaliação:', e.message); }
      }

      if(existingId){
        const up=await this.client.from('avaliacoes').update(payload).eq('id',existingId).select().single();
        if(up.error){this.setStatus('Erro ao atualizar avaliação: '+up.error.message,'error');return null;}
        av=up.data;
        // Limpa filhos antes de reinserir, evitando resultados e respostas duplicadas.
        const delRes=await this.client.from('resultados_alunos').delete().eq('avaliacao_id',av.id);
        if(delRes.error){this.setStatus('Avaliação atualizada, mas houve erro ao limpar resultados anteriores: '+delRes.error.message,'error');return av;}
        const delResp=await this.client.from('respostas').delete().eq('avaliacao_id',av.id);
        if(delResp.error){console.warn('Erro ao limpar respostas anteriores:', delResp.error.message);}
      }else{
        // Última checagem imediatamente antes do INSERT.
        try{ existingId=await findExisting(); }catch(e){}
        if(existingId){
          const up=await this.client.from('avaliacoes').update(payload).eq('id',existingId).select().single();
          if(up.error){this.setStatus('Erro ao atualizar avaliação: '+up.error.message,'error');return null;}
          av=up.data;
          const delRes=await this.client.from('resultados_alunos').delete().eq('avaliacao_id',av.id);
          if(delRes.error){this.setStatus('Avaliação atualizada, mas houve erro ao limpar resultados anteriores: '+delRes.error.message,'error');return av;}
          const delResp=await this.client.from('respostas').delete().eq('avaliacao_id',av.id);
          if(delResp.error){console.warn('Erro ao limpar respostas anteriores:', delResp.error.message);}
        }else{
          const ins=await this.client.from('avaliacoes').insert(payload).select().single();
          if(ins.error){this.setStatus('Erro ao salvar avaliação: '+ins.error.message,'error');return null;}
          av=ins.data;
        }
      }

      const r=A().getResults();
      const rows=[];
      const respostas=[];
      for(const s of r.students){
        const aluno_id=await this.ensureAluno(s.name,link.turma.id);
        if(!aluno_id)continue;
        const weak={};
        (s.correct||[]).forEach((c,i)=>{
          if(!c){
            const d=a.descriptors[i]||'Sem descritor';
            weak[d]=(weak[d]||0)+1;
          }
        });
        const crit=Object.entries(weak).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([d,n])=>({descritor:d,erros:n}));
        rows.push({
          avaliacao_id:av.id,
          aluno_id,
          aluno_nome:s.name,
          respostas_json:s.answers||[],
          acertos:s.total,
          total:r.summary.nQuestions,
          percentual:s.percent,
          descritores_criticos:crit,
          relatorio_individual:window.Relatorios?.individual?.(s.index)||null
        });
        (s.answers||[]).forEach((resp,i)=>respostas.push({
          avaliacao_id:av.id,
          aluno_id,
          questao_id:null,
          resposta:resp||null,
          acertou:!!(s.correct||[])[i]
        }));
      }

      if(rows.length){
        const {error:resErr}=await this.client.from('resultados_alunos').insert(rows);
        if(resErr){this.setStatus('Avaliação salva, mas houve erro nos resultados: '+resErr.message,'error');return av;}
      }
      if(respostas.length){
        const {error:respErr}=await this.client.from('respostas').insert(respostas);
        if(respErr) console.warn('Erro ao salvar respostas item a item:', respErr.message);
      }

      try{
        A().state.assessment.cloud_avaliacao_id=av.id;
        A().state.assessment.cloud_saved_at=new Date().toISOString();
        A().state.assessment.title=titulo;
        A().state.assessment.tipo=tipo;
        A().state.assessment.date=data_avaliacao;
        A().saveAssessmentRecord?.(false);
        A().save?.();
      }catch(e){console.warn('Falha ao registrar ID da nuvem no estado local',e);}

      this.setStatus(existingId?'Diagnóstico atualizado na nuvem com sucesso.':'Diagnóstico salvo na nuvem com sucesso.','ok');
      await this.listAssessments(false);
      try{window.Evolucao?.loadCloudHistory?.(true);}catch(e){}
      return av;
    },
    async autoSaveCurrentAssessment(){
      if(!this.client) this.initClient();
      if(!this.profile){try{await this.restoreSession();}catch(e){return null;}}
      if(!this.profile)return null;
      const a=A().state.assessment||{};
      if(!a.questions?.length||!a.students?.length)return null;
      try{return await this.saveCurrentAssessment({manual:false});}
      catch(e){this.setStatus('Falha no salvamento automático: '+e.message,'error');return null;}
    },
    async autoSaveAssessmentIds(ids=[]){
      if(!this.client) this.initClient();
      if(!this.profile){try{await this.restoreSession();}catch(e){return null;}}
      if(!this.profile)return null;
      const app=A();
      const unique=[...new Set((ids||[]).filter(Boolean))];
      if(!unique.length)return null;
      const previousId=app.state.activeAssessmentId;
      const previousAssessment={...(app.state.assessment||{})};
      let saved=0;
      try{
        for(const id of unique){
          const rec=(app.state.assessments||[]).find(x=>x.id===id);
          if(!rec?.questions?.length||!rec?.students?.length)continue;
          app.state.assessment={...rec};
          app.state.activeAssessmentId=rec.id;
          const av=await this.saveCurrentAssessment({manual:false,syncMeta:false});
          if(av)saved++;
        }
      }catch(e){
        this.setStatus('Falha no salvamento automatico em lote: '+e.message,'error');
      }finally{
        const restore=(app.state.assessments||[]).find(x=>x.id===previousId)||previousAssessment;
        app.state.assessment={...restore};
        app.state.activeAssessmentId=restore?.id||previousId||null;
        app.save?.();
        app.renderAll?.();
      }
      if(saved>1)this.setStatus(saved+' diagnosticos salvos na nuvem com sucesso.','ok');
      return saved;
    },
    async listAssessments(showStatus=true){
      if(!this.profile){if(showStatus)this.setStatus('Faça login para listar avaliações.','error');return;}
      if(showStatus)this.setStatus('Carregando avaliações...', 'work');
      const {data,error}=await this.client.from('avaliacoes').select('id,nome,titulo,tipo,disciplina,data_aplicacao,data_avaliacao,criado_em,professor_id,questoes_json,descritores_json,gabarito_json,turmas(nome)').order('criado_em',{ascending:false}).limit(200);
      if(error){this.setStatus('Erro ao listar avaliações: '+error.message,'error');return;}
      let rows=data||[];
      // Não usar relacionamento automático avaliacoes -> perfis.
      // O banco possui professor_id, mas não FK formal para perfis; buscamos os nomes separadamente.
      const ids=[...new Set(rows.map(x=>x.professor_id).filter(Boolean))];
      let profMap={};
      if(ids.length){
        try{
          const {data:profs,error:pErr}=await this.client.from('perfis').select('id,nome,email').in('id',ids);
          if(!pErr){(profs||[]).forEach(p=>profMap[p.id]=p);}
        }catch(e){console.warn('Não foi possível carregar nomes dos professores:', e.message);}
      }
      this.assessments=rows.map(av=>({...av, professor: profMap[av.professor_id]||null}));
      this.renderAssessments(); this.renderCoordCloudDashboard(); if(showStatus)this.setStatus(`${this.assessments.length} avaliação(ões) carregada(s).`,'ok');
    },
    renderAssessments(){
      const box=document.querySelector('#cloudAssessmentsList'); if(!box)return;
      if(!this.assessments.length){box.innerHTML='<p class="hint">Nenhuma avaliação salva na nuvem.</p>';return;}
      box.innerHTML=this.assessments.map(av=>{const title=av.titulo||av.nome||'Avaliação';return `<div class="cloud-assessment"><div><b>${A().safe(title)}</b><br><small>${A().safe(av.turmas?.nome||'-')} • ${A().safe(this.dbDiscToUi(av.disciplina))} • ${A().safe(av.professor?.nome||'Professor')}</small><br><small>${A().safe(av.data_avaliacao||av.data_aplicacao||'sem data')} • ${av.criado_em?new Date(av.criado_em).toLocaleString('pt-BR'):''}</small></div><button data-cloud-load="${av.id}">Carregar</button></div>`;}).join('');
      box.querySelectorAll('[data-cloud-load]').forEach(btn=>btn.onclick=()=>this.loadAssessment(btn.dataset.cloudLoad));
    },
    renderCoordCloudDashboard(){
      const box=document.querySelector('#cloudCoordDashboard'); if(!box)return;
      if(!this.profile){box.innerHTML='<h3>Painel institucional</h3><p class="hint">Faça login para visualizar dados salvos na nuvem.</p>';return;}
      const byTurma={}, byDisc={}, byProf={};
      this.assessments.forEach(av=>{const turma=av.turmas?.nome||'Sem turma'; const disc=this.dbDiscToUi(av.disciplina); const prof=av.professor?.nome||'Professor'; byTurma[turma]=(byTurma[turma]||0)+1; byDisc[disc]=(byDisc[disc]||0)+1; byProf[prof]=(byProf[prof]||0)+1;});
      const list=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<li>${A().safe(k)} — ${v}</li>`).join('')||'<li>Nenhum dado</li>';
      box.innerHTML=`<h3>Painel institucional da nuvem</h3><div class="cards"><div class="card"><span>Avaliações</span><b>${this.assessments.length}</b></div><div class="card"><span>Turmas</span><b>${Object.keys(byTurma).length}</b></div><div class="card"><span>Professores</span><b>${Object.keys(byProf).length}</b></div><div class="card"><span>Disciplinas</span><b>${Object.keys(byDisc).length}</b></div></div><div class="grid3"><div><h4>Turmas</h4><ul>${list(byTurma)}</ul></div><div><h4>Disciplinas</h4><ul>${list(byDisc)}</ul></div><div><h4>Professores</h4><ul>${list(byProf)}</ul></div></div>`;
    },
    async loadAssessment(id){
      const av=this.assessments.find(x=>x.id===id); if(!av){this.setStatus('Avaliação não encontrada.','error');return;}
      this.setStatus('Carregando avaliação da nuvem...', 'work');
      const {data:rows,error}=await this.client.from('resultados_alunos').select('*').eq('avaliacao_id',id).order('aluno_nome');
      if(error){this.setStatus('Erro ao carregar resultados: '+error.message,'error');return;}
      const questions=av.questoes_json||[];
      A().setAssessment({id:'cloud-'+av.id,cloud_avaliacao_id:av.id,title:av.titulo||av.nome,turma:av.turmas?.nome||'',tipo:av.tipo||'diagnostica',date:av.data_avaliacao||av.data_aplicacao||'',discipline:this.dbDiscToUi(av.disciplina),questionCount:questions.length||26,questions,descriptors:av.descritores_json||[],key:av.gabarito_json||[],students:(rows||[]).filter(r=>!this.isPlaceholderStudentName(r.aluno_nome)).map(r=>({name:r.aluno_nome,answers:r.respostas_json||[]}))});
      A().fillMetaInputs?.(); this.selectedCloudAssessment=av;
      this.setStatus('Avaliação carregada da nuvem.','ok'); A().showView('diagnostico');
    }
  };
  window.VETORSupabase=Cloud;
  document.addEventListener('DOMContentLoaded',()=>Cloud.init());
})();


(function(){
'use strict';
const STORE='vetor_auth_v68_7';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const safe=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const norm=s=>String(s??'').trim();

function roleFromPerfil(perfil){
  const p=String(perfil||'professor').toLowerCase();
  if(p.includes('admin')) return 'admin';
  if(p.includes('coord')) return 'coord';
  return 'prof';
}
function normalizeProfile(profile){
  if(!profile) return null;
  const role=roleFromPerfil(profile.perfil||profile.role);
  return {
    login: profile.email || profile.login || '',
    nome: profile.nome || profile.email || 'Usuário',
    perfil: profile.perfil || (role==='admin'?'admin':role==='coord'?'coordenação':'professor'),
    role,
    disciplina: profile.disciplina || '',
    anos: Array.isArray(profile.anos)?profile.anos:[],
    disciplinas: profile.disciplina ? [profile.disciplina] : [],
    all: role==='admin'||role==='coord',
    ativo: true
  };
}
function current(){try{return JSON.parse(localStorage.getItem(STORE)||sessionStorage.getItem(STORE)||'null')}catch{return null}}
function saveUser(user,remember=true){
  const u=normalizeProfile(user);
  if(!u)return;
  const target=remember?localStorage:sessionStorage;
  target.setItem(STORE,JSON.stringify(u));
}

function friendlyAuthError(e){
 const raw=String(e?.message||e||'').trim();
 if(/failed to fetch|networkerror|load failed|fetch/i.test(raw)){
  return 'Nao foi possivel conectar ao Supabase. Verifique a internet, bloqueio de rede/firewall e se a plataforma foi aberta por um servidor local. Se voce abriu direto pelo arquivo index.html, extraia a pasta e abra por servidor local.';
 }
 if(/invalid login credentials/i.test(raw))return 'E-mail ou senha invalidos no Supabase.';
 if(/email not confirmed/i.test(raw))return 'E-mail ainda nao confirmado no Supabase.';
 return raw||'Falha no login institucional.';
}

function clearUser(){
  localStorage.removeItem(STORE); sessionStorage.removeItem(STORE);
  // Remove tokens do Supabase e cache de autenticação do VETOR sem apagar dados pedagógicos locais.
  [localStorage, sessionStorage].forEach(st=>{
    try{Object.keys(st).forEach(k=>{
      const kk=String(k).toLowerCase();
      if(kk===STORE || kk.includes('supabase.auth') || kk.startsWith('sb-') || kk.startsWith('vetor_auth') || kk.startsWith('vetor_session')) st.removeItem(k);
    });}catch(e){}
  });
}

function user(){return current();}
function yearOfTurma(turma){
 const t=String(turma||'').toUpperCase();
 const m=t.match(/\b([123])\s*º?/) || t.match(/([123])\s*ANO/) || t.match(/^([123])/);
 return m?m[1]:'';
}
function disciplineOk(u,disc){
 if(!u)return false;
 if(u.all)return true;
 if(!u.disciplinas?.length && !u.disciplina)return true;
 return (u.disciplinas||[]).includes(disc) || u.disciplina===disc;
}
function turmaOk(u,turma){
 if(!u)return false;
 if(u.all)return true;
 if(!u.anos?.length)return true;
 const y=yearOfTurma(turma);
 return !!y && u.anos.includes(y);
}
function assessmentOk(u,a){return !!u && (u.all || (turmaOk(u,a?.turma) && disciplineOk(u,a?.discipline)));}
function lock(){document.body.classList.add('auth-locked'); if($('#loginScreen')) $('#loginScreen').style.display='flex';}
function unlock(u){
 document.body.classList.remove('auth-locked');
 document.body.classList.remove('role-admin','role-coord','role-coordenacao','role-prof','role-professor');
 document.body.classList.add('role-'+(u.role||'prof'));
 if(u.role==='coord') document.body.classList.add('role-coordenacao');
 if(u.role==='prof') document.body.classList.add('role-professor');
 if($('#loginScreen')) $('#loginScreen').style.display='none';
 $('#authUserBadge')&&($('#authUserBadge').innerHTML=`👤 ${safe(u.nome)} <small>${safe(u.perfil)}</small>`);
 $('#sidebarUserBadge')&&($('#sidebarUserBadge').innerHTML=`👤 ${safe(u.nome)} <small>${safe(u.perfil)}</small>`);
 applyPermissions();
 setTimeout(()=>window.VETOR?.renderAll?.(),400);
}
async function login(){
 const loginValue=norm($('#loginUser')?.value);
 const passValue=$('#loginPass')?.value||'';
 const msg=$('#loginMsg');
 if(msg)msg.textContent='Entrando...';
 if(!loginValue.includes('@')){if(msg)msg.textContent='Use o e-mail institucional cadastrado no Supabase.'; return;}
 try{
   const profile=await window.VETORSupabase?.mainLogin?.(loginValue,passValue);
   if(!profile)throw new Error('Perfil não encontrado. Verifique a tabela perfis no Supabase.');
   const u=normalizeProfile(profile);
   saveUser(u,true); unlock(u); if(mustChangePassword(profile,u)) showPasswordModal(true); if(msg)msg.textContent='';
 }catch(e){if(msg)msg.textContent=friendlyAuthError(e); lock();}
}

async function logout(){
 try{await window.VETORSupabase?.logout?.();}catch(e){console.warn('Falha ao sair do Supabase:', e.message);}
 try{await window.VETORSupabase?.client?.auth?.signOut?.({scope:'local'});}catch(e){}
 clearUser();
 try{sessionStorage.setItem('vetor_force_logout','1');}catch(e){}
 lock();
 const msg=$('#loginMsg'); if(msg)msg.textContent='Sessão encerrada. Entre novamente para continuar.';
 setTimeout(()=>{location.replace(location.pathname+'?logout='+Date.now());},250);
}

function allowedTurmas(){
 const u=user();
 const all=window.TurmasVetor?.getTurmas?.()||{};
 if(!u)return {};
 if(u.all)return all;
 return Object.fromEntries(Object.entries(all).filter(([t])=>turmaOk(u,t)));
}
function filteredAssessments(){
 const u=user(), all=window.VETOR?.state?.assessments||[];
 if(!u)return [];
 if(u.all)return all;
 return all.filter(a=>assessmentOk(u,a));
}
function patchApp(){
 const app=window.VETOR; if(!app || app.__authPatched)return; app.__authPatched=true;
 const oldRender=app.renderAssessmentManager?.bind(app);
 if(oldRender){app.renderAssessmentManager=function(){oldRender(); filterAssessmentHistory();};}
}
function filterAssessmentHistory(){
 const u=user(); if(!u||u.all)return;
 document.querySelectorAll('#assessmentHistory .assessment-item').forEach(item=>{
   const txt=item.textContent||'';
   if(!turmaOk(u,txt)) item.style.display='none';
 });
}
function permissionsNav(){
 const u=user(); if(!u)return;
 document.querySelectorAll('[data-role-only]').forEach(el=>{
   const roles=String(el.dataset.roleOnly||'').split(',').map(x=>x.trim());
   el.style.display=roles.includes(u.role)?'':'none';
 });
}
function filterTurmaSelects(){
 const u=user(); if(!u)return;
 if(u.all)return;
 const ok=Object.keys(allowedTurmas());
 ['assessmentClass','turmaCadastroSelect','coordClassSelect','coordCompareClassSelect'].forEach(id=>{
   const sel=document.getElementById(id); if(!sel||!sel.options)return;
   Array.from(sel.options).forEach(op=>{if(op.value==='__varias_turmas__')return; if(op.value && !ok.includes(op.value) && !turmaOk(u,op.value)) op.hidden=true;});
 });
}
function filterBankUI(){
 const u=user(); if(!u)return;
 const canEdit=u.role!=='prof';
 document.querySelectorAll('[data-bank-admin]').forEach(el=>el.style.display=canEdit?'':'none');
}
function renderUsersAdmin(){
 const u=user();
 const box=$('#adminUsersStatus');
 if(!u||u.role!=='admin')return;
 if(box && !box.dataset.ready){
   box.dataset.ready='1';
   box.textContent='Painel administrativo pronto. Clique em Atualizar lista para carregar os perfis.';
   box.className='statusbox status-work';
 }
}

function showPasswordModal(required=false){
 const modal=$('#passwordModal'); if(!modal)return;
 modal.classList.add('show'); modal.dataset.required=required?'1':'0';
 $('#passwordModalHint')&&($('#passwordModalHint').textContent=required?'Por segurança, troque a senha temporária antes de continuar.':'Digite uma nova senha para sua conta.');
 $('#passwordMsg')&&($('#passwordMsg').textContent='');
 if(required){ $('#cancelPasswordBtn')&&($('#cancelPasswordBtn').style.display='none'); } else { $('#cancelPasswordBtn')&&($('#cancelPasswordBtn').style.display=''); }
 setTimeout(()=>$('#newPassword1')?.focus(),100);
}
function hidePasswordModal(){const modal=$('#passwordModal'); if(!modal)return; if(modal.dataset.required==='1')return; modal.classList.remove('show');}
async function saveNewPassword(){
 const p1=$('#newPassword1')?.value||'', p2=$('#newPassword2')?.value||'', msg=$('#passwordMsg');
 if(p1.length<6){if(msg)msg.textContent='A senha deve ter pelo menos 6 caracteres.'; return;}
 if(p1!==p2){if(msg)msg.textContent='As senhas não conferem.'; return;}
 try{
   if(msg)msg.textContent='Salvando nova senha...';
   const client=window.VETORSupabase?.client;
   if(!client)throw new Error('Cliente Supabase não inicializado.');
   const {error}=await client.auth.updateUser({password:p1});
   if(error)throw error;
   const u=user();
   try{const uid=window.VETORSupabase?.session?.user?.id || (await client.auth.getUser()).data?.user?.id; if(uid) await client.from('perfis').update({senha_temporaria:false, senha_alterada_em:new Date().toISOString()}).eq('id', uid);}catch(e){console.warn('Colunas de senha temporária não configuradas ainda:',e.message);}
   try{if(u?.login)localStorage.setItem('vetor_pw_changed_'+u.login,'1');}catch(e){}
   $('#newPassword1')&&($('#newPassword1').value=''); $('#newPassword2')&&($('#newPassword2').value='');
   const modal=$('#passwordModal'); if(modal){modal.dataset.required='0'; modal.classList.remove('show');}
   if(msg)msg.textContent='Senha alterada com sucesso.';
 }catch(e){if(msg)msg.textContent=e.message||'Erro ao alterar senha.';}
}
function mustChangePassword(profile,u){
 if(profile && profile.senha_temporaria===true)return true;
 return false;
}
function applySystemVisibility(){
 const u=user(); if(!u)return;
 const isAdmin=u.role==='admin';
 $$('[data-view="usuariosAdmin"], [data-view="config"], #usuariosAdmin, #config').forEach(el=>{el.style.display=isAdmin?'':'none';});
 const canManageTurmas=(u.role==='admin'||u.role==='coord');
 $$('[data-view="turmasAlunos"], #turmasAlunos').forEach(el=>{el.style.display=canManageTurmas?'':'none';});
}
function bindPasswordButtons(){
 ['changePasswordTop','changePasswordSide'].forEach(id=>{$('#'+id)&&($('#'+id).onclick=()=>showPasswordModal(false));});
 $('#savePasswordBtn')&&($('#savePasswordBtn').onclick=saveNewPassword);
 $('#cancelPasswordBtn')&&($('#cancelPasswordBtn').onclick=hidePasswordModal);
}
async function adminLoadProfiles(){
 const status=$('#adminUsersStatus'), list=$('#adminPerfisList'), profSel=$('#adminVinculoProfessor'), turmaBox=$('#adminTurmasChecklist');
 const client=window.VETORSupabase?.client; const u=user();
 if(!client||!u||u.role!=='admin')return;
 try{
   if(status)status.textContent='Carregando perfis...';
   const [{data:perfis,error:e1},{data:turmas,error:e2}]=await Promise.all([
     client.from('perfis').select('*').order('nome'),
     client.from('turmas').select('*').order('nome')
   ]);
   if(e1)throw e1; if(e2)throw e2;
   window.__vetorAdminPerfis=perfis||[]; window.__vetorAdminTurmas=turmas||[];
   if(list)list.innerHTML=(perfis||[]).map(p=>`<div class="admin-user-row"><div><b>${safe(p.nome)}</b><br><small>${safe(p.email)}</small></div><span>${safe(p.perfil)}</span><span>${safe(p.disciplina||'-')}</span><small>${p.senha_temporaria?'Senha temporária':'Senha ok'}</small><div class="row-actions"><button class="secondary" data-edit-perfil="${safe(p.id)}">Editar</button><button class="danger" data-del-perfil="${safe(p.id)}">Remover perfil</button></div></div>`).join('')||'<p class="hint">Nenhum perfil cadastrado.</p>';
   if(profSel)profSel.innerHTML=(perfis||[]).filter(p=>String(p.perfil).includes('prof')).map(p=>`<option value="${safe(p.id)}">${safe(p.nome)} — ${safe(p.email)}</option>`).join('');
   if(turmaBox)turmaBox.innerHTML=(turmas||[]).map(t=>`<label class="turma-check"><input type="checkbox" value="${safe(t.id)}"> ${safe(t.nome)} <small>${safe(t.serie||'')}</small></label>`).join('');
   if(status){status.textContent='Perfis carregados.'; status.className='statusbox status-ok';}
 }catch(e){if(status){status.textContent='Erro ao carregar perfis: '+e.message; status.className='statusbox status-error';}}
}
async function adminSaveProfile(){
 const client=window.VETORSupabase?.client, status=$('#adminUsersStatus'); if(!client)return;
 const row={id:norm($('#adminPerfilId')?.value), nome:norm($('#adminPerfilNome')?.value), email:norm($('#adminPerfilEmail')?.value), perfil:$('#adminPerfilTipo')?.value||'professor', disciplina:$('#adminPerfilDisciplina')?.value||null, senha_temporaria:($('#adminPerfilSenhaTemp')?.value||'true')==='true'};
 if(!row.id||!row.nome||!row.email){if(status)status.textContent='Informe UID, nome e e-mail.';return;}
 try{const {error}=await client.from('perfis').upsert(row,{onConflict:'id'}); if(error)throw error; if(status){status.textContent='Perfil salvo.';status.className='statusbox status-ok';} adminLoadProfiles();}
 catch(e){if(status){status.textContent='Erro ao salvar perfil: '+e.message;status.className='statusbox status-error';}}
}
async function adminDeleteProfile(id){
 if(!confirm('Remover este perfil do VETOR? A conta no Supabase Auth não será excluída.'))return;
 const client=window.VETORSupabase?.client, status=$('#adminUsersStatus');
 try{const {error}=await client.from('perfis').delete().eq('id',id); if(error)throw error; if(status){status.textContent='Perfil removido.';status.className='statusbox status-ok';} adminLoadProfiles();}
 catch(e){if(status){status.textContent='Erro ao remover perfil: '+e.message;status.className='statusbox status-error';}}
}
function adminEditProfile(id){
 const p=(window.__vetorAdminPerfis||[]).find(x=>x.id===id); if(!p)return;
 $('#adminPerfilId')&&($('#adminPerfilId').value=p.id); $('#adminPerfilNome')&&($('#adminPerfilNome').value=p.nome||''); $('#adminPerfilEmail')&&($('#adminPerfilEmail').value=p.email||''); $('#adminPerfilTipo')&&($('#adminPerfilTipo').value=p.perfil||'professor'); $('#adminPerfilDisciplina')&&($('#adminPerfilDisciplina').value=p.disciplina||''); $('#adminPerfilSenhaTemp')&&($('#adminPerfilSenhaTemp').value=p.senha_temporaria?'true':'false');
}
async function adminLoadVinculos(){
 const client=window.VETORSupabase?.client, pid=$('#adminVinculoProfessor')?.value; if(!client||!pid)return;
 const disc=$('#adminVinculoDisciplina')?.value||'Português';
 const {data,error}=await client.from('professor_turmas').select('turma_id,disciplina').eq('professor_id',pid).eq('disciplina',disc);
 if(error){alert('Erro ao carregar vínculos: '+error.message);return;}
 const ids=new Set((data||[]).map(x=>x.turma_id));
 $$('#adminTurmasChecklist input[type="checkbox"]').forEach(ch=>ch.checked=ids.has(ch.value));
}
async function adminSaveVinculos(){
 const client=window.VETORSupabase?.client, pid=$('#adminVinculoProfessor')?.value; if(!client||!pid)return;
 const disc=$('#adminVinculoDisciplina')?.value||'Português';
 const checked=$$('#adminTurmasChecklist input[type="checkbox"]:checked').map(ch=>ch.value);
 try{
   let del=await client.from('professor_turmas').delete().eq('professor_id',pid).eq('disciplina',disc); if(del.error)throw del.error;
   if(checked.length){const rows=checked.map(tid=>({professor_id:pid,turma_id:tid,disciplina:disc})); const ins=await client.from('professor_turmas').insert(rows); if(ins.error)throw ins.error;}
   alert('Vínculos salvos.');
 }catch(e){alert('Erro ao salvar vínculos: '+e.message);}
}
async function adminResetPasswordEmail(){
 const email=norm($('#adminResetEmail')?.value), client=window.VETORSupabase?.client; if(!email||!client)return;
 try{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.href}); if(error)throw error; alert('Se o e-mail for real e o SMTP estiver configurado, o link de redefinição será enviado.');}
 catch(e){alert('Erro ao solicitar redefinição: '+e.message);}
}
function adminCopyResetInstruction(){
 const email=norm($('#adminResetEmail')?.value)||'email@vetor.edu'; const senha=$('#adminSenhaSugerida')?.value||'Vetor123@';
 const txt=`No Supabase, acesse Authentication → Users, selecione ${email}, redefina a senha para ${senha} e marque senha_temporaria=true na tabela perfis para exigir troca no próximo login.`;
 navigator.clipboard?.writeText(txt); alert('Instrução copiada.');
}

function getAdminEdgeUrl(){
 const v=norm($('#adminEdgeFunctionUrl')?.value)||localStorage.getItem('vetor_admin_edge_url')||'';
 if(v)try{localStorage.setItem('vetor_admin_edge_url',v)}catch(e){}
 return v;
}
async function adminCreateAuthUser(){
 const client=window.VETORSupabase?.client, status=$('#adminUsersStatus');
 if(!client)return;
 const nome=norm($('#adminPerfilNome')?.value), email=norm($('#adminPerfilEmail')?.value), perfil=$('#adminPerfilTipo')?.value||'professor', disciplina=$('#adminPerfilDisciplina')?.value||null;
 const password=$('#adminPerfilSenhaInicial')?.value||'Vetor123@';
 const senha_temporaria=($('#adminPerfilSenhaTemp')?.value||'true')==='true';
 if(!nome||!email||!password){if(status){status.textContent='Informe nome, e-mail e senha inicial.'; status.className='statusbox status-error';}return;}
 try{
   if(status){status.textContent='Criando usuário...'; status.className='statusbox status-work';}
   let uid=null;
   const edge=getAdminEdgeUrl();
   if(edge){
     const token=(await client.auth.getSession()).data?.session?.access_token;
     const resp=await fetch(edge,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'createUser',nome,email,password,perfil,disciplina,senha_temporaria})});
     const js=await resp.json().catch(()=>({}));
     if(!resp.ok)throw new Error(js.error||'Edge Function recusou a criação do usuário.');
     uid=js.id||js.user?.id||js.data?.user?.id;
   }else{
     // Sem Service Role/Edge Function, o navegador não consegue criar usuário confirmado com segurança.
     // Tentativa alternativa: signUp em cliente secundário. Funciona apenas se o Supabase permitir cadastro e confirmação de e-mail estiver adequada.
     const url=window.VETORSupabase?.url||localStorage.getItem('vetor_supabase_url');
     const key=window.VETORSupabase?.anonKey||localStorage.getItem('vetor_supabase_anon');
     if(!url||!key)throw new Error('Configure a Edge Function administrativa ou cadastre o usuário no Supabase Auth e cole o UID.');
     const tempClient=window.supabase.createClient(url,key,{auth:{storageKey:'vetor_admin_temp_auth',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
     const out=await tempClient.auth.signUp({email,password,options:{data:{nome,perfil}}});
     if(out.error)throw out.error;
     uid=out.data?.user?.id;
     if(!uid)throw new Error('Usuário enviado para cadastro, mas sem UID retornado. Confirme no Supabase Auth e cole o UID no perfil.');
   }
   if(!uid)throw new Error('A conta foi criada, mas não recebi o UID do Auth.');
   $('#adminPerfilId')&&($('#adminPerfilId').value=uid);
   const row={id:uid,nome,email,perfil,disciplina,senha_temporaria};
   const {error}=await client.from('perfis').upsert(row,{onConflict:'id'});
   if(error)throw error;
   if(status){status.textContent='Conta/perfil criados. O primeiro login exigirá troca de senha se marcado.'; status.className='statusbox status-ok';}
   await adminLoadProfiles();
 }catch(e){if(status){status.textContent='Não foi possível criar pelo site: '+(e.message||e); status.className='statusbox status-error';}}
}
async function adminResetSenhaEdge(){
 const client=window.VETORSupabase?.client, status=$('#adminUsersStatus');
 const email=norm($('#adminResetEmail')?.value), password=$('#adminSenhaSugerida')?.value||'Vetor123@';
 if(!client||!email)return;
 try{
   const edge=getAdminEdgeUrl();
   if(!edge)throw new Error('Configure a URL da Edge Function administrativa. Sem ela, use o reset manual no Supabase Auth.');
   const token=(await client.auth.getSession()).data?.session?.access_token;
   const resp=await fetch(edge,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:'resetPassword',email,password,senha_temporaria:true})});
   const js=await resp.json().catch(()=>({}));
   if(!resp.ok)throw new Error(js.error||'Edge Function recusou o reset.');
   await client.from('perfis').update({senha_temporaria:true}).eq('email',email);
   if(status){status.textContent='Senha temporária redefinida e troca obrigatória marcada.'; status.className='statusbox status-ok';}
 }catch(e){if(status){status.textContent='Reset pelo site indisponível: '+e.message; status.className='statusbox status-error';}}
}

function bindAdminUI(){
 $('#adminSalvarPerfil')&&($('#adminSalvarPerfil').onclick=adminSaveProfile);
 $('#adminLimparPerfil')&&($('#adminLimparPerfil').onclick=()=>['adminPerfilId','adminPerfilNome','adminPerfilEmail'].forEach(id=>{$('#'+id)&&($('#'+id).value='')}));
 $('#adminAtualizarUsuarios')&&($('#adminAtualizarUsuarios').onclick=adminLoadProfiles);
 $('#adminCarregarVinculos')&&($('#adminCarregarVinculos').onclick=adminLoadVinculos);
 $('#adminSalvarVinculos')&&($('#adminSalvarVinculos').onclick=adminSaveVinculos);
 $('#adminVinculoProfessor')&&($('#adminVinculoProfessor').onchange=adminLoadVinculos);
 $('#adminVinculoDisciplina')&&($('#adminVinculoDisciplina').onchange=adminLoadVinculos);
 $('#adminEnviarResetSenha')&&($('#adminEnviarResetSenha').onclick=adminResetPasswordEmail);
 $('#adminResetSenhaEdge')&&($('#adminResetSenhaEdge').onclick=adminResetSenhaEdge);
 $('#adminCriarUsuarioAuth')&&($('#adminCriarUsuarioAuth').onclick=adminCreateAuthUser);
 $('#adminCopiarInstrucaoSenha')&&($('#adminCopiarInstrucaoSenha').onclick=adminCopyResetInstruction);
 document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit-perfil]'); if(edit)adminEditProfile(edit.dataset.editPerfil); const del=e.target.closest('[data-del-perfil]'); if(del)adminDeleteProfile(del.dataset.delPerfil);});
}

function applyPermissions(){
 if(!user())return;
 patchApp(); permissionsNav(); filterTurmaSelects(); filterBankUI(); applySystemVisibility(); renderUsersAdmin(); if(user()?.role==='admin') setTimeout(adminLoadProfiles,300);
}

function restoreFromSupabase(){
 if(sessionStorage.getItem('vetor_force_logout')==='1'){sessionStorage.removeItem('vetor_force_logout'); clearUser(); lock(); return;}
 const cached=user();
 if(cached) unlock(cached); else lock();
 setTimeout(()=>{
   const profile=window.VETORSupabase?.profile;
   if(profile){const u=normalizeProfile(profile); saveUser(u,true); unlock(u); if(mustChangePassword(profile,u)) showPasswordModal(true);}
 },1400);
}

function bind(){
 bindPasswordButtons(); bindAdminUI();
 $('#loginBtn')&&($('#loginBtn').onclick=login);
 $('#logoutBtn')&&($('#logoutBtn').onclick=logout);
 $('#logoutBtnSide')&&($('#logoutBtnSide').onclick=logout);
 $('#loginPass')&&($('#loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')login();}));
 $('#loginUser')&&($('#loginUser').addEventListener('keydown',e=>{if(e.key==='Enter')login();}));
 document.addEventListener('click',e=>{if(e.target.closest('#logoutBtn'))logout();});
}
document.addEventListener('DOMContentLoaded',()=>{bind(); restoreFromSupabase();});
window.AuthSupabase={user,get USERS(){return []},assessmentOk,turmaOk,disciplineOk,allowedTurmas,filteredAssessments,applyPermissions,logout,showPasswordModal,adminLoadProfiles};
})();

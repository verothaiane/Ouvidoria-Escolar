/* ===================== Navegação ===================== */
function goTo(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('nav.mainnav button').forEach(b=>b.classList.toggle('active', b.dataset.page===page));
  window.scrollTo({top:0,behavior:'smooth'});
  if(page==='equipe'){ renderEquipeView(); }
}

/* ===================== Utilidades ===================== */
function randCode(len, chars){
  let s='';
  for(let i=0;i<len;i++) s+=chars[Math.floor(Math.random()*chars.length)];
  return s;
}
function genProtocol(){ return 'OE-'+randCode(6,'0123456789'); }
function genPassword(){ return randCode(8,'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'); }
function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}) + ' às ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function badgeClass(status){
  if(status==='Recebido') return 'recebido';
  if(status==='Em análise') return 'analise';
  return 'concluido';
}

/* ===================== Armazenamento (persistente, compartilhado) ===================== */
/* Os relatos ficam em armazenamento compartilhado deste site para que a equipe da ouvidoria
   consiga visualizá-los e atualizá-los. Isso significa que os dados dos relatos são
   acessíveis a qualquer pessoa que use este mesmo site/artefato — não é um servidor privado. */
async function getIndex(){
  try{
    const r = await window.storage.get('reports-index', true);
    return r ? JSON.parse(r.value) : [];
  }catch(e){ return []; }
}
async function saveIndex(list){
  try{ await window.storage.set('reports-index', JSON.stringify(list), true); }catch(e){}
}
async function getReport(protocol){
  try{
    const r = await window.storage.get('report:'+protocol, true);
    return r ? JSON.parse(r.value) : null;
  }catch(e){ return null; }
}
async function saveReport(report){
  try{ await window.storage.set('report:'+report.protocol, JSON.stringify(report), true); }catch(e){}
}

/* ===================== Enviar relato ===================== */
document.getElementById('evidencias').addEventListener('change', (e)=>{
  const list = document.getElementById('file-list');
  list.innerHTML = '';
  Array.from(e.target.files).slice(0,5).forEach(f=>{
    const div = document.createElement('div');
    div.textContent = '📄 ' + f.name;
    list.appendChild(div);
  });
});

function toggleContact(){
  const anon = document.getElementById('anonimo').checked;
  document.getElementById('contact-fields').classList.toggle('show', !anon);
  document.getElementById('anon-desc').textContent = anon
    ? 'Marcado: nenhum dado pessoal é pedido e nenhum IP é registrado. Você acompanha o caso apenas pelo código e senha gerados no final.'
    : 'Desmarcado: você poderá informar dados de contato para que a equipe retorne diretamente. O acompanhamento pelo código continua disponível.';
}

document.getElementById('relato-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg = document.getElementById('relato-msg');
  msg.className='status-msg'; msg.textContent='';

  const categoria = document.getElementById('categoria').value;
  const titulo = document.getElementById('titulo').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  const anonimo = document.getElementById('anonimo').checked;
  const termos = document.getElementById('termos').checked;
  
  if(!termos){
    msg.textContent = 'É preciso confirmar que leu a política de privacidade e os termos de uso.';
    msg.classList.add('show','error');
    return;
  }

  // Pegando os dados de contato (se não for anônimo)
  const contato_nome = anonimo ? null : document.getElementById('nome').value.trim();
  const contato_vinculo = anonimo ? null : document.getElementById('vinculo').value.trim();
  const contato_dado = anonimo ? null : document.getElementById('email').value.trim();

  const protocolo = genProtocol();
  const senha = genPassword();

  // Montando o pacote de dados para enviar ao Node.js
  const dadosRelato = {
    protocolo, senha, categoria, titulo, descricao, anonimo, 
    contato_nome, contato_vinculo, contato_dado
  };

  try {
    // Fazendo a requisição para a nossa API
    const response = await fetch('https://ouvidoria-escolar.onrender.com/api/relatos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosRelato)
    });

    if(response.ok) {
      document.getElementById('relato-form').style.display='none';
      const box = document.getElementById('protocol-box');
      document.getElementById('protocol-code').textContent = protocolo;
      document.getElementById('protocol-pass').textContent = senha;
      box.classList.add('show');
      msg.textContent = 'Relato enviado com sucesso e salvo no banco de dados!';
      msg.classList.add('show','success');
    } else {
      msg.textContent = 'Erro ao salvar o relato no servidor.';
      msg.classList.add('show','error');
    }
  } catch(erro) {
    msg.textContent = 'Erro de conexão com o servidor. Verifique se o Node.js está rodando.';
    msg.classList.add('show','error');
    console.error(erro);
  }
});

/* ===================== Acompanhar ===================== */
document.getElementById('track-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const msg = document.getElementById('track-msg');
  msg.className='status-msg'; msg.textContent='';
  document.getElementById('track-result').style.display='none';

  const code = document.getElementById('tcode').value.trim().toUpperCase();
  const pass = document.getElementById('tpass').value.trim();

  try {
    // Consulta a nossa API no Node.js
    const response = await fetch('https://ouvidoria-escolar.onrender.com/api/acompanhar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolo: code, senha: pass })
    });

    if (!response.ok) {
      msg.textContent = 'Código ou senha inválidos. Verifique os dados recebidos no envio do relato.';
      msg.classList.add('show','error');
      return;
    }

    // Recebe os dados do banco de dados formatados
    const report = await response.json();

    // Preenche os dados na tela
    document.getElementById('tr-title').textContent = report.titulo;
    document.getElementById('tr-badge').textContent = report.status;
    document.getElementById('tr-badge').className = 'badge '+badgeClass(report.status);
    document.getElementById('tr-meta').textContent = report.categoria + ' · Enviado em ' + fmtDate(report.createdAt);

    // Constrói a linha do tempo do histórico
    const tl = document.getElementById('tr-timeline');
    tl.innerHTML='';
    report.history.slice().reverse().forEach(h=>{
      const item = document.createElement('div');
      item.className='tl-item';
      item.innerHTML = `<div class="tl-dot"></div><div class="tl-body">
        <div class="tl-title">${h.status}</div>
        <div class="tl-date">${fmtDate(h.date)}</div>
        <div class="tl-note">${h.note||''}</div>
      </div>`;
      tl.appendChild(item);
    });

    // Mostra o resultado na tela
    document.getElementById('track-result').style.display='block';

  } catch(erro) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.classList.add('show','error');
    console.error(erro);
  }
});

/* ===================== Equipe: Login ===================== */
let sessionUser = null;

document.getElementById('login-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const msg = document.getElementById('login-msg');

  msg.className = 'status-msg';
  msg.textContent = '';

  try {
    const response = await fetch('https://ouvidoria-escolar.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (!response.ok) {
      msg.textContent = 'E-mail ou senha incorretos.';
      msg.classList.add('show','error');
      return;
    }

    const data = await response.json();
    sessionUser = data.usuario; // Guarda os dados da diretoria na sessão

    // Muda a tela para o painel de administração
    document.getElementById('equipe-login').style.display = 'none';
    document.getElementById('equipe-dash').style.display = 'block';
    document.getElementById('dash-who').textContent = sessionUser.nome + ' · ' + sessionUser.email;
    
    // Chama a função que vai carregar os relatos (faremos ela a seguir)
    loadDashboard();

  } catch (erro) {
    msg.textContent = 'Erro de conexão com o servidor. Verifique se o Node.js está rodando.';
    msg.classList.add('show','error');
    console.error(erro);
  }
});

function staffLogout(){
  sessionUser = null;
  document.getElementById('equipe-login').style.display = 'block';
  document.getElementById('equipe-dash').style.display = 'none';
  document.getElementById('login-form').reset();
}

function renderEquipeView(){
  if(sessionUser){
    document.getElementById('equipe-login').style.display = 'none';
    document.getElementById('equipe-dash').style.display = 'block';
    loadDashboard();
  }
}

/* ===================== Painel da equipe ===================== */
let currentFilter = 'todos';
let cachedReports = [];

function setFilter(f){
  currentFilter = f;
  document.querySelectorAll('#dash-filters button').forEach(b => b.classList.toggle('active', b.dataset.f === f));
  renderList();
}

async function loadDashboard(){
  try {
    const response = await fetch('https://ouvidoria-escolar.onrender.com/api/relatos');
    cachedReports = await response.json();
    renderList();
  } catch(e) {
    console.error('Erro ao buscar relatos:', e);
  }
}

function renderList(){
  const list = document.getElementById('dash-list');
  const items = currentFilter === 'todos' ? cachedReports : cachedReports.filter(r => r.status === currentFilter);
  
  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">Nenhum relato encontrado nesta categoria.</div>';
    return;
  }
  list.innerHTML = '';
  
  items.forEach(r => {
    const row = document.createElement('div');
    row.className = 'report-row';
    row.onclick = () => openModal(r.protocolo);
    row.innerHTML = `
      <div class="r-top">
        <span class="r-title">${r.titulo}</span>
        <span class="badge ${badgeClass(r.status)}">${r.status}</span>
      </div>
      <div class="r-meta">${r.protocolo} · ${r.categoria} · ${r.anonimo ? 'Anônimo' : (r.contato_nome || 'Identificado')} · ${fmtDate(r.createdAt)}</div>
    `;
    list.appendChild(row);
  });
}

async function openModal(protocolo){
  try {
    const response = await fetch(`https://ouvidoria-escolar.onrender.com/api/relatos/${protocolo}`);
    if(!response.ok) return;
    
    const r = await response.json();
    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const statuses = ['Recebido','Em análise','Concluído'];
    
    body.innerHTML = `
      <button class="close-x" onclick="closeModal()">✕</button>
      <div class="hint" style="margin-bottom:4px;">${r.protocolo} · ${r.categoria}</div>
      <h3>${r.titulo}</h3>
      <div class="r-meta">${r.anonimo ? 'Relato anônimo' : 'Relato identificado'} · Enviado em ${fmtDate(r.data_criacao)}</div>
      ${!r.anonimo && r.contato_nome ? `<div class="desc-block" style="margin-top:10px;"><strong>Contato:</strong> ${r.contato_nome||'-'} · ${r.contato_vinculo||'-'} · ${r.contato_dado||'-'}</div>` : ''}
      <div class="desc-block">${r.descricao}</div>
      
      <h4 style="margin-bottom:8px;">Atualizar status</h4>
      <div class="status-actions" id="status-actions">
        ${statuses.map(s=>`<button class="${s===r.status?'current':''}" onclick="updateStatus('${r.protocolo}','${s}')">${s}</button>`).join('')}
      </div>
      <div class="field">
        <label for="note-input">Adicionar observação interna</label>
        <textarea id="note-input" placeholder="Ex: aluno chamado à orientação, responsáveis notificados..." style="min-height:80px;"></textarea>
        <button class="btn btn-dark" style="margin-top:10px;" onclick="addNote('${r.protocolo}')">Salvar observação</button>
      </div>
      <h4>Histórico</h4>
      <div class="note-log">
        ${r.history.slice().reverse().map(h=>`<div class="note-item"><div class="n-date">${fmtDate(h.date)} · ${h.status}</div>${h.note||''}</div>`).join('')}
      </div>
    `;
    overlay.classList.add('show');
  } catch(e) { console.error(e); }
}

function closeModal(){
  document.getElementById('modal-overlay').classList.remove('show');
}

async function updateStatus(protocolo, status){
  try {
    await fetch(`https://ouvidoria-escolar.onrender.com/api/relatos/${protocolo}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    await loadDashboard(); // Recarrega a lista no fundo
    openModal(protocolo);  // Atualiza o modal aberto
  } catch(e) { console.error(e); }
}

async function addNote(protocolo){
  const note = document.getElementById('note-input').value.trim();
  if(!note) return;
  
  try {
    await fetch(`https://ouvidoria-escolar.onrender.com/api/relatos/${protocolo}/nota`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    await loadDashboard();
    openModal(protocolo);
  } catch(e) { console.error(e); }
}
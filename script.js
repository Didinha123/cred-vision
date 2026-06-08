/* CredVision — JavaScript */

/* ════════════════════════════════════════
   LOGIN & CONTROLE DE ACESSO
════════════════════════════════════════ */
var userRole    = null;
var currentUser = null;
var users = [];

function showRegisterPanel() {
  document.getElementById("login-panel").style.display    = "none";
  document.getElementById("register-panel").style.display = "block";
  document.getElementById("recover-panel").style.display  = "none";
  document.getElementById("register-err").textContent     = "";
  ["r-user","r-pass","r-pass2","r-answer"].forEach(function(id){ document.getElementById(id).value = ""; });
  document.getElementById("r-question").value = "";
}
function showLoginPanel() {
  document.getElementById("register-panel").style.display = "none";
  document.getElementById("recover-panel").style.display  = "none";
  document.getElementById("login-panel").style.display    = "block";
  document.getElementById("login-err").textContent        = "";
}
function showRecoverPanel() {
  document.getElementById("login-panel").style.display    = "none";
  document.getElementById("register-panel").style.display = "none";
  document.getElementById("recover-panel").style.display  = "block";
  document.getElementById("recover-err").textContent      = "";
  document.getElementById("rec-user").value               = "";
  document.getElementById("recover-step1").style.display  = "block";
  document.getElementById("recover-step2").style.display  = "none";
}

var _recoverTarget = null;

function recoverStep1() {
  var u   = document.getElementById("rec-user").value.trim();
  var err = document.getElementById("recover-err");
  err.style.color = "#E05A3A";
  if (!u) { err.textContent = "Digite seu usuário."; return; }
  var found = users.find(function(x){ return x.login === u; });
  if (!found) { err.textContent = "Usuário não encontrado."; return; }
  if (!found.question || !found.answer) {
    err.textContent = "Esta conta não possui pergunta de segurança."; return;
  }
  _recoverTarget = found;
  err.textContent = "";
  var qMap = {
    pet:"Qual o nome do seu primeiro animal de estimação?",
    city:"Em qual cidade você nasceu?",
    mother:"Qual o primeiro nome da sua mãe?",
    school:"Qual foi sua primeira escola?",
    food:"Qual sua comida favorita?"
  };
  document.getElementById("rec-question-text").textContent = "🔐 " + (qMap[found.question] || found.question);
  document.getElementById("recover-step1").style.display = "none";
  document.getElementById("recover-step2").style.display = "block";
  ["rec-answer","rec-newpass","rec-newpass2"].forEach(function(id){ document.getElementById(id).value = ""; });
}

function recoverStep2() {
  var ans = document.getElementById("rec-answer").value.trim().toLowerCase();
  var np  = document.getElementById("rec-newpass").value.trim();
  var np2 = document.getElementById("rec-newpass2").value.trim();
  var err = document.getElementById("recover-err");
  err.style.color = "#E05A3A";
  if (!ans)       { err.textContent = "Digite a resposta."; return; }
  if (!np || !np2){ err.textContent = "Preencha a nova senha."; return; }
  if (np !== np2) { err.textContent = "As senhas não conferem."; return; }
  if (np.length < 4){ err.textContent = "Senha deve ter pelo menos 4 caracteres."; return; }
  if (ans !== _recoverTarget.answer.toLowerCase()) { err.textContent = "Resposta incorreta."; return; }
  _recoverTarget.pass = np;
  persist();
  _recoverTarget = null;
  err.style.color = "#4CAF50";
  err.textContent = "✅ Senha redefinida com sucesso!";
  setTimeout(function(){ showLoginPanel(); }, 1500);
}

function doLogin() {
  var u   = document.getElementById("l-user").value.trim();
  var p   = document.getElementById("l-pass").value.trim();
  var err = document.getElementById("login-err");
  if (!u || !p) { err.textContent = "Preencha usuário e senha."; return; }
  err.textContent = "";
  var found = users.find(function(x){ return x.login === u && x.pass === p; });
  if (!found) { err.textContent = "Usuário ou senha incorretos."; return; }
  var endsAdmin = u.slice(-5) === "admin" && p.slice(-5) === "admin";
  var isExactAdmin = (u === "admin" && p === "admin");
  var isAdmin = endsAdmin && !isExactAdmin;
  userRole    = isAdmin ? "admin" : found.role;
  currentUser = found.login;
  /* Salva sessão no localStorage para persistir entre recargas */
  localStorage.setItem("cv_session", JSON.stringify({ user: currentUser, role: userRole }));
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("sidebar-username").textContent = currentUser;
  document.getElementById("sidebar-userrole").textContent = userRole === "admin" ? "Administrador" : "Usuário";
  var cadPanel = document.getElementById("cad-panel");
  var cadGrid  = document.querySelector("#tab-cadastro > div");
  if (userRole === "admin") {
    document.querySelectorAll(".nav-item").forEach(function(el){ el.style.display = ""; });
    if (cadPanel) cadPanel.style.display = "";
    if (cadGrid)  cadGrid.style.gridTemplateColumns = "";
    showTab("dashboard");
  } else {
    document.querySelectorAll(".nav-item").forEach(function(el, i) {
      el.style.display = (i === 2) ? "" : "none";
    });
    if (cadPanel) cadPanel.style.display = "none";
    if (cadGrid)  cadGrid.style.gridTemplateColumns = "1fr";
    showTab("cadastro");
  }
}

function doRegister() {
  var u   = document.getElementById("r-user").value.trim();
  var p   = document.getElementById("r-pass").value.trim();
  var p2  = document.getElementById("r-pass2").value.trim();
  var q   = document.getElementById("r-question").value;
  var a   = document.getElementById("r-answer").value.trim();
  var err = document.getElementById("register-err");
  err.style.color = "#E05A3A";
  if (!u || !p || !p2) { err.textContent = "Preencha todos os campos."; return; }
  if (u.length < 3)    { err.textContent = "Usuário deve ter pelo menos 3 caracteres."; return; }
  if (p.length < 4)    { err.textContent = "Senha deve ter pelo menos 4 caracteres."; return; }
  if (p !== p2)        { err.textContent = "As senhas não conferem."; return; }
  if (!q)              { err.textContent = "Escolha uma pergunta de segurança."; return; }
  if (!a)              { err.textContent = "Digite a resposta da pergunta de segurança."; return; }
  if (users.find(function(x){ return x.login === u; })) { err.textContent = "Este usuário já existe."; return; }
  var newRole = (u.slice(-5) === "admin" && p.slice(-5) === "admin") ? "admin" : "user";
  users.push({ login: u, pass: p, role: newRole, question: q, answer: a });
  persist();
  err.style.color = "#4CAF50";
  err.textContent = "✅ Conta criada! Agora faça login.";
  setTimeout(function(){
    showLoginPanel();
    document.getElementById("l-user").value = u;
    document.getElementById("l-pass").focus();
  }, 1200);
}

function doLogout() {
  userRole    = null;
  currentUser = null;
  /* Remove sessão salva */
  localStorage.removeItem("cv_session");
  document.querySelectorAll(".nav-item").forEach(function(el){ el.style.display = ""; });
  document.getElementById("l-user").value = "";
  document.getElementById("l-pass").value = "";
  document.getElementById("login-err").textContent = "";
  showLoginPanel();
  document.getElementById("login-screen").style.display = "flex";
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("l-pass").addEventListener("keydown", function(e){ if(e.key==="Enter") doLogin(); });
  document.getElementById("l-user").addEventListener("keydown", function(e){ if(e.key==="Enter") document.getElementById("l-pass").focus(); });
  document.getElementById("r-user").addEventListener("keydown", function(e){ if(e.key==="Enter") document.getElementById("r-pass").focus(); });
  document.getElementById("r-pass").addEventListener("keydown", function(e){ if(e.key==="Enter") document.getElementById("r-pass2").focus(); });
  document.getElementById("r-pass2").addEventListener("keydown", function(e){ if(e.key==="Enter") doRegister(); });
  document.getElementById("rec-user").addEventListener("keydown", function(e){ if(e.key==="Enter") recoverStep1(); });
  document.getElementById("rec-answer").addEventListener("keydown", function(e){ if(e.key==="Enter") document.getElementById("rec-newpass").focus(); });
  document.getElementById("rec-newpass").addEventListener("keydown", function(e){ if(e.key==="Enter") document.getElementById("rec-newpass2").focus(); });
  document.getElementById("rec-newpass2").addEventListener("keydown", function(e){ if(e.key==="Enter") recoverStep2(); });
});

/* ════════════════════════════════════════
   MODO ASSINATURA — CORREÇÕES PRINCIPAIS
════════════════════════════════════════ */
var sigModeDrawing      = false;
var sigModeHasMark      = false;
var sigModeLoanId       = null;
var _sigModeEmbeddedLoan = null;

/* ── FIX 1: detecta modo assinatura e preenche dados imediatamente ── */
function checkSignatureMode() {
  var hash = window.location.hash;
  if (!hash || hash.indexOf("sign=") === -1) return false;

  var hashBody = hash.substring(1);
  var params = {};
  hashBody.split("&").forEach(function(part) {
    var kv = part.split("=");
    if (kv.length >= 2) params[kv[0]] = kv.slice(1).join("=");
  });

  sigModeLoanId = params["sign"] || null;

  /* Decodifica dados embutidos no link */
  if (params["d"]) {
    try {
      _sigModeEmbeddedLoan = JSON.parse(decodeURIComponent(escape(atob(params["d"]))));
    } catch(e) { _sigModeEmbeddedLoan = null; }
  }

  document.getElementById("login-screen").style.display     = "none";
  document.getElementById("sig-mode").style.display          = "block";
  document.getElementById("app-layout-wrap").style.display   = "none";

  /* Copia logo */
  var logoEl = document.querySelector(".sidebar-logo-img");
  if (logoEl) document.getElementById("sig-mode-logo").src = logoEl.src;

  /* FIX: preenche info imediatamente se tem dados embutidos */
  if (_sigModeEmbeddedLoan) {
    fillSigModeInfo();
  }

  /* FIX: inicializa canvas com delay — garante que o elemento foi renderizado */
  setTimeout(initSigModeCanvas, 200);

  return true;
}

/* ── FIX 2: preenche info do empréstimo — suporta ambos os nomes de campo ── */
function fillSigModeInfo() {
  var loan = loans.find(function(l){ return l.id === sigModeLoanId; }) || _sigModeEmbeddedLoan;
  var el   = document.getElementById("sig-mode-info");
  if (!loan) {
    el.innerHTML = "<p style='color:#E05A3A;'>Empréstimo não encontrado. Verifique o link.</p>";
    return;
  }
  var installments = loan.installments || [];
  var firstInstall  = installments[0] || { amount: 0, dueDate: "" };
  /* suporta interestRate (novo) e rate (antigo) */
  var rate = loan.interestRate !== undefined ? loan.interestRate : (loan.rate || 0);

  el.innerHTML =
    "<div style='margin-bottom:8px;font-weight:700;font-size:15px;color:var(--gold);'>" + loan.debtor + "</div>" +
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;'>" +
    "<div><span style='color:var(--text-muted);'>Valor total:</span> <strong>" + brl(loan.totalAmount) + "</strong></div>" +
    "<div><span style='color:var(--text-muted);'>Parcelas:</span> <strong>" + installments.length + "x " + brl(firstInstall.amount) + "</strong></div>" +
    "<div><span style='color:var(--text-muted);'>Juros:</span> <strong>" + rate + "% a.m.</strong></div>" +
    "<div><span style='color:var(--text-muted);'>1º Vcto:</span> <strong>" + fmtDate(firstInstall.dueDate) + "</strong></div>" +
    "</div>";
}

/* ── FIX 3: inicializa canvas com retry se dimensões forem zero ── */
function initSigModeCanvas() {
  var canvas = document.getElementById("sig-mode-canvas");
  if (!canvas) return;

  /* Limpa listeners antigos substituindo o elemento */
  var novo = canvas.cloneNode(true);
  canvas.parentNode.replaceChild(novo, canvas);
  canvas = novo;

  var ratio = window.devicePixelRatio || 1;
  var w = canvas.getBoundingClientRect().width  || canvas.offsetWidth  || 400;
  var h = canvas.getBoundingClientRect().height || canvas.offsetHeight || 180;

  /* FIX: retry se dimensões ainda zero */
  if (w === 0 || h === 0) {
    setTimeout(initSigModeCanvas, 300);
    return;
  }

  canvas.width  = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);

  var ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth   = 3;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  var drawing = false;

  function getPos(e) {
    var r = canvas.getBoundingClientRect();
    var s = e.touches ? e.touches[0] : e;
    return { x: s.clientX - r.left, y: s.clientY - r.top };
  }

  canvas.addEventListener("mousedown", function(e) {
    e.preventDefault();
    drawing = true;
    var p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("mousemove", function(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    onSigModeMark();
  });
  canvas.addEventListener("mouseup",    function() { drawing = false; });
  canvas.addEventListener("mouseleave", function() { drawing = false; });

  canvas.addEventListener("touchstart", function(e) {
    e.preventDefault();
    drawing = true;
    var p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener("touchmove", function(e) {
    e.preventDefault();
    if (!drawing) return;
    var p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    onSigModeMark();
  }, { passive: false });
  canvas.addEventListener("touchend",  function() { drawing = false; });
}

function onSigModeMark() {
  sigModeHasMark = true;
  var st = document.getElementById("sig-mode-status");
  if (st) { st.textContent = "✅ Assinado"; st.style.color = "#4CAF7D"; }
}

function clearSigMode() {
  var canvas = document.getElementById("sig-mode-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  sigModeHasMark = false;
  var st = document.getElementById("sig-mode-status");
  if (st) { st.textContent = "Aguardando assinatura..."; st.style.color = ""; }
}

/* ── FIX 4: submitSigMode — salva assinatura e notifica credor ── */
function submitSigMode() {
  if (!sigModeHasMark) { alert("Por favor, assine antes de confirmar."); return; }
  var canvas = document.getElementById("sig-mode-canvas");
  var sig    = canvas.toDataURL("image/png");

  /* 1) Tenta atualizar na lista local (mesmo navegador/aba) */
  var loan = loans.find(function(l){ return l.id === sigModeLoanId; });
  if (loan) {
    loan.signature    = sig;
    loan.signedAt     = today();
    loan.signedByLink = true;
    try { persist(); } catch(e) {}
  } else if (_sigModeEmbeddedLoan) {
    _sigModeEmbeddedLoan.signature    = sig;
    _sigModeEmbeddedLoan.signedAt     = today();
    _sigModeEmbeddedLoan.signedByLink = true;
    loans.push(_sigModeEmbeddedLoan);
    try { persist(); } catch(e) {}
  }

  /* 2) Salva registro da assinatura num localStorage especial
        para que o credor possa detectar mesmo em outra aba */
  try {
    var pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]");
    pending.push({
      loanId:   sigModeLoanId,
      debtor:   (_sigModeEmbeddedLoan || loan || {}).debtor || "—",
      signedAt: today(),
      sig:      sig
    });
    localStorage.setItem("cv_sig_pending", JSON.stringify(pending));
  } catch(e) {}

  /* 3) Esconde elementos do canvas */
  document.getElementById("sig-mode-canvas").style.display = "none";
  var btnPrimary = document.querySelector("#sig-mode .btn-primary");
  var btnGhost   = document.querySelector("#sig-mode .btn-ghost");
  var stEl       = document.getElementById("sig-mode-status");
  if (btnPrimary) btnPrimary.style.display = "none";
  if (btnGhost)   btnGhost.style.display   = "none";
  if (stEl)       stEl.style.display       = "none";

  /* 4) Tela de sucesso com botão de WhatsApp para o credor */
  var debtorName  = (_sigModeEmbeddedLoan || loan || {}).debtor || "Cliente";
  var credorPhone = localStorage.getItem("cv_creditor_phone") || "";
  var doneEl      = document.getElementById("sig-mode-done");

  doneEl.innerHTML =
    "<div style='font-size:48px;margin-bottom:12px;'>✅</div>" +
    "<div style='font-size:16px;font-weight:700;color:var(--gold);margin-bottom:8px;'>Assinatura registrada!</div>" +
    "<div style='font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.6;'>" +
      "Obrigado, <strong style='color:var(--text);'>" + debtorName + "</strong>!<br>" +
      "Por favor, envie a confirmação para o credor abaixo." +
    "</div>" +
    (credorPhone
      ? "<button onclick='notifyCreditorSigned(\"" + debtorName + "\",\"" + credorPhone + "\")' " +
          "style='padding:12px 24px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;width:100%;margin-bottom:10px;'>📱 Enviar confirmação ao credor</button>"
      : "<div style='font-size:12px;color:#E05A3A;padding:10px;background:rgba(224,90,58,.1);border-radius:8px;'>⚠️ Número do credor não configurado.<br>Informe pessoalmente que a assinatura foi concluída.</div>") +
    "<div style='font-size:11px;color:var(--text-muted);margin-top:12px;'>Você pode fechar esta página.</div>";

  doneEl.style.display = "block";
}

/* Confirma assinatura que chegou via outra aba/dispositivo */
function confirmPendingSignature(loanId) {
  var pending = [];
  try { pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]"); } catch(e) {}
  var pend = pending.find(function(p){ return p.loanId === loanId; });
  var loan = loans.find(function(l){ return l.id === loanId; });
  if (loan && pend) {
    loan.signature = pend.sig || ("confirmed_" + today());
    loan.signedAt  = pend.signedAt || today();
    persist();
    /* Remove da fila */
    pending = pending.filter(function(p){ return p.loanId !== loanId; });
    localStorage.setItem("cv_sig_pending", JSON.stringify(pending));
    closeModal();
    renderAll();
    toast("✅ Assinatura de " + loan.debtor + " confirmada!");
  } else {
    markLoanSigned(loanId);
  }
}

/* Envia WhatsApp de confirmação para o credor */
function notifyCreditorSigned(debtorName, credorPhone) {
  var msg = "✅ *Assinatura confirmada!*\n\n" +
            "*" + debtorName + "* assinou o contrato digitalmente em " +
            new Date().toLocaleDateString("pt-BR") + " às " +
            new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }) + ".\n\n" +
            "_Acesse o CredVision para visualizar a assinatura._";
  var waUrl = "https://wa.me/55" + credorPhone.replace(/\D/g,"") + "?text=" + encodeURIComponent(msg);
  var a = document.createElement("a");
  a.href = waUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); }, 200);
}

/* Credor confirma manualmente que recebeu a assinatura */
function markLoanSigned(loanId) {
  var loan = loans.find(function(l){ return l.id === loanId; });
  if (!loan) return;
  loan.signature = "confirmed_" + today();
  loan.signedAt  = today();
  persist();
  /* Remove da fila de pendentes */
  try {
    var pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]");
    pending = pending.filter(function(p){ return p.loanId !== loanId; });
    localStorage.setItem("cv_sig_pending", JSON.stringify(pending));
  } catch(e) {}
  closeModal();
  renderAll();
  toast("✅ Assinatura confirmada para " + loan.debtor + "!");
}

/* ════════════════════════════════════════
   ESTADO GLOBAL
════════════════════════════════════════ */
var loans   = [];
var clients = [];
var STATE_KEY = "cobranca_data";
var _updatedAt = null;

/* ── persist: salva sempre no localStorage + tenta Grid ── */
function persist() {
  var data = {
    loans:   JSON.stringify(loans),
    clients: JSON.stringify(clients),
    users:   JSON.stringify(users)
  };

  /* localStorage é o armazenamento principal — sempre funciona */
  try {
    localStorage.setItem("cv_loans",   data.loans);
    localStorage.setItem("cv_clients", data.clients);
    localStorage.setItem("cv_users",   data.users);
  } catch(e) {}

  /* Grid como backup extra (quando disponível) */
  try {
    window.GRID.state.set(data, _updatedAt)
      .then(function(r){ if(r && r.updated_at) _updatedAt = r.updated_at; })
      .catch(function(){});
  } catch(e) {}
}

/* ── loadState: carrega localStorage primeiro, depois Grid ── */
function loadState() {
  /* 1) Carrega do localStorage imediatamente (sempre disponível) */
  try {
    var lsLoans   = localStorage.getItem("cv_loans");
    var lsClients = localStorage.getItem("cv_clients");
    var lsUsers   = localStorage.getItem("cv_users");
    if (lsLoans)   { try { loans   = JSON.parse(lsLoans);   } catch(e){} }
    if (lsClients) { try { clients = JSON.parse(lsClients); } catch(e){} }
    if (lsUsers)   { try { users   = JSON.parse(lsUsers);   } catch(e){} }
  } catch(e) {}

  /* 2) Tenta Grid para sincronizar dados mais recentes */
  try {
    window.GRID.state.get().then(function(r) {
      if (r && r.updated_at) _updatedAt = r.updated_at;
      var s = r && r.state ? r.state : r;
      if (s && s.loans)   { try { loans   = JSON.parse(s.loans);   } catch(e){} }
      if (s && s.clients) { try { clients = JSON.parse(s.clients); } catch(e){} }
      if (s && s.users)   { try { users   = JSON.parse(s.users);   } catch(e){} }
      /* Sincroniza Grid → localStorage */
      try {
        localStorage.setItem("cv_loans",   JSON.stringify(loans));
        localStorage.setItem("cv_clients", JSON.stringify(clients));
        localStorage.setItem("cv_users",   JSON.stringify(users));
      } catch(e2) {}
      if (sigModeLoanId) { fillSigModeInfo(); } else { renderAll(); }
    }).catch(function(){
      if (sigModeLoanId) fillSigModeInfo(); else renderAll();
    });
  } catch(e) {
    /* Grid não disponível (GitHub Pages) — dados do localStorage já estão carregados */
    if (sigModeLoanId) fillSigModeInfo(); else renderAll();
  }
}

/* ════════════════════════════════════════
   UTILITÁRIOS
════════════════════════════════════════ */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function brl(n) {
  return "R$ " + parseFloat(n||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
}

function fmtDate(d) {
  if (!d) return "—";
  var p = d.split("-");
  return p[2]+"/"+p[1]+"/"+p[0];
}

function addMonths(dateStr, n) {
  var d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0,10);
}

function today() { return new Date().toISOString().slice(0,10); }

function isOverdue(dateStr) { return dateStr < today(); }

function toast(msg) {
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(function(){ t.style.display = "none"; }, 3000);
}

/* ════════════════════════════════════════
   SCORE POR CLIENTE
════════════════════════════════════════ */
function calcScore(clientName) {
  var allInstalls = [];
  loans.filter(function(l){ return l.debtor === clientName; }).forEach(function(l){
    (l.installments||[]).forEach(function(p){ allInstalls.push(p); });
  });
  if (!allInstalls.length) return "A";
  var paid = allInstalls.filter(function(p){ return p.status === "paid"; });
  if (!paid.length) {
    var anyOverdue = allInstalls.some(function(p){ return isOverdue(p.dueDate) && p.status !== "paid"; });
    return anyOverdue ? "D" : "A";
  }
  var totalDelay = 0;
  paid.forEach(function(p){
    if (p.paidDate && p.dueDate) {
      var delay = Math.max(0, Math.round((new Date(p.paidDate) - new Date(p.dueDate)) / 86400000));
      totalDelay += delay;
    }
  });
  var avgDelay  = totalDelay / paid.length;
  var hasOverdue = allInstalls.some(function(p){ return p.status === "overdue" || (isOverdue(p.dueDate) && p.status === "pending"); });
  if (hasOverdue) return avgDelay > 30 ? "D" : "C";
  if (avgDelay === 0) return "A";
  if (avgDelay <= 7)  return "B";
  if (avgDelay <= 30) return "C";
  return "D";
}

/* ════════════════════════════════════════
   STATUS DE PARCELAS
════════════════════════════════════════ */
function updateInstallmentStatuses() {
  var t = today();
  loans.forEach(function(loan) {
    (loan.installments||[]).forEach(function(p) {
      if (p.status !== "paid" && p.dueDate < t) p.status = "overdue";
    });
  });
}

function loanStatus(loan) {
  var installs = loan.installments || [];
  if (!installs.length) return "pending";
  var allPaid = installs.every(function(p){ return p.status === "paid"; });
  if (allPaid) return "ok";
  var anyOverdue = installs.some(function(p){ return p.status === "overdue" || (p.status === "pending" && isOverdue(p.dueDate)); });
  return anyOverdue ? "overdue" : "pending";
}

function loanPaid(loan) {
  return (loan.installments||[]).reduce(function(s, p) {
    if (p.status === "paid") s += parseFloat(p.paidAmount) || 0;
    if (p.interestPayments) {
      p.interestPayments.forEach(function(ip){ s += parseFloat(ip.amount) || 0; });
    }
    return s;
  }, 0);
}

function nextDue(loan) {
  var pending = (loan.installments||[]).filter(function(p){ return p.status !== "paid"; });
  if (!pending.length) return null;
  pending.sort(function(a,b){ return a.dueDate.localeCompare(b.dueDate); });
  return pending[0];
}

/* ════════════════════════════════════════
   WHATSAPP
════════════════════════════════════════ */
function wppMsg(loan, installment) {
  var nome  = loan.debtor.split(" ")[0];
  var valor = brl(installment ? installment.amount : loan.totalAmount);
  var vencto = installment ? fmtDate(installment.dueDate) : "em aberto";
  var status = installment && isOverdue(installment.dueDate) ? "venceu em" : "vence em";
  return encodeURIComponent(
    "Olá " + nome + "! 😊\n\n" +
    "Passando para lembrar que a parcela de *" + valor + "* " + status + " *" + vencto + "*.\n\n" +
    "Qualquer dúvida estou à disposição! 🙏"
  );
}

function openExternalLink(url) {
  var a = document.createElement("a");
  a.href    = url;
  a.target  = "_blank";
  a.rel     = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){ document.body.removeChild(a); }, 200);
}

function sendWhatsApp(loanId, installId) {
  var loan = loans.find(function(l){ return l.id === loanId; });
  if (!loan) return;
  var install = installId ? (loan.installments||[]).find(function(p){ return p.id === installId; }) : nextDue(loan);
  var phone = "55" + loan.phone.replace(/\D/g,"");
  openExternalLink("https://wa.me/" + phone + "?text=" + wppMsg(loan, install));
}

/* ════════════════════════════════════════
   ASSINATURA VIA WHATSAPP
   FIX 5: campos corretos no loanSnap
════════════════════════════════════════ */
function sendSignatureWhatsApp(loanId) {
  var loan = loans.find(function(l){ return l.id === loanId; });
  if (!loan) return;

  /* FIX: usa os nomes de campo corretos */
  var loanSnap = {
    id:           loan.id,
    debtor:       loan.debtor,
    phone:        loan.phone,
    amount:       loan.amount,
    totalAmount:  loan.totalAmount,
    interestRate: loan.interestRate,   /* era 'rate' — CORRIGIDO */
    installments: loan.installments,
    startDate:    loan.startDate,
    notes:        loan.notes || "",
    createdAt:    loan.createdAt
  };

  var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(loanSnap))));
  var sigLink = window.location.href.split('#')[0] + '#sign=' + loan.id + '&d=' + encoded;

  var msg = "Olá " + loan.debtor + "! 😊\n" +
            "Seu empréstimo de *" + brl(loan.totalAmount) + "* foi aprovado pela *CredVision*.\n\n" +
            "✍️ Para assinar digitalmente o contrato, clique no link abaixo:\n" +
            sigLink + "\n\n" +
            "_O link abre diretamente no seu celular — basta assinar com o dedo._";

  var waUrl = "https://wa.me/55" + loan.phone.replace(/\D/g,"") + "?text=" + encodeURIComponent(msg);
  openExternalLink(waUrl);
}

function showSignaturePrompt(loan) {
  var savedPhone = localStorage.getItem("cv_creditor_phone") || "";
  var overlay = document.createElement("div");
  overlay.id = "sig-prompt-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;";
  overlay.innerHTML =
    "<div style='background:var(--bg2);border:1px solid var(--border-gold);border-radius:20px;padding:36px 32px;max-width:440px;width:90%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.8);'>" +
    "<div style='font-size:48px;margin-bottom:12px;'>✅</div>" +
    "<div style='font-size:16px;font-weight:800;color:var(--gold);margin-bottom:6px;'>Empréstimo salvo!</div>" +
    "<div style='font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.6;'>Deseja enviar o link de assinatura para <strong style='color:var(--text);'>" + loan.debtor + "</strong> pelo WhatsApp?</div>" +
    /* Campo para salvar o número do credor (para receber confirmações) */
    "<div style='margin-bottom:20px;text-align:left;background:var(--bg3);border-radius:10px;padding:14px;border:1px solid var(--border-gold);'>" +
    "<div style='font-size:11px;font-weight:700;color:var(--gold);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px;'>📱 Seu número (recebe confirmações)</div>" +
    "<input id='creditor-phone-input' type='tel' placeholder='11999999999 (sem +55)' value='" + savedPhone + "' " +
      "style='width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;background:var(--bg4);color:var(--text);'>" +
    "<div style='font-size:10px;color:var(--text-muted);margin-top:6px;'>Quando o cliente assinar, ele enviará uma confirmação para este número.</div>" +
    "</div>" +
    "<div style='display:flex;gap:12px;justify-content:center;'>" +
    "<button onclick='saveCreditorPhoneAndSend(\"" + loan.id + "\")' " +
      "style='padding:12px 24px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;'>📲 Enviar para assinar</button>" +
    "<button onclick='saveCreditorPhone();document.getElementById(\"sig-prompt-overlay\").remove();' " +
      "style='padding:12px 20px;background:var(--bg3);color:var(--text-muted);border:1px solid var(--border);border-radius:12px;font-size:14px;cursor:pointer;'>Agora não</button>" +
    "</div>" +
    "</div>";
  document.body.appendChild(overlay);
  overlay.addEventListener("click", function(e){ if(e.target===overlay) overlay.remove(); });
}

function saveCreditorPhone() {
  var el = document.getElementById("creditor-phone-input");
  if (el && el.value.trim()) localStorage.setItem("cv_creditor_phone", el.value.trim());
}

function saveCreditorPhoneAndSend(loanId) {
  saveCreditorPhone();
  sendSignatureWhatsApp(loanId);
  var overlay = document.getElementById("sig-prompt-overlay");
  if (overlay) overlay.remove();
}

/* ════════════════════════════════════════
   PREVIEW DE PARCELAS
════════════════════════════════════════ */
function previewInstallments() {
  var valor = parseFloat(document.getElementById("f-valor").value) || 0;
  var n     = parseInt(document.getElementById("f-parcelas").value) || 1;
  var juros = parseFloat(document.getElementById("f-juros").value) || 0;
  var vcto  = document.getElementById("f-vcto").value;
  if (!valor || !vcto) { document.getElementById("install-preview").style.display="none"; return; }
  var preview = document.getElementById("install-preview");
  var pmt   = calcInstallAmount(valor, juros, n);
  var total = calcTotalWithInterest(valor, juros, n);
  var rows  = "";
  for (var i = 0; i < n; i++) {
    var dueDate = addMonths(vcto, i);
    rows += "<tr><td>" + (i+1) + "</td><td>" + fmtDate(dueDate) + "</td><td>" + brl(pmt) + "</td></tr>";
  }
  var jurosTotal = Math.round((total - valor) * 100) / 100;
  preview.style.display = "block";
  preview.innerHTML = "<strong style='font-size:12px;color:var(--gold)'>Prévia das parcelas</strong>" +
    "<table style='margin-top:8px;width:100%'>" +
    "<thead><tr><th>#</th><th>Vencimento</th><th>Valor</th></tr></thead>" +
    "<tbody>" + rows + "</tbody>" +
    "<tfoot>" +
    "<tr><td colspan='2' style='text-align:right;font-size:11px;color:var(--text-muted);padding:4px 10px;'>Juros (" + juros + "% × " + n + "m):</td>" +
    "<td style='font-size:11px;color:#B85C38;padding:4px 10px;'>+" + brl(jurosTotal) + "</td></tr>" +
    "<tr><td colspan='2' style='text-align:right;font-weight:700;padding:8px 10px;'>Total:</td>" +
    "<td style='font-weight:700;padding:8px 10px;color:var(--gold);'>" + brl(total) + "</td></tr></tfoot>" +
    "</table>";
}

function calcInstallAmount(principal, monthlyRate, n) {
  var total = monthlyRate > 0 ? principal * (1 + (monthlyRate / 100) * n) : principal;
  return Math.round(total / n * 100) / 100;
}

function calcTotalWithInterest(principal, monthlyRate, n) {
  return monthlyRate > 0 ? Math.round(principal * (1 + (monthlyRate / 100) * n) * 100) / 100 : principal;
}

/* ════════════════════════════════════════
   SALVAR EMPRÉSTIMO
════════════════════════════════════════ */
function saveLoan() {
  var nome  = document.getElementById("f-nome").value.trim();
  var phone = document.getElementById("f-phone").value.trim();
  var valor = parseFloat(document.getElementById("f-valor").value);
  var data  = document.getElementById("f-data").value;
  var n     = parseInt(document.getElementById("f-parcelas").value)||1;
  var vcto  = document.getElementById("f-vcto").value;
  var juros = parseFloat(document.getElementById("f-juros").value)||0;
  var obs   = document.getElementById("f-obs").value.trim();
  if (!nome || !phone || !valor || !data || !vcto) { alert("Preencha os campos obrigatórios (*)"); return; }
  var pmt   = calcInstallAmount(valor, juros, n);
  var total = calcTotalWithInterest(valor, juros, n);
  var installments = [];
  for (var i = 0; i < n; i++) {
    installments.push({ id: uid(), num: i+1, dueDate: addMonths(vcto, i), amount: pmt, status: "pending", paidDate: null, paidAmount: null });
  }
  loans.push({
    id: uid(), debtor: nome, phone: phone,
    amount: valor, totalAmount: Math.round(total*100)/100,
    interestRate: juros, startDate: data, notes: obs,
    installments: installments, createdAt: today(), signature: null
  });
  persist();
  var savedLoan = loans[loans.length - 1];
  clearForm();
  showTab("dashboard");
  showSignaturePrompt(savedLoan);
}

function clearForm() {
  var td = today();
  ["f-nome","f-phone","f-valor","f-data","f-parcelas","f-vcto","f-juros","f-obs"].forEach(function(id){
    var v = id==="f-parcelas" ? "1" : id==="f-juros" ? "20" : id==="f-data" ? td : id==="f-vcto" ? addMonths(td, 1) : "";
    document.getElementById(id).value = v;
  });
  document.getElementById("install-preview").style.display="none";
}

/* ════════════════════════════════════════
   REGISTRAR PAGAMENTO
════════════════════════════════════════ */
function openPayModal(loanId, installId) {
  var loan = loans.find(function(l){ return l.id === loanId; });
  var inst = (loan.installments||[]).find(function(p){ return p.id === installId; });
  if (!loan || !inst) return;
  var minAmount = loan.interestRate > 0 ? Math.round(inst.amount * (loan.interestRate / 100) * 100) / 100 : 0;
  document.getElementById("modal-title").textContent = "Registrar pagamento — " + loan.debtor;
  document.getElementById("modal-body").innerHTML =
    "<div style='margin-bottom:14px;'>" +
    "<p style='font-size:13px;color:var(--text-muted);'>Parcela <strong style='color:var(--text)'>" + inst.num + "/" + loan.installments.length + "</strong> • " +
    "Vencimento: <strong style='color:var(--text)'>" + fmtDate(inst.dueDate) + "</strong></p>" +
    "</div>" +
    "<div style='display:flex;gap:10px;margin-bottom:16px;'>" +
    "<div style='flex:1;background:var(--bg3);border:2px solid var(--border-gold);border-radius:10px;padding:12px;cursor:pointer;text-align:center;' onclick='setPayValor("+inst.amount+")'>" +
    "<div style='font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;'>Valor completo</div>" +
    "<div style='font-size:16px;font-weight:700;color:var(--gold);'>" + brl(inst.amount) + "</div>" +
    "</div>" +
    (minAmount > 0
      ? "<div style='flex:1;background:var(--bg3);border:2px solid rgba(184,92,56,.5);border-radius:10px;padding:12px;cursor:pointer;text-align:center;' onclick='setPayValor("+minAmount+")'>" +
        "<div style='font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;'>Pagamento mínimo</div>" +
        "<div style='font-size:16px;font-weight:700;color:#E2956A;'>" + brl(minAmount) + "</div>" +
        "</div>"
      : "") +
    "</div>" +
    "<div class='form-grid' style='grid-template-columns:1fr 1fr;'>" +
    "<div class='form-group'><label>Valor recebido (R$)</label><input id='pay-valor' type='number' value='" + inst.amount + "' step='0.01'></div>" +
    "<div class='form-group'><label>Data do recebimento</label><input id='pay-data' type='date' value='" + today() + "'></div>" +
    "</div>" +
    "<div class='form-actions' style='margin-top:20px;'>" +
    "<button class='btn btn-green' onclick='confirmPay(\""+loanId+"\",\""+installId+"\","+inst.amount+","+minAmount+")'>✅ Confirmar pagamento</button>" +
    "<button class='btn btn-ghost' onclick='closeModal()'>Cancelar</button>" +
    "</div>";
  document.getElementById("modal-overlay").classList.add("open");
}

function setPayValor(v) { var el = document.getElementById("pay-valor"); if (el) el.value = v; }

function confirmPay(loanId, installId, fullAmount, minAmount) {
  var loan  = loans.find(function(l){ return l.id === loanId; });
  var inst  = (loan.installments||[]).find(function(p){ return p.id === installId; });
  var valor = parseFloat(document.getElementById("pay-valor").value);
  var data  = document.getElementById("pay-data").value;
  if (!valor || !data) { alert("Preencha valor e data."); return; }
  var isFull = valor >= (fullAmount - 0.01);
  if (isFull) {
    inst.status = "paid"; inst.paidAmount = valor; inst.paidDate = data;
    toast("✅ Parcela " + inst.num + " de " + loan.debtor + " quitada!");
  } else {
    if (!inst.interestPayments) inst.interestPayments = [];
    inst.interestPayments.push({ amount: valor, date: data });
    toast("🟡 Juros de " + brl(valor) + " registrados — parcela continua em aberto.");
  }
  persist(); closeModal(); renderAll();
}

/* ════════════════════════════════════════
   DELETAR EMPRÉSTIMO
════════════════════════════════════════ */
function deleteLoan(loanId) {
  if (!confirm("Deseja excluir este empréstimo?")) return;
  loans = loans.filter(function(l){ return l.id !== loanId; });
  persist(); renderAll();
  toast("🗑 Empréstimo removido.");
}

/* ════════════════════════════════════════
   MODAL DETALHES
════════════════════════════════════════ */
function openDetail(loanId) {
  var loan  = loans.find(function(l){ return l.id === loanId; });
  if (!loan) return;
  var paid  = loanPaid(loan);
  var saldo = loan.totalAmount - paid;
  var rows  = (loan.installments||[]).map(function(p){
    var cls   = p.status === "paid" ? "ok" : (isOverdue(p.dueDate) ? "overdue" : "pending");
    var label = p.status === "paid" ? "Pago" : (cls === "overdue" ? "Vencido" : "Em dia");
    var jurosHist = p.interestPayments && p.interestPayments.length
      ? p.interestPayments.reduce(function(s,ip){ return s + ip.amount; }, 0) : 0;
    var jurosBadge = jurosHist > 0 && p.status !== "paid"
      ? "<br><span style='font-size:10px;color:#E2956A;'>🟡 Juros: +" + brl(jurosHist) + "</span>" : "";
    var payBtn = p.status !== "paid" ? "<button class='btn btn-green btn-sm' onclick='openPayModal(\""+loan.id+"\",\""+p.id+"\")'>💵 Pagar</button>&nbsp;" : "";
    var wppBtn = p.status !== "paid" ? "<button class='btn btn-wpp btn-sm' onclick='sendWhatsApp(\""+loan.id+"\",\""+p.id+"\")'>📱 Cobrar</button>" : "";
    return "<tr><td>" + p.num + "/" + loan.installments.length + "</td>" +
      "<td>" + fmtDate(p.dueDate) + "</td>" +
      "<td>" + brl(p.amount) + jurosBadge + "</td>" +
      "<td>" + (p.paidDate ? fmtDate(p.paidDate) : "—") + "</td>" +
      "<td>" + brl(p.paidAmount||0) + "</td>" +
      "<td><span class='badge "+cls+"'>"+label+"</span></td>" +
      "<td>" + payBtn + wppBtn + "</td></tr>";
  }).join("");
  document.getElementById("modal-title").textContent = "📋 " + loan.debtor;
  document.getElementById("modal-body").innerHTML =
    "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;'>" +
    "<div class='stat-box'><div class='stat-val'>" + brl(loan.totalAmount) + "</div><div class='stat-lbl'>Total</div></div>" +
    "<div class='stat-box'><div class='stat-val' style='color:#4CAF7D'>" + brl(paid) + "</div><div class='stat-lbl'>Pago</div></div>" +
    "<div class='stat-box'><div class='stat-val' style='color:#E05A3A'>" + brl(saldo) + "</div><div class='stat-lbl'>Saldo</div></div>" +
    "</div>" +
    "<p style='font-size:12px;color:#888;margin-bottom:16px;'>Juros: " + loan.interestRate + "% a.m. | Início: " + fmtDate(loan.startDate) + (loan.notes ? " | " + loan.notes : "") + "</p>" +
    (loan.signature
      ? (loan.signature.startsWith("confirmed_")
          /* Confirmada manualmente */
          ? "<div style='margin-bottom:20px;padding:12px 14px;background:rgba(76,175,125,.1);border:1px solid rgba(76,175,125,.4);border-radius:8px;display:flex;align-items:center;gap:10px;'>" +
            "<span style='font-size:20px;'>✅</span>" +
            "<div><div style='font-weight:700;color:#4CAF7D;font-size:13px;'>Assinatura confirmada</div>" +
            "<div style='font-size:11px;color:var(--text-muted);'>Confirmada em " + fmtDate(loan.signedAt || "") + "</div></div>" +
            "</div>"
          /* Assinatura digital real (imagem) */
          : "<div style='margin-bottom:20px;'><div style='font-size:11px;font-weight:700;color:var(--gold);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;'>✍️ Assinatura digital</div>" +
            "<div style='background:#fff;border-radius:8px;padding:8px;border:1px solid var(--border-gold);display:inline-block;'>" +
            "<img src='" + loan.signature + "' style='max-width:340px;height:auto;display:block;border-radius:4px;'></div>" +
            (loan.signedAt ? "<div style='font-size:10px;color:var(--text-muted);margin-top:4px;'>Assinado em " + fmtDate(loan.signedAt) + "</div>" : "") +
            "</div>")
      : "<div style='margin-bottom:16px;'>" +
        /* verifica se há pendente na fila */
        (function(){
          var pending = [];
          try { pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]"); } catch(er) {}
          var pend = pending.find(function(p){ return p.loanId === loan.id; });
          if (pend) {
            return "<div style='padding:12px 14px;background:rgba(76,175,125,.1);border:1px solid rgba(76,175,125,.4);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;'>" +
              "<div><div style='font-weight:700;color:#4CAF7D;font-size:13px;'>✅ Assinatura recebida!</div>" +
              "<div style='font-size:11px;color:var(--text-muted);'>Cliente assinou em " + fmtDate(pend.signedAt) + "</div></div>" +
              "<button onclick='confirmPendingSignature(\""+loan.id+"\")' style='padding:8px 16px;background:linear-gradient(135deg,#4CAF7D,#2E7D55);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;'>✅ Confirmar</button>" +
              "</div>";
          }
          return "<div style='font-size:11px;color:var(--text-muted);padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;'>" +
            "<span>⚠️ Sem assinatura registrada</span>" +
            "<div style='display:flex;gap:8px;'>" +
            "<button onclick='sendSignatureWhatsApp(\""+loan.id+"\")' style='padding:6px 14px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;'>📲 Enviar para assinar</button>" +
            "<button onclick='markLoanSigned(\""+loan.id+"\")' style='padding:6px 14px;background:var(--bg4);color:var(--text-muted);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;white-space:nowrap;'>✏️ Marcar manualmente</button>" +
            "</div></div>";
        })() +
        "</div>") +
    "<table style='width:100%;font-size:13px;border-collapse:collapse;'>" +
    "<thead><tr style='background:#f8f9fa;'><th style='padding:8px 10px;text-align:left;'>Parc.</th><th style='padding:8px 10px;text-align:left;'>Vcto</th><th style='padding:8px 10px;text-align:left;'>Valor</th><th style='padding:8px 10px;text-align:left;'>Pago em</th><th style='padding:8px 10px;text-align:left;'>Pago</th><th style='padding:8px 10px;text-align:left;'>Status</th><th style='padding:8px 10px;'>Ações</th></tr></thead>" +
    "<tbody>" + rows + "</tbody></table>" +
    "<div style='margin-top:16px;display:flex;gap:10px;'>" +
    "<button class='btn btn-wpp' onclick='sendWhatsApp(\""+loan.id+"\",null)'>📱 Cobrar próxima parcela</button>" +
    "</div>";
  document.getElementById("modal-overlay").classList.add("open");
}

function closeModal(e) {
  if (!e || e.target === document.getElementById("modal-overlay")) {
    document.getElementById("modal-overlay").classList.remove("open");
    renderAll();
  }
}

/* ════════════════════════════════════════
   COBRANÇA AUTOMÁTICA DO DIA
════════════════════════════════════════ */
function getDueToday() {
  var td = today();
  var result = [];
  loans.forEach(function(loan) {
    (loan.installments||[]).forEach(function(p) {
      if (p.status === "paid") return;
      var isToday   = p.dueDate === td;
      var isOvd     = p.dueDate < td;
      if (isToday || isOvd) {
        result.push({ loan: loan, inst: p, isToday: isToday, daysLate: isOvd ? Math.floor((new Date(td) - new Date(p.dueDate)) / 86400000) : 0 });
      }
    });
  });
  result.sort(function(a,b){ return a.inst.dueDate.localeCompare(b.inst.dueDate); });
  return result;
}

function autoNotify() {
  /* ── Banner de assinaturas pendentes de confirmação ── */
  var pending = [];
  try { pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]"); } catch(e) {}
  var sigBanner = document.getElementById("sig-received-banner");
  if (!sigBanner) {
    /* Cria o banner se não existir */
    sigBanner = document.createElement("div");
    sigBanner.id = "sig-received-banner";
    var dashContent = document.getElementById("tab-dashboard");
    if (dashContent) dashContent.insertBefore(sigBanner, dashContent.firstChild);
  }
  if (pending.length) {
    sigBanner.style.display = "flex";
    sigBanner.style.cssText = "display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#0d2a1e,#1a4a30);border:1px solid rgba(76,175,125,.5);border-radius:12px;padding:14px 18px;margin-bottom:16px;cursor:pointer;";
    sigBanner.innerHTML =
      "<div style='font-size:28px;flex-shrink:0;'>✍️</div>" +
      "<div style='flex:1;'>" +
        "<div style='font-weight:700;color:#4CAF7D;font-size:14px;'>🔔 " + pending.length + " assinatura" + (pending.length > 1 ? "s recebidas" : " recebida") + "!</div>" +
        "<div style='font-size:12px;color:var(--text-muted);margin-top:2px;'>" + pending.map(function(p){ return p.debtor; }).join(", ") + "</div>" +
      "</div>" +
      "<button onclick='openPendingSignaturesModal()' style='padding:8px 16px;background:linear-gradient(135deg,#4CAF7D,#2E7D55);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;'>Ver e confirmar →</button>";
  } else {
    sigBanner.style.display = "none";
  }

  /* ── Banner de cobranças do dia ── */
  var due    = getDueToday();
  var banner = document.getElementById("cobranca-banner");
  if (!banner) return;
  if (!due.length) { banner.style.display = "none"; return; }
  var today_count = due.filter(function(d){ return d.isToday; }).length;
  var late_count  = due.filter(function(d){ return !d.isToday; }).length;
  var parts = [];
  if (today_count) parts.push(today_count + " venc" + (today_count > 1 ? "em" : "e") + " hoje");
  if (late_count)  parts.push(late_count  + " em atraso");
  document.getElementById("banner-title").textContent = "⚠️ " + due.length + " cobrança" + (due.length > 1 ? "s" : "") + " aguardam envio";
  document.getElementById("banner-sub").textContent   = parts.join(" • ");
  banner.style.display = "flex";
}

function openCobrancaModal() {
  var due = getDueToday();
  if (!due.length) return;
  var rows = due.map(function(d) {
    var tagColor = d.isToday ? "#C9A448" : "#E05A3A";
    var tagLabel = d.isToday ? "Vence hoje" : d.daysLate + " dia" + (d.daysLate > 1 ? "s" : "") + " em atraso";
    return "<div style='display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg3);border-radius:10px;border:1px solid var(--border);'>" +
      "<div style='width:38px;height:38px;border-radius:50%;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:var(--gold);flex-shrink:0;'>" + d.loan.debtor[0].toUpperCase() + "</div>" +
      "<div style='flex:1;min-width:0;'>" +
        "<div style='font-weight:600;font-size:13px;color:var(--text);'>" + d.loan.debtor + "</div>" +
        "<div style='font-size:11px;color:var(--text-muted);margin-top:1px;'>Parcela " + d.inst.num + "/" + d.loan.installments.length + " • " + brl(d.inst.amount) + " • Vcto " + fmtDate(d.inst.dueDate) + "</div>" +
      "</div>" +
      "<span style='font-size:10px;font-weight:700;color:" + tagColor + ";background:rgba(0,0,0,.3);border:1px solid " + tagColor + ";border-radius:20px;padding:2px 8px;white-space:nowrap;'>" + tagLabel + "</span>" +
      "<button class='btn btn-wpp btn-sm' style='flex-shrink:0;' onclick='sendWhatsApp(\""+d.loan.id+"\",\""+d.inst.id+"\")'>📱 Enviar</button>" +
      "</div>";
  }).join("");
  document.getElementById("modal-title").textContent = "🔔 Cobranças do dia — " + due.length + " pendente" + (due.length > 1 ? "s" : "");
  document.getElementById("modal-body").innerHTML =
    "<p style='font-size:12px;color:var(--text-muted);margin-bottom:14px;'>Clique em <strong style='color:var(--gold)'>📱 Enviar</strong> para abrir o WhatsApp com a mensagem pronta para cada cliente.</p>" +
    "<div style='display:flex;flex-direction:column;gap:8px;'>" + rows + "</div>" +
    "<div style='margin-top:18px;display:flex;gap:8px;justify-content:flex-end;'>" +
    "<button class='btn btn-primary' onclick='sendAllWhatsApp()'>📱 Enviar para todos</button>" +
    "<button class='btn btn-ghost' onclick='closeModal()'>Fechar</button>" +
    "</div>";
  document.getElementById("modal-overlay").classList.add("open");
}

/* Modal com assinaturas recebidas para confirmação */
function openPendingSignaturesModal() {
  var pending = [];
  try { pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]"); } catch(e) {}
  if (!pending.length) return;
  var rows = pending.map(function(p) {
    return "<div style='display:flex;align-items:center;gap:12px;padding:14px;background:var(--bg3);border-radius:10px;border:1px solid rgba(76,175,125,.3);margin-bottom:8px;'>" +
      "<div style='width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2E7D55,#4CAF7D);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;'>✍</div>" +
      "<div style='flex:1;'>" +
        "<div style='font-weight:700;color:var(--text);font-size:13px;'>" + p.debtor + "</div>" +
        "<div style='font-size:11px;color:var(--text-muted);margin-top:2px;'>Assinou em " + fmtDate(p.signedAt) + "</div>" +
      "</div>" +
      (p.sig && p.sig.startsWith("data:")
        ? "<div style='width:80px;height:40px;background:#fff;border-radius:6px;overflow:hidden;border:1px solid var(--border-gold);flex-shrink:0;'><img src='"+p.sig+"' style='width:100%;height:100%;object-fit:contain;'></div>"
        : "") +
      "<button onclick='confirmPendingSignature(\""+p.loanId+"\");openPendingSignaturesModal();' " +
        "style='padding:8px 14px;background:linear-gradient(135deg,#4CAF7D,#2E7D55);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;'>✅ Confirmar</button>" +
    "</div>";
  }).join("");

  document.getElementById("modal-title").textContent = "✍️ Assinaturas recebidas — " + pending.length;
  document.getElementById("modal-body").innerHTML =
    "<p style='font-size:12px;color:var(--text-muted);margin-bottom:14px;'>Clique em <strong style='color:#4CAF7D'>✅ Confirmar</strong> para registrar cada assinatura no sistema.</p>" +
    rows +
    "<div style='margin-top:16px;display:flex;justify-content:flex-end;'><button class='btn btn-ghost' onclick='closeModal()'>Fechar</button></div>";
  document.getElementById("modal-overlay").classList.add("open");
}

function sendAllWhatsApp() {
  var due = getDueToday();
  due.forEach(function(d, i) { setTimeout(function(){ sendWhatsApp(d.loan.id, d.inst.id); }, i * 600); });
  toast("📱 Abrindo WhatsApp para " + due.length + " cliente" + (due.length > 1 ? "s" : "") + "...");
}

/* ════════════════════════════════════════
   RENDER DASHBOARD
════════════════════════════════════════ */
function renderDashboard() {
  updateInstallmentStatuses();
  var filter     = document.getElementById("filter-status").value;
  var filterNome = (document.getElementById("filter-nome").value || "").trim().toLowerCase();
  var totalEmp = 0, totalPago = 0, totalPend = 0, totalAtraso = 0;
  loans.forEach(function(l) {
    totalEmp  += l.totalAmount || 0;
    totalPago += loanPaid(l);
    var st    = loanStatus(l);
    var saldo = (l.totalAmount||0) - loanPaid(l);
    if (st === "overdue") totalAtraso += saldo;
    else if (st !== "ok") totalPend   += saldo;
  });
  document.getElementById("sum-total").textContent    = brl(totalEmp);
  document.getElementById("sum-recebido").textContent = brl(totalPago);
  document.getElementById("sum-pendente").textContent = brl(totalPend);
  document.getElementById("sum-vencido").textContent  = brl(totalAtraso);
  var filtered = loans.filter(function(l){
    var okStatus = !filter || loanStatus(l) === filter;
    var okNome   = !filterNome || (l.debtor || "").toLowerCase().indexOf(filterNome) !== -1;
    return okStatus && okNome;
  });
  var tbody = document.getElementById("loans-body");
  if (!filtered.length) {
    tbody.innerHTML = "<tr><td colspan='9'><div class='empty'><div class='icon'>💸</div><p>" +
      (loans.length ? "Nenhum empréstimo nesse filtro." : "Nenhum empréstimo cadastrado ainda.") +
      "</p></div></td></tr>";
    return;
  }
  tbody.innerHTML = filtered.map(function(loan) {
    var st      = loanStatus(loan);
    var paid    = loanPaid(loan);
    var saldo   = loan.totalAmount - paid;
    var nd      = nextDue(loan);
    var score   = calcScore(loan.debtor);
    var stLabel = st === "ok" ? "Quitado" : st === "overdue" ? "Em atraso" : "Em dia";
    return "<tr>" +
      "<td><strong style='cursor:pointer;color:var(--gold);' onclick='openDetail(\""+loan.id+"\")'>" + loan.debtor + "</strong>" +
        (loan.phone ? "<br><span style='font-size:11px;color:var(--text-muted);'>"+loan.phone+"</span>" : "") + "</td>" +
      "<td>" + brl(loan.totalAmount) + "</td>" +
      "<td style='color:#4CAF7D;'>" + brl(paid) + "</td>" +
      "<td style='color:#E05A3A;font-weight:600;'>" + brl(Math.max(0,saldo)) + "</td>" +
      "<td>" + (nd ? "<span style='color:"+(isOverdue(nd.dueDate)?"#E05A3A":"var(--text)")+"'>" + fmtDate(nd.dueDate) + "</span><br><span style='font-size:11px;color:var(--text-muted);'>" + brl(nd.amount) + "</span>" : "<span style='color:#4CAF7D'>Quitado</span>") + "</td>" +
      "<td><span class='badge "+st+"'>" + stLabel + "</span></td>" +
      "<td style='text-align:center;'>" +
        (loan.signature
          ? "<span title='Contrato assinado' style='color:#4CAF7D;font-size:16px;'>✅</span>"
          : "<span title='Enviar link de assinatura' style='color:#E05A3A;font-size:13px;cursor:pointer;' onclick='sendSignatureWhatsApp(\""+loan.id+"\")'>⚠️ Enviar</span>") +
      "</td>" +
      "<td><span class='score "+score+"'>" + score + "</span></td>" +
      "<td style='white-space:nowrap;'>" +
        "<button class='btn btn-sm btn-ghost' onclick='openDetail(\""+loan.id+"\")' title='Detalhes'>📋</button> " +
        "<button class='btn btn-sm btn-wpp' onclick='sendWhatsApp(\""+loan.id+"\",null)' title='WhatsApp'>📱</button> " +
        "<button class='btn btn-sm btn-danger' onclick='deleteLoan(\""+loan.id+"\")' title='Excluir'>🗑</button>" +
      "</td>" +
    "</tr>";
  }).join("");
}

/* ════════════════════════════════════════
   RENDER CLIENTES
════════════════════════════════════════ */
function renderClients() {
  var clientMap = {};
  loans.forEach(function(l) {
    if (!clientMap[l.debtor]) clientMap[l.debtor] = { phone: l.phone, loans: [], cadastro: null };
    clientMap[l.debtor].loans.push(l);
  });
  clients.forEach(function(c) {
    if (!clientMap[c.nome]) {
      clientMap[c.nome] = { phone: c.tel, loans: [], cadastro: c };
    } else {
      clientMap[c.nome].cadastro = c;
      if (!clientMap[c.nome].phone) clientMap[c.nome].phone = c.tel;
    }
  });
  var names = Object.keys(clientMap);
  var grid  = document.getElementById("clients-grid");
  if (!names.length) {
    grid.innerHTML = "<div class='empty' style='grid-column:1/-1'><div class='icon'>👤</div><p>Nenhum cliente cadastrado.</p></div>";
    return;
  }
  var scoreDesc = {A:"Excelente — sempre paga em dia",B:"Bom — pequenos atrasos",C:"Regular — atrasos frequentes",D:"Risco — inadimplente"};
  grid.innerHTML = names.map(function(name) {
    var c = clientMap[name];
    var score     = calcScore(name);
    var totalEmp  = c.loans.reduce(function(s,l){ return s+l.totalAmount; }, 0);
    var totalPago = c.loans.reduce(function(s,l){ return s+loanPaid(l); }, 0);
    var saldo     = totalEmp - totalPago;
    var allInstalls = [];
    c.loans.forEach(function(l){ allInstalls = allInstalls.concat(l.installments||[]); });
    var pagasNoPrazo = allInstalls.filter(function(p){ return p.status==="paid" && p.paidDate && p.dueDate && p.paidDate <= p.dueDate; }).length;
    var totalPagas   = allInstalls.filter(function(p){ return p.status==="paid"; }).length;
    var pct = totalPagas ? Math.round(pagasNoPrazo/totalPagas*100) : 100;
    var cadBadge  = c.cadastro ? "<span style='font-size:10px;background:var(--gold);color:#000;border-radius:20px;padding:2px 8px;font-weight:700;margin-left:6px;'>✓ Cadastrado</span>" : "";
    var extraInfo = c.cadastro && c.cadastro.cpf ? "<div style='font-size:11px;color:var(--text-muted);margin-top:2px;'>CPF: " + c.cadastro.cpf + "</div>" : "";
    var verBtn  = c.cadastro ? "<button class='btn btn-sm' style='background:var(--bg3);border:1px solid var(--border-gold);color:var(--gold);' onclick='viewClient(\""+c.cadastro.id+"\")'>🪪 Ficha</button>" : "";
    var editBtn = c.cadastro ? "<button class='btn btn-sm' style='background:var(--bg3);border:1px solid var(--border);color:var(--text-muted);' onclick='editClient(\""+c.cadastro.id+"\")'>✏️ Editar</button>" : "";
    return "<div class='client-card'>" +
      "<div class='client-card-header'>" +
      "<div class='client-avatar'>" + name[0].toUpperCase() + "</div>" +
      "<div style='flex:1'><div class='client-name'>" + name + cadBadge + "</div><div class='client-phone'>" + (c.phone||"—") + "</div>" + extraInfo + "</div>" +
      "<span class='score "+score+"' style='width:36px;height:36px;font-size:15px;'>"+score+"</span>" +
      "</div>" +
      "<div style='font-size:11px;color:#888;margin-bottom:12px;'>" + (scoreDesc[score]||"") + "</div>" +
      "<div class='client-stats'>" +
      "<div class='stat-box'><div class='stat-val'>" + brl(totalEmp) + "</div><div class='stat-lbl'>Total</div></div>" +
      "<div class='stat-box'><div class='stat-val' style='color:#4CAF7D'>" + brl(totalPago) + "</div><div class='stat-lbl'>Pago</div></div>" +
      "<div class='stat-box'><div class='stat-val' style='color:#E05A3A'>" + brl(saldo) + "</div><div class='stat-lbl'>Saldo</div></div>" +
      "</div>" +
      "<div style='margin-top:12px;background:var(--bg3);border-radius:20px;height:6px;overflow:hidden;'><div style='width:"+pct+"%;height:100%;background:#4CAF7D;border-radius:20px;'></div></div>" +
      "<div style='font-size:11px;color:#888;margin-top:4px;'>"+pct+"% pagas no prazo ("+totalPagas+" parcela"+(totalPagas!==1?"s":"")+")</div>" +
      "<div style='margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;'>" +
      "<button class='btn btn-wpp btn-sm' onclick='sendWhatsAppClient(\""+name+"\")'>📱 Cobrar</button>" +
      verBtn + editBtn +
      "</div></div>";
  }).join("");
}

function sendWhatsAppClient(name) {
  var clientLoans = loans.filter(function(l){ return l.debtor === name; });
  for (var i = 0; i < clientLoans.length; i++) {
    var nd = nextDue(clientLoans[i]);
    if (nd) { sendWhatsApp(clientLoans[i].id, nd.id); return; }
  }
  toast("Nenhuma parcela pendente para " + name);
}

/* ════════════════════════════════════════
   CADASTRO DE CLIENTES
════════════════════════════════════════ */
var FOTO_SLOTS = [
  {id:"foto-cnh",     label:"CNH ou RG",            icon:"🪪"},
  {id:"foto-rg-seg",  label:"Segurando o RG",        icon:"🤳"},
  {id:"foto-casa",    label:"Frente da casa",         icon:"🏠"},
  {id:"foto-holerite",label:"Último holerite",        icon:"📄"},
  {id:"foto-comp-res",label:"Comprovante residência", icon:"📋"}
];
var fotoData = {};

function buildFotoGrid() {
  var grid = document.getElementById("foto-grid");
  if (!grid) return;
  fotoData = {};
  grid.innerHTML = FOTO_SLOTS.map(function(s){
    return "<div class='foto-slot' id='slot-"+s.id+"' onclick='triggerFoto(\""+s.id+"\")'>" +
      "<div class='foto-icon'>"+s.icon+"</div>" +
      "<div class='foto-lbl'>"+s.label+"</div>" +
      "<input type='file' id='"+s.id+"' accept='image/*' style='display:none' onchange='onFotoChange(\""+s.id+"\")'>" +
      "<button class='foto-rm' onclick='removeFoto(event,\""+s.id+"\")'>×</button>" +
      "</div>";
  }).join("");
}

function triggerFoto(id) { document.getElementById(id).click(); }

function onFotoChange(id) {
  var file = document.getElementById(id).files[0];
  if (!file) return;
  compressImage(file, 600, 0.65, function(b64){
    fotoData[id] = b64;
    var slot = document.getElementById("slot-"+id);
    slot.classList.add("has-foto");
    slot.innerHTML =
      "<img src='"+b64+"'>" +
      "<div class='foto-lbl' style='margin-top:4px;'>"+FOTO_SLOTS.find(function(s){return s.id===id;}).label+"</div>" +
      "<input type='file' id='"+id+"' accept='image/*' style='display:none' onchange='onFotoChange(\""+id+"\")'>" +
      "<button class='foto-rm' onclick='removeFoto(event,\""+id+"\")'>×</button>";
  });
}

function removeFoto(e, id) {
  e.stopPropagation();
  delete fotoData[id];
  var s    = FOTO_SLOTS.find(function(x){return x.id===id;});
  var slot = document.getElementById("slot-"+id);
  slot.classList.remove("has-foto");
  slot.innerHTML =
    "<div class='foto-icon'>"+s.icon+"</div>" +
    "<div class='foto-lbl'>"+s.label+"</div>" +
    "<input type='file' id='"+id+"' accept='image/*' style='display:none' onchange='onFotoChange(\""+id+"\")'>" +
    "<button class='foto-rm' onclick='removeFoto(event,\""+id+"\")'>×</button>";
}

function compressImage(file, maxW, quality, cb) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var ratio  = Math.min(maxW / img.width, 1);
      var canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function maskCPF(input) {
  var v = input.value.replace(/\D/g,"").slice(0,11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/,"$1.$2.$3-$4");
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/,"$1.$2.$3");
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/,"$1.$2");
  input.value = v;
}

function saveClient() {
  var nome = document.getElementById("c-nome").value.trim();
  var cpf  = document.getElementById("c-cpf").value.trim();
  var tel  = document.getElementById("c-tel").value.trim();
  if (!nome || !cpf || !tel) { alert("Preencha Nome, CPF e Telefone (*)"); return; }
  var client = {
    id: uid(), nome: nome, cpf: cpf, rg: document.getElementById("c-rg").value.trim(),
    tel: tel, email: document.getElementById("c-email").value.trim(),
    social: document.getElementById("c-social").value.trim(),
    endereco: document.getElementById("c-end").value.trim(),
    indicou: document.getElementById("c-indicou").value.trim(),
    fotos: Object.assign({}, fotoData), createdAt: today()
  };
  clients.push(client);
  persist();
  toast("✅ Cliente " + nome + " cadastrado!");
  clearClientForm(); renderCadastro(); renderClients(); updateClientDatalist();
}

function clearClientForm() {
  ["c-nome","c-cpf","c-rg","c-tel","c-email","c-social","c-end","c-indicou"]
    .forEach(function(id){ document.getElementById(id).value = ""; });
  buildFotoGrid();
}

function deleteClient(id) {
  if (!confirm("Excluir este cadastro?")) return;
  clients = clients.filter(function(c){ return c.id !== id; });
  persist(); renderCadastro();
  toast("🗑 Cadastro removido.");
}

function viewClient(id) {
  var c = clients.find(function(x){ return x.id === id; });
  if (!c) return;
  var fotos = FOTO_SLOTS.map(function(s){
    var b64 = c.fotos && c.fotos[s.id];
    return "<div style='text-align:center;'>" +
      (b64
        ? "<img src='"+b64+"' style='width:100%;height:110px;object-fit:cover;border-radius:8px;border:1px solid var(--border-gold);cursor:pointer;' onclick='window.open(\""+b64+"\")'>"
        : "<div style='height:110px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px;border:1px dashed var(--border);'>" + s.icon + "</div>") +
      "<div style='font-size:10px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:.3px;'>"+s.label+"</div></div>";
  }).join("");
  document.getElementById("modal-title").textContent = "🪪 " + c.nome;
  document.getElementById("modal-body").innerHTML =
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;font-size:13px;'>" +
    rowInfo("CPF", c.cpf) + rowInfo("RG", c.rg||"—") +
    rowInfo("Telefone", c.tel) + rowInfo("Email", c.email||"—") +
    rowInfo("Rede Social", c.social||"—") + rowInfo("Indicado por", c.indicou||"—") +
    "<div style='grid-column:1/-1;'>" + rowInfo("Endereço", c.endereco||"—") + "</div>" +
    "</div>" +
    "<div style='font-size:11px;font-weight:700;color:var(--gold);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;'>Documentos</div>" +
    "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px;'>" + fotos + "</div>" +
    "<div style='margin-top:16px;'><button class='btn btn-danger btn-sm' onclick='deleteClient(\""+c.id+"\");closeModal();'>🗑 Excluir cadastro</button></div>";
  document.getElementById("modal-overlay").classList.add("open");
}

function editClient(id) {
  var c = clients.find(function(x){ return x.id === id; });
  if (!c) return;
  var fotoSlots = FOTO_SLOTS.map(function(s) {
    var b64 = c.fotos && c.fotos[s.id];
    var preview = b64
      ? "<img src='"+b64+"' style='width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:4px;'>"
      : "<div style='font-size:24px;margin-bottom:4px;'>"+s.icon+"</div>";
    return "<div style='text-align:center;'>" +
      preview +
      "<div style='font-size:10px;color:var(--text-muted);margin-bottom:4px;'>"+s.label+"</div>" +
      "<label style='cursor:pointer;font-size:11px;color:var(--gold);border:1px solid var(--border-gold);border-radius:6px;padding:2px 8px;'>" +
        "📎 Alterar<input type='file' accept='image/*' style='display:none;' onchange='onEditFoto(\""+id+"\",\""+s.id+"\",this)'>" +
      "</label></div>";
  }).join("");
  document.getElementById("modal-title").textContent = "✏️ Editar cadastro — " + c.nome;
  document.getElementById("modal-body").innerHTML =
    "<div class='form-grid' style='grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;'>" +
    "<div class='form-group' style='grid-column:1/-1'><label>Nome completo *</label><input id='ec-nome' type='text' value='"+esc(c.nome)+"'></div>" +
    "<div class='form-group'><label>CPF *</label><input id='ec-cpf' type='text' value='"+esc(c.cpf)+"'></div>" +
    "<div class='form-group'><label>RG</label><input id='ec-rg' type='text' value='"+esc(c.rg||"")+"'></div>" +
    "<div class='form-group'><label>Telefone *</label><input id='ec-tel' type='tel' value='"+esc(c.tel)+"'></div>" +
    "<div class='form-group'><label>Email</label><input id='ec-email' type='email' value='"+esc(c.email||"")+"'></div>" +
    "<div class='form-group'><label>Rede social</label><input id='ec-social' type='text' value='"+esc(c.social||"")+"'></div>" +
    "<div class='form-group'><label>Quem indicou</label><input id='ec-indicou' type='text' value='"+esc(c.indicou||"")+"'></div>" +
    "<div class='form-group' style='grid-column:1/-1'><label>Endereço</label><input id='ec-end' type='text' value='"+esc(c.endereco||"")+"'></div>" +
    "</div>" +
    "<div style='font-size:11px;font-weight:700;color:var(--gold);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;'>Documentos e Fotos</div>" +
    "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;'>" + fotoSlots + "</div>" +
    "<div class='form-actions'><button class='btn btn-primary' onclick='saveEditClient(\""+id+"\")'>💾 Salvar alterações</button><button class='btn btn-ghost' onclick='closeModal()'>Cancelar</button></div>";
  document.getElementById("modal-overlay").classList.add("open");
}

function onEditFoto(clientId, slotId, input) {
  if (!input.files || !input.files[0]) return;
  compressImage(input.files[0], 600, 0.65, function(b64) {
    var c = clients.find(function(x){ return x.id === clientId; });
    if (!c) return;
    if (!c.fotos) c.fotos = {};
    c.fotos[slotId] = b64;
    var prev = input.parentElement.parentElement.querySelector("img,div[style*='font-size:24px']");
    if (prev) prev.outerHTML = "<img src='"+b64+"' style='width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:4px;'>";
  });
}

function esc(s) { return String(s||"").replace(/'/g,"&#39;").replace(/"/g,"&quot;"); }

function saveEditClient(id) {
  var nome = document.getElementById("ec-nome").value.trim();
  var cpf  = document.getElementById("ec-cpf").value.trim();
  var tel  = document.getElementById("ec-tel").value.trim();
  if (!nome || !cpf || !tel) { alert("Preencha Nome, CPF e Telefone (*)"); return; }
  var c = clients.find(function(x){ return x.id === id; });
  if (!c) return;
  var nomeAntigo = c.nome;
  c.nome = nome; c.cpf = cpf; c.rg = document.getElementById("ec-rg").value.trim();
  c.tel  = tel;  c.email = document.getElementById("ec-email").value.trim();
  c.social  = document.getElementById("ec-social").value.trim();
  c.indicou = document.getElementById("ec-indicou").value.trim();
  c.endereco = document.getElementById("ec-end").value.trim();
  if (nomeAntigo !== nome) {
    loans.forEach(function(l){ if (l.debtor === nomeAntigo) l.debtor = nome; });
  }
  persist(); closeModal();
  toast("✅ Cadastro de " + nome + " atualizado!");
  renderAll(); updateClientDatalist();
}

function rowInfo(label, val) {
  return "<div style='background:var(--bg3);border-radius:8px;padding:10px 12px;border:1px solid var(--border);'>" +
    "<div style='font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px;'>"+label+"</div>" +
    "<div style='font-size:13px;font-weight:600;color:var(--text);'>"+val+"</div></div>";
}

function updateClientDatalist() {
  var dl = document.getElementById("clientes-datalist");
  if (!dl) return;
  dl.innerHTML = clients.map(function(c) {
    return "<option value='" + c.nome.replace(/'/g,"&#39;") + "'>";
  }).join("");
}

function autoFillClientPhone() {
  var nome  = document.getElementById("f-nome").value.trim();
  var match = clients.find(function(c){ return c.nome.toLowerCase() === nome.toLowerCase(); });
  if (match) {
    var phoneField = document.getElementById("f-phone");
    if (phoneField && !phoneField.value) phoneField.value = match.tel || "";
  }
}

function renderCadastro() {
  buildFotoGrid();
  var list = document.getElementById("cad-list");
  var cnt  = document.getElementById("cad-count");
  if (!list) return;
  if (cnt) cnt.textContent = clients.length + " cliente" + (clients.length!==1?"s":"");
  if (!clients.length) {
    list.innerHTML = "<div class='empty'><div class='icon'>🪪</div><p>Nenhum cliente cadastrado.</p></div>";
    return;
  }
  list.innerHTML = clients.map(function(c){
    var loanCount = loans.filter(function(l){ return l.debtor === c.nome; }).length;
    return "<div class='cad-item' onclick='viewClient(\""+c.id+"\")'>" +
      "<div class='cad-avatar'>"+c.nome[0].toUpperCase()+"</div>" +
      "<div class='cad-info'>" +
        "<div class='cad-name'>"+c.nome+"</div>" +
        "<div class='cad-sub'>CPF: "+c.cpf+" &nbsp;|&nbsp; "+c.tel+(loanCount?" &nbsp;|&nbsp; "+loanCount+" empréstimo"+(loanCount!==1?"s":""):"")+"</div>" +
      "</div>" +
      "<span style='font-size:11px;color:var(--text-muted);'>"+fmtDate(c.createdAt)+"</span>" +
    "</div>";
  }).join("");
}

/* ════════════════════════════════════════
   TABS
════════════════════════════════════════ */
function showTab(name) {
  document.querySelectorAll(".page").forEach(function(p){ p.classList.remove("active"); });
  document.querySelectorAll(".nav-item").forEach(function(t){ t.classList.remove("active"); });
  document.getElementById("tab-"+name).classList.add("active");
  var idx = {"dashboard":0,"novo":1,"cadastro":2,"clientes":3};
  document.querySelectorAll(".nav-item")[idx[name]].classList.add("active");
  renderAll();
}

function renderAll() {
  updateInstallmentStatuses();
  renderDashboard();
  renderCadastro();
  renderClients();
  updateClientDatalist();
  autoNotify();
}

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
var today_date = today();
document.getElementById("f-data").value = today_date;
document.getElementById("f-vcto").value = addMonths(today_date, 1);

window.addEventListener("load", function() {
  try {
    var docId = document.location.pathname.split("/")[2];
    if (docId) Grid.configure({ docId: docId });
  } catch(e) {}

  var sidebarLogo = document.querySelector(".sidebar-logo-img");
  if (sidebarLogo) {
    ["login-logo","register-logo","recover-logo","sig-mode-logo"].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.src = sidebarLogo.src;
    });
  }

  var isSigMode = checkSignatureMode();
  loadState();

  /* ── Listener de storage: detecta assinatura feita em outra aba ── */
  window.addEventListener("storage", function(e) {
    if (e.key === "cv_sig_pending" || e.key === "cv_loans") {
      /* Recarrega dados do localStorage e atualiza dashboard */
      try {
        var lsLoans = localStorage.getItem("cv_loans");
        if (lsLoans) loans = JSON.parse(lsLoans);
      } catch(er) {}
      renderAll();
      /* Notifica o credor visualmente */
      var pending = [];
      try { pending = JSON.parse(localStorage.getItem("cv_sig_pending") || "[]"); } catch(er) {}
      if (pending.length) {
        toast("✅ Nova assinatura recebida de " + (pending[pending.length-1].debtor || "cliente") + "!");
      }
    }
  });

  if (!isSigMode) {
    /* Tenta restaurar sessão do localStorage */
    var savedSession = null;
    try { savedSession = JSON.parse(localStorage.getItem("cv_session")); } catch(e) {}

    if (savedSession && savedSession.user && savedSession.role) {
      /* Restaura sessão sem precisar logar novamente */
      userRole    = savedSession.role;
      currentUser = savedSession.user;

      document.getElementById("login-screen").style.display    = "none";
      document.getElementById("sidebar-username").textContent   = currentUser;
      document.getElementById("sidebar-userrole").textContent   = userRole === "admin" ? "Administrador" : "Usuário";

      var cadPanel = document.getElementById("cad-panel");
      var cadGrid  = document.querySelector("#tab-cadastro > div");

      if (userRole === "admin") {
        document.querySelectorAll(".nav-item").forEach(function(el){ el.style.display = ""; });
        if (cadPanel) cadPanel.style.display = "";
        if (cadGrid)  cadGrid.style.gridTemplateColumns = "";
        showTab("dashboard");
      } else {
        document.querySelectorAll(".nav-item").forEach(function(el, i) {
          el.style.display = (i === 2) ? "" : "none";
        });
        if (cadPanel) cadPanel.style.display = "none";
        if (cadGrid)  cadGrid.style.gridTemplateColumns = "1fr";
        showTab("cadastro");
      }
    } else {
      /* Nenhuma sessão salva — exibe tela de login */
      document.getElementById("login-screen").style.display = "flex";
    }
  }
});

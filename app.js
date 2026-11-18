
const DATA = window.SKD_DATA;
const LS = {
  auth: "patungan_skd_auth_v1",
  session: "patungan_skd_session_v1",
  lastResult: "patungan_skd_last_result_v1"
};

const state = {
  route: "dashboard",
  exam: null,
  results: JSON.parse(localStorage.getItem(LS.lastResult) || "null")
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function sha256(str){
  const data = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-256", data).then(buf =>
    [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("")
  );
}
function fmtTime(sec){
  sec=Math.max(0,Math.floor(sec));
  const h=Math.floor(sec/3600);
  const m=Math.floor((sec%3600)/60);
  const s=sec%60;
  return h ? `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}
function toast(msg){
  const root=$("#toastRoot");
  root.innerHTML=`<div class="toast">${escapeHtml(msg)}</div>`;
  setTimeout(()=>root.innerHTML="",2200);
}
function sectionForTryout(q){
  if(q<=30) return {name:"Tes Wawasan Kebangsaan", short:"TWK"};
  if(q<=65) return {name:"Tes Intelegensia Umum", short:"TIU"};
  return {name:"Tes Karakteristik Pribadi", short:"TKP"};
}
function sectionForPractice(){ return {name:"Tes Intelegensia Umum", short:"TIU"}; }

function isAuthed(){ return sessionStorage.getItem(LS.auth)==="1"; }
function showAuth(){
  $("#authScreen").classList.remove("hidden");
  $("#app").classList.add("hidden");
}
function showApp(){
  $("#authScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
}

async function init(){
  if(isAuthed()) showApp(); else showAuth();
  bindGlobal();
  if(isAuthed()) renderRoute("dashboard");
}

function bindGlobal(){
  $("#loginForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const pw=$("#password").value;
    const hash=await sha256(pw);
    if(hash===DATA.passwordHash){
      sessionStorage.setItem(LS.auth,"1");
      $("#loginError").textContent="";
      $("#password").value="";
      showApp();
      renderRoute("dashboard");
    }else{
      $("#loginError").textContent="Password salah. Silakan coba lagi.";
    }
  });
  $("#togglePassword").addEventListener("click",()=>{
    const el=$("#password");
    el.type=el.type==="password"?"text":"password";
  });
  $("#logoutBtn").addEventListener("click",()=>{
    if(state.exam && !confirm("Keluar sekarang? Progres pengerjaan yang belum selesai akan hilang.")) return;
    sessionStorage.removeItem(LS.auth);
    localStorage.removeItem(LS.session);
    state.exam=null;
    showAuth();
  });
  $$(".nav-item[data-route]").forEach(btn=>{
    btn.addEventListener("click",()=>renderRoute(btn.dataset.route));
  });
}

function setNav(route){
  $$(".nav-item[data-route]").forEach(b=>b.classList.toggle("active",b.dataset.route===route));
}

function renderRoute(route){
  if(state.exam && route!=="exam"){
    if(!confirm("Anda sedang mengerjakan soal. Keluar dari sesi pengerjaan?")) return;
    state.exam=null;
    localStorage.removeItem(LS.session);
  }
  state.route=route;
  setNav(route==="exam" ? "tryout" : route);
  const titles={
    dashboard:"Dashboard Belajar",
    tryout:"Tryout SKD",
    latihan:"Latihan Soal SKD",
    hasil:"Hasil & Pembahasan",
    exam:"Mengerjakan"
  };
  $("#pageTitle").textContent=titles[route]||"Bonus SKD";
  $("#topEyebrow").textContent=DATA.bonusTitle.toUpperCase();
  $("#topActions").innerHTML="";
  if(route==="dashboard") renderDashboard();
  else if(route==="tryout") renderTryoutList();
  else if(route==="latihan") renderPracticeList();
  else if(route==="hasil") renderResultsList();
  else if(route==="exam") renderExam();
}

function renderDashboard(){
  const c=$("#content");
  c.innerHTML=`
    <section class="hero">
      <div class="hero-main">
        <span class="tag">BONUS BIMBEL SKD BATCH 5</span>
        <h1>Latihan lebih terarah.<br>Target lebih jelas.</h1>
        <p>Portal latihan privat untuk mengerjakan Tryout SKD dan latihan soal yang bersumber dari PDF bonus yang telah disiapkan.</p>
        <div class="hero-meta">
          <span>1 Tryout aktif</span><span>2 Tryout Coming Soon</span><span>7 Paket Latihan</span><span>100% sumber PDF</span>
        </div>
      </div>
      <div class="hero-side">
        <img class="logo-mini" src="assets/logo.png" alt="Patungan Bimbel SKD">
        <h3>Patungan Bimbel SKD</h3>
        <p>Bonus Batch 5 untuk membantu mengukur kesiapan melalui simulasi CAT dan latihan topik TIU.</p>
        <span class="bonus-chip">AKSES BONUS AKTIF</span>
      </div>
    </section>

    <div class="section-head">
      <div><h3>Pilih mode belajar</h3><p>Mulai dari simulasi lengkap atau fokus ke topik tertentu.</p></div>
    </div>
    <div class="cards">
      <article class="card">
        <div class="card-top"><div class="icon-box">▣</div><span class="badge live">AKTIF</span></div>
        <h4>Tryout SKD</h4>
        <p>Simulasi 110 soal dengan timer, navigator soal, scoring TWK–TIU–TKP, kunci dan pembahasan.</p>
        <div class="card-stats"><span class="stat-pill">110 Soal</span><span class="stat-pill">100 Menit</span><span class="stat-pill">Skor Maks. 550</span></div>
        <button class="primary-btn card-action" onclick="openIntro('tryout','main')">Mulai Tryout →</button>
      </article>
      <article class="card">
        <div class="card-top"><div class="icon-box">✎</div><span class="badge live">7 PAKET</span></div>
        <h4>Latihan Soal</h4>
        <p>Pilih materi TIU dari 7 paket latihan. Masing-masing berisi 10 soal dengan timer 10 menit.</p>
        <div class="card-stats"><span class="stat-pill">70 Soal</span><span class="stat-pill">7 Topik</span><span class="stat-pill">Pembahasan</span></div>
        <button class="secondary-btn card-action" onclick="renderRoute('latihan')">Lihat Latihan →</button>
      </article>
      <article class="card">
        <div class="card-top"><div class="icon-box">◔</div><span class="badge">ANALITIK</span></div>
        <h4>Hasil & Pembahasan</h4>
        <p>Setelah selesai, lihat skor, jawaban, kunci, waktu, dan pembahasan lengkap per nomor.</p>
        <div class="card-stats"><span class="stat-pill">Statistik</span><span class="stat-pill">Kunci</span><span class="stat-pill">Review</span></div>
        <button class="ghost-btn card-action" onclick="renderRoute('hasil')">Lihat Hasil →</button>
      </article>
    </div>

    <div class="section-head"><div><h3>Tryout</h3><p>Satu paket aktif dari PDF yang diberikan. Dua paket berikutnya disiapkan sebagai coming soon.</p></div></div>
    <div class="cards">
      ${tryoutCard("Tryout SKD – Paket Bonus","110 soal • 100 menit","Paket aktif","main",true)}
      ${tryoutCard("Tryout SKD – Paket 2","Segera hadir","Coming Soon","soon2",false)}
      ${tryoutCard("Tryout SKD – Paket 3","Segera hadir","Coming Soon","soon3",false)}
    </div>

    <div class="section-head"><div><h3>Latihan Soal</h3><p>Topik latihan yang tersedia di PDF bonus.</p></div></div>
    <div class="practice-grid">
      ${practice_slugs_html()}
    </div>

    <div class="notice" style="margin-top:18px">
      <strong>Sumber materi:</strong> soal, pilihan jawaban, kunci, dan pembahasan pada portal ini diambil dari file PDF yang Anda berikan. Gambar soal/pembahasan digunakan sebagai sumber tampilan agar isi tetap setia pada PDF.
    </div>
  `;
}

function tryoutCard(title,meta,badge,id,active){
  return `<article class="card ${active?'':'soon-card'}">
    <div class="card-top"><div class="icon-box">${active?'▣':'…'}</div><span class="badge ${active?'live':'soon'}">${badge}</span></div>
    <h4>${escapeHtml(title)}</h4>
    <p>${active?'Simulasi CAT dengan navigator soal, timer dan evaluasi skor.':'Paket tryout berikutnya sedang disiapkan.'}</p>
    <div class="card-stats"><span class="stat-pill">${escapeHtml(meta)}</span><span class="stat-pill">${active?'TWK • TIU • TKP':'COMING SOON'}</span></div>
    <button class="${active?'primary-btn':'ghost-btn'} card-action" ${active?`onclick="openIntro('tryout','${id}')"`:'disabled'}>${active?'Mulai Tryout →':'Coming Soon'}</button>
  </article>`;
}
function practice_slugs_html(){
  return practice_slugs.map((slug,i)=>{
    const name=practice_names[i];
    return `<article class="practice-card">
      <span class="badge live">10 SOAL • 10 MENIT</span>
      <h4>${escapeHtml(name)}</h4>
      <p>Latihan fokus berdasarkan paket PDF bonus.</p>
      <button class="secondary-btn mini-action" onclick="openIntro('practice','${slug}')">Kerjakan →</button>
    </article>`;
  }).join("");
}

function renderTryoutList(){
  $("#content").innerHTML=`
    <div class="section-head"><div><h3>Tryout SKD</h3><p>Mode simulasi lengkap seperti ruang CAT: timer, navigator, skor dan review.</p></div></div>
    <div class="cards">
      ${tryoutCard("Tryout SKD – Paket Bonus","110 soal • 100 menit","Aktif","main",true)}
      ${tryoutCard("Tryout SKD – Paket 2","Segera hadir","Coming Soon","soon2",false)}
      ${tryoutCard("Tryout SKD – Paket 3","Segera hadir","Coming Soon","soon3",false)}
    </div>
    <div class="notice" style="margin-top:18px">Dua paket tryout berikutnya sengaja ditampilkan sebagai <strong>Coming Soon</strong> sesuai permintaan.</div>
  `;
}

function renderPracticeList(){
  $("#content").innerHTML=`
    <div class="section-head"><div><h3>Latihan Soal</h3><p>70 soal latihan dalam 7 paket, masing-masing 10 soal.</p></div></div>
    <div class="practice-grid">${practice_slugs_html()}</div>
  `;
}

function openIntro(type,id){
  const isTryout=type==="tryout";
  const title=isTryout?"Tryout SKD – Paket Bonus":DATA.practice[id].name;
  const count=isTryout?110:10;
  const duration=isTryout?100:10;
  $("#modalRoot").innerHTML=`
    <div class="modal-backdrop" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="eyebrow">${isTryout?'SIMULASI CAT':'LATIHAN TOPIK'}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${isTryout?'Kerjakan seluruh soal dengan ritme seperti ujian. Timer berjalan sejak Anda menekan mulai.':'Kerjakan 10 soal topik ini dalam 10 menit. Setelah selesai, skor dan pembahasan akan ditampilkan.'}</p>
        <div class="modal-grid">
          <div class="modal-stat"><strong>${count}</strong><span>Soal</span></div>
          <div class="modal-stat"><strong>${duration}</strong><span>Menit</span></div>
          <div class="modal-stat"><strong>${isTryout?'550':'50'}</strong><span>Skor Maks.</span></div>
        </div>
        <div class="notice">Isi soal dan pembahasan ditampilkan dari sumber PDF yang diberikan. Pastikan koneksi stabil sebelum mulai.</div>
        <div class="modal-actions">
          <button class="ghost-btn" onclick="closeModal()">Batal</button>
          <button class="primary-btn" onclick="closeModal(); startExam('${type}','${id}')">Mulai Sekarang →</button>
        </div>
      </div>
    </div>`;
}
function closeModal(e){
  if(e && e.target!==e.currentTarget) return;
  $("#modalRoot").innerHTML="";
}

function startExam(type,id){
  const isTryout=type==="tryout";
  state.exam={
    type,id,
    title:isTryout?"Tryout SKD – Paket Bonus":DATA.practice[id].name,
    total:isTryout?110:10,
    duration:isTryout?100*60:10*60,
    remaining:isTryout?100*60:10*60,
    current:1,
    answers:{},
    startedAt:Date.now()
  };
  localStorage.setItem(LS.session,JSON.stringify(state.exam));
  renderRoute("exam");
}

function renderExam(){
  const e=state.exam;
  if(!e){renderRoute("dashboard");return}
  const isTryout=e.type==="tryout";
  $("#pageTitle").textContent=e.title;
  $("#topEyebrow").textContent="SEDANG MENGERJAKAN";
  $("#topActions").innerHTML=`<span id="topTimer" class="timer">◷ ${fmtTime(e.remaining)}</span>
    <button class="primary-btn" onclick="finishExam(false)">Selesai & Nilai</button>`;
  const key = isTryout ? DATA.tryout.keys[String(e.current)] : DATA.practice[e.id].questions[String(e.current)];
  const qPath = isTryout ? DATA.tryout.questionPaths[String(e.current)] : `assets/latihan/${e.id}/q${String(e.current).padStart(2,'0')}.webp`;
  const section = isTryout ? sectionForTryout(e.current) : sectionForPractice();
  const answered=Object.keys(e.answers).length;
  const percent=Math.round(answered/e.total*100);
  const buttons="ABCDE".split("").map(letter=>`<button class="answer-btn ${e.answers[e.current]===letter?'selected':''}" onclick="selectAnswer('${letter}')">${letter}</button>`).join("");
  $("#content").innerHTML=`
    <div class="exam-wrap">
      <section class="exam-main">
        <div class="question-card">
          <div class="question-head">
            <div class="q-label"><span class="q-number">No. ${e.current}</span><span class="q-section">${section.name}</span></div>
            <span class="badge">${answered}/${e.total} terjawab</span>
          </div>
          <div class="question-image-wrap"><img class="question-image" src="${qPath}" alt="Soal nomor ${e.current}"></div>
          <div class="answer-panel">
            <div class="answer-help">Pilih huruf jawaban yang sesuai dengan opsi pada gambar soal.</div>
            <div class="answer-buttons">${buttons}</div>
            <div class="exam-footer">
              <button class="ghost-btn" onclick="goQuestion(${Math.max(1,e.current-1)})" ${e.current===1?'disabled':''}>← Sebelumnya</button>
              ${e.current<e.total?`<button class="secondary-btn" onclick="goQuestion(${e.current+1})">Selanjutnya →</button>`:`<button class="primary-btn" onclick="finishExam(false)">Selesai & Nilai</button>`}
            </div>
          </div>
        </div>
      </section>
      <aside class="exam-nav">
        <div class="exam-nav-head"><strong>Daftar Soal</strong><span class="timer" id="sideTimer">◷ ${fmtTime(e.remaining)}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
        <div class="nav-group"><div class="nav-group-title">${isTryout?'TWK • No. 1–30':'Latihan • No. 1–10'}</div><div class="question-grid">${questionDots(e,1,isTryout?30:10)}</div></div>
        ${isTryout?`
          <div class="nav-group"><div class="nav-group-title">TIU • No. 31–65</div><div class="question-grid">${questionDots(e,31,65)}</div></div>
          <div class="nav-group"><div class="nav-group-title">TKP • No. 66–110</div><div class="question-grid">${questionDots(e,66,110)}</div></div>
        `:''}
        <div class="notice" style="margin-top:14px">Timer berjalan otomatis. Jawaban tersimpan di perangkat selama sesi ini.</div>
      </aside>
    </div>`;
  startTimer();
}
function questionDots(e,start,end){
  let out="";
  for(let i=start;i<=end;i++){
    const cls=[e.current===i?'current':'',e.answers[i]?'answered':''].filter(Boolean).join(' ');
    out+=`<button class="qdot ${cls}" onclick="goQuestion(${i})">${i}</button>`;
  }
  return out;
}
let timerInterval=null;
function startTimer(){
  clearInterval(timerInterval);
  timerInterval=setInterval(()=>{
    if(!state.exam){clearInterval(timerInterval);return}
    state.exam.remaining=Math.max(0,state.exam.remaining-1);
    const t=fmtTime(state.exam.remaining);
    const top=$("#topTimer"), side=$("#sideTimer");
    if(top){top.textContent=`◷ ${t}`;top.classList.toggle("urgent",state.exam.remaining<=60)}
    if(side){side.textContent=`◷ ${t}`;side.classList.toggle("urgent",state.exam.remaining<=60)}
    if(state.exam.remaining%5===0) localStorage.setItem(LS.session,JSON.stringify(state.exam));
    if(state.exam.remaining===0){
      clearInterval(timerInterval);
      finishExam(true);
    }
  },1000);
}
function selectAnswer(letter){
  if(!state.exam)return;
  state.exam.answers[state.exam.current]=letter;
  localStorage.setItem(LS.session,JSON.stringify(state.exam));
  renderExam();
}
function goQuestion(n){
  if(!state.exam)return;
  state.exam.current=Math.min(state.exam.total,Math.max(1,n));
  localStorage.setItem(LS.session,JSON.stringify(state.exam));
  renderExam();
}
function finishExam(auto){
  if(!state.exam)return;
  if(!auto && !confirm("Yakin ingin mengakhiri pengerjaan dan melihat nilai?")) return;
  clearInterval(timerInterval);
  const result=calculateResult(state.exam);
  state.results=result;
  localStorage.setItem(LS.lastResult,JSON.stringify(result));
  localStorage.removeItem(LS.session);
  state.exam=null;
  renderRoute("hasil");
  toast(auto?"Waktu habis. Hasil sudah dihitung.":"Pengerjaan selesai.");
}

function calculateResult(e){
  const isTryout=e.type==="tryout";
  const total=e.total;
  let score=0,maxScore=isTryout?550:50,correct=0,unanswered=0;
  const details=[];
  for(let q=1;q<=total;q++){
    const chosen=e.answers[q]||null;
    const key=isTryout?DATA.tryout.keys[String(q)]:DATA.practice[e.id].questions[String(q)];
    let points=0;
    if(!chosen) unanswered++;
    if(isTryout && q>=66){
      points=chosen ? (DATA.tryout.tkpScores[String(q)][chosen]||0) : 0;
      if(chosen===key) correct++;
    }else{
      if(chosen===key){correct++;points=5}
    }
    score+=points;
    details.push({q,chosen,key,points,correct:chosen===key});
  }
  const used=e.duration-e.remaining;
  const sectionStats=isTryout?[
    buildSection(details,1,30,"TWK",150),
    buildSection(details,31,65,"TIU",175),
    buildSection(details,66,110,"TKP",225)
  ]:[buildSection(details,1,10,"TIU",50)];
  return {type:e.type,id:e.id,title:e.title,score,maxScore,correct,unanswered,total,usedSeconds:used,details,sectionStats,finishedAt:new Date().toISOString()};
}
function buildSection(details,start,end,name,maxScore){
  const ds=details.filter(d=>d.q>=start&&d.q<=end);
  const score=ds.reduce((a,b)=>a+b.points,0);
  const correct=ds.filter(d=>d.correct).length;
  const unanswered=ds.filter(d=>!d.chosen).length;
  return {name,start,end,maxScore,score,correct,unanswered,total:ds.length};
}

function renderResultsList(){
  const r=state.results;
  if(!r){
    $("#content").innerHTML=`<div class="empty-result"><strong>Belum ada hasil.</strong><br><span>Kerjakan Tryout atau Latihan Soal terlebih dahulu untuk melihat statistik dan pembahasan.</span></div>`;
    return;
  }
  renderResult(r);
}

function renderResult(r){
  $("#topActions").innerHTML=`<button class="ghost-btn" onclick="window.print()">Cetak / Simpan PDF</button>
    <button class="primary-btn" onclick="renderRoute('dashboard')">Kembali Dashboard</button>`;
  const percent=Math.round(r.score/r.maxScore*100);
  const unanswered=r.unanswered;
  const wrong=r.total-r.correct-unanswered;
  const detailHtml=r.details.map(d=>reviewItem(r,d)).join("");
  const keyHtml=r.details.map(d=>`<div class="key-item"><span>No. ${d.q}</span><strong>${d.key}</strong></div>`).join("");
  $("#content").innerHTML=`
    <section class="result-hero">
      <div><div class="eyebrow">HASIL ${r.type==='tryout'?'TRYOUT':'LATIHAN'}</div><h1>${r.score} / ${r.maxScore}</h1><p>${escapeHtml(r.title)} • selesai dalam ${fmtTime(r.usedSeconds)}</p></div>
      <div class="score-big"><strong>${percent}%</strong><span>persentase skor</span></div>
    </section>

    <div class="stats-grid">
      <div class="stat-card"><div class="label">Jawaban Benar</div><strong>${r.correct}</strong><small>dari ${r.total} soal</small></div>
      <div class="stat-card"><div class="label">Jawaban Salah</div><strong>${wrong}</strong><small>berdasarkan kunci PDF</small></div>
      <div class="stat-card"><div class="label">Belum Dijawab</div><strong>${unanswered}</strong><small>tidak mendapat poin</small></div>
      <div class="stat-card"><div class="label">Waktu</div><strong>${fmtTime(r.usedSeconds)}</strong><small>waktu terpakai</small></div>
    </div>

    <div class="section-head"><div><h3>Statistik per bagian</h3><p>Skor dihitung berdasarkan sistem poin pada sumber soal.</p></div></div>
    <div class="section-stats">${r.sectionStats.map(s=>`
      <div class="section-stat">
        <div class="title"><span>${s.name}</span><span>${s.score}/${s.maxScore}</span></div>
        <div class="score">${s.score}</div>
        <div class="meter"><span style="width:${Math.round(s.score/s.maxScore*100)}%"></span></div>
        <div style="font-size:10px;color:#8490a0;margin-top:7px">${s.correct} benar • ${s.unanswered} kosong</div>
      </div>`).join("")}</div>

    <div class="section-head"><div><h3>Kunci Jawaban</h3><p>Kunci diambil dari PDF sumber dan digunakan untuk penilaian.</p></div></div>
    <div class="card"><div class="key-grid">${keyHtml}</div></div>

    <div class="section-head"><div><h3>Pembahasan Lengkap</h3><p>Buka nomor untuk melihat soal, jawaban Anda, kunci dan pembahasan dari PDF.</p></div></div>
    <div class="review-list">${detailHtml}</div>
  `;
}
function reviewItem(r,d){
  const isTryout=r.type==="tryout";
  const qPath=isTryout?DATA.tryout.questionPaths[String(d.q)]:`assets/latihan/${r.id}/q${String(d.q).padStart(2,'0')}.webp`;
  const ePath=isTryout?DATA.tryout.explanationPaths[String(d.q)]:`assets/latihan-explanations/${r.id}/q${String(d.q).padStart(2,'0')}.webp`;
  const chosen=d.chosen||"—";
  const status=d.chosen?(d.correct?"Benar":"Salah"):"Kosong";
  return `<details class="review-item">
    <summary><span>No. ${d.q} • Jawaban ${chosen} • Kunci ${d.key}</span><span class="badge ${d.correct?'live':''}">${status}${r.type==='tryout'&&d.q>=66?' • '+d.points+' poin':''}</span></summary>
    <div class="review-body">
      <div class="review-meta">
        <span class="review-chip ${d.correct?'good':'bad'}">Jawaban Anda: ${chosen}</span>
        <span class="review-chip good">Kunci: ${d.key}</span>
        <span class="review-chip">Poin: ${d.points}</span>
      </div>
      <img class="review-image" src="${qPath}" alt="Soal nomor ${d.q}">
      <img class="review-image" src="${ePath}" alt="Pembahasan nomor ${d.q}">
    </div>
  </details>`;
}

// Resume session if the user refreshes the page while an exam is active.
function resumeSessionIfAny(){
  const raw=localStorage.getItem(LS.session);
  if(!raw)return;
  try{
    const session=JSON.parse(raw);
    if(session && session.type && session.remaining>0){
      const ok=confirm(`Anda masih memiliki sesi "${session.title}" yang belum selesai. Lanjutkan?`);
      if(ok){
        state.exam=session;
        renderRoute("exam");
      }else{
        localStorage.removeItem(LS.session);
      }
    }
  }catch(e){localStorage.removeItem(LS.session)}
}

window.openIntro=openIntro;
window.closeModal=closeModal;
window.startExam=startExam;
window.renderRoute=renderRoute;
window.selectAnswer=selectAnswer;
window.goQuestion=goQuestion;
window.finishExam=finishExam;
window.resumeSessionIfAny=resumeSessionIfAny;

init().then(()=>setTimeout(resumeSessionIfAny,250));

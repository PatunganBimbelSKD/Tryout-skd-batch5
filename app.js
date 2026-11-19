const STORAGE_KEY = 'skd-prime-tryout-v1';
const REPORT_KEY = 'skd-prime-reports-v1';
const LETTERS = ['A','B','C','D','E'];
const $ = (selector, root=document) => root.querySelector(selector);
const app = document.getElementById('app');

let exam, questions = [], practiceData = null, practiceRecords = {}, practiceCurrentId = 'p06', practiceIndex = 1, practiceTimerInterval = null, practiceBundlePromises = {};
let state = null, mode = 'home', resultTab = 'statistik', reviewQuestion = 1, timerInterval = null;
let modalResolver = null;

const ACCESS_SESSION_KEY = 'patungan-skd-access-v1';
const PARTICIPANT_NAME_KEY = 'patungan-skd-participant-name-v1';
const PARTICIPANT_ID_KEY = 'patungan-skd-participant-id-v1';
const ACCESS_HASH = '1cb7d1295ea66ab246669ea70a9cc62c9877a4a92c991ee5832b44126d46a5c1';
let participantName = '';

function ensureParticipantId() {
  let id = sessionStorage.getItem(PARTICIPANT_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    sessionStorage.setItem(PARTICIPANT_ID_KEY, id);
  }
  return id;
}
function participantStateKey() {
  return `${STORAGE_KEY}:${ensureParticipantId()}`;
}
function participantInitials(name) {
  return String(name || 'Peserta').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'P';
}

async function boot() {
  participantName = (sessionStorage.getItem(PARTICIPANT_NAME_KEY) || '').trim();
  if (sessionStorage.getItem(ACCESS_SESSION_KEY) !== 'granted' || !participantName) {
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
    mode = 'gate';
    renderGate();
    return;
  }
  ensureParticipantId();
  await loadApplicationData();
}

async function loadApplicationData() {
  try {
    const [examResponse, questionResponse, practiceResponse] = await Promise.all([
      fetch('./data/exam.json'), fetch('./data/questions.json'), fetch('./data/practice.json')
    ]);
    if (!examResponse.ok || !questionResponse.ok || !practiceResponse.ok) throw new Error('Data tryout atau latihan tidak dapat dimuat.');
    exam = await examResponse.json();
    questions = await questionResponse.json();
    practiceData = await practiceResponse.json();
    state = loadState();
    loadPracticeState();
    if (state?.status === 'inProgress' && state.deadlineAt && Date.now() >= state.deadlineAt) finishExam(true);
    mode = mode === 'gate' ? 'home' : mode;
    render();
    startClock();
  } catch (error) {
    app.innerHTML = `<main class="page-shell"><div class="prep-card"><h1>Tryout belum dapat dimuat</h1><p class="lead">${escapeHtml(error.message)} Pastikan website dibuka melalui server lokal atau GitHub Pages, bukan langsung dari file manager.</p><p class="inline-note">Jalankan <b>python -m http.server 8000</b>, lalu buka http://localhost:8000</p></div></main>`;
  }
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function renderGate(errorMessage='') {
  app.innerHTML = `<main class="gate-screen">
    <div class="gate-orb gate-orb-one" aria-hidden="true"></div><div class="gate-orb gate-orb-two" aria-hidden="true"></div>
    <section class="gate-card">
      <div class="gate-logo-wrap"><img src="assets/logo-patungan.png" alt="Logo Patungan Bimbel SKD" class="gate-logo"></div>
      <span class="gate-eyebrow"><i></i> Akses peserta terbatas</span>
      <h1>Selamat datang di<br><span>Ruang Belajar SKD</span></h1>
      <p class="gate-copy">Bonus eksklusif untuk peserta <b>Bimbel SKD Batch 5</b>. Nama peserta bebas diisi. Password bersama hanya menjadi formalitas akses untuk membuka ruang simulasi.</p>
      <form id="access-form" class="gate-form">
        <label for="participant-name">Nama peserta</label>
        <div class="text-field"><span aria-hidden="true">♙</span><input id="participant-name" name="participantName" type="text" maxlength="60" autocomplete="name" placeholder="Masukkan nama lengkap" required></div>
        <label for="access-password" class="password-label">Password</label>
        <div class="password-field"><span aria-hidden="true">⌑</span><input id="access-password" name="password" type="password" autocomplete="current-password" placeholder="Masukkan password bersama" required></div>
        <p id="access-error" class="gate-error" role="alert">${escapeHtml(errorMessage)}</p>
        <button id="access-submit" class="gate-submit" type="submit"><span>Masuk ke Ruang SKD</span><b>→</b></button>
      </form>
      <div class="gate-foot"><span>✦</span> Patungan Bimbel SKD <i>·</i> Bonus Batch 5</div>
    </section>
    <div class="gate-bottom">SIMULASI CAT SKD <span>•</span> TWK · TIU · TKP</div>
  </main>`;
  $('#participant-name')?.focus();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(participantStateKey()) || 'null');
    if (saved && saved.participantId && saved.participantId !== ensureParticipantId()) return null;
    return saved;
  } catch { return null; }
}
function saveState() {
  if (!state) return;
  state.participantName = participantName;
  state.participantId = ensureParticipantId();
  localStorage.setItem(participantStateKey(), JSON.stringify(state));
}
function practiceStorageKey() { return `skd-practice-v1:${ensureParticipantId()}`; }
function loadPracticeState() {
  try { practiceRecords = JSON.parse(localStorage.getItem(practiceStorageKey()) || '{}') || {}; }
  catch { practiceRecords = {}; }
  const active = Object.entries(practiceRecords).find(([, record]) => record?.status === 'inProgress');
  if (active) practiceCurrentId = active[0];
}
function savePracticeState() {
  try { localStorage.setItem(practiceStorageKey(), JSON.stringify(practiceRecords)); }
  catch { showToast('Penyimpanan progres latihan tidak tersedia pada browser ini.'); }
}
function practicePack(id) { return practiceData?.packs?.find(pack => pack.id === id) || practiceData?.packs?.[0]; }
function practiceRecord(id=practiceCurrentId) { return practiceRecords[id] || null; }
function practiceTimeLeft(record=practiceRecord()) { return record?.deadlineAt ? Math.max(0, Math.ceil((record.deadlineAt - Date.now()) / 1000)) : 0; }
function practiceFormatTime(seconds) { const s=Math.max(0,Math.floor(seconds)); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function practiceAnswered(record=practiceRecord()) { return Object.values(record?.answers || {}).filter(answer => LETTERS.includes(answer)).length; }
function practiceScore(pack, record) { return pack.questions.reduce((sum, question) => sum + (record?.answers?.[question.number] === question.answer ? practiceData.pointsPerCorrect : 0), 0); }
function practiceStats(pack, record) {
  const correct=pack.questions.filter(q=>record?.answers?.[q.number]===q.answer).length;
  const answered=practiceAnswered(record);
  return {correct,wrong:answered-correct,blank:pack.questions.length-answered,score:correct*practiceData.pointsPerCorrect,answered};
}
function practiceStatus(record) {
  if (!record) return 'Belum dikerjakan';
  if (record.status === 'completed') return 'Selesai';
  if (record.status === 'inProgress') return 'Sedang berlangsung';
  return 'Belum dikerjakan';
}
function loadPracticeBundle(id) {
  if (window.__practiceAssetBundles?.[id]) return Promise.resolve();
  if (practiceBundlePromises[id]) return practiceBundlePromises[id];
  practiceBundlePromises[id] = new Promise((resolve,reject) => {
    const script=document.createElement('script');
    script.src=`./data/practice-assets-${id}.js`;
    script.async=true;
    script.onload=()=>window.__practiceAssetBundles?.[id] ? resolve() : reject(new Error('Aset latihan tidak ditemukan.'));
    script.onerror=()=>reject(new Error('Aset gambar paket latihan gagal dimuat. Periksa koneksi internet.'));
    document.head.appendChild(script);
  }).catch(error=>{ delete practiceBundlePromises[id]; throw error; });
  return practiceBundlePromises[id];
}
function practiceAsset(path) { return window.__practiceAssetBundles?.[practiceCurrentId]?.[path] || ''; }
function answeredCount() { return Object.keys(state?.answers || {}).filter(id => state.answers[id]).length; }
function getQuestion(id) { return questions.find(q => q.id === Number(id)); }
function sectionFor(id) { return id <= 30 ? 'TWK' : id <= 65 ? 'TIU' : 'TKP'; }
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h > 0 ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;
}
function remainingSeconds() { return state?.deadlineAt ? Math.max(0, Math.ceil((state.deadlineAt - Date.now()) / 1000)) : exam.durationMinutes * 60; }
function startClock() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (state?.status !== 'inProgress') return;
    const left = remainingSeconds();
    const timer = $('#live-timer');
    if (timer) {
      timer.textContent = formatTime(left);
      timer.classList.toggle('warning', left <= 300);
    }
    if (left <= 0) finishExam(true);
  }, 1000);
}

function render() {
  if (timerInterval) clearInterval(timerInterval);
  if (mode === 'gate') renderGate();
  else if (mode === 'home') renderHome();
  else if (mode === 'prep') renderPrep();
  else if (mode === 'exam') renderExam();
  else if (mode === 'results') renderResults();
  else if (mode === 'practice-home') renderPracticeHome();
  else if (mode === 'practice-prep') renderPracticePrep();
  else if (mode === 'practice-exam') renderPracticeExam();
  else if (mode === 'practice-results') renderPracticeResults();
  else if (mode === 'practice-review') renderPracticeReview();
  startClock();
  startPracticeClock();
}

function header(actions='') {
  const name = participantName || 'Peserta';
  return `<header class="topbar"><div class="topbar-inner">
    <a class="brand" href="#home" data-action="home" aria-label="Patungan Bimbel SKD beranda">
      <img class="brand-logo" src="assets/logo-patungan.png" alt="">
      <span class="brand-copy"><strong>PATUNGAN BIMBEL SKD</strong><small>TRYOUT & LATIHAN · BONUS BATCH 5</small></span>
    </a>
    <div class="topbar-actions">
      ${actions}
      <button class="icon-button" type="button" data-action="theme" title="Ganti tampilan" aria-label="Ganti tampilan">◐</button>
      <button class="profile-chip" type="button" data-action="logout" title="Keluar dan ganti peserta">
        <span class="profile-avatar">${escapeHtml(participantInitials(name))}</span>
        <span class="profile-name">${escapeHtml(name)}</span>
        <span class="profile-switch" aria-hidden="true">↪</span>
      </button>
    </div>
  </div></header>`;
}
function commonActions() {
  return `<button class="icon-button" type="button" data-action="help" title="Bantuan" aria-label="Bantuan">?</button>`;
}

function renderHome() {
  const inProgress = state?.status === 'inProgress' && remainingSeconds() > 0;
  const completed = state?.status === 'completed' && state.result;
  const mainAction = inProgress
    ? `<button class="primary-button" data-action="resume">Lanjutkan Tryout <span>→</span></button><button class="secondary-button" data-action="restart-confirm">Mulai Ulang</button>`
    : completed
      ? `<button class="primary-button" data-action="view-results">Lihat Hasil Terakhir <span>→</span></button><button class="secondary-button" data-action="start">Ulangi Tryout</button>`
      : `<button class="primary-button" data-action="start">Kerjakan Tryout <span>→</span></button>`;
  app.innerHTML = `${header(commonActions())}
    <main class="page-shell home-page">
      <div class="breadcrumb"><span>Beranda</span><span>›</span><strong>Tryout SKD CPNS</strong></div>
      <section class="hero-panel brand-hero">
        <div class="hero-content">
          <span class="hero-kicker"><span>✦</span> BONUS EKSKLUSIF · BIMBEL SKD BATCH 5</span>
          <div class="participant-welcome">Selamat datang, <b>${escapeHtml(participantName)}</b></div>
          <h1>Siapkan dirimu.<br><em>Taklukkan SKD.</em></h1>
          <p>Ruang simulasi CAT untuk mengukur kesiapan menghadapi Seleksi Kompetensi Dasar. Kerjakan dengan fokus, pantau waktu, dan evaluasi hasil secara langsung.</p>
          <div class="hero-stat-row">
            <span class="hero-stat"><b>110</b> Soal</span><span class="hero-stat"><b>100</b> Menit</span><span class="hero-stat"><b>3</b> Subtes</span>
          </div>
        </div>
        <div class="hero-art brand-hero-art"><div class="logo-orbit"><span class="orbit-dot"></span><img src="assets/logo-patungan.png" alt="Patungan Bimbel SKD"></div><div class="hero-spark spark-one">✦</div><div class="hero-spark spark-two">✧</div></div>
        <div class="hero-shine" aria-hidden="true"></div>
      </section>

      <nav class="activity-tabs" aria-label="Kategori materi">
        <button class="activity-tab active" type="button" data-action="home-tab" data-tab="tryout"><span class="tab-icon">▤</span> Tryout <i>01</i></button>
        <button class="activity-tab" type="button" data-action="practice-home"><span class="tab-icon">✎</span> Latihan Soal <i>07</i></button>
        <button class="activity-tab" type="button" data-action="results-tab"><span class="tab-icon">▥</span> Hasil ${completed?'<i>1</i>':''}</button>
      </nav>

      <div class="section-heading"><div><div class="eyebrow">Ruang simulasi</div><h2>Pilih paket Tryout</h2><p>Mulai dari paket yang telah disiapkan khusus untuk Bonus Bimbel SKD Batch 5.</p></div><span class="availability-chip"><i></i> 1 aktif · 2 segera hadir</span></div>
      <div class="exam-grid">
        <article class="exam-card active-exam-card">
          <div class="package-top"><span class="package-chip active-chip">PAKET 01 · TERSEDIA</span><span class="package-live"><i></i> Siap dikerjakan</span></div>
          <div class="exam-title-row"><div class="exam-icon">▤</div><div><h3>${escapeHtml(exam.title)}</h3><p>${escapeHtml(exam.subtitle)}</p></div></div>
          <div class="exam-meta"><span>◷ <b>100 menit</b></span><span>▤ <b>110 soal</b></span><span>☑ <b>TWK · TIU · TKP</b></span></div>
          <div class="package-grade"><span>Passing grade per subtes</span><b>TWK 65 <i>·</i> TIU 80 <i>·</i> TKP 166</b></div>
          <div class="exam-card-actions">${mainAction}</div>
          ${inProgress ? `<div class="inline-note">${answeredCount()} dari 110 soal sudah dijawab · Progres tersimpan di perangkat ini</div>` : ''}
        </article>
        <article class="exam-card coming-soon-card"><div class="package-top"><span class="package-chip">PAKET 02</span><span class="soon-pill">COMING SOON</span></div><div class="soon-art"><span>02</span><i>✦</i></div><h3>Tryout SKD Paket 02</h3><p>Paket simulasi berikutnya sedang dipersiapkan.</p><div class="soon-line"><span></span></div><button class="soon-button" type="button" disabled>Segera Hadir</button></article>
        <article class="exam-card coming-soon-card"><div class="package-top"><span class="package-chip">PAKET 03</span><span class="soon-pill">COMING SOON</span></div><div class="soon-art"><span>03</span><i>✧</i></div><h3>Tryout SKD Paket 03</h3><p>Paket simulasi tambahan akan dibuka menyusul.</p><div class="soon-line"><span></span></div><button class="soon-button" type="button" disabled>Segera Hadir</button></article>
      </div>

      <section class="practice-teaser"><div class="practice-icon">✎</div><div><span class="eyebrow">Mode belajar mandiri</span><h3>Latihan Soal SKD · 7 Paket</h3><p>70 soal TIU dari materi Bonus Bimbel SKD Batch #5. Setiap paket berdurasi 10 menit, lengkap dengan kunci dan pembahasan.</p></div><button class="secondary-button" type="button" data-action="practice-home">Mulai Latihan →</button></section>
      <div class="feature-grid">
        <article class="feature-card"><span class="feature-icon">◷</span><div><strong>Timer CAT Otomatis</strong><p>Hitung mundur 100 menit dengan penyimpanan progres otomatis.</p></div></article>
        <article class="feature-card"><span class="feature-icon">▦</span><div><strong>Navigasi 110 Soal</strong><p>Pindah nomor dengan cepat dan pantau soal yang sudah dijawab.</p></div></article>
        <article class="feature-card"><span class="feature-icon">✓</span><div><strong>Evaluasi Terperinci</strong><p>Nilai TWK, TIU, TKP, kunci, bobot, dan pembahasan setelah ujian.</p></div></article>
      </div>
      <div class="footer-note">PATUNGAN BIMBEL SKD · BONUS BIMBEL SKD BATCH 5</div>
    </main>`;
}
function renderPrep() {
  app.innerHTML = `${header(commonActions())}<main class="page-shell"><div class="prep-wrap">
    <div class="breadcrumb"><span>Beranda</span><span>›</span><span>Tryout SKD CPNS</span><span>›</span><strong>Persiapan mengerjakan</strong></div>
    <h1 style="font-size:27px;letter-spacing:-.04em;margin:0 0 17px">Persiapan Mengerjakan</h1>
    <div class="prep-alert"><span class="alert-symbol">i</span><div><b>PENTING</b><br>Pastikan perangkat dan koneksi internet siap. Jawaban tersimpan otomatis di perangkat ini selama tryout berlangsung.</div></div>
    <section class="prep-card">
      <div class="participant-summary"><span>Nama peserta</span><strong>${escapeHtml(participantName)}</strong></div>
      <div class="eyebrow">Paket ujian</div><h1>${escapeHtml(exam.title)}</h1><p class="lead">${escapeHtml(exam.subtitle)} · Kerjakan seluruh soal dalam satu sesi.</p>
      <div class="prep-metrics">
        <div class="metric-box"><small>Jumlah soal</small><strong>110</strong><span>TWK 30 · TIU 35 · TKP 45</span></div>
        <div class="metric-box"><small>Durasi</small><strong>100</strong><span>Menit</span></div>
        <div class="metric-box"><small>Mode pengerjaan</small><strong>CAT</strong><span>Satu soal per tampilan</span></div>
      </div>
      <div class="eyebrow">Passing grade</div>
      <div class="grade-grid">
        <div class="grade-item"><small>TWK · Wawasan Kebangsaan</small><strong>65</strong></div>
        <div class="grade-item"><small>TIU · Intelegensia Umum</small><strong>80</strong></div>
        <div class="grade-item"><small>TKP · Karakteristik Pribadi</small><strong>166</strong></div>
      </div>
      <div class="prep-checklist">
        <div class="check-row"><span class="check-dot">✓</span><span>Pastikan koneksi internet stabil dan jangan menutup halaman selama mengerjakan.</span></div>
        <div class="check-row"><span class="check-dot">✓</span><span>Gunakan tombol navigasi atau tombol panah kiri/kanan untuk berpindah soal.</span></div>
        <div class="check-row"><span class="check-dot">✓</span><span>Pilih satu jawaban untuk setiap soal. Jawaban dapat diubah sebelum ujian diselesaikan.</span></div>
        <div class="check-row"><span class="check-dot">✓</span><span>Jika waktu habis, sistem akan mengakhiri ujian dan menghitung nilai berdasarkan jawaban yang tersimpan.</span></div>
      </div>
      <div class="prep-actions"><button class="ghost-button" data-action="home">Kembali</button><button class="primary-button" data-action="begin">Mulai Mengerjakan&nbsp; →</button></div>
    </section>
  </div></main>`;
}

function renderQuestionTable(table) {
  if (!table) return '';
  const head = table.headers?.length ? `<thead><tr>${table.headers.map(cell=>`<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>` : '';
  const rows = (table.rows || []).map(row=>`<tr>${row.map(cell=>`<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  return `<div class="question-table-wrap"><table class="question-table">${head}<tbody>${rows}</tbody></table></div>`;
}

function renderExam() {
  const q = getQuestion(state.currentQuestion || 1);
  const count = answeredCount();
  const section = exam.sections.find(s => s.id === q.section);
  const options = q.options.map((text, idx) => {
    const letter = LETTERS[idx], selected = state.answers[q.id] === letter;
    return `<button class="option-button ${selected ? 'selected' : ''}" type="button" data-action="answer" data-letter="${letter}" aria-pressed="${selected}">
      <span class="option-letter">${letter}</span><span class="option-text">${escapeHtml(text)}</span>
    </button>`;
  }).join('');
  const figure = q.figure ? `<img class="question-figure" src="${q.figure}" alt="${escapeHtml(q.figureAlt || 'Ilustrasi soal')}" />` : '';
  app.innerHTML = `${header(`<button class="icon-button" data-action="help" title="Bantuan">?</button><button class="icon-button" data-action="home" title="Keluar sementara">×</button>`)}
    <main class="page-shell" style="padding-top:22px">
      <div class="exam-topline">
        <div class="exam-title-mini"><span class="mini-mark">▤</span><div><strong>${escapeHtml(exam.title)}</strong><small>Peserta: ${escapeHtml(participantName)} · ${count}/110 dijawab</small></div></div>
        <div class="exam-tools"><button class="mobile-nav-toggle" data-action="toggle-nav">☷ Daftar Soal (${count}/110)</button><button class="ghost-button" data-action="finish" style="min-height:39px;padding:0 14px">✓ Selesai</button><span id="live-timer" class="timer-chip">${formatTime(remainingSeconds())}</span></div>
      </div>
      <div class="exam-layout">
        <section class="question-card">
          <div class="question-header">
            <div class="question-number"><span class="number-pill">No. ${q.id}</span><div class="question-section"><small>${section.name}</small><strong>${escapeHtml(q.topic)}</strong></div></div>
            <button class="report-button" data-action="report" data-qid="${q.id}">⚑ Lapor</button>
          </div>
          ${q.stem ? `<div class="question-stem">${escapeHtml(q.stem)}</div>` : ''}
          ${renderQuestionTable(q.table)}
          ${figure}
          <div class="options-list">${options}</div>
          <div class="question-footer">
            <button class="secondary-button" data-action="previous" ${q.id===1?'disabled':''}>‹ Sebelumnya</button>
            <div class="question-count">Soal <b>${q.id}</b> dari 110</div>
            <button class="primary-button" data-action="next">${q.id===110?'Tinjau Akhir':'Selanjutnya'} →</button>
          </div>
          <div class="keyboard-hint">Tekan <b>←</b> / <b>→</b> untuk pindah soal · <b>A–E</b> untuk memilih jawaban</div>
        </section>
        <aside id="navigator-card" class="navigator-card">
          <div class="navigator-head"><strong>Daftar Soal</strong><span>${count}/110 terjawab</span></div>
          <div class="nav-progress"><span style="width:${count/110*100}%"></span></div>
          ${exam.sections.map(s => renderNavGroup(s)).join('')}
          <div class="nav-legend"><span><i class="legend-dot"></i>Terjawab</span><span><i class="legend-dot empty"></i>Belum dijawab</span></div>
        </aside>
      </div>
    </main>`;
  // Keep the current number visible in the navigator on long sections.
  const currentNav = $(`.nav-number[data-qid="${q.id}"]`);
  if (currentNav && window.innerWidth > 760) currentNav.scrollIntoView({block:'nearest'});
}

function renderNavGroup(section) {
  const nums=[];
  for (let n=section.from;n<=section.to;n++) {
    const answered=!!state.answers[n], current=Number(state.currentQuestion)===n;
    nums.push(`<button class="nav-number ${answered?'answered':''} ${current?'current':''}" type="button" data-action="goto" data-qid="${n}" aria-label="Soal ${n}${answered?', sudah dijawab':', belum dijawab'}">${n}</button>`);
  }
  return `<div class="nav-group"><div class="nav-group-head"><span>${section.name}</span><small>${section.from}–${section.to} · ${Object.keys(state.answers).filter(k=>Number(k)>=section.from&&Number(k)<=section.to).length}/${section.count}</small></div><div class="nav-grid">${nums.join('')}</div></div>`;
}

function calculateResult() {
  const scores={TWK:0,TIU:0,TKP:0};
  const stats={TWK:{correct:0,wrong:0,blank:0},TIU:{correct:0,wrong:0,blank:0},TKP:{correct:0,wrong:0,blank:0}};
  for (const q of questions) {
    const answer=state.answers[q.id];
    if (!answer) { stats[q.section].blank++; continue; }
    const earned=q.optionScores?.[answer] ?? (answer===q.correctAnswer?5:0);
    scores[q.section]+=earned;
    if (answer===q.correctAnswer) stats[q.section].correct++;
    else stats[q.section].wrong++;
  }
  const total=scores.TWK+scores.TIU+scores.TKP;
  const passed=exam.sections.every(s=>scores[s.id]>=s.passingGrade);
  return {participantName:state.participantName || participantName,scores,stats,total,passed,answered:answeredCount(),completedAt:Date.now(),timeUsed:Math.max(0,exam.durationMinutes*60-remainingSeconds())};
}

function finishExam(auto=false) {
  if (state?.status !== 'inProgress') return;
  state.status='completed';
  state.result=calculateResult();
  state.result.autoFinished=!!auto;
  state.completedAt=Date.now();
  saveState();
  mode='results'; resultTab='statistik'; reviewQuestion=1;
  render();
  if (auto) showToast('Waktu habis. Jawaban yang tersimpan telah dinilai.');
}

function renderResults() {
  const r=state.result;
  const gradeCards=exam.sections.map(s=>{
    const score=r.scores[s.id], pass=score>=s.passingGrade;
    return `<article class="result-grade"><small>${s.name}</small><strong>${score}<span style="font-size:12px;color:#9aa7ba"> / ${s.maxScore}</span></strong><span>Passing grade ${s.passingGrade}</span><div class="${pass?'pass-tag':'fail-tag'}">${pass?'Memenuhi passing grade':'Belum memenuhi'}</div></article>`;
  }).join('');
  const actionButtons=`<button class="icon-button" data-action="help" title="Bantuan">?</button>`;
  app.innerHTML=`${header(actionButtons)}<main class="page-shell">
    <div class="breadcrumb"><span>Beranda</span><span>›</span><span>Hasil Tryout</span><span>›</span><strong>Statistik & Pembahasan</strong></div>
    <section class="result-hero"><div><span class="hero-kicker" style="background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.22)">✦ Hasil pengerjaan</span><h1>${r.passed?'Kerja bagus!':'Terus tingkatkan hasilmu.'}</h1><p>Peserta: <b>${escapeHtml(r.participantName || participantName)}</b> · ${r.answered} dari 110 soal dijawab · Waktu digunakan ${formatTime(r.timeUsed)}</p></div><div class="result-score-box"><strong>${r.total}</strong><small>TOTAL POIN / 550</small></div></section>
    <div class="result-grade-row">${gradeCards}</div>
    <div class="result-tabs"><button class="result-tab ${resultTab==='statistik'?'active':''}" data-action="result-tab" data-tab="statistik">Statistik</button><button class="result-tab ${resultTab==='pembahasan'?'active':''}" data-action="result-tab" data-tab="pembahasan">Pembahasan</button></div>
    ${resultTab==='statistik'?renderStatistics(r):renderReview()}
    <div class="prep-actions" style="margin-top:18px"><button class="ghost-button" data-action="home">Kembali ke Beranda</button><button class="primary-button" data-action="restart-confirm">Ulangi Tryout →</button></div>
  </main>`;
}

function renderStatistics(r) {
  const max={TWK:150,TIU:175,TKP:225};
  const rows=exam.sections.map(s=>`<div class="chart-row"><span>${s.id}</span><div class="chart-track"><div class="chart-fill" style="width:${Math.max(0,Math.min(100,r.scores[s.id]/max[s.id]*100))}%"></div></div><b>${r.scores[s.id]}</b></div>`).join('');
  const optimal=r.stats.TWK.correct+r.stats.TIU.correct+r.stats.TKP.correct;
  const other=r.stats.TWK.wrong+r.stats.TIU.wrong+r.stats.TKP.wrong;
  const blank=r.stats.TWK.blank+r.stats.TIU.blank+r.stats.TKP.blank;
  const sectionRows=exam.sections.map(s=>{
    const st=r.stats[s.id];
    const first=s.id==='TKP'?'Pilihan 5 poin':'Benar';
    const second=s.id==='TKP'?'Pilihan 1–4 poin':'Salah';
    return `<div class="detail-stat-row"><strong>${s.id}</strong><span>${first}<b>${st.correct}</b></span><span>${second}<b>${st.wrong}</b></span><span>Kosong<b>${st.blank}</b></span></div>`;
  }).join('');
  return `<section class="result-panel"><h2>Ringkasan pengerjaan</h2><div class="stat-row"><div class="stat-box"><strong>${r.answered}</strong><small>Soal dijawab</small></div><div class="stat-box"><strong>${optimal}</strong><small>Jawaban dengan poin tertinggi</small></div><div class="stat-box"><strong>${other}</strong><small>Pilihan bernilai / belum optimal</small></div><div class="stat-box"><strong>${blank}</strong><small>Belum dijawab</small></div></div><h2 style="margin-top:25px">Grafik skor per subtes</h2>${rows}<h2 style="margin-top:25px">Rincian respons</h2><div class="detail-stat-table">${sectionRows}</div><p class="inline-note" style="text-align:left">TWK dan TIU bernilai 5 poin untuk jawaban benar. Pada TKP, setiap pilihan memiliki bobot 1–5 poin; pilihan selain bobot tertinggi tetap memperoleh nilai.</p></section>`;
}
function renderReview() {
  const q=getQuestion(reviewQuestion), answer=state.answers[q.id], correct=q.correctAnswer;
  const section=exam.sections.find(s=>s.id===q.section);
  const opts=q.options.map((text,idx)=>{
    const L=LETTERS[idx], chosen=answer===L, isCorrect=correct===L;
    let cls='option-button'; if(isCorrect) cls+=' correct'; else if(chosen) cls+=' incorrect';
    const score=q.section==='TKP'?`<span class="option-trailing">${q.optionScores[L]} poin</span>`:'';
    return `<div class="${cls}" style="cursor:default"><span class="option-letter">${L}</span><span class="option-text">${escapeHtml(text)}${chosen&&!isCorrect?' · Jawaban Anda':''}${isCorrect?(q.section==='TKP'?' · Bobot tertinggi':' · Kunci jawaban'):''}</span>${score}</div>`;
  }).join('');
  const figure=q.figure?`<img class="question-figure" src="${q.figure}" alt="${escapeHtml(q.figureAlt||'Ilustrasi soal')}"/>`:'';
  const earned=answer?(q.optionScores?.[answer]??(answer===correct?5:0)):0;
  return `<div class="review-layout"><aside class="review-list">${questions.map(item=>`<button class="${item.id===q.id?'active':''}" data-action="review-goto" data-qid="${item.id}"><span>No. ${item.id}</span><span class="review-state">${state.answers[item.id]?(state.answers[item.id]===item.correctAnswer?'✓':'•'):'—'}</span></button>`).join('')}</aside><article class="review-card"><div class="question-header"><div class="question-number"><span class="number-pill">No. ${q.id}</span><div class="question-section"><small>${section.name}</small><strong>${escapeHtml(q.topic)}</strong></div></div><span class="${answer===correct?'pass-tag':'fail-tag'}">${answer?`${earned} poin`:'Belum dijawab'}</span></div>${q.stem?`<div class="question-stem">${escapeHtml(q.stem)}</div>`:''}${renderQuestionTable(q.table)}${figure}<div class="options-list">${opts}</div><div class="review-explanation"><h3>✦ Pembahasan</h3><p>${escapeHtml(q.explanation||'Pembahasan belum tersedia untuk soal ini.')}</p></div><div class="review-foot"><button class="secondary-button" data-action="review-prev" ${q.id===1?'disabled':''}>‹ Sebelumnya</button><span class="question-count">Pembahasan ${q.id} dari 110</span><button class="primary-button" data-action="review-next" ${q.id===110?'disabled':''}>Selanjutnya →</button></div></article></div>`;
}

function renderPracticeTabs(active='latihan') {
  const completed=practiceData.packs.filter(pack=>practiceRecords[pack.id]?.status==='completed').length;
  return `<nav class="activity-tabs practice-tabs" aria-label="Kategori materi">
    <button class="activity-tab ${active==='tryout'?'active':''}" type="button" data-action="home"><span class="tab-icon">▤</span> Tryout</button>
    <button class="activity-tab ${active==='latihan'?'active':''}" type="button" data-action="practice-home"><span class="tab-icon">✎</span> Latihan Soal <i>${completed}/7</i></button>
    <button class="activity-tab ${active==='hasil'?'active':''}" type="button" data-action="results-tab"><span class="tab-icon">▥</span> Hasil</button>
  </nav>`;
}
function renderPracticeHome() {
  const completed=practiceData.packs.filter(pack=>practiceRecords[pack.id]?.status==='completed').length;
  const answered=practiceData.packs.reduce((sum,pack)=>sum+practiceAnswered(practiceRecords[pack.id]),0);
  const order=practiceData.displayOrder || practiceData.packs.map(pack=>pack.id);
  const cards=order.map(id=>{
    const pack=practicePack(id),record=practiceRecords[id],status=practiceStatus(record);
    const score=record?.status==='completed'?practiceScore(pack,record):null;
    const label=record?.status==='inProgress'?'Lanjutkan':record?.status==='completed'?'Lihat hasil':'Kerjakan paket';
    const action=record?.status==='completed'?'practice-view-result':'practice-prepare';
    return `<article class="practice-card ${record?.status==='completed'?'is-complete':record?.status==='inProgress'?'is-progress':''}">
      <div class="practice-card-top"><span class="practice-card-icon">${String(order.indexOf(id)+1).padStart(2,'0')}</span><span class="practice-status ${record?.status||'new'}">${status}</span></div>
      <span class="practice-kicker">BONUS LATIHAN · TIU</span><h3>${escapeHtml(pack.title)}</h3><p>${escapeHtml(pack.category)}</p>
      <div class="practice-card-meta"><span>▤ 10 soal</span><span>◷ 10 menit</span><span>★ 50 poin</span></div>
      ${record?.status==='inProgress'?`<div class="practice-card-progress"><span>${practiceAnswered(record)}/10 terjawab</span><b>${practiceFormatTime(practiceTimeLeft(record))}</b></div>`:''}
      ${record?.status==='completed'?`<div class="practice-card-score"><b>${score}/50</b><span>${practiceStats(pack,record).correct} benar · ${practiceStats(pack,record).wrong} salah</span></div>`:''}
      <button class="primary-button button-wide" type="button" data-action="${action}" data-pack-id="${pack.id}">${label} <span>→</span></button>
    </article>`;
  }).join('');
  app.innerHTML=`${header(commonActions())}<main class="page-shell practice-page">
    <div class="breadcrumb"><span>Beranda</span><span>›</span><strong>Latihan Soal SKD</strong></div>
    ${renderPracticeTabs('latihan')}
    <section class="practice-hero"><div><span class="hero-kicker">✦ BONUS BIMBEL SKD BATCH 5</span><h1>Asah kemampuanmu.<br><em>Selangkah lebih siap.</em></h1><p>Latihan mandiri Tes Intelegensia Umum untuk mengasah ketelitian, penalaran, dan kemampuan numerik.</p></div><div class="practice-hero-stats"><div><b>7</b><span>Paket</span></div><div><b>70</b><span>Soal</span></div><div><b>10</b><span>Menit/paket</span></div></div></section>
    <section class="practice-progress-panel"><div><div><b>Progres latihan</b><span>${completed} dari 7 paket selesai</span></div><strong>${Math.round(completed/7*100)}%</strong></div><div class="practice-progress-track"><span style="width:${completed/7*100}%"></span></div><small>${answered} dari 70 soal telah dijawab pada seluruh paket.</small></section>
    <div class="section-heading practice-section-heading"><div><div class="eyebrow">Pilih materi</div><h2>Daftar Paket Latihan</h2><p>Setiap paket dapat dikerjakan secara mandiri dan memiliki riwayat masing-masing.</p></div><span class="availability-chip"><i></i> 7 paket tersedia</span></div>
    <div class="practice-grid">${cards}</div>
    <div class="footer-note">PATUNGAN BIMBEL SKD · LATIHAN MANDIRI TIU</div>
  </main>`;
}
async function practicePrepare(id) {
  practiceCurrentId=id;
  showToast('Memuat gambar dan materi paket latihan...');
  try {
    await loadPracticeBundle(id);
    $('.toast')?.remove();
    const record=practiceRecords[id];
    if(record?.status==='inProgress' && practiceTimeLeft(record)<=0) {
      finalizePractice(id,true);
      mode='practice-results';
    } else mode='practice-prep';
    render();
  } catch(error) { showToast(error.message || 'Materi latihan gagal dimuat.'); }
}
function renderPracticePrep() {
  const pack=practicePack(practiceCurrentId),record=practiceRecord(),active=record?.status==='inProgress',completed=record?.status==='completed';
  const count=practiceAnswered(record);
  app.innerHTML=`${header(commonActions())}<main class="page-shell practice-page">
    <div class="breadcrumb"><span>Beranda</span><span>›</span><button class="breadcrumb-link" data-action="practice-home">Latihan Soal</button><span>›</span><strong>Persiapan</strong></div>
    ${renderPracticeTabs('latihan')}
    <div class="practice-prep-wrap"><div class="eyebrow">PERSIAPAN LATIHAN · TIU</div><h1>${escapeHtml(pack.title)}</h1><p class="practice-lead">${escapeHtml(pack.category)} · 10 soal pilihan ganda</p>
      <div class="practice-prep-card"><div class="practice-prep-metrics"><div><small>Jumlah soal</small><b>10</b></div><div><small>Durasi</small><b>10 menit</b></div><div><small>Skor maksimal</small><b>50 poin</b></div></div>
        ${active?`<div class="practice-session-progress"><b>Progres sebelumnya: ${count}/10 soal dijawab</b><span>Sisa waktu: ${practiceFormatTime(practiceTimeLeft(record))}</span><div class="practice-progress-track"><span style="width:${count*10}%"></span></div></div>`:''}
        ${completed?`<div class="practice-session-progress completed"><b>Hasil terakhir: ${practiceScore(pack,record)}/50 poin</b><span>${practiceStats(pack,record).correct} jawaban benar · ${practiceStats(pack,record).wrong} jawaban salah · ${practiceStats(pack,record).blank} kosong</span><button class="text-link-button" data-action="practice-review">Lihat pembahasan terakhir →</button></div>`:''}
      </div>
      <div class="practice-guidelines"><div class="practice-guideline-icon">i</div><div><b>Sebelum memulai</b><ul><li>Timer 10 menit mulai berjalan setelah Anda memulai paket.</li><li>Jawaban tersimpan otomatis pada browser dan dapat diubah selama waktu tersedia.</li><li>Waktu tetap berjalan jika halaman ditutup atau dimuat ulang.</li><li>Setiap jawaban benar bernilai 5 poin; jawaban salah atau kosong bernilai 0 poin.</li><li>Kunci dan pembahasan dapat dilihat setelah paket diselesaikan.</li></ul></div></div>
      <div class="practice-prep-actions"><button class="ghost-button" data-action="practice-home">Kembali ke daftar</button><button class="primary-button" data-action="practice-start">${active?'Lanjutkan latihan':completed?'Ulangi paket':'Mulai mengerjakan'} →</button></div>
    </div>
  </main>`;
}
function practiceStart() {
  const record=practiceRecord();
  if(record?.status==='inProgress') {
    if(practiceTimeLeft(record)<=0) { finalizePractice(practiceCurrentId,true); mode='practice-results'; render(); return; }
    practiceIndex=Math.min(10,Math.max(1,Number(record.currentQuestion)||1)); mode='practice-exam'; render(); return;
  }
  const repeated=record?.status==='completed';
  showModal(repeated?'Ulangi paket latihan?':'Mulai latihan?',`<p>${repeated?'Hasil sebelumnya pada paket ini akan diganti.':'Timer 10 menit akan mulai berjalan setelah Anda menekan tombol mulai.'} Pastikan koneksi internet stabil dan Anda siap mengerjakan 10 soal.</p><div class="modal-list"><div class="modal-list-item"><b>10 soal</b> dalam satu paket</div><div class="modal-list-item"><b>50 poin</b> skor maksimal</div></div>`,`<button class="ghost-button" data-action="close-modal">Batal</button><button class="primary-button" data-action="practice-confirm-start">${repeated?'Ya, Ulangi':'Mulai sekarang'}</button>`,'✎');
}
function practiceBeginNew() {
  practiceRecords[practiceCurrentId]={status:'inProgress',answers:{},currentQuestion:1,startedAt:Date.now(),deadlineAt:Date.now()+practiceData.durationMinutes*60*1000};
  practiceIndex=1; savePracticeState(); mode='practice-exam'; render();
}
function practiceMove(number) {
  if(number<1 || number>10) return;
  practiceIndex=number;
  const record=practiceRecord();
  if(record?.status==='inProgress') { record.currentQuestion=number; savePracticeState(); }
  renderPracticeExam();
}
function practiceChoose(letter) {
  if(!LETTERS.includes(letter)) return;
  const record=practiceRecord();
  if(record?.status!=='inProgress') return;
  if(practiceTimeLeft(record)<=0) { finalizePractice(practiceCurrentId,true); mode='practice-results'; render(); return; }
  record.answers=record.answers||{}; record.answers[practiceIndex]=letter; savePracticeState(); renderPracticeExam();
}
function renderPracticeExam() {
  const pack=practicePack(practiceCurrentId),record=practiceRecord();
  if(!record || record.status!=='inProgress') { mode='practice-results'; renderPracticeResults(); return; }
  if(practiceTimeLeft(record)<=0) { finalizePractice(practiceCurrentId,true); mode='practice-results'; renderPracticeResults(); return; }
  const q=pack.questions[practiceIndex-1],answered=practiceAnswered(record),timer=practiceFormatTime(practiceTimeLeft(record));
  const options=q.options.map((src,index)=>{const letter=LETTERS[index],selected=record.answers?.[q.number]===letter;return `<button class="practice-option ${selected?'selected':''}" type="button" data-action="practice-answer" data-letter="${letter}" aria-pressed="${selected}"><span class="practice-option-letter">${letter}</span><span class="practice-option-image"><img src="${practiceAsset(src)}" alt="Opsi ${letter}" loading="lazy" decoding="async"></span></button>`;}).join('');
  const nav=pack.questions.map(question=>`<button class="practice-nav-number ${question.number===practiceIndex?'current':''} ${record.answers?.[question.number]?'answered':''}" data-action="practice-goto" data-qid="${question.number}" aria-label="Soal ${question.number}">${question.number}</button>`).join('');
  app.innerHTML=`${header(`<button class="icon-button" data-action="help" title="Panduan">?</button><button class="icon-button" data-action="practice-home" title="Keluar ke daftar latihan">×</button>`)}
    <main class="page-shell practice-page practice-exam-page"><div class="practice-exam-top"><div><span class="eyebrow">LATIHAN TIU · ${escapeHtml(pack.title)}</span><h1>${escapeHtml(pack.title)}</h1><p>${escapeHtml(participantName)} · ${answered}/10 soal dijawab</p></div><div class="practice-exam-tools"><span id="practice-live-timer" class="practice-timer">${timer}</span><button class="danger-button" data-action="practice-finish">Selesai</button></div></div>
    <div class="practice-exam-layout"><section class="practice-question-panel"><div class="practice-question-head"><span class="number-pill">Soal ${q.number} / 10</span><span class="practice-question-category">Tes Intelegensia Umum</span></div><p class="practice-image-hint">Geser gambar ke samping jika materi belum terlihat seluruhnya.</p><div class="practice-question-image"><img src="${practiceAsset(q.prompt)}" alt="Materi soal nomor ${q.number}" decoding="async"></div><div class="practice-options"><div class="practice-options-heading">Pilih satu jawaban</div><p class="practice-image-hint">Gambar pilihan juga dapat digeser ke samping.</p>${options}</div><div class="practice-exam-pager"><button class="ghost-button" data-action="practice-prev" ${practiceIndex===1?'disabled':''}>‹ Sebelumnya</button><span>${practiceIndex} dari 10</span><button class="primary-button" data-action="practice-next">${practiceIndex===10?'Tinjau akhir':'Selanjutnya'} →</button></div></section>
      <aside class="practice-nav-panel"><div class="practice-nav-heading"><b>Daftar soal</b><span>${answered}/10</span></div><div class="practice-nav-grid">${nav}</div><div class="practice-nav-legend"><span><i class="answered-dot"></i> Terjawab</span><span><i></i> Belum</span></div><div class="practice-nav-progress"><div><span>Progres pengerjaan</span><b>${answered*10}%</b></div><div class="practice-progress-track"><span style="width:${answered*10}%"></span></div></div><button class="secondary-button button-wide" data-action="practice-finish">Akhiri latihan</button></aside>
    </div></main>`;
}
function finalizePractice(id=practiceCurrentId,auto=false) {
  const record=practiceRecords[id],pack=practicePack(id);
  if(!record || record.status!=='inProgress') return false;
  record.status='completed'; record.completedAt=Date.now(); record.autoFinished=!!auto;
  record.timeUsed=Math.min(practiceData.durationMinutes*60,Math.max(0,Math.floor((record.completedAt-record.startedAt)/1000)));
  record.score=practiceScore(pack,record); savePracticeState(); return true;
}
function practiceFinishConfirm() {
  const record=practiceRecord();
  if(record?.status!=='inProgress') return;
  const answered=practiceAnswered(record),blank=10-answered;
  showModal('Selesaikan latihan?',`<p>Setelah paket diselesaikan, jawaban tidak dapat diubah lagi.</p><div class="modal-list"><div class="modal-list-item"><b>${answered}</b> soal sudah dijawab</div><div class="modal-list-item"><b>${blank}</b> soal belum dijawab</div></div>`,`<button class="ghost-button" data-action="close-modal">Kembali</button><button class="primary-button" data-action="practice-confirm-finish">Ya, Selesaikan</button>`,'✓');
}
function practiceFinish(auto=false) {
  const done=finalizePractice(practiceCurrentId,auto);
  if(!done) return;
  if(mode==='practice-exam') { mode='practice-results'; render(); }
  if(auto) showToast('Waktu latihan habis. Jawaban tersimpan telah dinilai.');
}
function startPracticeClock() {
  if(practiceTimerInterval) clearInterval(practiceTimerInterval);
  practiceTimerInterval=setInterval(()=>{
    let changed=false,currentExpired=false;
    for(const [id,record] of Object.entries(practiceRecords)) {
      if(record?.status==='inProgress' && practiceTimeLeft(record)<=0) {
        const isCurrent=id===practiceCurrentId && mode==='practice-exam';
        if(finalizePractice(id,true)) { changed=true; if(isCurrent) currentExpired=true; }
      }
    }
    const record=practiceRecord(),timer=$('#practice-live-timer');
    if(timer && record?.status==='inProgress') {
      const left=practiceTimeLeft(record); timer.textContent=practiceFormatTime(left); timer.classList.toggle('warning',left<=60);
    }
    if(changed && mode==='practice-home') renderPracticeHome();
    if(currentExpired) { mode='practice-results'; render(); showToast('Waktu latihan habis. Jawaban tersimpan telah dinilai.'); }
  },1000);
}
function renderPracticeResults() {
  const pack=practicePack(practiceCurrentId),record=practiceRecord(),stats=practiceStats(pack,record);
  app.innerHTML=`${header(commonActions())}<main class="page-shell practice-page"><div class="breadcrumb"><span>Beranda</span><span>›</span><button class="breadcrumb-link" data-action="practice-home">Latihan Soal</button><span>›</span><strong>Hasil Latihan</strong></div>${renderPracticeTabs('latihan')}
    <section class="practice-result-hero"><div><span class="hero-kicker">✦ HASIL LATIHAN</span><h1>${record?.autoFinished?'Waktu latihan selesai.':'Paket berhasil diselesaikan.'}</h1><p>${escapeHtml(pack.title)} · Peserta: <b>${escapeHtml(participantName)}</b></p></div><div class="practice-result-score"><b>${stats.score}</b><span>POIN / 50</span></div></section>
    <div class="practice-result-metrics"><article><small>Jawaban benar</small><b>${stats.correct}</b></article><article><small>Jawaban salah</small><b>${stats.wrong}</b></article><article><small>Belum dijawab</small><b>${stats.blank}</b></article><article><small>Waktu digunakan</small><b>${practiceFormatTime(record?.timeUsed||0)}</b></article></div>
    <section class="practice-result-panel"><h2>Evaluasi pengerjaan</h2><p>${stats.correct} dari 10 soal dijawab benar. ${stats.blank?`${stats.blank} soal belum dijawab.`:'Semua soal telah diisi.'} Pelajari pembahasan untuk mengetahui alasan jawaban yang tepat.</p><div class="practice-result-actions"><button class="ghost-button" data-action="practice-home">Kembali ke daftar paket</button><button class="secondary-button" data-action="practice-retry">Ulangi paket</button><button class="primary-button" data-action="practice-review">Lihat kunci & pembahasan →</button></div></section>
  </main>`;
}
async function practiceOpenReview() {
  try { await loadPracticeBundle(practiceCurrentId); practiceIndex=1; mode='practice-review'; render(); }
  catch(error) { showToast(error.message || 'Aset pembahasan gagal dimuat.'); }
}
function renderPracticeReview() {
  const pack=practicePack(practiceCurrentId),record=practiceRecord(),q=pack.questions[practiceIndex-1],choice=record?.answers?.[q.number]||null;
  const options=q.options.map((src,index)=>{
    const letter=LETTERS[index],correct=letter===q.answer,selected=letter===choice;
    return `<div class="practice-review-option ${correct?'correct':''} ${selected?'selected':''}"><div class="practice-review-option-head"><b>${letter}</b><span>${correct?'Kunci jawaban':selected?'Jawaban Anda':''}</span>${correct?'<strong>✓ Tepat</strong>':selected?'<strong>Dipilih</strong>':''}</div><span class="practice-option-image"><img src="${practiceAsset(src)}" alt="Opsi ${letter}" loading="lazy" decoding="async"></span></div>`;
  }).join('');
  const nav=pack.questions.map(question=>`<button class="practice-nav-number ${question.number===practiceIndex?'current':''} ${record?.answers?.[question.number]?'answered':''}" data-action="practice-review-goto" data-qid="${question.number}">${question.number}</button>`).join('');
  app.innerHTML=`${header(commonActions())}<main class="page-shell practice-page practice-review-page"><div class="breadcrumb"><span>Beranda</span><span>›</span><button class="breadcrumb-link" data-action="practice-home">Latihan Soal</button><span>›</span><button class="breadcrumb-link" data-action="practice-results">Hasil</button><span>›</span><strong>Pembahasan</strong></div>
    <div class="practice-review-heading"><div><span class="eyebrow">KUNCI JAWABAN & PEMBAHASAN</span><h1>${escapeHtml(pack.title)}</h1><p>Soal ${q.number} dari 10 · Jawaban Anda: <b>${choice||'Belum dijawab'}</b> · Kunci: <b>${q.answer}</b></p></div><span class="practice-review-score">${practiceScore(pack,record)}/50 poin</span></div>
    <div class="practice-review-layout"><aside class="practice-nav-panel"><div class="practice-nav-heading"><b>Nomor soal</b><span>10 soal</span></div><div class="practice-nav-grid">${nav}</div><button class="secondary-button button-wide" data-action="practice-results" style="margin-top:17px">Kembali ke hasil</button></aside>
      <section class="practice-review-main"><article class="practice-review-card"><div class="practice-question-head"><span class="number-pill">Soal ${q.number}</span><span class="practice-question-category">${escapeHtml(pack.category)}</span></div><p class="practice-image-hint">Geser gambar ke samping jika materi belum terlihat seluruhnya.</p><div class="practice-question-image"><img src="${practiceAsset(q.prompt)}" alt="Soal nomor ${q.number}" decoding="async"></div><h3 class="practice-options-heading">Pilihan jawaban</h3><p class="practice-image-hint">Gambar pilihan juga dapat digeser ke samping.</p><div class="practice-review-options">${options}</div></article>
        <article class="practice-explanation-card"><span class="eyebrow">PEMBAHASAN</span><h2>Penjelasan jawaban</h2><div class="practice-explanation-image"><img src="${practiceAsset(q.explanation)}" alt="Pembahasan soal ${q.number}" loading="lazy" decoding="async"></div>${q.supplement?`<div class="practice-supplement"><b>Catatan tambahan perhitungan</b><p>${escapeHtml(q.supplement)}</p><small>Langkah tambahan ini melengkapi perhitungan agar jawaban lebih mudah dipahami.</small></div>`:''}</article>
        <div class="practice-review-pager"><button class="ghost-button" data-action="practice-review-prev" ${practiceIndex===1?'disabled':''}>‹ Sebelumnya</button><span>Pembahasan ${practiceIndex} / 10</span><button class="primary-button" data-action="practice-review-next" ${practiceIndex===10?'disabled':''}>Selanjutnya →</button></div>
      </section></div>
  </main>`;
}

function showModal(title, body, actions, icon='!') {
  const old=$('.modal-backdrop'); if(old) old.remove();
  const html=`<div class="modal-backdrop" role="presentation"><section class="modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="modal-icon">${icon}</div><h2>${escapeHtml(title)}</h2>${body}<div class="modal-actions">${actions}</div></section></div>`;
  app.insertAdjacentHTML('beforeend',html);
}
function closeModal() { const m=$('.modal-backdrop'); if(m) m.remove(); }
function showToast(message) {
  const old=$('.toast'); if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="toast">${escapeHtml(message)}</div>`);
  setTimeout(()=>$('.toast')?.remove(),2600);
}
function confirmFinish() {
  const unanswered=110-answeredCount();
  showModal('Selesaikan tryout?',`<p>Pastikan Anda sudah memeriksa jawaban. Setelah tryout diselesaikan, jawaban tidak dapat diubah lagi.</p><div class="modal-list"><div class="modal-list-item"><b>${answeredCount()}</b> soal sudah dijawab</div><div class="modal-list-item"><b>${unanswered}</b> soal belum dijawab</div></div>`,`<button class="ghost-button" data-action="close-modal">Kembali</button><button class="primary-button" data-action="confirm-finish">Ya, Selesaikan</button>`,'✓');
}
function helpModal() {
  showModal('Panduan pengerjaan',`<div class="modal-list"><div class="modal-list-item"><b>← / →</b> Berpindah ke soal sebelumnya atau selanjutnya.</div><div class="modal-list-item"><b>A–E</b> Memilih opsi jawaban pada soal aktif.</div><div class="modal-list-item"><b>Daftar soal</b> Menampilkan status jawaban dan berpindah langsung ke nomor tertentu.</div><div class="modal-list-item"><b>Timer</b> Menghitung mundur otomatis. Jika waktu habis, tryout diselesaikan secara otomatis.</div></div>`,`<button class="primary-button" data-action="close-modal">Mengerti</button>`,'?');
}
function reportModal(qid) {
  showModal(`Laporkan soal nomor ${qid}`,`<p>Pilih alasan laporan. Catatan disimpan secara lokal di perangkat ini.</p><select id="report-reason" class="modal-textarea" style="min-height:44px"><option value="Teks soal kurang jelas">Teks soal kurang jelas</option><option value="Opsi jawaban bermasalah">Opsi jawaban bermasalah</option><option value="Gambar tidak tampil">Gambar tidak tampil</option><option value="Kunci atau pembahasan perlu ditinjau">Kunci atau pembahasan perlu ditinjau</option></select><textarea id="report-note" class="modal-textarea" placeholder="Tambahkan catatan (opsional)"></textarea>`,`<button class="ghost-button" data-action="close-modal">Batal</button><button class="primary-button" data-action="submit-report" data-qid="${qid}">Kirim laporan</button>`,'⚑');
}

function startAttempt() {
  state={status:'inProgress',participantName,participantId:ensureParticipantId(),answers:{},currentQuestion:1,deadlineAt:Date.now()+exam.durationMinutes*60*1000,startedAt:Date.now()};
  saveState(); mode='exam'; render();
}
function moveQuestion(n) {
  if (n<1 || n>110) return;
  state.currentQuestion=n; saveState(); renderExam();
}
function selectAnswer(letter) {
  if (!LETTERS.includes(letter)) return;
  state.answers[state.currentQuestion]=letter; saveState(); renderExam();
}
function restartConfirm() {
  showModal('Mulai ulang tryout?',`<p>Progress dan hasil pengerjaan sebelumnya akan diganti dengan sesi baru. Apakah Anda yakin ingin memulai dari awal?</p>`,`<button class="ghost-button" data-action="close-modal">Batal</button><button class="primary-button" data-action="restart">Ya, Mulai Ulang</button>`,'↻');
}

app.addEventListener('submit', async (event) => {
  if (event.target.id !== 'access-form') return;
  event.preventDefault();
  const nameInput = $('#participant-name');
  const input = $('#access-password');
  const button = $('#access-submit');
  const error = $('#access-error');
  if (!nameInput || !input || !button) return;

  const cleanName = nameInput.value.trim().replace(/\s+/g, ' ');
  if (!cleanName) {
    if (error) error.textContent = 'Nama peserta wajib diisi.';
    nameInput.focus();
    return;
  }
  if (cleanName.length > 60) {
    if (error) error.textContent = 'Nama peserta maksimal 60 karakter.';
    nameInput.focus();
    return;
  }

  button.disabled = true;
  button.classList.add('loading');
  if (error) error.textContent = '';
  try {
    const digest = await sha256Hex(input.value);
    if (digest === ACCESS_HASH) {
      participantName = cleanName;
      sessionStorage.setItem(PARTICIPANT_NAME_KEY, cleanName);
      sessionStorage.setItem(PARTICIPANT_ID_KEY, (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`));
      sessionStorage.setItem(ACCESS_SESSION_KEY, 'granted');
      input.value = '';
      app.classList.add('unlocking');
      await loadApplicationData();
    } else {
      if (error) error.textContent = 'Password belum sesuai. Periksa kembali dan coba lagi.';
      input.value = '';
      input.focus();
      button.disabled = false;
      button.classList.remove('loading');
    }
  } catch (err) {
    if (error) error.textContent = 'Browser tidak mendukung verifikasi password. Gunakan Chrome atau Firefox versi terbaru.';
    button.disabled = false;
    button.classList.remove('loading');
  }
});

app.addEventListener('click', (event) => {
  const button=event.target.closest('[data-action]');
  if (!button) return;
  const action=button.dataset.action;
  if (action==='home') { mode='home'; render(); }
  else if (action==='home-tab') { mode='home'; render(); }
  else if (action==='practice-home') { mode='practice-home'; render(); }
  else if (action==='practice-prepare') practicePrepare(button.dataset.packId);
  else if (action==='practice-view-result') { practiceCurrentId=button.dataset.packId; mode='practice-results'; render(); }
  else if (action==='practice-start') practiceStart();
  else if (action==='practice-confirm-start') { closeModal(); practiceBeginNew(); }
  else if (action==='practice-answer') practiceChoose(button.dataset.letter);
  else if (action==='practice-goto') practiceMove(Number(button.dataset.qid));
  else if (action==='practice-prev') practiceMove(practiceIndex-1);
  else if (action==='practice-next') practiceMove(Math.min(10,practiceIndex+1));
  else if (action==='practice-finish') practiceFinishConfirm();
  else if (action==='practice-confirm-finish') { closeModal(); practiceFinish(false); }
  else if (action==='practice-review') practiceOpenReview();
  else if (action==='practice-retry') { mode='practice-prep'; render(); practiceStart(); }
  else if (action==='practice-results') { mode='practice-results'; render(); }
  else if (action==='practice-review-goto') { practiceIndex=Number(button.dataset.qid); renderPracticeReview(); }
  else if (action==='practice-review-prev') { practiceIndex=Math.max(1,practiceIndex-1); renderPracticeReview(); }
  else if (action==='practice-review-next') { practiceIndex=Math.min(10,practiceIndex+1); renderPracticeReview(); }
  else if (action==='results-tab') { if (state?.status==='completed' && state.result) { mode='results'; resultTab='statistik'; render(); } else showToast('Hasil akan tersedia setelah Anda menyelesaikan tryout.'); }
  else if (action==='toggle-password') { const field=$('#access-password'); if(field) field.type=field.type==='password'?'text':'password'; }
  else if (action==='logout') {
    if (state?.status==='inProgress' && !confirm('Keluar dan ganti peserta? Progres tryout peserta ini tetap tersimpan di perangkat.')) return;
    sessionStorage.removeItem(ACCESS_SESSION_KEY);
    sessionStorage.removeItem(PARTICIPANT_NAME_KEY);
    sessionStorage.removeItem(PARTICIPANT_ID_KEY);
    participantName = '';
    state = null;
    mode='gate';
    render();
  }
  else if (action==='start') { mode='prep'; render(); }
  else if (action==='begin') startAttempt();
  else if (action==='resume') { mode='exam'; render(); }
  else if (action==='answer') selectAnswer(button.dataset.letter);
  else if (action==='goto') moveQuestion(Number(button.dataset.qid));
  else if (action==='previous') moveQuestion((state.currentQuestion||1)-1);
  else if (action==='next') moveQuestion(Math.min(110,(state.currentQuestion||1)+1));
  else if (action==='finish') confirmFinish();
  else if (action==='confirm-finish') { closeModal(); finishExam(false); }
  else if (action==='restart-confirm') restartConfirm();
  else if (action==='restart') { closeModal(); startAttempt(); }
  else if (action==='view-results') { mode='results'; resultTab='statistik'; render(); }
  else if (action==='result-tab') { resultTab=button.dataset.tab; renderResults(); }
  else if (action==='review-goto') { reviewQuestion=Number(button.dataset.qid); renderResults(); }
  else if (action==='review-prev') { reviewQuestion=Math.max(1,reviewQuestion-1); renderResults(); }
  else if (action==='review-next') { reviewQuestion=Math.min(110,reviewQuestion+1); renderResults(); }
  else if (action==='help') helpModal();
  else if (action==='close-modal') closeModal();
  else if (action==='report') reportModal(Number(button.dataset.qid));
  else if (action==='submit-report') {
    const reports=JSON.parse(localStorage.getItem(REPORT_KEY)||'[]');
    reports.push({question:Number(button.dataset.qid),reason:$('#report-reason')?.value||'',note:$('#report-note')?.value||'',createdAt:Date.now()});
    localStorage.setItem(REPORT_KEY,JSON.stringify(reports)); closeModal(); showToast('Laporan disimpan di perangkat ini.');
  }
  else if (action==='theme') { document.body.classList.toggle('dark'); localStorage.setItem('skd-prime-theme',document.body.classList.contains('dark')?'dark':'light'); }
  else if (action==='toggle-nav') { $('#navigator-card')?.classList.toggle('open'); }
});

app.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal-backdrop')) closeModal();
});

document.addEventListener('keydown',(event)=>{
  if ($('.modal-backdrop')) { if(event.key==='Escape') closeModal(); return; }
  if (mode==='exam' && state?.status==='inProgress') {
    if (event.key==='ArrowLeft') { event.preventDefault(); moveQuestion((state.currentQuestion||1)-1); }
    else if (event.key==='ArrowRight') { event.preventDefault(); moveQuestion((state.currentQuestion||1)+1); }
    else if (/^[a-e]$/i.test(event.key)) { const letter=event.key.toUpperCase(); selectAnswer(letter); }
  } else if (mode==='practice-exam' && practiceRecord()?.status==='inProgress') {
    if (event.key==='ArrowLeft') { event.preventDefault(); practiceMove(practiceIndex-1); }
    else if (event.key==='ArrowRight') { event.preventDefault(); practiceMove(practiceIndex+1); }
    else if (/^[a-e]$/i.test(event.key)) { const letter=event.key.toUpperCase(); practiceChoose(letter); }
  }
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

if (localStorage.getItem('skd-prime-theme')==='dark') document.body.classList.add('dark');
boot();

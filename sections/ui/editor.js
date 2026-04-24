(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const esc  = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const escA = s => String(s||'').replace(/"/g,'&quot;').replace(/&/g,'&amp;');

  const panel   = $('#ed-panel');
  const overlay = $('#ed-overlay');
  const fab     = $('#edit-fab');

  fab.onclick = () => {
    buildEditor();
    panel.classList.add('open');
    overlay.classList.add('open');
    fab.style.display = 'none';
    $('#style-fab').style.display  = 'none';
    $('#upload-fab').style.display = 'none';
  };
  $('#ed-close').onclick  = closePanel;
  overlay.onclick         = closePanel;
  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    fab.style.display = '';
    $('#style-fab').style.display  = '';
    $('#upload-fab').style.display = '';
  }

  const styleFab   = $('#style-fab');
  const tweaksPanel = $('#tweaks');
  styleFab.onclick = () => tweaksPanel.classList.toggle('on');

  // accordion
  document.addEventListener('click', e => {
    const h = e.target.closest('.edsec-head');
    if (h) h.closest('.edsec').classList.toggle('open');
  });

  $('#ed-save').onclick = saveAll;

  const pdfBtn = $('#ed-pdf');
  if (pdfBtn) pdfBtn.onclick = () => setTimeout(() => window.print(), 0);

  // ── Save CV Data (JSON export) ──
  const saveJsonBtn = $('#ed-save-json');
  if (saveJsonBtn) saveJsonBtn.onclick = () => {
    const data = extractAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = (data.name || 'my-cv') + '.cvdata.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Upload CV (JSON import) ──
  const uploadFab   = $('#upload-fab');
  const uploadInput = $('#cv-upload-input');
  if (uploadFab) uploadFab.onclick = () => uploadInput.click();
  if (uploadInput) uploadInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        applyAllData(data);
        if (panel.classList.contains('open')) buildEditor();
        const prev = uploadFab.textContent;
        uploadFab.textContent = 'CV Loaded ✓';
        setTimeout(() => { uploadFab.textContent = prev; }, 2000);
      } catch(_) {
        alert('Invalid file. Please upload a .json file exported from this CV builder.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // ── mutable lists & photo state ──
  let skillsData = [], langsData = [], eduData = [], strengthsData = [], workData = [], refsData = [], trainingData = [];
  let photoDataUrl = null;
  let photoFileName = 'photo.jpg';

  // Restore photo from previous session
  (function restorePhoto() {
    try {
      const saved = localStorage.getItem('cv-photo');
      if (saved) {
        photoDataUrl = saved;
        photoFileName = localStorage.getItem('cv-photo-name') || 'photo.jpg';
        applyPhoto(saved);
      }
    } catch(_) {}
  })();

  // ── build editor ──
  function buildEditor() {
    const body = $('#ed-body');
    body.innerHTML = '';

    addSection(body, 'Photo',                  renderPhoto);
    addSection(body, 'Header',                 renderHeader);
    addSection(body, 'Work Experience',        renderWork);
    addSection(body, 'References (Sidebar)',   renderRefs);
    addSection(body, 'Contact',                renderContact);
    addSection(body, 'Personal',               renderPersonal);
    addSection(body, 'Technical Skills',       renderSkills);
    addSection(body, 'Languages',              renderLangs);
    addSection(body, 'Interests',              renderInterests);
    addSection(body, 'Career Objective',        renderProfile);
    addSection(body, 'Education',              renderEdu);
    addSection(body, 'Training & Certifications', renderTraining);
    addSection(body, 'Transferable Strengths', renderStrengths);
    addSection(body, 'Footer',                 renderFooter);
  }

  function addSection(container, title, fn, open=false) {
    const sec = document.createElement('div');
    sec.className = 'edsec' + (open ? ' open' : '');
    sec.innerHTML = `<div class="edsec-head">${title}<span class="chv">▾</span></div>
                     <div class="edsec-body"></div>`;
    container.appendChild(sec);
    fn(sec.querySelector('.edsec-body'));
  }

  function inp(container, label, id, val, placeholder='') {
    const d = document.createElement('div');
    d.className = 'edf';
    d.innerHTML = `<label class="edlabel">${label}</label>
      <input class="edinput" id="${id}" type="text" value="${escA(val)}" placeholder="${escA(placeholder)}">`;
    container.appendChild(d);
  }
  function ta(container, label, id, val, placeholder='') {
    const d = document.createElement('div');
    d.className = 'edf';
    d.innerHTML = `<label class="edlabel">${label}</label>
      <textarea class="edtextarea" id="${id}" placeholder="${escA(placeholder)}">${esc(val)}</textarea>`;
    container.appendChild(d);
  }

  // ── Photo ──
  function renderPhoto(c) {
    const currentImg = $('.photo img');
    const previewMarkup = imgSrc => `
      <button type="button" id="photo-remove" class="photo-remove" aria-label="Remove photo">×</button>
      <img src="${imgSrc}" alt="Current photo">`;

    c.innerHTML = `
      <div class="edf">
        <label class="edlabel">Profile Photo</label>
        <label class="photo-upload-label" for="f-photo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Choose image file…
        </label>
        <input type="file" id="f-photo" accept="image/*">
      </div>
      <div id="photo-preview" class="${currentImg ? 'visible' : ''}">
        ${currentImg ? previewMarkup(currentImg.src) : ''}
      </div>`;

    document.getElementById('f-photo').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      photoFileName = file.name;
      const reader = new FileReader();
      reader.onload = ev => {
        photoDataUrl = ev.target.result;
        try { localStorage.setItem('cv-photo', photoDataUrl); localStorage.setItem('cv-photo-name', photoFileName); } catch(_) {}
        applyPhoto(photoDataUrl);
        const preview = document.getElementById('photo-preview');
        if (preview) {
          preview.innerHTML = previewMarkup(photoDataUrl);
          preview.classList.add('visible');
          wireRemovePhotoButton(preview);
        }
      };
      reader.readAsDataURL(file);
    };

    const preview = document.getElementById('photo-preview');
    wireRemovePhotoButton(preview);
  }

  function wireRemovePhotoButton(previewEl) {
    if (!previewEl) return;
    const removeBtn = previewEl.querySelector('#photo-remove');
    if (!removeBtn) return;
    removeBtn.onclick = () => {
      photoDataUrl = null;
      photoFileName = 'photo.jpg';
      try {
        localStorage.removeItem('cv-photo');
        localStorage.removeItem('cv-photo-name');
      } catch(_) {}

      const photoDiv = $('.photo');
      photoDiv.classList.remove('has-img');
      photoDiv.innerHTML = 'photo · 1:1';

      previewEl.innerHTML = '';
      previewEl.classList.remove('visible');

      const fileInput = document.getElementById('f-photo');
      if (fileInput) fileInput.value = '';
    };
  }

  function applyPhoto(dataUrl) {
    const photoDiv = $('.photo');
    photoDiv.innerHTML = '';
    photoDiv.classList.add('has-img');
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'Profile photo';
    photoDiv.appendChild(img);
  }

  // ── Header ──
  function renderHeader(c) {
    inp(c, 'Name', 'f-name', $('.name').textContent.trim());
    inp(c, 'Role / Title', 'f-role', $('.role').textContent.trim());
  }
  function saveHeader() {
    $('.name').textContent = $('#f-name').value.trim();
    const roleEl = $('.role');
    [...roleEl.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); });
    roleEl.insertBefore(document.createTextNode($('#f-role').value.trim()), roleEl.firstChild);
  }

  // ── Contact ──
  function renderContact(c) {
    const rows = $$('.contact-row', $$('.side-section')[0]);
    rows.forEach((row, i) => {
      inp(c, row.querySelector('.k').textContent.trim(), `f-ct-${i}`, row.querySelector('.v').textContent.trim());
    });
  }
  function saveContact() {
    const rows = $$('.contact-row', $$('.side-section')[0]);
    rows.forEach((row, i) => { const el = $(`#f-ct-${i}`); if (el) row.querySelector('.v').textContent = el.value; });
  }

  // ── Personal ──
  function renderPersonal(c) {
    const rows = $$('.contact-row', $$('.side-section')[1]);
    rows.forEach((row, i) => {
      inp(c, row.querySelector('.k').textContent.trim(), `f-pe-${i}`, row.querySelector('.v').textContent.trim());
    });
  }
  function savePersonal() {
    const rows = $$('.contact-row', $$('.side-section')[1]);
    rows.forEach((row, i) => { const el = $(`#f-pe-${i}`); if (el) row.querySelector('.v').textContent = el.value; });
  }

  // ── Work Experience ──
  function jobNotesToText(noteEl) {
    if (!noteEl) return '';
    const ul = noteEl.querySelector('ul');
    if (ul) return $$('li', ul).map(li => li.textContent.trim()).join('\n');
    return noteEl.textContent.trim();
  }

  function renderWork(c) {
    workData = $$('.job-item').map(item => {
      const whereEl = item.querySelector('.job-where');
      const sep = whereEl ? whereEl.querySelector('.sep') : null;
      let org = '', location = '';
      if (whereEl) whereEl.childNodes.forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          if (!org) org = n.textContent.trim();
          else location = n.textContent.trim();
        }
      });
      const gradeNode = sep ? sep.nextSibling : null;
      if (gradeNode && gradeNode.textContent.trim()) location = gradeNode.textContent.trim();
      return {
        date:     (item.querySelector('.meta-date')||{innerHTML:''}).innerHTML.replace(/<br\s*\/?>/gi,' ').trim(),
        title:    (item.querySelector('.job-title')||{textContent:''}).textContent.trim(),
        org, location,
        bullets:  jobNotesToText(item.querySelector('.job-note'))
      };
    });
    const wSync = () => {
      document.querySelectorAll('[data-wd]').forEach(el => { if (workData[+el.dataset.wd]) workData[+el.dataset.wd].date     = el.value; });
      document.querySelectorAll('[data-wt]').forEach(el => { if (workData[+el.dataset.wt]) workData[+el.dataset.wt].title    = el.value; });
      document.querySelectorAll('[data-wo]').forEach(el => { if (workData[+el.dataset.wo]) workData[+el.dataset.wo].org      = el.value; });
      document.querySelectorAll('[data-wl]').forEach(el => { if (workData[+el.dataset.wl]) workData[+el.dataset.wl].location = el.value; });
      document.querySelectorAll('[data-wb]').forEach(el => { if (workData[+el.dataset.wb]) workData[+el.dataset.wb].bullets  = el.value; });
    };
    renderWorkCards(c, wSync);
    makeSortable(c, wSync, workData, c2 => renderWorkCards(c2, wSync));
  }
  function renderWorkCards(c, syncFn) {
    c.innerHTML = '';
    workData.forEach((w, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Job ${i+1}</span>
        <button class="edremove" type="button" data-wr="${i}">Remove</button></div>
        <div class="ed2col">
          <div class="edf"><label class="edlabel">Date</label>
            <input class="edinput" data-wd="${i}" value="${escA(w.date)}" placeholder="2025 – Present"></div>
          <div class="edf"><label class="edlabel">Job Title</label>
            <input class="edinput" data-wt="${i}" value="${escA(w.title)}"></div>
        </div>
        <div class="ed2col">
          <div class="edf"><label class="edlabel">Organisation</label>
            <input class="edinput" data-wo="${i}" value="${escA(w.org)}"></div>
          <div class="edf"><label class="edlabel">Location</label>
            <input class="edinput" data-wl="${i}" value="${escA(w.location)}"></div>
        </div>
        <div class="edf"><label class="edlabel">Responsibilities (one per line)</label>
          <textarea class="edtextarea" data-wb="${i}" placeholder="Managed team of…&#10;Delivered project…">${esc(w.bullets)}</textarea></div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Job';
    add.onclick = () => { if (syncFn) syncFn(); workData.push({date:'',title:'',org:'',location:'',bullets:''}); renderWorkCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-wr]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); workData.splice(+b.dataset.wr, 1); renderWorkCards(c, syncFn);
    });
  }
  function saveWork() {
    document.querySelectorAll('[data-wd]').forEach(el => { workData[+el.dataset.wd].date     = el.value; });
    document.querySelectorAll('[data-wt]').forEach(el => { workData[+el.dataset.wt].title    = el.value; });
    document.querySelectorAll('[data-wo]').forEach(el => { workData[+el.dataset.wo].org      = el.value; });
    document.querySelectorAll('[data-wl]').forEach(el => { workData[+el.dataset.wl].location = el.value; });
    document.querySelectorAll('[data-wb]').forEach(el => { workData[+el.dataset.wb].bullets  = el.value; });

    let workSec = null;
    $$('.section').forEach(sec => {
      if ((sec.querySelector('.sec-h')||{textContent:''}).textContent.includes('Work Experience')) workSec = sec;
    });
    if (!workSec) return;
    $$('.job-item', workSec).forEach(el => el.remove());

    workData.forEach(w => {
      const lines = (w.bullets||'').split('\n').map(l => l.trim()).filter(Boolean);
      const bulletsHTML = lines.length
        ? '<div class="job-note"><ul>' + lines.map(l => `<li>${esc(l)}</li>`).join('') + '</ul></div>'
        : '';
      const dateHTML = esc(w.date).replace(/\n/g, '<br>');
      const div = document.createElement('div');
      div.className = 'job-item';
      div.innerHTML = `<div class="meta-date">${dateHTML}</div>
        <div>
          <h3 class="job-title">${esc(w.title)}</h3>
          <p class="job-where">${esc(w.org)} <span class="sep">·</span> ${esc(w.location)}</p>
          ${bulletsHTML}
        </div>`;
      workSec.appendChild(div);
    });
  }

  // ── References (sidebar) ──
  function renderRefs(c) {
    refsData = $$('.ref-card').map(card => ({
      name:  (card.querySelector('.ref-name')||{textContent:''}).textContent.trim(),
      role:  [...card.querySelectorAll('.ref-role')].map(r => r.textContent.trim()).join('\n'),
      phone: (card.querySelector('.ref-phone')||{textContent:''}).textContent.trim()
    }));
    const rSync = () => {
      document.querySelectorAll('[data-rn]').forEach(el => { if (refsData[+el.dataset.rn]) refsData[+el.dataset.rn].name  = el.value; });
      document.querySelectorAll('[data-rr]').forEach(el => { if (refsData[+el.dataset.rr]) refsData[+el.dataset.rr].role  = el.value; });
      document.querySelectorAll('[data-rp]').forEach(el => { if (refsData[+el.dataset.rp]) refsData[+el.dataset.rp].phone = el.value; });
    };
    renderRefCards(c, rSync);
    makeSortable(c, rSync, refsData, c2 => renderRefCards(c2, rSync));
  }
  function renderRefCards(c, syncFn) {
    c.innerHTML = '';
    refsData.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Ref ${i+1}</span>
        <button class="edremove" type="button" data-rref="${i}">Remove</button></div>
        <div class="edf"><label class="edlabel">Name</label>
          <input class="edinput" data-rn="${i}" value="${escA(r.name)}"></div>
        <div class="edf"><label class="edlabel">Role / Organisation (one per line)</label>
          <textarea class="edtextarea" data-rr="${i}" placeholder="Associate Professor&#10;University of Dhaka" style="min-height:52px">${esc(r.role)}</textarea></div>
        <div class="edf"><label class="edlabel">Phone</label>
          <input class="edinput" data-rp="${i}" value="${escA(r.phone)}" placeholder="+880 ..."></div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Reference';
    add.onclick = () => { if (syncFn) syncFn(); refsData.push({name:'',role:'',phone:''}); renderRefCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-rref]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); refsData.splice(+b.dataset.rref, 1); renderRefCards(c, syncFn);
    });
  }
  function saveRefs() {
    document.querySelectorAll('[data-rn]').forEach(el => { refsData[+el.dataset.rn].name  = el.value; });
    document.querySelectorAll('[data-rr]').forEach(el => { refsData[+el.dataset.rr].role  = el.value; });
    document.querySelectorAll('[data-rp]').forEach(el => { refsData[+el.dataset.rp].phone = el.value; });

    const refSec = $$('.side-section').find(s => (s.querySelector('.side-h')||{textContent:''}).textContent.includes('Reference'));
    if (!refSec) return;
    $$('.ref-card', refSec).forEach(el => el.remove());
    const h = refSec.querySelector('.side-h');

    refsData.forEach(r => {
      const lines = (r.role||'').split('\n').map(l => l.trim()).filter(Boolean);
      const div = document.createElement('div');
      div.className = 'ref-card';
      div.innerHTML = `<div class="ref-name">${esc(r.name)}</div>
        ${lines.map(l => `<div class="ref-role">${esc(l)}</div>`).join('')}
        ${r.phone ? `<div class="ref-phone">${esc(r.phone)}</div>` : ''}`;
      refSec.appendChild(div);
    });
  }

  // ── Skills ──
  function renderSkills(c) {
    skillsData = $$('.skill-list li').map(li => {
      const bar = li.querySelector('.bar');
      const lv  = parseInt((bar.style.getPropertyValue('--lv')||'70%').replace('%',''))||70;
      return { name: li.childNodes[0].textContent.trim(), lv };
    });
    const sSync = () => {
      document.querySelectorAll('[data-sn]').forEach(el => { if (skillsData[+el.dataset.sn]) skillsData[+el.dataset.sn].name = el.value; });
      document.querySelectorAll('[data-sl]').forEach(el => { if (skillsData[+el.dataset.sl]) skillsData[+el.dataset.sl].lv   = +el.value || 0; });
    };
    renderSkillCards(c, sSync);
    makeSortable(c, sSync, skillsData, c2 => renderSkillCards(c2, sSync));
  }
  function renderSkillCards(c, syncFn) {
    c.innerHTML = '';
    skillsData.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Skill ${i+1}</span>
        <button class="edremove" type="button" data-sr="${i}">Remove</button></div>
        <div class="ed2colB">
          <div class="edf"><label class="edlabel">Name</label>
            <input class="edinput" data-sn="${i}" value="${escA(s.name)}"></div>
          <div class="edf"><label class="edlabel">Level %</label>
            <input class="edinput" type="number" min="0" max="100" data-sl="${i}" value="${s.lv}"></div>
        </div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Skill';
    add.onclick = () => { if (syncFn) syncFn(); skillsData.push({name:'New Skill', lv:70}); renderSkillCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-sr]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); skillsData.splice(+b.dataset.sr, 1); renderSkillCards(c, syncFn);
    });
  }
  function saveSkills() {
    document.querySelectorAll('[data-sn]').forEach(el => { skillsData[+el.dataset.sn].name = el.value; });
    document.querySelectorAll('[data-sl]').forEach(el => { skillsData[+el.dataset.sl].lv = +el.value||0; });
    const ul = $('.skill-list'); ul.innerHTML = '';
    skillsData.forEach(s => {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(s.name + ' '));
      const bar = document.createElement('span');
      bar.className = 'bar'; bar.style.setProperty('--lv', s.lv + '%');
      li.appendChild(bar); ul.appendChild(li);
    });
  }

  // ── Languages ──
  function renderLangs(c) {
    langsData = $$('.lang-list li').map(li => ({
      name: li.childNodes[0].textContent.trim(),
      lvl:  li.querySelector('.lvl').textContent.trim()
    }));
    const lSync = () => {
      document.querySelectorAll('[data-ln]').forEach(el => { if (langsData[+el.dataset.ln]) langsData[+el.dataset.ln].name = el.value; });
      document.querySelectorAll('[data-ll]').forEach(el => { if (langsData[+el.dataset.ll]) langsData[+el.dataset.ll].lvl  = el.value; });
    };
    renderLangCards(c, lSync);
    makeSortable(c, lSync, langsData, c2 => renderLangCards(c2, lSync));
  }
  function renderLangCards(c, syncFn) {
    c.innerHTML = '';
    langsData.forEach((l, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Language ${i+1}</span>
        <button class="edremove" type="button" data-lr="${i}">Remove</button></div>
        <div class="ed2col">
          <div class="edf"><label class="edlabel">Language</label>
            <input class="edinput" data-ln="${i}" value="${escA(l.name)}"></div>
          <div class="edf"><label class="edlabel">Level</label>
            <input class="edinput" data-ll="${i}" value="${escA(l.lvl)}" placeholder="Native, Fluent…"></div>
        </div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Language';
    add.onclick = () => { if (syncFn) syncFn(); langsData.push({name:'',lvl:''}); renderLangCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-lr]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); langsData.splice(+b.dataset.lr, 1); renderLangCards(c, syncFn);
    });
  }
  function saveLangs() {
    document.querySelectorAll('[data-ln]').forEach(el => { langsData[+el.dataset.ln].name = el.value; });
    document.querySelectorAll('[data-ll]').forEach(el => { langsData[+el.dataset.ll].lvl  = el.value; });
    const ul = $('.lang-list'); ul.innerHTML = '';
    langsData.forEach(l => {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(l.name + ' '));
      const lvl = document.createElement('span');
      lvl.className = 'lvl'; lvl.textContent = l.lvl;
      li.appendChild(lvl); ul.appendChild(li);
    });
  }

  // ── Interests ──
  function renderInterests(c) {
    const chips = $$('.hobby-chips span').map(s => s.textContent.trim()).join(', ');
    ta(c, 'Interests (comma-separated)', 'f-int', chips, 'Reading, Debate, Chess…');
  }
  function saveInterests() {
    const chips = ($('#f-int').value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const el = $('.hobby-chips'); el.innerHTML = '';
    chips.forEach(ch => { const s = document.createElement('span'); s.textContent = ch; el.appendChild(s); });
  }

  // ── Profile ──
  function renderProfile(c) {
    ta(c, 'Career Objective', 'f-prof', ($('.summary .lead')||{textContent:''}).textContent.trim());
  }
  function saveProfile() {
    const lead = $('.summary .lead'); if (lead) lead.textContent = $('#f-prof').value;
  }

  // ── Education ──
  function notesToText(noteEl) {
    if (!noteEl) return '';
    const ul = noteEl.querySelector('ul');
    if (ul) return $$('li', ul).map(li => li.textContent.trim()).join('\n');
    return noteEl.textContent.trim();
  }

  function renderEdu(c) {
    eduData = $$('.edu-item').map(item => {
      const whereEl = item.querySelector('.edu-where');
      const sep = whereEl.querySelector('.sep');
      let institution = '';
      whereEl.childNodes.forEach(n => { if (n.nodeType===3 && n.textContent.trim() && !institution) institution = n.textContent.trim(); });
      const gradeNode = sep ? sep.nextSibling : null;
      const grade = gradeNode ? gradeNode.textContent.trim() : '';
      return {
        date:        item.querySelector('.meta-date').textContent.trim(),
        title:       item.querySelector('.edu-title').textContent.trim(),
        institution, grade,
        notes:       notesToText(item.querySelector('.edu-note'))
      };
    });
    const eSync = () => {
      document.querySelectorAll('[data-ed]').forEach(el => { if (eduData[+el.dataset.ed]) eduData[+el.dataset.ed].date        = el.value; });
      document.querySelectorAll('[data-et]').forEach(el => { if (eduData[+el.dataset.et]) eduData[+el.dataset.et].title       = el.value; });
      document.querySelectorAll('[data-ei]').forEach(el => { if (eduData[+el.dataset.ei]) eduData[+el.dataset.ei].institution = el.value; });
      document.querySelectorAll('[data-eg]').forEach(el => { if (eduData[+el.dataset.eg]) eduData[+el.dataset.eg].grade       = el.value; });
      document.querySelectorAll('[data-en]').forEach(el => { if (eduData[+el.dataset.en]) eduData[+el.dataset.en].notes       = el.value; });
    };
    renderEduCards(c, eSync);
    makeSortable(c, eSync, eduData, c2 => renderEduCards(c2, eSync));
  }
  function renderEduCards(c, syncFn) {
    c.innerHTML = '';
    eduData.forEach((e, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Education ${i+1}</span>
        <button class="edremove" type="button" data-er="${i}">Remove</button></div>
        <div class="edf"><label class="edlabel">Date</label>
          <input class="edinput" data-ed="${i}" value="${escA(e.date)}" placeholder="2021 – 2025"></div>
        <div class="edf"><label class="edlabel">Degree / Certificate</label>
          <input class="edinput" data-et="${i}" value="${escA(e.title)}"></div>
        <div class="ed2col">
          <div class="edf"><label class="edlabel">Institution</label>
            <input class="edinput" data-ei="${i}" value="${escA(e.institution)}"></div>
          <div class="edf"><label class="edlabel">Grade / GPA</label>
            <input class="edinput" data-eg="${i}" value="${escA(e.grade)}"></div>
        </div>
        <div class="edf"><label class="edlabel">Notes (one bullet per line)</label>
          <textarea class="edtextarea" data-en="${i}" placeholder="Thesis: …&#10;Coursework: …">${esc(e.notes)}</textarea></div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Education';
    add.onclick = () => { if (syncFn) syncFn(); eduData.push({date:'',title:'',institution:'',grade:'',notes:''}); renderEduCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-er]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); eduData.splice(+b.dataset.er, 1); renderEduCards(c, syncFn);
    });
  }
  function saveEdu() {
    document.querySelectorAll('[data-ed]').forEach(el => { eduData[+el.dataset.ed].date        = el.value; });
    document.querySelectorAll('[data-et]').forEach(el => { eduData[+el.dataset.et].title       = el.value; });
    document.querySelectorAll('[data-ei]').forEach(el => { eduData[+el.dataset.ei].institution = el.value; });
    document.querySelectorAll('[data-eg]').forEach(el => { eduData[+el.dataset.eg].grade       = el.value; });
    document.querySelectorAll('[data-en]').forEach(el => { eduData[+el.dataset.en].notes       = el.value; });

    let eduSec = null;
    $$('.section').forEach(sec => {
      if ((sec.querySelector('.sec-h')||{textContent:''}).textContent.includes('Education')) eduSec = sec;
    });
    if (!eduSec) return;
    $$('.edu-item', eduSec).forEach(el => el.remove());

    eduData.forEach(e => {
      const lines = (e.notes||'').split('\n').map(l=>l.trim()).filter(Boolean);
      const notesHTML = lines.length > 1
        ? '<ul>' + lines.map(l=>`<li>${esc(l)}</li>`).join('') + '</ul>'
        : (lines[0] ? esc(lines[0]) : '');
      const div = document.createElement('div');
      div.className = 'edu-item';
      div.innerHTML = `<div class="meta-date">${esc(e.date)}</div>
        <div>
          <h3 class="edu-title">${esc(e.title)}</h3>
          <p class="edu-where">${esc(e.institution)} <span class="sep">·</span> ${esc(e.grade)}</p>
          ${notesHTML ? `<div class="edu-note">${notesHTML}</div>` : ''}
        </div>`;
      eduSec.appendChild(div);
    });
  }

  // ── Training & Certifications ──
  function renderTraining(c) {
    trainingData = $$('.train-item').map(item => {
      const whereEl = item.querySelector('.train-where');
      const durEl   = whereEl ? whereEl.querySelector('.train-dur') : null;
      let institute = '';
      if (whereEl) whereEl.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) institute = n.textContent.trim(); });
      return {
        date:     (item.querySelector('.meta-date')||{textContent:''}).textContent.trim(),
        name:     (item.querySelector('.train-title')||{textContent:''}).textContent.trim(),
        institute,
        duration: durEl ? durEl.textContent.replace(/^\s*·\s*/, '').trim() : ''
      };
    });
    const tSync = () => {
      document.querySelectorAll('[data-trdt]').forEach(el => { if (trainingData[+el.dataset.trdt]) trainingData[+el.dataset.trdt].date      = el.value; });
      document.querySelectorAll('[data-trn]').forEach(el =>  { if (trainingData[+el.dataset.trn])  trainingData[+el.dataset.trn].name       = el.value; });
      document.querySelectorAll('[data-tri]').forEach(el =>  { if (trainingData[+el.dataset.tri])  trainingData[+el.dataset.tri].institute  = el.value; });
      document.querySelectorAll('[data-trd]').forEach(el =>  { if (trainingData[+el.dataset.trd])  trainingData[+el.dataset.trd].duration   = el.value; });
    };
    renderTrainingCards(c, tSync);
    makeSortable(c, tSync, trainingData, c2 => renderTrainingCards(c2, tSync));
  }
  function renderTrainingCards(c, syncFn) {
    c.innerHTML = '';
    trainingData.forEach((t, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Training ${i+1}</span>
        <button class="edremove" type="button" data-trr="${i}">Remove</button></div>
        <div class="edf"><label class="edlabel">Date</label>
          <input class="edinput" data-trdt="${i}" value="${escA(t.date)}" placeholder="2024"></div>
        <div class="edf"><label class="edlabel">Name / Certificate</label>
          <input class="edinput" data-trn="${i}" value="${escA(t.name)}" placeholder="Basic Computer Training…"></div>
        <div class="ed2col">
          <div class="edf"><label class="edlabel">Institute</label>
            <input class="edinput" data-tri="${i}" value="${escA(t.institute)}" placeholder="STOP N Go"></div>
          <div class="edf"><label class="edlabel">Duration</label>
            <input class="edinput" data-trd="${i}" value="${escA(t.duration)}" placeholder="6 months"></div>
        </div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Training';
    add.onclick = () => { if (syncFn) syncFn(); trainingData.push({date:'',name:'',institute:'',duration:''}); renderTrainingCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-trr]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); trainingData.splice(+b.dataset.trr, 1); renderTrainingCards(c, syncFn);
    });
  }
  function saveTraining() {
    document.querySelectorAll('[data-trdt]').forEach(el => { trainingData[+el.dataset.trdt].date     = el.value; });
    document.querySelectorAll('[data-trn]').forEach(el => { trainingData[+el.dataset.trn].name      = el.value; });
    document.querySelectorAll('[data-tri]').forEach(el => { trainingData[+el.dataset.tri].institute = el.value; });
    document.querySelectorAll('[data-trd]').forEach(el => { trainingData[+el.dataset.trd].duration  = el.value; });

    let trainSec = null;
    $$('.section').forEach(sec => {
      if ((sec.querySelector('.sec-h')||{textContent:''}).textContent.includes('Training')) trainSec = sec;
    });
    if (!trainSec) return;
    $$('.train-item', trainSec).forEach(el => el.remove());

    trainingData.forEach(t => {
      const durHTML = t.duration ? ` <span class="train-dur">· ${esc(t.duration)}</span>` : '';
      const div = document.createElement('div');
      div.className = 'train-item';
      div.innerHTML = `<div class="meta-date">${esc(t.date)}</div>
        <div>
          <h3 class="train-title">${esc(t.name)}</h3>
          <p class="train-where">${esc(t.institute)}${durHTML}</p>
        </div>`;
      trainSec.appendChild(div);
    });
  }

  // ── Strengths ──
  function renderStrengths(c) {
    strengthsData = $$('.soft').map(soft => {
      const bold = (soft.querySelector('b')||{textContent:''}).textContent.trim();
      let desc = '';
      const span = soft.querySelector('span');
      if (span) span.childNodes.forEach(n => {
        if (n.nodeType===3) { const t = n.textContent.replace(/^\s*[—–-]+\s*/,'').trim(); if (t) desc = t; }
      });
      return {title: bold, desc};
    });
    const xSync = () => {
      document.querySelectorAll('[data-xt]').forEach(el => { if (strengthsData[+el.dataset.xt]) strengthsData[+el.dataset.xt].title = el.value; });
      document.querySelectorAll('[data-xd]').forEach(el => { if (strengthsData[+el.dataset.xd]) strengthsData[+el.dataset.xd].desc  = el.value; });
    };
    renderStrengthCards(c, xSync);
    makeSortable(c, xSync, strengthsData, c2 => renderStrengthCards(c2, xSync));
  }
  function renderStrengthCards(c, syncFn) {
    c.innerHTML = '';
    strengthsData.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'edcard'; card.draggable = true; card.dataset.dragIdx = i;
      card.innerHTML = `<div class="edcard-head"><span class="ed-drag-handle" title="Drag to reorder">⠿</span><span class="edcard-num">Strength ${i+1}</span>
        <button class="edremove" type="button" data-xr="${i}">Remove</button></div>
        <div class="edf"><label class="edlabel">Title</label>
          <input class="edinput" data-xt="${i}" value="${escA(s.title)}"></div>
        <div class="edf"><label class="edlabel">Description</label>
          <input class="edinput" data-xd="${i}" value="${escA(s.desc)}"></div>`;
      c.appendChild(card);
    });
    const add = document.createElement('button');
    add.className = 'edadd'; add.textContent = '+ Add Strength';
    add.onclick = () => { if (syncFn) syncFn(); strengthsData.push({title:'',desc:''}); renderStrengthCards(c, syncFn); };
    c.appendChild(add);
    c.querySelectorAll('[data-xr]').forEach(b => b.onclick = () => {
      if (syncFn) syncFn(); strengthsData.splice(+b.dataset.xr, 1); renderStrengthCards(c, syncFn);
    });
  }
  function saveStrengths() {
    document.querySelectorAll('[data-xt]').forEach(el => { strengthsData[+el.dataset.xt].title = el.value; });
    document.querySelectorAll('[data-xd]').forEach(el => { strengthsData[+el.dataset.xd].desc  = el.value; });
    const grid = $('.soft-grid'); grid.innerHTML = '';
    strengthsData.forEach(s => {
      const div = document.createElement('div');
      div.className = 'soft';
      div.innerHTML = `<span class="dot"></span><span><b>${esc(s.title)}</b> — ${esc(s.desc)}</span>`;
      grid.appendChild(div);
    });
  }

  // ── Footer ──
  function renderFooter(c) {
    const spans = $$('.page-foot span');
    inp(c, 'Footer Left',  'f-fl', (spans[0]||{textContent:''}).textContent.trim());
    inp(c, 'Footer Right', 'f-fr', (spans[1]||{textContent:''}).textContent.trim());
  }
  function saveFooter() {
    const spans = $$('.page-foot span');
    if (spans[0]) spans[0].textContent = $('#f-fl').value;
    if (spans[1]) spans[1].textContent = $('#f-fr').value;
  }

  // ── Drag-and-drop sorter ──
  function makeSortable(container, syncFn, dataArr, renderFn) {
    let dragging = null;

    container.addEventListener('dragstart', e => {
      const card = e.target.closest('.edcard[draggable]');
      if (!card) return;
      dragging = card;
      // defer so the drag image captures the un-dimmed state
      requestAnimationFrame(() => card.classList.add('dragging'));
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.dragIdx);
    });

    container.addEventListener('dragend', () => {
      if (dragging) dragging.classList.remove('dragging');
      container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      dragging = null;
    });

    container.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const card = e.target.closest('.edcard[draggable]');
      if (!card || card === dragging) return;
      container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });

    container.addEventListener('dragleave', e => {
      if (!container.contains(e.relatedTarget))
        container.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    container.addEventListener('drop', e => {
      e.preventDefault();
      const overCard = e.target.closest('.edcard[draggable]');
      if (!overCard || !dragging || overCard === dragging) return;
      const fromIdx = +dragging.dataset.dragIdx;
      const toIdx   = +overCard.dataset.dragIdx;
      syncFn();                               // flush current input values into data array
      const [moved] = dataArr.splice(fromIdx, 1);
      dataArr.splice(toIdx, 0, moved);
      renderFn(container);                   // re-render in new order
    });
  }

  // ── Extract all CV data from DOM into a plain object ──
  function extractAllData() {
    // Role: read only text nodes (skip badge/icon child elements)
    const roleEl = $('.role');
    let roleText = '';
    if (roleEl) roleEl.childNodes.forEach(n => { if (n.nodeType === 3) roleText += n.textContent; });

    const sidebarSecs = $$('.side-section');
    const contactRows = sidebarSecs[0]
      ? $$('.contact-row', sidebarSecs[0]).map(r => ({ k: r.querySelector('.k').textContent.trim(), v: r.querySelector('.v').textContent.trim() }))
      : [];
    const personalRows = sidebarSecs[1]
      ? $$('.contact-row', sidebarSecs[1]).map(r => ({ k: r.querySelector('.k').textContent.trim(), v: r.querySelector('.v').textContent.trim() }))
      : [];

    const skills = $$('.skill-list li').map(li => {
      const bar = li.querySelector('.bar');
      const lv  = parseInt((bar.style.getPropertyValue('--lv') || '70%').replace('%', '')) || 70;
      return { name: li.childNodes[0].textContent.trim(), lv };
    });

    const langs = $$('.lang-list li').map(li => ({
      name: li.childNodes[0].textContent.trim(),
      lvl:  li.querySelector('.lvl').textContent.trim()
    }));

    const work = $$('.job-item').map(item => {
      const whereEl = item.querySelector('.job-where');
      let org = '', location = '';
      if (whereEl) whereEl.childNodes.forEach(n => {
        if (n.nodeType === 3 && n.textContent.trim()) { if (!org) org = n.textContent.trim(); else location = n.textContent.trim(); }
      });
      return {
        date:    (item.querySelector('.meta-date') || { innerHTML: '' }).innerHTML.replace(/<br\s*\/?>/gi, ' ').trim(),
        title:   (item.querySelector('.job-title')  || { textContent: '' }).textContent.trim(),
        org, location,
        bullets: jobNotesToText(item.querySelector('.job-note'))
      };
    });

    const edu = $$('.edu-item').map(item => {
      const whereEl = item.querySelector('.edu-where');
      const sep = whereEl ? whereEl.querySelector('.sep') : null;
      let institution = '';
      if (whereEl) whereEl.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) institution = n.textContent.trim(); });
      const gradeNode = sep ? sep.nextSibling : null;
      return {
        date:        (item.querySelector('.meta-date')  || { textContent: '' }).textContent.trim(),
        title:       (item.querySelector('.edu-title')  || { textContent: '' }).textContent.trim(),
        institution,
        grade:       gradeNode ? gradeNode.textContent.trim() : '',
        notes:       notesToText(item.querySelector('.edu-note'))
      };
    });

    const training = $$('.train-item').map(item => {
      const whereEl = item.querySelector('.train-where');
      const durEl   = whereEl ? whereEl.querySelector('.train-dur') : null;
      let institute = '';
      if (whereEl) whereEl.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) institute = n.textContent.trim(); });
      return {
        date:     (item.querySelector('.meta-date')    || { textContent: '' }).textContent.trim(),
        name:     (item.querySelector('.train-title')  || { textContent: '' }).textContent.trim(),
        institute,
        duration: durEl ? durEl.textContent.replace(/^\s*·\s*/, '').trim() : ''
      };
    });

    const strengths = $$('.soft').map(soft => {
      const bold = (soft.querySelector('b') || { textContent: '' }).textContent.trim();
      let desc = '';
      const span = soft.querySelector('span');
      if (span) span.childNodes.forEach(n => { if (n.nodeType === 3) { const t = n.textContent.replace(/^\s*[—–-]+\s*/, '').trim(); if (t) desc = t; } });
      return { title: bold, desc };
    });

    const refs = $$('.ref-card').map(card => ({
      name:  (card.querySelector('.ref-name')  || { textContent: '' }).textContent.trim(),
      role:  [...card.querySelectorAll('.ref-role')].map(r => r.textContent.trim()).join('\n'),
      phone: (card.querySelector('.ref-phone') || { textContent: '' }).textContent.trim()
    }));

    const footerSpans = $$('.page-foot span');
    const htmlEl = document.documentElement;

    return {
      version:      1,
      photo:        photoDataUrl,
      photoFileName,
      name:         ($('.name') || { textContent: '' }).textContent.trim(),
      role:         roleText.trim(),
      contactRows, personalRows,
      skills, langs,
      interests:    $$('.hobby-chips span').map(s => s.textContent.trim()).join(', '),
      profile:      ($('.summary .lead') || { textContent: '' }).textContent.trim(),
      work, edu, training, strengths, refs,
      footerLeft:   (footerSpans[0] || { textContent: '' }).textContent.trim(),
      footerRight:  (footerSpans[1] || { textContent: '' }).textContent.trim(),
      theme: {
        style:       htmlEl.getAttribute('data-style')   || 'modern',
        fontsize:    htmlEl.getAttribute('data-fontsize') || 'medium',
        sidebar:     htmlEl.getAttribute('data-sidebar') || 'left',
        photo:       htmlEl.getAttribute('data-photo')   || 'on',
        accent:      (document.querySelector('.swatches[data-key="accent"] button.active')      || { dataset: { v: 'terracotta' } }).dataset.v,
        sidebarcolor:(document.querySelector('.swatches[data-key="sidebarcolor"] button.active') || { dataset: { v: 'charcoal'   } }).dataset.v
      }
    };
  }

  // ── Apply a saved data object back to the DOM ──
  function applyAllData(data) {
    // Photo
    if (data.photo) {
      photoDataUrl  = data.photo;
      photoFileName = data.photoFileName || 'photo.jpg';
      try { localStorage.setItem('cv-photo', photoDataUrl); localStorage.setItem('cv-photo-name', photoFileName); } catch(_) {}
      applyPhoto(photoDataUrl);
    } else {
      photoDataUrl  = null;
      photoFileName = 'photo.jpg';
      try { localStorage.removeItem('cv-photo'); localStorage.removeItem('cv-photo-name'); } catch(_) {}
      const photoDiv = $('.photo');
      photoDiv.classList.remove('has-img');
      photoDiv.innerHTML = 'photo · 1:1';
    }

    // Header
    if (data.name !== undefined) $('.name').textContent = data.name;
    if (data.role !== undefined) {
      const roleEl = $('.role');
      [...roleEl.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); });
      roleEl.insertBefore(document.createTextNode(data.role), roleEl.firstChild);
    }

    // Contact / Personal sidebar rows
    if (data.contactRows) {
      const rows = $$('.contact-row', $$('.side-section')[0]);
      rows.forEach((row, i) => { if (data.contactRows[i]) row.querySelector('.v').textContent = data.contactRows[i].v; });
    }
    if (data.personalRows) {
      const rows = $$('.contact-row', $$('.side-section')[1]);
      rows.forEach((row, i) => { if (data.personalRows[i]) row.querySelector('.v').textContent = data.personalRows[i].v; });
    }

    // Skills
    if (data.skills) {
      skillsData = data.skills;
      const ul = $('.skill-list'); ul.innerHTML = '';
      skillsData.forEach(s => {
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(s.name + ' '));
        const bar = document.createElement('span'); bar.className = 'bar'; bar.style.setProperty('--lv', s.lv + '%');
        li.appendChild(bar); ul.appendChild(li);
      });
    }

    // Languages
    if (data.langs) {
      langsData = data.langs;
      const ul = $('.lang-list'); ul.innerHTML = '';
      langsData.forEach(l => {
        const li = document.createElement('li');
        li.appendChild(document.createTextNode(l.name + ' '));
        const lvl = document.createElement('span'); lvl.className = 'lvl'; lvl.textContent = l.lvl;
        li.appendChild(lvl); ul.appendChild(li);
      });
    }

    // Interests
    if (data.interests !== undefined) {
      const chips = data.interests.split(',').map(s => s.trim()).filter(Boolean);
      const el = $('.hobby-chips'); el.innerHTML = '';
      chips.forEach(ch => { const s = document.createElement('span'); s.textContent = ch; el.appendChild(s); });
    }

    // Career Objective
    if (data.profile !== undefined) { const lead = $('.summary .lead'); if (lead) lead.textContent = data.profile; }

    // Work Experience
    if (data.work) {
      workData = data.work;
      let workSec = null;
      $$('.section').forEach(sec => { if ((sec.querySelector('.sec-h') || { textContent: '' }).textContent.includes('Work Experience')) workSec = sec; });
      if (workSec) {
        $$('.job-item', workSec).forEach(el => el.remove());
        workData.forEach(w => {
          const lines = (w.bullets || '').split('\n').map(l => l.trim()).filter(Boolean);
          const bulletsHTML = lines.length ? '<div class="job-note"><ul>' + lines.map(l => `<li>${esc(l)}</li>`).join('') + '</ul></div>' : '';
          const div = document.createElement('div');
          div.className = 'job-item';
          div.innerHTML = `<div class="meta-date">${esc(w.date).replace(/\n/g,'<br>')}</div>
            <div><h3 class="job-title">${esc(w.title)}</h3>
            <p class="job-where">${esc(w.org)} <span class="sep">·</span> ${esc(w.location)}</p>${bulletsHTML}</div>`;
          workSec.appendChild(div);
        });
      }
    }

    // Education
    if (data.edu) {
      eduData = data.edu;
      let eduSec = null;
      $$('.section').forEach(sec => { if ((sec.querySelector('.sec-h') || { textContent: '' }).textContent.includes('Education')) eduSec = sec; });
      if (eduSec) {
        $$('.edu-item', eduSec).forEach(el => el.remove());
        eduData.forEach(e => {
          const lines = (e.notes || '').split('\n').map(l => l.trim()).filter(Boolean);
          const notesHTML = lines.length > 1 ? '<ul>' + lines.map(l => `<li>${esc(l)}</li>`).join('') + '</ul>' : (lines[0] ? esc(lines[0]) : '');
          const div = document.createElement('div');
          div.className = 'edu-item';
          div.innerHTML = `<div class="meta-date">${esc(e.date)}</div>
            <div><h3 class="edu-title">${esc(e.title)}</h3>
            <p class="edu-where">${esc(e.institution)} <span class="sep">·</span> ${esc(e.grade)}</p>
            ${notesHTML ? `<div class="edu-note">${notesHTML}</div>` : ''}</div>`;
          eduSec.appendChild(div);
        });
      }
    }

    // Training & Certifications
    if (data.training) {
      trainingData = data.training;
      let trainSec = null;
      $$('.section').forEach(sec => { if ((sec.querySelector('.sec-h') || { textContent: '' }).textContent.includes('Training')) trainSec = sec; });
      if (trainSec) {
        $$('.train-item', trainSec).forEach(el => el.remove());
        trainingData.forEach(t => {
          const durHTML = t.duration ? ` <span class="train-dur">· ${esc(t.duration)}</span>` : '';
          const div = document.createElement('div');
          div.className = 'train-item';
          div.innerHTML = `<div class="meta-date">${esc(t.date)}</div>
            <div><h3 class="train-title">${esc(t.name)}</h3>
            <p class="train-where">${esc(t.institute)}${durHTML}</p></div>`;
          trainSec.appendChild(div);
        });
      }
    }

    // Transferable Strengths
    if (data.strengths) {
      strengthsData = data.strengths;
      const grid = $('.soft-grid'); grid.innerHTML = '';
      strengthsData.forEach(s => {
        const div = document.createElement('div'); div.className = 'soft';
        div.innerHTML = `<span class="dot"></span><span><b>${esc(s.title)}</b> — ${esc(s.desc)}</span>`;
        grid.appendChild(div);
      });
    }

    // References
    if (data.refs) {
      refsData = data.refs;
      const refSec = $$('.side-section').find(s => (s.querySelector('.side-h') || { textContent: '' }).textContent.includes('Reference'));
      if (refSec) {
        $$('.ref-card', refSec).forEach(el => el.remove());
        refsData.forEach(r => {
          const lines = (r.role || '').split('\n').map(l => l.trim()).filter(Boolean);
          const div = document.createElement('div'); div.className = 'ref-card';
          div.innerHTML = `<div class="ref-name">${esc(r.name)}</div>
            ${lines.map(l => `<div class="ref-role">${esc(l)}</div>`).join('')}
            ${r.phone ? `<div class="ref-phone">${esc(r.phone)}</div>` : ''}`;
          refSec.appendChild(div);
        });
      }
    }

    // Footer
    const footerSpans = $$('.page-foot span');
    if (data.footerLeft  !== undefined && footerSpans[0]) footerSpans[0].textContent = data.footerLeft;
    if (data.footerRight !== undefined && footerSpans[1]) footerSpans[1].textContent = data.footerRight;

    // Theme
    if (data.theme && window.__cvApplyTheme) window.__cvApplyTheme(data.theme);

    syncEmptyRows();
  }

  // ── Hide empty contact rows ──
  function syncEmptyRows() {
    $$('.contact-row').forEach(row => {
      row.classList.toggle('cv-empty', !row.querySelector('.v').textContent.trim());
    });
  }
  syncEmptyRows(); // run on page load

  // ── Save All ──
  function saveAll() {
    saveHeader(); saveContact(); savePersonal(); saveSkills();
    saveLangs(); saveInterests(); saveProfile(); saveEdu();
    saveTraining(); saveStrengths(); saveFooter();
    saveWork(); saveRefs();
    syncEmptyRows();

    const btn = $('#ed-save');
    const prev = btn.textContent;
    btn.textContent = 'Saved ✓';
    btn.style.background = 'oklch(0.45 0.14 145)';
    setTimeout(() => { btn.textContent = prev; btn.style.background = ''; }, 1600);
  }

})();

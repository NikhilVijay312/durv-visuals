(() => {
  const S = window.SITE;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const GALLERY_PATH = "data/gallery.json";

  /* ---------- Toast ---------- */
  let tt;
  function toast(msg, bad) {
    const t = $("#toast"); t.textContent = msg; t.className = "toast show" + (bad ? " bad" : "");
    clearTimeout(tt); tt = setTimeout(() => (t.className = "toast"), 3500);
  }

  /* ---------- Login ---------- */
  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  $("#loginForm").onsubmit = async e => {
    e.preventDefault();
    if ((await sha256($("#pw").value)) === S.adminPasswordHash) { sessionStorage.setItem("adm", "1"); start(); }
    else $("#loginErr").textContent = "Galat password ❌";
  };
  $("#logout").onclick = () => { sessionStorage.removeItem("adm"); location.reload(); };

  /* ---------- Tabs ---------- */
  $$(".tabs button").forEach(b => b.onclick = () => {
    $$(".tabs button").forEach(x => x.classList.toggle("active", x === b));
    $$(".panel").forEach(p => (p.hidden = p.id !== "tab-" + b.dataset.tab));
    if (b.dataset.tab === "manage") renderGrid();
  });

  /* ---------- Categories selects ---------- */
  const catOpts = sel => Object.entries(S.categories).map(([k, v]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${v}</option>`).join("");
  $("#defCat").innerHTML = catOpts();
  $("#vCat").innerHTML = catOpts();

  /* ---------- GitHub API ---------- */
  const gh = () => JSON.parse(localStorage.getItem("gh") || "null");
  async function api(path, opts = {}) {
    const c = gh(); if (!c) throw new Error("GitHub connect nahi hai (Settings tab)");
    const url = `https://api.github.com/repos/${c.owner}/${c.repo}/contents/${path}` + (opts.method ? "" : `?ref=${c.branch}&t=${Date.now()}`);
    const r = await fetch(url, {
      method: opts.method || "GET",
      headers: { Authorization: `Bearer ${c.token}`, Accept: "application/vnd.github+json" },
      body: opts.body ? JSON.stringify({ branch: c.branch, ...opts.body }) : undefined
    });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(`${r.status}: ${j.message || "GitHub error"}`); }
    return r.json();
  }
  const b64FromText = s => { const b = new TextEncoder().encode(s); let bin = ""; b.forEach(x => (bin += String.fromCharCode(x))); return btoa(bin); };
  const textFromB64 = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, "")), c => c.charCodeAt(0)));

  /* ---------- Gallery state ---------- */
  let items = [], sha = null, dirty = false;
  async function loadGallery() {
    try {
      if (gh()) {
        const f = await api(GALLERY_PATH);
        sha = f.sha; items = JSON.parse(textFromB64(f.content));
      } else {
        items = await (await fetch(GALLERY_PATH + "?v=" + Date.now())).json();
      }
    } catch (e) {
      if (String(e.message).startsWith("404")) { items = []; sha = null; }
      else toast("Gallery load error: " + e.message, true);
    }
    dirty = false; renderGrid();
  }
  async function saveGallery(msg) {
    const res = await api(GALLERY_PATH, { method: "PUT", body: { message: msg, content: b64FromText(JSON.stringify(items, null, 2) + "\n"), ...(sha ? { sha } : {}) } });
    sha = res.content.sha; dirty = false;
  }
  const srcUrl = src => {
    const c = gh();
    return /^https?:|^data:/.test(src) || !c ? src : `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}/${src}`;
  };
  const ytId = url => (url || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1];
  const thumb = it => it.type === "video" ? (it.thumb || `https://img.youtube.com/vi/${ytId(it.src)}/hqdefault.jpg`) : srcUrl(it.src);

  /* ---------- Start ---------- */
  function start() {
    $("#login").hidden = true; $("#app").hidden = false;
    const c = gh();
    $("#banner").hidden = !!c;
    if (c) { $("#ghOwner").value = c.owner; $("#ghRepo").value = c.repo; $("#ghBranch").value = c.branch; $("#ghToken").value = c.token; }
    loadGallery(); loadSite();
  }

  /* ---------- Upload queue ---------- */
  let queue = [];
  const drop = $("#drop");
  $("#files").onchange = e => addFiles(e.target.files);
  ["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => addFiles(e.dataTransfer.files));

  function addFiles(files) {
    [...files].filter(f => f.type.startsWith("image/")).forEach(file => {
      queue.push({ file, url: URL.createObjectURL(file), title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), category: $("#defCat").value, status: "" });
    });
    $("#files").value = ""; renderQueue();
  }
  function renderQueue() {
    $("#queue").innerHTML = queue.map((q, i) => `
      <div class="q ${q.status === "✓ Uploaded" ? "ok" : q.status.startsWith("✗") ? "fail" : ""}">
        <img src="${q.url}" alt="" /><button class="x" data-rm="${i}">✕</button>
        <div class="f">
          <input data-i="${i}" data-k="title" value="${esc(q.title)}" placeholder="Title" />
          <select data-i="${i}" data-k="category">${catOpts(q.category)}</select>
          <span class="st">${esc(q.status) || (q.file.size / 1024 / 1024).toFixed(2) + " MB"}</span>
        </div>
      </div>`).join("");
    $("#uploadBtn").hidden = !queue.some(q => q.status !== "✓ Uploaded");
  }
  $("#queue").oninput = e => { const { i, k } = e.target.dataset; if (k) queue[i][k] = e.target.value; };
  $("#queue").onclick = e => { const i = e.target.dataset.rm; if (i !== undefined) { queue.splice(i, 1); renderQueue(); } };

  function compress(file, max = 2000, q = 0.85) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(b => (b ? res(b) : rej(new Error("compress failed"))), "image/jpeg", q);
      };
      img.onerror = () => rej(new Error("image read failed"));
      img.src = URL.createObjectURL(file);
    });
  }
  const blobToB64 = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result.split(",")[1]); fr.readAsDataURL(blob); });
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "photo";

  $("#uploadBtn").onclick = async () => {
    if (!gh()) return toast("Pehle Settings me GitHub connect karo", true);
    const btn = $("#uploadBtn"); btn.disabled = true;
    let added = 0;
    for (const q of queue) {
      if (q.status === "✓ Uploaded") continue;
      try {
        q.status = "Uploading…"; renderQueue();
        const doCompress = $("#compress").checked && !/gif|svg/.test(q.file.type);
        const blob = doCompress ? await compress(q.file) : q.file;
        const ext = doCompress ? "jpg" : (q.file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `images/${Date.now()}-${slug(q.title)}.${ext}`;
        await api(path, { method: "PUT", body: { message: `Upload ${path}`, content: await blobToB64(blob) } });
        items.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type: "image", src: path, title: q.title.trim(), category: q.category });
        q.status = "✓ Uploaded"; added++;
      } catch (e) { q.status = "✗ " + e.message; }
      renderQueue();
    }
    if (added) {
      try { await saveGallery(`Add ${added} photo(s) to portfolio`); toast(`✓ ${added} photo(s) uploaded! Website 1 min me update ho jayegi.`); }
      catch (e) { toast("gallery.json save error: " + e.message, true); }
    }
    queue = queue.filter(q => q.status !== "✓ Uploaded"); renderQueue();
    btn.disabled = false;
  };

  /* ---------- Add video ---------- */
  $("#videoForm").onsubmit = async e => {
    e.preventDefault();
    if (!gh()) return toast("Pehle Settings me GitHub connect karo", true);
    const src = $("#vUrl").value.trim();
    if (!ytId(src)) return toast("Valid YouTube link daalo", true);
    items.unshift({ id: Date.now().toString(36), type: "video", src, title: $("#vTitle").value.trim(), category: $("#vCat").value });
    try { await saveGallery("Add video to portfolio"); e.target.reset(); toast("✓ Video add ho gaya!"); }
    catch (err) { items.shift(); toast(err.message, true); }
  };

  /* ---------- Manage grid ---------- */
  function renderGrid() {
    $("#count").textContent = items.length;
    $("#grid").innerHTML = items.length ? items.map((it, i) => `
      <div class="it">
        <div class="th"><img src="${esc(thumb(it))}" alt="" loading="lazy" onerror="this.src='${esc(it.src)}';this.onerror=null" /><span class="tag">${it.type === "video" ? "▶ Video" : "Photo"}</span></div>
        <div class="f">
          <input data-i="${i}" data-k="title" value="${esc(it.title)}" />
          <select data-i="${i}" data-k="category">${catOpts(it.category)}</select>
          <div class="acts">
            <button data-up="${i}" title="Move up">↑</button>
            <button data-down="${i}" title="Move down">↓</button>
            <button class="del" data-del="${i}" title="Delete">🗑</button>
          </div>
        </div>
      </div>`).join("") : `<p class="muted">Abhi koi item nahi hai. Upload tab se photos daalo.</p>`;
  }
  $("#grid").oninput = e => { const { i, k } = e.target.dataset; if (k) { items[i][k] = e.target.value; dirty = true; e.target.closest(".it").classList.add("dirty"); } };
  $("#grid").onclick = async e => {
    const d = e.target.dataset;
    const swap = (a, b) => { if (b < 0 || b >= items.length) return; [items[a], items[b]] = [items[b], items[a]]; dirty = true; renderGrid(); };
    if (d.up) swap(+d.up, +d.up - 1);
    if (d.down) swap(+d.down, +d.down + 1);
    if (d.del) {
      const it = items[+d.del];
      if (!confirm(`"${it.title}" delete karna hai?`)) return;
      if (!gh()) return toast("Pehle Settings me GitHub connect karo", true);
      items.splice(+d.del, 1);
      try {
        await saveGallery(`Remove ${it.title}`);
        if (it.type === "image" && it.src.startsWith("images/")) {
          const f = await api(it.src).catch(() => null);
          if (f) await api(it.src, { method: "DELETE", body: { message: `Delete ${it.src}`, sha: f.sha } });
        }
        toast("🗑 Delete ho gaya"); renderGrid();
      } catch (err) { items.splice(+d.del, 0, it); toast(err.message, true); renderGrid(); }
    }
  };
  $("#saveAll").onclick = async () => {
    if (!dirty) return toast("Koi change nahi hai");
    try { await saveGallery("Update portfolio"); toast("💾 Saved! Website 1 min me update ho jayegi."); renderGrid(); }
    catch (e) { toast(e.message, true); }
  };
  $("#reload").onclick = () => (!dirty || confirm("Unsaved changes chale jayenge. Refresh karein?")) && loadGallery();
  addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- Settings ---------- */
  $("#ghForm").onsubmit = async e => {
    e.preventDefault();
    const c = { owner: $("#ghOwner").value.trim(), repo: $("#ghRepo").value.trim(), branch: $("#ghBranch").value.trim() || "main", token: $("#ghToken").value.trim() };
    localStorage.setItem("gh", JSON.stringify(c));
    const st = $("#ghStatus"); st.style.color = ""; st.textContent = "Testing…";
    try {
      const r = await fetch(`https://api.github.com/repos/${c.owner}/${c.repo}`, { headers: { Authorization: `Bearer ${c.token}` } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      if (j.permissions && !j.permissions.push) throw new Error("Token ke paas write (Contents) permission nahi hai");
      st.style.color = "var(--green)"; st.textContent = `✓ Connected to ${j.full_name}`;
      $("#banner").hidden = true; loadGallery(); loadSite();
    } catch (err) { st.style.color = "var(--red)"; st.textContent = "✗ " + err.message; }
  };
  $("#ghClear").onclick = () => { localStorage.removeItem("gh"); $("#ghForm").reset(); $("#ghStatus").textContent = "Disconnected"; $("#banner").hidden = false; };
  $("#genHash").onclick = async () => { const v = $("#newPw").value; if (v.length < 6) return toast("Kam se kam 6 characters", true); $("#hashOut").textContent = await sha256(v); };
  $("#exportJson").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }));
    a.download = "gallery.json"; a.click();
  };
  /* ---------- Site customize (data/site.json) ---------- */
  const SITE_PATH = "data/site.json";
  let site = {}, siteSha = null, upTarget = null;
  const siteForm = $("#siteForm");
  const esc2 = esc;
  $("#themeGrid").innerHTML = Object.entries(THEMES).map(([k, t]) => `
    <label class="theme-card"><input type="radio" name="theme" value="${k}" />
      <div class="sw"><i style="background:${t.bg}"></i><i style="background:${t.card}"></i><i style="background:${t.accent}"></i><i style="background:${t.text}"></i></div>
      <span>${esc2(t.name)}</span></label>`).join("");
  $("#fontSel").innerHTML = Object.keys(FONTS).map(f => `<option>${f}</option>`).join("");
  function themeSettings() {
    return { theme: (siteForm.querySelector('[name=theme]:checked') || {}).value || "dark-gold", accent: siteForm.elements.accent.value.trim(), font: siteForm.elements.font.value };
  }
  function refreshTheme() {
    const ts = themeSettings();
    applyTheme(ts, $("#themePreview"));
    $("#accentPick").value = /^#[0-9a-f]{6}$/i.test(ts.accent) ? ts.accent : (THEMES[ts.theme] || THEMES["dark-gold"]).accent;
  }
  $("#accentPick").addEventListener("input", e => { siteForm.elements.accent.value = e.target.value; refreshTheme(); });
  $("#accentReset").onclick = () => { siteForm.elements.accent.value = ""; refreshTheme(); };
  siteForm.addEventListener("change", refreshTheme);
  async function loadSite() {
    try {
      if (gh()) { const f = await api(SITE_PATH); siteSha = f.sha; site = JSON.parse(textFromB64(f.content)); }
      else site = await (await fetch(SITE_PATH + "?v=" + Date.now())).json();
    } catch (e) { if (String(e.message).startsWith("404")) { site = {}; siteSha = null; } else toast("Site settings load error: " + e.message, true); }
    site = Object.assign({}, S, site);
    if (!THEMES[site.theme]) site.theme = "dark-gold";
    [...siteForm.elements].forEach(el => {
      if (!el.name) return;
      if (el.type === "radio") el.checked = el.value === site[el.name];
      else el.value = site[el.name] ?? "";
    });
    if (!siteForm.elements.font.value) siteForm.elements.font.value = "Playfair Display";
    refreshPrev(); refreshTheme();
  }
  function refreshPrev() {
    document.querySelectorAll("[data-prev]").forEach(img => { const v = siteForm.elements[img.dataset.prev].value.trim(); img.src = v ? srcUrl(v) : ""; });
  }
  siteForm.addEventListener("input", e => { if (e.target.name === "heroImage" || e.target.name === "aboutImage") refreshPrev(); if (e.target.name === "accent") refreshTheme(); });
  siteForm.addEventListener("click", e => { const k = e.target.dataset.upimg; if (k) { upTarget = k; $("#siteImgFile").click(); } });
  $("#siteImgFile").onchange = async e => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file || !upTarget) return;
    if (!gh()) return toast("Pehle Settings me GitHub connect karo", true);
    const btn = siteForm.querySelector(`[data-upimg="${upTarget}"]`); btn.disabled = true; btn.textContent = "Uploading…";
    try {
      const blob = /gif|svg/.test(file.type) ? file : await compress(file, upTarget === "heroImage" ? 2400 : 1600);
      const path = `images/${upTarget === "heroImage" ? "hero" : "about"}-${Date.now()}.jpg`;
      await api(path, { method: "PUT", body: { message: `Upload ${path}`, content: await blobToB64(blob) } });
      siteForm.elements[upTarget].value = path; refreshPrev();
      toast("✓ Photo upload ho gayi — ab Save Site dabao");
    } catch (err) { toast(err.message, true); }
    btn.disabled = false; btn.textContent = "⬆ Upload";
  };
  $("#saveSite").onclick = async () => {
    if (!gh()) return toast("Pehle Settings me GitHub connect karo", true);
    const out = {};
    [...siteForm.elements].forEach(el => {
      if (!el.name || (el.type === "radio" && !el.checked)) return;
      out[el.name] = el.type === "number" ? (el.value === "" ? "" : +el.value) : el.value.trim();
    });
    if (out.accent && !/^#[0-9a-f]{6}$/i.test(out.accent)) return toast("Accent colour #rrggbb format me ho (e.g. #c9a55c)", true);
    if (!out.brand) return toast("Brand name khali nahi ho sakta", true);
    out.whatsapp = String(out.whatsapp).replace(/\D/g, "");
    const btn = $("#saveSite"); btn.disabled = true;
    try {
      const res = await api(SITE_PATH, { method: "PUT", body: { message: "Update site settings", content: b64FromText(JSON.stringify(out, null, 2) + "\n"), ...(siteSha ? { sha: siteSha } : {}) } });
      siteSha = res.content.sha; site = out;
      toast("💾 Site save ho gayi! 1–2 min me live dikhega.");
    } catch (err) { toast(err.message, true); }
    btn.disabled = false;
  };

  if (sessionStorage.getItem("adm") === "1") start();
})();

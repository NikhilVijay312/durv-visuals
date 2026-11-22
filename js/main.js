(() => {
  const S = window.SITE || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Fill config values ---------- */
  $$("[data-brand]").forEach(el => (el.textContent = S.brand));
  $$("[data-tagline]").forEach(el => (el.textContent = S.tagline));
  $("#year").textContent = new Date().getFullYear();
  const wa = `https://wa.me/${S.whatsapp}`;
  $("#cEmail").textContent = S.email; $("#cEmail").href = `mailto:${S.email}`;
  $("#cPhone").textContent = S.phone; $("#cPhone").href = `tel:${S.phone.replace(/\s/g, "")}`;
  $("#cLoc").textContent = S.location;
  $("#cWa").href = wa; $("#floatWa").href = wa;
  const soc = { instagram: "IG", youtube: "YT", linkedin: "IN" };
  $("#socials").innerHTML = Object.entries(soc)
    .filter(([k]) => S[k])
    .map(([k, t]) => `<a href="${S[k]}" target="_blank" rel="noopener" aria-label="${k}">${t}</a>`).join("");
  $("#projType").innerHTML = Object.values(S.categories).map(c => `<option>${c}</option>`).join("") + "<option>Other</option>";

  /* ---------- Preloader ---------- */
  const hidePre = () => $("#preloader").classList.add("done");
  window.addEventListener("load", () => setTimeout(hidePre, 400));
  setTimeout(hidePre, 3500); // safety

  /* ---------- Nav ---------- */
  const nav = $("#nav"), burger = $("#burger"), links = $("#navLinks"), toTop = $("#toTop");
  const onScroll = () => {
    nav.classList.toggle("scrolled", scrollY > 60);
    toTop.classList.toggle("show", scrollY > 700);
    let cur = "";
    $$("section[id]").forEach(s => { if (scrollY >= s.offsetTop - 200) cur = s.id; });
    $$(".nav-links a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  burger.onclick = () => { burger.classList.toggle("open"); links.classList.toggle("open"); };
  $$("a", links).forEach(a => a.onclick = () => { burger.classList.remove("open"); links.classList.remove("open"); });
  toTop.onclick = () => scrollTo({ top: 0, behavior: "smooth" });

  /* ---------- Reveal + counters ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    $$(".count", e.target).forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 0.08 + "s"; io.observe(el); });
  function countUp(el) {
    const to = +el.dataset.to, t0 = performance.now(), d = 1800;
    const step = t => { const p = Math.min((t - t0) / d, 1); el.textContent = Math.floor(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------- Hero parallax ---------- */
  const heroBg = $("#heroBg");
  addEventListener("scroll", () => { if (scrollY < innerHeight) heroBg.style.translate = `0 ${scrollY * 0.3}px`; }, { passive: true });

  /* ---------- Custom cursor ---------- */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.body.classList.add("has-cursor");
    const dot = $(".cursor-dot"), ring = $(".cursor-ring");
    let x = 0, y = 0, rx = 0, ry = 0;
    addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; dot.style.translate = `${x}px ${y}px`; });
    (function loop() { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.translate = `${rx}px ${ry}px`; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", e => ring.classList.toggle("big", !!e.target.closest("a,button,.g-item,summary")));
  }

  /* ---------- YouTube helpers ---------- */
  const ytId = url => (url || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Gallery ---------- */
  const PAGE = 9;
  let items = [], filtered = [], shown = PAGE, filter = "all";
  const gal = $("#gallery"), more = $("#loadMore"), empty = $("#galleryEmpty");

  $("#filters").innerHTML = `<button class="active" data-f="all">All Work</button>` +
    Object.entries(S.categories).map(([k, v]) => `<button data-f="${k}">${v}</button>`).join("");
  $("#filters").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#filters button").forEach(x => x.classList.toggle("active", x === b));
    filter = b.dataset.f; shown = PAGE; render();
  };
  more.onclick = () => { shown += PAGE; render(); };

  fetch("data/gallery.json?v=" + Date.now())
    .then(r => r.json())
    .then(d => { items = Array.isArray(d) ? d : d.items || []; render(); })
    .catch(() => { empty.hidden = false; empty.textContent = "Gallery load nahi hui (local test ke liye server se chalao)."; });

  function thumb(it) {
    if (it.type === "video") { const id = ytId(it.src); return it.thumb || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ""); }
    return it.src;
  }
  function render() {
    filtered = items.filter(i => filter === "all" || i.category === filter);
    gal.innerHTML = filtered.slice(0, shown).map((it, i) => `
      <figure class="g-item" data-i="${i}" style="animation-delay:${(i % PAGE) * 60}ms">
        <img src="${esc(thumb(it))}" alt="${esc(it.title)}" loading="lazy" />
        ${it.type === "video" ? '<span class="g-play">▶</span>' : ""}
        <figcaption class="g-info"><small>${esc(S.categories[it.category] || it.category)}</small><h4>${esc(it.title)}</h4></figcaption>
      </figure>`).join("");
    more.hidden = shown >= filtered.length;
    empty.hidden = filtered.length > 0;
  }
  gal.onclick = e => { const f = e.target.closest(".g-item"); if (f) openLB(+f.dataset.i); };

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox"), stage = $("#lbStage"), cap = $("#lbCaption");
  let idx = 0, list = [];
  function show() {
    const it = list[idx];
    if (it.type === "video") {
      const id = ytId(it.src);
      stage.innerHTML = id
        ? `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`
        : it.src ? `<video src="${esc(it.src)}" controls autoplay></video>` : `<div class="placeholder">🎬 Your Showreel Would Play Here<br><small>config.js me showreel link daalo</small></div>`;
    } else stage.innerHTML = `<img src="${esc(it.src)}" alt="${esc(it.title)}" />`;
    cap.textContent = it.title ? `${it.title}${list.length > 1 ? `  ·  ${idx + 1} / ${list.length}` : ""}` : "";
  }
  function openLB(i, custom) {
    list = custom || filtered; idx = i;
    lb.classList.toggle("single", list.length < 2);
    show(); lb.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeLB() { lb.classList.remove("open"); stage.innerHTML = ""; document.body.style.overflow = ""; }
  const go = d => { idx = (idx + d + list.length) % list.length; show(); };
  $("#lbClose").onclick = closeLB;
  $("#lbPrev").onclick = () => go(-1);
  $("#lbNext").onclick = () => go(1);
  lb.onclick = e => { if (e.target === lb) closeLB(); };
  addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "ArrowRight") go(1);
  });
  let tx = 0;
  lb.addEventListener("touchstart", e => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50 && list.length > 1) go(dx < 0 ? 1 : -1); });

  $("#showreelBtn").onclick = () => openLB(0, [{ type: "video", src: S.showreel, title: "Showreel" }]);

  /* ---------- Testimonials ---------- */
  const slides = $$(".slide"), dots = $("#dots");
  let t = 0, timer;
  dots.innerHTML = slides.map((_, i) => `<i data-i="${i}"></i>`).join("");
  const setT = i => {
    t = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === t));
    $$("i", dots).forEach((d, k) => d.classList.toggle("on", k === t));
    clearInterval(timer); timer = setInterval(() => setT(t + 1), 6000);
  };
  dots.onclick = e => e.target.dataset.i && setT(+e.target.dataset.i);
  $("#prevT").onclick = () => setT(t - 1);
  $("#nextT").onclick = () => setT(t + 1);
  setT(0);

  /* ---------- Contact → WhatsApp ---------- */
  $("#contactForm").onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const msg = `Hi ${S.brand}! 👋\n\n*Name:* ${f.name}\n*Phone:* ${f.phone || "-"}\n*Email:* ${f.email || "-"}\n*Project:* ${f.type}\n*Date:* ${f.date || "-"}\n\n${f.message}`;
    window.open(`${wa}?text=${encodeURIComponent(msg)}`, "_blank");
    e.target.reset();
  };
})();

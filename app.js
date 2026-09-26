/* FairSign UI. Vanilla JS, no build step. Depends on engine.js and samples.js. */
(function () {
  "use strict";
  const E = window.FairSign;
  const SAMPLES = window.FAIRSIGN_SAMPLES || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------------------------------------------------------------- i18n
  const UI = {
    en: {
      privacy: "Stays on your device",
      h1: "Spot the red flags before you sign.",
      lede: "Paste a job offer, internship letter or freelance contract. FairSign marks the clauses that could hurt you, explains them in plain language, cites the Indian law behind each one, and writes the email asking for fairer terms.",
      try: "Try a sample", drop: "Drop a file here or", choose: "choose a file", iam: "I am signing as", scan: "Check this contract",
      yourcontract: "Your contract, marked up", high: "High", medium: "Medium", low: "Low", all: "All",
      flagsTitle: "What to push back on", emailTitle: "Your negotiation email",
      emailLede: "Built from the flags you ticked. Polite, specific, and ready to send to HR or your client.",
      toName: "Their name", myName: "Your name", copyEmail: "Copy email", copyReport: "Copy full report",
      helpTitle: "Free help in India", aiTitle: "AI second opinion (optional)",
      aiLede: "Ask Google Gemini to look for anything the rules missed. This sends the contract text to Google using your own API key, which is kept only in this tab.",
      aiRun: "Ask AI", meaning: "What it means", law: "The law and a fairer version", askFor: "Ask for this instead",
      include: "Include in email", copyFix: "Copy wording", fair: "What looks fair", score: "Fairness",
      noFlags: "No red flags in this view.", missing: "Missing from the contract", clause: "Clause", flagsWord: "flags",
      typeEmployee: "Job offer", typeIntern: "Internship", typeFreelancer: "Freelance contract",
    },
    hi: {
      privacy: "आपके डिवाइस पर ही रहता है",
      h1: "साइन करने से पहले ख़तरे के संकेत पहचानें।",
      lede: "नौकरी का ऑफ़र, इंटर्नशिप लेटर या फ्रीलांस अनुबंध पेस्ट करें। FairSign नुकसानदेह शर्तों को चिह्नित करता है, उन्हें आसान भाषा में समझाता है, हर एक के पीछे का भारतीय कानून बताता है, और बेहतर शर्तें माँगने वाला ईमेल लिखता है।",
      try: "नमूना आज़माएँ", drop: "फ़ाइल यहाँ छोड़ें या", choose: "फ़ाइल चुनें", iam: "मैं साइन कर रहा/रही हूँ बतौर", scan: "अनुबंध जाँचें",
      yourcontract: "आपका अनुबंध, चिह्नित", high: "गंभीर", medium: "मध्यम", low: "कम", all: "सभी",
      flagsTitle: "किन बातों पर आपत्ति करें", emailTitle: "आपका बातचीत ईमेल",
      emailLede: "आपके चुने हुए बिंदुओं से बना। विनम्र, स्पष्ट, और HR या क्लाइंट को भेजने के लिए तैयार (अंग्रेज़ी में)।",
      toName: "उनका नाम", myName: "आपका नाम", copyEmail: "ईमेल कॉपी करें", copyReport: "पूरी रिपोर्ट कॉपी करें",
      helpTitle: "भारत में मुफ़्त मदद", aiTitle: "AI से दूसरी राय (वैकल्पिक)",
      aiLede: "Google Gemini से पूछें कि नियमों से कुछ छूटा तो नहीं। इससे अनुबंध आपकी अपनी API key से Google को भेजा जाता है।",
      aiRun: "AI से पूछें", meaning: "इसका मतलब", law: "कानून और बेहतर शर्त (अंग्रेज़ी में)", askFor: "इसके बजाय यह माँगें",
      include: "ईमेल में शामिल करें", copyFix: "शब्द कॉपी करें", fair: "जो उचित लगता है", score: "निष्पक्षता",
      noFlags: "इस दृश्य में कोई ख़तरा नहीं।", missing: "अनुबंध में नहीं है", clause: "शर्त", flagsWord: "बिंदु",
      typeEmployee: "नौकरी का ऑफ़र", typeIntern: "इंटर्नशिप", typeFreelancer: "फ्रीलांस अनुबंध",
    },
  };
  const state = { lang: "en", result: null, text: "", filter: "all", chosen: new Set(), sampleId: null };
  const t = (k) => (UI[state.lang] && UI[state.lang][k]) || UI.en[k] || k;

  function applyI18n() {
    document.documentElement.lang = state.lang;
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); el.classList.toggle("t-hi", state.lang === "hi"); });
    $("#lang-en").setAttribute("aria-pressed", state.lang === "en");
    $("#lang-hi").setAttribute("aria-pressed", state.lang === "hi");
    if (state.result) renderResults(false);
  }

  // ---------------------------------------------------------------- utils
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }
  function setStatus(msg, err) {
    const el = $("#status");
    el.textContent = msg || "";
    el.classList.toggle("err", !!err);
  }
  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg || "Copied");
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (_) { /* ignore */ }
      ta.remove();
      toast(ok ? okMsg || "Copied" : "Select the text and press Ctrl+C to copy");
    }
  }
  const trim = (s, n = 160) => { s = s.replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, "") + "…" : s; };

  // ---------------------------------------------------------------- samples
  function renderSamples() {
    const box = $(".samples");
    SAMPLES.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sample-btn";
      b.dataset.id = s.id;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<b>${esc(s.label)}</b><span>${esc(s.blurb)}</span>`;
      b.addEventListener("click", () => loadSample(s.id, true));
      box.appendChild(b);
    });
  }
  function loadSample(id, scroll) {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    state.sampleId = id;
    $$(".sample-btn").forEach((b) => b.setAttribute("aria-pressed", b.dataset.id === id));
    $("#contract-input").value = s.text;
    $("#role").value = "auto";
    updateWordCount();
    run(scroll);
  }
  function updateWordCount() {
    const n = ($("#contract-input").value.match(/\S+/g) || []).length;
    $("#word-count").textContent = n ? `${n.toLocaleString("en-IN")} words` : "";
  }

  // ---------------------------------------------------------------- analysis
  function run(scroll) {
    const text = $("#contract-input").value;
    if ((text.match(/\S+/g) || []).length < 25) {
      setStatus("Paste at least a few clauses (25+ words) so there is something to check.", true);
      return;
    }
    const roleSel = $("#role").value;
    const t0 = performance.now();
    const result = E.analyze(text, { role: roleSel === "auto" ? undefined : roleSel });
    const ms = Math.max(1, Math.round(performance.now() - t0));
    state.result = result;
    state.text = text.replace(/\r\n?/g, "\n");
    state.filter = "all";
    state.chosen = new Set(result.flags.filter((f) => f.severity !== "low").map((f) => f.id));
    $$("#filter button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === "all"));
    $("#ai-out").innerHTML = "";
    const detected = roleSel === "auto" ? ` Read as: ${roleName(result.role).toLowerCase()}.` : "";
    setStatus(`Checked ${result.clauses} clauses in ${ms} ms.${detected}`);
    renderResults(true);
    if (scroll) $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function roleName(r) { return t(r === "freelancer" ? "typeFreelancer" : r === "intern" ? "typeIntern" : "typeEmployee"); }

  function renderResults(fresh) {
    const r = state.result;
    $("#results").hidden = false;
    renderSummary(r, fresh);
    renderSheet(r);
    renderFlags(r);
    renderPositives(r);
    renderEmail();
    renderHelp(r);
  }

  function renderSummary(r, fresh) {
    const hi = state.lang === "hi";
    const color = r.verdict.level === "stop" ? "var(--high)" : r.verdict.level === "negotiate" ? "var(--med)" : "var(--good)";
    const C = 2 * Math.PI * 52;
    const offset = C * (1 - r.score / 100);
    const terms = r.keyTerms.map((k) => `<div><dt>${esc(k.k)}</dt><dd>${esc(k.v)}</dd></div>`).join("");
    $("#summary").className = `panel summary v-${r.verdict.level}`;
    $("#summary").innerHTML = `
      <div class="gauge" role="img" aria-label="Fairness score ${r.score} out of 100">
        <svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="11"></circle>
        <circle class="val" cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"
          stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${fresh ? C.toFixed(1) : offset.toFixed(1)}"></circle></svg>
        <div class="gauge-num"><b>${r.score}</b><span class="${hi ? "t-hi" : ""}">${esc(t("score"))}</span><span>/ 100</span></div>
      </div>
      <div class="verdict">
        <div class="eyebrow">${esc(roleName(r.role))} · ${r.words.toLocaleString("en-IN")} words · ${r.readMinutes} min read</div>
        <div class="verdict-line"><h2 class="${hi ? "t-hi" : ""}">${esc(hi ? r.verdict.hi : r.verdict.label)}</h2></div>
        <p class="${hi ? "t-hi" : ""}">${esc(hi ? r.verdict.hiText : r.verdict.text)}</p>
        <div class="counts">
          <span class="count high">${r.counts.high} ${esc(t("high"))}</span>
          <span class="count medium">${r.counts.medium} ${esc(t("medium"))}</span>
          <span class="count low">${r.counts.low} ${esc(t("low"))}</span>
          ${r.positives.length ? `<span class="count good">${r.positives.length} ✓</span>` : ""}
        </div>
        ${terms ? `<dl class="terms">${terms}</dl>` : ""}
      </div>`;
    if (fresh) requestAnimationFrame(() => requestAnimationFrame(() => {
      const v = $("#summary .val");
      if (v) v.style.strokeDashoffset = offset.toFixed(1);
    }));
  }

  function renderSheet(r) {
    const text = state.text;
    const hits = [];
    r.flags.forEach((f) => f.hits.forEach((h, i) => { if (h.match != null) hits.push({ start: h.start, end: h.end, sev: f.severity, id: f.id, n: i }); }));
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const rank = { high: 0, medium: 1, low: 2 };
    const merged = [];
    for (const h of hits) {
      const last = merged[merged.length - 1];
      if (last && h.start < last.end) {
        last.end = Math.max(last.end, h.end);
        last.ids.push(h.id);
        if (rank[h.sev] < rank[last.sev]) last.sev = h.sev;
      } else merged.push({ start: h.start, end: h.end, sev: h.sev, ids: [h.id] });
    }
    let html = "", pos = 0;
    for (const m of merged) {
      html += esc(text.slice(pos, m.start));
      html += `<mark class="hl ${m.sev}" data-flags="${m.ids.join(" ")}" id="mk-${m.ids[0]}-${m.start}" tabindex="0">${esc(text.slice(m.start, m.end))}</mark>`;
      pos = m.end;
    }
    html += esc(text.slice(pos));
    $("#sheet").innerHTML = html;
  }

  function flagCard(f) {
    const hi = state.lang === "hi" && f.hi;
    const h = f.hits[0];
    const quote = h && h.match
      ? `<button type="button" class="quote" data-goto="${f.id}" title="Show in contract">“${esc(trim(h.match, 180))}”${f.hits.length > 1 ? ` <span class="muted" style="font-style:normal">+${f.hits.length - 1} more</span>` : ""}</button>`
      : "";
    const note = h && h.note ? `<div class="note">${esc(h.note)}</div>` : "";
    return `
      <article class="panel flag ${f.severity}" id="flag-${f.id}" data-sev="${f.severity}">
        <div class="flag-head">
          <h3 class="${hi ? "t-hi" : ""}">${esc(hi ? f.hi.t : f.title)}</h3>
          <span class="sev ${f.severity}">${esc(t(f.severity))}</span>
        </div>
        <div class="flag-meta"><span>${esc(f.category)}</span>${f.missing ? `<span>· ${esc(t("missing"))}</span>` : ""}</div>
        ${quote}${note}
        <p class="${hi ? "t-hi" : ""}">${esc(hi ? f.hi.p : f.plain)}</p>
        <details>
          <summary class="${state.lang === "hi" ? "t-hi" : ""}">${esc(t("law"))}</summary>
          <div>
            <p>${esc(f.law)}</p>
            <div class="fix-box"><span class="eyebrow ${state.lang === "hi" ? "t-hi" : ""}">${esc(t("askFor"))}</span>${esc(f.fix)}</div>
            <p><b>Ask:</b> ${esc(f.ask)}</p>
          </div>
        </details>
        <div class="flag-foot">
          <label class="check"><input type="checkbox" data-choose="${f.id}" ${state.chosen.has(f.id) ? "checked" : ""}> <span class="${state.lang === "hi" ? "t-hi" : ""}">${esc(t("include"))}</span></label>
          <button type="button" class="btn btn-ghost btn-sm" data-copyfix="${f.id}">${esc(t("copyFix"))}</button>
        </div>
      </article>`;
  }

  function renderFlags(r) {
    const list = r.flags.filter((f) => state.filter === "all" || f.severity === state.filter);
    $("#flag-list").innerHTML = list.length ? list.map(flagCard).join("") : `<div class="panel empty-flags">${esc(t("noFlags"))}</div>`;
  }

  function renderPositives(r) {
    const box = $("#positives");
    if (!r.positives.length) { box.innerHTML = ""; return; }
    const hi = state.lang === "hi";
    box.innerHTML = `<section class="panel positives"><span class="eyebrow">${esc(t("fair"))}</span><ul>${r.positives.map((p) => `<li class="${hi ? "t-hi" : ""}">${esc(hi ? p.hi : p.text)}</li>`).join("")}</ul></section>`;
  }

  function renderEmail() {
    if (!state.result) return;
    $("#email-out").value = E.negotiationEmail(state.result, [...state.chosen], {
      name: $("#my-name").value.trim() || undefined,
      recipient: $("#to-name").value.trim() || undefined,
    });
  }

  function renderHelp(r) {
    const ids = new Set(r.flags.map((f) => f.id));
    const items = [];
    if (ids.has("fee_from_worker")) items.push({ urgent: true, name: "Possible job scam: National Cyber Crime Helpline", num: "1930", url: "https://cybercrime.gov.in", link: "cybercrime.gov.in", desc: "Report before paying anything." });
    items.push({ name: "NALSA free legal aid", num: "15100", url: "https://nalsa.gov.in", link: "nalsa.gov.in", desc: "Free lawyers through your District Legal Services Authority, for eligible applicants." });
    if (r.role === "freelancer") items.push({ name: "MSME Samadhaan (delayed payments)", url: "https://samadhaan.msme.gov.in", link: "samadhaan.msme.gov.in", desc: "Registered micro and small enterprises, including freelancers with Udyam registration, can file delayed-payment cases online." });
    else items.push({ name: "Labour department grievance", url: "https://pgportal.gov.in", link: "pgportal.gov.in", desc: "Unpaid wages or withheld documents can be raised with your state labour department or through the CPGRAMS portal." });
    items.push({ name: "Your college placement cell or legal aid clinic", desc: "Most law schools run free legal aid clinics that review offer letters for students." });
    $("#help-list").innerHTML = items.map((i) => `
      <li class="${i.urgent ? "urgent" : ""}">
        <b>${esc(i.name)}</b>
        ${i.num ? `<span class="num">${esc(i.num)}</span>` : ""}
        <span class="muted" style="font-size:13.5px">${esc(i.desc)}</span>
        ${i.url ? `<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.link)}</a>` : ""}
      </li>`).join("");
  }

  // ---------------------------------------------------------------- interactions
  function flash(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 1600);
  }
  function gotoMark(flagId) {
    const mark = $$("#sheet mark").find((m) => m.dataset.flags.split(" ").includes(flagId));
    if (!mark) return;
    const sheet = $("#sheet");
    const narrow = window.matchMedia("(max-width: 900px)").matches;
    if (narrow) mark.scrollIntoView({ behavior: "smooth", block: "center" });
    else sheet.scrollTo({ top: mark.offsetTop - sheet.clientHeight / 3, behavior: "smooth" });
    flash(mark, "flash");
  }
  function gotoFlag(ids) {
    if (state.filter !== "all") {
      state.filter = "all";
      $$("#filter button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === "all"));
      renderFlags(state.result);
    }
    const card = $("#flag-" + ids[0]);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(card, "pulse");
  }

  function bind() {
    $("#scan").addEventListener("click", () => run(true));
    $("#contract-input").addEventListener("input", () => {
      updateWordCount();
      if (state.sampleId) { state.sampleId = null; $$(".sample-btn").forEach((b) => b.setAttribute("aria-pressed", "false")); }
    });
    $("#contract-input").addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run(true); });
    $("#role").addEventListener("change", () => { if (state.result) run(false); });
    $("#lang-en").addEventListener("click", () => { state.lang = "en"; applyI18n(); });
    $("#lang-hi").addEventListener("click", () => { state.lang = "hi"; applyI18n(); });

    $("#filter").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-f]");
      if (!b) return;
      state.filter = b.dataset.f;
      $$("#filter button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      renderFlags(state.result);
    });
    $("#flag-list").addEventListener("click", (e) => {
      const q = e.target.closest("[data-goto]");
      if (q) return gotoMark(q.dataset.goto);
      const c = e.target.closest("[data-copyfix]");
      if (c) {
        const f = state.result.flags.find((x) => x.id === c.dataset.copyfix);
        copyText(f.fix, "Fairer wording copied");
      }
    });
    $("#flag-list").addEventListener("change", (e) => {
      const cb = e.target.closest("[data-choose]");
      if (!cb) return;
      if (cb.checked) state.chosen.add(cb.dataset.choose); else state.chosen.delete(cb.dataset.choose);
      renderEmail();
    });
    const sheetGo = (e) => {
      const m = e.target.closest("mark.hl");
      if (m) gotoFlag(m.dataset.flags.split(" "));
    };
    $("#sheet").addEventListener("click", sheetGo);
    $("#sheet").addEventListener("keydown", (e) => { if (e.key === "Enter") sheetGo(e); });
    $("#my-name").addEventListener("input", renderEmail);
    $("#to-name").addEventListener("input", renderEmail);
    $("#copy-email").addEventListener("click", () => copyText($("#email-out").value, "Email copied"));
    $("#copy-report").addEventListener("click", () => copyText(E.textReport(state.result, state.lang), "Report copied"));
    $("#ai-run").addEventListener("click", runAI);

    // Files
    const input = $("#file-input");
    $("#pick-file").addEventListener("click", () => input.click());
    input.addEventListener("change", () => { if (input.files[0]) readFile(input.files[0]); input.value = ""; });
    const drop = $("#drop");
    ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
    ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("dragging"); }));
    drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) readFile(f); });
  }

  // ---------------------------------------------------------------- file reading
  async function readFile(file) {
    const name = file.name.toLowerCase();
    setStatus(`Reading ${file.name}…`);
    try {
      let text;
      if (name.endsWith(".docx")) text = await readDocx(await file.arrayBuffer());
      else if (name.endsWith(".pdf")) text = await readPdf(await file.arrayBuffer());
      else if (name.endsWith(".doc")) throw new Error("Old .doc files can't be read. Save it as .docx or PDF, or paste the text.");
      else text = await file.text();
      text = text.replace(/ /g, " ").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (!text) throw new Error("No text found. If this is a scanned image, copy the text out with your phone's text scanner and paste it here.");
      $("#contract-input").value = text;
      state.sampleId = null;
      $$(".sample-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
      updateWordCount();
      run(true);
    } catch (err) {
      setStatus(err.message || "Couldn't read that file. Paste the text instead.", true);
    }
  }

  // Minimal ZIP reader for .docx using the browser's built-in DecompressionStream
  async function readDocx(buf) {
    const dv = new DataView(buf);
    let eocd = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("This doesn't look like a valid .docx file.");
    const count = dv.getUint16(eocd + 10, true);
    let p = dv.getUint32(eocd + 16, true);
    const dec = new TextDecoder();
    for (let n = 0; n < count; n++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true);
      const csize = dv.getUint32(p + 20, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const local = dv.getUint32(p + 42, true);
      const fname = dec.decode(new Uint8Array(buf, p + 46, nlen));
      p += 46 + nlen + elen + clen;
      if (fname !== "word/document.xml") continue;
      const lnlen = dv.getUint16(local + 26, true), lelen = dv.getUint16(local + 28, true);
      const data = new Uint8Array(buf, local + 30 + lnlen + lelen, csize);
      let xml;
      if (method === 0) xml = dec.decode(data);
      else if (method === 8) {
        if (typeof DecompressionStream === "undefined") throw new Error("This browser can't open .docx files. Paste the text instead.");
        const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
        xml = await new Response(stream).text();
      } else throw new Error("Unsupported .docx compression.");
      return docxXmlToText(xml);
    }
    throw new Error("No document text found in this .docx.");
  }
  function docxXmlToText(xml) {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const paras = doc.getElementsByTagNameNS(W, "p");
    const out = [];
    for (const para of paras) {
      let s = "";
      const walker = doc.createTreeWalker(para, NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.namespaceURI !== W) continue;
        if (node.localName === "t") s += node.textContent;
        else if (node.localName === "tab") s += "\t";
        else if (node.localName === "br" || node.localName === "cr") s += "\n";
      }
      out.push(s);
    }
    return out.join("\n\n");
  }

  // PDF: load pdf.js from cdnjs only when a PDF is dropped
  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error("Couldn't load the PDF reader. Check your connection, or paste the text instead."));
      document.head.appendChild(s);
    });
  }
  async function readPdf(buf) {
    if (!window.pdfjsLib) {
      await loadScript(PDFJS + "pdf.worker.min.js"); // defines pdfjsWorker so pdf.js can run without a separate worker
      await loadScript(PDFJS + "pdf.min.js");
    }
    const lib = window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
    const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
    const pages = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      let s = "", lastY = null;
      for (const it of tc.items) {
        const y = it.transform ? it.transform[5] : null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 14) s += "\n";
        else if (lastY !== null && Math.abs(y - lastY) > 2) s += "\n";
        s += it.str;
        if (it.hasEOL) s += "\n";
        lastY = y;
      }
      pages.push(s);
    }
    return pages.join("\n\n");
  }

  // ---------------------------------------------------------------- optional AI
  async function runAI() {
    const out = $("#ai-out");
    const key = $("#ai-key").value.trim();
    const model = ($("#ai-model").value.trim() || "gemini-2.5-flash").replace(/[^\w.-]/g, "");
    if (!state.result) return;
    if (!key) { out.innerHTML = `<p class="status err">Add a Gemini API key first. You can get a free one from Google AI Studio.</p>`; return; }
    out.innerHTML = `<p class="status">Asking ${esc(model)}…</p>`;
    const already = state.result.flags.map((f) => `- ${f.title}`).join("\n") || "- none";
    const prompt = `You are helping a worker in India review a contract before signing. A rule-based checker already flagged:\n${already}\n\nRead the contract below and return JSON only, in this shape:\n{"summary": "3 plain-English sentences on what this contract means for the worker", "missed": [{"title": "short name of an unfair or risky clause the checker missed", "quote": "exact words from the contract", "why": "one sentence on why it matters under Indian law"}]}\nReturn at most 5 items in "missed". Only include clauses that really appear in the text. If nothing was missed, return an empty list.\n\nCONTRACT:\n${state.text.slice(0, 30000)}`;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(res.status === 400 || res.status === 403 ? "Google rejected the key or model name. Check both and try again." : `Google returned an error (${res.status}). ${trim(body, 120)}`);
      }
      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "{}";
      const j = JSON.parse(raw.replace(/^```(?:json)?|```$/g, ""));
      const missed = (j.missed || []).filter((m) => m && m.quote && state.text.toLowerCase().includes(String(m.quote).toLowerCase().slice(0, 40)));
      out.innerHTML = `
        <div class="ai-item"><b>AI summary</b>${esc(j.summary || "")}</div>
        ${missed.length ? missed.map((m) => `<div class="ai-item"><b>${esc(m.title)}</b><i>“${esc(trim(m.quote, 160))}”</i><br>${esc(m.why)}</div>`).join("") : `<div class="ai-item">The AI found nothing extra beyond the flags above.</div>`}
        <p class="muted" style="margin:0;font-size:12.5px">AI suggestions can be wrong. FairSign only shows items whose quoted text actually appears in your contract.</p>`;
    } catch (err) {
      const blocked = err instanceof TypeError;
      out.innerHTML = `<p class="status err">${esc(blocked ? "Couldn't reach Google from this page. The AI check works on the self-hosted version of FairSign; the rule-based check above works everywhere." : err.message)}</p>`;
    }
  }

  // ---------------------------------------------------------------- boot
  renderSamples();
  bind();
  applyI18n();
  loadSample(SAMPLES[0] && SAMPLES[0].id, false);
})();

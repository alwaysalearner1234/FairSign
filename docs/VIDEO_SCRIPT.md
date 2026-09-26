# Demo video script (target 2:45, hard limit 3:00)

**Setup:** screen recording of the live app at 1280×720 or larger, browser zoom at 110%, with your voice over it. Free recorders: OBS, Loom, or Windows Game Bar (Win+G). Close other tabs. Say the lines, don't read them word for word.

---

### 0:00–0:20 · The problem (face-cam or title card)
> "Every placement season, lakhs of students in India sign offer letters they don't fully understand. Training bonds of fifty thousand rupees. Employers keeping your original degree. Two-year non-competes that courts have said are void. A lawyer costs more than a month's stipend. So we built FairSign."

### 0:20–0:35 · What it is (the app, internship sample already loaded)
> "FairSign reads your job offer, internship letter or freelance contract, and tells you in plain language what could hurt you and what to ask for instead. It runs entirely in your browser, so your contract never leaves your device."
*Point at the "Stays on your device" chip.*

### 0:35–1:20 · The internship sample (the core demo)
- Click **Internship offer** and scroll to the score. It reads **33/100, "Don't sign this as it is"**, with 7 high-priority flags.
> "It's a real-looking startup offer. FairSign found seven serious problems."
- Point at the key terms row: *₹8,000 per month · Your notice: 30 days · Their notice: none.*
> "It noticed I have to give 30 days' notice, but they can fire me with none."
- Click the red highlight on **"submit original educational certificates"**. The card pulses.
> "No law lets an employer keep your original certificates. It tells me that, and gives me the wording to ask for."
- Open **"The law and a fairer version"** on the non-compete card.
> "Every flag cites the actual law. Here it's Section 27 of the Contract Act and the Supreme Court's Zaheer Khan case."

### 1:20–1:45 · The negotiation email
- Scroll to the email. Type your name and "Ms. Rao".
> "Most people know something's wrong but not what to say. FairSign writes the email, politely, quoting each clause with the fix. I untick what I don't care about, and copy."
- Click **Copy email**.

### 1:45–2:05 · Hindi + freelancer
- Click **हिंदी**.
> "Everything important is available in Hindi, for people more comfortable in their own language."
- Click the **Freelance design contract** sample.
> "For freelancers, it catches payment only 'on the client's sole satisfaction', payment only after *their* customer pays, 90-day payment terms that break the MSMED Act's 45-day limit, and your work becoming theirs before you're paid."

### 2:05–2:25 · Real files, scams and help
- Switch back to English. Drag in a .docx offer letter (use `docs/demo-scam-offer.docx`).
> "It reads Word and PDF files. This one asks the candidate to pay a security deposit, which is a classic job scam, so FairSign flags it and points to the 1930 cyber-crime helpline."
- Point at the **Free help in India** panel: NALSA 15100.

### 2:25–2:40 · How it works / AI
> "Under the hood there's a clause-aware rule engine with 33 checks grounded in Indian statutes and case law, plus document-level reasoning for things like one-sided notice. It's tested, instant and explainable. There's an optional Gemini second opinion, and we only show AI findings whose quoted text actually exists in your contract, so it can't invent clauses."

### 2:40–2:50 · Close
> "FairSign. Spot the red flags before you sign. Thank you."

---

**Screenshots to upload to Devpost (take them at 1280px wide):**
1. The summary card with score 33 and the marked-up contract beside the flags
2. A flag card opened on "The law and a fairer version"
3. The negotiation email filled in
4. The Hindi view
5. The freelance contract result
6. The phone view (browser DevTools → toggle device toolbar → iPhone 12)

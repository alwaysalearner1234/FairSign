# Devpost submission: copy each section into the matching field

---

## Project name
FairSign

## Tagline (short summary)
Spot the red flags before you sign. FairSign reads your job offer, internship letter or freelance contract, highlights the clauses that could hurt you, explains them in plain English or Hindi with the Indian law behind each one, and writes the email asking for fairer terms. All of it happens privately in your browser.

## Tracks
Access to Justice & Civic Tech · Legal Automation & Workflow Innovation

---

## Inspiration

Every placement season, students and first-job workers in India sign documents they don't understand, because the alternative feels like losing the offer. The same traps come up again and again:

- **"Training bonds"** of ₹50,000 to ₹2,00,000 for leaving early
- Employers **keeping original degree certificates** so people can't quit
- **Two-year non-competes**, which Indian courts have held void under Section 27 of the Contract Act
- Freelancers paid "**on the client's sole satisfaction**", 90 days later, after the client's own customer pays
- Offers that ask the candidate to **pay a "registration fee"**, a classic job scam

A lawyer costs more than a month's stipend, and free legal aid exists but few people know how to reach it. We wanted a tool anyone can use in the two minutes between receiving an offer and replying to HR.

## What it does

1. **Paste or drop the contract** (text, .docx or .pdf). It can be read as an employee, intern or freelancer, or detected automatically.
2. **Get a fairness score and a verdict:** *Don't sign this as it is*, *Negotiate before signing* or *Looks broadly fair*.
3. **See the contract marked up** in red, amber and blue. Clicking a highlight opens its explanation, and clicking the explanation jumps back to the clause.
4. **Read each flag in four layers:** the exact quoted clause, what it means for you in plain English or Hindi, the law (statute or Supreme Court case), and fairer replacement wording.
5. **Catch what's missing:** no salary figure, no payment deadline, no exit clause. It also compares your notice period with theirs.
6. **Get a ready-to-send negotiation email** built from the flags you tick, quoting each clause with its suggested fix.
7. **Find the right free help:** NALSA legal aid (15100), MSME Samadhaan for delayed freelancer payments, labour grievance portals, and the 1930 cyber-crime helpline when the offer looks like a scam.
8. **Ask an AI for a second opinion (optional):** with your own Gemini key, the model looks for anything the rules missed. We only display AI findings whose quoted text actually appears in the contract, so it can't hallucinate a clause.

## How we built it

- **A clause-aware rule engine** (`engine.js`, dependency-free). It splits the contract into clauses (numbered headings, sub-clauses, or sentence groups for text pasted as one block), then runs **33 checks** against each clause. Each check has trigger patterns, context the clause must also contain, and "unless" patterns that cancel false positives. For example, certificates "returned after verification" are fine, and "no waiver" boilerplate isn't treated as giving up your rights.
- **Document-level reasoning** for things one clause can't show. It parses durations such as "ninety (90) days" and "3 months" into days to detect **one-sided notice periods**, **payment terms beyond the MSMED Act's 45 days**, and **missing** terms.
- **Scoring** uses severity-weighted penalties with smooth decay, so a terrible contract and a merely bad one still look different, plus credit for fair clauses (mutual notice, liability caps, IP carve-outs, paid leave).
- **Legal grounding.** Every rule cites its source: Indian Contract Act 1872 (ss. 27, 28, 62, 70, 74, 124-125), Code on Wages 2019, Copyright Act 1957 (ss. 17, 19, 57), MSMED Act 2006, Arbitration Act 1996 (ss. 11, 12(5)), DPDP Act 2023, *Percept D'Mark v. Zaheer Khan* (2006), *Perkins Eastman v. HSCC* (2019) and *CORE v. ECI-SPIC-SMO-MCML* (2024).
- **File reading with no libraries for .docx.** We wrote a small ZIP reader that uses the browser's native `DecompressionStream`. pdf.js loads only when a PDF is opened.
- **UX for non-lawyers:** plain-language copy, one-click toggle between English and Hindi, colour plus text labels for severity (never colour alone), keyboard navigation, dark mode, and a layout that works on a ₹8,000 phone.
- **Tests:** 13 `node:test` cases covering each sample contract, false-positive guards, a scam offer, duration parsing, and checks that every highlight maps to the exact source text.

## Challenges we ran into

- **False positives.** Legal boilerplate is full of scary words. "Shall not constitute a waiver" is harmless, while "waives all claims" is not. We added "unless" patterns and clause-level context checks, and wrote tests for each false positive we found.
- **Asymmetry is invisible clause by clause.** "You may resign with 90 days' notice" and "the Company may terminate at any time" can each look normal on their own. The problem only shows when you compare them, so we built a document-level pass.
- **Keeping it honest.** We explain what the law says and what courts have done, and never claim a clause is definitely unenforceable. FairSign tells you what to ask about. It does not replace a lawyer.

## Accomplishments we're proud of

- It works **offline, privately and instantly**. Checking a contract takes a few milliseconds.
- The **negotiation email**, which turns analysis into action. Most people know a clause feels wrong but not what to ask for instead.
- **Scam detection**. A registration-fee clause switches the help panel to the cyber-crime helpline.

## What we learned

Most people don't need a legal essay. They need to know which three clauses to push back on and what words to use. Keeping the product useful meant designing around that decision instead of around the law itself.

## What's next for FairSign

- Contracts written in Hindi, Tamil and other Indian languages as input
- Rental agreements and consumer terms of service
- A shareable review link so a college placement cell or legal aid clinic can check a student's offer
- Partnerships with placement cells and legal aid clinics (the LexHack Builders Fellowship would help here)

---

## Built with
javascript · html5 · css3 · pdf.js · google-gemini-api · node.js (tests) · github-pages

## Try it out
- Live demo: `<paste your GitHub Pages URL>`
- Code: `<paste your GitHub repo URL>`

## Declaration of pre-existing tools and AI use
- **Libraries:** pdf.js (Mozilla, Apache-2.0) for reading PDFs, and Google Fonts. Everything else (rule engine, .docx reader, UI) was written during the hackathon.
- **AI in the product:** optional Google Gemini call with a user-supplied key. The core analysis does not use an LLM.
- **AI used while building:** we used Anthropic's Claude as a coding and writing assistant for the code, rule explanations and documentation. We reviewed the legal references against the statutes and judgments cited.
- **Sample contracts** are fictional. Any resemblance to real companies is unintended.

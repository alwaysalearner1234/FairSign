# FairSign

Demo video : https://youtu.be/GJdQPFhgARk

**Spot the red flags before you sign.**

FairSign reads a job offer, internship letter or freelance contract and tells you, in plain English or Hindi, which clauses could hurt you. It explains the Indian law behind each one, suggests fairer wording, and writes the email asking for changes.

Your contract never leaves your device. The analysis runs entirely in the browser, with no server and no sign-up.

Built for **LexHack 2026**. Tracks: Access to Justice & Civic Tech, Legal Automation & Workflow Innovation.

---

## What it does

1. **Takes the contract any way you have it.** Paste the text, or drop a `.txt`, `.docx` or `.pdf` file. Three sample contracts are built in.
2. **Scores fairness from 0 to 100** and gives a verdict: *Don't sign this as it is*, *Negotiate before signing* or *Looks broadly fair*.
3. **Marks up the contract.** Risky text is highlighted red, amber or blue. Clicking a highlight jumps to its explanation, and clicking an explanation jumps back to the clause.
4. **Explains each flag in four layers:** what the clause says (quoted), what it means for you, the law behind it, and fairer wording to ask for.
5. **Finds what's missing,** such as no pay amount, no payment deadline, or no way to exit.
6. **Pulls out key terms:** pay, length, your notice period vs. theirs, governing law and courts.
7. **Writes the negotiation email** from the flags you tick, quoting each clause with its suggested replacement.
8. **Points you to free help** that fits the problem: NALSA legal aid (15100), MSME Samadhaan for late payments, labour grievance portals, and the 1930 cyber-crime helpline when an offer looks like a job scam.
9. **Offers an optional AI second opinion.** With your own Gemini API key, the app asks the model for anything the rules missed. It shows an item only if the quoted text actually appears in your contract, which guards against hallucinated clauses.

## What it catches

33 checks, plus 8 "looks fair" signals, tuned to the traps students and early-career workers in India run into most:

| Area | Examples |
|---|---|
| Money | Service bonds and liquidated damages, forfeited stipend/salary, open-ended deductions, fees charged to the candidate (scam signal), pay on "sole satisfaction", pay-when-paid, payment over 45 days, cancellation without a kill fee, unlimited indemnity |
| Your future | Post-employment non-competes, perpetual confidentiality, broad non-solicitation, very long notice periods |
| Your work | IP grabs over personal/prior work, IP transfer before payment, moral-rights waivers, unlimited revisions |
| Your rights | Original certificates kept by the employer, one-sided changes to terms, waiver of the right to sue |
| Disputes | Arbitrator picked by one side (*Perkins Eastman*, 2019; *CORE*, 2024), foreign governing law |
| Job security | One-sided notice, termination at any time, open-ended probation |
| Privacy | Access to personal devices and social media, "any purpose" data-sharing consent (DPDP Act, 2023) |

Each flag cites its source: Indian Contract Act 1872 (ss. 27, 28, 62, 70, 74, 124-125), Code on Wages 2019, Copyright Act 1957 (ss. 17, 19, 57), MSMED Act 2006 (s. 15), Arbitration and Conciliation Act 1996 (ss. 11, 12(5)), DPDP Act 2023 and the OSH Code 2020.

## Why a rule engine first, AI second

Legal help has to be **explainable, private and consistent**:

- **Explainable.** Every flag points at the exact words in the contract and names the law behind it. Nothing is invented.
- **Private.** Offer letters contain salaries, addresses and ID details. FairSign analyses them locally, and nothing is uploaded unless you choose to use the AI option.
- **Always available.** No API key, quota or network is needed, so it works on a cheap phone on a slow connection.
- **Consistent.** The same contract always gets the same result, which is backed by a test suite.

The LLM is optional and sits on top. It can surface unusual clauses, and the app checks its answers against the source text.

## Run it

It is static HTML/CSS/JS with no build step and no dependencies.

```bash
git clone https://github.com/<you>/fairsign.git
cd fairsign
python3 -m http.server 8080      # or just open index.html in a browser
# open http://localhost:8080
```

Run the tests (Node 18+):

```bash
npm test
```

Build a single self-contained HTML file (`dist/fairsign.html`):

```bash
npm run build:single
```

### Deploy to GitHub Pages (2 minutes)

1. Push this folder to a public GitHub repo.
2. Go to **Settings → Pages → Build and deployment → Source: Deploy from a branch**, then choose `main` and `/ (root)`.
3. Your app is live at `https://<you>.github.io/fairsign/`.

## Project structure

```
index.html            page markup
styles.css            design tokens (light + dark), layout
engine.js             clause splitter, 33 rules, scoring, key terms, email + report builders (works in browser and Node)
samples.js            three fictional sample contracts
app.js                UI: rendering, highlighting, file reading (.docx via native DecompressionStream, .pdf via pdf.js), i18n, optional Gemini call
tests/engine.test.js  13 tests (node:test)
tools/build-single.js bundles everything into one HTML file
docs/                 Devpost write-up and demo-video script
```

## Tech stack

- Vanilla JavaScript (ES2020), HTML and CSS, with no framework and no build step.
- A custom rule engine using regex patterns and clause-aware matching, with document-level checks for notice asymmetry and missing terms.
- Native browser APIs: `DecompressionStream` to unzip `.docx` files, `DOMParser` for WordprocessingML, and the Clipboard API.
- [pdf.js](https://mozilla.github.io/pdf.js/) 3.11.174 from cdnjs, loaded only when a PDF is opened (Apache-2.0).
- Optional: the Google Gemini API (`gemini-2.5-flash` by default, user-supplied key).
- Google Fonts: Bricolage Grotesque, Public Sans, Source Serif 4, IBM Plex Mono and Noto Sans Devanagari.
- Tests use Node's built-in `node:test`.

## Transparency

- **AI tools used to build it:** The code, rule text and documentation were written with help from Anthropic's Claude. Every legal reference was checked by the team against the statutes and judgments named above.
- **Pre-existing libraries:** pdf.js and Google Fonts only. Everything else was written for this hackathon.
- **Sample contracts** are fictional. Company names are invented.

## Limits

- FairSign is **not legal advice**. It flags clauses worth asking about; it does not tell you a clause is legally unenforceable in your specific case.
- The rules are tuned for Indian law and English-language contracts. Unusual wording can be missed, which is what the optional AI check is for.
- Scanned PDFs that contain only images have no text layer. Paste the text instead, for example from your phone's text scanner.

## Roadmap

- Hindi, Tamil and other Indian-language contracts as input, not just output.
- Rental agreements and consumer terms.
- A shareable review link for a college placement cell or legal aid clinic.
- A crowd-sourced clause library, with anonymised clauses contributed by users.

## License

MIT
#

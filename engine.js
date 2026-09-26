/*
 * FairSign clause engine
 * ----------------------
 * Finds risky clauses in employment, internship and freelance contracts,
 * explains them in plain language, and points to the Indian law behind each flag.
 * Pure JavaScript, no dependencies, runs in the browser and in Node.
 *
 * Not legal advice. Every rule is a heuristic written to help a person
 * spot clauses worth asking about before they sign.
 */
(function (root) {
  "use strict";

  const SEV_WEIGHT = { high: 16, medium: 8, low: 3 };
  const ROLES = ["employee", "intern", "freelancer"];

  // Helpers for durations ---------------------------------------------------
  const WORD_NUM = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, fifteen: 15, eighteen: 18, twenty: 20, "twenty-four": 24,
    thirty: 30, forty: 40, "forty-five": 45, sixty: 60, ninety: 90, "one hundred twenty": 120,
  };
  const UNIT_DAYS = { day: 1, week: 7, month: 30, year: 365 };
  // e.g. "ninety (90) days", "3 months", "thirty days'"
  const DUR_RE = /\b(\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|eighteen|twenty|thirty|forty|forty-five|sixty|ninety)\b\s*(?:\(\s*(\d{1,3})\s*\)\s*)?(?:calendar\s+|working\s+|business\s+)?(day|week|month|year)s?\b/gi;

  function durations(text) {
    const out = [];
    DUR_RE.lastIndex = 0;
    let m;
    while ((m = DUR_RE.exec(text))) {
      const n = m[2] ? parseInt(m[2], 10) : (/^\d+$/.test(m[1]) ? parseInt(m[1], 10) : WORD_NUM[m[1].toLowerCase()]);
      if (!n) continue;
      out.push({ days: n * UNIT_DAYS[m[3].toLowerCase()], text: m[0], index: m.index });
    }
    return out;
  }

  // ------------------------------------------------------------------------
  // RULES
  // re: regex or array of regexes (any may match; the match is highlighted)
  // also: regexes that must all match somewhere in the same clause
  // unless: regex that cancels the flag if it matches the clause
  // roles: which contract types the rule applies to (default: all)
  // ------------------------------------------------------------------------
  const RULES = [
    {
      id: "fee_from_worker",
      title: "You are asked to pay to get the job",
      category: "Money",
      severity: "high",
      re: [
        /\b(?:registration|training|security|processing|onboarding|kit|laptop|joining)\s+(?:fee|deposit|charges?|amount)s?\b[^.]{0,100}?\b(?:payable|paid|deposit(?:ed)?|pay)\b[^.]{0,40}?\b(?:by|from)\s+(?:the\s+)?(?:candidate|intern|employee|trainee|you)\b/i,
        /\b(?:candidate|intern|trainee|you)\b[^.]{0,40}?\b(?:shall|must|will|is required to)\s+(?:pay|deposit)\b[^.]{0,60}?\b(?:fee|deposit)\b/i,
      ],
      unless: /\b(?:resign|leave|leaving|quit|terminat\w*|before (?:the )?(?:completion|end|expiry)|damages|bond|breach)\b/i,
      unlessNear: true,
      plain: "A real employer pays you. Asking you to pay a registration, training or security fee before you start is the most common sign of a job scam.",
      law: "Fee-charging job offers are a common recruitment fraud pattern flagged by the Ministry of Labour and police cyber-cells. Legitimate employers do not collect deposits from new hires.",
      fix: "Remove this clause. The company bears all onboarding, training and equipment costs.",
      ask: "Why is a payment needed from me? Can you share the company's GST and CIN numbers so I can verify it?",
      hi: { t: "नौकरी पाने के लिए आपसे पैसे माँगे जा रहे हैं", p: "असली नियोक्ता आपको पैसे देता है, आपसे नहीं लेता। रजिस्ट्रेशन, ट्रेनिंग या सिक्योरिटी फीस माँगना नौकरी धोखाधड़ी का सबसे आम संकेत है।" },
    },
    {
      id: "non_compete",
      title: "Bans you from working elsewhere after you leave",
      category: "Your future",
      severity: "high",
      re: [
        /\bshall not\b[^.]{0,80}?\b(?:join|engage|be employed|work for|take up employment|accept employment|provide (?:any )?services)\b[^.]{0,80}?\b(?:competitor|competing|similar business|rival|any (?:other )?(?:company|organi[sz]ation|client|business))/i,
        /\bnon[- ]?compet\w*/i,
      ],
      also: [/\b(?:after|following|post|upon|from the date of|subsequent to)\b[^.]{0,40}?\b(?:termination|cessation|leaving|separation|resignation|end|expiry)\b|\bfor a period of\b|\b(?:months|years)\b/i],
      plain: "This stops you from taking a job with a competitor, or starting similar work, for a period after you leave. It can lock you out of your own field.",
      law: "Section 27 of the Indian Contract Act, 1872 makes agreements that restrain anyone from a lawful profession or trade void. The Supreme Court (Percept D'Mark v. Zaheer Khan, 2006) and many High Courts have refused to enforce non-competes after employment ends. Restrictions during employment can be valid.",
      fix: "Limit this to the period of employment. After it ends, I am free to work anywhere, subject only to my confidentiality obligations.",
      ask: "Can this apply only while I work here, and not after I leave?",
      hi: { t: "छोड़ने के बाद दूसरी जगह काम करने पर रोक", p: "यह शर्त नौकरी छोड़ने के बाद कुछ समय तक आपको किसी प्रतियोगी कंपनी में काम करने से रोकती है। भारत में ऐसी शर्तें आम तौर पर लागू नहीं होतीं।" },
    },
    {
      id: "bond_penalty",
      title: "Heavy penalty or bond if you leave early",
      category: "Money",
      severity: "high",
      re: [
        /\b(?:leaves?|leaving|resign\w*|quit\w*|terminat\w*)\b[^.]{0,120}?\b(?:liable to pay|shall pay|required to pay|must pay|shall reimburse|shall compensate)\b[^.]{0,40}?(?:₹|rs\.?|inr|rupees)\s?[\d,]+/i,
        /\b(?:liable to pay|shall pay|required to pay|must pay|shall reimburse|shall compensate)\b[^.]{0,60}?(?:₹|rs\.?|inr|rupees)\s?[\d,]+[^.]{0,160}?\b(?:leave|leaves|resign\w*|quit\w*|terminat\w*|before (?:the )?(?:completion|end|expiry))/i,
        /\b(?:service|employment|training|surety)\s+bond\b|\bbond amount\b|\bliquidated damages\b|\bpenalty of\b/i,
      ],
      plain: "You would owe the company a fixed sum if you leave before a set date. Many such amounts are far higher than anything the company actually spent on you.",
      law: "Under Section 74 of the Indian Contract Act, 1872, a court awards only reasonable compensation for a breach, up to the stated amount, not the full penalty automatically. Courts have upheld training bonds only where the employer shows real, documented training costs.",
      fix: "If I leave within the first [N] months, I will repay a pro-rata share of documented external training costs, reducing to zero at the end of that period.",
      ask: "What actual costs does this amount cover, and can it reduce month by month?",
      hi: { t: "जल्दी छोड़ने पर भारी जुर्माना या बॉन्ड", p: "तय तारीख से पहले नौकरी छोड़ने पर आपको कंपनी को एक बड़ी रकम देनी होगी। अदालतें आम तौर पर सिर्फ वास्तविक और उचित खर्च ही वसूलने देती हैं।" },
    },
    {
      id: "withhold_docs",
      title: "Company keeps your original certificates",
      category: "Your rights",
      severity: "high",
      re: /\b(?:retain|withhold|hold|keep|deposit|submit|surrender|handover|hand over)\b[^.]{0,60}?\boriginals?\b[^.]{0,40}?\b(?:certificates?|documents?|degrees?|mark ?sheets?|passport|testimonials|educational)/i,
      unless: /\b(?:for verification (?:only )?and (?:will be )?returned|returned (?:immediately|the same day|within \w+ days?)|return(?:ed)? (?:after|upon) verification)\b/i,
      plain: "The company would hold your original degree or mark sheets. This is used to stop people from leaving, since you cannot apply elsewhere without them.",
      law: "No Indian law allows an employer to keep an employee's original educational documents. Several High Courts have ordered their return and called the practice coercive. Photocopies checked against originals are enough for verification.",
      fix: "Originals will be shown for verification on the joining day and returned the same day. The company may keep self-attested copies.",
      ask: "Can you verify the originals and give them back the same day?",
      hi: { t: "कंपनी आपके मूल प्रमाणपत्र अपने पास रखेगी", p: "कंपनी आपकी मूल डिग्री या मार्कशीट अपने पास रखेगी, ताकि आप आसानी से नौकरी न छोड़ सकें। किसी कानून में इसकी अनुमति नहीं है।" },
    },
    {
      id: "withhold_pay",
      title: "Your earned pay can be withheld",
      category: "Money",
      severity: "high",
      re: [
        /\b(?:withhold|forfeit|forfeiture of|not be paid|shall not be (?:entitled|eligible)|no (?:salary|stipend|payment|dues) (?:shall|will) be (?:paid|payable|released))\b[^.]{0,80}?\b(?:salary|stipend|wages|remuneration|dues|full and final|settlement|payment|bonus|incentives?)\b/i,
        /\b(?:salary|stipend|wages|remuneration|dues|full and final settlement)\b[^.]{0,60}?\b(?:shall|will|may) be (?:withheld|forfeited)\b/i,
      ],
      also: [/\b(?:resign\w*|leave|leaving|terminat\w*|notice|exit|separation|abscond\w*|breach|fail\w*|without serving)\b/i],
      plain: "If you leave without meeting some condition, the company says it can keep money you have already earned for work you already did.",
      law: "The Code on Wages, 2019 requires wages for work done to be paid, allows deductions only for listed reasons, and requires final dues to be paid within two working days of an employee leaving. A short notice period may justify a set-off equal to the notice pay, not forfeiture of everything earned.",
      fix: "Pay for work already done will be paid in full. Any shortfall in notice may be adjusted only against the notice-period amount.",
      ask: "If I serve less notice, can the adjustment be limited to the notice pay instead of all dues?",
      hi: { t: "आपकी कमाई हुई तनख्वाह रोकी जा सकती है", p: "कुछ शर्तें पूरी न होने पर कंपनी वह पैसा भी रोक सकती है जो आप काम करके कमा चुके हैं।" },
    },
    {
      id: "deductions",
      title: "Open-ended deductions from your pay",
      category: "Money",
      severity: "medium",
      re: /\b(?:deduct\w*|recover\w*|adjust\w*)\b[^.]{0,60}?\b(?:from|against)\s+(?:the\s+|his\s+|her\s+|their\s+|your\s+|any\s+)?(?:salary|stipend|wages|remuneration|dues|fees)\b/i,
      unless: /\b(?:tax|tds|provident fund|p\.?f\.?|esi|professional tax|statutory)\b/i,
      plain: "The company can cut money from your pay for reasons it decides. Without a clear list and cap, deductions can eat into your income.",
      law: "Under the Code on Wages, 2019, deductions from wages are allowed only for listed reasons (such as taxes, advances, or damage caused by the employee's proven fault) and are capped at 50% of wages in a month.",
      fix: "Deductions will be made only for statutory dues and amounts I have agreed to in writing, and never above the limit set by the Code on Wages.",
      ask: "Can you list exactly what could be deducted, and cap it?",
      hi: { t: "तनख्वाह से मनमानी कटौती", p: "कंपनी अपनी मर्ज़ी से आपकी तनख्वाह से पैसे काट सकती है। साफ़ सूची और सीमा के बिना यह आपकी आय को कम कर सकता है।" },
    },
    {
      id: "fire_no_notice",
      title: "They can end your job anytime, without notice",
      category: "Job security",
      severity: "medium",
      roles: ["employee", "intern"],
      re: /\b(?:company|employer|organi[sz]ation|management|firm)\b[^.]{0,80}?\b(?:terminate|dismiss|discontinue|end|relieve)\b[^.]{0,140}?\b(?:without (?:any )?(?:prior )?(?:notice|reason|cause|assigning any reasons?)|at any time|with immediate effect|forthwith)\b/i,
      unless: /\beither party\b|\bgross misconduct\b.*\bnotice\b/i,
      plain: "The company can end your job or internship immediately, without any notice or reason, so you could lose income with no warning.",
      law: "Employees and interns usually have little statutory notice protection in private offices, which is why notice terms in the contract matter. Termination without notice is generally reserved for proven misconduct under standing orders and model rules.",
      fix: "Either party may end this agreement with [30] days' written notice, or pay in lieu of notice. Immediate termination applies only to proven serious misconduct.",
      ask: "Can notice apply equally to both sides?",
      hi: { t: "बिना नोटिस कभी भी नौकरी खत्म", p: "कंपनी बिना किसी नोटिस या कारण के आपकी नौकरी तुरंत खत्म कर सकती है।" },
    },
    {
      id: "ip_overreach",
      title: "Claims what you create in your own time",
      category: "Your work",
      severity: "high",
      re: /\b(?:intellectual property|inventions?|works?|copyrights?|ideas|developments|creations)\b[^.]{0,220}?\b(?:whether or not (?:during|in the course of|within|related)|outside (?:of )?(?:normal |regular )?(?:working|office|business) hours|during or outside|prior to (?:the date of )?(?:joining|employment|this agreement)|before (?:joining|the start)|personal time|own time|own equipment|personal projects?)/i,
      unless: /\b(?:excluding|excludes|except|other than|does not (?:include|apply to))\b[^.]{0,80}?\b(?:prior|pre-existing|personal|own time|outside)\b/i,
      plain: "The company claims ownership of things you make outside work, or even before you joined, such as side projects, open-source code, art or apps.",
      law: "Section 17 of the Copyright Act, 1957 gives an employer ownership of work made in the course of employment. Anything beyond that must be clearly assigned to them, and you can negotiate to keep personal and pre-existing work.",
      fix: "The company owns work I create in the course of my duties using company resources. Work I create in my own time, without company resources and unrelated to the company's business, and all my pre-existing work, remains mine.",
      ask: "Can we add a carve-out for my personal projects and anything I made before joining?",
      hi: { t: "आपके निजी समय में बनाए काम पर भी दावा", p: "कंपनी उन चीज़ों पर भी मालिकाना हक़ माँग रही है जो आप काम के बाहर या जॉइन करने से पहले बनाते हैं, जैसे साइड प्रोजेक्ट या ऐप।" },
    },
    {
      id: "ip_before_payment",
      title: "Your work belongs to them before you are paid",
      category: "Your work",
      severity: "high",
      roles: ["freelancer"],
      re: /\b(?:assign\w*|transfer\w*|vest\w*|belong\w*|become the (?:exclusive )?property)\b[^.]{0,200}?\b(?:upon creation|immediately upon|regardless of|irrespective of|whether or not)\b[^.]{0,60}?\b(?:payment|paid|invoice)?/i,
      also: [/\b(?:intellectual property|copyright|rights|deliverables|work product)\b/i],
      unless: /\b(?:upon (?:full |receipt of full |complete )?payment|on (?:full )?payment|after (?:full )?payment)\b/i,
      plain: "The client owns your designs or code the moment you create them, even if they never pay you. Ownership is your main leverage when an invoice goes unpaid.",
      law: "Under Section 19 of the Copyright Act, 1957, an assignment must be in writing and should state the rights, duration, territory and payment. Freelancers can make the transfer conditional on full payment.",
      fix: "Ownership of the final deliverables transfers to the client on receipt of full payment. Until then, the client has a limited licence to review them.",
      ask: "Can the rights transfer when the final invoice is paid?",
      hi: { t: "पैसे मिलने से पहले ही काम उनका", p: "क्लाइंट भुगतान करने से पहले ही आपके डिज़ाइन या कोड का मालिक बन जाता है, भले ही वह कभी पैसे न दे।" },
    },
    {
      id: "moral_rights",
      title: "You give up credit for your work",
      category: "Your work",
      severity: "low",
      re: /\bwaive\w*\b[^.]{0,80}?\bmoral rights\b|\bmoral rights\b[^.]{0,80}?\bwaive\w*\b/i,
      plain: "You agree not to be named as the author and not to object if your work is changed or distorted.",
      law: "Section 57 of the Copyright Act, 1957 gives authors the right to claim authorship and object to distortion. These rights exist separately from ownership and are important for your portfolio.",
      fix: "I may show the work in my portfolio after public launch, and I will be credited where credits are customary.",
      ask: "Can I keep portfolio rights and credit?",
      hi: { t: "अपने काम का श्रेय छोड़ना", p: "आप यह मान रहे हैं कि आपका नाम लेखक के रूप में नहीं होगा और काम बदले जाने पर आप आपत्ति नहीं करेंगे।" },
    },
    {
      id: "indemnity",
      title: "Unlimited responsibility for the other side's losses",
      category: "Money",
      severity: "medium",
      severityByRole: { freelancer: "high" },
      re: [
        /\b(?:indemnif\w+|hold harmless)\b[^.]{0,260}?\b(?:any and all|all (?:losses|claims|damages|costs|liabilit\w+)|whatsoever|without (?:any )?limit\w*|of any (?:kind|nature))\b/i,
        /\bunlimited liability\b|\bliability\b[^.]{0,40}?\b(?:shall be |is |will be )?unlimited\b/i,
      ],
      unless: /\b(?:shall not exceed|capped|limited to|maximum aggregate|aggregate liability|each party shall indemnify|mutual(?:ly)?)\b/i,
      plain: "You promise to cover every loss, claim or legal cost the other side faces, with no limit, even ones far larger than what you earn from this contract.",
      law: "Indemnity is governed by Sections 124 and 125 of the Indian Contract Act, 1872. There is no automatic cap, so the only protection is a limit written into the contract.",
      fix: "My total liability under this agreement is limited to the fees paid to me in the previous [3] months, and covers only losses directly caused by my proven negligence.",
      ask: "Can liability be capped at the fees paid, and be mutual?",
      hi: { t: "दूसरे पक्ष के हर नुकसान की असीमित ज़िम्मेदारी", p: "आप दूसरे पक्ष के हर नुकसान, दावे या कानूनी खर्च की भरपाई का वादा कर रहे हैं, बिना किसी सीमा के।" },
    },
    {
      id: "unilateral_change",
      title: "They can change the terms by themselves",
      category: "Your rights",
      severity: "medium",
      re: /\b(?:reserves? the right|may|shall be entitled|is entitled|has the right)\b[^.]{0,30}?\b(?:to\s+)?(?:amend|modify|change|revise|alter|vary)\b[^.]{0,140}?\b(?:at any time|sole (?:and absolute )?discretion|without (?:any )?(?:prior )?notice|from time to time|unilaterally|as it (?:may )?deems? (?:fit|appropriate))\b/i,
      unless: /\b(?:mutual\w*|written agreement of both|signed by both|agreed in writing by both|with (?:your|the employee's|the consultant's) (?:written )?consent)\b/i,
      plain: "The company can rewrite your pay, role or rules later without asking you. What you sign today may not be what applies tomorrow.",
      law: "A contract generally needs both parties' agreement to change (Section 62, Indian Contract Act, 1872). A clause that lets one side change everything can be challenged as unfair, but it is far easier to fix before signing.",
      fix: "Any change to these terms must be agreed in writing by both parties.",
      ask: "Can changes to pay, role or location need my written agreement?",
      hi: { t: "वे अकेले शर्तें बदल सकते हैं", p: "कंपनी बाद में आपसे पूछे बिना आपकी तनख्वाह, भूमिका या नियम बदल सकती है।" },
    },
    {
      id: "arbitrator_one_sided",
      title: "They alone pick the judge in any dispute",
      category: "Disputes",
      severity: "high",
      re: [
        /\b(?:arbitrator|arbitral tribunal)\b[^.]{0,120}?\b(?:appointed|nominated|chosen|selected)\b[^.]{0,20}?\b(?:solely |exclusively |only )?by (?:the )?(?:company|employer|client|managing director|ceo|director|management|founder)\b/i,
        /\b(?:company|employer|client|managing director|ceo)\b[^.]{0,40}?\b(?:shall|will|may) (?:appoint|nominate)\b[^.]{0,30}?\b(?:sole )?arbitrator\b/i,
      ],
      unless: /\b(?:mutually|jointly|both parties|each party)\b/i,
      plain: "If there is a disagreement, the company picks the person who decides it. That person is unlikely to be neutral.",
      law: "The Supreme Court held in Perkins Eastman v. HSCC (2019), and a Constitution Bench confirmed in CORE v. ECI-SPIC-SMO-MCML (2024), that one party cannot unilaterally appoint a sole arbitrator. Section 12(5) of the Arbitration and Conciliation Act, 1996 also bars the company's own staff from acting as arbitrator.",
      fix: "Disputes will be referred to a sole arbitrator appointed by mutual agreement, or failing that, by the court under Section 11 of the Arbitration and Conciliation Act, 1996.",
      ask: "Can the arbitrator be chosen jointly?",
      hi: { t: "विवाद में जज अकेले वही चुनेंगे", p: "किसी असहमति की स्थिति में फ़ैसला करने वाले व्यक्ति को कंपनी ही चुनेगी, जो निष्पक्ष होने की संभावना कम है।" },
    },
    {
      id: "foreign_law",
      title: "Disputes handled under a foreign country's law",
      category: "Disputes",
      severity: "medium",
      re: /\b[Gg]overned by\b[^.]{0,40}?\b[Ll]aws? of\s+(?!(?:the\s+)?(?:[Rr]epublic\s+of\s+)?India\b)(?:the\s+)?(?:[Ss]tate of\s+)?[A-Z][A-Za-z]+/,
      plain: "Any dispute would be decided under another country's law, which is expensive and hard for you to use.",
      law: "Indian parties can choose foreign law in some cases, but for an individual worker it makes enforcing your rights impractical. Indian labour protections may still apply regardless.",
      fix: "This agreement is governed by the laws of India, and courts in [your city] have jurisdiction.",
      ask: "Can we use Indian law and a court in my city?",
      hi: { t: "विदेशी कानून के तहत विवाद", p: "किसी भी विवाद का फ़ैसला दूसरे देश के कानून के तहत होगा, जो आपके लिए महँगा और कठिन है।" },
    },
    {
      id: "pay_on_satisfaction",
      title: "Payment depends on the client's mood",
      category: "Money",
      severity: "high",
      roles: ["freelancer"],
      re: [
        /\b(?:payment|fees?|invoices?|remuneration|compensation)\b[^.]{0,150}?\b(?:sole (?:and absolute )?satisfaction|satisfaction of the client|client'?s? (?:sole )?(?:satisfaction|approval)|upon (?:final )?(?:approval|acceptance) (?:by|of) the client|subject to (?:the )?client'?s? (?:approval|satisfaction|acceptance))/i,
        /\b(?:sole|absolute) (?:and absolute )?satisfaction\b[^.]{0,100}?\b(?:payment|fees?|invoice)\b/i,
      ],
      plain: "The client pays only if they are satisfied, and they decide what satisfied means. That lets them avoid paying for finished work.",
      law: "Payment tied to one party's 'sole satisfaction' is hard to enforce against them. Objective acceptance criteria protect you, and the MSMED Act, 2006 caps payment delay at 45 days for registered micro and small enterprises.",
      fix: "Deliverables are accepted if they meet the written brief. The client has [5] working days to request changes, after which they are deemed accepted and payable.",
      ask: "Can we define acceptance with a checklist and a deemed-acceptance period?",
      hi: { t: "भुगतान क्लाइंट की मर्ज़ी पर", p: "क्लाइंट तभी भुगतान करेगा जब वह संतुष्ट होगा, और संतुष्टि का फ़ैसला भी वही करेगा।" },
    },
    {
      id: "pay_when_paid",
      title: "You get paid only after their customer pays them",
      category: "Money",
      severity: "high",
      roles: ["freelancer"],
      re: /\b(?:upon|after|only when|once|subject to)\b[^.]{0,40}?\b(?:receipt of|receiving|realisation of|realization of)\b[^.]{0,20}?\b(?:payment|funds|monies)\b[^.]{0,40}?\bfrom\b[^.]{0,20}?\b(?:its|the|their)\s+(?:end\s+)?(?:client|customer)s?\b(?:'s\s+(?:end\s+)?(?:customer|client)s?\b)?/i,
      plain: "Your payment waits until the client's own customer pays them. If that never happens, you are never paid.",
      law: "Pay-when-paid terms shift someone else's business risk onto you. The MSMED Act, 2006 requires buyers to pay registered micro and small enterprises within 45 days whatever their own customers do.",
      fix: "Payment is due within [15] days of my invoice, regardless of any payment the client receives from third parties.",
      ask: "Can my payment be independent of your customer's payment?",
      hi: { t: "उनके ग्राहक के भुगतान के बाद ही आपको पैसा", p: "आपका भुगतान तब तक रुका रहेगा जब तक क्लाइंट के ग्राहक उसे भुगतान न कर दें।" },
    },
    {
      id: "unlimited_revisions",
      title: "Unlimited revisions for the same fee",
      category: "Scope",
      severity: "medium",
      roles: ["freelancer"],
      re: /\b(?:unlimited|any number of|as many)\b[^.]{0,20}?\b(?:revisions?|changes|iterations|rounds|modifications|corrections)\b/i,
      plain: "The client can keep asking for changes forever without paying more.",
      law: "No law limits revisions. Your only protection is a number written into the contract.",
      fix: "The fee includes [2] rounds of revisions. Further revisions are billed at ₹[rate] per hour.",
      ask: "Can we include two rounds and bill extra rounds hourly?",
      hi: { t: "एक ही फीस में असीमित बदलाव", p: "क्लाइंट बिना अतिरिक्त भुगतान के बार-बार बदलाव माँग सकता है।" },
    },
    {
      id: "cancel_without_pay",
      title: "They can cancel without paying for work done",
      category: "Money",
      severity: "high",
      roles: ["freelancer"],
      re: /\b(?:client|company)\b[^.]{0,80}?\b(?:terminate|cancel)\w*\b[^.]{0,160}?\b(?:without (?:any )?(?:payment|compensation|liability|fees?|charges?)|no (?:payment|fees?|compensation|amount) (?:shall|will) be (?:due|payable|made)|shall not be liable to pay)\b/i,
      plain: "The client can cancel the project and walk away without paying for the work you have already done.",
      law: "Under Section 70 of the Indian Contract Act, 1872, a person who enjoys the benefit of work done non-gratuitously must compensate for it. A contract term should still spell out a kill fee to avoid a fight.",
      fix: "If the client cancels, they will pay for all work completed up to the cancellation date plus a kill fee of [25]% of the remaining fee.",
      ask: "Can we add a kill fee and payment for work completed so far?",
      hi: { t: "किए गए काम का भुगतान किए बिना रद्द कर सकते हैं", p: "क्लाइंट प्रोजेक्ट रद्द करके आपके किए गए काम का भुगतान किए बिना जा सकता है।" },
    },
    {
      id: "unpaid",
      title: "Unpaid work",
      category: "Money",
      severity: "medium",
      roles: ["intern", "employee"],
      re: /\b(?:unpaid|no stipend|without (?:any )?(?:stipend|remuneration|compensation|salary|pay)|shall not be entitled to any (?:stipend|remuneration|compensation|salary))\b/i,
      plain: "You would work without pay. Unpaid work is sometimes legitimate for short academic internships, but it should come with clear learning and a limited time.",
      law: "Employees must be paid at least the minimum wage under the Code on Wages, 2019. A genuine academic internship may be unpaid, but an 'internship' that is really a job is still covered by wage law.",
      fix: "The intern will receive a stipend of ₹[amount] per month, paid by the [7th] of the following month.",
      ask: "Is there a stipend, or at least reimbursement for travel and internet?",
      hi: { t: "बिना वेतन का काम", p: "आप बिना भुगतान के काम करेंगे। छोटी शैक्षणिक इंटर्नशिप में यह कभी-कभी ठीक होता है, पर इसकी सीमा साफ़ होनी चाहिए।" },
    },
    {
      id: "long_hours",
      title: "Extra hours or weekends without extra pay",
      category: "Work-life",
      severity: "medium",
      roles: ["intern", "employee"],
      re: [
        /\b(?:work|available|render services|report)\b[^.]{0,80}?\b(?:such (?:additional |extra |further )?hours|beyond (?:normal|regular|office|working) hours|weekends|public holidays|holidays|24\s?[x×\/]\s?7|late nights?)\b[^.]{0,100}?\b(?:as (?:may be )?(?:required|necessary|directed)|without (?:any )?(?:additional|extra|overtime|further))/i,
        /\bno (?:overtime|additional (?:pay|compensation|remuneration)|extra (?:pay|compensation))\b/i,
      ],
      plain: "You may be asked to work late, on weekends or on holidays, with no extra pay or time off.",
      law: "For workers covered by labour law, overtime must usually be paid at twice the ordinary rate (Occupational Safety, Health and Working Conditions Code, 2020, and state Shops and Establishments Acts). Managerial staff are often excluded, so the wording matters.",
      fix: "Work beyond [9] hours a day or on weekly offs will be compensated with overtime pay or equal time off.",
      ask: "How are extra hours compensated, with pay or time off?",
      hi: { t: "अतिरिक्त घंटे या छुट्टी के दिन बिना अतिरिक्त वेतन", p: "आपसे देर रात, सप्ताहांत या छुट्टियों में काम करवाया जा सकता है, बिना अतिरिक्त वेतन के।" },
    },
    {
      id: "privacy",
      title: "Broad access to your personal data or devices",
      category: "Privacy",
      severity: "medium",
      re: [
        /\b(?:monitor|access|inspect|review|track|search)\w*\b[^.]{0,80}?\b(?:personal (?:devices?|phones?|laptops?|e-?mails?|social media|accounts?)|social media (?:accounts?|profiles?|activity)|private (?:communications|messages))\b/i,
        /\b(?:consent\w*|agree\w*)\b[^.]{0,80}?\b(?:sharing|share|disclose|transfer)\b[^.]{0,60}?\bpersonal (?:data|information)\b[^.]{0,100}?\b(?:any (?:third part(?:y|ies)|purpose)|for any purpose|as it deems fit|third parties)\b/i,
      ],
      plain: "The company can look into your personal phone, email or social media, or share your personal data with others for any purpose.",
      law: "The Digital Personal Data Protection Act, 2023 requires consent to be free, specific and limited to a stated purpose. A blanket 'any purpose' consent, or access to personal devices, goes beyond that.",
      fix: "The company may monitor only company-issued devices and accounts. My personal data will be used only for employment purposes and shared only with named processors (payroll, insurance) as required by law.",
      ask: "Can monitoring be limited to company devices, and data sharing to named purposes?",
      hi: { t: "आपके निजी डेटा या फ़ोन तक व्यापक पहुँच", p: "कंपनी आपके निजी फ़ोन, ईमेल या सोशल मीडिया को देख सकती है, या आपका निजी डेटा किसी भी उद्देश्य से दूसरों को दे सकती है।" },
    },
    {
      id: "waive_claims",
      title: "You give up your right to complain or sue",
      category: "Your rights",
      severity: "medium",
      re: /\b(?:waives?|relinquish(?:es)?|gives? up|shall not (?:raise|file|bring|initiate))\b[^.]{0,60}?\b(?:all |any )?(?:rights?|claims?|remed(?:y|ies)|legal (?:action|proceedings)|complaints?)\b/i,
      unless: /\b(?:waiver of any breach|no waiver|failure to (?:enforce|exercise)|delay in exercising|shall not (?:constitute|operate as|be deemed) a waiver|moral rights)\b/i,
      plain: "You promise not to raise complaints or take legal action, even if the company treats you unfairly.",
      law: "Under Section 28 of the Indian Contract Act, 1872, an agreement that absolutely stops a person from enforcing their rights through legal proceedings is void. It can still discourage people from acting.",
      fix: "Delete this clause. Nothing in this agreement limits either party's statutory rights or remedies.",
      ask: "Can we remove this, since statutory rights can't be waived anyway?",
      hi: { t: "शिकायत या मुक़दमे का अधिकार छोड़ना", p: "आप वादा कर रहे हैं कि अन्याय होने पर भी आप शिकायत या कानूनी कार्रवाई नहीं करेंगे।" },
    },
    {
      id: "probation_extension",
      title: "Probation can be extended with no limit",
      category: "Job security",
      severity: "low",
      roles: ["employee"],
      re: [
        /\bprobation\w*\b[^.]{0,150}?\b(?:extend\w*|extension)\b[^.]{0,100}?\b(?:sole (?:and absolute )?discretion|as it (?:may )?deems? fit|further period|indefinite\w*|any number of times|from time to time)\b/i,
        /\bextend\w*\b[^.]{0,40}?\bprobation\w*\b[^.]{0,100}?\b(?:sole (?:and absolute )?discretion|as it (?:may )?deems? fit|further period|indefinite\w*|any number of times|from time to time)\b/i,
      ],
      plain: "The company can keep you on probation, with weaker notice and benefits, for as long as it wants.",
      law: "Indian courts treat probation as a limited trial period. An open-ended extension clause keeps you in a weaker position without a clear end date.",
      fix: "Probation may be extended once, by up to [3] months, with written reasons. If not confirmed or extended in writing, I am deemed confirmed.",
      ask: "Can extension be limited to one time, with a deemed-confirmation date?",
      hi: { t: "प्रोबेशन असीमित समय तक बढ़ाया जा सकता है", p: "कंपनी जितना चाहे उतने समय तक आपको प्रोबेशन पर रख सकती है।" },
    },
    {
      id: "perpetual_confidentiality",
      title: "Secrecy obligations that never end",
      category: "Your future",
      severity: "low",
      re: /\b(?:confidential\w*|non-disclosure)\b[^.]{0,250}?\b(?:in perpetuity|perpetual(?:ly)?|indefinitely|forever|without (?:any )?time limit)\b/i,
      plain: "You must keep information secret forever. That is reasonable for trade secrets, but too broad if 'confidential' covers everything you learned.",
      law: "Confidentiality of genuine trade secrets can last indefinitely, but courts will not let it be used as a disguised non-compete that stops you from using your general skills and knowledge.",
      fix: "Confidentiality lasts [2] years after this agreement ends, except for trade secrets, and does not cover my general skills, knowledge and experience.",
      ask: "Can general skills and public information be excluded, with a time limit for the rest?",
      hi: { t: "कभी न ख़त्म होने वाली गोपनीयता", p: "आपको जानकारी हमेशा के लिए गुप्त रखनी होगी। व्यापार रहस्यों के लिए यह ठीक है, पर हर चीज़ के लिए बहुत व्यापक है।" },
    },
    {
      id: "non_solicit",
      title: "Limits on working with clients or colleagues later",
      category: "Your future",
      severity: "low",
      re: /\b(?:not|never)\b[^.]{0,30}?\b(?:solicit|poach|hire|employ|engage|entice|deal with)\b[^.]{0,120}?\b(?:clients?|customers?|employees?|staff|personnel)\b/i,
      plain: "After you leave, you cannot approach the company's clients or colleagues for a period. This is common, but it should be narrow.",
      law: "Indian courts are more willing to uphold a reasonable non-solicitation clause than a non-compete. A ban on dealing with clients who approach you on their own may still fall foul of Section 27.",
      fix: "For [6] months after leaving, I will not actively solicit clients I personally worked with. This does not stop me from working with anyone who contacts me on their own.",
      ask: "Can this be limited to active solicitation of clients I worked with, for six months?",
      hi: { t: "बाद में क्लाइंट या सहकर्मियों के साथ काम पर रोक", p: "नौकरी छोड़ने के बाद कुछ समय तक आप कंपनी के क्लाइंट या सहकर्मियों से संपर्क नहीं कर सकते।" },
    },
    {
      id: "transfer_anywhere",
      title: "Can be moved to any city",
      category: "Work-life",
      severity: "low",
      roles: ["employee", "intern"],
      re: /\b(?:transfer\w*|relocat\w*|posted|depute\w*)\b[^.]{0,80}?\b(?:any (?:of (?:its|the company's) )?(?:locations?|offices?|branch(?:es)?|cit(?:y|ies)|places?|part of (?:india|the world|the country))|anywhere)\b/i,
      plain: "The company can move you to another city, and refusing could be treated as breaking the contract.",
      law: "Transfer clauses are generally enforceable if the job is transferable. You can ask for relocation support and a right to refuse for personal reasons.",
      fix: "Any transfer outside [city] needs my consent, with relocation costs paid by the company.",
      ask: "Can transfers need my consent, with relocation support?",
      hi: { t: "किसी भी शहर में भेजा जा सकता है", p: "कंपनी आपको दूसरे शहर में भेज सकती है, और मना करने को अनुबंध तोड़ना माना जा सकता है।" },
    },
    {
      id: "auto_renewal",
      title: "Renews automatically",
      category: "Scope",
      severity: "low",
      roles: ["freelancer"],
      re: /\bautomatically (?:renew\w*|extend\w*)\b|\bauto-?renew\w*\b/i,
      plain: "The contract continues on the same terms unless someone cancels, which can lock in an old rate.",
      law: "Automatic renewal is legal, but it can keep you tied to outdated pricing.",
      fix: "This agreement ends on [date]. Any renewal will be agreed in writing, with updated fees.",
      ask: "Can renewal be by written agreement so we can revisit rates?",
      hi: { t: "अपने आप नवीनीकरण", p: "जब तक कोई रद्द न करे, अनुबंध उसी शर्तों पर चलता रहता है।" },
    },
  ];

  // ------------------------------------------------------------------------
  // Rules that look at the whole document (numbers, asymmetry, missing items)
  // ------------------------------------------------------------------------
  const DOC_RULES = [
    {
      id: "notice_asymmetry",
      title: "You must give much longer notice than they do",
      category: "Job security",
      severity: "high",
      roles: ["employee", "intern"],
      detect(doc) {
        const you = noticeFor(doc, /\b(?:employee|intern|trainee|you|associate)\b[^.]{0,80}?\b(?:resign\w*|leave|terminat\w*|quit)\b|\bresign\w*\b/i);
        const them = noticeFor(doc, /\b(?:company|employer|organi[sz]ation|management|firm)\b[^.]{0,80}?\b(?:terminat\w*|dismiss\w*|relieve)\b/i);
        if (!you || you.days < 30) return null;
        if (them && them.days * 2 > you.days) return null;
        const theirs = them ? them.text : "none (they can end it at any time)";
        return { clause: you.clause, index: you.index, length: you.length, note: `Your notice: ${you.text}. Theirs: ${theirs}.` };
      },
      plain: "You have to give a long notice period to leave, but the company can let you go with much less notice, or none.",
      law: "Notice periods are set by contract, and courts look unfavourably on terms that bind only one side. Equal notice is the norm in fair contracts.",
      fix: "Either party may end this agreement with the same [30] days' written notice, or pay in lieu of notice.",
      ask: "Can notice be the same for both sides?",
      hi: { t: "आपको उनसे बहुत लंबा नोटिस देना होगा", p: "आपको छोड़ने के लिए लंबा नोटिस देना होगा, पर कंपनी आपको बहुत कम या बिना नोटिस के निकाल सकती है।" },
    },
    {
      id: "long_notice",
      title: "Very long notice period to resign",
      category: "Your future",
      severity: "medium",
      roles: ["employee", "intern"],
      detect(doc) {
        const you = noticeFor(doc, /\b(?:employee|intern|trainee|you|associate)\b[^.]{0,80}?\b(?:resign\w*|leave|terminat\w*|quit)\b|\bresign\w*\b/i);
        if (!you || you.days < 90) return null;
        return { clause: you.clause, index: you.index, length: you.length, note: `Notice required from you: ${you.text}.` };
      },
      plain: "You must stay for a long time after resigning. Many new employers will not wait three months, so this can cost you job offers.",
      law: "Long notice periods are legal, but you can ask for the option to buy out notice or for early release at the company's discretion.",
      fix: "Notice period is [30] days. I may buy out any unserved notice by paying the basic salary for that period.",
      ask: "Can I buy out the notice period if I get another offer?",
      hi: { t: "इस्तीफ़े के लिए बहुत लंबा नोटिस", p: "इस्तीफ़ा देने के बाद आपको लंबे समय तक रुकना होगा, जिससे नई नौकरी के मौके छूट सकते हैं।" },
    },
    {
      id: "slow_payment",
      title: "Payment takes more than 45 days",
      category: "Money",
      severity: "medium",
      roles: ["freelancer"],
      detect(doc) {
        for (const c of doc.clauses) {
          if (!/\b(?:invoice|payment|pay|fees?|remuneration)\b/i.test(c.text)) continue;
          const net = /\bnet[\s-]?(\d{2,3})\b/i.exec(c.text);
          if (net && +net[1] > 45) return { clause: c, index: c.start + net.index, length: net[0].length, note: `Payment term: ${net[0]}.` };
          const w = /\bwithin\s+/gi;
          let m;
          while ((m = w.exec(c.text))) {
            const d = durations(c.text.slice(m.index, m.index + 40))[0];
            if (d && d.days > 45) {
              return { clause: c, index: c.start + m.index, length: m[0].length + d.index + d.text.length, note: `Payment term: within ${d.text}.` };
            }
          }
        }
        return null;
      },
      plain: "You wait more than 45 days to be paid, which strains your cash flow.",
      law: "Section 15 of the MSMED Act, 2006 caps payment to registered micro and small enterprises (including freelancers with an Udyam registration) at 45 days, with compound interest on late payment. You can complain online via MSME Samadhaan.",
      fix: "Invoices are payable within [15] days. Late payments carry interest as provided under the MSMED Act, 2006.",
      ask: "Can payment be within 15 or 30 days of invoice?",
      hi: { t: "भुगतान में 45 दिन से ज़्यादा", p: "आपको भुगतान के लिए 45 दिन से ज़्यादा इंतज़ार करना होगा।" },
    },
    {
      id: "no_pay_amount",
      title: "Pay amount is not written down",
      category: "Money",
      severity: "medium",
      roles: ["employee", "intern"],
      missing: true,
      detect(doc) {
        const t = doc.text;
        if (/(?:₹|\brs\.?\s?\d|\binr\b|\brupees\b|\$\s?\d|\busd\b|\bctc of\b|\bsalary of\b|\bstipend of\b|\d[\d,]*\s*(?:\/-|per month|per annum|p\.a\.|lpa))/i.test(t)) return null;
        if (/\bunpaid\b|\bno stipend\b/i.test(t)) return null;
        return { note: "No salary or stipend figure found." };
      },
      plain: "The contract never says how much you will be paid. Verbal promises are hard to prove later.",
      law: "Under the Code on Wages, 2019, employers must give workers a written record of wages. Your contract is the easiest place to get it.",
      fix: "Add: 'Your monthly salary/stipend is ₹[amount], paid by the [7th] of each following month.'",
      ask: "Can you put the exact monthly amount and pay date in writing?",
      hi: { t: "वेतन की रकम लिखी नहीं है", p: "अनुबंध में यह लिखा ही नहीं है कि आपको कितना भुगतान मिलेगा।" },
    },
    {
      id: "no_payment_deadline",
      title: "No date by which you must be paid",
      category: "Money",
      severity: "medium",
      roles: ["freelancer"],
      missing: true,
      detect(doc) {
        const t = doc.text;
        if (!/\b(?:invoice|payment|fees?)\b/i.test(t)) return null;
        if (/\bwithin\s+\S+\s*(?:\(\s*\d+\s*\)\s*)?(?:calendar\s+|working\s+|business\s+)?days?\b|\bnet[\s-]?\d{2}\b|\bon or before\b/i.test(t)) return null;
        return { note: "No payment deadline found." };
      },
      plain: "There is no deadline for paying you, so the client can delay indefinitely.",
      law: "Where no period is agreed, the MSMED Act, 2006 sets 15 days from acceptance for registered micro and small enterprises. Writing a deadline in avoids arguments.",
      fix: "Add: 'Invoices are payable within 15 days of receipt.'",
      ask: "Can we add a payment deadline?",
      hi: { t: "भुगतान की कोई समय-सीमा नहीं", p: "आपको भुगतान करने की कोई समय-सीमा नहीं है, इसलिए क्लाइंट अनिश्चित समय तक टाल सकता है।" },
    },
    {
      id: "no_exit",
      title: "No way to exit is described",
      category: "Job security",
      severity: "low",
      missing: true,
      detect(doc) {
        if (/\bterminat\w*|\bresign\w*|\bnotice period\b|\bcancel\w*/i.test(doc.text)) return null;
        return { note: "No termination or notice terms found." };
      },
      plain: "The contract does not say how either side can end it, which leaves you unsure of your rights.",
      law: "Without a written exit clause, disputes about notice fall back on general contract law, which is slow and uncertain.",
      fix: "Add: 'Either party may end this agreement with [30] days' written notice.'",
      ask: "How can either side end this agreement?",
      hi: { t: "बाहर निकलने का तरीका नहीं लिखा", p: "अनुबंध में यह नहीं लिखा कि कोई भी पक्ष इसे कैसे ख़त्म कर सकता है।" },
    },
  ];

  const POSITIVES = [
    { id: "mutual_notice", text: "Notice applies equally to both sides", hi: "नोटिस दोनों पक्षों पर बराबर लागू", re: /\beither party\b[^.]{0,100}?\bterminat\w*\b[^.]{0,80}?\bnotice\b/i },
    { id: "liability_cap", text: "Liability is capped", hi: "ज़िम्मेदारी की सीमा तय है", re: /\b(?:aggregate |total )?liability\b[^.]{0,80}?\b(?:shall not exceed|limited to|capped at)\b/i },
    { id: "ip_carveout", text: "Your prior or personal work is excluded from IP transfer", hi: "आपका पुराना या निजी काम सुरक्षित है", re: /\b(?:excluding|except|other than|does not (?:include|apply to))\b[^.]{0,80}?\b(?:pre-existing|prior|background|personal)\b/i },
    { id: "leave", text: "Paid leave is written down", hi: "सवेतन छुट्टी लिखी है", re: /\b(?:paid leave|earned leave|annual leave|sick leave|casual leave|leaves? per (?:year|annum|month))\b/i },
    { id: "certificate", text: "You get a certificate or experience letter", hi: "प्रमाणपत्र या अनुभव पत्र मिलेगा", re: /\b(?:certificate|letter of recommendation|experience letter|relieving letter)\b[^.]{0,80}?\b(?:upon|on|after|at the end of)\b/i },
    { id: "reimburse", text: "Work expenses are reimbursed", hi: "काम के खर्च की भरपाई होगी", re: /\breimburs\w*\b[^.]{0,60}?\b(?:expenses|travel|costs|internet|equipment)\b/i },
    { id: "neutral_arbitrator", text: "Arbitrator is chosen jointly", hi: "मध्यस्थ मिलकर चुना जाएगा", re: /\b(?:mutually (?:agreed|appointed|chosen)|jointly appointed|appointed by (?:mutual|both))\b[^.]{0,40}?\barbitrat\w*|\barbitrat\w*\b[^.]{0,60}?\b(?:mutually|jointly)\b/i },
    { id: "pay_on_time", text: "Pay date is fixed", hi: "भुगतान की तारीख तय है", re: /\b(?:paid|payable|credited|disbursed)\b[^.]{0,40}?\b(?:by|on or before|before) the \d{1,2}(?:st|nd|rd|th)?\b|\bwithin (?:7|10|14|15|seven|ten|fifteen|thirty|30)\b[^.]{0,12}?\bdays\b[^.]{0,40}?\binvoice/i },
  ];

  // ------------------------------------------------------------------------
  // Clause splitting
  // ------------------------------------------------------------------------
  const HEADING_RE = /^\s*(?:(?:clause|section|article)\s+\d+|\d{1,2}(?:\.\d{1,2})*[.)]?\s+\S|\([a-z0-9ivx]{1,4}\)\s+\S|[a-h][.)]\s+\S|[A-Z][A-Z &/,'-]{3,60}:?\s*$)/i;

  function splitClauses(text) {
    const clauses = [];
    const lines = text.split("\n");
    let pos = 0, cur = null, prevBlank = true;
    const push = () => { if (cur && cur.text.trim()) clauses.push(cur); cur = null; };
    for (const line of lines) {
      const blank = !line.trim();
      if (blank) { prevBlank = true; pos += line.length + 1; continue; }
      if (!cur || prevBlank || HEADING_RE.test(line)) {
        push();
        cur = { start: pos, text: line };
      } else {
        cur.text += "\n" + line;
      }
      prevBlank = false;
      pos += line.length + 1;
    }
    push();
    // Break very long clauses (e.g. text pasted as one paragraph) into sentence groups
    const out = [];
    for (const c of clauses) {
      if (c.text.length <= 900) { out.push(c); continue; }
      const re = /[^.!?]+(?:[.!?]+|$)/g;
      let m, buf = "", bufStart = c.start;
      while ((m = re.exec(c.text))) {
        if (!buf) bufStart = c.start + m.index;
        buf += m[0];
        if (buf.length > 350) { out.push({ start: bufStart, text: buf }); buf = ""; }
      }
      if (buf.trim()) out.push({ start: bufStart, text: buf });
    }
    return out.map((c, i) => ({ ...c, id: i, end: c.start + c.text.length }));
  }

  function noticeFor(doc, whoRe) {
    for (const c of doc.clauses) {
      if (!/\bnotice\b/i.test(c.text)) continue;
      // Look sentence by sentence so each party's notice is read separately
      const sre = /[^.;]+[.;]?/g;
      let s;
      while ((s = sre.exec(c.text))) {
        const sent = s[0];
        if (!whoRe.test(sent) || !/\bnotice\b/i.test(sent)) continue;
        if (/\bwithout (?:any )?(?:prior )?notice\b|\bat any time\b|\bwith immediate effect\b|\bforthwith\b/i.test(sent)) {
          return { days: 0, text: "no notice", clause: c, index: c.start + s.index, length: sent.length };
        }
        const d = durations(sent)[0];
        if (d) return { days: d.days, text: d.text.trim(), clause: c, index: c.start + s.index + d.index, length: d.text.length };
      }
    }
    return null;
  }

  // ------------------------------------------------------------------------
  // Contract type detection and key terms
  // ------------------------------------------------------------------------
  function detectRole(text) {
    const t = text.toLowerCase();
    const count = (re) => (t.match(re) || []).length;
    const free = count(/\b(?:freelanc\w*|consultant|contractor|independent contractor|service provider|deliverables?|statement of work|invoice)\b/g);
    const intern = count(/\b(?:intern|internship|stipend|trainee)\b/g);
    const emp = count(/\b(?:employee|employment|salary|ctc|probation|appointment)\b/g);
    if (free >= intern && free >= emp && free > 0) return "freelancer";
    if (intern >= emp && intern > 0) return "intern";
    return "employee";
  }

  function keyTerms(doc) {
    const t = doc.text;
    const terms = [];
    const pay = /(?:₹|\brs\.?|\binr)\s?[\d,]+(?:\.\d+)?(?:\s?\/-)?(?:\s*\([^)]{0,60}\))?(?:[^.\n]{0,24}?\b(?:per (?:month|annum|year|hour|day)|monthly|p\.?a\.?|lpa))?/i.exec(t);
    if (pay) terms.push({ k: "Pay", v: pay[0].replace(/\s+/g, " ").trim() });
    const term = /\b(?:period|term|duration|tenure)\s+of\s+(?:this\s+\w+\s+)?(?:shall be\s+)?([\w-]+\s*(?:\(\s*\d+\s*\)\s*)?(?:days?|weeks?|months?|years?))/i.exec(t);
    if (term) terms.push({ k: "Length", v: term[1] });
    const you = noticeFor(doc, /\b(?:employee|intern|trainee|you|associate|consultant|contractor|freelancer)\b[^.]{0,80}?\b(?:resign\w*|leave|terminat\w*|quit)\b|\bresign\w*\b/i);
    if (you) terms.push({ k: "Your notice", v: you.text });
    const them = noticeFor(doc, /\b(?:company|employer|organi[sz]ation|management|firm|client)\b[^.]{0,80}?\b(?:terminat\w*|dismiss\w*|relieve|cancel\w*)\b/i);
    if (them) terms.push({ k: "Their notice", v: them.text });
    const law = /\bgoverned by\b[^.]{0,40}?\blaws? of\s+(?:the\s+)?((?:republic of |state of )?[A-Z][A-Za-z]+(?: [A-Z][a-z]+)?)/.exec(t);
    if (law) terms.push({ k: "Law", v: law[1] });
    const court = /\bcourts?\s+(?:at|of|in)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/.exec(t);
    if (court) terms.push({ k: "Courts", v: court[1] });
    return terms;
  }

  // ------------------------------------------------------------------------
  // Main analysis
  // ------------------------------------------------------------------------
  function asArray(x) { return x ? (Array.isArray(x) ? x : [x]) : []; }
  function appliesTo(rule, role) { return !rule.roles || rule.roles.includes(role); }
  function sevFor(rule, role) { return (rule.severityByRole && rule.severityByRole[role]) || rule.severity; }

  function analyze(text, opts = {}) {
    text = String(text || "").replace(/\r\n?/g, "\n");
    const role = opts.role && ROLES.includes(opts.role) ? opts.role : detectRole(text);
    const clauses = splitClauses(text);
    const doc = { text, clauses, role };
    const flags = [];
    const byId = new Map();

    const addHit = (rule, hit) => {
      let f = byId.get(rule.id);
      if (!f) {
        f = {
          id: rule.id, title: rule.title, category: rule.category, severity: sevFor(rule, role),
          plain: rule.plain, law: rule.law, fix: rule.fix, ask: rule.ask, hi: rule.hi,
          missing: !!rule.missing, hits: [],
        };
        byId.set(rule.id, f);
        flags.push(f);
      }
      f.hits.push(hit);
    };

    for (const rule of RULES) {
      if (!appliesTo(rule, role)) continue;
      for (const c of clauses) {
        if (rule.unless && !rule.unlessNear && rule.unless.test(c.text)) continue;
        if (asArray(rule.also).some((re) => !re.test(c.text))) continue;
        // Prefer highlighting the clause body over a short heading line like "7. Non-Compete"
        const nl = c.text.indexOf("\n");
        const hasHeading = nl > 0 && nl < 60 && !/[.;:,]\s*$/.test(c.text.slice(0, nl));
        const scopes = hasHeading ? [nl + 1, 0] : [0];
        let m = null, off = 0;
        outer: for (const o of scopes) {
          for (const re of asArray(rule.re)) {
            m = re.exec(c.text.slice(o));
            if (m) { off = o; break outer; }
          }
        }
        if (!m) continue;
        if (rule.unlessNear && rule.unless) {
          // Check only the sentence the match sits in
          const at = off + m.index;
          const from = Math.max(c.text.lastIndexOf(".", at - 1), c.text.lastIndexOf(";", at - 1)) + 1;
          let to = c.text.slice(at + m[0].length).search(/[.;]/);
          to = to < 0 ? c.text.length : at + m[0].length + to;
          if (rule.unless.test(c.text.slice(from, to))) continue;
        }
        const start = c.start + off + m.index;
        addHit(rule, { clauseId: c.id, start, end: start + m[0].length, match: m[0], clause: c.text.trim() });
      }
    }

    for (const rule of DOC_RULES) {
      if (!appliesTo(rule, role)) continue;
      const r = rule.detect(doc);
      if (!r) continue;
      const hit = { note: r.note };
      if (r.clause) Object.assign(hit, { clauseId: r.clause.id, start: r.index, end: r.index + r.length, match: text.slice(r.index, r.index + r.length), clause: r.clause.text.trim() });
      addHit(rule, hit);
    }

    // If the one-sided notice rule fired, the generic "fire without notice" flag is redundant
    if (byId.has("notice_asymmetry") && byId.has("fire_no_notice")) {
      const f = byId.get("fire_no_notice");
      flags.splice(flags.indexOf(f), 1);
      byId.delete("fire_no_notice");
    }

    const positives = POSITIVES.filter((p) => p.re.test(text)).map(({ id, text: t, hi }) => ({ id, text: t, hi }));

    const order = { high: 0, medium: 1, low: 2 };
    flags.sort((a, b) => order[a.severity] - order[b.severity] || (a.hits[0].start ?? 1e9) - (b.hits[0].start ?? 1e9));

    // Penalties add up, but the score decays smoothly instead of hitting zero,
    // so a terrible contract and a merely bad one still look different.
    let penalty = 0;
    for (const f of flags) penalty += SEV_WEIGHT[f.severity] + Math.min(f.hits.length - 1, 2) * 2;
    let score = 100 * Math.exp(-penalty / 110) + Math.min(positives.length * 2, 8);
    score = Math.max(3, Math.min(100, Math.round(score)));

    const counts = { high: 0, medium: 0, low: 0 };
    flags.forEach((f) => counts[f.severity]++);

    let verdict;
    if (counts.high >= 3 || score < 45) verdict = { level: "stop", label: "Don't sign this as it is", hi: "इसे ऐसे ही साइन न करें", hiText: "कई शर्तें आपको गंभीर नुकसान पहुँचा सकती हैं। पहले लिखित में बदलाव माँगें, और मना करने पर मुफ़्त कानूनी सलाह लें।", text: "Several clauses could seriously hurt you. Ask for changes in writing first, and get free legal advice if they refuse." };
    else if (counts.high >= 1 || score < 75) verdict = { level: "negotiate", label: "Negotiate before signing", hi: "साइन करने से पहले बात करें", hiText: "ज़्यादातर ठीक है, पर कुछ शर्तों पर आपत्ति करना ज़रूरी है। नीचे दिया ईमेल विनम्रता से बदलाव माँगता है।", text: "Mostly workable, but a few clauses are worth pushing back on. The email below asks for the fixes politely." };
    else verdict = { level: "ok", label: "Looks broadly fair", hi: "मोटे तौर पर उचित", hiText: "कोई बड़ा ख़तरा नहीं मिला। फिर भी कम प्राथमिकता वाले बिंदु पढ़ें और साइन की हुई कॉपी रखें।", text: "No major red flags found. Still read the low-priority items and keep a signed copy." };

    // Keep the number consistent with the verdict, and treat a fee demand as a likely scam
    if (verdict.level === "stop") score = Math.min(score, 44);
    else if (verdict.level === "negotiate") score = Math.min(score, 74);
    if (byId.has("fee_from_worker")) {
      score = Math.min(score, 15);
      verdict = { level: "stop", label: "This looks like a job scam", hi: "यह नौकरी धोखाधड़ी लगती है", hiText: "असली नियोक्ता नौकरी देने के लिए पैसे नहीं माँगते। कुछ भी भुगतान न करें और 1930 पर शिकायत करें।", text: "Real employers don't charge you to get a job. Don't pay anything. Verify the company and report it on 1930 or cybercrime.gov.in." };
    }

    const wordCount = (text.match(/\S+/g) || []).length;
    return { role, score, verdict, counts, flags, positives, keyTerms: keyTerms(doc), clauses: clauses.length, words: wordCount, readMinutes: Math.max(1, Math.round(wordCount / 200)) };
  }

  // ------------------------------------------------------------------------
  // Negotiation email
  // ------------------------------------------------------------------------
  const ROLE_NOUN = { employee: "offer", intern: "internship offer", freelancer: "agreement" };
  function negotiationEmail(result, chosenIds, opts = {}) {
    const name = opts.name || "[Your name]";
    const who = opts.recipient || "[Name]";
    const chosen = result.flags.filter((f) => chosenIds.includes(f.id));
    if (!chosen.length) return "Select at least one flag to include in the email.";
    const noun = ROLE_NOUN[result.role] || "offer";
    const lines = [];
    lines.push(`Subject: A few questions on the ${noun} before I sign`);
    lines.push("");
    lines.push(`Dear ${who},`);
    lines.push("");
    lines.push(`Thank you for the ${noun}. I'm excited to get started and want to make sure we're aligned on a few points before I sign. Could we update the following?`);
    lines.push("");
    chosen.forEach((f, i) => {
      const quote = f.hits[0] && f.hits[0].match ? ` (the clause that says "${trimQuote(f.hits[0].match)}")` : "";
      lines.push(`${i + 1}. ${f.title}${quote}`);
      lines.push(`   Suggested wording: ${f.fix}`);
      lines.push("");
    });
    lines.push("I'm happy to discuss any of these on a quick call. Please share the revised draft when convenient.");
    lines.push("");
    lines.push("Best regards,");
    lines.push(name);
    return lines.join("\n");
  }
  function trimQuote(s) {
    s = s.replace(/\s+/g, " ").trim();
    return s.length > 90 ? s.slice(0, 87).replace(/\s\S*$/, "") + "…" : s;
  }

  function textReport(result, lang) {
    const L = [];
    L.push(`FairSign report: ${result.score}/100, ${result.verdict.label}`);
    L.push(`Contract type: ${result.role}. ${result.counts.high} high, ${result.counts.medium} medium, ${result.counts.low} low priority flags.`);
    if (result.keyTerms.length) L.push("Key terms: " + result.keyTerms.map((t) => `${t.k}: ${t.v}`).join("; "));
    L.push("");
    result.flags.forEach((f, i) => {
      L.push(`${i + 1}. [${f.severity.toUpperCase()}] ${lang === "hi" && f.hi ? f.hi.t : f.title}`);
      if (f.hits[0] && f.hits[0].match) L.push(`   Clause: "${trimQuote(f.hits[0].match)}"`);
      L.push(`   What it means: ${lang === "hi" && f.hi ? f.hi.p : f.plain}`);
      L.push(`   The law: ${f.law}`);
      L.push(`   Ask for: ${f.fix}`);
      L.push("");
    });
    if (result.positives.length) L.push("Looks fair: " + result.positives.map((p) => p.text).join("; "));
    L.push("");
    L.push("FairSign flags clauses to discuss. It is not legal advice. Free legal aid: NALSA helpline 15100.");
    return L.join("\n");
  }

  const api = { analyze, negotiationEmail, textReport, detectRole, splitClauses, durations, RULES, DOC_RULES, POSITIVES, VERSION: "1.0.0" };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FairSign = api;
})(typeof self !== "undefined" ? self : this);

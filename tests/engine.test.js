// Run with: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../engine.js");
const SAMPLES = require("../samples.js");
const ids = (r) => r.flags.map((f) => f.id);
const sample = (id) => SAMPLES.find((s) => s.id === id).text;

test("internship sample: catches the classic traps", () => {
  const r = E.analyze(sample("internship"));
  assert.equal(r.role, "intern");
  for (const id of ["withhold_docs", "bond_penalty", "non_compete", "ip_overreach", "arbitrator_one_sided", "notice_asymmetry", "long_hours", "withhold_pay"]) {
    assert.ok(ids(r).includes(id), `missing ${id}`);
  }
  assert.equal(r.verdict.level, "stop");
  assert.ok(r.score < 45);
});

test("freelance sample: payment and IP traps", () => {
  const r = E.analyze(sample("freelance"));
  assert.equal(r.role, "freelancer");
  for (const id of ["pay_on_satisfaction", "pay_when_paid", "ip_before_payment", "cancel_without_pay", "slow_payment", "unlimited_revisions", "foreign_law", "indemnity"]) {
    assert.ok(ids(r).includes(id), `missing ${id}`);
  }
  assert.equal(r.flags.find((f) => f.id === "indemnity").severity, "high", "indemnity is high for freelancers");
});

test("employment sample: mixed contract lands in the middle", () => {
  const r = E.analyze(sample("employment"));
  assert.equal(r.role, "employee");
  assert.ok(ids(r).includes("notice_asymmetry"));
  assert.ok(ids(r).includes("privacy"));
  assert.ok(!ids(r).includes("ip_overreach"), "IP clause has a carve-out");
  assert.ok(!ids(r).includes("arbitrator_one_sided"), "arbitrator is mutual");
  assert.equal(r.verdict.level, "negotiate");
  assert.ok(r.positives.some((p) => p.id === "ip_carveout"));
});

test("a fair contract is not flagged", () => {
  const r = E.analyze("Either party may terminate this agreement with thirty (30) days written notice. Your salary of Rs 50,000 per month is paid by the 5th. You get 20 days of paid leave per year. The company owns work made in the course of employment.");
  assert.deepEqual(ids(r), []);
  assert.equal(r.verdict.level, "ok");
});

test("text pasted as one paragraph still works", () => {
  const r = E.analyze(sample("internship").replace(/\n+/g, " "));
  assert.ok(ids(r).includes("non_compete"));
  assert.ok(ids(r).includes("withhold_docs"));
});

test("documents returned after verification are not flagged", () => {
  const r = E.analyze("You shall submit original certificates for verification and they will be returned after verification on the same day. Salary Rs 30,000 per month. Either party may terminate with 30 days notice.", { role: "employee" });
  assert.ok(!ids(r).includes("withhold_docs"));
});

test("boilerplate no-waiver clause is not treated as waiving rights", () => {
  const r = E.analyze("Failure to enforce any provision shall not constitute a waiver of any rights. Salary Rs 30,000 per month. Either party may terminate with 30 days notice.", { role: "employee" });
  assert.ok(!ids(r).includes("waive_claims"));
});

test("job-scam fee is flagged", () => {
  const r = E.analyze("The candidate must pay a registration fee of Rs 2,500 before joining. Salary Rs 25,000 per month.", { role: "employee" });
  assert.ok(ids(r).includes("fee_from_worker"));
});

test("scam fee still flagged when the paragraph also mentions termination", () => {
  const r = E.analyze("The candidate must pay a registration fee of Rs 2,500 before joining. Salary Rs 25,000 per month. Either party may terminate with thirty days notice.", { role: "employee" });
  assert.ok(ids(r).includes("fee_from_worker"));
  assert.equal(r.verdict.label, "This looks like a job scam");
  assert.ok(r.score <= 15);
});

test("bond repayment is not mistaken for a scam fee", () => {
  const r = E.analyze("If the intern leaves before completion, the intern must pay a fee of Rs 50,000 as damages. Stipend Rs 8,000 per month.", { role: "intern" });
  assert.ok(!ids(r).includes("fee_from_worker"));
});

test("durations parse words and digits", () => {
  assert.equal(E.durations("ninety (90) days")[0].days, 90);
  assert.equal(E.durations("3 months")[0].days, 90);
  assert.equal(E.durations("two years")[0].days, 730);
});

test("highlights point at the real text", () => {
  const text = sample("freelance");
  const r = E.analyze(text);
  for (const f of r.flags) for (const h of f.hits) if (h.match) assert.equal(text.slice(h.start, h.end), h.match);
});

test("negotiation email includes chosen fixes", () => {
  const r = E.analyze(sample("internship"));
  const mail = E.negotiationEmail(r, ["non_compete", "withhold_docs"], { name: "Asha" });
  assert.match(mail, /Subject:/);
  assert.match(mail, /Suggested wording/);
  assert.match(mail, /Asha$/);
});

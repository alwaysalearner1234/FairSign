/* Sample contracts for the demo. All companies and people are fictional. */
(function (root) {
  "use strict";
  const SAMPLES = [
    {
      id: "internship",
      label: "Internship offer",
      role: "intern",
      blurb: "Startup internship, 6 months",
      text: `INTERNSHIP OFFER LETTER

Brightlane Labs Private Limited ("the Company") is pleased to offer you an internship as a Product Design Intern on the following terms.

1. Duration
The internship shall be for a period of six (6) months starting 1 November 2026.

2. Stipend
You will receive a stipend of ₹8,000 per month. The stipend shall be forfeited and not be paid if the intern leaves the internship without serving the full notice period.

3. Working Hours
Office hours are 10 am to 7 pm, Monday to Saturday. The intern shall be available to work on weekends, public holidays and such additional hours as may be required by the Company, without any additional compensation.

4. Documents
At the time of joining, the intern shall submit original educational certificates and mark sheets, which will be retained by the Company until the completion of the internship.

5. Training Bond
The Company invests heavily in training. If the intern leaves before completion of the internship, the intern shall be liable to pay ₹50,000 to the Company as liquidated damages.

6. Intellectual Property
All ideas, designs, inventions and works created by the intern, whether or not during working hours and whether or not using Company resources, shall be the sole and exclusive property of the Company.

7. Non-Compete
For a period of two (2) years after the end of the internship, the intern shall not join or provide services to any competitor or any company engaged in a similar business.

8. Termination
The intern may resign by giving thirty (30) days' written notice. The Company may terminate the internship at any time without notice and without assigning any reason.

9. Changes
The Company reserves the right to modify these terms at any time at its sole discretion.

10. Certificate
The intern will receive an internship certificate upon successful completion of the internship.

11. Disputes
Any dispute shall be referred to a sole arbitrator appointed by the Managing Director of the Company. Courts at Bengaluru shall have exclusive jurisdiction.

Please sign and return a copy of this letter to confirm your acceptance.`,
    },
    {
      id: "freelance",
      label: "Freelance design contract",
      role: "freelancer",
      blurb: "Brand identity project, ₹60,000",
      text: `FREELANCE SERVICES AGREEMENT

This Agreement is between Northwind Retail Private Limited ("the Client") and the undersigned designer ("the Consultant").

1. Services
The Consultant will design a complete brand identity, including logo, colour system and packaging templates ("the Deliverables"). The Consultant shall provide unlimited revisions until the Client is satisfied.

2. Fees
The total fee is ₹60,000. Payment shall be released within ninety (90) days after final approval of the Deliverables, subject to the Client's sole satisfaction.

3. Customer Payments
Where the Deliverables are used for a Client project, payment to the Consultant shall be made only after receipt of payment from the Client's customer.

4. Ownership
All rights, title and intellectual property in the Deliverables shall vest in the Client immediately upon creation, regardless of whether payment has been made. The Consultant waives all moral rights in the Deliverables.

5. Indemnity
The Consultant shall indemnify and hold harmless the Client against any and all losses, claims and damages whatsoever arising out of the Services.

6. Termination
The Client may terminate this Agreement at any time, and no payment shall be due to the Consultant for work in progress.

7. Confidentiality
The Consultant shall keep all information relating to the Client confidential in perpetuity.

8. Non-Solicitation
For twelve (12) months after this Agreement ends, the Consultant shall not deal with any clients of the Client.

9. Renewal
This Agreement shall automatically renew for successive periods of six months.

10. Governing Law
This Agreement is governed by the laws of Singapore.`,
    },
    {
      id: "employment",
      label: "Job offer (IT company)",
      role: "employee",
      blurb: "Software engineer, ₹9.6 LPA",
      text: `LETTER OF APPOINTMENT

Kestrel Software Services Private Limited ("the Company") is pleased to appoint you as Software Engineer on the terms below.

1. Compensation
Your annual cost to company (CTC) will be ₹9,60,000 per annum, paid monthly on or before the 7th of each month.

2. Probation
You will be on probation for six (6) months. The Company may extend the probation period for such further period as it deems fit.

3. Leave
You are entitled to 18 days of paid leave per year, plus public holidays as per the Company calendar.

4. Location
Your initial place of work is Pune. You may be transferred to any of the Company's offices or client locations in India.

5. Intellectual Property
All work created by you in the course of your employment belongs to the Company, excluding any pre-existing or personal projects created outside working hours without Company resources.

6. Expenses
The Company will reimburse travel expenses incurred on official duty.

7. Data
You consent to the Company sharing your personal data with its affiliates and third parties for any purpose.

8. Notice Period
After confirmation, you may resign by giving ninety (90) days' notice. The Company may terminate your employment by giving thirty (30) days' notice or salary in lieu of notice.

9. Restrictions
For twelve (12) months after leaving, you shall not join any competitor of the Company or any client to which you were deployed.

10. Confidentiality
You will keep the Company's confidential information secret during and after your employment.

11. Disputes
Disputes shall be settled by a sole arbitrator mutually appointed by both parties, seated at Pune. This letter is governed by the laws of India.`,
    },
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = SAMPLES;
  else root.FAIRSIGN_SAMPLES = SAMPLES;
})(typeof self !== "undefined" ? self : this);

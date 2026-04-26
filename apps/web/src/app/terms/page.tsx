import LegalContentPage from '@/components/LegalContentPage';

export default function TermsPage() {
  return (
    <LegalContentPage
      title="Terms & Conditions"
      subtitle="These Terms govern your access to and use of Rentage. Please read them carefully — by creating an account or using any part of the platform you agree to be bound by them."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'Rentage is a technology platform (an "intermediary") that helps owners (sellers/landlords/lessors) connect with prospective renters or buyers. Rentage does NOT own, sell, rent, lease, manage, inspect, deliver, store, insure or take custody of any item or property listed on the platform.',
        'Rentage is NOT a party to any rental, sale, lease, deposit, refund, exchange, payment or any other transaction between users. All deals, money transfers, and obligations are entirely between the listing owner and the interested user. Users independently assess and assume all risks associated with interactions and transactions on the Platform.',
        'Rentage only collects subscription/listing/feature fees from its users (paid through authorised payment gateways). Apart from these subscription-related amounts, Rentage does NOT collect, hold, escrow, or remit any money on behalf of any user.',
      ]}
      sections={[
        {
          heading: 'Definitions',
          bullets: [
            '"Platform" means the Rentage website, mobile applications, APIs, and related services.',
            '"User" means any person who registers, browses, lists, enquires, chats, or otherwise interacts with the Platform.',
            '"Owner" means a User who creates a listing offering an item, vehicle, property, or other asset.',
            '"Renter / Buyer" means a User who explores, enquires about, or proposes to take a listing on rent or to buy.',
            '"Listing" means any offer of an item, property, vehicle, or service published by an Owner on the Platform.',
            '"Subscription" means any paid plan, listing fee, promotion fee, or feature unlock charged by Rentage.',
            '"KYC" means the Know-Your-Customer verification process used to confirm a User\'s identity.',
          ],
        },
        {
          heading: 'Nature of Service — Rentage is Only a Connector',
          paragraphs: [
            'Rentage operates strictly as a discovery and communication platform. The Platform allows Owners to publish listings and Renters/Buyers to discover, contact, and negotiate with Owners.',
            'Rentage is an "intermediary" within the meaning of applicable information-technology and consumer-protection laws. It hosts user-generated content but does not endorse, certify, guarantee, or take responsibility for any listing, claim, statement, photograph, price, availability, or representation made by a User.',
            'Intermediary Safe Harbour: Rentage qualifies as an intermediary under the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Rentage\'s role is limited to providing access to a communication system over which information made available by third parties is transmitted or temporarily hosted/stored. Rentage does not initiate the transmission, select the receiver of the transmission, or modify the information contained in such transmission, and is therefore entitled to the safe-harbour protections available under applicable law.',
            'No Agency Relationship: Rentage does not act as an agent, broker, dealer, attorney, fiduciary, or representative of any User. Nothing on the Platform shall be construed as creating any partnership, joint venture, employment, or agency relationship between Rentage and any User, or between Users themselves.',
          ],
          bullets: [
            'Rentage does NOT inspect, photograph, value, or take physical possession of any listed asset.',
            'Rentage does NOT participate in the negotiation, finalisation, or execution of any deal between users.',
            'Rentage does NOT collect rent, deposits, advance, token money, or any payment between Owner and Renter/Buyer.',
            'Rentage does NOT verify or guarantee ownership, legal title, condition, suitability, or fitness for any purpose of any listed asset.',
            'Any agreement (rental, lease, sale, hire, service contract) is concluded directly between the Owner and the Renter/Buyer outside the Platform; Rentage is not a party to it.',
          ],
        },
        {
          heading: 'Account Eligibility, Registration & Identity Verification',
          subSections: [
            {
              heading: '3.1 Eligibility',
              bullets: [
                'You must be at least 18 years old and competent to enter into a binding contract under applicable law.',
                'You must not be barred from using the Platform under any applicable law, regulation, or previous Rentage decision.',
                'Businesses, agents, or organisations may register only through duly authorised representatives.',
              ],
            },
            {
              heading: '3.2 Mandatory Mobile Number & OTP Verification',
              bullets: [
                'A valid mobile number is mandatory at the time of registration and must be verified via a One-Time Password (OTP).',
                'Any change to your registered mobile number requires a fresh OTP verification on the new number before the change takes effect.',
                'You may sign in using either (a) email/phone with a password, or (b) email/phone with an OTP. Both methods are equally valid; you must protect your credentials and OTP.',
                'You must never share your password or OTP with any third party. Rentage will never ask for your OTP through phone calls, emails, chat, or in person.',
              ],
            },
            {
              heading: '3.3 KYC Mandatory Before Listing',
              bullets: [
                'You may browse, search, save, and contact Owners without completing KYC.',
                'You CANNOT publish any listing on the Platform until your KYC has been successfully verified.',
                'KYC may include government-issued ID (Aadhaar, PAN, Passport, Driving Licence), selfie/liveness check, and address proof, in line with applicable law.',
                'Submitting forged, tampered, or false KYC documents is a serious violation and may result in permanent suspension and reporting to authorities.',
                'Rentage may, at its discretion, require periodic re-verification or additional documents for trust and safety reasons.',
              ],
            },
            {
              heading: '3.4 Account Security',
              bullets: [
                'You are responsible for all activity that occurs under your account.',
                'Notify Rentage immediately at the support channel if you suspect unauthorised access.',
                'One person/entity may not maintain multiple accounts to manipulate ratings, listings, or evade restrictions.',
              ],
            },
          ],
        },
        {
          heading: 'Listings — Owner Responsibilities',
          paragraphs: [
            'Listings are created and controlled solely by Owners. The Owner is fully responsible for the accuracy, legality, and completeness of every detail in their listing.',
          ],
          bullets: [
            'You may list only items/properties you legally own or are duly authorised to rent, lease, or sell.',
            'All photographs, descriptions, prices, deposits, terms, and availability must be true and current.',
            'You must not list illegal goods, weapons, drugs, counterfeit items, stolen property, or anything that violates law.',
            'You must comply with all applicable laws including local rental laws, GST/tax laws, RERA (where applicable), motor-vehicle laws, and society/RWA rules.',
            'You are solely responsible for collecting rent, deposits, paperwork, agreements, taxes, insurance, refunds, and resolving any dispute with the Renter/Buyer.',
            'You must promptly mark listings as unavailable, sold, or rented to prevent stale or misleading content.',
          ],
        },
        {
          heading: 'Renters / Buyers — Your Responsibilities',
          paragraphs: [
            'You acknowledge that listings are created by third-party Owners and are NOT verified by Rentage as a matter of course. Rentage may, at its discretion, sample-verify or moderate listings, but no listing on the Platform should be treated as guaranteed by Rentage.',
          ],
          bullets: [
            'Independently verify the identity of the Owner, the existence and condition of the asset, ownership documents, and any legal compliance before paying any money or signing any agreement.',
            'Do NOT pay token money, deposits, or rent to anyone before physically inspecting the asset and reviewing original documents.',
            'Be alert to common scams: requests for advance payment, urgency tactics, off-platform payment links, fake "site visits," requests for OTPs, etc.',
            'Use the in-platform chat to keep an auditable record of communication wherever possible.',
            'Report suspicious users or listings to Rentage immediately so the team can investigate.',
            'You alone bear the risk of any payment made or commitment given to an Owner. Rentage is not responsible for refunds or recovery of such amounts.',
          ],
        },
        {
          heading: 'Phone Number Reveal — Your Explicit Consent',
          paragraphs: [
            'To protect privacy, an Owner\'s phone number is NOT shown by default on listings. When you click "Reveal phone" or a similar option, you provide explicit consent for Rentage to share the Owner\'s contact number with you, and to share your contact number with the Owner if required for the connection.',
            'This consent enables a one-to-one connection between Users. Rentage logs reveal events for safety, fraud-prevention, and audit purposes.',
            'Once revealed, you may receive a call, SMS, or WhatsApp message from the other User to facilitate the connection. You agree to use the contact information only for the purpose of evaluating the listing and not for spam, marketing, or unrelated outreach.',
          ],
        },
        {
          heading: 'Communication Consent — Email, SMS & WhatsApp',
          paragraphs: [
            'During registration and at appropriate moments inside the Platform, Rentage will ask for your explicit consent to send you transactional and marketing communication via Email, SMS, push notifications, and WhatsApp.',
          ],
          bullets: [
            'Transactional messages (OTPs, KYC status, listing approvals, inquiry alerts, subscription receipts, security alerts) are essential to use the Platform and may be sent regardless of marketing preferences.',
            'Marketing/promotional messages (offers, new feature updates, recommendations) are sent only if you opt in, and you may withdraw your consent at any time from your account settings.',
            'WhatsApp messages will be sent only after your explicit opt-in and within the policies of WhatsApp Business and applicable law.',
            'You can manage all consents at any time in Settings → Notifications.',
          ],
        },
        {
          heading: 'Subscriptions, Listing Fees & Payments',
          paragraphs: [
            'Rentage offers various paid plans and feature unlocks for Owners and other Users. These are the only money flows handled by Rentage.',
          ],
          bullets: [
            'Subscription, listing-promotion, and feature-unlock fees are collected via authorised third-party payment gateways. Rentage does not store full card or banking details.',
            'Plan inclusions, limits, and pricing are described on the pricing/checkout pages and may change from time to time with notice.',
            'Subscriptions may auto-renew if you opted in; you can cancel auto-renewal at any time before the next renewal date from your account settings.',
            'Refunds are governed by the Refund Policy and are generally non-refundable except where required by law or expressly stated.',
            'Rentage does NOT collect, hold, escrow, or settle rent, deposits, sale consideration, or any other money flowing between Users.',
          ],
        },
        {
          heading: 'No Liability for User-to-User Transactions',
          paragraphs: [
            'Because Rentage acts only as a connector, the Platform is not, and cannot be held, responsible for any deal, transaction, payment, dispute, damage, fraud, scam, misrepresentation, or loss arising between Owners and Renters/Buyers.',
          ],
          bullets: [
            'Rentage does not promise that any listing is genuine, authorised, accurate, available, or safe.',
            'Rentage does not promise that any User (Owner or Renter/Buyer) will perform their commitments, pay their dues, return deposits, or behave fairly.',
            'Any complaint regarding non-performance, fraudulent representation, money loss, damage to property, theft, or breach of agreement must be pursued by the affected User against the other User directly, including, where appropriate, by reporting to law-enforcement authorities.',
            'Rentage will, however, cooperate with lawful requests from authorities and may share account/listing/log information when required by law.',
          ],
        },
        {
          heading: 'Listing Verification — Informational Signal Only',
          paragraphs: [
            'Rentage may operate optional verification programs (e.g., document checks, site visits, "verified" badges). Verification indicators are informational signals only and must not be relied upon as proof of ownership, authenticity, legitimacy, or suitability of any listing or User.',
            'Even where a listing carries a verification badge, Users must independently confirm all material facts before paying money or entering into any agreement. Rentage expressly disclaims any liability arising from reliance on a verification indicator, badge, rating, or similar signal displayed on the Platform.',
          ],
        },
        {
          heading: 'Prohibited Activities',
          bullets: [
            'Posting fake, duplicate, misleading, expired, or non-existent listings.',
            'Posting illegal goods, restricted items, or assets without legal title.',
            'Posting listings without authority to rent, sublet, or sell (including unauthorised subletting in violation of a lease, society/RWA rules, or law).',
            'Bait-and-switch pricing — advertising one price/asset and demanding a different price/asset upon contact.',
            'Asking a Renter/Buyer for advance payment, token money, or deposit before they have physically inspected the asset.',
            'Sharing fake, tampered, or misleading documents, ownership proofs, RC, lease deeds, or identity papers.',
            'Fraud, impersonation, identity theft, or KYC document forgery.',
            'Soliciting payments outside the Platform that bypass user-to-user negotiation transparency.',
            'Phishing, scraping, or attempting to extract data from the Platform without authorisation.',
            'Sending spam, malware, or unsolicited marketing through chats or revealed contact details.',
            'Harassment, hate speech, threats, sexual content, or any conduct that violates community guidelines.',
            'Manipulating ratings, reviews, search rankings, or platform metrics.',
            'Bypassing safety controls, OTP gates, KYC checks, or platform fee mechanisms.',
          ],
        },
        {
          heading: 'Notice & Takedown',
          paragraphs: [
            'If you believe any content, listing, profile, message, or other material on the Platform is unlawful, infringing, fraudulent, misleading, or otherwise violates these Terms or applicable law, you may report it through the in-app "Report" option or by writing to the Grievance Officer at the contact details below.',
            'A valid complaint should include sufficient details to identify the impugned content, the basis of the complaint, and your contact details. Anonymous or insufficient complaints may not be actioned.',
          ],
          bullets: [
            'Rentage will acknowledge a valid complaint within twenty-four (24) hours of receipt.',
            'Rentage will review the complaint and may remove, disable access to, or label the content where required by law, court/government order, or where it reasonably believes a violation of these Terms has occurred.',
            'Rentage may also proactively, using automated systems and/or human review, detect and remove content that appears to violate applicable laws or these Terms, without prior notice to the User.',
            'Users whose content is repeatedly the subject of valid complaints, or who repeatedly violate these Terms, may be warned, restricted, suspended, or permanently banned, with or without forfeiture of subscription fees.',
            'Action under this clause is taken in good faith and in furtherance of intermediary obligations; it does not, by itself, create any liability for Rentage.',
          ],
        },
        {
          heading: 'Audit Logs, Monitoring & Evidence',
          paragraphs: [
            'To prevent fraud, support disputes, comply with legal obligations, and protect Users, Rentage may maintain logs of activity on the Platform.',
          ],
          bullets: [
            'Logs may include account events, login/IP/device metadata, listing changes, KYC status, "reveal phone" events, chat metadata, and subscription/payment events.',
            'Rentage may use automated systems (heuristics, machine-learning models, rate-limits, anti-fraud rules) and manual review to detect spam, fraud, and policy violations.',
            'Such logs may be used internally and/or shared with law-enforcement, courts, regulators, or affected Users to the extent required or permitted by applicable law.',
            'Users acknowledge and consent that such logs may be relied on as evidence in disputes, internal proceedings, or legal proceedings.',
          ],
        },
        {
          heading: 'Content & Intellectual Property',
          bullets: [
            'You retain ownership of content (photos, descriptions, etc.) you submit, but grant Rentage a worldwide, royalty-free, non-exclusive licence to host, display, reproduce, distribute, and adapt that content for operating, promoting, and improving the Platform.',
            'You confirm that you have all rights to the content you upload and that it does not infringe any third-party rights.',
            'Rentage\'s name, logo, design, software, code, and platform-generated content are owned by Rentage or its licensors and may not be copied, scraped, or reused without written consent.',
          ],
        },
        {
          heading: 'Suspension, Termination & Content Removal',
          paragraphs: [
            'Rentage may, with or without notice, suspend or terminate accounts, remove listings, or restrict features if a User violates these Terms, applicable law, or community guidelines, or if Rentage reasonably believes such action is necessary to protect Users or the Platform.',
            'Users may also close their account at any time, subject to settlement of any outstanding subscription dues.',
          ],
        },
        {
          heading: 'Disclaimers & Limitation of Liability',
          paragraphs: [
            'The Platform is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, Rentage disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, accuracy, and non-infringement.',
            'Rentage will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including loss of profits, data, goodwill, or rental opportunities.',
            'In no event shall Rentage\'s aggregate liability to any User, for any claim arising out of or in connection with the Platform, exceed the total subscription fees paid by that User to Rentage in the twelve (12) months immediately preceding the event giving rise to the claim, or INR 5,000, whichever is lower.',
          ],
        },
        {
          heading: 'Force Majeure',
          paragraphs: [
            'Rentage shall not be liable for any failure or delay in performance, or for any unavailability, downtime, or degradation of the Platform, resulting from causes beyond its reasonable control. Such causes include, without limitation, acts of God, natural disasters, fire, flood, earthquake, pandemic or epidemic, war, terrorism, civil unrest, strikes, government actions or orders, regulatory changes, internet or telecommunications outages, cyber-attacks, denial-of-service incidents, third-party service or infrastructure failures (including hosting, payment-gateway, KYC, or notification providers), and power failures.',
          ],
        },
        {
          heading: 'Data Retention (Reference)',
          paragraphs: [
            'Rentage retains User data only for as long as necessary to provide its services, comply with legal, tax, audit, fraud-prevention, and dispute-resolution obligations, and enforce these Terms. The detailed retention periods, deletion mechanisms, and data-subject rights are described in the Privacy Policy, which forms part of these Terms by reference.',
          ],
        },
        {
          heading: 'Indemnification',
          paragraphs: [
            'You agree to defend, indemnify, and hold harmless Rentage, its affiliates, officers, employees, and partners against any claim, loss, damage, liability, cost, or expense (including legal fees) arising out of (a) your use of the Platform, (b) your listings or content, (c) your dealings with other Users, (d) your breach of these Terms or applicable law, or (e) infringement of any third-party right by you or your content.',
          ],
        },
        {
          heading: 'Governing Law & Dispute Resolution',
          paragraphs: [
            'These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict-of-laws principles.',
            'Subject to mandatory consumer-protection rights, the courts at Pune, Maharashtra, India shall have exclusive jurisdiction over any dispute arising under these Terms. Parties shall first attempt good-faith resolution through Rentage\'s grievance mechanism before initiating any legal proceedings.',
          ],
        },
        {
          heading: 'Grievance Officer',
          paragraphs: [
            'In compliance with the Information Technology Act, 2000 and applicable rules, the Grievance Officer can be reached at the contact details below. Complaints relating to content, privacy, KYC, fraudulent users, or platform misuse will be acknowledged within 24 hours and resolved within the timelines prescribed by applicable law.',
          ],
        },
        {
          heading: 'Changes to These Terms',
          paragraphs: [
            'Rentage may update these Terms from time to time. Material changes will be notified through email, in-app notice, or platform banner. Continued use of the Platform after the effective date of revised Terms constitutes acceptance.',
          ],
        },
        {
          heading: 'Entire Agreement & Severability',
          paragraphs: [
            'These Terms, together with the Privacy Policy, Refund Policy, Acceptable Use & Community Guidelines, Cookie Policy, Disclaimer, and any other policies referenced herein or accepted by you on the Platform, constitute the entire agreement between you and Rentage regarding your use of the Platform. They supersede any prior or contemporaneous agreements, understandings, communications, or representations, whether oral or written.',
            'No statement, promise, or representation made by any person (including Rentage staff, support agents, or third parties) outside of these documents shall be binding on Rentage unless expressly recorded in writing and signed by an authorised representative of Rentage.',
            'If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect, and the invalid provision shall be deemed modified to the minimum extent necessary to make it enforceable while preserving its original intent.',
            'A failure or delay by Rentage in exercising any right, power, or remedy under these Terms shall not operate as a waiver of that or any other right, power, or remedy.',
          ],
        },
      ]}
      contactBlock={{
        email: 'support@rentage.in',
        phone: '+91 98765 43210',
        address: 'Rentage Grievance Cell, Pune, Maharashtra, India',
      }}
    />
  );
}


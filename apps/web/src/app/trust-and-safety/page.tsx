import LegalContentPage from '@/components/LegalContentPage';

export const metadata = {
  title: 'Trust & Safety — Rentage',
  description: 'How Rentage keeps you safe, what verifications mean, how to spot scams, and how to report problems.',
};

export default function TrustAndSafetyPage() {
  return (
    <LegalContentPage
      title="Trust & Safety"
      subtitle="Rentage connects people — but we know that connection comes with responsibility. This page explains how our safety systems work, what to watch out for, and how to report problems."
      effectiveDate="Last updated: April 26, 2026"
      intro={[
        'This Trust & Safety page is for informational purposes and should be read together with the Terms & Conditions, Privacy Policy, and Acceptable Use Policy. In case of conflict, the Terms & Conditions shall prevail.',
        'Rentage is a connector platform. We bring Owners and Renters/Buyers together — but we are NOT a party to any deal, and we do not handle rent, deposits, or payments between Users. This means your safety depends on both our platform safeguards and your own due diligence.',
        'Rentage facilitates discovery and communication only and does not act as a broker, agent, or intermediary in transactions.',
        'Rentage does not assume responsibility for User conduct, transactions, or outcomes. Users interact and transact at their own discretion and risk, as detailed in the Terms & Conditions.',
        'We take trust seriously. This page explains every layer of protection we provide and every precaution you should take.',
      ]}
      sections={[
        {
          heading: 'Quick Safety Rules',
          bullets: [
            'Never pay before physical inspection and document verification.',
            'Never share your OTP, password, or banking credentials with anyone.',
            'Always verify original ownership and identity documents.',
            'Always use written agreements and payment receipts.',
          ],
        },
        {
          heading: 'How Rentage Protects You',
          subSections: [
            {
              heading: 'Mobile OTP Verification',
              paragraphs: [
                'Every account on Rentage requires a verified mobile number. You cannot create an account or change your phone number without receiving and entering a One-Time Password (OTP) sent to that number.',
                'This prevents fake registrations and ensures every User is reachable by a real mobile number.',
              ],
            },
            {
              heading: 'KYC Before Listing',
              paragraphs: [
                'No one can publish a listing on Rentage without completing KYC (Know Your Customer) verification. This requires submitting a government-issued ID (Aadhaar, PAN, Passport, or Driving Licence) and a selfie/liveness check.',
                'KYC does not verify ownership of an asset — it verifies the identity of the person behind the listing. You should still verify ownership documents directly with the Owner.',
              ],
            },
            {
              heading: 'Phone Number Privacy by Default',
              paragraphs: [
                'Owner phone numbers are hidden on all listings by default. They are only revealed when a Renter/Buyer explicitly clicks "Reveal phone" — and this event is logged.',
                'This protects Owners from unwanted calls and creates an auditable trail for safety and dispute purposes.',
              ],
            },
            {
              heading: 'Verification Badges',
              paragraphs: [
                'Listings or profiles may carry a "Verified" badge. This indicates that Rentage has performed a basic identity or document check.',
                'IMPORTANT: Verification badges are informational signals only. They do not guarantee ownership, authenticity, asset condition, or the legitimacy of any listing. Always conduct your own due diligence before paying any money.',
              ],
            },
            {
              heading: 'Audit Logs & Monitoring',
              paragraphs: [
                'Rentage maintains logs of key platform events: account logins, listing changes, KYC status, phone-reveal events, and chat metadata. These logs are used to detect fraud, support disputes, and cooperate with law-enforcement when legally required.',
                'These logs may also be used as evidence in internal investigations, dispute handling, or when responding to lawful requests from authorities.',
                'We also use automated systems to detect suspicious behaviour, spam, and policy violations.',
              ],
            },
            {
              heading: 'Report & Takedown',
              paragraphs: [
                'Every listing, profile, and chat message has an in-app "Report" button. Valid reports are acknowledged within 24 hours. Rentage may remove, restrict, or flag content that violates our policies.',
                'Rentage reserves the right to remove or restrict content at its sole discretion where it believes a violation has occurred or user safety may be at risk.',
                'Repeat violators face suspension or permanent bans.',
              ],
            },
          ],
        },
        {
          heading: 'What Rentage Cannot Guarantee',
          paragraphs: [
            'Being transparent about our limitations helps you stay safe. Rentage CANNOT:',
            'Rentage makes no warranties or guarantees, express or implied, regarding any User, listing, or outcome of any interaction.',
          ],
          bullets: [
            'Verify that an Owner actually owns the asset they are listing.',
            'Guarantee the physical condition, safety, or legal compliance of any listed asset.',
            'Prevent all fraudulent or bad-faith behaviour by Users.',
            'Recover money you have paid to another User.',
            'Intervene in or adjudicate disputes between Users.',
            'Guarantee that a verified User will honour their commitments.',
          ],
          subSections: [
            {
              heading: 'Your due diligence is essential',
              paragraphs: [
                'Before paying any money or signing any agreement, you must independently verify all material facts. No badge, rating, or review on Rentage replaces your own inspection and document review.',
              ],
            },
          ],
        },
        {
          heading: 'Anti-Scam Guide — Protect Yourself',
          paragraphs: [
            'Online rental and resale platforms attract fraudsters. Here are the most common scams on rental marketplaces and how to avoid them.',
          ],
          subSections: [
            {
              heading: 'Advance Payment Scam',
              paragraphs: [
                'The scammer lists an attractive property or item at a very low price. When you show interest, they ask for a token amount, advance rent, or refundable deposit before you have seen the asset.',
              ],
              bullets: [
                'NEVER pay any amount before physically inspecting the asset in person.',
                'Genuine Owners do not need advance payment to "hold" a property before a site visit.',
                'If you cannot visit in person, ask for a live video call at the actual location.',
              ],
            },
            {
              heading: 'Bait-and-Switch',
              paragraphs: [
                'The listing shows a well-priced, attractive asset. When you arrive or contact the Owner, you are told that asset is "just rented" and offered a different, inferior, or more expensive one.',
              ],
              bullets: [
                'Confirm the exact listing details (address, item, price) in writing via chat before visiting.',
                'Insist on seeing the listed asset, not a substitute.',
                'Report bait-and-switch listings immediately.',
              ],
            },
            {
              heading: 'Fake Ownership / Document Fraud',
              paragraphs: [
                'The "Owner" presents forged or borrowed documents (RC, property papers, Aadhaar) to appear legitimate.',
              ],
              bullets: [
                'Always verify original documents (not photocopies or images).',
                'For properties: ask for the registered sale deed, allotment letter, or registered rent agreement.',
                'For vehicles: verify the RC book and check the owner name against a government portal.',
                'For high-value assets, consider engaging a lawyer or legal service to verify title.',
              ],
            },
            {
              heading: 'Unauthorised Subletting',
              paragraphs: [
                'A tenant re-lists the property as if they are the owner. You end up in a dispute when the real owner discovers an unauthorised subtenant.',
              ],
              bullets: [
                'Ask for proof of ownership, not just possession.',
                'Insist on a registered rent agreement with the legal owner.',
                'Check society/building records to verify the registered owner.',
              ],
            },
            {
              heading: 'OTP / Phishing Scam',
              paragraphs: [
                'Someone posing as Rentage support or the Owner calls you and asks for your OTP, password, or bank details.',
              ],
              bullets: [
                'Rentage will NEVER ask for your OTP, password, or banking credentials via phone, SMS, email, or chat.',
                'Do not share OTPs with anyone, ever.',
                'If you receive a suspicious call claiming to be from Rentage, hang up and report it to support@rentage.in.',
              ],
            },
            {
              heading: 'Pressure Tactics',
              paragraphs: [
                '"Many buyers are waiting." "Pay now or lose the slot." "Special discount only today."',
              ],
              bullets: [
                'Genuine Owners do not use pressure tactics to rush legitimate renters.',
                'Take your time. Any real listing will be available for a reasonable discussion window.',
                'If someone is rushing you to pay before you are ready, treat it as a red flag.',
              ],
            },
          ],
        },
        {
          heading: 'Safe Transaction Practices',
          bullets: [
            'Always use the in-platform chat to communicate — it creates an auditable record.',
            'Meet in person before paying anything. Visit the actual asset at its actual address.',
            'Verify original documents — not scanned copies or images.',
            'Avoid making advance payments unless you have fully verified the identity, ownership, and legitimacy of the transaction.',
            'Use a registered written agreement for any rental or purchase.',
            'Get a written receipt with the Owner\'s signature for any payment made.',
            'Keep records: screenshots of listing, chat, payment receipts, and agreement.',
            'Avoid making payments to unknown UPI IDs, wallets, or accounts you cannot verify.',
            'Do not click links sent via WhatsApp or SMS claiming to be from Rentage.',
          ],
        },
        {
          heading: 'How to Report a Problem',
          subSections: [
            {
              heading: 'Report a Listing or User',
              bullets: [
                'Use the in-app "Report" button on any listing, profile, or chat message.',
                'Describe the issue clearly — include any evidence (screenshots, transaction IDs, chat history).',
                'Our team acknowledges reports within 24 hours.',
                'Submitting false or malicious reports may result in action against the reporting User.',
              ],
            },
            {
              heading: 'Report via Email',
              bullets: [
                'For fraud, scams, or urgent safety issues: support@rentage.in',
                'For privacy or data concerns: privacy@rentage.in',
                'Include your registered phone/email, the User or listing involved, and a clear description of the issue.',
              ],
            },
            {
              heading: 'Report to Authorities',
              paragraphs: [
                'If you have suffered financial fraud or a crime, please file a police complaint immediately. You can also report cyber fraud to the National Cyber Crime Reporting Portal at cybercrime.gov.in or call 1930.',
                'Rentage will cooperate fully with lawful requests from law-enforcement authorities.',
              ],
            },
            {
              heading: 'Escalate to Grievance Officer',
              paragraphs: [
                'If your issue is not resolved satisfactorily through normal support channels, you may escalate it to our Grievance Officer at the contact details below. We will respond within the timelines prescribed by the Information Technology Act, 2000 and DPDP Act, 2023.',
                'While we aim to respond quickly, resolution timelines may vary depending on the complexity of the issue and the availability of supporting evidence.',
              ],
            },
            {
              heading: 'Cooperate with Investigations',
              paragraphs: [
                'Users are expected to cooperate in investigations by providing accurate information and supporting evidence when requested. Failure to cooperate in good faith may affect resolution outcomes and may lead to account-level action in serious cases.',
              ],
            },
          ],
        },
        {
          heading: 'Immediate Safety Actions',
          paragraphs: [
            'In cases involving fraud, impersonation, or threats to user safety, Rentage may take immediate action including account suspension without prior notice.',
          ],
        },
        {
          heading: 'Platform Limitations — Know Before You Use',
          bullets: [
            'Rentage is a discovery platform, not a transaction processor or escrow service.',
            'Rentage does not collect, hold, or transfer rent, deposits, or sale proceeds.',
            'Rentage is not responsible for the conduct, honesty, or financial solvency of any User.',
            'Verification badges are informational signals only — not a guarantee of any kind.',
            'Rentage cannot compel an Owner to refund a deposit or Renter to pay outstanding dues.',
            'All legal recourse for User-to-User disputes must be pursued directly against the other User.',
          ],
        },
        {
          heading: 'Our Commitment',
          paragraphs: [
            'Rentage is committed to making the platform safer every day. We continuously improve our fraud-detection systems, expand our verification programs, and respond quickly to user reports.',
            'Trust is built through transparency. If you ever have a concern about how we operate, please reach out — we want to hear from you.',
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

import LegalContentPage from '@/components/LegalContentPage';

export default function AcceptableUsePage() {
  return (
    <LegalContentPage
      title="Acceptable Use & Community Guidelines"
      subtitle="To keep Rentage safe, useful, and trustworthy, every User agrees to follow these rules. Violations may result in content removal, account suspension, or referral to authorities."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'This Acceptable Use Policy forms an integral part of the Terms & Conditions of Rentage. By using the Platform, you agree to comply with these rules. Violations may result in enforcement actions as described below.',
        'These guidelines apply to all activity on Rentage — listings, photographs, descriptions, chats, calls, reviews, ratings, profile content, and revealed-contact communications.',
      ]}
      sections={[
        {
          heading: 'Be Truthful',
          bullets: [
            'List only items/properties you legally own or are duly authorised to rent or sell.',
            'Use real, recent, unaltered photos of the actual asset — no stock photos or photos of a different unit.',
            'State accurate prices, deposits, dimensions, condition, availability, and terms.',
            'Do not post bait-and-switch listings — advertising one item, price, or property and then offering a different one upon contact.',
            'Do not misrepresent ownership, pricing, location, availability, or any material fact about a listing.',
            'Do not request advance payments, token money, or deposits without genuine intent and authority to complete the transaction.',
            'Mark listings as rented/sold/unavailable promptly to avoid wasting other Users\' time.',
          ],
        },
        {
          heading: 'Be Lawful',
          bullets: [
            'Do not list illegal goods, weapons, drugs, counterfeit products, stolen items, or anything restricted by law.',
            'Comply with all applicable laws — local rent, motor-vehicle, insurance, RERA, GST, society/RWA, age-restriction laws, etc.',
            'Do not list properties or vehicles without legal authority, valid documentation, or required registrations.',
            'Do not sublet, re-list, or broker listings without proper authorisation from the legal owner or applicable authority.',
            'Do not run unregistered hostels, PGs, gambling, escort, or any service prohibited by law.',
          ],
        },
        {
          heading: 'Respect Others',
          bullets: [
            'No harassment, hate speech, threats, intimidation, sexual content, or discrimination.',
            'No discrimination on the basis of religion, caste, gender, race, nationality, marital status, food preference, disability, or sexual orientation.',
            'No spam, mass promotional messaging, or contacting Users for purposes unrelated to a specific listing.',
            'Do not engage in defamation, false allegations, or misleading claims about other Users.',
            'Do not contact a User after they have asked you to stop.',
          ],
        },
        {
          heading: 'Protect the Platform',
          bullets: [
            'Do not attempt to bypass KYC, OTP, payment, or moderation controls.',
            'Do not attempt to interfere with platform security, access restricted areas, or exploit vulnerabilities.',
            'Do not use bots, scripts, crawlers, or automated tools to interact with the Platform without Rentage\'s prior written permission.',
            'Do not scrape, copy, or reverse-engineer any part of the Platform without written consent.',
            'Do not upload viruses, malicious code, or anything that may harm Users or systems.',
            'Do not create multiple/fake accounts to manipulate ratings, search rankings, or evade restrictions.',
            'Do not impersonate Rentage staff, government officials, or another person.',
            'Any attempt to manipulate search rankings, listing visibility, engagement metrics, or algorithm outputs is prohibited.',
          ],
        },
        {
          heading: 'Use Communications Responsibly',
          bullets: [
            'Use chats and "reveal phone" only to evaluate listings — not for unrelated marketing or solicitation.',
            'Any misuse of revealed contact information, including unsolicited marketing, harassment, data harvesting, or bulk outreach, is strictly prohibited.',
            'Do not share another User\'s contact details, address, or photographs without consent.',
            'Do not request OTPs, passwords, or banking credentials from another User. Rentage will never ask for these.',
          ],
        },
        {
          heading: 'Reviews & Ratings',
          bullets: [
            'Reviews must be honest, first-hand experiences. No fake reviews, paid reviews, or coordinated rating manipulation.',
            'Constructive criticism is welcome; personal attacks, defamation, or hate speech are not.',
            'Reviews must not contain confidential information, personal data (e.g., phone numbers, addresses), or unverifiable allegations.',
            'Rentage may remove or moderate reviews at its discretion, including those that violate this Policy or applicable law.',
          ],
        },
        {
          heading: 'Commercial Use Restrictions',
          paragraphs: [
            'The Platform may not be used for bulk commercial advertising, mass lead generation, large-scale brokerage operations, or systematic data extraction unless explicitly permitted in writing by Rentage. Individual Owners and agents may list and promote their own assets in accordance with their subscription plan.',
          ],
        },
        {
          heading: 'Zero-Tolerance Violations',
          paragraphs: [
            'Certain violations may result in immediate suspension or permanent ban without prior warning. These include, without limitation:',
          ],
          bullets: [
            'Fraud, financial scams, or impersonation of another person or entity.',
            'Sharing or soliciting child sexual abuse material or any illegal content.',
            'Threats to user safety, physical safety, or national security.',
            'KYC document forgery or identity fraud.',
            'Organised coordinated abuse, bot networks, or platform-wide manipulation campaigns.',
          ],
        },
        {
          heading: 'Reporting Violations',
          paragraphs: [
            'If you encounter a listing, message, or User violating these guidelines, please report it from the in-app "Report" option or write to support@rentage.in. We aim to acknowledge reports within 24 hours.',
            'Users may escalate unresolved complaints to the Grievance Officer as defined in the Terms & Conditions.',
          ],
        },
        {
          heading: 'Enforcement Actions',
          paragraphs: [
            'Rentage reserves the right to determine, at its sole discretion, whether a User\'s conduct violates these guidelines, and to take any of the following actions:',
          ],
          bullets: [
            'Warning and content removal.',
            'Temporary feature restriction (e.g., listing limits, reveal-phone limits).',
            'Account suspension or permanent ban.',
            'Referral to law-enforcement where required by law.',
            'Forfeiture of any subscription paid, with no refund, for serious or repeated violations.',
          ],
          subSections: [
            {
              heading: 'Evidence & Logs',
              paragraphs: [
                'Rentage may use platform logs, communication metadata, system data, and activity records to investigate violations and support enforcement actions, internal proceedings, or requests from law-enforcement authorities.',
              ],
            },
            {
              heading: 'No Liability for User Conduct',
              paragraphs: [
                'Rentage is not responsible for User conduct on or off the Platform and disclaims all liability to the maximum extent permitted under the Terms & Conditions. Enforcement actions are taken in good faith; they do not create any obligation or liability on Rentage\'s part.',
              ],
            },
          ],
        },
      ]}
      contactBlock={{
        email: 'support@rentage.in',
        phone: '+91 98765 43210',
      }}
    />
  );
}

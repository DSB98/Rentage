import LegalContentPage from '@/components/LegalContentPage';

export default function PrivacyPage() {
  return (
    <LegalContentPage
      title="Privacy Policy"
      subtitle="This Privacy Policy explains what personal data Rentage collects, how it is used and shared, and the rights and choices available to you."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'Rentage is a connector platform: we help Owners and Renters/Buyers discover and contact each other. We do not handle the rental, sale, deposit, or payment of listed items between Users.',
        'We are committed to protecting your privacy and complying with applicable data-protection laws including the Digital Personal Data Protection Act, 2023 (DPDP) and the Information Technology Act, 2000 (and rules thereunder).',
      ]}
      sections={[
        {
          heading: 'Who We Are (Data Fiduciary)',
          paragraphs: [
            'Rentage ("we", "us", "our") acts as the Data Fiduciary for personal data collected through the Platform. Communications about this policy can be sent to the contact at the bottom of this page.',
          ],
        },
        {
          heading: 'Information We Collect',
          subSections: [
            {
              heading: '2.1 Information you provide directly',
              bullets: [
                'Identity & contact: name, email, mobile number, password, profile photo, address, gender, date of birth (if provided).',
                'KYC data: government-issued ID details and document images (Aadhaar, PAN, Passport, Driving Licence), selfie/liveness images, and address proof. KYC data is treated as sensitive personal data and is processed with enhanced security controls. Access to such data is strictly limited and monitored.',
                'Listing data: photographs, descriptions, prices, deposits, location, availability, and other listing fields you publish.',
                'Communication data: chats, inquiries, support tickets, feedback, ratings, and reviews you submit.',
                'Payment data: subscription/listing-fee payment metadata (amount, status, gateway reference). Full card numbers and bank credentials are stored only by our PCI-DSS-compliant payment gateways, never by Rentage.',
              ],
            },
            {
              heading: '2.2 Information collected automatically',
              bullets: [
                'Device & technical data: IP address, device identifiers, browser, OS, app version, language, time zone.',
                'Usage data: pages viewed, searches, listings explored, click events, "reveal phone" events, time stamps.',
                'Cookies and similar technologies (see Cookie Policy).',
                'Location data: approximate location derived from IP, or precise location if you grant permission to improve search.',
              ],
            },
            {
              heading: '2.3 Information from third parties',
              bullets: [
                'Login providers (e.g., Google) when you choose social sign-in, limited to basic profile info you authorise.',
                'KYC verification partners that help us validate ID documents.',
                'Payment gateways that share status of subscription transactions.',
                'Notification providers (Email, SMS, WhatsApp) that confirm message delivery.',
              ],
            },
          ],
        },
        {
          heading: 'Why We Collect This Data (Purpose & Legal Basis)',
          bullets: [
            'To create and operate your account and authenticate logins (including OTP verification).',
            'To complete KYC, which is mandatory before publishing any listing on the Platform.',
            'To enable discovery and connection between Owners and Renters/Buyers.',
            'To provide chat, inquiries, "reveal phone" connections, and customer support.',
            'To collect subscription payments through authorised gateways and to issue receipts.',
            'To detect, prevent, and respond to fraud, scams, abuse, and security incidents.',
            'To send transactional notifications (OTPs, KYC status, listing updates, payments).',
            'To send marketing and promotional notifications via Email/SMS/WhatsApp ONLY where you have given explicit, granular consent — and you may withdraw consent any time.',
            'To improve, personalise, and analyse the Platform performance.',
            'To comply with applicable laws, regulatory orders, and legitimate requests from law-enforcement.',
          ],
          paragraphs: [
            'We process personal data primarily on the basis of your consent, and where necessary to perform our services, comply with legal obligations, or protect against fraud and misuse, in accordance with applicable law including the Digital Personal Data Protection Act, 2023.',
          ],
        },
        {
          heading: 'Explicit Consents We Take',
          bullets: [
            'Account creation & general use of the Platform.',
            'Mobile-number OTP verification at signup and on every change of mobile number.',
            'KYC document collection and processing (mandatory before listing).',
            'Email, SMS, push, and WhatsApp transactional notifications (essential for service).',
            'Email, SMS, push, and WhatsApp marketing/promotional messages — opt-in only, granular per channel.',
            'Reveal of Owner phone number to a Renter/Buyer when the user clicks "Reveal phone" or similar.',
            'Cookies and similar tracking technologies (see banner and Cookie Policy).',
            'Optional location-based personalisation.',
          ],
          paragraphs: [
            'You can review and change consents any time from Settings → Privacy / Notifications. Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal.',
          ],
        },
        {
          heading: 'How "Reveal Phone Number" Works',
          paragraphs: [
            'Owners\' phone numbers are masked by default on listings. When a Renter/Buyer clicks "Reveal phone", we treat that click as their explicit consent to share contact information for the purpose of evaluating that listing.',
            'We log reveal events (timestamp, listing, requesting user) for security, abuse-prevention, and audit. Owners may receive notification of such reveal events. Both parties agree to use revealed contact details only for the listing evaluation and not for spam.',
          ],
        },
        {
          heading: 'How We Share Information',
          bullets: [
            'With other Users only as necessary to facilitate the connection (e.g., your masked profile, listing data, revealed phone number on consent).',
            'With service providers (cloud hosting, KYC, payment gateways, email/SMS/WhatsApp providers, analytics, customer support tools) under written agreements that limit them to processing data only on our instructions.',
            'With law-enforcement, courts, and regulators where required by law or to protect our or others\' rights, safety, or property.',
            'In a corporate transaction (merger, acquisition, restructuring), to the successor entity, with continuing protection equivalent to this policy.',
            'We do NOT sell your personal data to advertisers or data brokers.',
          ],
        },
        {
          heading: 'Data Retention',
          bullets: [
            'Account data is retained for as long as your account is active.',
            'KYC data is retained for the duration prescribed by applicable law and our risk-management requirements.',
            'Transactional records (subscription payments, invoices) are retained as required by tax/accounting laws (typically 7 years).',
            'Chats, inquiries, and reveal logs are retained for security and dispute-resolution purposes for a reasonable period.',
            'After account closure, we retain only what is required for legal, regulatory, fraud-prevention, or audit reasons; the rest is deleted or anonymised.',
          ],
        },
        {
          heading: 'Your Rights',
          paragraphs: [
            'Subject to applicable law (including the DPDP Act, 2023), you have the following rights:',
          ],
          bullets: [
            'Right to access — request a copy of personal data we hold about you.',
            'Right to correction — ask us to fix inaccurate or incomplete data. Certain personal data (name, phone, address, profile photo) can be updated directly through your account settings. You are responsible for keeping your information accurate and up to date.',
            'Right to erasure — request deletion of your account and associated data, subject to legal retention requirements. You may request account deletion through your account settings or by contacting us. Upon deletion, your personal data will be removed or anonymised, except where retention is required by law or for legitimate purposes such as fraud prevention or dispute resolution.',
            'Right to withdraw consent — turn off any consent (e.g., marketing notifications) any time from Settings → Privacy / Notifications. Withdrawing consent does not affect the lawfulness of processing carried out before the withdrawal.',
            'Right to grievance — escalate any concern to our Grievance Officer.',
            'Right to nominate — nominate another individual to exercise rights on your behalf in case of incapacity or death (where supported by law).',
          ],
          paragraphs: [
            'To exercise any right, submit a request through your account settings or write to the Grievance Officer at the contact details below. We may verify your identity before processing any request to protect your data. Requests will be responded to within the timelines prescribed by applicable law. Where a request cannot be fulfilled (e.g., due to legal retention requirements), we will inform you of the reason.',
          ],
        },
        {
          heading: 'Security Measures',
          bullets: [
            'TLS encryption in transit and encryption-at-rest for sensitive fields (such as KYC images and tokens).',
            'Role-based access controls, audit logs, and least-privilege principles for staff.',
            'Hashed and salted passwords; OTPs are short-lived and single-use.',
            'Continuous monitoring, vulnerability management, and patching.',
            'Periodic backups, disaster-recovery and incident-response procedures.',
          ],
          paragraphs: [
            'No system is perfectly secure. In the event of a data breach affecting your personal data, we will notify affected Users and relevant authorities as required under applicable law, including the DPDP Act, 2023.',
          ],
        },
        {
          heading: 'Children',
          paragraphs: [
            'The Platform is intended only for individuals aged 18 years and above. We do not knowingly process personal data of minors. If we become aware that personal data of a minor has been collected, we will take steps to delete such data promptly. If you believe a minor is using the Platform, please contact us immediately.',
          ],
        },
        {
          heading: 'International Transfers',
          paragraphs: [
            'Where personal data is transferred outside India, we ensure that such transfers are made to jurisdictions or entities that provide an adequate level of data protection, or under contractual safeguards (such as standard data-protection clauses or equivalent mechanisms) to ensure continued protection of your data in accordance with applicable law.',
          ],
        },
        {
          heading: 'Data Minimisation',
          paragraphs: [
            'We collect only such personal data as is necessary for the purposes stated in this Policy and do not process data beyond what is required. If you choose not to provide optional data, it will not affect your access to the core features of the Platform.',
          ],
        },
        {
          heading: 'Purpose Limitation',
          paragraphs: [
            'Personal data is used only for the purposes for which it was collected, unless otherwise required or permitted by law. We will not repurpose your data for unrelated uses without obtaining fresh consent where required.',
          ],
        },
        {
          heading: 'Automated Processing & Profiling',
          paragraphs: [
            'We may use automated systems to analyse usage patterns, detect fraud, filter listings, rank search results, and improve Platform performance. Such automated processing does not produce legal or similarly significant effects on Users. You may contact us if you have concerns about a specific automated decision affecting your account.',
          ],
        },
        {
          heading: 'Cookies & Tracking',
          paragraphs: [
            'We use cookies and similar technologies for authentication, session continuity, fraud-prevention, analytics, and (with consent) personalisation. See our Cookie Policy for details and controls.',
          ],
        },
        {
          heading: 'Third-Party Links',
          paragraphs: [
            'Listings or pages may link to third-party sites, including payment-gateway pages. Those sites operate under their own privacy policies; please review them. Rentage is not responsible for third-party privacy practices.',
          ],
        },
        {
          heading: 'Changes to This Policy',
          paragraphs: [
            'We may update this Privacy Policy from time to time. Material changes will be notified through email, in-app notice, or platform banner. Continued use after the effective date of changes indicates acceptance.',
          ],
        },
        {
          heading: 'Grievance Officer',
          paragraphs: [
            'In accordance with the Information Technology Act, 2000 and DPDP Act, 2023, the contact details of our Grievance Officer are listed below. We will acknowledge complaints within 24 hours and resolve them within the timelines required by law.',
          ],
        },
      ]}
      contactBlock={{
        email: 'privacy@rentage.in',
        phone: '+91 98765 43210',
        address: 'Rentage Grievance Officer, Pune, Maharashtra, India',
      }}
    />
  );
}


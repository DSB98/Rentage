import LegalContentPage from '@/components/LegalContentPage';

export default function CookiePolicyPage() {
  return (
    <LegalContentPage
      title="Cookie Policy"
      subtitle="This Cookie Policy explains how Rentage uses cookies and similar technologies, and how you can control them."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'This Cookie Policy forms part of the Privacy Policy of Rentage. By continuing to use the Platform, you consent to the use of cookies as described in this Policy, subject to your preferences.',
        'When you visit or interact with Rentage, we and our service providers may place small text files called cookies (and use similar technologies such as local storage, SDKs, and pixels) on your device. This policy explains what we use, why, and your choices.',
      ]}
      sections={[
        {
          heading: 'What Are Cookies?',
          paragraphs: [
            'Cookies are small files stored by your browser. They are widely used to make websites work, remember preferences, secure sessions, and gather analytics. In mobile applications, similar technologies such as SDK identifiers may be used instead of browser cookies.',
          ],
        },
        {
          heading: 'Legal Basis for Cookie Use',
          paragraphs: [
            'We use cookies based on your consent, except for strictly necessary cookies which are required for the functioning and security of the Platform.',
          ],
        },
        {
          heading: 'Categories of Cookies We Use',
          subSections: [
            {
              heading: 'Strictly Necessary',
              paragraphs: [
                'Required to operate the Platform — they enable login sessions, secure the account, store CSRF tokens, and remember basic preferences. These cannot be disabled.',
              ],
              bullets: [
                'Authentication tokens (JWT/session).',
                'CSRF protection.',
                'Load-balancing and reliability cookies.',
              ],
            },
            {
              heading: 'Functional',
              paragraphs: [
                'Help us remember your choices to deliver a personalised experience.',
              ],
              bullets: [
                'Language and region.',
                'Saved searches, recently viewed listings.',
                'Display preferences (theme, layout).',
              ],
            },
            {
              heading: 'Analytics',
              paragraphs: [
                'Help us understand how Users use the Platform so we can improve it. We use aggregated metrics; we do not use analytics cookies to advertise to you on third-party sites.',
              ],
              bullets: [
                'Page views, click events, search funnels.',
                'Crash and performance diagnostics.',
              ],
            },
            {
              heading: 'Marketing (only with your consent)',
              paragraphs: [
                'Marketing cookies are used only to measure and improve Rentage\'s own campaigns. We do NOT use third-party advertising cookies for behavioural advertising or cross-site tracking. These cookies are set only after you opt in via the cookie banner.',
              ],
            },
          ],
        },
        {
          heading: 'Examples of Cookies',
          bullets: [
            'Type: Authentication | Purpose: Maintain login session and account security | Duration: Session / up to 30 days.',
            'Type: Preferences | Purpose: Save language, region, and UI settings | Duration: Persistent.',
            'Type: Analytics | Purpose: Understand usage patterns and improve performance | Duration: Varies (typically 30-90 days).',
          ],
        },
        {
          heading: 'Cookie Duration (Retention)',
          paragraphs: [
            'Cookies may be session-based (deleted when you close your browser) or persistent (stored for a defined period). The duration depends on the purpose of the cookie.',
          ],
        },
        {
          heading: 'Managing Your Choices',
          bullets: [
            'Use the cookie banner to accept all, reject non-essential, or customise categories.',
            'Use Settings → Privacy to update your preferences anytime.',
            'Most browsers allow you to block or delete cookies — note that strictly necessary cookies are required for login and security.',
            'If you disable certain cookies, some features of the Platform (such as login or saved preferences) may not function properly.',
            'Withdrawing consent does not affect processing already done before the withdrawal.',
            'We may store your cookie preferences and consent choices for compliance and audit purposes.',
          ],
        },
        {
          heading: 'Third-Party Cookies',
          paragraphs: [
            'Third-party service providers (such as analytics providers, payment gateways, and map services) may place cookies on your device when you interact with embedded features. These cookies are governed by the respective third parties\' privacy policies, and Rentage does not control their operation.',
            'For more information on how we process personal data collected through cookies, please refer to our Privacy Policy.',
          ],
        },
        {
          heading: 'Data Safety in Cookies',
          paragraphs: [
            'We do not store sensitive personal data such as passwords, OTPs, or full KYC documents in cookies.',
          ],
        },
        {
          heading: 'Do Not Track Signals',
          paragraphs: [
            'The Platform does not currently respond to "Do Not Track" browser signals. You can still control cookie preferences through our cookie banner and browser settings.',
          ],
        },
        {
          heading: 'Changes to This Policy',
          paragraphs: [
            'We may update this Cookie Policy from time to time. Material changes will be notified through email or in-app notice.',
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

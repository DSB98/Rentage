import LegalContentPage from '@/components/LegalContentPage';

export default function SupportPage() {
  return (
    <LegalContentPage
      title="Support"
      subtitle="Get help for account access, listings, KYC, subscriptions, and safety issues on Rentage."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'Rentage provides support for platform-related issues such as account access, listings, subscriptions, and safety concerns. We do not mediate or resolve disputes between Users or handle payments made between Users.',
        'Support is intended to help you use the Platform safely and effectively. For faster resolution, provide complete and accurate details when submitting a request.',
      ]}
      sections={[
        {
          heading: 'How to Contact Support',
          bullets: [
            'Email: support@rentage.in',
            'In-app Help / Report option',
            'Phone: +91 98765 43210',
            'Include your registered email/phone, relevant IDs (listing, inquiry, transaction), and a clear description of the issue.',
          ],
        },
        {
          heading: 'Response Time Expectations',
          paragraphs: [
            'We aim to acknowledge support requests within 24 hours.',
            'Resolution timelines may vary depending on the complexity of the issue, the availability of supporting evidence, and third-party dependencies (for example, payment gateways).',
          ],
        },
        {
          heading: 'Account & Login',
          paragraphs: [
            'Use the forgot password flow on login if you cannot access your account.',
            'If you are locked out due to verification issues, contact support with your registered email and phone.',
          ],
        },
        {
          heading: 'KYC & Verification Issues',
          bullets: [
            'If your KYC is pending or rejected, ensure documents are clear, valid, and not cropped.',
            'Ensure the name on your KYC document matches your profile details.',
            'Retry submission if prompted by the Platform.',
            'For persistent issues, contact support with your KYC reference ID and screenshots.',
          ],
        },
        {
          heading: 'Payments & Subscriptions',
          bullets: [
            'For payment failures or duplicate charges, first check payment status in your dashboard.',
            'Share transaction ID, payment date/time, and payment method for faster investigation.',
            'Refund-related queries should be sent to refunds@rentage.in in accordance with the Refund Policy.',
          ],
        },
        {
          heading: 'Listing & Inquiry Issues',
          paragraphs: [
            'If listing status or visibility looks incorrect, refresh dashboard and check policy compliance first.',
            'Ensure your listing complies with platform guidelines and is not flagged or restricted due to policy violations.',
            'For inquiry or chat sync issues, report listing ID, inquiry ID, and approximate time of issue for faster investigation.',
          ],
        },
        {
          heading: 'Safety & Abuse Reporting',
          paragraphs: [
            'Use report flows for suspicious users, fraudulent listings, or policy violations.',
            'Urgent safety concerns should be escalated immediately through support@rentage.in with clear context and screenshots.',
            'For serious fraud or financial loss, report to law-enforcement and your bank immediately. Rentage will cooperate with lawful requests from authorities.',
          ],
        },
        {
          heading: 'Escalation to Grievance Officer',
          paragraphs: [
            'If your issue is not resolved satisfactorily, you may escalate it to the Grievance Officer as defined in the Terms & Conditions.',
          ],
        },
        {
          heading: 'What Information to Include',
          bullets: [
            'Registered email and phone number.',
            'Listing ID, Inquiry ID, and/or Transaction ID (as applicable).',
            'Screenshots or supporting evidence.',
            'Date and time of the issue, with a short timeline of what happened.',
          ],
        },
        {
          heading: 'Misuse of Support Channels',
          paragraphs: [
            'Submitting false, misleading, abusive, or malicious support requests may result in restricted access to support services and account-level action under the Terms & Conditions.',
          ],
        },
        {
          heading: 'Support Limitations',
          bullets: [
            'Support is limited to platform-related issues.',
            'Rentage does not assist in negotiating deals between Users.',
            'Rentage does not recover payments made from one User to another.',
            'Rentage does not enforce private agreements between Users.',
          ],
        },
        {
          heading: 'Frequently Asked Questions',
          subSections: [
            {
              heading: 'Why is my listing not visible?',
              paragraphs: [
                'Listings may be hidden due to pending moderation, incomplete required details, expired plan limits, or policy flags. Check your dashboard status and update missing details before contacting support.',
              ],
            },
            {
              heading: 'Why was my account restricted?',
              paragraphs: [
                'Accounts may be restricted for policy violations, failed verification checks, unusual activity patterns, or unresolved compliance requirements. Contact support for the specific reason and next steps.',
              ],
            },
            {
              heading: 'How long does KYC take?',
              paragraphs: [
                'Most KYC requests are processed quickly, but timelines may vary depending on document quality, verification load, and additional checks required for safety or compliance.',
              ],
            },
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

import LegalContentPage from '@/components/LegalContentPage';

export default function DisclaimerPage() {
  return (
    <LegalContentPage
      title="Disclaimer"
      subtitle="A clear statement of what Rentage is, what it is not, and why every User must perform their own due diligence before paying any money or entering into any agreement with another User."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'This Disclaimer forms an integral part of the Terms & Conditions of Rentage. By accessing or using the Platform, you acknowledge and agree to the statements set out below.',
        'Rentage is a discovery-and-communication platform — a connector between Owners and Renters/Buyers. Rentage is NOT a party to any rental, lease, sale, deposit, refund, or other transaction between Users.',
        'Rentage does NOT collect, hold, escrow, or remit any rent, deposit, token money, sale price, or other amounts between Users. The only money Rentage receives is its own subscription, listing-promotion, or feature-unlock fees, paid through authorised gateways.',
        'Rentage does not act as an agent, broker, dealer, or representative of any User. No partnership, joint venture, or agency relationship is created between Rentage and any User.',
      ]}
      sections={[
        {
          heading: 'Use of the Platform is At Your Own Risk',
          paragraphs: [
            'Use of the Platform and any interaction with other Users is entirely at your own risk. Rentage does not control, supervise, or guarantee the conduct of any User, the accuracy of any listing, or the outcome of any communication, negotiation, or transaction between Users.',
            'You are solely responsible for your decisions, payments, agreements, and dealings with other Users on or off the Platform.',
          ],
        },
        {
          heading: 'No Endorsement of Listings or Users',
          bullets: [
            'Listings are created by third-party Owners and reflect their representations alone.',
            'Rentage does not generally inspect, photograph, value, or visit any listed asset.',
            'Any verification badge or indicator is provided for informational purposes only and must not be relied upon as proof of ownership, authenticity, legality, or legitimacy.',
            'The presence of a listing on Rentage is NOT a recommendation or endorsement by Rentage.',
          ],
        },
        {
          heading: 'Independent Due Diligence is Mandatory',
          paragraphs: [
            'Before paying ANY amount or signing ANY agreement with another User, you must independently verify all material facts.',
          ],
          bullets: [
            'Confirm the identity of the Owner and authority to rent/sell the asset.',
            'Physically inspect the asset and its actual condition.',
            'Review original ownership/title documents (RC, sale deed, allotment letter, lease, etc.).',
            'Confirm legality (society/RWA permission, RERA registration, GST/tax compliance, motor-insurance validity, etc.).',
            'Use written agreements, receipts, and invoices for any payment made.',
          ],
        },
        {
          heading: 'No Liability for User-to-User Disputes',
          paragraphs: [
            'Because Rentage acts only as a connector, Rentage is NOT responsible for and shall NOT be held liable for any matter arising out of or in connection with interactions or transactions between Users. This includes, without limitation, any direct or indirect loss, personal injury, property damage, financial loss, mental distress, third-party actions, or consequential, incidental, special, exemplary, or punitive damages arising from use of the Platform or interactions between Users.',
          ],
          bullets: [
            'Fraud, scams, misrepresentation, or false advertising by any User.',
            'Damage, loss, theft, accident, personal injury, or death arising from a listed asset.',
            'Any payment made to another User, including advance, deposit, token, rent, or sale price.',
            'Failure of either party to perform commitments under the deal.',
            'Disputes regarding deposits, refunds, repairs, returns, or damages.',
            'Tax, regulatory, or legal compliance failures by a User.',
            'Acts or omissions of any third party, including service providers, payment gateways, KYC vendors, and telecommunication providers.',
          ],
        },
        {
          heading: 'Data & Communication Risk',
          paragraphs: [
            'When you reveal your phone number, share contact information, or communicate through the Platform, the recipient User may use those details to contact you outside the Platform.',
            'Rentage is not responsible for any misuse of contact information shared between Users, including calls, messages, or communication occurring outside the Platform. Users are advised to exercise caution and to report misuse to support@rentage.in.',
          ],
        },
        {
          heading: 'Beware of Scams',
          bullets: [
            'Never share your password or OTP with anyone — Rentage will never ask for it.',
            'Be suspicious of any request to pay money before physically inspecting the asset.',
            'Be wary of pressure tactics ("act now", "many other buyers waiting", "send token immediately").',
            'Avoid making payments outside the platform to unknown UPI IDs, accounts, or wallets without verification.',
            'Avoid clicking suspicious links sent via chat, SMS, or WhatsApp.',
            'Report suspicious users or listings to support@rentage.in immediately.',
          ],
        },
        {
          heading: 'Cooperation with Authorities',
          paragraphs: [
            'If you suffer fraud or financial loss, please file a police complaint and contact your bank without delay. Rentage will cooperate with lawful requests from law-enforcement and regulators, and may share account, listing, and log data when required by law.',
          ],
        },
        {
          heading: 'No Professional Advice',
          paragraphs: [
            'Content on the Platform (blogs, FAQs, tooltips, descriptions, listing copy, and similar material) is for general information only and does not constitute legal, financial, tax, real-estate, or any other professional advice. Consult qualified professionals for advice tailored to your situation.',
          ],
        },
        {
          heading: 'Platform Content Accuracy',
          paragraphs: [
            'Rentage does not guarantee the accuracy, completeness, currency, or reliability of any content available on the Platform, including listings, prices, availability, descriptions, photographs, blogs, FAQs, and informational pages. Such content may contain errors, omissions, or out-of-date information and is provided without warranty of any kind.',
          ],
        },
        {
          heading: 'No Warranty of Outcomes',
          paragraphs: [
            'Rentage does not guarantee that you will successfully find, list, rent, sell, buy, or transact through the Platform, or that any subscription, listing, or feature will result in inquiries, leads, deals, or financial outcomes of any kind.',
          ],
        },
        {
          heading: 'Third-Party Links & Services',
          paragraphs: [
            'The Platform may contain links to, or integrate with, third-party websites, applications, or services (e.g., payment gateways, KYC providers, map providers, social-media networks). Rentage is not responsible for the content, policies, availability, or practices of any third-party website, service, or link accessed through the Platform. Use of such third-party services is at your own risk and subject to their own terms and policies.',
          ],
        },
        {
          heading: 'Service Availability',
          paragraphs: [
            'The Platform is provided on an "as is" and "as available" basis. Rentage does not guarantee uninterrupted, secure, or error-free operation. The Platform may be unavailable due to maintenance, upgrades, technical failures, third-party outages, or events beyond our control, and Rentage shall not be liable for any losses arising from such unavailability.',
          ],
        },
        {
          heading: 'Governing Law & Jurisdiction',
          paragraphs: [
            'This Disclaimer shall be governed by and interpreted in accordance with the laws of India, subject to the jurisdiction specified in the Terms & Conditions (courts at Pune, Maharashtra).',
          ],
        },
        {
          heading: 'Changes to this Disclaimer',
          paragraphs: [
            'Rentage may update this Disclaimer from time to time. Material changes will be communicated through email, in-app notice, or platform banner. Continued use of the Platform after the effective date of the updated Disclaimer constitutes acceptance of the updated version.',
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

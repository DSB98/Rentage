import LegalContentPage from '@/components/LegalContentPage';

export default function RefundPolicyPage() {
  return (
    <LegalContentPage
      title="Refund & Cancellation Policy"
      subtitle="This policy explains how subscription payments, listing fees, and feature charges are handled by Rentage."
      effectiveDate="Effective from: April 26, 2026"
      intro={[
        'Rentage charges money ONLY for its own subscription plans, listing-promotion add-ons, and feature unlocks. Rentage does NOT collect, hold, escrow, or refund any rent, deposit, sale price, or other money exchanged between Owners and Renters/Buyers — those flows happen directly between the Users.',
        'Accordingly, this Refund Policy applies strictly to amounts paid by Users to Rentage. For money paid to another User, please pursue the matter directly with that User and, where appropriate, with law-enforcement.',
      ]}
      sections={[
        {
          heading: 'Scope',
          bullets: [
            'Applies to: Rentage subscription plans, paid listing promotions, paid feature unlocks, and similar platform fees.',
            'Does NOT apply to: rent, security deposit, token money, sale price, or any other payment between Users — Rentage is not a party to those payments.',
          ],
        },
        {
          heading: 'Subscriptions Are Non-Refundable Once Activated',
          paragraphs: [
            'All subscription plans, listing promotions, and feature unlocks are provided on a prepaid basis and are non-refundable once activated, except in cases explicitly mentioned in this Policy or where required by applicable law.',
            'Activation occurs immediately upon successful payment or feature enablement, whichever is earlier.',
            'Cancelling auto-renewal stops future charges but does not refund the current billing period.',
            'No partial refunds or prorated credits will be issued for unused time, unused features, or early termination of a subscription.',
            'Rentage does not offer a cooling-off period after activation of digital services unless required by applicable law.',
          ],
        },
        {
          heading: 'Eligible Refund Scenarios',
          bullets: [
            'Duplicate payment — the same plan billed twice for the same period due to a gateway error.',
            'Successful debit on your bank but failed activation on Rentage that cannot be resolved within 7 working days.',
            'A verified and reproducible technical failure attributable solely to Rentage that completely prevents access to a paid feature for a continuous period, and which is not resolved within a reasonable time after being reported to Rentage support.',
            'Charges arising from proven unauthorised use of your payment instrument, reported promptly to your bank and to Rentage.',
          ],
          paragraphs: [
            'Temporary service interruptions, scheduled maintenance, or minor technical issues that do not completely prevent access to a paid feature do not qualify for refunds.',
            'Refunds will be processed only if the request is made by the original account holder and the payment is verified as successful and valid. Rentage reserves the right to deny refund requests that are incomplete, fraudulent, abusive, or in violation of these Terms.',
          ],
        },
        {
          heading: 'Non-Refundable Scenarios',
          bullets: [
            'Change of mind after activation.',
            'Failure to use the platform features included in your plan.',
            'Partial usage — unused days, features, or listing slots within an active billing period.',
            'Account suspension or termination due to violation of Terms or applicable law.',
            'Disputes with other Users (rent, deposits, sale price, condition of asset, etc.) — Rentage is only a connector and does not handle those funds.',
            'Promotional or discounted plans, unless explicitly marked refundable.',
            'Taxes charged at the time of purchase, except as required by law.',
          ],
        },
        {
          heading: 'Refund Mode',
          paragraphs: [
            'Approved refunds will be processed only to the original payment method used at the time of purchase and cannot be redirected to a different account, UPI ID, card, or payment mode.',
            'Processing time is 7–14 working days from approval, depending on your bank or payment gateway.',
          ],
        },
        {
          heading: 'Taxes',
          paragraphs: [
            'All fees are inclusive or exclusive of applicable taxes (including GST) as indicated at the time of purchase. Taxes once charged are non-refundable except as required by applicable law. Tax invoices/receipts are available in your account settings.',
          ],
        },
        {
          heading: 'Plan & Pricing Changes',
          paragraphs: [
            'Rentage may modify subscription pricing, features, or plans from time to time with reasonable notice. Such changes will apply to future billing cycles only and will not affect already-paid periods.',
          ],
        },
          bullets: [
            'Email refunds@rentage.in within 7 days of the charge with your registered email/phone, plan name, payment date, transaction ID, and reason.',
            'Our team reviews each request within 5–7 working days and may request additional information or evidence.',
            'Incomplete requests, or those made after the eligible window, will not be processed.',
          ],
        },
        {
          heading: 'Cancellation of Auto-Renewal',
          paragraphs: [
            'You can disable auto-renewal at any time from Settings → Subscription. Your plan will remain active until the end of the current billing period and will not renew thereafter.',
          ],
        },
        {
          heading: 'Chargebacks & Payment Disputes',
          paragraphs: [
            'If you initiate a chargeback or payment dispute with your bank or card issuer without first contacting Rentage, we reserve the right to suspend or restrict your account and recover any associated costs, fees, or penalties imposed by payment processors.',
            'We strongly encourage Users to contact refunds@rentage.in to resolve issues promptly before initiating a chargeback. Most legitimate issues can be resolved faster through direct communication than through a formal dispute.',
          ],
        },
        {
          heading: 'Fraud & Abuse of Refund Process',
          paragraphs: [
            'Rentage reserves the right to refuse refund requests in cases of suspected fraud, abuse of the refund process, repeated refund claims without valid grounds, or attempts to gain an unfair advantage. Accounts found to be misusing the refund system may be suspended.',
          ],
        },
        {
          heading: 'Updates to This Policy',
          paragraphs: [
            'We may update this Refund Policy from time to time. Material changes will be notified via email or in-app notice. Continued use after the effective date constitutes acceptance.',
          ],
        },
      ]}
      contactBlock={{
        email: 'refunds@rentage.in',
        phone: '+91 98765 43210',
        address: 'Rentage Billing Support, Pune, Maharashtra, India',
      }}
    />
  );
}

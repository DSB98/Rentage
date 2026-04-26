import LegalContentPage from '@/components/LegalContentPage';

export default function HelpPage() {
  return (
    <LegalContentPage
      title="Help Center"
      subtitle="Quick guides to start renting, listing, chatting, and closing transactions with confidence."
      sections={[
        {
          heading: 'For Renters',
          paragraphs: [
            'Browse by category or city, compare listing details, and use map direction tools before sending inquiries.',
            'Use in-app chat for negotiation and keep key terms documented before booking.',
          ],
        },
        {
          heading: 'For Owners',
          paragraphs: [
            'Create detailed listings with clear photos, accurate pricing, and proper location pins for better discovery.',
            'Respond to inquiries quickly and keep availability and terms updated to improve conversion.',
          ],
        },
        {
          heading: 'Best Practices',
          paragraphs: [
            'Always verify user identity and discuss pickup/return rules before final confirmation.',
            'Use transparent communication and written terms to avoid misunderstandings.',
          ],
        },
      ]}
    />
  );
}

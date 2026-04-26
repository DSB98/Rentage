import LegalContentPage from '@/components/LegalContentPage';

export default function ContactPage() {
  return (
    <LegalContentPage
      title="Contact Us"
      subtitle="Need help with listings, bookings, or account access? Our team is here to support you."
      sections={[
        {
          heading: 'Customer Support',
          paragraphs: [
            'Email: support@rentage.in',
            'Phone: +91 98765 43210',
            'Support hours: Monday to Saturday, 9:00 AM to 7:00 PM IST.',
          ],
        },
        {
          heading: 'Business & Partnerships',
          paragraphs: [
            'For partnership opportunities, write to partnerships@rentage.in.',
            'For press/media communication, write to media@rentage.in.',
          ],
        },
        {
          heading: 'Office Address',
          paragraphs: [
            'Rentage Technologies Private Limited',
            'India. Exact office details are shared for verified business requests only.',
          ],
        },
      ]}
    />
  );
}

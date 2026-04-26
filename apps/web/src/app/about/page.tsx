import LegalContentPage from '@/components/LegalContentPage';

export default function AboutPage() {
  return (
    <LegalContentPage
      title="About Rentage"
      subtitle="Rentage is a modern rental marketplace that helps people rent and list homes, vehicles, electronics, appliances, and more with confidence."
      effectiveDate="Last updated: April 26, 2026"
      intro={[
        'Rentage is built to make renting simpler, safer, and more accessible for everyday users. We help owners unlock value from underused assets and help renters find reliable options without unnecessary friction.',
        'From homes and vehicles to electronics and appliances, our focus is to deliver a trusted marketplace experience powered by transparency, responsible platform design, and user-first support.',
      ]}
      sections={[
        {
          heading: '1. Who We Are',
          paragraphs: [
            'We are building a trusted local renting ecosystem where owners can monetize idle assets and renters can discover relevant listings quickly and confidently.',
            'Our mission is to reduce wasteful ownership, improve asset utilization, and make temporary access more affordable, practical, and transparent for individuals and families.',
          ],
        },
        {
          heading: '2. What We Offer',
          paragraphs: [
            'Rentage offers category-based discovery, location-first search, in-platform chat, inquiry workflows, and booking support to reduce confusion and speed up decision-making.',
            'For owners, we provide tools to create and manage listings, monitor activity, respond to inquiries faster, and improve conversion through better visibility and structure.',
          ],
        },
        {
          heading: '3. Our Commitment',
          paragraphs: [
            'We prioritize user safety, platform reliability, and responsible handling of personal data across all user journeys.',
            'We continuously improve experience quality through stronger trust and safety systems, better listing relevance, clearer legal documentation, and transparent product communication.',
          ],
        },
        {
          heading: 'Important Notice',
          paragraphs: [
            'This page is provided for general informational purposes only. It should be read together with the Terms & Conditions, Privacy Policy, and other applicable Rentage policies.',
            'Nothing on this page constitutes legal advice. Users should consult qualified legal counsel for advice specific to their circumstances.',
          ],
        },
      ]}
    />
  );
}

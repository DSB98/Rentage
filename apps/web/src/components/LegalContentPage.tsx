'use client';

import Header from './Header';
import Footer from './Footer';

export type LegalSubSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  subSections?: LegalSubSection[];
};

type LegalContentPageProps = {
  title: string;
  subtitle: string;
  sections: LegalSection[];
  updatedAt?: string;
  effectiveDate?: string;
  intro?: string[];
  contactBlock?: { email?: string; phone?: string; address?: string };
};

export default function LegalContentPage({
  title,
  subtitle,
  sections,
  updatedAt = 'Last updated: April 26, 2026',
  effectiveDate,
  intro,
  contactBlock,
}: LegalContentPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="w-full bg-gradient-to-b from-primary-50/70 to-white px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-primary-200/60 bg-white p-6 shadow-card sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-800">{updatedAt}</p>
            {effectiveDate ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">{effectiveDate}</p>
            ) : null}
          </div>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-surface-500 sm:text-base">{subtitle}</p>

          {intro && intro.length > 0 ? (
            <div className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-sm leading-relaxed text-amber-900">
              {intro.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-8 space-y-6">
            {sections.map((section, sIdx) => (
              <section
                key={`${section.heading}-${sIdx}`}
                className="rounded-xl border border-surface-200 bg-surface-50/70 p-5 sm:p-6"
              >
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  <span className="mr-2 text-primary-700">{sIdx + 1}.</span>
                  {section.heading}
                </h2>

                {section.paragraphs && section.paragraphs.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {section.paragraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-sm leading-relaxed text-surface-700">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : null}

                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-surface-700">
                    {section.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {section.subSections && section.subSections.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {section.subSections.map((sub, idx) => (
                      <div key={idx} className="rounded-lg border border-surface-200 bg-white p-4">
                        {sub.heading ? (
                          <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{sub.heading}</h3>
                        ) : null}
                        {sub.paragraphs && sub.paragraphs.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {sub.paragraphs.map((paragraph, pIdx) => (
                              <p key={pIdx} className="text-sm leading-relaxed text-surface-700">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {sub.bullets && sub.bullets.length > 0 ? (
                          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-surface-700">
                            {sub.bullets.map((bullet, bIdx) => (
                              <li key={bIdx}>{bullet}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          {contactBlock ? (
            <div className="mt-8 rounded-xl border border-primary-200 bg-primary-50/60 p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Contact Us</h2>
              <p className="mt-2 text-sm leading-relaxed text-surface-700">
                For questions about this document or any compliance/legal request, please reach out:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-surface-700">
                {contactBlock.email ? (
                  <li>
                    <span className="font-medium text-slate-900">Email:</span> {contactBlock.email}
                  </li>
                ) : null}
                {contactBlock.phone ? (
                  <li>
                    <span className="font-medium text-slate-900">Phone:</span> {contactBlock.phone}
                  </li>
                ) : null}
                {contactBlock.address ? (
                  <li>
                    <span className="font-medium text-slate-900">Address:</span> {contactBlock.address}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <p className="mt-8 text-xs leading-relaxed text-surface-500">
            This document is provided for general informational purposes and does not constitute legal advice. Users
            are encouraged to consult qualified legal counsel for advice specific to their circumstances.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

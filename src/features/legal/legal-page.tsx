import { useEffect } from "react";
import { Footer } from "@/features/landing/components/footer";
import { Navbar } from "@/features/landing/components/navbar";
import "@/features/landing/styles/landing.css";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: Section[];
};

const lastUpdated = "14 July 2026";

function LegalPage({ eyebrow, title, introduction, sections }: LegalPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="vendify-landing min-h-screen bg-[#fafafb] font-sans text-slate-900 antialiased">
      <Navbar />
      <main className="px-4 pb-20 pt-32 sm:pb-24 sm:pt-40">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-slate-900/[0.08] pb-10">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{eyebrow}</p>
            <h1 className="mt-4 text-3xl font-medium tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">{introduction}</p>
            <p className="mt-5 text-xs text-slate-400">Last updated {lastUpdated}</p>
          </header>

          <div className="divide-y divide-slate-900/[0.06]">
            {sections.map((section, index) => (
              <section key={section.title} className="grid gap-4 py-8 sm:grid-cols-[2rem_1fr] sm:gap-6 sm:py-10">
                <p className="text-xs tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</p>
                <div>
                  <h2 className="text-lg font-medium text-slate-900">{section.title}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-3 text-[15px] leading-7 text-slate-600">{paragraph}</p>
                  ))}
                  {section.items && (
                    <ul className="mt-4 space-y-3 text-[15px] leading-7 text-slate-600">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span aria-hidden="true" className="mt-[0.7rem] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

const privacySections: Section[] = [
  { title: "Information we collect", paragraphs: ["We collect information you provide when you create an account, complete identity checks, contact support or use our services. This may include your name, contact details, account credentials, transaction PIN, payment information and any records required to provide regulated services."], items: ["Account and profile information", "Transaction, device and usage records", "Support messages and service preferences", "Identity or compliance information where required"] },
  { title: "How we use information", paragraphs: ["We use your information to operate your account, process requested transactions, prevent fraud, improve service reliability, provide support and meet legal or regulatory obligations. We do not sell your personal information." ] },
  { title: "How information is shared", paragraphs: ["We may share the minimum information necessary with payment processors, service providers, network operators, compliance partners and authorities where required by law. Providers acting for us must handle information only for the agreed purpose and with appropriate safeguards."] },
  { title: "Storage and security", paragraphs: ["We use reasonable administrative, technical and organisational measures to protect personal information. No system is completely secure, so you should keep your password and transaction PIN private and contact us promptly if you suspect unauthorised access." ] },
  { title: "Retention", paragraphs: ["We retain information for as long as your account is active and for any additional period needed to resolve disputes, prevent fraud, comply with financial record-keeping rules or meet other legal obligations. Information is deleted or anonymised when it is no longer required." ] },
  { title: "Your choices and rights", paragraphs: ["You may ask to access, correct or delete eligible personal information, object to certain uses, or withdraw consent where processing depends on consent. Some records may need to be retained for legal, security or transaction-integrity reasons." ] },
  { title: "Cookies and similar technology", paragraphs: ["We use essential browser storage and similar technologies to keep you signed in, protect sessions and remember preferences. Where optional analytics are used, they help us understand and improve the service." ] },
  { title: "Contact", paragraphs: ["Questions or requests about this policy can be sent to the support email shown in the footer. We may verify your identity before completing a privacy request." ] },
];

const termsSections: Section[] = [
  { title: "Using the service", paragraphs: ["By creating an account or using the service, you agree to these terms. You must be legally able to enter into this agreement and provide information that is accurate, current and complete." ] },
  { title: "Your account", paragraphs: ["You are responsible for activity authorised through your account and for protecting your password, transaction PIN and devices. Notify support immediately if you believe your account has been compromised. We may request verification before restoring access or processing sensitive requests." ] },
  { title: "Transactions", paragraphs: ["Review the recipient, network, product and amount carefully before confirming a transaction. Once a digital product has been delivered or a bill-payment instruction has been accepted by the relevant provider, it may not be possible to reverse it." ] },
  { title: "Fees and pricing", paragraphs: ["Applicable prices and fees are displayed before confirmation. Provider pricing, taxes or network charges may change. The amount shown at confirmation is the amount that applies to that transaction unless an obvious technical error has occurred." ] },
  { title: "Acceptable use", items: ["Do not use the service for fraud, unlawful activity or to interfere with another person’s account.", "Do not attempt to bypass security controls, limits or identity checks.", "Do not copy, misuse or reverse engineer the service except where the law expressly permits it."] },
  { title: "Availability", paragraphs: ["We work to keep the service available, but access may be interrupted by maintenance, provider outages, network failures or events outside our reasonable control. We may change or discontinue a feature where necessary and will provide notice when reasonably possible." ] },
  { title: "Suspension and closure", paragraphs: ["We may restrict or close an account where required by law, to protect users or the platform, or where these terms are materially breached. You may stop using the service at any time, subject to pending transactions and record-retention obligations." ] },
  { title: "Liability", paragraphs: ["To the extent permitted by law, we are not responsible for indirect losses, provider outages or losses caused by incorrect details submitted by you. Nothing in these terms excludes rights or liability that cannot lawfully be excluded." ] },
  { title: "Changes and contact", paragraphs: ["We may update these terms as the service or legal requirements change. Material updates will be communicated through the service or another appropriate channel. Questions can be sent to the support email in the footer." ] },
];

const refundSections: Section[] = [
  { title: "When a refund may apply", paragraphs: ["A refund may be available when we debit your wallet or payment method but the requested service is not delivered, when a transaction fails after payment, or when a confirmed duplicate charge results from a technical issue." ] },
  { title: "Completed digital services", paragraphs: ["Airtime, data, subscription tokens and other digital products are generally final once successfully delivered to the details you supplied. We cannot usually refund a completed transaction sent to an incorrect phone number, meter, smartcard or other recipient identifier." ] },
  { title: "Pending transactions", paragraphs: ["Provider responses can occasionally be delayed. A pending transaction must be allowed a reasonable reconciliation period before it can be treated as failed. Please do not repeat the purchase unless the first transaction is confirmed as failed." ] },
  { title: "How to request a review", paragraphs: ["Contact support using the email shown in the footer and include your account details, transaction reference, date, amount and a short description of the issue. Never send your password or transaction PIN." ] },
  { title: "Review and processing", paragraphs: ["We will check our records and, where necessary, confirm the outcome with the relevant provider. Approved wallet-funded refunds are normally returned to the original wallet. Card or bank refunds are returned through the original payment channel where possible and may take additional time to appear." ] },
  { title: "Non-refundable items", items: ["Services confirmed as delivered to the recipient details entered at checkout", "Charges arising from incorrect information supplied by the customer", "Promotional credits, bonuses or rewards that have no cash value", "Requests involving fraud, abuse or a breach of the terms of service"] },
  { title: "Chargebacks", paragraphs: ["Please contact support before raising a chargeback so we can investigate promptly. A chargeback opened for a service that was delivered may lead to account restrictions while the matter is reviewed." ] },
  { title: "Contact", paragraphs: ["If you are unsure whether a transaction qualifies, contact support using the email in the footer. Your statutory consumer rights are not affected by this policy." ] },
];

export function PrivacyPolicyPage() {
  return <LegalPage eyebrow="Legal" title="Privacy policy" introduction="This policy explains what information we collect, why we use it and the choices available to you when you use our platform." sections={privacySections} />;
}

export function TermsOfServicePage() {
  return <LegalPage eyebrow="Legal" title="Terms of service" introduction="These terms set out the rules for using our platform and help keep transactions clear, secure and dependable for everyone." sections={termsSections} />;
}

export function RefundPolicyPage() {
  return <LegalPage eyebrow="Legal" title="Refund policy" introduction="This policy explains when a transaction may qualify for a refund, how reviews are handled and what information we need from you." sections={refundSections} />;
}

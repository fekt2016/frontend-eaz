import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy | EazWorld",
  description:
    "How EazWorld collects, uses, and protects your personal information — our privacy policy for users in Ghana and beyond.",
  path: "/privacy",
});

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "We collect information you provide directly to us when you use our services, including:",
      "• Contact information: name, email address, phone number, and company name when you fill out forms on our website.",
      "• Account information: username and password when you create an account.",
      "• Payment information: billing details processed securely through Paystack. We do not store card numbers.",
      "• Communications: messages you send us via contact forms or email.",
      "We also collect information automatically through your use of our website:",
      "• Log data: IP address, browser type, pages visited, and time spent.",
      "• Cookies: small files stored on your device to improve your experience (see section 5).",
      "• Analytics data: aggregated usage data via Google Analytics.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "We use the information we collect to:",
      "• Provide, maintain, and improve our services.",
      "• Process transactions and send related information including confirmations.",
      "• Send administrative messages, updates, and security alerts.",
      "• Respond to your comments, questions, and requests.",
      "• Send marketing communications (only with your consent — you may opt out at any time).",
      "• Monitor and analyse trends to improve the website experience.",
      "• Comply with legal obligations.",
    ],
  },
  {
    title: "3. Data Sharing and Disclosure",
    content: [
      "We do not sell, trade, or rent your personal information to third parties. We may share your data only in the following circumstances:",
      "• Service providers: Trusted third parties who assist us in operating our website (e.g., Paystack for payments, Cloudinary for image hosting, MongoDB Atlas for data storage). These providers are contractually bound to protect your data.",
      "• Legal requirements: When required by law, subpoena, or other legal processes.",
      "• Business transfers: In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred.",
      "• With your consent: For any other purpose with your explicit consent.",
    ],
  },
  {
    title: "4. Data Security",
    content: [
      "We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction. These include:",
      "• HTTPS encryption for all data transmission.",
      "• Bcrypt hashing for stored passwords.",
      "• JWT-based authentication with httpOnly cookies.",
      "• Regular security reviews and updates.",
      "No method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.",
    ],
  },
  {
    title: "5. Cookies",
    content: [
      "We use cookies to:",
      "• Keep you logged in during your session.",
      "• Remember your preferences.",
      "• Analyse site traffic (Google Analytics).",
      "You can control cookies through your browser settings. Disabling cookies may affect the functionality of certain features on our website.",
      "Types of cookies we use:",
      "• Essential cookies: Required for the site to function (e.g., authentication).",
      "• Analytics cookies: Help us understand how visitors use the site (Google Analytics — anonymised).",
    ],
  },
  {
    title: "6. Third-Party Services",
    content: [
      "Our website integrates with the following third-party services, each with their own privacy policies:",
      "• Paystack (payment processing) — paystack.com/privacy",
      "• Google Analytics (website analytics) — policies.google.com/privacy",
      "• Cloudinary (image hosting) — cloudinary.com/privacy",
      "• Namecheap (domain registration) — namecheap.com/legal/privacy-policy",
      "We are not responsible for the privacy practices of these third-party services.",
    ],
  },
  {
    title: "7. Your Rights",
    content: [
      "You have the right to:",
      "• Access: Request a copy of the personal data we hold about you.",
      "• Correction: Request correction of inaccurate or incomplete data.",
      "• Deletion: Request deletion of your personal data (subject to legal obligations).",
      "• Opt-out: Unsubscribe from marketing emails at any time using the link in any email.",
      "• Data portability: Receive your data in a commonly used format.",
      "To exercise any of these rights, contact us at info@eazworld.co.",
    ],
  },
  {
    title: "8. Data Retention",
    content: [
      "We retain your personal information for as long as necessary to provide our services and comply with our legal obligations. Specifically:",
      "• Account data is retained while your account is active.",
      "• Contact form submissions are retained for 2 years.",
      "• Transaction records are retained for 7 years as required by Ghanaian financial regulations.",
      "You may request deletion of your data at any time (see section 7).",
    ],
  },
  {
    title: "9. Children's Privacy",
    content: [
      "Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. We will notify you of significant changes by:",
      "• Posting the new policy on this page with an updated date.",
      "• Sending an email notification (for registered users).",
      "Your continued use of our services after any changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "11. Contact Us",
    content: [
      "For questions about this Privacy Policy or to exercise your rights:",
      "Email: info@eazworld.co",
      "Address: E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra, Ghana",
      "Phone: +233 24 438 8190 / +233 23 522 2207",
      "We aim to respond to all privacy inquiries within 30 days.",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="bg-paper dark:bg-ink text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <div className="mb-10">
          <Link href="/" className="text-gray-600 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition text-sm">← Back to Home</Link>
        </div>
        <h1 className="font-display font-bold text-4xl text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-slate-500 text-sm mb-2">Last updated: 1 May 2025</p>
        <p className="text-gray-500 dark:text-slate-400 mb-10 leading-relaxed">
          EazWorld (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard data when you use our website at eazworld.com and our services.
        </p>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">{section.title}</h2>
              <div className="space-y-2">
                {section.content.map((line, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${line.startsWith("•") ? "text-gray-500 dark:text-slate-400 pl-4" : "text-gray-700 dark:text-slate-300"}`}>
                    {line}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-center">
          <p className="text-gray-900 dark:text-white font-semibold mb-1">Have a privacy concern?</p>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">We take data privacy seriously. Contact us and we&apos;ll respond within 30 days.</p>
          <Link href="/contact" className="px-5 py-2.5 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition text-sm">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

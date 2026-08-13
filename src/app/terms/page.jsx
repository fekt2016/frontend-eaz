import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service | EazWorld",
  description:
    "The terms and conditions governing your use of EazWorld's website, hosting, domain, and digital services in Ghana.",
  path: "/terms",
});

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using the EazWorld website (eazworld.com) or any of our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
      "We reserve the right to modify these terms at any time. Continued use of our services following any changes constitutes acceptance of the revised terms.",
    ],
  },
  {
    title: "2. Use of Services",
    content: [
      "You agree to use our services only for lawful purposes and in accordance with these terms. You agree not to:",
      "• Use our services in any way that violates any applicable local, national, or international law or regulation.",
      "• Transmit any unsolicited or unauthorised advertising or promotional material.",
      "• Attempt to gain unauthorised access to any part of our website or systems.",
      "• Interfere with or disrupt the integrity or performance of our services.",
      "• Upload or transmit viruses or any other malicious code.",
      "• Use our services to collect or harvest personal data from other users.",
    ],
  },
  {
    title: "3. Account Registration",
    content: [
      "To access certain features of our services, you may need to register an account. You agree to:",
      "• Provide accurate, current, and complete information during registration.",
      "• Maintain and promptly update your account information.",
      "• Keep your password secure and confidential.",
      "• Accept responsibility for all activities that occur under your account.",
      "• Notify us immediately of any unauthorised use of your account.",
      "We reserve the right to suspend or terminate accounts that violate these terms.",
    ],
  },
  {
    title: "4. Services and Payments",
    content: [
      "EazWorld provides web design, hosting, domain registration, digital marketing, and phone repair services.",
      "Payment Terms:",
      "• All prices are displayed in Ghanaian Cedis (GHS) or US Dollars (USD) where specified.",
      "• Payments are processed securely via Paystack.",
      "• Hosting and recurring services are billed on the cycle selected at purchase.",
      "• Domain registrations are non-refundable once processed.",
      "• Service fees are non-refundable except as specified in our refund policy.",
      "Hosting Services:",
      "• Hosting services are subject to our Acceptable Use Policy.",
      "• We reserve the right to suspend services for non-payment or violations of our policies.",
      "• Uptime guarantees are subject to our Service Level Agreement (SLA).",
    ],
  },
  {
    title: "5. Intellectual Property",
    content: [
      "EazWorld Content: All content on this website — including text, graphics, logos, icons, images, and software — is the property of EazWorld or its content suppliers and is protected by copyright laws.",
      "Client Work: For custom projects, upon full payment of fees, the client receives ownership of the final deliverables. EazWorld retains the right to display the work in our portfolio unless otherwise agreed in writing.",
      "Third-Party Content: Some content may be licensed from third parties. Use of such content outside of our services may require separate licensing.",
      "You may not reproduce, distribute, or create derivative works from our content without express written permission.",
    ],
  },
  {
    title: "6. Disclaimer of Warranties",
    content: [
      "Our services are provided on an 'as is' and 'as available' basis without warranties of any kind, either express or implied, including but not limited to:",
      "• Warranties of merchantability or fitness for a particular purpose.",
      "• Warranties that our services will be uninterrupted, timely, secure, or error-free.",
      "• Warranties regarding the accuracy or reliability of any content.",
      "We do not guarantee specific results from SEO, paid advertising, or other marketing services. Results depend on many factors outside our control.",
    ],
  },
  {
    title: "7. Limitation of Liability",
    content: [
      "To the fullest extent permitted by law, EazWorld shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:",
      "• Your use of or inability to use our services.",
      "• Unauthorised access to or alteration of your data.",
      "• Any bugs, viruses, or other harmful code transmitted through our services.",
      "• Any errors or omissions in our content.",
      "Our total liability to you for any claims arising from the use of our services shall not exceed the amount you paid us in the three months preceding the claim.",
    ],
  },
  {
    title: "8. Indemnification",
    content: [
      "You agree to defend, indemnify, and hold harmless EazWorld, its officers, directors, employees, and agents from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from:",
      "• Your use of our services.",
      "• Your violation of these terms.",
      "• Your violation of any third-party rights, including intellectual property or privacy rights.",
    ],
  },
  {
    title: "9. Third-Party Links",
    content: [
      "Our website may contain links to third-party websites. These links are provided for your convenience only. EazWorld has no control over the content of those sites and accepts no responsibility for them or for any loss or damage that may arise from your use of them.",
    ],
  },
  {
    title: "10. Governing Law",
    content: [
      "These terms shall be governed by and construed in accordance with the laws of the Republic of Ghana.",
      "Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of Ghana.",
      "We encourage you to contact us first to resolve any disputes informally before pursuing legal action.",
    ],
  },
  {
    title: "11. Termination",
    content: [
      "We may terminate or suspend your access to our services immediately, without prior notice, for conduct that:",
      "• Violates these terms.",
      "• Is harmful to other users, us, or third parties.",
      "• Violates any applicable laws.",
      "Upon termination, your right to use our services will immediately cease. Provisions that by their nature should survive termination will do so, including ownership provisions, warranty disclaimers, and limitations of liability.",
    ],
  },
  {
    title: "12. Contact Information",
    content: [
      "For questions about these Terms of Service:",
      "Email: info@eazworld.co",
      "Address: E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra, Ghana",
      "Phone: +233 24 438 8190 / +233 23 522 2207",
    ],
  },
];

export default function Terms() {
  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <div className="mb-10">
          <Link href="/" className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition text-sm">← Back to Home</Link>
        </div>
        <h1 className="font-display font-bold text-4xl text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">Last updated: 1 May 2025</p>
        <p className="text-gray-500 dark:text-slate-400 mb-10 leading-relaxed">
          Please read these Terms of Service carefully before using EazWorld&apos;s website or services. By using our services, you agree to be bound by these terms.
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

        <div className="mt-12 flex flex-wrap gap-4 justify-center text-xs text-gray-400 dark:text-slate-500">
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Privacy Policy</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Contact Us</Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Home</Link>
        </div>
      </div>
    </div>
  );
}

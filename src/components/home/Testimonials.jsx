const testimonials = [
  {
    quote: "EazWorld redesigned our website and we started getting enquiries within the first week. Professional, fast, and exactly what we asked for.",
    name: "A. Mensah",
    role: "CEO, TechStart Ghana",
    service: "Web Design",
    stars: 5,
    initials: "AM",
  },
  {
    quote: "Our Google rankings improved significantly after 3 months of SEO work. The monthly reports are clear and our organic traffic has doubled.",
    name: "K. Owusu",
    role: "Founder, Owusu Ventures",
    service: "SEO",
    stars: 5,
    initials: "KO",
  },
  {
    quote: "Fixed my cracked iPhone screen in under 2 hours. Great quality, fair price, and they even cleaned the phone before returning it.",
    name: "E. Boateng",
    role: "Accra",
    service: "Phone Repair",
    stars: 5,
    initials: "EB",
  },
  {
    quote: "Thought my Samsung was gone after water damage. They recovered it and all my data. I couldn't believe it. Highly recommended.",
    name: "S. Addo",
    role: "Tema",
    service: "Phone Repair",
    stars: 5,
    initials: "SA",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Reviews</p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white border border-gray-100 rounded-2xl p-7">
              <p className="text-amber-400 text-sm mb-4">{"★".repeat(t.stars)}</p>
              <p className="text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role} · {t.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

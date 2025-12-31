/**
 * Testimonials section
 */

interface Testimonial {
  name: string;
  role: string;
  feedback: string;
  avatar?: string;
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      name: "Eric Sugru",
      role: "Atlas Restaurants, US",
      feedback:
        "DNB helped me get my business online within a day. Now customers can find and contact us directly — it's made a huge difference.",
      avatar: "https://i.pravatar.cc/100?img=15",
    },
    {
      name: "Priya Nair",
      role: "San Pedro Fish Market, US",
      feedback:
        "The dashboard is super easy to use. Managing my listings, payments, and analytics all in one place saves me hours every week.",
      avatar: "https://i.pravatar.cc/100?img=47",
    },
    {
      name: "Larry Plotnick",
      role: "Nordstrom, US",
      feedback:
        "We started with the basic plan and quickly upgraded. DNB's support team and platform quality are top-notch — highly recommended!",
      avatar: "https://i.pravatar.cc/100?img=23",
    },
  ];

  return (
    <section className="py-20">
      {/* Heading */}
      <h2 className="mb-12 text-center text-5xl font-bold text-foreground">
        What Our Users Say
      </h2>

      {/* Testimonials Grid */}
      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="rounded-xl border border-border bg-card p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/50"
          >
            {/* Quote */}
            <div className="mb-4 text-3xl text-primary font-serif">"</div>

            {/* Feedback */}
            <p className="mb-6 text-sm text-muted-foreground sm:text-base leading-relaxed">
              {t.feedback}
            </p>

            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              {t.avatar && (
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-border shadow-sm"
                />
              )}
              <div>
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

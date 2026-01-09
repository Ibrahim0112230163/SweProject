"use client"

interface Testimonial {
  id: string
  name: string
  title: string
  role: string
  quote: string
  image_url?: string
}

export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Trusted by Students, Educators, and Recruiters
        </h2>
        <p className="text-slate-600">Hear what our users have to say about their journey with Skill+</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition">
            <div className="mb-6">
              {testimonial.image_url && (
                <img
                  src={testimonial.image_url || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
            </div>
            <p className="text-slate-700 mb-6 italic">"{testimonial.quote}"</p>
            <div>
              <p className="font-bold text-slate-900">{testimonial.name}</p>
              <p className="text-sm text-slate-600">{testimonial.title}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

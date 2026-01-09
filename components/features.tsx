"use client"

interface Feature {
  id: string
  name: string
  description: string
  icon?: string
}

const iconMap: { [key: string]: string } = {
  radar: "📊",
  briefcase: "💼",
  users: "👥",
  "trending-up": "📈",
}

export default function Features({ features }: { features: Feature[] }) {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 rounded-lg">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Unlock Your Full Potential</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Skill+ offers a comprehensive suite of tools designed to help you identify, analyze, and bridge your gaps
          effectively.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <div key={feature.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-4">{iconMap[feature.icon || "radar"] || "⭐"}</div>
            <h3 className="font-bold text-slate-900 mb-2">{feature.name}</h3>
            <p className="text-slate-600 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

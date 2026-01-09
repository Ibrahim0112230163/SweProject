"use client"

export default function PathSection() {
  const steps = [
    {
      title: "Assess Your Skills",
      description: "Complete our comprehensive assessment to build a detailed profile of your current abilities.",
      icon: "1️⃣",
    },
    {
      title: "Analyze The Gaps",
      description: "Our AI analyzes your profile against industry standards and job roles to pinpoint key skill gaps.",
      icon: "2️⃣",
    },
    {
      title: "Map Your Career",
      description: "Get a personalized roadmap with learning resources and career paths tailored to your goals.",
      icon: "3️⃣",
    },
  ]

  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-4">
        A Clear Path to Your Dream Career
      </h2>
      <p className="text-center text-slate-600 mb-16 max-w-2xl mx-auto">
        Our streamlined process makes it simple to understand where you are, where you want to go, and exactly how to
        get there. Follow these simple steps to unlock your potential.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold">
                {step.icon}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

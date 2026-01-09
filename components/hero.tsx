"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            AI-Driven Skill-Gap Detection & Career Mapping
          </h1>
          <p className="text-lg text-slate-600">
            Empower yourself to find and fill your skill gaps for future success. Our platform provides the tools you
            need for ultimate career clarity.
          </p>
          <div className="flex gap-4">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="w-full aspect-square bg-amber-700 rounded-3xl shadow-lg overflow-hidden">
            <img
              src="/abstract-circular-pattern-orange-brown.jpg"
              alt="Skill gap visualization"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

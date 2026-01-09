"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 md:p-16 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Take Control of Your Professional Future</h2>
        <p className="text-lg mb-8 opacity-90">
          Ready to close your skill gap and unlock new career opportunities? Join Skill+ today and start building your
          roadmap to success.
        </p>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-8 py-3" asChild>
          <Link href="/auth/sign-up">Get Started for Free</Link>
        </Button>
      </div>
    </section>
  )
}

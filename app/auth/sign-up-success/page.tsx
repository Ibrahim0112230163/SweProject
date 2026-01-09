"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <span className="text-3xl">✓</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
        <p className="text-slate-600 mb-8">
          We've sent you a confirmation link. Please check your email to verify your account and get started with
          Skill+.
        </p>

        <Button className="bg-teal-500 hover:bg-teal-600 text-white w-full mb-4" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}

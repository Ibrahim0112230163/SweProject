"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export default function Header() {
  const loginButtonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // Auto-focus the login button when the component mounts
    if (loginButtonRef.current) {
      loginButtonRef.current.focus()
    }
  }, [])

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <span className="text-slate-900">Skill+</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="#features" className="hover:text-slate-900 transition">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-slate-900 transition">
              How It Works
            </Link>
            <Link href="#pricing" className="hover:text-slate-900 transition">
              Pricing
            </Link>
            <Link href="#contact" className="hover:text-slate-900 transition">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Button variant="ghost" asChild>
                <Link href="/auth/login" ref={loginButtonRef}>Student Login</Link>
              </Button>
              {/* Dropdown for other login types */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link 
                  href="/auth/login/teacher" 
                  className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg transition-colors"
                >
                  👨‍🏫 Teacher Login
                </Link>
                <Link 
                  href="/auth/login/industry" 
                  className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg transition-colors border-t border-slate-100"
                >
                  🏢 Industry Login
                </Link>
              </div>
            </div>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

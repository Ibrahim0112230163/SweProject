"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚡</span>
              </div>
              <span>Skill+</span>
            </Link>
            <p className="text-slate-400 text-sm">Your personal guide to career success and skill development.</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Updates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
          <p>© 2026 Skill+. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition">
              Twitter
            </Link>
            <Link href="#" className="hover:text-white transition">
              LinkedIn
            </Link>
            <Link href="#" className="hover:text-white transition">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

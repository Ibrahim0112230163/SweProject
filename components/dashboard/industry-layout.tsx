"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Footer from "@/components/footer"
import { FloatingAIChat } from "@/components/ai-chat"

interface IndustryProfile {
  id: string
  company_name: string | null
  email: string | null
  logo_url: string | null
  industry_type: string | null
}

interface IndustryLayoutProps {
  industryProfile: IndustryProfile | null
  children: React.ReactNode
}

export default function IndustryLayout({ industryProfile, children }: IndustryLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { label: "Dashboard", icon: "📊", href: "/dashboard/industry", active: pathname === "/dashboard/industry" },
    { label: "Post Job", icon: "➕", href: "/dashboard/industry/post-job", active: pathname === "/dashboard/industry/post-job" },
    { label: "My Jobs", icon: "💼", href: "/dashboard/industry/jobs", active: pathname === "/dashboard/industry/jobs" },
    { label: "Applications", icon: "📋", href: "/dashboard/industry/applications", active: pathname === "/dashboard/industry/applications" },
    { label: "Analytics", icon: "📈", href: "/dashboard/industry/analytics", active: pathname === "/dashboard/industry/analytics" },
    { label: "Company Profile", icon: "🏢", href: "/dashboard/industry/profile", active: pathname === "/dashboard/industry/profile" },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/dashboard/industry" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
              🏭
            </div>
            <span className="text-slate-900">Industry Portal</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active ? "bg-orange-50 text-orange-600 font-medium" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Company Card */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {industryProfile?.logo_url ? (
                <img
                  src={industryProfile.logo_url}
                  alt={industryProfile.company_name || "Company"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-orange-200"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  {industryProfile?.company_name?.[0]?.toUpperCase() || "C"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{industryProfile?.company_name || "Company"}</p>
                <p className="text-xs text-slate-600 truncate">{industryProfile?.email}</p>
              </div>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="w-full text-xs bg-transparent">
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
        <Footer />
      </main>
      <FloatingAIChat />
    </div>
  )
}

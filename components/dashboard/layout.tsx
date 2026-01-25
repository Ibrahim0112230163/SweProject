"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Footer from "@/components/footer"
import { FloatingAIChat } from "@/components/ai-chat"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface DashboardLayoutProps {
  userProfile: UserProfile | null

  children: React.ReactNode
}

export default function DashboardLayout({ userProfile, children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { label: "Dashboard", icon: "📊", href: "/dashboard", active: pathname === "/dashboard" },
    { label: "Profile", icon: "👤", href: "/dashboard/profile", active: pathname === "/dashboard/profile" },
    { label: "Challenges", icon: "🏆", href: "/dashboard/challenges", active: pathname?.startsWith("/dashboard/challenges") },
    { label: "Jobs", icon: "💼", href: "/dashboard/jobs", active: pathname === "/dashboard/jobs" },
    { label: "Courses", icon: "📚", href: "/dashboard/courses", active: pathname === "/dashboard/courses" },
    { label: "Projects", icon: "🎯", href: "/dashboard/projects", active: pathname === "/dashboard/projects" },
    { label: "Messages", icon: "✉️", href: "/dashboard/messages", active: pathname === "/dashboard/messages" },
    { label: "Collaboration", icon: "🤝", href: "/dashboard/collaboration", active: pathname === "/dashboard/collaboration" },
  ]

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold">
              ⚡
            </div>
            <span className="text-slate-900">SkillRadar</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${item.active ? "bg-cyan-50 text-teal-600 font-medium" : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt={userProfile.name || "User"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-teal-200"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  {userProfile?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{userProfile?.name || "User"}</p>
                <p className="text-xs text-slate-600 truncate">{userProfile?.email}</p>
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

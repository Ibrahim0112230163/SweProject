"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  CheckCircle2, 
  MessageSquare, 
  Settings, 
  LogOut,
  Trophy,
  Plus,
  FileText
} from "lucide-react"
import type { IndustryExpert } from "@/types/profile"

interface IndustryLayoutProps {
  children: React.ReactNode
  expert?: IndustryExpert | null
}

export default function IndustryLayout({ children, expert = null }: IndustryLayoutProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("industry_session")
    localStorage.removeItem("industry_expert_id")
    localStorage.removeItem("industry_company_name")
    router.push("/auth/login/industry")
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard/industry", icon: LayoutDashboard },
    { name: "Job Postings", href: "/dashboard/industry/jobs", icon: Briefcase },
    { name: "Tests", href: "/dashboard/industry/tests", icon: FileText },
    { name: "Skill Validations", href: "/dashboard/industry/validations", icon: CheckCircle2 },
    { name: "Candidates", href: "/dashboard/industry/candidates", icon: Users },
    { name: "Messages", href: "/dashboard/industry/messages", icon: MessageSquare },
    { name: "Settings", href: "/dashboard/industry/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-lg z-50">
        {/* Logo/Company Section */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Skill+ Industry</h2>
              <p className="text-xs text-slate-500">Partner Portal</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-semibold text-blue-900 truncate">
              {expert?.company_name || "Company"}
            </p>
            <p className="text-xs text-blue-600 truncate">{expert?.contact_person}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 cursor-pointer group">
                  <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-4 right-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

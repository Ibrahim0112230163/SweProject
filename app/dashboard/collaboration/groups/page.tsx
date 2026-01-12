"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Lock, Unlock, ArrowRight, Copy, Check } from "lucide-react"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface Group {
  id: string
  group_code: string
  title: string
  description: string | null
  creator_id: string
  status: "open" | "closed"
  max_members: number
  created_at: string
  member_count?: number
  is_member?: boolean
  is_admin?: boolean
}

export default function GroupsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchByCode, setSearchByCode] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "my">("my")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setUserProfile(profileData)

        // Fetch all groups
        const { data: allGroupsData, error: groupsError } = await supabase
          .from("groups")
          .select("*")
          .order("created_at", { ascending: false })

        if (groupsError) throw groupsError

        // Fetch member counts and user's membership status
        if (allGroupsData) {
          const groupsWithMembers = await Promise.all(
            allGroupsData.map(async (group) => {
              // Get member count
              const { count } = await supabase
                .from("group_members")
                .select("*", { count: "exact", head: true })
                .eq("group_id", group.id)

              // Check if user is member
              const { data: memberData } = await supabase
                .from("group_members")
                .select("*")
                .eq("group_id", group.id)
                .eq("user_id", user.id)
                .single()

              return {
                ...group,
                member_count: count || 0,
                is_member: !!memberData,
                is_admin: memberData?.role === "admin",
              }
            })
          )

          setGroups(groupsWithMembers)
          setMyGroups(groupsWithMembers.filter((g) => g.is_member))
        }
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, router])

  const handleSearchByCode = async () => {
    if (!searchByCode.trim()) return

    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("group_code", searchByCode.toUpperCase())
        .single()

      if (error) {
        alert("Group not found with that code")
        return
      }

      router.push(`/dashboard/collaboration/groups/${data.id}`)
    } catch (error) {
      console.error("Error searching group:", error)
      alert("Failed to search group")
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredGroups =
    activeTab === "my"
      ? myGroups.filter(
          (group) =>
            group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.group_code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : groups.filter(
          (group) =>
            group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.group_code.toLowerCase().includes(searchQuery.toLowerCase())
        )

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading groups...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Project Groups</h1>
            <p className="text-slate-600 mt-1">Collaborate with others on projects. Join or create a group.</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/collaboration/groups/create")}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>

        {/* Search by Code */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Join by Group Code</CardTitle>
            <CardDescription>Enter a group code (e.g., ZXDFETPR) to find and join a group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter group code..."
                value={searchByCode}
                onChange={(e) => setSearchByCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleSearchByCode()}
                className="flex-1"
                maxLength={8}
              />
              <Button onClick={handleSearchByCode} className="bg-teal-500 hover:bg-teal-600 text-white">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "my"
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              My Groups ({myGroups.length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "all"
                  ? "border-b-2 border-teal-500 text-teal-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Groups ({groups.length})
            </button>
          </div>
          <div className="flex-1 md:max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="hover:shadow-lg transition-shadow duration-200 border-slate-200"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{group.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`${
                            group.status === "open"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {group.status === "open" ? (
                            <>
                              <Unlock className="w-3 h-3 mr-1" />
                              Open
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Closed
                            </>
                          )}
                        </Badge>
                        {group.is_admin && (
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {group.description && (
                    <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {group.member_count || 0} / {group.max_members} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        {group.group_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(group.group_code)}
                        className="text-slate-400 hover:text-teal-500 transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === group.group_code ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/dashboard/collaboration/groups/${group.id}`)}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
                  >
                    {group.is_member ? (
                      <>
                        Open Group
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-20 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {activeTab === "my" ? "You're not in any groups yet" : "No groups found"}
              </h3>
              <p className="text-slate-500 mb-4">
                {activeTab === "my"
                  ? "Create a new group or join an existing one to get started."
                  : searchQuery
                  ? "Try adjusting your search query."
                  : "Be the first to create a group!"}
              </p>
              {activeTab === "my" && (
                <Button
                  onClick={() => router.push("/dashboard/collaboration/groups/create")}
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

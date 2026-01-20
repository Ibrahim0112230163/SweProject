"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Users,
  FileText,
  MoreVertical,
  Send,
  Paperclip,
  Crown,
  UserMinus,
  LogOut,
  Copy,
  Check,
  X,
  CheckCircle2,
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"

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
}

interface GroupMember {
  id: string
  user_id: string
  role: "admin" | "member"
  joined_at: string
  profile?: {
    name: string | null
    email: string | null
    avatar_url: string | null
  }
}

interface GroupMessage {
  id: string
  user_id: string
  content: string
  created_at: string
  profile?: {
    name: string | null
    avatar_url: string | null
  }
}

interface GroupFile {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  uploaded_at: string
  profile?: {
    name: string | null
  }
}

interface JoinRequest {
  id: string
  user_id: string
  status: "pending" | "approved" | "rejected"
  requested_at: string
  profile?: {
    name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.groupId as string
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [files, setFiles] = useState<GroupFile[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

        setCurrentUserId(user.id)

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        setUserProfile(profileData)

        // Fetch group
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single()

        if (groupError) throw groupError
        setGroup(groupData)

        // Check membership
        const { data: memberData } = await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", groupId)
          .eq("user_id", user.id)
          .single()

        setIsMember(!!memberData)
        setIsAdmin(memberData?.role === "admin")

        if (!memberData) {
          // Not a member, can view but not interact
          setLoading(false)
          return
        }

        // Fetch members with profiles
        const { data: membersData, error: membersError } = await supabase
          .from("group_members")
          .select("*, user_profiles(name, email, avatar_url)")
          .eq("group_id", groupId)
          .order("role", { ascending: false })
          .order("joined_at", { ascending: true })

        if (membersError) throw membersError

        const formattedMembers = (membersData || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          profile: m.user_profiles,
        }))
        setMembers(formattedMembers)

        // Fetch messages with profiles
        const { data: messagesData, error: messagesError } = await supabase
          .from("group_messages")
          .select("*, user_profiles(name, avatar_url)")
          .eq("group_id", groupId)
          .order("created_at", { ascending: true })
          .limit(100)

        if (messagesError) throw messagesError

        const formattedMessages = (messagesData || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          content: m.content,
          created_at: m.created_at,
          profile: m.user_profiles,
        }))
        setMessages(formattedMessages)

        // Fetch files
        const { data: filesData, error: filesError } = await supabase
          .from("group_files")
          .select("*, user_profiles(name)")
          .eq("group_id", groupId)
          .order("uploaded_at", { ascending: false })

        if (filesError) throw filesError

        const formattedFiles = (filesData || []).map((f: any) => ({
          id: f.id,
          file_name: f.file_name,
          file_url: f.file_url,
          file_size: f.file_size,
          file_type: f.file_type,
          uploaded_at: f.uploaded_at,
          profile: f.user_profiles,
        }))
        setFiles(formattedFiles)

        // Fetch join requests (only if admin)
        if (memberData.role === "admin") {
          const { data: requestsData, error: requestsError } = await supabase
            .from("group_join_requests")
            .select("*, user_profiles(name, email, avatar_url)")
            .eq("group_id", groupId)
            .eq("status", "pending")
            .order("requested_at", { ascending: false })

          if (requestsError) throw requestsError

          const formattedRequests = (requestsData || []).map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            status: r.status,
            requested_at: r.requested_at,
            profile: r.user_profiles,
          }))
          setJoinRequests(formattedRequests)
        }

        // Set up real-time subscription for messages
        const messagesChannel = supabase
          .channel(`group-messages-${groupId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "group_messages",
              filter: `group_id=eq.${groupId}`,
            },
            async (payload) => {
              const newMessage = payload.new as any
              const { data: profile } = await supabase
                .from("user_profiles")
                .select("name, avatar_url")
                .eq("user_id", newMessage.user_id)
                .single()

              setMessages((prev) => [
                ...prev,
                {
                  id: newMessage.id,
                  user_id: newMessage.user_id,
                  content: newMessage.content,
                  created_at: newMessage.created_at,
                  profile: profile || undefined,
                },
              ])
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(messagesChannel)
        }
      } catch (error) {
        console.error("Error fetching group data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId, supabase, router])

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUserId || !isMember) return

    setSending(true)
    try {
      const { error } = await supabase.from("group_messages").insert([
        {
          group_id: groupId,
          user_id: currentUserId,
          content: message.trim(),
        },
      ])

      if (error) throw error
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId || !isMember) return

    setUploading(true)
    try {
      // Upload file to Supabase storage (or handle based on your setup)
      // For now, we'll create a placeholder URL
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${groupId}/${fileName}`

      // Note: You'll need to set up Supabase Storage bucket for group_files
      // For now, using a placeholder approach
      const { data: fileData, error: uploadError } = await supabase.storage
        .from("group-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("group-files").getPublicUrl(filePath)

      // Save file record
      const { error: fileError } = await supabase.from("group_files").insert([
        {
          group_id: groupId,
          user_id: currentUserId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
        },
      ])

      if (fileError) throw fileError

      // Refresh files
      const { data: filesData } = await supabase
        .from("group_files")
        .select("*, user_profiles(name)")
        .eq("group_id", groupId)
        .order("uploaded_at", { ascending: false })

      if (filesData) {
        const formattedFiles = filesData.map((f: any) => ({
          id: f.id,
          file_name: f.file_name,
          file_url: f.file_url,
          file_size: f.file_size,
          file_type: f.file_type,
          uploaded_at: f.uploaded_at,
          profile: f.user_profiles,
        }))
        setFiles(formattedFiles)
      }
    } catch (error: any) {
      console.error("Error uploading file:", error)
      // Fallback: create a mock file entry if storage isn't set up
      if (error.message?.includes("bucket") || error.message?.includes("storage")) {
        const { error: fileError } = await supabase.from("group_files").insert([
          {
            group_id: groupId,
            user_id: currentUserId,
            file_name: file.name,
            file_url: `#${file.name}`, // Placeholder
            file_size: file.size,
            file_type: file.type,
          },
        ])

        if (!fileError) {
          // Refresh files
          const { data: filesData } = await supabase
            .from("group_files")
            .select("*, user_profiles(name)")
            .eq("group_id", groupId)
            .order("uploaded_at", { ascending: false })

          if (filesData) {
            const formattedFiles = filesData.map((f: any) => ({
              id: f.id,
              file_name: f.file_name,
              file_url: f.file_url,
              file_size: f.file_size,
              file_type: f.file_type,
              uploaded_at: f.uploaded_at,
              profile: f.user_profiles,
            }))
            setFiles(formattedFiles)
          }
        }
      } else {
        alert("Failed to upload file")
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleJoinRequest = async () => {
    if (!currentUserId) return

    try {
      const { error } = await supabase.from("group_join_requests").insert([
        {
          group_id: groupId,
          user_id: currentUserId,
          status: "pending",
        },
      ])

      if (error) throw error
      alert("Join request sent! The group admin will review your request.")
    } catch (error: any) {
      if (error.code === "23505") { // Unique violation
        alert("You already have a pending join request for this group.")
      } else {
        console.error("Error sending join request:", JSON.stringify(error, null, 2))
        alert(`Failed to send join request: ${(error as any)?.message || "Unknown error"}`)
      }
    }
  }

  const handleApproveRequest = async (requestId: string, userId: string) => {
    if (!isAdmin) return

    try {
      // Check if group is full
      if (members.length >= (group?.max_members || 5)) {
        alert("Group is full. Cannot add more members.")
        return
      }

      // Update request status
      const { error: updateError } = await supabase
        .from("group_join_requests")
        .update({ status: "approved", responded_at: new Date().toISOString() })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Add member
      const { error: memberError } = await supabase.from("group_members").insert([
        {
          group_id: groupId,
          user_id: userId,
          role: "member",
        },
      ])

      if (memberError) throw memberError

      // Refresh members and requests
      const { data: membersData } = await supabase
        .from("group_members")
        .select("*, user_profiles(name, email, avatar_url)")
        .eq("group_id", groupId)

      if (membersData) {
        const formattedMembers = membersData.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          profile: m.user_profiles,
        }))
        setMembers(formattedMembers)
      }

      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (error) {
      console.error("Error approving request:", error)
      alert("Failed to approve join request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!isAdmin) return

    try {
      const { error } = await supabase
        .from("group_join_requests")
        .update({ status: "rejected", responded_at: new Date().toISOString() })
        .eq("id", requestId)

      if (error) throw error
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (error) {
      console.error("Error rejecting request:", error)
      alert("Failed to reject join request")
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (!isAdmin || userId === currentUserId) return

    try {
      const { error } = await supabase.from("group_members").delete().eq("id", memberId)

      if (error) throw error

      // Refresh members
      const { data: membersData } = await supabase
        .from("group_members")
        .select("*, user_profiles(name, email, avatar_url)")
        .eq("group_id", groupId)

      if (membersData) {
        const formattedMembers = membersData.map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          profile: m.user_profiles,
        }))
        setMembers(formattedMembers)
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member")
    }
  }

  const handleLeaveGroup = async () => {
    if (!currentUserId) return

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUserId)

      if (error) throw error

      router.push("/dashboard/collaboration/groups")
    } catch (error) {
      console.error("Error leaving group:", error)
      alert("Failed to leave group")
    }
  }

  const copyGroupCode = () => {
    if (group?.group_code) {
      navigator.clipboard.writeText(group.group_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
            <p className="mt-4 text-slate-600">Loading group...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!group) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Group not found</h2>
          <Button onClick={() => router.push("/dashboard/collaboration/groups")} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/dashboard/collaboration/groups")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{group.title}</h1>
              {group.description && <p className="text-slate-600 mt-1">{group.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg">
              <span className="font-mono text-sm font-semibold">{group.group_code}</span>
              <button
                onClick={copyGroupCode}
                className="text-slate-400 hover:text-teal-500 transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <Badge variant="outline" className={group.status === "open" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
              {group.status === "open" ? "Open" : "Closed"}
            </Badge>
            {isMember && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setActiveTab("members")}>
                    <Users className="mr-2 h-4 w-4" />
                    View Members
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("files")}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Files
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/profile`)}>
                        <Crown className="mr-2 h-4 w-4" />
                        Manage Group
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLeaveDialog(true)} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Join Request Banner (if not member) */}
        {!isMember && (
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">You're not a member of this group</p>
                  <p className="text-sm text-slate-600">
                    {group.status === "open"
                      ? "Request to join this group to start collaborating."
                      : "This group is closed to new members."}
                  </p>
                </div>
                {group.status === "open" && (
                  <Button onClick={handleJoinRequest} className="bg-teal-500 hover:bg-teal-600 text-white">
                    Request to Join
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join Requests (Admin only) */}
        {isAdmin && joinRequests.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg">Pending Join Requests ({joinRequests.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {joinRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                      {request.profile?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium">{request.profile?.name || "Unknown User"}</p>
                      <p className="text-sm text-slate-600">{request.profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request.id, request.user_id)}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="members">
              Members ({members.length}/{group.max_members})
            </TabsTrigger>
            <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="border-slate-200 h-[600px] flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwnMessage = msg.user_id === currentUserId
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {msg.profile?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-slate-900">
                              {isOwnMessage ? "You" : msg.profile?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(msg.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <div
                            className={`inline-block px-4 py-2 rounded-lg ${isOwnMessage
                                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                                : "bg-slate-100 text-slate-900"
                              }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center text-slate-500 py-20">No messages yet. Start the conversation!</div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              {isMember && (
                <div className="border-t border-slate-200 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      disabled={sending}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading || !isMember}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !isMember}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !message.trim() || !isMember}
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
                <CardDescription>
                  {members.length} of {group.max_members} members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                        onClick={() => router.push(`/dashboard/profile?userId=${member.user_id}`)}
                      >
                        {member.profile?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className="font-medium cursor-pointer hover:text-teal-600"
                            onClick={() => router.push(`/dashboard/profile?userId=${member.user_id}`)}
                          >
                            {member.profile?.name || "Unknown User"}
                          </p>
                          {member.role === "admin" && (
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{member.profile?.email}</p>
                      </div>
                    </div>
                    {isAdmin && member.user_id !== currentUserId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Group Files</CardTitle>
                <CardDescription>Files shared in this group</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {files.length > 0 ? (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-teal-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.file_name}</p>
                          <p className="text-sm text-slate-600">
                            {file.profile?.name} • {format(new Date(file.uploaded_at), "MMM d, yyyy")}
                            {file.file_size && ` • ${(file.file_size / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.file_url, "_blank")}
                      >
                        Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 py-20">No files shared yet</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Leave Group Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? {isAdmin && "If you're the only admin, another member will be randomly selected as admin."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup} className="bg-red-500 hover:bg-red-600 text-white">
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}

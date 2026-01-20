"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { ChatList } from "@/components/collaboration/chat/chat-list"
import { ChatWindow } from "@/components/collaboration/chat/chat-window"
import { ChatSession, Message } from "@/types/collaboration" // Ensure Message is exported or inferred
import { getUserChats, sendMessage } from "@/lib/collaboration"
import { Loader2 } from "lucide-react"

interface UserProfile {
    id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    profile_completion_percentage: number
}

export default function ChatPage() {
    const router = useRouter()
    const supabase = createClient()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [chats, setChats] = useState<ChatSession[]>([])
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/auth/login")
                    return
                }

                // Fetch basic profile for layout
                const { data: profile } = await supabase
                    .from("user_profiles")
                    .select("user_id, name, email, avatar_url, profile_completion_percentage")
                    .eq("user_id", user.id)
                    .single()

                if (profile) {
                    setUserProfile({
                        id: profile.user_id,
                        name: profile.name,
                        email: profile.email,
                        avatar_url: profile.avatar_url,
                        profile_completion_percentage: profile.profile_completion_percentage
                    })
                }

                // Fetch Chats using our lib function
                const sessions = await getUserChats(supabase, user.id)
                setChats(sessions)
                if (sessions.length > 0) {
                    setSelectedSessionId(sessions[0].id)
                }

            } catch (error) {
                console.error("Error initializing chat:", error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [supabase, router])

    const handleSendMessage = async (sessionId: string, content: string) => {
        if (!userProfile) return

        try {
            // Optimistic update (optional, but good for UX)
            // Ideally we wait for server confirmation or real-time event

            // Send to backend
            const { data: newMessage, error } = await sendMessage(supabase, sessionId, userProfile.id, content)

            if (error) throw error

            if (newMessage) {
                // Update local state
                setChats(prev => prev.map(session => {
                    if (session.id === sessionId) {
                        const updatedMessages = [...session.messages, {
                            id: newMessage.id,
                            senderId: newMessage.sender_id,
                            content: newMessage.content,
                            timestamp: new Date(newMessage.created_at),
                            isRead: newMessage.is_read
                        }];
                        return {
                            ...session,
                            messages: updatedMessages,
                            lastMessage: updatedMessages[updatedMessages.length - 1]
                        }
                    }
                    return session
                }))
            }
        } catch (error) {
            console.error("Error sending message:", error)
            alert("Failed to send message")
        }
    }

    const selectedSession = chats.find(c => c.id === selectedSessionId)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-teal-500" />
            </div>
        )
    }

    return (
        <DashboardLayout userProfile={userProfile}>
            <div className="h-[calc(100vh-100px)] flex gap-4">
                <div className="w-1/3 min-w-[300px]">
                    <ChatList
                        sessions={chats}
                        currentUserId={userProfile?.id || ""}
                        selectedSessionId={selectedSessionId || undefined}
                        onSelectSession={setSelectedSessionId}
                    />
                </div>
                <div className="flex-1">
                    {selectedSession ? (
                        <ChatWindow
                            session={selectedSession}
                            currentUserId={userProfile?.id || ""}
                            onSendMessage={handleSendMessage}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center border rounded-lg bg-slate-50 text-slate-400">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

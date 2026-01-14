"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Send, MoreVertical, Phone, Video, Paperclip, Smile, Image as ImageIcon } from "lucide-react"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  profile_completion_percentage: number
}

interface Conversation {
  id: string
  user: {
    id: string
    name: string
    avatar?: string
    status: "online" | "offline" | "away"
  }
  lastMessage: string
  timestamp: string
  unread: number
}

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  status: "sent" | "delivered" | "read"
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profileData } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

        setUserProfile(profileData)

        // Mock conversations data - In production, fetch from database
        const mockConversations: Conversation[] = [
          {
            id: "1",
            user: {
              id: "u1",
              name: "Sarah Johnson",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
              status: "online",
            },
            lastMessage: "That sounds great! Let's discuss it tomorrow.",
            timestamp: "2m ago",
            unread: 2,
          },
          {
            id: "2",
            user: {
              id: "u2",
              name: "Michael Chen",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
              status: "online",
            },
            lastMessage: "Thanks for the course recommendation!",
            timestamp: "1h ago",
            unread: 0,
          },
          {
            id: "3",
            user: {
              id: "u3",
              name: "Emily Davis",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
              status: "away",
            },
            lastMessage: "Can you help me with the React project?",
            timestamp: "3h ago",
            unread: 1,
          },
          {
            id: "4",
            user: {
              id: "u4",
              name: "David Martinez",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
              status: "offline",
            },
            lastMessage: "Great collaboration session today!",
            timestamp: "1d ago",
            unread: 0,
          },
          {
            id: "5",
            user: {
              id: "u5",
              name: "Jessica Lee",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
              status: "online",
            },
            lastMessage: "I've shared the resources in the group",
            timestamp: "2d ago",
            unread: 0,
          },
        ]

        setConversations(mockConversations)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, router])

  useEffect(() => {
    if (selectedConversation) {
      // Mock messages - In production, fetch from database
      const mockMessages: Message[] = [
        {
          id: "m1",
          senderId: selectedConversation.user.id,
          text: "Hey! How are you doing?",
          timestamp: "10:30 AM",
          status: "read",
        },
        {
          id: "m2",
          senderId: userProfile?.id || "",
          text: "I'm doing great! Thanks for asking. How about you?",
          timestamp: "10:32 AM",
          status: "read",
        },
        {
          id: "m3",
          senderId: selectedConversation.user.id,
          text: "I'm good too! I wanted to ask about that course you mentioned yesterday.",
          timestamp: "10:33 AM",
          status: "read",
        },
        {
          id: "m4",
          senderId: userProfile?.id || "",
          text: "Of course! It's an amazing course on React and Next.js. I think you'll really enjoy it.",
          timestamp: "10:35 AM",
          status: "read",
        },
        {
          id: "m5",
          senderId: selectedConversation.user.id,
          text: "That sounds perfect! Could you share the link?",
          timestamp: "10:36 AM",
          status: "read",
        },
        {
          id: "m6",
          senderId: userProfile?.id || "",
          text: "Sure! I'll send it to you right now.",
          timestamp: "10:37 AM",
          status: "delivered",
        },
      ]

      setMessages(mockMessages)
      scrollToBottom()
    }
  }, [selectedConversation, userProfile])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      const newMessage: Message = {
        id: `m${messages.length + 1}`,
        senderId: userProfile?.id || "",
        text: messageInput,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      }

      setMessages([...messages, newMessage])
      setMessageInput("")
      scrollToBottom()

      // Update conversation last message
      setConversations(
        conversations.map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, lastMessage: messageInput, timestamp: "Just now" } : conv
        )
      )
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <DashboardLayout userProfile={userProfile}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading messages...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userProfile={userProfile}>
      <div className="flex h-full bg-slate-50">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-3 rounded-lg mb-1 transition-all hover:bg-slate-50 ${
                    selectedConversation?.id === conversation.id ? "bg-cyan-50 border border-cyan-200" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={conversation.user.avatar}
                        alt={conversation.user.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          conversation.user.status === "online"
                            ? "bg-green-500"
                            : conversation.user.status === "away"
                              ? "bg-yellow-500"
                              : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900 truncate">{conversation.user.name}</p>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{conversation.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600 truncate">{conversation.lastMessage}</p>
                        {conversation.unread > 0 && (
                          <Badge className="ml-2 bg-teal-500 text-white text-xs px-2">{conversation.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={selectedConversation.user.avatar}
                        alt={selectedConversation.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          selectedConversation.user.status === "online"
                            ? "bg-green-500"
                            : selectedConversation.user.status === "away"
                              ? "bg-yellow-500"
                              : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">{selectedConversation.user.name}</h2>
                      <p className="text-sm text-slate-500">
                        {selectedConversation.user.status === "online"
                          ? "Active now"
                          : selectedConversation.user.status === "away"
                            ? "Away"
                            : "Offline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 bg-slate-50">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId === userProfile?.id
                    const showAvatar =
                      index === 0 || messages[index - 1].senderId !== message.senderId

                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                        <div className="w-8">
                          {showAvatar && !isOwnMessage && (
                            <img
                              src={selectedConversation.user.avatar}
                              alt={selectedConversation.user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                        </div>
                        <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} max-w-md`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwnMessage
                                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                                : "bg-white text-slate-900 border border-slate-200"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-2">
                            <span className="text-xs text-slate-500">{message.timestamp}</span>
                            {isOwnMessage && (
                              <span className="text-xs text-slate-500">
                                {message.status === "sent" && "✓"}
                                {message.status === "delivered" && "✓✓"}
                                {message.status === "read" && <span className="text-teal-500">✓✓</span>}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white border-t border-slate-200 p-4">
                <div className="flex items-end gap-2 max-w-4xl mx-auto">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-10 bg-slate-50 border-slate-200"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-600 hover:text-slate-900"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Messages</h2>
                <p className="text-slate-600">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

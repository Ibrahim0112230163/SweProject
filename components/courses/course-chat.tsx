"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Paperclip, Send, Loader2, FileText, Download } from "lucide-react"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  course_id: string
  user_id: string
  message: string
  created_at: string
  user_name?: string
  user_avatar?: string
}

interface ChatFile {
  id: string
  course_id: string
  user_id: string
  message_id: string | null
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  uploaded_at: string
  user_name?: string
}

interface CourseChatProps {
  courseId: string
  isCreator: boolean
}

export default function CourseChat({ courseId, isCreator }: CourseChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [files, setFiles] = useState<ChatFile[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    fetchUser()
  }, [supabase])

  useEffect(() => {
    fetchMessages()
    fetchFiles()

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`course-chat-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_chat_messages",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          fetchMessages()
        }
      )
      .subscribe()

    // Subscribe to new files
    const filesChannel = supabase
      .channel(`course-files-${courseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "course_chat_files",
          filter: `course_id=eq.${courseId}`,
        },
        (payload) => {
          fetchFiles()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(filesChannel)
    }
  }, [courseId, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages, files])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    try {
      // 1. Fetch messages without the join that was causing errors
      const { data: messagesData, error: messagesError } = await supabase
        .from("course_chat_messages")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: true })

      if (messagesError) throw messagesError

      if (messagesData && messagesData.length > 0) {
        // 2. Fetch user profiles for the senders
        const userIds = Array.from(new Set(messagesData.map((msg) => msg.user_id)))
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds)

        if (profilesError) throw profilesError

        // 3. Map profiles to user_id for easy lookup
        const profileMap: Record<string, { name: string; avatar_url: string }> = {}
        profiles?.forEach((profile) => {
          profileMap[profile.user_id] = {
            name: profile.name,
            avatar_url: profile.avatar_url,
          }
        })

        // 4. Combine data
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id,
          course_id: msg.course_id,
          user_id: msg.user_id,
          message: msg.message,
          created_at: msg.created_at,
          user_name: profileMap[msg.user_id]?.name || "Unknown",
          user_avatar: profileMap[msg.user_id]?.avatar_url || null,
        }))
        setMessages(formattedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const fetchFiles = async () => {
    try {
      // 1. Fetch files without the join
      const { data: filesData, error: filesError } = await supabase
        .from("course_chat_files")
        .select("*")
        .eq("course_id", courseId)
        .order("uploaded_at", { ascending: true })

      if (filesError) throw filesError

      if (filesData && filesData.length > 0) {
        // 2. Fetch user profiles for the uploaders
        const userIds = Array.from(new Set(filesData.map((file) => file.user_id)))
        const { data: profiles, error: profilesError } = await supabase
          .from("user_profiles")
          .select("user_id, name")
          .in("user_id", userIds)

        if (profilesError) throw profilesError

        // 3. Map profiles
        const profileMap: Record<string, { name: string }> = {}
        profiles?.forEach((profile) => {
          profileMap[profile.user_id] = {
            name: profile.name,
          }
        })

        // 4. Combine data
        const formattedFiles = filesData.map((file: any) => ({
          id: file.id,
          course_id: file.course_id,
          user_id: file.user_id,
          message_id: file.message_id,
          file_name: file.file_name,
          file_url: file.file_url,
          file_size: file.file_size,
          file_type: file.file_type,
          uploaded_at: file.uploaded_at,
          user_name: profileMap[file.user_id]?.name || "Unknown",
        }))
        setFiles(formattedFiles)
      } else {
        setFiles([])
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return

    setSending(true)
    try {
      const { error } = await supabase.from("course_chat_messages").insert([
        {
          course_id: courseId,
          user_id: currentUserId,
          message: newMessage.trim(),
        },
      ])

      if (error) throw error

      setNewMessage("")
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast.error(error.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUserId) return

    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${courseId}/${Date.now()}_${file.name}`
      const filePath = `course-files/${fileName}`

      // Try to upload file to storage
      let publicUrl = ""
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("course-files")
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          // If bucket doesn't exist, create a data URL as fallback
          console.warn("Storage upload failed, using data URL:", uploadError)
          const reader = new FileReader()
          publicUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
        } else {
          const {
            data: { publicUrl: url },
          } = supabase.storage.from("course-files").getPublicUrl(filePath)
          publicUrl = url
        }
      } catch (storageError) {
        // Fallback: use data URL
        const reader = new FileReader()
        publicUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      // Save file record
      const { error: fileError } = await supabase.from("course_chat_files").insert([
        {
          course_id: courseId,
          user_id: currentUserId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
        },
      ])

      if (fileError) throw fileError

      toast.success("File uploaded successfully")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast.error(error.message || "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-0">
        <div className="flex flex-col h-[600px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Messages */}
            {messages.map((message) => {
              const isOwnMessage = message.user_id === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.user_avatar || undefined} />
                    <AvatarFallback>{message.user_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isOwnMessage ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">{message.user_name}</span>
                      {isCreator && message.user_id !== currentUserId && (
                        <span className="text-xs text-teal-600">(Teacher)</span>
                      )}
                      <span className="text-xs text-slate-500">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? "bg-teal-500 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {message.message}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Files */}
            {files.map((file) => {
              const isOwnFile = file.user_id === currentUserId
              return (
                <div
                  key={file.id}
                  className={`flex gap-3 ${isOwnFile ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <FileText className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${isOwnFile ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-900">{file.user_name}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(file.uploaded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                        isOwnFile
                          ? "bg-teal-500 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.file_name}</span>
                      <span className="text-xs opacity-75">({formatFileSize(file.file_size)})</span>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 hover:opacity-80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={sending || uploading}
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                title="Upload file"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || uploading}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

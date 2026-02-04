"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import IndustryLayout from "@/components/dashboard/industry-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Calendar, PlusCircle, Trash2, Video, Briefcase } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { IndustryExpert } from "@/types/profile"

interface UpcomingEvent {
  id?: string
  industry_id: string
  company_name: string
  event_title: string
  event_type: 'webinar' | 'tech_talk' | 'workshop' | 'recruiting_drive'
  description?: string
  event_date: string
  platform?: string
  event_link?: string
}

export default function EventsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [expert, setExpert] = useState<IndustryExpert | null>(null)
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Partial<UpcomingEvent>>({})

  useEffect(() => {
    const checkAuthAndFetchEvents = async () => {
      const company = localStorage.getItem("industry_company_name")
      const id = localStorage.getItem("industry_expert_id")
      const session = localStorage.getItem("industry_session")

      if (!company || !id || !session) {
        router.push("/auth/login/industry")
        return
      }

      const expertData = { id, company_name: company, email: "" } as IndustryExpert
      setExpert(expertData)

      await fetchEvents(id)
      setLoading(false)
    }

    checkAuthAndFetchEvents()
  }, [router, supabase])

  const fetchEvents = async (industryId: string) => {
    const { data, error } = await supabase
      .from("upcoming_events")
      .select("*")
      .eq("industry_id", industryId)
      .order("event_date", { ascending: true })
    
    if (error) {
      toast.error("Failed to fetch events.")
    } else {
      setEvents(data || [])
    }
  }

  const handleSaveEvent = async () => {
    if (!expert || !currentEvent.event_title || !currentEvent.event_date || !currentEvent.event_type) {
      toast.error("Please fill in all required fields.")
      return
    }

    const eventToSave = {
      ...currentEvent,
      industry_id: expert.id,
      company_name: expert.company_name,
    }

    const { error } = await supabase.from("upcoming_events").upsert(eventToSave)

    if (error) {
      toast.error(`Failed to save event: ${error.message}`)
    } else {
      toast.success(`Event "${eventToSave.event_title}" saved successfully!`)
      setIsDialogOpen(false)
      fetchEvents(expert.id)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!expert) return
    const { error } = await supabase.from("upcoming_events").delete().eq("id", eventId)
    if (error) {
      toast.error("Failed to delete event.")
    } else {
      toast.success("Event deleted.")
      fetchEvents(expert.id)
    }
  }

  const openNewEventDialog = () => {
    setCurrentEvent({
      event_type: 'tech_talk',
      platform: 'Google Meet'
    })
    setIsDialogOpen(true)
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'webinar': return <Video className="w-5 h-5 text-blue-500" />;
      case 'tech_talk': return <Briefcase className="w-5 h-5 text-purple-500" />;
      case 'workshop': return <Briefcase className="w-5 h-5 text-green-500" />;
      case 'recruiting_drive': return <Users className="w-5 h-5 text-red-500" />;
      default: return <Calendar className="w-5 h-5 text-gray-500" />;
    }
  }

  return (
    <IndustryLayout userProfile={expert || undefined}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Student Engagement</h1>
            <p className="text-slate-600">Host events to connect with and recruit top talent.</p>
          </div>
          <Button onClick={openNewEventDialog} className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> New Event
          </Button>
        </div>

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <Card className="text-center py-12 border-2 border-dashed">
            <CardContent>
              <h3 className="text-lg font-medium">No upcoming events</h3>
              <p className="text-slate-500 mt-2">Click "New Event" to schedule a tech talk, webinar, or workshop.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map(event => (
              <Card key={event.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{event.event_title}</CardTitle>
                      <CardDescription className="capitalize">{event.event_type.replace('_', ' ')}</CardDescription>
                    </div>
                    {getEventTypeIcon(event.event_type)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{event.description}</p>
                  <div className="text-sm space-y-2">
                    <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.event_date).toLocaleString()}</p>
                    <p className="flex items-center gap-2"><Video className="w-4 h-4" /> {event.platform}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <a href={event.event_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Event Link
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id!)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentEvent.id ? "Edit Event" : "Create New Event"}</DialogTitle>
            <DialogDescription>Fill in the details for your student engagement event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Event Title"
              value={currentEvent.event_title || ""}
              onChange={(e) => setCurrentEvent({ ...currentEvent, event_title: e.target.value })}
            />
            <Select
              value={currentEvent.event_type}
              onValueChange={(value) => setCurrentEvent({ ...currentEvent, event_type: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tech_talk">Tech Talk</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="recruiting_drive">Recruiting Drive</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Event Description"
              value={currentEvent.description || ""}
              onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
            />
            <Input
              type="datetime-local"
              value={currentEvent.event_date ? new Date(currentEvent.event_date).toISOString().slice(0, 16) : ""}
              onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
            />
            <Input
              placeholder="Platform (e.g., Google Meet)"
              value={currentEvent.platform || ""}
              onChange={(e) => setCurrentEvent({ ...currentEvent, platform: e.target.value })}
            />
            <Input
              placeholder="Event Link"
              value={currentEvent.event_link || ""}
              onChange={(e) => setCurrentEvent({ ...currentEvent, event_link: e.target.value })}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEvent}>Save Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </IndustryLayout>
  )
}

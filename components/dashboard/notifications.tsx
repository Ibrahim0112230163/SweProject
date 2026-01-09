"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Notification {
  id: string
  notification_type: string
  title: string
  description: string
  is_read: boolean
}

interface NotificationsProps {
  notifications: Notification[]
}

const notificationIcons: Record<string, string> = {
  job_match: "💼",
  course_deadline: "📚",
  profile: "👤",
  default: "🔔",
}

export default function Notifications({ notifications }: NotificationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Recent updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="text-xl flex-shrink-0">
                  {notificationIcons[notification.notification_type] || notificationIcons.default}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{notification.title}</p>
                  <p className="text-xs text-slate-600">{notification.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600 text-center py-4">No notifications yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

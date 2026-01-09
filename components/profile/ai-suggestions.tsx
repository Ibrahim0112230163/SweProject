"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AISuggestion {
  id: string
  skill_name: string
  suggestion_text: string
  course_recommendation: string | null
  suggestion_type: string
}

interface AIPoweredSuggestionsProps {
  suggestions: AISuggestion[]
}

const suggestionIcons: Record<string, string> = {
  improve: "📦",
  advanced: "🎓",
  strengthen: "👥",
}

const defaultSuggestions: AISuggestion[] = [
  {
    id: "1",
    skill_name: "Data Analysis",
    suggestion_text: "Enhance your data analysis skills with our hands-on 'Data Science with Python' course.",
    course_recommendation: "Data Science with Python",
    suggestion_type: "improve",
  },
  {
    id: "2",
    skill_name: "React",
    suggestion_text:
      "Take your React skills to the next level by exploring state management with Redux and Context API.",
    course_recommendation: "Master Advanced React Concepts",
    suggestion_type: "advanced",
  },
  {
    id: "3",
    skill_name: "Project Management",
    suggestion_text: "Learn Agile methodologies to manage projects more effectively and collaborate with teams.",
    course_recommendation: "Agile Project Management",
    suggestion_type: "strengthen",
  },
]

export default function AIPoweredSuggestions({ suggestions }: AIPoweredSuggestionsProps) {
  const displaySuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-Powered Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displaySuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg hover:border-teal-300 transition"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{suggestionIcons[suggestion.suggestion_type] || "📚"}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">{suggestion.course_recommendation}</h3>
                <p className="text-sm text-slate-600 mb-3">{suggestion.suggestion_text}</p>
                <button className="text-teal-500 hover:text-teal-600 text-sm font-medium transition">
                  {suggestion.suggestion_type === "improve"
                    ? "View Course"
                    : suggestion.suggestion_type === "advanced"
                      ? "Explore Advanced Topics"
                      : "Learn Agile"}{" "}
                  →
                </button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

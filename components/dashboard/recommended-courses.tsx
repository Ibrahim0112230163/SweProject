"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Course {
  id: string
  course_title: string
  provider: string
  price: number
  is_free: boolean
}

interface RecommendedCoursesProps {
  courses: Course[]
}

const courseColors: Record<string, string> = {
  Coursera: "bg-gradient-to-br from-cyan-400 to-teal-500",
  freeCodeCamp: "bg-gradient-to-br from-teal-400 to-cyan-500",
  Udemy: "bg-gradient-to-br from-purple-600 to-purple-800",
  DataCamp: "bg-gradient-to-br from-yellow-400 to-orange-500",
  default: "bg-gradient-to-br from-slate-400 to-slate-600",
}

export default function RecommendedCourses({ courses }: RecommendedCoursesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Courses</CardTitle>
        <CardDescription>Courses tailored to your skill gaps</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id} className="flex flex-col">
                <div className={`${courseColors[course.provider] || courseColors.default} h-32 rounded-lg mb-3`}></div>
                <h3 className="font-semibold text-slate-900 mb-1 text-sm">{course.course_title}</h3>
                <p className="text-xs text-slate-600 mb-3">{course.provider}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-teal-600 font-bold text-sm">
                    {course.is_free ? "Free" : `$${course.price}`}
                  </span>
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white text-xs px-2 py-1 h-auto">
                    {course.is_free ? "Start Learning" : "Enroll Now"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-slate-600">No recommended courses yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

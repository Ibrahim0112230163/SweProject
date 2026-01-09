"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface JobMatch {
  id: string
  job_title: string
  company_name: string
  match_percentage: number
  required_skills: string[]
}

interface JobMatchesProps {
  jobMatches: JobMatch[]
}

export default function JobMatches({ jobMatches }: JobMatchesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Job Matches</CardTitle>
        <CardDescription>Opportunities matching your skills</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {jobMatches.length > 0 ? (
            jobMatches.map((job) => (
              <div key={job.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.job_title}</h3>
                    <p className="text-sm text-slate-600">{job.company_name}</p>
                  </div>
                  <span className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-2 py-1 rounded">
                    {job.match_percentage}% Match
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {job.required_skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm">View Details</Button>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8">
              <p className="text-slate-600">No job matches yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Skill {
  id: string
  skill_name: string
  proficiency_level: number
}

interface SkillRadarProps {
  skills: Skill[]
}

export default function SkillRadar({ skills }: SkillRadarProps) {
  // Generate default skill radar data
  const skillNames =
    skills.length > 0
      ? skills.map((s) => s.skill_name)
      : ["UI/UX Design", "Prototyping", "Frontend", "Backend", "Data Science", "Product Mgt."]

  const chartData = skillNames.map((skillName, index) => {
    const skill = skills.find((s) => s.skill_name === skillName)
    return {
      name: skillName,
      value: skill ? skill.proficiency_level : (Math.random() * 100).toFixed(0),
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skill Radar</CardTitle>
        <CardDescription>Your current skill proficiency levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(20, 184, 166)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="rgb(20, 184, 166)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#f1f5f9" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="rgb(20, 184, 166)"
                fillOpacity={1}
                fill="url(#colorValue)"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

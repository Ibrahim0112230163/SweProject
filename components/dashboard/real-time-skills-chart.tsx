"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Sparkles, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SkillCategory {
    name: string;
    percentage: number;
    topSkills: string[];
    demandReason: string;
    trend: "increasing" | "stable" | "decreasing";
    color: string;
}

interface SkillsData {
    categories: SkillCategory[];
    lastUpdated: string;
    summary: string;
}

export function RealTimeSkillsPieChart() {
    const [skillsData, setSkillsData] = useState<SkillsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);

    const fetchSkillsTrends = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/skills/trends");
            const result = await response.json();
            
            if (result.success) {
                setSkillsData(result.data);
            }
        } catch (error) {
            console.error("Error fetching skills trends:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkillsTrends();
        // Auto-refresh every 10 minutes
        const interval = setInterval(fetchSkillsTrends, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "increasing":
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case "decreasing":
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            default:
                return <Minus className="h-4 w-4 text-slate-600" />;
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case "increasing":
                return "text-green-600 bg-green-50 border-green-200";
            case "decreasing":
                return "text-red-600 bg-red-50 border-red-200";
            default:
                return "text-slate-600 bg-slate-50 border-slate-200";
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
                    <p className="font-bold text-slate-900 mb-2">{data.name}</p>
                    <p className="text-2xl font-bold text-teal-600 mb-2">{data.percentage}%</p>
                    <div className="space-y-1 text-sm">
                        <p className="text-slate-600">Top Skills:</p>
                        {data.topSkills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="mr-1 text-xs">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percentage < 5) return null; // Don't show label for small slices

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                className="font-bold text-sm"
            >
                {`${percentage}%`}
            </text>
        );
    };

    if (loading && !skillsData) {
        return (
            <Card className="h-full">
                <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <RefreshCw className="h-12 w-12 text-teal-500 animate-spin mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Analyzing Real-Time Skills Data
                        </h3>
                        <p className="text-slate-600">
                            AI is processing current job market trends...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!skillsData) return null;

    return (
        <div className="space-y-4">
            {/* Header Card */}
            <Card className="border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500 rounded-lg">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    Real-Time CS Skills Demand
                                    <Badge className="bg-teal-500 text-white">AI Powered</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Live analysis of in-demand Computer Science skills in 2026
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            onClick={fetchSkillsTrends}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* AI Summary Alert */}
            <Alert className="border-blue-200 bg-blue-50">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                    <strong>AI Market Insight:</strong> {skillsData.summary}
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Skills Distribution</CardTitle>
                        <CardDescription>
                            Click on any segment to see details
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={400}>
                            <PieChart>
                                <Pie
                                    data={skillsData.categories}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={CustomLabel}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    dataKey="percentage"
                                    onClick={(data) => setSelectedCategory(data)}
                                    className="cursor-pointer"
                                >
                                    {skillsData.categories.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color}
                                            stroke={selectedCategory?.name === entry.name ? "#000" : "#fff"}
                                            strokeWidth={selectedCategory?.name === entry.name ? 3 : 1}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-500 text-center mt-2">
                            Last updated: {new Date(skillsData.lastUpdated).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                {/* Skills Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {selectedCategory ? selectedCategory.name : "Skill Categories"}
                        </CardTitle>
                        <CardDescription>
                            {selectedCategory 
                                ? "Detailed breakdown of this skill category" 
                                : "Click on a pie chart segment to see details"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedCategory ? (
                            <div className="space-y-4">
                                {/* Percentage */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-slate-600">Market Share</p>
                                        <p className="text-4xl font-bold text-teal-600">
                                            {selectedCategory.percentage}%
                                        </p>
                                    </div>
                                    <Badge className={`${getTrendColor(selectedCategory.trend)} border px-3 py-1`}>
                                        {getTrendIcon(selectedCategory.trend)}
                                        <span className="ml-1 font-semibold capitalize">
                                            {selectedCategory.trend}
                                        </span>
                                    </Badge>
                                </div>

                                {/* Top Skills */}
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-teal-600" />
                                        Top In-Demand Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCategory.topSkills.map((skill, idx) => (
                                            <Badge 
                                                key={idx} 
                                                style={{ backgroundColor: selectedCategory.color }}
                                                className="text-white text-sm px-3 py-1"
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Demand Reason */}
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs font-semibold text-blue-900 mb-1">
                                                Why This Matters
                                            </p>
                                            <p className="text-sm text-blue-800">
                                                {selectedCategory.demandReason}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    View All Categories
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {skillsData.categories.map((category, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 border border-slate-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer hover:border-teal-300"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                />
                                                <span className="font-semibold text-slate-900 text-sm">
                                                    {category.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getTrendIcon(category.trend)}
                                                <span className="font-bold text-teal-600">
                                                    {category.percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {category.topSkills.slice(0, 2).map((skill, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {category.topSkills.length > 2 && (
                                                <Badge variant="secondary" className="text-xs">
                                                    +{category.topSkills.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Legend Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Trend Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-slate-700">Increasing Demand</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Minus className="h-4 w-4 text-slate-600" />
                            <span className="text-slate-700">Stable Demand</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                            <span className="text-slate-700">Decreasing Demand</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

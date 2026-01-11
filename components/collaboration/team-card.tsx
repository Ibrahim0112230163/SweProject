import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamRecommendation } from "@/types/collaboration";
import { Check, Star, Users, Zap } from "lucide-react";

interface TeamCardProps {
    recommendation: TeamRecommendation;
    onConnect: (userId: string) => void;
}

export function TeamCard({ recommendation, onConnect }: TeamCardProps) {
    const teammate = recommendation.recommendedTeammates[0]; // Focusing on 1:1 for now
    const role = recommendation.suggestedRoles[teammate.id];

    return (
        <Card className="w-full max-w-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <Avatar className="h-14 w-14 border-2 border-primary/10">
                    <AvatarImage src={teammate.avatarUrl} alt={teammate.name} />
                    <AvatarFallback className="font-bold text-lg">{teammate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <CardTitle className="text-xl">{teammate.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                        {teammate.department} • {teammate.academicLevel}
                    </CardDescription>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-primary">{recommendation.compatibilityScore}%</div>
                    <span className="text-xs text-muted-foreground">Match</span>
                </div>
            </CardHeader>

            <CardContent className="grid gap-4 pt-4">
                {/* Progress Bar for Visual Impact */}
                <Progress value={recommendation.compatibilityScore} className="h-2" />

                {/* Why this match? */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                        <Zap className="w-4 h-4 text-yellow-500" /> AI Insights
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {recommendation.matchReasoning.map((reason, i) => (
                            <Badge key={i} variant="secondary" className="px-2 py-1 text-xs">
                                <Check className="w-3 h-3 mr-1 text-green-600" /> {reason}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Suggested Roles */}
                <div className="bg-muted/50 p-3 rounded-lg border border-dashed flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Suggested Role</span>
                        <span className="font-medium text-sm flex items-center gap-1">
                            <Users className="w-3 h-3" /> {role}
                        </span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Top Skill</span>
                        <span className="font-medium text-sm">
                            {teammate.skills[0]?.name || 'Collaboration'}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter>
                <Button className="w-full" onClick={() => onConnect(teammate.id)}>
                    Connect via Collaboration Agent
                </Button>
            </CardFooter>
        </Card>
    );
}

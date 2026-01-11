import { ChatSession } from "@/types/collaboration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatListProps {
    sessions: ChatSession[];
    currentUserId: string;
    selectedSessionId?: string;
    onSelectSession: (sessionId: string) => void;
}

export function ChatList({ sessions, currentUserId, selectedSessionId, onSelectSession }: ChatListProps) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] border rounded-lg bg-muted/10 p-4 text-center">
                <p className="text-muted-foreground text-sm">No active conversations.</p>
                <p className="text-xs text-muted-foreground mt-1">Connect with potential teammates to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Messages</h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="flex flex-col p-2 gap-1">
                    {sessions.map((session) => {
                        const otherParticipant = session.participants.find(p => p.id !== currentUserId) || session.participants[0];
                        const isSelected = selectedSessionId === session.id;

                        return (
                            <button
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-slate-50",
                                    isSelected && "bg-slate-100 dark:bg-slate-800"
                                )}
                            >
                                <Avatar className="h-10 w-10 mt-1">
                                    <AvatarImage src={otherParticipant.avatarUrl} alt={otherParticipant.name} />
                                    <AvatarFallback>{otherParticipant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm truncate">{otherParticipant.name}</span>
                                        {session.lastMessage && (
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(session.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                        {session.lastMessage ? session.lastMessage.content : "Start a conversation"}
                                    </p>
                                </div>
                                {session.unreadCount > 0 && (
                                    <span className="flex h-2 w-2 rounded-full bg-primary mt-2" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}

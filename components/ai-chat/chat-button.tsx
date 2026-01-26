import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function ChatButton({ isOpen, onClick }: ChatButtonProps) {
    return (
        <Button
            onClick={onClick}
            size="icon"
            className={cn(
                "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
            )}
        >
            {isOpen ? (
                <X className="h-6 w-6" />
            ) : (
                <MessageCircle className="h-6 w-6" />
            )}
            <span className="sr-only">Toggle Chat</span>
        </Button>
    );
}

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { File, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function ChatTabs({ activeTab, onTabChange }: ChatTabsProps) {
    return (
        <div className="flex items-center border-b border-border px-2">
            <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1">
                <TabsList className="h-10 bg-transparent p-0">
                    <TabsTrigger
                        value="chat"
                        className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        <File className="h-4 w-4" />
                        Chat
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    );
}

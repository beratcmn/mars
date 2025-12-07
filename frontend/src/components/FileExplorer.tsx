import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import * as api from "@/lib/api";
import type { FileEntry } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
    onFileSelect: (file: FileEntry) => void;
    className?: string;
}

export function FileExplorer({ onFileSelect, className }: FileExplorerProps) {
    const [files, setFiles] = useState<FileEntry[]>([]);

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        try {
            const rootFiles = await api.listFiles(".");
            setFiles(rootFiles);
        } catch (e) {
            console.error("Failed to load files:", e);
        }
    };

    return (
        <div className={cn("h-full overflow-y-auto bg-muted/20", className)}>
            <div className="p-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Explorer
            </div>
            <div className="text-sm">
                {files.map((file) => (
                    <FileTreeItem key={file.path} file={file} onSelect={onFileSelect} />
                ))}
            </div>
        </div>
    );
}

function FileTreeItem({
    file,
    onSelect,
}: {
    file: FileEntry;
    onSelect: (file: FileEntry) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState<FileEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!file.isDirectory) {
            onSelect(file);
            return;
        }

        if (!hasLoaded) {
            setIsLoading(true);
            try {
                const items = await api.listFiles(file.path);
                setChildren(items);
                setHasLoaded(true);
            } catch (e) {
                console.error("Failed to load directory:", e);
            } finally {
                setIsLoading(false);
            }
        }
        setIsOpen(!isOpen);
    };

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-1 py-1 px-2 cursor-pointer select-none transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "text-muted-foreground"
                )}
                onClick={handleToggle}
            >
                <span className="flex-shrink-0 w-4 flex justify-center">
                    {file.isDirectory ? (
                        isOpen ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                        )
                    ) : (
                        <span className="w-3.5" />
                    )}
                </span>

                <span className="flex-shrink-0">
                    {file.isDirectory ? (
                        <Folder className="h-4 w-4 text-blue-400" />
                    ) : (
                        <File className="h-4 w-4" />
                    )}
                </span>

                <span className="truncate ml-1 text-foreground">{file.name}</span>
            </div>

            {isOpen && (
                <div className="pl-3 border-l border-border/40 ml-2">
                    {isLoading ? (
                        <div className="text-xs text-muted-foreground py-1 px-4">Loading...</div>
                    ) : (
                        children.map((child) => (
                            <FileTreeItem key={child.path} file={child} onSelect={onSelect} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

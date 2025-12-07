import { useEffect, useState } from "react";
import * as api from "@/lib/api";

interface CodeViewerProps {
  filePath: string;
}

export function CodeViewer({ filePath }: CodeViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.readFile(filePath);
        if (data !== null) {
          setContent(data);
        } else {
          setError("Failed to load file content.");
        }
      } catch (e) {
        setError("Error loading file: " + String(e));
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      loadContent();
    }
  }, [filePath]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-muted/10 p-4 text-sm font-mono">
      <pre className="whitespace-pre-wrap break-all">{content}</pre>
    </div>
  );
}

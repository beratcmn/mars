import { useEffect, useState, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import * as api from "@/lib/api";

interface CodeViewerProps {
  filePath: string;
}

// Custom light theme (GitHub-inspired)
const customLightTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: "#24292e",
    background: "none",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "0.875rem",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.6",
    tabSize: 2,
  },
  'pre[class*="language-"]': {
    color: "#24292e",
    background: "transparent",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
    fontSize: "0.875rem",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.6",
    tabSize: 2,
    overflow: "auto",
    margin: 0,
    padding: "1rem",
  },
  comment: { color: "#6a737d", fontStyle: "italic" },
  prolog: { color: "#6a737d" },
  doctype: { color: "#6a737d" },
  cdata: { color: "#6a737d" },
  punctuation: { color: "#24292e" },
  property: { color: "#005cc5" },
  keyword: { color: "#d73a49" },
  tag: { color: "#22863a" },
  "class-name": { color: "#6f42c1" },
  boolean: { color: "#005cc5" },
  constant: { color: "#005cc5" },
  symbol: { color: "#e36209" },
  deleted: { color: "#d73a49" },
  number: { color: "#005cc5" },
  selector: { color: "#22863a" },
  "attr-name": { color: "#6f42c1" },
  string: { color: "#032f62" },
  char: { color: "#032f62" },
  builtin: { color: "#6f42c1" },
  inserted: { color: "#22863a" },
  variable: { color: "#e36209" },
  operator: { color: "#d73a49" },
  entity: { color: "#6f42c1" },
  url: { color: "#032f62" },
  ".language-css .token.string": { color: "#032f62" },
  ".style .token.string": { color: "#032f62" },
  atrule: { color: "#d73a49" },
  "attr-value": { color: "#032f62" },
  function: { color: "#6f42c1" },
  regex: { color: "#032f62" },
  important: { color: "#d73a49", fontWeight: "bold" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
};

// Map file extensions to language identifiers
const getLanguageFromPath = (filePath: string): string => {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    mjs: "javascript",
    cjs: "javascript",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    py: "python",
    pyw: "python",
    pyi: "python",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    rs: "rust",
    go: "go",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    md: "markdown",
    markdown: "markdown",
    sql: "sql",
    graphql: "graphql",
    dockerfile: "dockerfile",
    makefile: "makefile",
    rb: "ruby",
    php: "php",
    lua: "lua",
    r: "r",
    dart: "dart",
  };

  const filename = filePath.split("/").pop()?.toLowerCase() || "";
  if (filename === "dockerfile") return "dockerfile";
  if (filename === "makefile") return "makefile";
  if (filename.startsWith(".") && filename.endsWith("rc")) return "bash";

  return languageMap[ext] || "text";
};

export function CodeViewer({ filePath }: CodeViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const language = useMemo(() => getLanguageFromPath(filePath), [filePath]);

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
    <div className="h-full w-full overflow-auto bg-background">
      <SyntaxHighlighter
        language={language}
        style={customLightTheme}
        showLineNumbers
        lineNumberStyle={{
          minWidth: "3.5em",
          paddingRight: "1.5em",
          color: "#959da5",
          userSelect: "none",
          textAlign: "right",
        }}
        customStyle={{
          margin: 0,
          padding: "1rem 0",
          minHeight: "100%",
          background: "transparent",
        }}
        codeTagProps={{
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
          }
        }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
}

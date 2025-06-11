// src/components/MarkdownLatexProcessor.jsx
import TurndownService from "turndown";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

// Khởi tạo TurndownService
const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

// Quy tắc giữ nguyên LaTeX, bao gồm align*
turndownService.addRule("preserveLatex", {
  filter: (node) => {
    const textContent = node.textContent || "";
    return (
      textContent.includes("$") ||
      textContent.includes("$$") ||
      textContent.includes("\\begin{align*}") ||
      textContent.includes("\\end{align*}") ||
      textContent.includes("\\text") ||
      textContent.includes("\\begin{array}")
    );
  },
  replacement: (content, node) => {
    let textContent = node.textContent || "";
    textContent = textContent.replace(/<[^>]+>/g, "");
    // Bảo toàn khối align*
    if (textContent.includes("\\begin{align*}") && textContent.includes("\\end{align*}")) {
      return textContent;
    }
    // Bảo toàn khối array (bảng LaTeX)
    if (textContent.includes("\\begin{array}") && textContent.includes("\\end{array}")) {
      return textContent;
    }
    const blockLatexMatch = textContent.match(/\$\$(.*?)\$\$/s);
    const inlineLatexMatch = textContent.match(/(?<!\\)\$(.*?)(?<!\\)\$/s);
    if (blockLatexMatch) return blockLatexMatch[0];
    if (inlineLatexMatch) return inlineLatexMatch[0];
    return content;
  },
});

// Quy tắc chuyển đổi bảng Markdown thành LaTeX array
turndownService.addRule("convertTableToLatex", {
  filter: ["table"],
  replacement: (content, node) => {
    const rows = node.querySelectorAll("tr");
    let latexTable = "\\begin{array}{|c|";
    const cols = rows[0].querySelectorAll("th, td").length;
    for (let i = 0; i < cols - 1; i++) latexTable += "c|"; // Tạo số cột phù hợp
    latexTable += "}\n\\hline\n";
    rows.forEach((row, i) => {
      const cells = row.querySelectorAll("th, td");
      cells.forEach((cell, j) => {
        let cellContent = cell.textContent.trim();
        // Thay thế các ký hiệu đặc biệt nếu cần
        cellContent = cellContent.replace(/\n/g, " ").replace(/\s+/g, " ");
        latexTable += cellContent;
        if (j < cells.length - 1) latexTable += " & ";
      });
      latexTable += " \\\\\n";
      if (i < rows.length - 1) latexTable += "\\hline\n";
    });
    latexTable += "\\hline\n\\end{array}";
    return `$$${latexTable}$$`; // Bao quanh bằng $$ để render bằng KaTeX
  },
});

// Xử lý code blocks
turndownService.addRule("preserveCode", {
  filter: ["code", "pre"],
  replacement: (content, node) => {
    if (node.nodeName === "PRE" || node.parentNode.nodeName === "PRE") {
      return "```\n" + content.trim() + "\n```";
    }
    return "`" + content.trim() + "`";
  },
});

// Hàm thêm dòng trống trước và sau danh sách, bảng, và khối LaTeX
const ensureSpacing = (text) => {
  let lines = text.split("\n");
  let result = [];
  let inList = false;
  let inLatexBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isListItem = line.startsWith("- ");
    const isLatexBlockStart = line.includes("\\begin{");
    const isLatexBlockEnd = line.includes("\\end{");

    // Xử lý danh sách
    if (isListItem && !inList) {
      if (i > 0 && result[result.length - 1] !== "") result.push("");
      inList = true;
    } else if (!isListItem && inList) {
      result.push("");
      inList = false;
    }

    // Xử lý khối LaTeX (bao gồm align* và array)
    if (isLatexBlockStart && !inLatexBlock) {
      if (i > 0 && result[result.length - 1] !== "") result.push("");
      inLatexBlock = true;
    } else if (isLatexBlockEnd && inLatexBlock) {
      inLatexBlock = false;
      result.push("");
    }

    result.push(lines[i]);
  }

  if (inList || inLatexBlock) result.push("");
  return result.join("\n");
};

// Component MessageContent
export const MessageContent = ({ text, isBot, textColorPrimary, textShadow }) => {
  const processedText = useMemo(() => {
    let result = text;

    if (isBot) {
      try {
        result = ensureSpacing(text); // Thêm khoảng cách cho danh sách và LaTeX
      } catch (error) {
        console.error("Error processing bot message:", error);
        return `⚠️ Error processing content: ${error.message}`;
      }
    }

    return result;
  }, [text, isBot]);

  try {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ node, ...props }) => (
            <p
              className="text-base leading-relaxed"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) => (
            <code
              className={`${inline ? "bg-gray-200 dark:bg-gray-700 px-1 rounded" : "block bg-gray-200 dark:bg-gray-700 p-2 rounded my-2"} ${className || ""}`}
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            >
              {children}
            </code>
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-inside my-2"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal list-inside my-2"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li
              className="my-1"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          h1: ({ node, ...props }) => (
            <h1
              className="text-2xl font-bold my-2"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-xl font-semibold my-2"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-lg font-medium my-2"
              style={{ color: textColorPrimary, textShadow }}
              {...props}
            />
          ),
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{
                color: "#1a73e8", // Always sets the color to #1a73e8
                textShadow, // Include textShadow if needed
              }}
              {...props}
            >
              {children}
            </a>
          ),
          
        }}
      >
        {processedText}
      </ReactMarkdown>
    );
  } catch (error) {
    console.error("Error rendering Markdown:", error);
    return (
      <p style={{ color: textColorPrimary, textShadow }}>
        ⚠️ Unable to render content: Render error ({error.message})
      </p>
    );
  }
};

export const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-4xl font-bold text-red-500">404 - Not Found</h1>
    <p className="mt-4 text-lg">The chat you're looking for doesn't exist.</p>
    <a href="/" className="mt-4 text-blue-500 underline">
      Go back to Home
    </a>
  </div>
);
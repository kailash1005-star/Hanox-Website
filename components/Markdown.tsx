import React from "react";

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to match bold (any combination of 1 or 2 asterisks on both sides) and links ([text](url "title") or [text](url))
  const regex = /(\*{1,2}.*?\*{1,2}|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      const startAsterisks = part.match(/^\*+/)?.[0].length || 0;
      const endAsterisks = part.match(/\*+$/)?.[0].length || 0;
      const inner = part.slice(startAsterisks, -endAsterisks);
      return <strong key={index}>{parseInlineMarkdown(inner)}</strong>;
    }
    if (part.startsWith("[") && part.includes("](")) {
      const closeBracket = part.indexOf("]");
      const openParen = part.indexOf("(");
      const closeParen = part.lastIndexOf(")");
      if (closeBracket !== -1 && openParen !== -1 && closeParen !== -1) {
        const linkText = part.slice(1, closeBracket);
        let url = part.slice(openParen + 1, closeParen);
        const quoteIndex = url.indexOf(" ");
        if (quoteIndex !== -1) {
          url = url.slice(0, quoteIndex).replace(/['"]/g, "");
        }
        return (
          <a key={index} href={url} target="_blank" rel="noopener noreferrer">
            {linkText}
          </a>
        );
      }
    }
    return part;
  });
}

interface MarkdownProps {
  text: string;
}

export function Markdown({ text }: MarkdownProps) {
  if (!text) return null;

  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let currentTable: string[][] = [];
  let listKey = 0;
  let tableKey = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="pd__description-list">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      const hasSeparator = currentTable.length > 1 && currentTable[1].every(cell => cell.trim().startsWith("-"));
      const headers = currentTable[0].map(cell => cell.trim());
      const rows = currentTable.slice(hasSeparator ? 2 : 1).map(row => row.map(cell => cell.trim()));

      elements.push(
        <div key={`table-${tableKey++}`} className="pd__md-table-wrapper">
          <table className="pd__md-table">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{parseInlineMarkdown(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci}>{parseInlineMarkdown(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      currentTable = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if it's a table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList(); // Make sure list is flushed before starting a table
      
      const cells = trimmed.split("|").slice(1, -1);
      currentTable.push(cells);
      continue;
    }

    // If we were parsing a table and the current line is not a table row, flush the table
    if (currentTable.length > 0) {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      const content = trimmed.slice(4);
      elements.push(
        <h3 key={`h3-${i}`} className="pd__description-h3">
          {parseInlineMarkdown(content)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      const content = trimmed.slice(3);
      elements.push(
        <h2 key={`h2-${i}`} className="pd__description-h2">
          {parseInlineMarkdown(content)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList();
      const content = trimmed.slice(2);
      elements.push(
        <h1 key={`h1-${i}`} className="pd__description-h1">
          {parseInlineMarkdown(content)}
        </h1>
      );
    } 
    // Bullet list checks (Only match when followed by space or specific unicode checkmarks)
    else if (
      trimmed.startsWith("✔") ||
      trimmed.startsWith("✓") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("• ")
    ) {
      let content = trimmed;
      const bulletChars = ["✔", "✓", "- ", "* ", "• "];
      for (const char of bulletChars) {
        if (trimmed.startsWith(char)) {
          content = trimmed.slice(char.length).trim();
          break;
        }
      }
      currentList.push(
        <li key={`li-${i}`} className="pd__description-li">
          <span className="pd__description-bullet">✔</span>
          <span className="pd__description-li-content">{parseInlineMarkdown(content)}</span>
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className="pd__description-p">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  }

  // Flush any remaining tables or lists at the end
  flushList();
  flushTable();

  return <div className="pd__description-content">{elements}</div>;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// --- paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_DIR = path.join(__dirname, "docs");

// Map source id -> filename (kamu bisa tambah nanti)
const SOURCES = {
  nextjs: "nextjs-llms-full.txt",
  shadcn: "shadcn-llms-full.txt",
  tiptap: "tiptap-llms-full.txt",
  betterauth: "betterauth-llms-full.txt",
};

// Load docs into memory once (local files, jadi aman dan cepat)
function loadAllDocs() {
  const loaded = {};
  for (const [id, filename] of Object.entries(SOURCES)) {
    const p = path.join(DOCS_DIR, filename);
    const text = fs.readFileSync(p, "utf8");
    loaded[id] = { id, filename, path: p, text };
  }
  return loaded;
}

const DOCS = loadAllDocs();

/**
 * Ambil beberapa "hit" sederhana:
 * - cari baris yg mengandung query
 * - ambil context ±N baris sebagai snippet
 *
 * NOTE: Ini search sederhana (string match). Kalau nanti mau lebih pinter,
 * kita bisa upgrade ke full-text index.
 */
function searchText({ text, query, limit = 5, contextLines = 4 }) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const lines = text.split(/\r?\n/);
  const hits = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(q)) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length, i + contextLines + 1);
      const snippet = lines.slice(start, end).join("\n").trim();
      hits.push({ line: i + 1, snippet });
      if (hits.length >= limit) break;
    }
  }

  return hits;
}

// --- MCP server ---
const server = new McpServer({
  name: "local-docs-hub",
  version: "0.1.0",
});

/**
 * Tool utama:
 * search_docs(query, sources?, limit?)
 *
 * Balikannya kita kasih JSON string biar gampang dipakai model.
 */
server.tool(
  "search_docs",
  {
    query: z.string().min(1),
    sources: z
      .array(z.enum(["nextjs", "shadcn", "tiptap", "betterauth"]))
      .optional(),
    limit: z.number().int().min(1).max(20).optional(),
  },
  async ({ query, sources, limit }) => {
    const chosen = sources?.length
      ? sources
      : ["nextjs", "shadcn", "tiptap", "betterauth"];
    const perSourceLimit = Math.max(
      1,
      Math.floor((limit ?? 8) / chosen.length)
    );

    const results = [];

    for (const src of chosen) {
      const doc = DOCS[src];
      const hits = searchText({ text: doc.text, query, limit: perSourceLimit });

      for (const h of hits) {
        // URL sumber:
        // - Kalau file kamu ada URL per section, nanti kita bisa parsing.
        // - Untuk sekarang: kasih "file://" lokal + line number sebagai rujukan.
        const url = `file://${doc.path}#L${h.line}`;

        results.push({
          source: src,
          url,
          snippet: h.snippet,
        });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              query,
              results,
              note: "URL menggunakan file:// lokal + #L (line). Kalau kamu mau URL web asli per halaman, nanti kita upgrade dengan parser metadata.",
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Start stdio transport (yang dipakai Codex)
const transport = new StdioServerTransport();
await server.connect(transport);

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

function parseArgs(argv) {
  const args = { in: "", out: "", concurrency: 2, delayMs: 350 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in") args.in = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--concurrency") args.concurrency = Number(argv[++i] ?? 2);
    else if (a === "--delay") args.delayMs = Number(argv[++i] ?? 350);
  }
  if (!args.in || !args.out) {
    console.error(
      "Usage: node crawl-tiptap.mjs --in <input.txt> --out <output.txt> [--concurrency 2] [--delay 350]"
    );
    process.exit(1);
  }
  if (!Number.isFinite(args.concurrency) || args.concurrency < 1)
    args.concurrency = 2;
  if (!Number.isFinite(args.delayMs) || args.delayMs < 0) args.delayMs = 350;
  return args;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Extract markdown links: [text](url)
 * Also supports bare URLs on a line.
 */
function extractUrls(text) {
  const urls = new Set();

  // markdown links
  const mdLinkRe = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
  let m;
  while ((m = mdLinkRe.exec(text)) !== null) {
    urls.add(m[1].trim());
  }

  // bare URLs (fallback)
  const bareRe = /(https?:\/\/[^\s)]+)/g;
  while ((m = bareRe.exec(text)) !== null) {
    urls.add(m[1].trim());
  }

  // normalize remove trailing punctuation
  return [...urls].map((u) => u.replace(/[),.;]+$/g, ""));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      // some sites block empty UA
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml")
  ) {
    // still try to read as text
  }
  return await res.text();
}

function toPlainText(str) {
  return (str || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractReadableText(html, url) {
  // JSDOM needs a URL for proper parsing of relative links
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // drop obvious noise
  for (const sel of [
    "nav",
    "header",
    "footer",
    "aside",
    "script",
    "style",
    "noscript",
  ]) {
    doc.querySelectorAll(sel).forEach((n) => n.remove());
  }

  const reader = new Readability(doc);
  const article = reader.parse();

  // fallback if readability fails
  if (!article || !article.textContent) {
    const title = (doc.querySelector("title")?.textContent || "").trim();
    const bodyText = doc.body?.textContent || "";
    return {
      title: title || "Untitled",
      text: toPlainText(bodyText),
    };
  }

  return {
    title: (article.title || "").trim() || "Untitled",
    text: toPlainText(article.textContent),
  };
}

async function workerLoop(queue, outChunks, opts) {
  while (true) {
    const item = queue.shift();
    if (!item) return;

    const { url, idx, total } = item;

    try {
      console.error(`[${idx + 1}/${total}] Fetching: ${url}`);
      const html = await fetchHtml(url);
      const { title, text } = extractReadableText(html, url);

      // if text is too short, still keep it but mark
      const finalText =
        text.length < 200
          ? `${text}\n\n[NOTE] Extracted text is short; page may be highly interactive.`
          : text;

      outChunks[idx] =
        `\n\n=== SOURCE: ${url} ===\n` +
        `TITLE: ${title}\n\n` +
        `${finalText}\n`;
    } catch (err) {
      outChunks[idx] =
        `\n\n=== SOURCE: ${url} ===\n` +
        `ERROR: ${String(err?.message || err)}\n`;
    }

    // politeness delay
    if (opts.delayMs > 0) await sleep(opts.delayMs);
  }
}

async function main() {
  const args = parseArgs(process.argv);

  const inPath = path.resolve(process.cwd(), args.in);
  const outPath = path.resolve(process.cwd(), args.out);

  const input = fs.readFileSync(inPath, "utf8");
  const urls = extractUrls(input);

  if (urls.length === 0) {
    console.error("No URLs found in input file.");
    process.exit(1);
  }

  console.error(`Found ${urls.length} URLs.`);

  const queue = urls.map((url, idx) => ({ url, idx, total: urls.length }));
  const outChunks = new Array(urls.length).fill("");

  const workers = [];
  const concurrency = Math.min(args.concurrency, 6); // safety cap
  for (let i = 0; i < concurrency; i++) {
    workers.push(workerLoop(queue, outChunks, args));
  }
  await Promise.all(workers);

  const header =
    `# Tiptap Docs (Full Extract)\n` +
    `# Generated: ${new Date().toISOString()}\n` +
    `# From: ${inPath}\n` +
    `# URLs: ${urls.length}\n` +
    `# Concurrency: ${concurrency}, DelayMs: ${args.delayMs}\n\n`;

  fs.writeFileSync(outPath, header + outChunks.join("\n"), "utf8");
  console.error(`Done. Wrote: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

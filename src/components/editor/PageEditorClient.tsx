"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSONContent } from "@tiptap/core";

import TiptapEditor from "./TiptapEditor";
import { createDebouncedSaver } from "@/src/lib/utils/debouncedSaver";

type SaveStatus = "Idle" | "Saving" | "Saved" | "Error";

const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

const coerceDoc = (content: unknown): JSONContent => {
  if (
    content &&
    typeof content === "object" &&
    (content as { type?: unknown }).type === "doc" &&
    Array.isArray((content as { content?: unknown }).content)
  ) {
    return content as JSONContent;
  }

  return EMPTY_DOC;
};

const formatStatus = (status: SaveStatus) => {
  switch (status) {
    case "Saving":
      return "Saving...";
    case "Saved":
      return "Saved";
    case "Error":
      return "Save failed";
    default:
      return "Idle";
  }
};

const PageEditorClient = ({ pageId }: { pageId: string }) => {
  const [initialContent, setInitialContent] = useState<JSONContent | null>(
    null
  );
  const [title, setTitle] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("Idle");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const contentVersionRef = useRef(1);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    let active = true;

    const loadPage = async () => {
      setLoading(true);
      setLoadError(null);
      setInitialContent(null);
      setSaveStatus("Idle");

      try {
        const response = await fetch(`/api/pages/${pageId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load page (${response.status})`);
        }

        const data = (await response.json()) as {
          title?: string;
          content?: unknown;
          contentVersion?: number;
        };

        if (!active) {
          return;
        }

        setTitle(data.title ?? "");
        const version = data.contentVersion ?? 1;
        contentVersionRef.current = version;
        setInitialContent(coerceDoc(data.content));
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load page"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      active = false;
    };
  }, [pageId]);

  const savePage = useCallback(
    async (payload: { content: JSONContent; requestId: number }) => {
      try {
        const response = await fetch(`/api/pages/${pageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: payload.content,
            contentVersion: contentVersionRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error(`Save failed (${response.status})`);
        }

        const data = (await response.json()) as {
          contentVersion?: number;
        };
        const nextVersion =
          typeof data.contentVersion === "number"
            ? data.contentVersion
            : contentVersionRef.current + 1;
        contentVersionRef.current = nextVersion;

        if (payload.requestId === latestRequestRef.current) {
          setSaveStatus("Saved");
        }
      } catch {
        if (payload.requestId === latestRequestRef.current) {
          setSaveStatus("Error");
        }
      }
    },
    [pageId]
  );

  const debouncedSaver = useMemo(
    () => createDebouncedSaver(savePage, 800),
    [savePage]
  );

  useEffect(() => {
    return () => {
      debouncedSaver.cancel();
    };
  }, [debouncedSaver]);

  const handleEditorChange = useCallback(
    (content: JSONContent) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;
      setSaveStatus("Saving");
      debouncedSaver.requestSave({ content, requestId });
    },
    [debouncedSaver]
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (loadError) {
    return (
      <div className="text-sm text-destructive">Error: {loadError}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title || "Untitled"}</div>
          <div className="text-xs text-muted-foreground">
            {formatStatus(saveStatus)}
          </div>
        </div>
      </div>
      <TiptapEditor initialContent={initialContent} onChange={handleEditorChange} />
    </div>
  );
};

export default PageEditorClient;

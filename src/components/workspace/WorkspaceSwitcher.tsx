"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

type WorkspacesResponse = {
  activeWorkspaceId: string | null;
  workspaces: Workspace[];
};

const WorkspaceSwitcher = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  );
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load workspaces");
      }
      const data = (await res.json()) as WorkspacesResponse;
      setWorkspaces(data.workspaces);
      setActiveWorkspaceId(data.activeWorkspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspaces();
  }, []);

  const handleSwitch = async (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    const res = await fetch("/api/workspaces/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    if (!res.ok) {
      setError("Unable to switch workspace");
      await loadWorkspaces();
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to create workspace");
      }
      const workspace = (await res.json()) as Workspace;
      setWorkspaces((prev) => [...prev, workspace]);
      setActiveWorkspaceId(workspace.id);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={activeWorkspaceId ?? ""}
        onChange={(event) => handleSwitch(event.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name} ({workspace.role})
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New workspace"
          className="h-9 w-40"
        />
        <Button size="sm" onClick={handleCreate} disabled={submitting}>
          Create
        </Button>
      </div>

      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  );
};

export default WorkspaceSwitcher;

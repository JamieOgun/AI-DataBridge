"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Database, Copy, Check, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface MCPInstance {
  id: string;
  name: string;
  description: string;
  url: string;
  allowedTables: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const categoryColors: Record<string, { border: string; icon: string; badge: string }> = {
  sales: {
    border: "border-l-blue-500",
    icon: "text-blue-600",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
  },
  hr: {
    border: "border-l-purple-500",
    icon: "text-purple-600",
    badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
  },
  inventory: {
    border: "border-l-green-500",
    icon: "text-green-600",
    badge: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
  },
  finance: {
    border: "border-l-amber-500",
    icon: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
  },
  support: {
    border: "border-l-pink-500",
    icon: "text-pink-600",
    badge: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800"
  },
  default: {
    border: "border-l-slate-500",
    icon: "text-slate-600",
    badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800"
  }
};

export default function Home() {
  const [mcpInstances, setMcpInstances] = useState<MCPInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    allowedTables: ""
  });

  // Fetch MCP instances on mount
  useEffect(() => {
    fetchMCPInstances();
  }, []);

  const fetchMCPInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/mcp`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setMcpInstances(data);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `${err.message} (API: ${API_BASE_URL}/mcp)`
        : `Failed to fetch MCP instances (API: ${API_BASE_URL}/mcp)`;
      setError(errorMessage);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddMCP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.allowedTables) {
      setError("Name and Allowed Tables are required.");
      return;
    }

    try {
      setError(null);
      const allowedTables = formData.allowedTables
        .split(",")
        .map(table => table.trim())
        .filter(table => table.length > 0);

      if (allowedTables.length === 0) {
        setError("Please provide at least one allowed table");
        return;
      }

      const requestBody = {
        name: formData.name,
        description: formData.description || "",
        allowedTables: allowedTables
      };

      const response = await fetch(`${API_BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      await fetchMCPInstances();
      setFormData({
        name: "",
        description: "",
        allowedTables: ""
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create MCP instance");
    }
  };

  const handleDeleteMCP = async (id: string) => {
    if (!confirm("Are you sure you want to delete this MCP instance?")) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/mcp/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchMCPInstances();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete MCP instance");
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setFormData({
      name: "",
      description: "",
      allowedTables: ""
    });
  };

  const getCategoryColors = (category?: string) => {
    return categoryColors[category || "default"] || categoryColors.default;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* MCP Instances Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading MCP instances...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Add MCP Server Card */}
            <Card className="flex flex-col border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/50 transition-colors bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Plus className="h-5 w-5 text-primary" />
                      </div>
                      Add MCP Server
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed">
                      Create a new MCP instance to share organization data with your LLMs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {!showAddForm ? (
                  <Button
                    onClick={() => setShowAddForm(true)}
                    variant="outline"
                    className="w-full mt-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New MCP Server
                  </Button>
                ) : (
                  <form onSubmit={handleAddMCP} className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <Label htmlFor="name">MCP Server Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Marketing Analytics MCP"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what this MCP instance provides access to..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedTables">Allowed Tables *</Label>
                      <Input
                        id="allowedTables"
                        placeholder="sales, customers, products"
                        value={formData.allowedTables}
                        onChange={(e) => setFormData({ ...formData, allowedTables: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter table names separated by commas
                      </p>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <Button type="submit" className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Add MCP Server
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {mcpInstances.map((mcp) => {
              const colors = getCategoryColors("default");
              return (
              <Card 
                key={mcp.id} 
                className={`flex flex-col border-l-4 ${colors.border} shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.badge}`}>
                          <Database className={`h-5 w-5 ${colors.icon}`} />
                        </div>
                        <span className="font-semibold">{mcp.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {mcp.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col space-y-4">
                  {/* MCP Endpoint Section */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">MCP Endpoint</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-mono break-all border border-slate-200 dark:border-slate-700">
                        {mcp.url}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => copyToClipboard(mcp.url, mcp.id)}
                        title="Copy MCP Endpoint"
                      >
                        {copiedId === mcp.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Allowed Tables Section */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Allowed Tables
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {mcp.allowedTables.map((table) => (
                        <Badge
                          key={table}
                          variant="secondary"
                          className={`font-mono text-xs font-medium border ${colors.badge}`}
                        >
                          {table}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => handleDeleteMCP(mcp.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="border-l-4 border-l-slate-500 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">About MCP Instances</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Each MCP instance provides secure access to specific database tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                MCP (Model Context Protocol) instances allow LLMs to securely query and interact
                with your organization's data. Each instance is configured with specific table access
                permissions to ensure data security and proper access control.
              </p>
              <p>
                Click on any MCP card to view its endpoint URL and see which database tables are
                accessible through that instance.
          </p>
        </div>
          </CardContent>
        </Card>
        </div>
    </div>
  );
}

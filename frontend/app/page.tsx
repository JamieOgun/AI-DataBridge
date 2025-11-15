"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Database, Copy, Check, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MCPInstance {
  id: string;
  name: string;
  description: string;
  url: string;
  allowedTables: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Color scheme based on number of allowed tables
const getColorsByTableCount = (count: number): { border: string; icon: string; badge: string } => {
  const colorSchemes: Record<number, { border: string; icon: string; badge: string }> = {
    1: {
      border: "border-l-blue-500",
      icon: "text-blue-600",
      badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
    },
    2: {
      border: "border-l-green-500",
      icon: "text-green-600",
      badge: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
    },
    3: {
      border: "border-l-purple-500",
      icon: "text-purple-600",
      badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
    },
    4: {
      border: "border-l-amber-500",
      icon: "text-amber-600",
      badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
    }
  };

  // For 5+ tables, use pink/red
  if (count >= 5) {
    return {
      border: "border-l-pink-500",
      icon: "text-pink-600",
      badge: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800"
    };
  }

  return colorSchemes[count] || colorSchemes[1];
};

export default function Home() {
  const [mcpInstances, setMcpInstances] = useState<MCPInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    claude: false,
    chatgpt: false
  });
  const [copiedSection, setCopiedSection] = useState<{ [key: string]: boolean }>({
    claude: false,
    chatgpt: false
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    allowedTables: [] as string[]
  });

  const availableCategories = [
    { value: "Sales", label: "Sales", description: "Customers, Orders, Invoices, CustomerTransactions" },
    { value: "Purchasing", label: "Purchasing", description: "Suppliers, PurchaseOrders, SupplierTransactions" },
    { value: "Warehouse", label: "Warehouse", description: "StockItems, StockItemHoldings, StockItemTransactions" },
    { value: "Application", label: "Application", description: "People, Cities, Countries, DeliveryMethods" },
  ];

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copySectionInstructions = (section: "claude" | "chatgpt") => {
    let instructions = "";

    if (section === "claude") {
      instructions = `# Adding Remote MCP to Claude Desktop

1. Open the Claude Desktop application
2. Navigate to Settings → Connectors
3. Click on "Add custom connector"
4. Paste your MCP endpoint URL (copied from one of the MCP cards)
5. If prompted, complete any required authentication flow
6. Click "Add" to save the connector
7. In a chat, open the tools/search panel and enable this connector for the conversation

Your MCP endpoint URL format:
\`https://your-domain.com/llm/mcp?instance_id={uuid}\``;
    } else if (section === "chatgpt") {
      instructions = `# Adding Remote MCP to ChatGPT Dev Mode

1. Open ChatGPT and navigate to Settings → Developer Mode
2. In the MCP Servers section, click "Add Server"
3. Enter your MCP endpoint URL
4. Save the configuration
5. The MCP server will be available in your ChatGPT sessions

Your MCP endpoint URL format:
\`https://your-domain.com/llm/mcp?instance_id={uuid}\``;
    }

    navigator.clipboard.writeText(instructions);
    setCopiedSection(prev => ({
      ...prev,
      [section]: true
    }));
    setTimeout(
      () =>
        setCopiedSection(prev => ({
          ...prev,
          [section]: false
        })),
      2000
    );
  };

  const handleAddMCP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.allowedTables.length === 0) {
      setError("Name and at least one category are required.");
      return;
    }

    try {
      setError(null);

      const requestBody = {
        name: formData.name,
        description: formData.description || "",
        allowedTables: formData.allowedTables
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
        allowedTables: []
      });
      setIsModalOpen(false);
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
    setIsModalOpen(false);
    setFormData({
      name: "",
      description: "",
      allowedTables: []
    });
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      allowedTables: prev.allowedTables.includes(category)
        ? prev.allowedTables.filter(c => c !== category)
        : [...prev.allowedTables, category]
    }));
  };

  const getTableCountColors = (allowedTables: string[]) => {
    const count = allowedTables.length;
    return getColorsByTableCount(count);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
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
            <Card 
              onClick={() => setIsModalOpen(true)}
              className="flex flex-col border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/50 transition-colors bg-white dark:from-slate-900/50 dark:to-slate-950 cursor-pointer hover:shadow-md shadow-sm"
            >
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
              <CardContent className="flex-1 flex flex-col items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Plus className="h-8 w-8" />
                  <p className="text-sm font-medium">Click to add new MCP Server</p>
                </div>
              </CardContent>
            </Card>

            {mcpInstances.map((mcp) => {
              const colors = getTableCountColors(mcp.allowedTables);
              return (
              <Card 
                key={mcp.id} 
                className={`flex flex-col border-l-4 ${colors.border} shadow-md hover:shadow-lg transition-all duration-200 bg-white dark:from-slate-900 dark:to-slate-950/50`}
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

        {/* MCP Setup Instructions */}
        <Card className="border-l-4 border-l-primary bg-white shadow-md dark:from-slate-900/50 dark:to-slate-950">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">Setup Instructions</CardTitle>
            <CardDescription className="text-sm leading-relaxed mt-1">
              How to add remote MCP to Claude Desktop and ChatGPT Dev Mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {/* Claude Desktop Section */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection("claude")}
                    className="flex items-center justify-between flex-1 text-left"
                  >
                    <h3 className="font-semibold text-base">Claude Desktop</h3>
                    {expandedSections.claude ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground ml-3" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground ml-3" />
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => copySectionInstructions("claude")}
                    title="Copy Claude Desktop instructions"
                  >
                    {copiedSection.claude ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {expandedSections.claude && (
                  <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Open the Claude Desktop application</li>
                      <li>Navigate to <span className="font-medium">Settings → Connectors</span></li>
                      <li>Click <span className="font-medium">Add custom connector</span></li>
                      <li>Paste your MCP endpoint URL from one of the MCP cards above</li>
                      <li>If prompted, complete any required authentication flow</li>
                      <li>Click <span className="font-medium">Add</span> to save the connector</li>
                      <li>In a chat, open the tools/search panel and enable this connector for the conversation</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* ChatGPT Dev Mode Section */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleSection("chatgpt")}
                    className="flex items-center justify-between flex-1 text-left"
                  >
                    <h3 className="font-semibold text-base">ChatGPT Dev Mode</h3>
                    {expandedSections.chatgpt ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground ml-3" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground ml-3" />
                    )}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => copySectionInstructions("chatgpt")}
                    title="Copy ChatGPT Dev Mode instructions"
                  >
                    {copiedSection.chatgpt ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {expandedSections.chatgpt && (
                  <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Open ChatGPT and navigate to Settings → Developer Mode</li>
                      <li>In the MCP Servers section, click "Add Server"</li>
                      <li>Enter your MCP endpoint URL</li>
                      <li>Save the configuration</li>
                      <li>The MCP server will be available in your ChatGPT sessions</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Copy the endpoint URL from any MCP instance card above and use it in the configurations above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-l-4 border-l-slate-500 bg-white shadow-md dark:from-slate-900/50 dark:to-slate-950">
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

        {/* Add MCP Server Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New MCP Server</DialogTitle>
              <DialogDescription>
                Create a new MCP instance to share organization data with your LLMs
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMCP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="modal-name">MCP Server Name *</Label>
                <Input
                  id="modal-name"
                  placeholder="e.g., Marketing Analytics MCP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-description">Description</Label>
                <Textarea
                  id="modal-description"
                  placeholder="Describe what this MCP instance provides access to..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed Tables (Categories) *</Label>
                <div className="space-y-2 border rounded-md p-3 bg-slate-50 dark:bg-slate-900 max-h-[300px] overflow-y-auto">
                  {availableCategories.map((category) => (
                    <div key={category.value} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={`modal-category-${category.value}`}
                        checked={formData.allowedTables.includes(category.value)}
                        onChange={() => toggleCategory(category.value)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`modal-category-${category.value}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="font-medium">{category.label}</div>
                        <div className="text-xs text-muted-foreground">{category.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
                {formData.allowedTables.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {formData.allowedTables.join(", ")}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelForm}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Add MCP Server
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

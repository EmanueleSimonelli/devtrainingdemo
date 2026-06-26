/*
 * DealDesk MCP Server
 *
 * Connect with:
 *   claude mcp add dealdesk -- node /home/emanuele/dev/git/devtrainingdemo/mcp/index.js
 *
 * Requires the back-end to be running:
 *   cd ../server && npm start   # listens on http://localhost:3001
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE = "http://localhost:3001";

const server = new Server(
  { name: "dealdesk", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_deals",
      description: "Search / filter PMP deals in the DealDesk system.",
      inputSchema: {
        type: "object",
        properties: {
          q:        { type: "string",  description: "Free-text search term" },
          format:   { type: "string",  description: "Ad format (e.g. display, video)" },
          status:   { type: "string",  description: "Deal status (e.g. active, paused)" },
          dealType: { type: "string",  description: "Deal type (e.g. PMP, PG)" },
          state:    { type: "string",  description: "Target US state abbreviation" },
          floorMin: { type: "number",  description: "Minimum floor CPM" },
          floorMax: { type: "number",  description: "Maximum floor CPM" },
        },
      },
    },
    {
      name: "get_deal",
      description: "Retrieve a single PMP deal by its ID.",
      inputSchema: {
        type: "object",
        properties: {
          dealId: { type: "string", description: "The deal's unique identifier" },
        },
        required: ["dealId"],
      },
    },
    {
      name: "add_deal",
      description: "Create a new PMP deal in the DealDesk system.",
      inputSchema: {
        type: "object",
        properties: {
          name:         { type: "string" },
          buyerId:      { type: "string" },
          publisherId:  { type: "string" },
          format:       { type: "string" },
          dealType:     { type: "string" },
          device:       { type: "string" },
          floorCpm:     { type: "number" },
          currency:     { type: "string" },
          status:       { type: "string" },
          targetStates: { type: "array", items: { type: "string" } },
          startDate:    { type: "string", description: "ISO 8601 date" },
          endDate:      { type: "string", description: "ISO 8601 date" },
        },
        required: ["name", "buyerId", "publisherId", "format", "dealType", "floorCpm", "currency"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    let response;
    if (name === "search_deals") {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(args ?? {})) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.size ? "?" + params.toString() : "";
      response = await fetch(`${BASE}/api/deals${qs}`);
    } else if (name === "get_deal") {
      response = await fetch(`${BASE}/api/deals/${args.dealId}`);
    } else if (name === "add_deal") {
      response = await fetch(`${BASE}/api/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }
    const data = await response.json();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

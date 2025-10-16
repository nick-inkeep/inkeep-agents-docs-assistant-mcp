#!/bin/bash

# Test the MCP server by calling the guidance tool
# This uses the SSE endpoint

echo "Testing guidance-on-agents-sdk tool..."
echo ""

# Initialize the connection
curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  "https://inkeep-agents-docs-assistant-mcp-two.preview.inkeep.com/mcp" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "guidance-on-agents-sdk",
      "arguments": {}
    }
  }'

echo ""
echo ""
echo "Test complete!"

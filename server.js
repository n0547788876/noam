require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { z } = require('zod');

const app = express();
app.use(express.json());

const API_KEY = process.env.INVOICE_MAVEN_API_KEY;
const PORT = process.env.PORT || 3000;
const IM_URL = 'https://app.invoice-maven.co.il/api/documents/addDocument';

// MCP Server
const mcpServer = new McpServer({
  name: 'invoice-maven',
  version: '1.0.0'
});

mcpServer.tool(
  'create_document',
  'Create an invoice, quote or receipt in Invoice Maven',
  {
    doc_type: z.number().describe('305=invoice, 10=quote, 320=invoice+receipt, 400=receipt'),
    customer_name: z.string().describe('Customer name'),
    customer_email: z.string().optional().describe('Customer email'),
    customer_phone: z.string().optional().describe('Customer phone'),
    items: z.array(z.object({
      description: z.string(),
      price: z.number(),
      quantity: z.number().optional().default(1)
    })).describe('List of items'),
    description: z.string().optional().describe('Document notes'),
    send_to_customer: z.number().optional().default(0).describe('1=send by email')
  },
  async (params) => {
    const body = {
      api_key: API_KEY,
      doc_type: params.doc_type,
      customer: {
        name: params.customer_name,
        email: params.customer_email,
        phone_number: params.customer_phone
      },
      items: params.items,
      description: params.description,
      send_to_customer: params.send_to_customer
    };
    const response = await axios.post(IM_URL, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
  }
);

// SSE endpoint for Claude
const transports = {};
app.get('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp/message', res);
  transports[transport.sessionId] = transport;
  await mcpServer.connect(transport);
});

app.post('/mcp/message', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Invoice Bridge פועל על פורט ${PORT}`));
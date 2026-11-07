require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const API_KEY = process.env.INVOICE_MAVEN_API_KEY;
const PORT = process.env.PORT || 3000;
const IM_URL = 'https://app.invoice-maven.co.il/api/documents/addDocument';
const BASE_URL = process.env.BASE_URL || 'https://noam-4puz.onrender.com';

// OAuth endpoints
app.get('/oauth/authorize', (req, res) => {
  const { redirect_uri, state } = req.query;
  res.redirect(`${redirect_uri}?code=invoice-maven-code&state=${state}`);
});

app.post('/oauth/token', (req, res) => {
  res.json({
    access_token: 'invoice-maven-token-' + crypto.randomBytes(8).toString('hex'),
    token_type: 'bearer',
    expires_in: 86400
  });
});

// MCP endpoints
app.post('/mcp', async (req, res) => {
  const { method, params, id } = req.body;

  if (method === 'initialize') {
    return res.json({
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'invoice-maven', version: '1.0.0' }
      }
    });
  }

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0', id,
      result: {
        tools: [{
          name: 'create_document',
          description: 'יצירת חשבונית, הצעת מחיר או קבלה ב-Invoice Maven',
          inputSchema: {
            type: 'object',
            required: ['doc_type', 'customer_name', 'items'],
            properties: {
              doc_type: { type: 'number', description: '305=חשבונית, 10=הצעת מחיר, 320=חשבונית+קבלה' },
              customer_name: { type: 'string' },
              customer_email: { type: 'string' },
              customer_phone: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    price: { type: 'number' },
                    quantity: { type: 'number' }
                  },
                  required: ['description', 'price']
                }
              },
              description: { type: 'string' },
              send_to_customer: { type: 'number', description: '0=לא לשלוח, 1=לשלוח במייל' }
            }
          }
        }]
      }
    });
  }

  if (method === 'tools/call' && params?.name === 'create_document') {
    try {
      const p = params.arguments;
      const body = {
        api_key: API_KEY,
        doc_type: p.doc_type,
        customer: { name: p.customer_name, email: p.customer_email, phone_number: p.customer_phone },
        items: p.items,
        description: p.description,
        send_to_customer: p.send_to_customer || 0
      };
      const response = await axios.post(IM_URL, body);
      return res.json({
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: JSON.stringify(response.data) }] }
      });
    } catch (err) {
      return res.json({
        jsonrpc: '2.0', id,
        error: { code: -32000, message: err.message }
      });
    }
  }

  res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Invoice Bridge פועל על פורט ${PORT}`));
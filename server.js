require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const API_KEY = process.env.INVOICE_MAVEN_API_KEY;
const PORT = process.env.PORT || 3000;
const IM_URL = 'https://app.invoice-maven.co.il/api/documents/addDocument';

app.post('/create-document', async (req, res) => {
  try {
    const body = { ...req.body, api_key: API_KEY };
    const response = await axios.post(IM_URL, body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/mcp', (req, res) => {
  res.json({
    name: 'invoice-maven',
    version: '1.0.0',
    description: 'Create invoices and quotes in Invoice Maven',
    tools: [
      {
        name: 'create_document',
        description: 'Create an invoice, quote or receipt in Invoice Maven',
        inputSchema: {
          type: 'object',
          properties: {
            doc_type: { type: 'number', description: '305=invoice, 10=quote, 320=invoice+receipt' },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone_number: { type: 'string' },
                address: { type: 'string' },
                city: { type: 'string' }
              },
              required: ['name']
            },
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
            send_to_customer: { type: 'number' }
          },
          required: ['doc_type', 'customer', 'items']
        }
      }
    ]
  });
});

app.post('/mcp', async (req, res) => {
  const { tool, input } = req.body;
  if (tool === 'create_document') {
    try {
      const body = { ...input, api_key: API_KEY };
      const response = await axios.post(IM_URL, body);
      res.json({ result: response.data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(404).json({ error: 'Tool not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Invoice Bridge פועל על פורט ${PORT}`);
});
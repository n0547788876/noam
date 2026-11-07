require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const API_KEY = process.env.INVOICE_MAVEN_API_KEY;
const PORT = process.env.PORT || 3000;
const IM_URL = 'https://app.invoice-maven.co.il/api/documents/addDocument';

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// MCP manifest
app.get('/mcp', (req, res) => {
  res.json({
    schema_version: 'v1',
    name_for_human: 'Invoice Maven',
    name_for_model: 'invoice_maven',
    description_for_human: 'Create invoices and quotes in Invoice Maven',
    description_for_model: 'Use this to create invoices, quotes and receipts in Invoice Maven for the user\'s business.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `https://noam-4puz.onrender.com/openapi.json`
    }
  });
});

// OpenAPI spec
app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'Invoice Maven', version: '1.0.0' },
    servers: [{ url: 'https://noam-4puz.onrender.com' }],
    paths: {
      '/create-document': {
        post: {
          operationId: 'createDocument',
          summary: 'Create an invoice, quote or receipt',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['doc_type', 'customer_name', 'items'],
                  properties: {
                    doc_type: { type: 'integer', description: '305=חשבונית, 10=הצעת מחיר, 320=חשבונית+קבלה' },
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
                          quantity: { type: 'integer' }
                        }
                      }
                    },
                    description: { type: 'string' },
                    send_to_customer: { type: 'integer', description: '0=לא לשלוח, 1=לשלוח במייל' }
                  }
                }
              }
            }
          },
          responses: { '200': { description: 'Success' } }
        }
      }
    }
  });
});

// Create document endpoint
app.post('/create-document', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, ...rest } = req.body;
    const body = {
      ...rest,
      api_key: API_KEY,
      customer: {
        name: customer_name,
        email: customer_email,
        phone_number: customer_phone
      }
    };
    const response = await axios.post(IM_URL, body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Invoice Bridge פועל על פורט ${PORT}`));
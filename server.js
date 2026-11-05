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

app.listen(PORT, () => {
  console.log(`Invoice Bridge פועל על פורט ${PORT}`);
});
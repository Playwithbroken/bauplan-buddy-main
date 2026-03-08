import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import { prisma } from '@bauplan/database'; // Uncomment when ready

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'billing-service' });
});

// Webhook handler for Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // TODO: Implement Stripe webhook verification and handling
  res.send({ received: true });
});

app.listen(PORT, () => {
  console.log(`Billing Service running on port ${PORT}`);
});

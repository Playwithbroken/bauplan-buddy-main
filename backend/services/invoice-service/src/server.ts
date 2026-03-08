import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import invoicesRouter from './routes/invoices';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Organization context middleware
import { organizationContext } from './middleware/organization';
app.use('/invoices', organizationContext);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'invoice-service' });
});

app.use('/invoices', invoicesRouter);

const port = Number(process.env.PORT ?? 4004);
app.listen(port, () => {
  logger.info({ port }, 'invoice-service listening');
});

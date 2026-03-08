import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import quotesRouter from './routes/quotes';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info'
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Organization context middleware (extract from API Gateway headers)
import { organizationContext } from './middleware/organization';
app.use('/quotes', organizationContext);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'quote-service' });
});

app.use('/quotes', quotesRouter);

const port = Number(process.env.PORT ?? 4001);
app.listen(port, () => {
  logger.info({ port }, 'quote-service listening');
});

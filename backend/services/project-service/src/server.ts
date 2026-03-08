import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import projectsRouter from './routes/projects';
import geofencingRouter from './routes/geofencing';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

const app = express();
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Organization context middleware
import { organizationContext } from './middleware/organization';
app.use('/projects', organizationContext);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'project-service' });
});

app.use('/projects', projectsRouter);
app.use('/geofences', geofencingRouter);

const port = Number(process.env.PORT ?? 4002);
app.listen(port, () => {
  logger.info({ port }, 'project-service listening');
});

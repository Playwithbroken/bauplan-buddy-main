import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authMiddleware } from './middleware/auth';
import stripeRoutes from './routes/stripe';

console.log('Starting API Gateway...');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL ? 'PRESENT' : 'MISSING'}`);
console.log(`SUPABASE_KEY: ${process.env.SUPABASE_KEY ? 'PRESENT' : 'MISSING'}`);

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Logging
app.use(morgan('combined'));

// Health check endpoint (no auth required)
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stripe webhook needs raw body (before JSON parsing)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON parsing for other routes
app.use(express.json());

// Stripe routes (checkout, portal, webhooks) - no auth for webhook
app.use('/api/stripe', stripeRoutes);

// Apply authentication middleware to all API routes
app.use('/api', authMiddleware);

// Proxy configuration for microservices
const services = {
  quote: process.env.QUOTE_SERVICE_URL || 'http://localhost:4001',
  project: process.env.PROJECT_SERVICE_URL || 'http://localhost:4002',
  procurement: process.env.PROCUREMENT_SERVICE_URL || 'http://localhost:4003',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4004',
  invoice: process.env.INVOICE_SERVICE_URL || 'http://localhost:4005',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
  pdf: process.env.PDF_SERVICE_URL || 'http://localhost:4007',
  calendar: process.env.CALENDAR_SERVICE_URL || 'http://localhost:4008',
};

// Route requests to appropriate microservices
app.use('/api/quotes', createProxyMiddleware({
  target: services.quote,
  changeOrigin: true,
  pathRewrite: { '^/api/quotes': '/quotes' },
  onProxyReq: (proxyReq: any, req: any) => {
    // Forward user context to microservice
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      if (req.user.tenantId) {
        proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
      }
      if (req.user.role) {
        proxyReq.setHeader('X-Role', req.user.role);
      }
      if (req.user.plan) {
        proxyReq.setHeader('X-Plan', req.user.plan);
      }
    }
  },
}));

app.use('/api/projects', createProxyMiddleware({
  target: services.project,
  changeOrigin: true,
  pathRewrite: { '^/api/projects': '/projects' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      if (req.user.tenantId) {
        proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
      }
      if (req.user.role) {
        proxyReq.setHeader('X-Role', req.user.role);
      }
      if (req.user.plan) {
        proxyReq.setHeader('X-Plan', req.user.plan);
      }
    }
  },
}));

app.use('/api/geofences', createProxyMiddleware({
  target: services.project,
  changeOrigin: true,
  pathRewrite: { '^/api/geofences': '/geofences' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
    }
  },
}));

app.use('/api/procurement', createProxyMiddleware({
  target: services.procurement,
  changeOrigin: true,
  pathRewrite: { '^/api/procurement': '/procurement' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      if (req.user.tenantId) {
        proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
      }
      if (req.user.role) {
        proxyReq.setHeader('X-Role', req.user.role);
      }
      if (req.user.plan) {
        proxyReq.setHeader('X-Plan', req.user.plan);
      }
    }
  },
}));

app.use('/api/delivery', createProxyMiddleware({
  target: services.delivery,
  changeOrigin: true,
  pathRewrite: { '^/api/delivery': '/delivery' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      if (req.user.tenantId) {
        proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
      }
      if (req.user.role) {
        proxyReq.setHeader('X-Role', req.user.role);
      }
      if (req.user.plan) {
        proxyReq.setHeader('X-Plan', req.user.plan);
      }
    }
  },
}));

app.use('/api/invoices', createProxyMiddleware({
  target: services.invoice,
  changeOrigin: true,
  pathRewrite: { '^/api/invoices': '/invoices' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      if (req.user.tenantId) {
        proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
      }
      if (req.user.role) {
        proxyReq.setHeader('X-Role', req.user.role);
      }
      if (req.user.plan) {
        proxyReq.setHeader('X-Plan', req.user.plan);
      }
    }
  },
}));

app.use('/api/notifications', createProxyMiddleware({
  target: services.notification,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/notifications' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
    }
  },
}));

app.use('/api/pdf', createProxyMiddleware({
  target: services.pdf,
  changeOrigin: true,
  pathRewrite: { '^/api/pdf': '/generate' },
  onProxyReq: (proxyReq: any, req: any) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.id);
      proxyReq.setHeader('X-Tenant-Id', req.user.tenantId);
    }
  },
}));

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Service routes:');
  console.log(`  /api/quotes -> ${services.quote}`);
  console.log(`  /api/projects -> ${services.project}`);
  console.log(`  /api/procurement -> ${services.procurement}`);
  console.log(`  /api/delivery -> ${services.delivery}`);
  console.log(`  /api/invoices -> ${services.invoice}`);
  console.log(`  /api/notifications -> ${services.notification}`);
  console.log(`  /api/pdf -> ${services.pdf}`);
  console.log(`  /api/calendar -> ${services.calendar}`);
  console.log(`  /api/geofences -> ${services.project}`);
  console.log(`  /api/stripe -> Stripe payment routes`);
});

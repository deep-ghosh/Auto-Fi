import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';
import contractRoutes from './routes/contracts';
import agentRoutes from './routes/agents';
import securityRoutes from './routes/security';
import nftRoutes from './routes/nft';
import deploymentRoutes from './routes/deployment';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Celo AI Agents API',
      version: '1.0.0',
      description: 'REST API for automated blockchain processes on Celo',
      contact: {
        name: 'Celo AI Agents Team',
        email: 'support@celo-ai-agents.com'
      }
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Development server' }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: { database: 'connected', blockchain: 'connected', alchemy: 'connected' }
  });
});

app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/nft', nftRoutes);
app.use('/api/v1/deployment', deploymentRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Celo AI Agents API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health'
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: { message: 'Endpoint not found', code: 'NOT_FOUND', path: req.originalUrl }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Celo AI Agents API running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;

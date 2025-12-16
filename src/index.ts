// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import accountRoutes from './routes/accountRoutes';
import accountTimelineRoutes from './routes/accountTimelineRoutes';
import userRoutes from './routes/userRoutes';
import businessRoutes from './routes/businessRoutes';
import itemRoutes from './routes/itemRoutes';
import businessProposalRoutes from './routes/businessProposalRoutes';
import businessProposalItemRoutes from './routes/businessProposalItemRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

import { 
  requestIdMiddleware, 
  errorHandler, 
  notFoundHandler 
} from './middleware/errorHandler';
import { businessProposalErrorHandler } from './middleware/businessProposalErrorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));



// Health check endpoint
app.get('/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK'
  });
});

// API routes
const BASE_API = "/api/";
const ACCOUNT_API = BASE_API.concat("accounts");
const ACCOUNT_TIMELINE_API = BASE_API.concat("account-timeline");
const USERS_API = BASE_API.concat("users");
const BUSINESS_API = BASE_API.concat("business");
const ITEMS_API = BASE_API.concat("items");
const BUSINESS_PROPOSALS_API = BASE_API.concat("business-proposals");
const BUSINESS_PROPOSAL_ITEMS_API = BASE_API.concat("business-proposal-items");
const DASHBOARD_API = BASE_API.concat("dashboard");


app.use(ACCOUNT_API, accountRoutes);
app.use(ACCOUNT_TIMELINE_API, accountTimelineRoutes);
app.use(USERS_API, userRoutes);
app.use(BUSINESS_API, businessRoutes);
app.use(ITEMS_API, itemRoutes);
app.use(BUSINESS_PROPOSALS_API, businessProposalRoutes);
app.use(BUSINESS_PROPOSAL_ITEMS_API, businessProposalItemRoutes);
app.use(DASHBOARD_API, dashboardRoutes);



// 404 handler for undefined routes
app.use(notFoundHandler);

// Business proposal specific error handling middleware
app.use(businessProposalErrorHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SERVER', 'SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SERVER', 'SIGINT received, shutting down gracefully');
  process.exit(0);
});



// Start server
app.listen(PORT, () => {
  logger.serverStart(Number(PORT));
  
  logger.info('SERVER', `Health check available at /health`);
  logger.info('SERVER', `API endpoints available at:`);
  logger.info('SERVER', `Accounts: ${ACCOUNT_API}`);
  logger.info('SERVER', `Account Timeline: ${ACCOUNT_TIMELINE_API}`);
  logger.info('SERVER', `Users: ${USERS_API}`);
  logger.info('SERVER', `Business: ${BUSINESS_API}`);
  logger.info('SERVER', `Items: ${ITEMS_API}`);
  logger.info('SERVER', `Business Proposals: ${BUSINESS_PROPOSALS_API}`);
  logger.info('SERVER', `Business Proposal Items: ${BUSINESS_PROPOSAL_ITEMS_API}`);
  logger.info('SERVER', `Dashboard: ${DASHBOARD_API}`);
});

export default app;
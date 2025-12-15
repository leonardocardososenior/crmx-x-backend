# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Create Node.js TypeScript project with Express.js
  - Install dependencies: express, @supabase/supabase-js, zod, @types packages
  - Configure TypeScript and project structure
  - _Requirements: All requirements need proper project setup_

- [x] 2. Create database schema and Supabase configuration




- [x] 2.1 Create database schema SQL script


  - Write SQL script with enums (user_role, account_status, account_type, deal_stage)
  - Create profiles table referencing auth.users with hierarchy support
  - Create account table with all specified fields and constraints
  - Create deal table with foreign key relationships
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2.2 Configure Supabase client


  - Create supabaseClient.ts with connection configuration
  - Set up environment variables for Supabase URL and keys
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 3. Implement authentication middleware and token cache





- [x] 3.1 Create authentication middleware


  - Implement requireAuth middleware with external API validation
  - Create token validation function calling {{baseUrl}}/platform/authentication/actions/healthcheck
  - Handle 401 responses and missing tokens
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3.2 Implement token cache system

  - Create in-memory Map-based token cache with expiration
  - Implement LRU eviction strategy for memory management
  - Add cache hit/miss logic to avoid redundant API calls
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Create Zod validation schemas




- [x] 4.1 Define account validation schemas



  - Create CreateAccountSchema with required fields (name, segment, owner_id)
  - Create UpdateAccountSchema for partial updates
  - Define enum validation for account_status and account_type
  - Create QueryParamsSchema for filtering and pagination
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Implement account controller with CRUD operations



- [x] 5.1 Create account creation endpoint


  - Implement POST /api/accounts with Zod validation
  - Handle default value assignment (status, account_type, pipeline, last_interaction)
  - Return created account with UUID and timestamps
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_



- [x] 5.2 Create account retrieval endpoint
  - Implement GET /api/accounts with filtering and pagination
  - Add search functionality for name and segment fields
  - Support status and account_type filtering
  - Implement pagination with page and limit parameters
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5.3 Create account update endpoint
  - Implement PATCH /api/accounts/:id with partial update support
  - Add enum validation for account_type updates (Kanban functionality)
  - Update last_interaction timestamp on successful updates
  - Handle 404 errors for non-existent accounts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.4 Create account deletion endpoint

  - Implement DELETE /api/accounts/:id
  - Handle cascading operations for related deal
  - Return appropriate responses for success and errors
  - Handle 404 errors for non-existent accounts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Set up Express routes and error handling






- [x] 6.1 Create account routes


  - Set up Express router for /api/accounts endpoints
  - Apply authentication middleware to all routes
  - Configure proper HTTP methods and route parameters
  - _Requirements: All account-related requirements_

- [x] 6.2 Implement global error handling




  - Create error handling middleware for different error types
  - Format error responses consistently (validation, auth, database, external API)
  - Add request ID tracking for debugging
  - _Requirements: 1.3, 1.4, 3.3, 3.4, 4.2, 4.5, 5.3, 5.4_

- [x] 7. Create main application server






- [x] 7.1 Set up Express application





  - Configure Express app with middleware stack
  - Set up CORS, JSON parsing, and logging
  - Mount account routes and error handlers
  - Configure server startup and graceful shutdown
  - _Requirements: All requirements need proper server setup_
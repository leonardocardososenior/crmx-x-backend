# Implementation Plan

- [x] 1. Set up dashboard infrastructure and types





  - Create dashboard-specific TypeScript interfaces and types
  - Add month localization utilities to translations system
  - Set up basic dashboard controller structure
  - _Requirements: 1.4, 3.6_

- [x] 1.1 Create dashboard type definitions


  - Define `RevenuePerYearParams` interface for input validation
  - Define `MonthlyRevenueResponse` interface for API response
  - Add month name translation types and constants
  - _Requirements: 1.4, 3.6_

- [ ]* 1.2 Write property test for month localization
  - **Property 3: Response format consistency**
  - **Validates: Requirements 1.4, 2.4**

- [x] 1.3 Implement month name localization utility


  - Create function to translate month numbers to localized names
  - Support Portuguese (pt-BR) and English (en-US) locales
  - Integrate with existing translation system
  - _Requirements: 3.6_

- [x] 2. Create dashboard validation schemas




  - Implement Zod schema for year parameter validation
  - Add input validation for dashboard endpoints
  - Follow existing schema patterns from accountSchemas.ts
  - _Requirements: 2.3, 3.2_

- [x] 2.1 Implement dashboard Zod schemas


  - Create `RevenuePerYearParamsSchema` for route parameter validation
  - Add proper error messages for invalid year inputs
  - Export TypeScript types from schemas
  - _Requirements: 2.3, 3.2_

- [ ]* 2.2 Write property test for input validation
  - **Property 4: Input validation robustness**
  - **Validates: Requirements 2.3, 3.2**

- [x] 3. Implement core revenue calculation logic




  - Create database query for monthly revenue aggregation
  - Filter businesses by CLOSED_WON stage only
  - Group results by month and sum values
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3.1 Implement revenue aggregation query


  - Write optimized SQL query using Supabase client
  - Filter by stage = 'Closed Won' and year from created_at
  - Group by month and calculate sum of values
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 3.2 Write property test for CLOSED_WON filtering
  - **Property 1: CLOSED_WON filtering consistency**
  - **Validates: Requirements 1.2, 2.1**

- [ ]* 3.3 Write property test for monthly aggregation
  - **Property 2: Monthly aggregation accuracy**
  - **Validates: Requirements 1.3**

- [x] 3.4 Implement response formatting logic


  - Convert month numbers to localized month names
  - Handle months with zero revenue (return 0 for missing months)
  - Format final response object with month names as keys
  - _Requirements: 1.4, 1.5, 3.6_

- [x] 4. Create dashboard controller




  - Implement `getRevenuePerYear` controller function
  - Add proper error handling following existing patterns
  - Integrate validation, query execution, and response formatting
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5_

- [x] 4.1 Implement getRevenuePerYear controller function


  - Validate year parameter using Zod schema
  - Execute revenue aggregation query
  - Format response with localized month names
  - Handle all error cases gracefully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.5_

- [ ]* 4.2 Write property test for HTTP protocol compliance
  - **Property 5: HTTP protocol compliance**
  - **Validates: Requirements 3.3, 3.5**

- [ ]* 4.3 Write property test for error handling
  - **Property 6: Error handling resilience**
  - **Validates: Requirements 2.5**

- [x] 5. Set up dashboard routing




  - Create dashboard routes file
  - Add GET /revenue-per-year/:year endpoint
  - Integrate with existing Express router structure
  - _Requirements: 3.1_

- [x] 5.1 Create dashboard routes

  - Implement `src/routes/dashboardRoutes.ts`
  - Define GET `/revenue-per-year/:year` route
  - Connect route to dashboard controller
  - _Requirements: 3.1_

- [x] 5.2 Integrate dashboard routes with main application

  - Add dashboard routes to main Express app
  - Set up route prefix `/api/dashboard`
  - Ensure proper middleware integration
  - _Requirements: 3.1_

- [ ]* 5.3 Write unit tests for dashboard routes
  - Test route parameter parsing
  - Test controller integration
  - Test middleware application
  - _Requirements: 3.1_

- [x] 6. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration and final validation




  - Test complete end-to-end functionality
  - Verify response format matches specification
  - Validate error handling in all scenarios
  - _Requirements: All_

- [x] 7.1 Perform integration testing


  - Test with real database data
  - Verify localization works correctly
  - Test edge cases (no data, invalid years)
  - _Requirements: All_

- [ ]* 7.2 Write integration tests for complete workflow
  - Test full request-response cycle
  - Verify database integration
  - Test with different locales
  - _Requirements: All_

- [x] 8. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
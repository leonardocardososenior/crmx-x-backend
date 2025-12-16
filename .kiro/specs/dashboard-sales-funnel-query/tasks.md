# Implementation Plan

- [x] 1. Add response schema for sales funnel




  - Create SalesFunnelResponseSchema in dashboardSchemas.ts
  - Add TypeScript type export for the response
  - _Requirements: 1.3_

- [x] 2. Implement getSalesFunnel controller function




  - [x] 2.1 Create getSalesFunnel function in dashboardController.ts


    - Implement database query to count business records by stage
    - Filter out CLOSED_LOST stage records
    - Group results by stage and return counts
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]* 2.2 Write property test for sales funnel aggregation accuracy
    - **Property 1: Sales funnel aggregation accuracy**
    - **Validates: Requirements 1.1**

  - [ ]* 2.3 Write property test for CLOSED_LOST exclusion
    - **Property 2: CLOSED_LOST exclusion**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test for response format consistency
    - **Property 3: Response format consistency**
    - **Validates: Requirements 1.3**

  - [ ]* 2.5 Write property test for empty stage omission
    - **Property 4: Empty stage omission**
    - **Validates: Requirements 1.4**

  - [x] 2.6 Add error handling to getSalesFunnel function


    - Use handleDatabaseError for Supabase errors
    - Use handleInternalError for unexpected errors
    - Return appropriate HTTP status codes
    - _Requirements: 2.5_

  - [ ]* 2.7 Write property test for successful request status
    - **Property 5: Successful request status**
    - **Validates: Requirements 1.5**

  - [ ]* 2.8 Write property test for database error handling
    - **Property 6: Database error handling**
    - **Validates: Requirements 2.5**

- [x] 3. Add route for sales funnel endpoint




  - Add GET /api/dashboard/sales-funnel route
  - Wire the route to getSalesFunnel controller function
  - _Requirements: 2.4_

- [ ]* 4. Write integration tests for the complete endpoint
  - Test HTTP endpoint with real database queries
  - Verify response format and status codes
  - Test error scenarios
  - _Requirements: 1.5, 2.4, 2.5_

- [x] 5. Checkpoint - Make sure all tests are passing





  - Ensure all tests pass, ask the user if questions arise.
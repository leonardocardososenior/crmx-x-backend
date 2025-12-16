# Implementation Plan

- [x] 1. Add response schema for getNewBusiness




  - Create NewBusinessResponseSchema in dashboardSchemas.ts
  - Export TypeScript type for response validation
  - _Requirements: 2.4, 3.3_


- [x] 2. Implement period calculation utilities



  - [x] 2.1 Create date range calculation functions

    - Implement calculatePeriodRange function to convert DashboardPeriod to date range
    - Handle THIS_MONTH, THIS_YEAR, and LAST_QUARTER calculations
    - Return start and end dates for database filtering
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [ ]* 2.2 Write property test for period calculation correctness
    - **Property 2: Period calculation correctness**
    - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 3. Implement getNewBusiness controller function




  - [x] 3.1 Create getNewBusiness function in dashboardController.ts

    - Validate period parameter using DashboardPeriod enum
    - Calculate date range using period calculation utilities
    - Implement database query to count businesses where created_at is within period
    - Handle empty results by returning zero count
    - Use existing error handling patterns
    - _Requirements: 1.1, 2.1, 2.3, 2.4_
  
  - [ ]* 3.2 Write property test for period filtering accuracy
    - **Property 1: Period filtering accuracy**
    - **Validates: Requirements 1.1, 2.1**
  
  - [ ]* 3.3 Write property test for input validation and error handling
    - **Property 3: Input validation and error handling**
    - **Validates: Requirements 2.3, 3.2**
  
  - [ ]* 3.4 Write property test for response format consistency
    - **Property 4: Response format consistency**
    - **Validates: Requirements 2.4, 3.3**


- [x] 4. Add route configuration



  - Add GET /api/dashboard/new-business route to dashboard routes
  - Wire up the getNewBusiness controller function
  - Configure query parameter validation for period
  - _Requirements: 3.1, 3.2_

- [ ]* 5. Write unit tests for edge cases
  - Test with empty database (should return count: 0)
  - Test with businesses outside the specified period
  - Test with each period type (THIS_MONTH, THIS_YEAR, LAST_QUARTER)
  - Test basic functionality with sample data
  - _Requirements: 1.5, 2.4_

- [x] 6. Checkpoint - Make sure all tests are passing





  - Ensure all tests pass, ask the user if questions arise.
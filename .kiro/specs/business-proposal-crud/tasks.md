# Implementation Plan - Business Proposal CRUD Module

- [x] 1. Extend database schema and core types




  - [x] 1.1 Add business proposal tables to database schema


    - Add business_proposal table with all required fields and constraints
    - Add business_proposal_item table with foreign key relationships
    - Create appropriate indexes for query performance
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3_

  - [x] 1.2 Add business proposal enums and types to types/index.ts


    - Define BusinessProposalStatuses enum with all status values
    - Create BusinessProposalDB and BusinessProposalItemDB interfaces
    - Create BusinessProposal and BusinessProposalItem API interfaces
    - Add request/response type definitions
    - _Requirements: 1.2, 4.3, 7.1, 7.2_

  - [ ]* 1.3 Write property test for UUID generation uniqueness
    - **Property 3: UUID generation uniqueness**
    - **Validates: Requirements 1.5, 2.5**

  - [x] 1.4 Implement data conversion functions


    - Create businessProposalDbToApi and businessProposalApiToDb functions
    - Create businessProposalItemDbToApi and businessProposalItemApiToDb functions
    - Ensure proper camelCase/snake_case conversion
    - Handle reference object creation for relationships
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 1.5 Write property test for data format conversion consistency
    - **Property 14: Data format conversion consistency**
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 1.6 Write property test for reference object structure
    - **Property 15: Reference object structure**
    - **Validates: Requirements 7.3**

- [x] 2. Create validation schemas




  - [x] 2.1 Create businessProposalSchemas.ts with Zod schemas

    - Implement CreateBusinessProposalSchema with all validations
    - Implement UpdateBusinessProposalSchema with optional fields
    - Implement CreateBusinessProposalItemSchema with calculations
    - Implement UpdateBusinessProposalItemSchema
    - Add query parameter schemas for filtering and pagination
    - _Requirements: 1.1, 2.1, 3.5, 4.3_

  - [ ]* 2.2 Write property test for required field validation
    - **Property 1: Required field validation**
    - **Validates: Requirements 1.1, 2.1**

  - [ ]* 2.3 Write property test for enum validation
    - **Property 10: Enum validation**
    - **Validates: Requirements 4.3**

  - [ ]* 2.4 Write property test for total calculation accuracy
    - **Property 4: Total calculation accuracy**
    - **Validates: Requirements 2.4, 4.4**

- [x] 3. Extend translations for business proposals




  - [x] 3.1 Add business proposal translations to translations.ts

    - Add field names for all business proposal fields
    - Add success messages for proposal operations
    - Add error messages for proposal-specific validations
    - Add relationship error messages for business and item references
    - Include translations for pt-BR, en-US, and es-CO
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.2 Write property test for multilingual message consistency
    - **Property 13: Multilingual message consistency**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 4. Implement business proposal controller





  - [x] 4.1 Create businessProposalController.ts with CRUD operations


    - Implement createBusinessProposal function with validation and relationship checks
    - Implement getBusinessProposals with filtering and pagination
    - Implement getBusinessProposalById with item inclusion
    - Implement updateBusinessProposal with existence validation
    - Implement deleteBusinessProposal with cascade deletion
    - _Requirements: 1.1, 1.3, 1.4, 3.1, 3.3, 4.1, 5.1_

  - [ ]* 4.2 Write property test for referential integrity validation
    - **Property 2: Referential integrity validation**
    - **Validates: Requirements 1.3, 1.4, 2.2, 2.3, 4.2**

  - [ ]* 4.3 Write property test for entity existence validation
    - **Property 9: Entity existence validation**
    - **Validates: Requirements 4.1**

  - [ ]* 4.4 Write property test for cascade deletion consistency
    - **Property 11: Cascade deletion consistency**
    - **Validates: Requirements 5.1**

- [x] 5. Implement business proposal item controller




  - [x] 5.1 Create businessProposalItemController.ts with CRUD operations

    - Implement createBusinessProposalItem with total calculation
    - Implement getBusinessProposalItems with filtering
    - Implement getBusinessProposalItemById
    - Implement updateBusinessProposalItem with recalculation
    - Implement deleteBusinessProposalItem
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.3_

  - [ ]* 5.2 Write property test for individual item deletion
    - **Property 12: Individual item deletion**
    - **Validates: Requirements 5.3**

- [-] 6. Add API routes and middleware


  - [x] 6.1 Create routes for business proposals


    - Add routes to main router configuration
    - Configure middleware for authentication and validation
    - Set up proper HTTP methods and path parameters
    - _Requirements: 3.1, 3.3, 4.1, 5.1_

  - [ ]* 6.2 Write property test for paginated query consistency
    - **Property 5: Paginated query consistency**
    - **Validates: Requirements 3.1**

  - [ ]* 6.3 Write property test for filter processing consistency
    - **Property 6: Filter processing consistency**
    - **Validates: Requirements 3.2**

  - [ ]* 6.4 Write property test for complete data retrieval
    - **Property 7: Complete data retrieval**
    - **Validates: Requirements 3.3**

- [x] 7. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add error handling and validation





  - [x] 8.1 Implement comprehensive error handling


    - Add proper HTTP status codes for all error scenarios
    - Implement multilingual error messages
    - Add logging for debugging and monitoring
    - Handle database constraint violations appropriately
    - _Requirements: 3.4, 5.2, 5.5, 6.1, 6.5_

  - [ ]* 8.2 Write property test for validation error handling
    - **Property 8: Validation error handling**
    - **Validates: Requirements 3.5**

  - [ ]* 8.3 Write property test for ISO 8601 timestamp format
    - **Property 16: ISO 8601 timestamp format**
    - **Validates: Requirements 7.4**

- [-] 9. Final integration and testing


  - [x] 9.1 Integration testing and final validation



    - Test complete CRUD workflows for both entities
    - Verify all relationships work correctly
    - Test multilingual support across all operations
    - Validate proper error handling in edge cases
    - _Requirements: All requirements_

  - [ ]* 9.2 Write unit tests for specific examples
    - Test default status "Rascunho" assignment
    - Test default language pt-BR behavior
    - Test 404 responses for non-existent entities
    - Test specific calculation examples

- [x] 10. Final Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.
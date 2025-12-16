# Design Document

## Overview

The getTotalRevenue feature implements a simple dashboard query that calculates and returns the total revenue from all closed-won business deals. This feature follows the existing dashboard controller patterns and integrates seamlessly with the current CRM system architecture.

## Architecture

The feature follows the established three-layer architecture:
- **Controller Layer**: Handles HTTP requests and responses
- **Database Layer**: Executes Supabase queries for data aggregation
- **Schema Layer**: Validates response format using Zod schemas

The implementation leverages the existing dashboard controller structure and follows the same error handling patterns used by other dashboard queries.

## Components and Interfaces

### Controller Function
- **Function**: `getTotalRevenue(req: Request, res: Response): Promise<void>`
- **Route**: `GET /api/dashboard/total-revenue`
- **Location**: `src/controllers/dashboardController.ts`

### Database Query
- **Table**: `business`
- **Filter**: `stage = 'Closed Won'` (using `BusinessStages.CLOSED_WON`)
- **Aggregation**: `SUM(value)` of all matching records
- **Client**: Supabase Admin client

### Response Schema
- **Schema**: `TotalRevenueResponseSchema`
- **Location**: `src/schemas/dashboardSchemas.ts`
- **Format**: `{ "total": number }`

## Data Models

### Input
- No input parameters required
- Standard Express Request object

### Output
```typescript
{
  total: number  // Sum of all business.value where stage = 'Closed Won'
}
```

### Database Query Structure
```sql
SELECT SUM(value) as total 
FROM business 
WHERE stage = 'Closed Won'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: CLOSED_WON aggregation accuracy
*For any* set of business records with mixed stages, the getTotalRevenue query should return the sum of only those records with CLOSED_WON stage
**Validates: Requirements 1.1**

Property 2: Response format consistency
*For any* database state, the getTotalRevenue response should always contain a JSON object with a "total" field containing a numeric value
**Validates: Requirements 1.2**

Property 3: Error handling robustness
*For any* database error condition, the getTotalRevenue query should return an appropriate HTTP error response without exposing internal system details
**Validates: Requirements 1.4**

## Error Handling

The feature implements comprehensive error handling following the established patterns:

### Database Errors
- Uses `handleDatabaseError()` helper for consistent error responses
- Logs errors with appropriate context for debugging
- Returns standardized error format to clients

### Internal Errors
- Uses `handleInternalError()` helper for unexpected exceptions
- Provides generic error messages to prevent information leakage
- Maintains detailed server-side logging

### Edge Cases
- Handles null/undefined values in business records
- Returns zero when no closed-won businesses exist
- Gracefully handles empty database responses

## Testing Strategy

### Unit Testing
The implementation will include focused unit tests covering:
- Basic functionality with sample data
- Edge case: empty database
- Error conditions and proper error handling

### Property-Based Testing
Property-based tests will be implemented using a suitable testing library for Node.js/TypeScript to verify:
- **Property 1**: Revenue calculation accuracy across various data sets
- **Property 2**: Response format consistency regardless of data state
- **Property 3**: Error handling robustness under failure conditions

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage of the input space. Tests will be tagged with comments referencing their corresponding correctness properties using the format: '**Feature: dashboard-total-revenue-query, Property {number}: {property_text}**'.
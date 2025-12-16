# Design Document

## Overview

The "moreSalesByResponsible" feature implements a dashboard query that aggregates sales performance data by responsible users. It returns users who have closed-won business deals, ordered by their total sales value in ascending order. This provides sales managers with insights into individual team member performance.

## Architecture

The feature follows the existing dashboard controller pattern:
- **Controller Layer**: Handles HTTP requests, validation, and response formatting
- **Database Layer**: Executes aggregation queries using Supabase client
- **Schema Layer**: Validates request parameters and response format using Zod
- **Utility Layer**: Leverages existing error handling and controller helpers

## Components and Interfaces

### API Endpoint
- **Route**: `GET /api/dashboard/more-sales-by-responsible`
- **Controller**: `getMoreSalesByResponsible` function in `dashboardController.ts`
- **Response Format**: JSON array of sales performance objects

### Database Query
- **Primary Table**: `business` (for sales data)
- **Join Table**: `users` (for responsible user information)
- **Filter Criteria**: `stage = 'Closed Won'`
- **Aggregation**: `SUM(value)` grouped by responsible user
- **Ordering**: Ascending by total sales value

### Schema Validation
- **Request Schema**: No parameters required (simple GET endpoint)
- **Response Schema**: Array of objects with `responsibleId`, `responsibleName`, and `saleValue`

## Data Models

### Request
No request parameters required - this is a simple GET endpoint that returns all sales data.

### Response
```typescript
interface SalesByResponsibleResponse {
  responsibleId: string;
  responsibleName: string;
  saleValue: number;
}[]
```

### Database Query Structure
```sql
SELECT 
  u.id as responsible_id,
  u.name as responsible_name,
  COALESCE(SUM(b.value), 0) as sale_value
FROM users u
LEFT JOIN business b ON u.id = b.responsible_id AND b.stage = 'Closed Won'
GROUP BY u.id, u.name
HAVING COALESCE(SUM(b.value), 0) > 0
ORDER BY sale_value ASC
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*
Property 1: Closed-won deals filter
*For any* database state with business deals of various stages, the query should return only users who have at least one business deal with stage CLOSED_WON
**Validates: Requirements 1.1**

Property 2: Sales value aggregation
*For any* user with multiple CLOSED_WON business deals, the returned saleValue should equal the sum of all their closed-won deal values
**Validates: Requirements 1.2**

Property 3: Ascending order by sale value
*For any* set of users with different total sale values, the results should be ordered with the lowest sale value first and highest sale value last
**Validates: Requirements 1.3**

Property 4: Response format completeness
*For any* returned user record, the object should contain exactly three fields: responsibleId (string), responsibleName (string), and saleValue (number)
**Validates: Requirements 1.4**

Property 5: HTTP response format
*For any* successful query execution, the response should have HTTP status 200 and valid JSON content type
**Validates: Requirements 2.5**

## Error Handling

The implementation will use the existing error handling patterns:
- **Database Errors**: Handled by `handleDatabaseError` utility
- **Internal Errors**: Handled by `handleInternalError` utility
- **Response Formatting**: Standard JSON responses with appropriate HTTP status codes

Error scenarios include:
- Database connection failures
- Query execution errors
- Unexpected data format issues

## Testing Strategy

**Dual testing approach**:

The implementation will use both unit testing and property-based testing approaches:
- Unit tests verify specific examples, edge cases, and error conditions
- Property tests verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

**Unit testing**:
- Test the empty result case when no closed-won deals exist
- Test error handling scenarios
- Test response format validation

**Property-based testing**:
- Use fast-check library for TypeScript property-based testing
- Configure each property-based test to run a minimum of 100 iterations
- Tag each property-based test with comments referencing the design document properties
- Use format: '**Feature: more-sales-by-responsible, Property {number}: {property_text}**'
- Each correctness property will be implemented by a single property-based test
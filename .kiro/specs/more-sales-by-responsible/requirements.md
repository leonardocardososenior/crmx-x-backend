# Requirements Document

## Introduction

This feature implements a dashboard query called "moreSalesByResponsible" that provides insights into sales performance by returning users who are responsible for closed-won business deals, ordered by their total sales value in ascending order.

## Glossary

- **Dashboard_System**: The CRM dashboard module that provides analytical queries and reports
- **Business**: A sales opportunity or deal in the CRM system with associated value and stage
- **Responsible_User**: A user assigned as responsible for managing a business deal
- **CLOSED_WON**: A business stage indicating a successfully completed sale
- **Sale_Value**: The total monetary value of all closed-won business deals for a responsible user

## Requirements

### Requirement 1

**User Story:** As a sales manager, I want to view sales performance by responsible users, so that I can identify and analyze the sales contribution of each team member.

#### Acceptance Criteria

1. WHEN the moreSalesByResponsible query is executed, THE Dashboard_System SHALL return users who are responsible for business deals with stage CLOSED_WON
2. WHEN calculating sales values, THE Dashboard_System SHALL aggregate the total value of all CLOSED_WON business deals for each responsible user
3. WHEN returning results, THE Dashboard_System SHALL order the users by their total sale value in ascending order
4. WHEN formatting the response, THE Dashboard_System SHALL include responsibleId, responsibleName, and saleValue for each user
5. WHEN no closed-won deals exist, THE Dashboard_System SHALL return an empty array

### Requirement 2

**User Story:** As a developer, I want the query to follow the existing API patterns, so that it integrates seamlessly with the current dashboard infrastructure.

#### Acceptance Criteria

1. WHEN implementing the endpoint, THE Dashboard_System SHALL follow the existing controller pattern used in dashboardController
2. WHEN handling errors, THE Dashboard_System SHALL use the established error handling utilities
3. WHEN processing the request, THE Dashboard_System SHALL validate input parameters using Zod schemas
4. WHEN executing database queries, THE Dashboard_System SHALL use the supabaseAdmin client
5. WHEN returning responses, THE Dashboard_System SHALL use appropriate HTTP status codes and JSON format
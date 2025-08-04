# Loan Data Loading State Enhancement and Synchronization

## Overview
This PR improves the loan data loading process in the admin application by introducing proper loading state management and ensuring customer data is loaded before fetching loan details. The changes enhance reliability and prevent potential race conditions in the data loading sequence.

## Key Changes
### Loading State Management
- Added customer loading state tracking in the loan context
- Introduced conditional loading logic for loan data based on customer state
- Enhanced synchronization between portal loan and regular loan data loading

### Hook Enhancements
- Modified `useGetLoan` and `useGetPortalLoan` hooks to accept loading state options
- Added customer loading state validation before triggering loan queries
- Improved error handling and notification management

### Component Updates
- Enhanced loan context provider with proper loading state checks
- Added effect hook to handle synchronized rendering of loan data
- Improved form value management with portal loan data

## Testing Considerations
- Verify loan data loads correctly after customer data is available
- Test error scenarios when customer data fails to load
- Validate proper loading states are shown during the entire data fetch sequence
- Ensure form values are populated correctly with portal loan data
- Test edge cases where customer data is delayed or unavailable

## Notes for Reviewers
- The changes focus on improving data loading reliability
- Loading sequence is now: Customer → Loan/Portal Loan
- Added safeguards against premature loan data fetching
- Error handling has been enhanced across all data fetching hooks
- Special attention should be paid to the loading state transitions

## Impact
These changes improve the reliability and user experience of the loan management interface by ensuring proper data loading sequences and preventing potential race conditions. The enhanced loading state management provides a more stable and predictable behavior when accessing loan information.

closes MSS-81
## ADDED Requirements

### Requirement: Item form submission SHALL be atomic and protected against double-submissions

The item creation and edit forms MUST prevent multiple concurrent submissions. Once a submission is initiated, all subsequent submission triggers (e.g., clicks, 'Enter' key presses) MUST be ignored until the current operation completes or fails.

#### Scenario: User attempts double-click on submit button

- **WHEN** a user clicks the submit button while another submission is in progress
- **THEN** the second click MUST be ignored
- **THEN** the submit button MUST remain in a disabled or loading state

#### Scenario: User presses Enter multiple times

- **WHEN** a user presses the 'Enter' key while a submission is already being processed
- **THEN** the additional 'Enter' key presses MUST be ignored by the form handler
- **THEN** the form MUST NOT trigger the submission logic again

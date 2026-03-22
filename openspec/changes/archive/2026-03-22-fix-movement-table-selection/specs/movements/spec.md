## ADDED Requirements

### Requirement: Movement table selection SHALL respect filter scope

The movement table selection feature SHALL only operate on items within the current filter scope, not globally.

#### Scenario: Header checkbox shows correct state with filter applied

- **WHEN** a user applies a filter (e.g., type=compras) to the movement table
- **AND** the user has selected some items within the filtered scope
- **THEN** the header checkbox SHALL indicate indeterminate state when only some filtered items are selected
- **AND** the header checkbox SHALL show checked when all filtered items are selected

#### Scenario: Header select all only selects filtered items

- **WHEN** a user applies a filter to the movement table
- **AND** the user clicks the header checkbox to select all
- **THEN** the system SHALL only select items matching the current filter
- **AND** items outside the filter scope SHALL remain unselected

#### Scenario: Toolbar global selection only checks when all unfiltered items are selected

- **WHEN** a user has selected all items within a filtered scope
- **THEN** the toolbar "select all" checkbox SHALL NOT be checked
- **AND** the toolbar checkbox SHALL show indeterminate state
- **WHEN** a user has selected ALL items globally (no filters applied)
- **THEN** the toolbar "select all" checkbox SHALL be checked

#### Scenario: Selection persists across filter changes

- **WHEN** a user selects items while a filter is applied
- **AND** the user then changes the filter or navigates to a different page
- **THEN** the selected items SHALL remain selected
- **AND** items no longer matching the filter SHALL be removed from selection via cleanup effect

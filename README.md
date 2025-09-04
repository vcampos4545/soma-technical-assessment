## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation

When a todo is created, search for and display a relevant image to visualize the task to be done.

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request.

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Submission:

1. Add a new "Solution" section to this README with a description and screenshot or recording of your solution.
2. Push your changes to a public GitHub repository.
3. Submit a link to your repository in the application form.

Thanks for your time and effort. We'll be in touch soon!

## Solution

### Task 1: Due Dates Implementation

**Schema Changes:**

- Added `dueDate DateTime` field to the Todo model in Prisma schema
- Applied database migration to update existing database structure

**Backend Implementation:**

- Modified POST `/api/todos` route to require and validate due date input
- Implemented proper date parsing: converts HTML date input string to Date object
- Set due date to end of day (23:59:59.999) to prevent immediate overdue marking
- Added comprehensive error handling for missing or invalid dates

**Frontend Features:**

- Enhanced todo creation form with HTML5 date picker input
- Implemented intelligent overdue detection: compares dates at day level (ignoring time)
- Dynamic color coding: overdue dates display in red, upcoming dates in blue
- Clean date formatting: displays dates as "Jan 15" format for better readability
- Responsive design with proper form validation

**Technical Details:**

- Date comparison uses `setHours(0, 0, 0, 0)` to ensure fair overdue evaluation
- Handles timezone consistency by working with local dates
- Graceful fallback for date parsing errors

### Task 2: Image Generation & Display

**API Integration:**

- Integrated Pexels API for dynamic image generation based on task titles
- Direct API calls from backend to avoid internal routing complications
- Proper error handling: continues todo creation even if image fetching fails
- URL encoding for search queries to handle special characters

**Database Schema:**

- Added `imageUrl String?` field to Todo model (optional field)
- Applied database migration for new image storage capability

**Frontend Image Handling:**

- Enhanced todo tiles with integrated image display below task information
- Professional image presentation: 160px height with object-cover for consistent sizing
- Loading state management: shows animated spinner while images load
- Error handling: gracefully handles failed image loads without breaking UI
- Responsive image containers with proper shadows and rounded corners

**User Experience Improvements:**

- Images automatically fetched during todo creation using task title as search query
- Seamless integration: images appear without additional user interaction
- Visual enhancement: images make tasks more engaging and easier to identify
- Performance optimized: images load asynchronously without blocking todo creation

**Technical Implementation:**

- Environment variable configuration for Pexels API key security
- Proper HTTP headers and authentication for external API calls
- Image loading states with CSS animations and fallback handling

### Task 3: Task Dependencies System

**Database Schema Design:**

- Implemented simplified dependency storage using JSON string field in Todo model
- Added `dependencies String @default("[]")` field to store dependency IDs as JSON array
- Eliminated need for complex junction tables while maintaining data integrity
- Applied database migration for new dependency structure

**Backend Implementation:**

- Enhanced POST `/api/todos` route to accept and store dependency arrays
- Implemented PUT `/api/todos/[id]` route for updating existing todos with dependencies
- JSON serialization/deserialization of dependency arrays for database storage
- Comprehensive validation and error handling for dependency operations

**Circular Dependency Prevention:**

- Implemented `wouldCauseCycle()` function using breadth-first search algorithm
- Real-time validation before todo creation/updates prevents circular references
- Efficient cycle detection: O(V+E) complexity using queue-based traversal
- User-friendly error messages when circular dependencies are detected

**Critical Path Calculation:**

- Implemented `calculateCriticalPath()` function using longest path algorithm
- Topological sorting with dynamic programming approach for optimal performance
- Correct path ordering: shows dependencies first, then dependent tasks
- Returns both critical path sequence and total path length for project planning

**Earliest Start Date Calculation:**

- Implemented `calculateEarliestStartDates()` function using depth-first search
- Calculates optimal execution order for all tasks based on dependencies
- Handles complex dependency chains with proper memoization
- Returns step-by-step execution sequence for project scheduling

**Dependency Graph Visualization:**

- Implemented `generateGraphVisualization()` function for hierarchical display
- Level-based organization: tasks grouped by dependency depth
- Clear visual representation of task relationships and execution order
- Professional dashboard-style presentation with color-coded sections

**Frontend Features:**

- Enhanced todo creation form with dependency selection checkboxes
- Real-time dependency validation with immediate user feedback
- Visual dependency indicators on each todo tile showing dependency count
- Comprehensive dependency list display within each todo item
- Edit functionality for modifying existing dependencies

**Project Analysis Dashboard:**

- **Critical Path Section:** Purple-themed display showing task sequence with arrows
- **Execution Order Section:** Blue-themed display showing optimal task execution steps
- **Dependency Levels Section:** Green-themed display showing hierarchical task organization
- Professional styling with gradients, icons, and responsive design

**Technical Architecture:**

- Modular graph utility functions in `lib/graph.ts` for maintainability
- Efficient adjacency list representation for O(1) dependency lookups
- Comprehensive error handling for malformed dependency data
- Type-safe interfaces for all graph operations and data structures

**User Experience Features:**

- Intuitive dependency selection with checkbox grid interface
- Clear visual feedback showing selected dependencies
- Professional modal interface for editing existing todos
- Responsive design that works across all device sizes
- Real-time updates when dependencies are modified

**Performance Optimizations:**

- Efficient graph algorithms with O(V+E) complexity
- Smart caching of graph calculations to avoid redundant processing
- Optimized dependency parsing with error recovery
- Minimal re-renders through efficient state management

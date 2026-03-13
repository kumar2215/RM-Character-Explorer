# Rick and Morty Explorer

A React and TypeScript application for exploring Rick and Morty characters and visualizing relationships across origins, locations, and shared episodes.

External API documentation: https://rickandmortyapi.com/documentation

## Overview

### Approach

The application is built as a client-side explorer with two primary flows:

1. Character browsing with filter and pagination support.
2. Data visualization views for character origins, current locations, and network relationships.

The data layer calls the Rick and Morty REST API and normalizes responses into typed models used throughout the UI.

### Architecture

The project follows a feature-oriented structure with clear boundaries between API access, view components, pages, shared types, and visualization utilities.

High-level modules:

- src/api: API clients for character and location retrieval.
- src/components: Reusable UI modules grouped by domain (characters, visualization, layout).
- src/pages: Route-level page components.
- src/utils: Data transformation logic for visualization graphs and charts.
- src/types: Shared TypeScript models and filter contracts.
- src/test: Unit and component tests grouped by domain.

Routing:

- / - Character Explorer page.
- /character/:id - Character details page.
- /visualization - Visualization dashboard.

## Setup Instructions

### Prerequisites

- Node.js 20+ recommended.
- npm 10+ recommended.

### Install dependencies

```bash
npm install
```

### Run the app (development)

```bash
npm run dev
```

The Vite development server starts locally and supports hot reload.

### Production build and preview

```bash
npm run build
npm run preview
```

## Testing Instructions

Run all tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

Optional quality check:

```bash
npm run lint
```

## Assumptions / Challenges

### Design decisions

- React Query is used to manage API request state, caching, and loading/error handling.
- D3 and Recharts are used for complementary visualization needs.
- Shared TypeScript interfaces are centralized to keep API contracts and UI state consistent.
- Utility functions in src/utils encapsulate graph and Sankey data transformations to keep page components focused on composition.

### Assumptions

- The application depends on public Rick and Morty API availability and response stability.
- The visualization views are expected to be used with practical dataset sizes, so node limits and episode thresholds are applied to keep rendering responsive.
- The Rick and Morty API schema is assumed to stay compatible with the typed models used in this project.
- No custom backend proxy is assumed. All data fetching is performed directly from the client.

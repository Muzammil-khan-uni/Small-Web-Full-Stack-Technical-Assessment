# The Small Web

A full-stack implementation of **The Small Web** technical assessment.

The application models a small, fictional web where people can browse published pages, follow links, retrace their navigation, search page content, view personal browsing history, and publish new HTML pages.

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- Mongoose

### Database

- MongoDB Atlas

## Core Features

### Browse

Users can:

- Enter a Small Web address directly.
- Open published sites.
- Follow links between Small Web pages.
- Visit nonexistent addresses and receive a friendly 404 page.
- Record successful and unsuccessful visits in browsing history.

### Retrace

The browser provides:

- Back navigation.
- Forward navigation.
- Forward-trail truncation after navigating somewhere new.
- Independent navigation sessions for each person.
- Persistent per-person browsing history.
- Clickable History entries for revisiting previous addresses.

Back and Forward restore the browser navigation state without creating additional database visits.

Selecting an item from persistent History performs a new visit and records it with the `history` source.

### Search

Users can search across published site content.

Search covers both:

- Site titles.
- Stored HTML content.

Search results participate in browser navigation, allowing a user to:

1. Search.
2. Open a result.
3. Press Back to return to the same search results.
4. Press Forward to return to the opened page.

### Publish

Users can:

- Select a publisher by name.
- Choose a Small Web address.
- Enter HTML.
- Publish the new page.
- Immediately browse the newly published page.
- Find newly published content through search.

Duplicate addresses are rejected by the backend.

## Domain Model

The application uses the following main entities.

### Person

Represents someone browsing or publishing on the Small Web.

Important field:

- `name`

### Site

Represents a published page.

Important fields:

- `address`
- `title`
- `html`
- `publisher`

Addresses are unique.

Links are represented by anchor elements inside the site's HTML rather than by a separate link collection.

### Visit

Represents a browsing event.

Important fields:

- `person`
- `address`
- `exists`
- `source`
- timestamp

The visit source is one of:

- `address`
- `link`
- `history`

Both successful and unsuccessful visits are stored.

## Back and Forward Design

Back/Forward navigation is maintained in the frontend as an ordered navigation trail.

Each person has an independent browser session containing:

- Current address.
- Current page.
- Navigation entries.
- Current navigation index.

A navigation entry can represent either:

- A page.
- Search results.

When a user presses Back or Forward, an existing navigation entry is restored without making another browse request.

When a user goes Back and then performs a new navigation, entries after the current position are removed. This intentionally discards the previous Forward trail.

Persistent browsing History is separate from the temporary Back/Forward navigation trail and is stored in MongoDB.

## Untrusted HTML Containment

Published HTML is treated as untrusted content.

Pages are rendered using a sandboxed iframe:

```html
<iframe sandbox=""></iframe>
```

No sandbox permissions are granted to publisher HTML. In particular, publisher scripts are not allowed to execute.

Internal Small Web links are extracted by the application and exposed as controlled navigation actions outside the untrusted iframe.

This keeps application navigation under frontend control while isolating publisher-provided HTML.

## Seed Data

The deterministic seed creates:

- 5 people.
- 10 published sites.
- Multiple publishers.
- Publishers with more than one site.
- Prose-filled pages.
- Links between sites.
- Broken/nonexistent addresses.
- Repeated visits.
- Long browsing trails.
- Approximately one hour of seeded browsing activity.
- 29 seeded visits.

The seed can be rerun to restore the demonstration dataset.

## Project Structure

```text
small-web/
├── backend/
│   ├── scripts/
│   │   └── seed.ts
│   ├── src/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Prerequisites

Install:

- Node.js
- npm
- Git

You also need access to a MongoDB database. The project was developed using MongoDB Atlas.

## Environment Configuration

### Backend

Create:

```text
backend/.env
```

You can copy:

```text
backend/.env.example
```

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/small_web?retryWrites=true&w=majority
PORT=3001
```

Replace the MongoDB connection placeholder with your own MongoDB Atlas connection string.

Do not commit the real `.env` file.

### Frontend

Create:

```text
frontend/.env.local
```

You can copy:

```text
frontend/.env.example
```

Contents:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation

Clone the repository and install the backend dependencies:

```bash
cd backend
npm install
```

Install the frontend dependencies:

```bash
cd ../frontend
npm install
```

## Seed the Database

After configuring `backend/.env`, run:

```bash
cd backend
npm run seed
```

The seed is designed to be rerunnable and recreates the demonstration dataset.

## Run the Backend

From the backend directory:

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3001
```

## Run the Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Useful Seeded Addresses

Examples include:

```text
garden.local
herbs.local
library.local
poetry.local
city.local
coffee.local
kitchen.local
travel.local
ocean.local
stars.local
```

The seed also contains links to nonexistent addresses so broken navigation can be demonstrated.

## Suggested Demo Flow

A simple end-to-end demonstration is:

1. Select Alice Morgan.
2. Browse `garden.local`.
3. Follow several Small Web links.
4. Use Back and Forward.
5. Show the per-person History panel.
6. Search for content contained inside a page.
7. Open a search result and use Back to return to the results.
8. Visit a nonexistent address to demonstrate the 404 state.
9. Publish a new HTML page.
10. Browse the newly published page.
11. Search for text contained in the newly published page.
12. Switch browsing identity to demonstrate independent histories.

## Validation

Backend:

```bash
cd backend
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Scope

The implementation focuses on the assessment's core Small Web behavior.

It intentionally does not add unrelated browser or account functionality such as:

- Authentication.
- User accounts or roles.
- Tabs.
- Bookmarks.
- Browser extensions.
- Downloads.
- Native browser/Electron integration.
- General internet browsing.

Browsing identity and publishing identity are selected directly by person name.

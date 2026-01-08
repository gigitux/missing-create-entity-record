# Missing createEntityRecord demo

This plugin demonstrates a missing action in `@wordpress/core-data`: `createEntityRecord`.

## What this demo shows

DataViews/DataForm can render and edit entities, but there is no way to create a new entity **in memory** (draft) without saving to the database. The only available action is `saveEntityRecord`, which persists immediately and forces cleanup if a user cancels a flow.

This admin page demo highlights the UX gap:

- A **Books** list rendered with DataViews.
- A **Book form** rendered with DataForm.
- A **New book (in-memory)** action that would ideally create a local draft via `createEntityRecord`.
- The current workaround: **save a draft immediately**, then delete it if the user cancels.

The goal is to show that DataViews/DataForm cannot support a draft-first experience without a local-only entity creation action.

## How to run

1. `cd missing-create-entity-record`
2. `npm install`
3. Run one of:
   - `npm run wp-env`
4. Open **Missing createEntityRecord** in wp-admin.

## Why this matters

UX flows like these are blocked without `createEntityRecord`:

- Create a new item in a list, edit it in a DataForm panel, and only save on confirmation.
- Cancel an in-progress create flow without leaving orphan records in the database.
- Build “new item” wizards for DataViews collections without side effects.

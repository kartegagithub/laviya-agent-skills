# PRD: Order export

PRD-ID: order-export
Project: Shop Admin
Owner: product@example.com

## Goal

Store managers need the orders of a period as a CSV file for accounting, without asking the support team.

## Epic 1: Order export

Managers export the orders they can see as CSV, and long exports are e-mailed when ready.

### Story 1.1: Export the order list as CSV

As a store manager I want to download the filtered order list as CSV so that I can send it to accounting.

- Sprint: Sprint 12
- Priority: High
- Design: https://www.figma.com/design/AbC123/Shop-Admin?node-id=12-345

Tasks:

- Backend: `GET /orders/export` streams the filtered orders as CSV (date, number, customer, total, status). Estimate 6h.
- Frontend: "Export CSV" button on the order list, using the current filters. Estimate 3h. Assignee: frontend@example.com

Test scenarios:

- Export with a date filter: open Orders, filter last 7 days, click Export CSV; the file has only those orders and a header row.
- Export with no orders: filter a day without orders, click Export CSV; the file has only the header row.

### Story 1.2: E-mail large exports

As a store manager I want exports over 10,000 rows to be sent by e-mail so that the page does not time out.

- Sprint: Sprint 13
- Priority: Medium

Tasks:

- Background job that builds the CSV and e-mails a download link valid for 24 hours. Estimate 8h.
- Show "We will e-mail you the file" instead of downloading when the export is large. Estimate 2h.

Test scenarios:

- Large export: export more than 10,000 orders; the page shows the e-mail message and the link arrives within 10 minutes.

## Technical notes

- Reuse the order list query, including the manager's store permissions.
- CSV is UTF-8 with BOM so that Excel opens Turkish characters correctly.

## Out of scope

- Excel (.xlsx) export.

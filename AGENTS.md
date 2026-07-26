<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Specific Rules & Workflows

## Git Operations
- The remote repository configured for pushing changes is named `web` (not `origin`).
- When pushing changes, ALWAYS use: `git push web main` (or the respective branch).

## Business Logic & Constraints
- **Data Architecture**: The project uses Supabase. `id` fields are UUIDs.
- **Practice History**: Free practice sessions (`on-luyen`) are saved to `phien_on_luyen` as aggregate records using the Admin Client to bypass RLS for inserts/updates. No individual question logging is stored for free practice.
- **Daily Quotas for Free Users**:
  - **Thi thử (Mock Exams)**: Maximum 2 times per day. Checked against the start of the current day in Vietnam time (UTC+7).
  - **AI Assistant**: Maximum 10 queries per day, tracked in the `ai_luot_hoi` table. The chat history is NOT stored in the database for privacy reasons.
  - **Admin & Premium Users**: Are not subject to these limitations.
- **Routing**: After a successful login, users MUST be redirected to the homepage `/` (not `/profile`).

## UI / UX Guidelines
- **Theme**: Primary colors are Green (`#1B4D3E`) and Gold (`#C9A227`).
- **Typography**: The primary font used is "Plus Jakarta Sans".
- **Document Viewing**: Do not use standard `<iframe src="pdf...">` for displaying PDFs on mobile as it exposes native download/share controls. Use the custom `PDFViewer` (which wraps `react-pdf`) to ensure documents cannot be directly downloaded by users on mobile and to provide built-in pagination controls.

# AttendLink

Attendance Taking Application
Concept:
Allow faculty to adopt a SAAS application to manage their class attendance. The faculty picked a student in the list , and the student must log in the app and receive a security code. Faculty enter the code if matched student is signed in

Potential tables : Core Features / Data Tables (2NF):
User: Faculty, Students,
Class
Attendance history
Developer’s Revenue
Recommended Tech Stack:
Database: PostgreSQL
Front-End: Sveltekit
Back-End: Sveltekit
Deployment: Kubernetes
Reporting: One-click Excel export and optional analytics dashboards (Power BI or Tableau) (maybe grafana + MCP)
Example Use Case:

Taking attendance without students cheating on checking in

Revenue Model:
The platform developer earns income through service fees on each booking, targeted ads, or by selling anonymized usage data (e.g., demand trends by location or service type), or membership

## Extra Credit

Using Docker instead of a hosted server is encouraged.

Utilizing free cloud services (no purchases required) is recommended. (Solely SQL hosting on cloud can’t be included)

Creating a user-friendly, UX-focused web UI.

Implementing dynamic reporting with BI/analytics tools (Microsoft Power BI, Tableau) with connection directly to your RDBMS

Adding AI capabilities within the application.

Integrating machine learning where applicable.

Including three additional UML diagrams (flow, sequence, user journey mapping not including required Data Model Diagram ).

Incorporating RESTFUL API, WebSocket, GraphQL, OAuth.

Using Agile methodologies with tools like Jira or Asana for product management (beneficial but optional).

Adding reasonable table indexes to optimize database queries, and using views for read-only queries to improve efficiency.

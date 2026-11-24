# Project Reflection

Building ELITE taught me that a queue application needs more than screens that look complete. Its customer, reception, barber, and owner views all depend on the same reliable data, so I had to move the project from browser-only storage to a PostgreSQL API and work through database setup, permissions, and deployment configuration.

One of my biggest challenges was connecting Neon to the deployed API. A health endpoint could respond successfully while database-backed routes still failed, which showed me why process health and database readiness must be checked separately. I also had to distinguish local environment settings from Render’s settings and make sure the frontend was calling the correct API origin.

Authentication and barber assignment exposed another set of problems. A staff account must be connected to the correct barber record, and a barber must only receive their own queue data. Demo barber records being inserted at startup also made it hard to maintain the salon’s real setup. These issues taught me to trace the relationship from the database schema through the API and into the screen instead of relying on a URL or display name alone.

The project also revealed deployment limits that are easy to miss during local development: free services can sleep, database compute can pause, and several open tabs can create more concurrent requests and live connections. I learned to test readiness, concurrent screens, authorization, and production builds—not just whether the homepage opens.

At the latest production check, Render’s API health endpoint responded, but database readiness did not. I therefore still need to verify the deployed Neon connection before claiming the live application is fully operational. The project improved my understanding of full-stack integration, security boundaries, and honest deployment testing.

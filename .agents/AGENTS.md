# Workspace Rules

## Deployment and Source Control
Whenever the user requests any updates or changes to the project, after completing and verifying the changes, you MUST automatically push the updates to GitHub and ensure it is deployed to Vercel, unless explicitly instructed otherwise.

Use standard git commands (`git add .`, `git commit -m "..."`, `git push`) for pushing to GitHub. Vercel deployments are usually triggered automatically upon pushing to the main branch, but verify if a manual `vercel` command is needed depending on the setup.

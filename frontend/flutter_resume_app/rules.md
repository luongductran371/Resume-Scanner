# Rules

- **Don't hardcode URLs** beyond local development. Consider env/config for deployments.
- **Wrap API calls in a service** (`ApiService`) and keep UI lean.
- **Organize by feature**: screens, services, models, utils.
- **Prefer typed models** for responses to keep UI predictable.
- **Log errors** with enough detail to debug network issues.

---
description: Create a new EF Core migration
---

The user wants to create a new EF Core migration. Ask for the migration name if not provided in args.

Then run from `Backend/`:
```
dotnet ef migrations add <MigrationName> --project Infrastructure --startup-project API
```

Show the output. Remind the user that migrations apply automatically on next container start via `db.Database.MigrateAsync()` in Program.cs — no manual `dotnet ef database update` needed in Docker.

⚠️ This requires approval per project rules. Confirm with the user before running.

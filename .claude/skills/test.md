---
description: Run backend tests
---

Run the backend test suite from `Backend/`:
```
dotnet test
```

If the user provides a filter in args (e.g. `/test GetMovies`), run:
```
dotnet test --filter "FullyQualifiedName~<filter>"
```

Show the full output including pass/fail counts and any error details.

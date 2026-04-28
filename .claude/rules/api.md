---
glob: src/api/**
---

# API rules

- Validate all inputs at boundary (no trust of caller)
- Return consistent error shape: `{ error: string, code: number }`
- No raw SQL — use parameterized queries or ORM

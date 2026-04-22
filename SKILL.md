## 1. Test-Driven Development (TDD) Skill
When tasked with a feature:
1. Create a `test/` file mirroring the source structure.
2. Define the expected behavior in test cases.
3. Run tests and confirm failure.
4. Implement the minimum code to pass.
5. Refactor while keeping tests green.

## 2. Security Auditor Skill
Before finalizing any PR/Code change:
- Check for hardcoded secrets or environment variables.
- Validate input sanitization for SQLi, XSS, and CSRF.
- Ensure proper dependency scoping in `package.json`.

## 3. Architecture Consistency Skill
- Follow the "Clean Architecture" or "Hexagonal Architecture" patterns as defined in the project root.
- Maintain a clear separation between Domain Logic and Infrastructure (API/DB).

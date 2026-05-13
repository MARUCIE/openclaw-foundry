---
name: api-design-reviewer
description: "Review REST/GraphQL API designs for consistency, security, and usability. Use when: 'review API', endpoint design, API versioning, error handling patterns. NOT for: implementation (use new-api-endpoint)."
source: "https://github.com/alirezarezvani/claude-skills"
---
name: api-design-reviewer

# API Design Reviewer

Review API contracts for RESTful consistency, error handling, and developer experience.

## Constraints
1. Resources are nouns (plural): /users, /orders — never verbs (/getUser)
2. HTTP methods match semantics: GET=read, POST=create, PUT=replace, PATCH=update, DELETE=remove
3. Error responses: {error: {code, message, details}} — never plain strings
4. Pagination: cursor-based for real-time data, offset-based for static lists
5. Versioning: URL path (/v2/) for breaking changes, headers for minor versions

## Source

GitHub: https://github.com/alirezarezvani/claude-skills

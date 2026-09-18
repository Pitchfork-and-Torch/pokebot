# Skill: share-sanitizer

When: user wants to publish a template, card, or thread.

Inputs: draft text.

Sequence:
1. Run SHARE_SANITY.md checks.
2. Replace secrets with empty placeholders.
3. Keep the joke. Kill the keys.

Validation: no ghp_, no sk-, no passwords, no customer emails.

Approval: user posts. You do not post.

# Codex Adapter: Planning with Files

Target home for Codex-facing wrapper guidance around the shared `planning-with-files` workflow.

Current live load surface:

- `codex-skills/planning-with-files/`

## Current host mapping

- `plan` -> `task_plan.md`
- `evidence` -> `notes.md`
- `progress` -> inline progress updates inside `task_plan.md` or separate task artifacts when needed
- `deliverable` -> `deliverable.md`

## Current host-specific behavior

- Uses a lightweight Codex skill wrapper with no embedded hooks.
- Aligns more closely with AI-Fleet's project-level `task_plan.md` / `notes.md` / `deliverable.md` convention.

## Migration rule

Do not duplicate the shared workflow definition here.
Keep this adapter limited to Codex loading behavior and file-name translation.

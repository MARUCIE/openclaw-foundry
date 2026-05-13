---
name: docker-optimizer
description: "Optimize Dockerfiles for smaller images, faster builds, and better layer caching. Use when: building Docker images, 'optimize Dockerfile', 'reduce image size', 'multi-stage build'. NOT for: docker-compose orchestration, K8s deployment."
source: "https://github.com/wrsmith108/docker-claude-skill"
---
name: docker-optimizer

# Docker Optimizer

Analyze and optimize Dockerfiles for production: multi-stage builds, layer caching, image size reduction, security hardening.

## Constraints
1. Always use multi-stage builds for compiled languages (Go, Rust, Java)
2. Order COPY statements from least to most frequently changed (maximize cache hits)
3. Combine RUN statements with && to reduce layers
4. Use specific base image tags, never :latest in production
5. Run as non-root user (USER directive after all installs)

## Gotchas
**1. Alpine base images break glibc apps.** Python wheels, Node native modules, and many C libraries need glibc. Use `-slim` variants (debian-slim) instead of alpine when you hit segfaults or missing .so errors.

**2. COPY --from=builder copies ownership as root.** Even if the builder stage ran as non-root, the copied files become root-owned. Add `--chown=app:app` to COPY statements.

**3. Docker BuildKit cache mounts are not portable.** `RUN --mount=type=cache` works locally but fails in some CI environments (GitHub Actions needs `DOCKER_BUILDKIT=1`). Always test in CI before relying on it.

## Source

GitHub: https://github.com/wrsmith108/docker-claude-skill

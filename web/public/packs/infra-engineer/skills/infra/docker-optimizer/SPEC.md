---
name: docker-optimizer
description: "Optimize Dockerfiles for smaller images, faster builds, and better layer caching. Use when: building Docker images, 'optimize Dockerfile', 'reduce image size', 'multi-stage build'. NOT for: docker-compose orchestration, K8s deployment."
source: "https://github.com/wrsmith108/docker-claude-skill"
---

## 是什么

把臃肿的 Docker 镜像系统性瘦身（多阶段构建 + 分层缓存 + 安全基线），让镜像体积从 GB 级压到百 MB 级，让 CI（Continuous Integration，持续集成）构建时间砍掉一半以上，让冷启动和拉取费用同步下降。

## 怎么用

1. 先用 `docker images` 看当前体积基线，记下数字作为优化前后对照。
2. 把构建产物和运行时拆成多阶段（Multi-stage Build，多阶段构建），编译器、构建依赖一律留在前一阶段不带进运行镜像。
3. 把变动频率低的 COPY 指令排到前面，把代码 COPY 排到后面，让分层缓存命中率最大化。
4. 用 `-slim`（精简 Debian）而非 alpine 作为基础镜像，避免 glibc 缺失导致原生模块崩溃。
5. 在 Dockerfile 末尾加 `USER app` 切换非 root 用户，避免容器逃逸时权限上限太高。

## 架构图

```mermaid
flowchart LR
  源码 --> 构建阶段
  构建阶段 --> 产物提取
  产物提取 --> 精简运行镜像
  精简运行镜像 --> 镜像仓库
  镜像仓库 --> 生产部署
```

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

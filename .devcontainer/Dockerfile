FROM mcr.microsoft.com/devcontainers/python:3.12

# uv — Python package/project manager. Official install pattern; pin the tag
# (e.g. :0.5.11) instead of :latest if reproducible rebuilds matter.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /workspace

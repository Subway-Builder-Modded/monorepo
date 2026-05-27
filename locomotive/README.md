# Locomotive Backend

This directory contains Railyard's Python backend. It exposes the FastAPI app that serves registry data and related assets, and it keeps a local registry checkout in `.registry` up to date in the background.

## Prerequisites

- Python 3.14 or newer
- Poetry
- Git
- Internet access for the first registry sync

## Setup

1. Change into this directory:

   ```bash
   cd locomotive
   ```

2. Install the backend dependencies, including the development tools:

   ```bash
   poetry install --with dev
   ```

There are currently no required environment variables for local development.

## Run The Backend for Development

Start the API with Uvicorn:

```bash
poetry run fastapi dev src/
```

The interactive API docs are available at:

```text
http://127.0.0.1:8000/docs
```

On first launch, the backend clones `https://github.com/Subway-Builder-Modded/registry.git` into `.registry` and then refreshes it in the background.

## Useful Development Commands

Format the code with Black:

```bash
poetry run black --line-length=120 .
```

Sort imports with isort:

```bash
poetry run isort .
```

## Notes

- The backend is defined in `src/__main__.py`, and `src/__init__.py` exports the FastAPI app.
- Registry data is read from the local `.registry` directory after the initial clone.
- A SlowAPI rate limiter is enabled by default.
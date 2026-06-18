HOST ?= 0.0.0.0
BACKEND_PORT ?= 8000
FRONTEND_PORT ?= 5173

.PHONY: dev stop backend frontend install build test e2e demo-gif url

install:
	uv sync
	cd app && npm install

build:
	cd app && npm run build

stop:
	@pkill -f "uvicorn backend.main" 2>/dev/null || true
	@sleep 1

backend:
	uv run uvicorn backend.main:app --host $(HOST) --port $(BACKEND_PORT) --reload

frontend:
	cd app && npx vite --host $(HOST) --port $(FRONTEND_PORT)

# Run both servers. Access via http://localhost:$(FRONTEND_PORT) in VS Code devcontainer.
# For devcontainer-cli (plain Docker, no port forwarding): run `make url` for the correct address.
dev: stop
	@trap 'kill 0' SIGINT; \
	uv run uvicorn backend.main:app --host $(HOST) --port $(BACKEND_PORT) --reload & \
	cd app && npx vite --host $(HOST) --port $(FRONTEND_PORT)

# Print the URL to open in the host browser when running via devcontainer-cli.
url:
	@echo "http://$(shell hostname -I | awk '{print $$1}'):$(FRONTEND_PORT)"

test:
	uv run pytest tests/ -q
	cd app && npx vitest run

e2e:
	cd app && npx playwright test

# Record a demo GIF (requires frontend dev server running: make frontend)
demo-gif:
	cd app && node scripts/record-demo.mjs

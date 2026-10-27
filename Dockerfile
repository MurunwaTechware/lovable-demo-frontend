# Frontend (TanStack Start) as a Node server, for Cloud Run.
#
# Lovable's build config targets Cloudflare by default; NITRO_PRESET=node-server builds a plain Node server
# instead (Lovable's own builds ignore it). The server forwards the backends' paths (src/server.ts), so it
# needs their addresses when it runs:
#   BACKEND_URL        the try-on backend, e.g. https://tryon-web-....run.app
#   PRODUCTS_API_URL   the products API
#
# Build and try locally (from this folder):
#   docker build -t tryon-frontend .
#   docker run --rm -p 8080:8080 -e BACKEND_URL=http://host.docker.internal:8000 -e PRODUCTS_API_URL=http://host.docker.internal:8001 tryon-frontend

FROM oven/bun:1.4.3 AS build
WORKDIR /app
# Dependencies first, so code changes don't reinstall them on every build.
# Lovable writes some lockfile entries with its own private package cache's address, which builds outside
# Lovable can't reach. They're ordinary npm packages (same paths, same checksums), so fetch those from
# the public registry instead. Only the copy inside the image changes; the repo's bun.lock stays as it is.
COPY package.json bun.lock bunfig.toml ./
RUN sed -i 's#https://europe-west4-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/#https://registry.npmjs.org/#g' bun.lock \
    && bun install --frozen-lockfile
COPY . .
ENV NITRO_PRESET=node-server
RUN bun run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
# The build output is self-contained: no node_modules needed at runtime
COPY --from=build /app/.output ./.output
USER node
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]

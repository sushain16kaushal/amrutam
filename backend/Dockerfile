FROM node:20-slim AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
# sharp (via @xenova/transformers) postinstall step downloads its libvips binary
# directly from GitHub Releases, which occasionally drops mid-download ("socket
# hang up") on CI/build runners. npm's own fetch-retry config doesn't cover this
# script step, so retry the whole install a few times before giving up.
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_mintimeout=20000
ENV npm_config_fetch_retry_maxtimeout=120000
RUN for attempt in 1 2 3; do \
      echo "npm ci attempt $attempt"; \
      npm ci --omit=dev && exit 0; \
      echo "npm ci failed on attempt $attempt, retrying..."; \
      rm -rf node_modules; \
      sleep $((attempt * 10)); \
    done; \
    echo "npm ci failed after 3 attempts"; \
    exit 1

FROM base AS runner
ENV NODE_ENV=production
ENV TRANSFORMERS_CACHE=/tmp/.transformers-cache
ENV HF_HOME=/tmp/.transformers-cache
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/uploads/consultation-images && chown -R node:node /app/uploads
EXPOSE 5000
USER node
CMD ["node", "src/server.js"]
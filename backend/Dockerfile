FROM node:20-slim AS base
WORKDIR /app
# sharp (via @xenova/transformers) normally downloads a prebuilt libvips binary
# from GitHub Releases during npm install. That download is unreachable/unstable
# from this build environment ("socket hang up", even after retries) — so instead
# we install libvips from apt here. When sharp's install script finds a system
# libvips via pkg-config, it links against that and skips the GitHub download
# entirely (see https://sharp.pixelplumbing.com/install#custom-libvips).
RUN apt-get update && apt-get install -y --no-install-recommends \
      libvips-dev \
      build-essential \
      python3 \
      pkg-config \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

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
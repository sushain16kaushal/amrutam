FROM node:20-slim AS base
WORKDIR /app

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
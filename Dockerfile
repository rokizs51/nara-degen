FROM node:20-bullseye
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_MARKET_API_URL
ENV NEXT_PUBLIC_MARKET_API_URL=${NEXT_PUBLIC_MARKET_API_URL}
COPY package.json package-lock.json* ./
RUN npm ci
RUN npm install @next/swc-linux-x64-gnu@16.0.6 --no-save
COPY . .
ENV NODE_ENV=production
ENV PORT=3000
RUN npm run build
RUN npm prune --production
EXPOSE 3000
CMD ["npm","run","start"]

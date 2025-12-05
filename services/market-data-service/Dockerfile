FROM node:20-alpine
WORKDIR /app

ARG FRONTEND_URL
ENV FRONTEND_URL=${FRONTEND_URL}

COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build && npm prune --production
ENV PORT=4001
EXPOSE 4001
CMD ["node","dist/main.js"]

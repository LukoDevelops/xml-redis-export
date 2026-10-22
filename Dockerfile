FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
COPY test ./test
COPY data ./data

USER node
ENTRYPOINT ["node", "src/cli.js"]

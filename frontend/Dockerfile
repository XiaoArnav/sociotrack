# ========================================================
# SocioTrack Frontend Dockerfile (Next.js 14)
# ========================================================
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start Next.js development server
CMD ["npm", "run", "dev"]

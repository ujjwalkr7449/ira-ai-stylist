FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim

WORKDIR /app/backend
ENV PYTHONUNBUFFERED=1
COPY backend/requirements-deploy.txt ./requirements-deploy.txt
RUN pip install --no-cache-dir -r requirements-deploy.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
RUN mkdir -p /app/backend/uploads

CMD ["sh", "-c", "if [ \"$SEED_DATABASE\" = \"true\" ]; then python seed.py; fi; exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]

# Docker Deployment Guide

## Quick Start

### Build the Image

```bash
docker build -t mcp-server-starter .
```

### Run the Container

```bash
# Basic run
docker run -p 3000:3000 --env-file .env.http mcp-server-starter

# Run with environment variables
docker run -p 3000:3000 \
  -e MCP_SERVER_NAME=my-mcp-server \
  -e TRANSPORT_TYPE=http \
  -e HTTP_HOST=0.0.0.0 \
  -e HTTP_PORT=3000 \
  -e AUTH_ENABLED=true \
  -e OAUTH_CLIENT_ID=your-client-id \
  -e OAUTH_CLIENT_SECRET=your-client-secret \
  -e PUBLIC_URL=https://your-domain.com \
  mcp-server-starter

# Run in background
docker run -d --name mcp-server -p 3000:3000 --env-file .env.http mcp-server-starter
```

## Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mcp-server:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.http
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

## Production Considerations

### Image Features

✅ **Multi-stage build** - Smaller production image (~150MB vs ~1GB)  
✅ **Non-root user** - Runs as `nodejs` user for security  
✅ **Signal handling** - Uses `dumb-init` for proper shutdown  
✅ **Production dependencies only** - No dev dependencies in final image  

### Environment Variables

All configuration is done via environment variables. Key ones:

```bash
# Required
TRANSPORT_TYPE=http
HTTP_HOST=0.0.0.0
HTTP_PORT=3000

# OAuth (if AUTH_ENABLED=true)
AUTH_ENABLED=true
OAUTH_CLIENT_ID=xxx
OAUTH_CLIENT_SECRET=xxx
PUBLIC_URL=https://your-domain.com

# Security
FILTER_BY_IP=10.0.0.0/8
ALLOWED_EMAILS=user@company.com

# Logging
LOG_LEVEL=info
```

### Container Registry

Push to your registry:

```bash
# Docker Hub
docker tag mcp-server-starter username/mcp-server-starter:latest
docker push username/mcp-server-starter:latest

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPO
docker tag mcp-server-starter:latest $ECR_REPO/mcp-server-starter:latest
docker push $ECR_REPO/mcp-server-starter:latest

# Google Container Registry
docker tag mcp-server-starter gcr.io/$PROJECT_ID/mcp-server-starter:latest
docker push gcr.io/$PROJECT_ID/mcp-server-starter:latest
```

### Health Checks

For Kubernetes/ECS/Swarm, configure health checks:

```yaml
# Kubernetes
livenessProbe:
  httpGet:
    path: /mcp
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /mcp
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Resource Limits

Recommended container resources:

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## Debugging

### View logs
```bash
docker logs mcp-server
```

### Execute into container
```bash
docker exec -it mcp-server sh
```

### Check container details
```bash
docker inspect mcp-server
```

## Security Notes

1. **Never bake secrets into image** - Use environment variables or secret management
2. **Run as non-root** - Already configured in Dockerfile
3. **Use specific versions** - Pin node:20-alpine instead of node:latest
4. **Scan for vulnerabilities**:
   ```bash
   docker scout cves mcp-server-starter
   ```

## Optimizations

The Docker image is optimized for:
- **Small size** - Alpine Linux base, multi-stage build
- **Fast startup** - Pre-compiled TypeScript
- **Security** - Non-root user, minimal attack surface
- **Production** - Only production dependencies included
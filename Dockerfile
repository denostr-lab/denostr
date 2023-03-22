FROM denoland/deno:alpine-1.31.3 as base

LABEL org.opencontainers.image.title="denostr"
LABEL org.opencontainers.image.source=https://github.com/guakamoli/denostr
LABEL org.opencontainers.image.description="denostr"
LABEL org.opencontainers.image.authors="GUAKAMOLI"
LABEL org.opencontainers.image.licenses=MIT

# Create the app directory
WORKDIR /app

# set cache path
ENV DENO_DIR=/app/.cache

# Default type of work
ARG WORKER_TYPE=worker
ENV WORKER_TYPE=${WORKER_TYPE}

FROM base as cache

# Copy the app files
COPY --chown=deno:deno . .

# Cache dependencies
RUN deno cache src/index.ts

FROM base as runner

# Copy the app to the container
COPY --chown=deno:deno --from=cache /app .
COPY --chown=deno:deno --from=cache /app/.cache .cache

USER deno

EXPOSE 8008

CMD ["task", "start"]

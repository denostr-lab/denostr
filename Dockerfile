FROM denoland/deno:alpine-1.31.3 as base

LABEL org.opencontainers.image.authors="GUAKAMOLI"

# Create the app directory
WORKDIR /app

# set cache path
ENV DENO_DIR=/app/.cache

ARG WORKER_TYPE

ENV WORKER_TYPE=${WORKER_TYPE}

FROM base as cache

# Copy the app files
COPY --chown=deno:deno . .

# Cache dependencies
RUN deno cache src/index.ts

FROM base as runner

# Copy the app to the container
COPY --chown=deno:deno --from=cache /app .

# Run with lower permissions and improve security
USER deno

EXPOSE 8008

CMD ["task", "start"]

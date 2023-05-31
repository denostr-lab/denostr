FROM denoland/deno:alpine-1.31.3 as base

LABEL org.opencontainers.image.title=denostr
LABEL org.opencontainers.image.description='Deno-based, cloud-native nostr implementation supported by ByteTrade and Revo, forked from nostream.'
LABEL org.opencontainers.image.authors=Denostr
LABEL org.opencontainers.image.licenses=MIT
LABEL org.opencontainers.image.url=https://github.com/denostr-protocol/denostr
LABEL org.opencontainers.image.source=https://github.com/denostr-protocol/denostr

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
RUN deno task cache

FROM base as runner

# Copy the app to the container
COPY --chown=deno:deno --from=cache /app .

# Run with lower permissions and improve security
USER deno

EXPOSE 8008

CMD ["task", "start"]

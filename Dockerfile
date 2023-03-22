FROM denoland/deno:alpine-1.31.3 as base

LABEL org.opencontainers.image.title="denostr"
LABEL org.opencontainers.image.source=https://github.com/guakamoli/denostr
LABEL org.opencontainers.image.description="denostr"
LABEL org.opencontainers.image.authors="GUAKAMOLI"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

ENV DENO_DIR=/app/.cache

FROM base as cache

COPY --chown=deno:deno . .

RUN deno cache src/index.ts

FROM base as runner

COPY --chown=deno:deno --from=cache /app .
COPY --chown=deno:deno --from=cache /app/.cache .cache

USER deno

EXPOSE 8000

CMD ["task", "start"]

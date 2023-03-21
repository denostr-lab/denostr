FROM denoland/deno:alpine-1.31.3 as build

LABEL org.opencontainers.image.title="denostr"
LABEL org.opencontainers.image.source=https://github.com/guakamoli/denostr
LABEL org.opencontainers.image.description="denostr"
LABEL org.opencontainers.image.authors="GUAKAMOLI"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

COPY . .

RUN deno cache src/index.ts

USER deno

EXPOSE 8000

CMD ["task", "start"]

FROM denoland/deno:alpine-1.31.3 as build

LABEL org.opencontainers.image.title="Nostream"
LABEL org.opencontainers.image.source=https://github.com/Guakamoli/nostream
LABEL org.opencontainers.image.description="nostream"
LABEL org.opencontainers.image.authors="GUAKAMOLI"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

USER deno

COPY ["package.json", "package-lock.json", "./"]

COPY . .

RUN apk add --no-cache --update git

RUN deno cache main.ts

CMD ["deno", "task", "start"]

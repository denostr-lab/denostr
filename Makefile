denostr: $(shell find . -name "*.go")
	CC=$$(which musl-gcc) go build -ldflags='-s -w -linkmode external -extldflags "-static"' -o ./denostr

start:
	POSTGRESQL_DATABASE=postgres://nostr:nostr@localhost:5432/nostr?sslmode=disable go run main.go

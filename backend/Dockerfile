FROM golang:1.23-alpine AS build
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o server .

FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/server ./server
COPY --from=build /app/.env ./.env
EXPOSE 8080
CMD ["./server"]

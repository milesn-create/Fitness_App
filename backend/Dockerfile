FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=0 go build -o /app/backend ./cmd

FROM alpine:3.19

WORKDIR /app
COPY --from=builder /app/backend .
RUN mkdir -p uploads/avatars uploads/workouts
EXPOSE 8080
CMD ["./backend"]
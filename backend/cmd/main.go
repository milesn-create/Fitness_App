package main

import (
	"fitness-app/internal/app"
	"fitness-app/internal/config"
)

func main() {
	cfg := config.Load()
	a := app.NewApp(cfg)
	a.Run()
}

package main

import (
	"log"
	"net/http"

	"app-family/backend/internal/api"
)

func main() {
	srv := api.NewServer()
	addr := ":8080"
	log.Printf("API listening on %s", addr)
	if err := http.ListenAndServe(addr, srv.Routes()); err != nil {
		log.Fatal(err)
	}
}

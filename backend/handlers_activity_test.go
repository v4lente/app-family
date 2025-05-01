package main

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestHandleHistory_Unauthorized(t *testing.T) {
	app := fiber.New()
	app.Get("/history", handleHistory)
	req := httptest.NewRequest("GET", "/history", nil)
	resp, _ := app.Test(req)
	// Espera erro pois não há user_id no contexto
	assert.Equal(t, 500, resp.StatusCode)
}

func TestHandleStats_MissingFamilyID(t *testing.T) {
	app := fiber.New()
	app.Get("/stats", handleStats)
	req := httptest.NewRequest("GET", "/stats", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, 400, resp.StatusCode)
}

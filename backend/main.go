package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	if err := ConnectDB(); err != nil {
		log.Fatalf("Erro ao conectar no banco: %v", err)
	}

	app := fiber.New()

	// Middlewares
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowCredentials: true,
	}))

	// Routes
	setupRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	api := app.Group("/api")

	// Health check
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "healthy",
		})
	})

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", handleRegister)
	auth.Post("/login", handleLogin)

	// Protected routes
	protected := api.Group("/", authMiddleware)
	
	// User routes
	user := protected.Group("/user")
	user.Get("/me", handleGetMe)

	// REST users
	protected.Get("/users", handleListUsers)
	protected.Get("/users/:id", handleGetUser)
	protected.Put("/users/:id", handleUpdateUser)
	protected.Delete("/users/:id", handleDeleteUser)

	// Family routes
	family := protected.Group("/family")
	family.Post("/", handleCreateFamily)
	family.Get("/", handleGetFamily)
	family.Post("/join", handleJoinFamily)

	// Activity routes
	activity := protected.Group("/activity")
	activity.Get("/", handleListActivities)
	activity.Post("/", handleCreateActivity)
	activity.Post("/log", handleLogActivity)

	// History
	protected.Get("/history", handleHistory)

	// Stats
	protected.Get("/stats", handleStats)
}

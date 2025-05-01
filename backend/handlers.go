package main

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"log"
)

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func handleRegister(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validação simples
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Todos os campos são obrigatórios."})
	}

	// Verifica se o usuário já existe
	var exists bool
	err := DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", req.Email).Scan(&exists)
	if err != nil {
		fmt.Printf("Erro ao verificar usuário: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao verificar usuário.", "details": err.Error()})
	}
	if exists {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "E-mail já cadastrado."})
	}

	// Hash da senha
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao gerar hash da senha."})
	}

	// Iniciar uma transação para garantir que todas as operações sejam realizadas ou nenhuma delas
	tx, err := DB.Begin(context.Background())
	if err != nil {
		fmt.Printf("Erro ao iniciar transação: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao processar registro."})
	}
	defer tx.Rollback(context.Background()) // Garante rollback em caso de erro

	// Salva usuário e obtém o ID
	var userID int
	err = tx.QueryRow(context.Background(),
		"INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
		req.Name, req.Email, string(hash),
	).Scan(&userID)

	if err != nil {
		fmt.Printf("Erro ao salvar usuário: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao salvar usuário."})
	}

	// Verificar se existe alguma família para adicionar o usuário
	var familyID int
	var familyName string
	var inviteCode string

	// Tenta encontrar uma família existente
	err = tx.QueryRow(context.Background(), "SELECT id, name, invite_code FROM families LIMIT 1").Scan(&familyID, &familyName, &inviteCode)
	
	// Se não encontrar uma família, cria uma nova
	if err != nil {
		fmt.Printf("Nenhuma família encontrada, criando uma nova: %v\n", err)
		
		// Criar uma nova família para o usuário
		familyName = "Família " + req.Name
		inviteCode = RandString(8)
		
		err = tx.QueryRow(context.Background(),
			"INSERT INTO families (name, invite_code) VALUES ($1, $2) RETURNING id",
			familyName, inviteCode,
		).Scan(&familyID)
		
		if err != nil {
			fmt.Printf("Erro ao criar família: %v\n", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar família."})
		}
	}

	// Adicionar o usuário à família como administrador
	_, err = tx.Exec(context.Background(),
		"INSERT INTO family_members (family_id, user_id, is_admin) VALUES ($1, $2, $3)",
		familyID, userID, true,
	)

	if err != nil {
		fmt.Printf("Erro ao adicionar usuário à família: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao adicionar usuário à família."})
	}

	// Commit da transação
	if err := tx.Commit(context.Background()); err != nil {
		fmt.Printf("Erro ao finalizar transação: %v\n", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao finalizar registro."})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Usuário cadastrado com sucesso e adicionado à família!",
		"user_id": userID,
		"family": fiber.Map{
			"id": familyID,
			"name": familyName,
			"invite_code": inviteCode,
		},
	})
}

func handleLogin(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email e senha são obrigatórios."})
	}

	type userRow struct {
		ID       int
		Name     string
		Email    string
		Hash     string
		IsSuperuser bool
	}
	var user userRow
	err := DB.QueryRow(context.Background(), "SELECT id, name, email, password_hash, is_superuser FROM users WHERE email=$1", req.Email).Scan(&user.ID, &user.Name, &user.Email, &user.Hash, &user.IsSuperuser)
	if err != nil {
		log.Printf("[LOGIN] Erro ao buscar usuário '%s': %v", req.Email, err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Usuário ou senha inválidos.", "details": err.Error()})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Hash), []byte(req.Password)); err != nil {
		log.Printf("[LOGIN] Erro ao comparar senha para '%s': %v\nHash no banco: %s\nSenha recebida: %s", req.Email, err, user.Hash, req.Password)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Usuário ou senha inválidos.", "details": err.Error(), "hash": user.Hash, "password": req.Password})
	}

	// Gera o token JWT
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"name": user.Name,
		"email": user.Email,
		"is_superuser": user.IsSuperuser,
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 dias
	})
	secret := getEnv("JWT_SECRET", "secret123")
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao gerar token."})
	}

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id": user.ID,
			"name": user.Name,
			"email": user.Email,
			"is_superuser": user.IsSuperuser,
		},
	})
}

func handleGetMe(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	return c.JSON(fiber.Map{
		"id":    claims["user_id"],
		"name":  claims["name"],
		"email": claims["email"],
	})
}

type CreateFamilyRequest struct {
	Name string `json:"name"`
}

func handleCreateFamily(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))

	var req CreateFamilyRequest
	if err := c.BodyParser(&req); err != nil || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Nome da família é obrigatório."})
	}

	// Gera um código de convite simples
	inviteCode := RandString(10)
	var familyID int
	err := DB.QueryRow(context.Background(),
		"INSERT INTO families (name, invite_code) VALUES ($1, $2) RETURNING id",
		req.Name, inviteCode,
	).Scan(&familyID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao criar família."})
	}
	// Adiciona criador como admin
	_, err = DB.Exec(context.Background(),
		"INSERT INTO family_members (family_id, user_id, is_admin) VALUES ($1, $2, TRUE)",
		familyID, userID,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao adicionar membro."})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"id": familyID, "invite_code": inviteCode})
}

func RandString(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	rand.Seed(time.Now().UnixNano())
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}

func handleGetFamily(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))

	rows, err := DB.Query(context.Background(),
		`SELECT f.id, f.name, f.invite_code, fm.is_admin
		 FROM families f
		 JOIN family_members fm ON fm.family_id = f.id
		 WHERE fm.user_id = $1`, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao buscar famílias."})
	}
	defer rows.Close()
	families := []fiber.Map{}
	for rows.Next() {
		var id int
		var name, inviteCode string
		var isAdmin bool
		if err := rows.Scan(&id, &name, &inviteCode, &isAdmin); err == nil {
			families = append(families, fiber.Map{
				"id": id,
				"name": name,
				"invite_code": inviteCode,
				"is_admin": isAdmin,
			})
		}
	}
	return c.JSON(fiber.Map{"families": families})
}

type JoinFamilyRequest struct {
	InviteCode string `json:"invite_code"`
}

func handleJoinFamily(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))

	var req JoinFamilyRequest
	if err := c.BodyParser(&req); err != nil || req.InviteCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Código de convite obrigatório."})
	}

	var familyID int
	err := DB.QueryRow(context.Background(), "SELECT id FROM families WHERE invite_code=$1", req.InviteCode).Scan(&familyID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Família não encontrada."})
	}
	// Verifica se já é membro
	var exists bool
	err = DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM family_members WHERE family_id=$1 AND user_id=$2)", familyID, userID).Scan(&exists)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao verificar membro."})
	}
	if exists {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Você já é membro desta família."})
	}
	// Adiciona membro
	_, err = DB.Exec(context.Background(), "INSERT INTO family_members (family_id, user_id) VALUES ($1, $2)", familyID, userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Erro ao entrar na família."})
	}
	return c.JSON(fiber.Map{"message": "Entrou na família com sucesso!", "family_id": familyID})
}

func handleListActivities(c *fiber.Ctx) error {
	// Consulta com COALESCE para tratar valores nulos
	query := `
		SELECT 
			id, 
			name, 
			COALESCE(description, ''), 
			COALESCE(icon, ''), 
			created_at 
		FROM 
			activities 
		ORDER BY id
	`
	
	// Executar a consulta
	rows, err := DB.Query(c.Context(), query)
	if err != nil {
		fmt.Println("Erro na consulta de atividades:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar atividades"})
	}
	defer rows.Close()

	var activities []map[string]interface{}
	for rows.Next() {
		var id int
		var name, description, icon string
		var createdAt time.Time
		if err := rows.Scan(&id, &name, &description, &icon, &createdAt); err != nil {
			fmt.Println("Erro ao ler atividade:", err)
			return c.Status(500).JSON(fiber.Map{"error": "Erro ao ler atividade"})
		}
		activities = append(activities, fiber.Map{
			"id": id, 
			"name": name, 
			"description": description, 
			"icon": icon,
			"created_at": createdAt,
		})
	}
	
	// Verificar se há resultados
	if len(activities) == 0 {
		// Retornar um array vazio em vez de null
		return c.JSON(fiber.Map{"activities": []map[string]interface{}{}})
	}
	
	return c.JSON(fiber.Map{"activities": activities})
}

func handleCreateActivity(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	
	// Imprimir informações para debug
	fmt.Println("Criando atividade para o usuário ID:", userID)
	
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
	}
	
	if err := c.BodyParser(&req); err != nil {
		fmt.Println("Erro ao fazer parse do body:", err)
		return c.Status(400).JSON(fiber.Map{"error": "Dados inválidos"})
	}
	
	if req.Name == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nome da atividade é obrigatório"})
	}
	
	fmt.Println("Dados recebidos:", req)
	
	// Usar COALESCE para garantir que valores nulos sejam tratados corretamente
	query := `
		INSERT INTO activities (name, description, icon, created_by) 
		VALUES ($1, COALESCE($2, ''), COALESCE($3, ''), $4) 
		RETURNING id
	`
	
	// Inserir a atividade e obter o ID
	var activityID int
	err := DB.QueryRow(
		c.Context(), 
		query,
		req.Name, 
		req.Description, 
		req.Icon, 
		userID,
	).Scan(&activityID)
	
	if err != nil {
		fmt.Println("Erro ao inserir atividade:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao criar atividade"})
	}
	
	fmt.Println("Atividade criada com ID:", activityID)
	
	// Buscar a atividade recém-criada para retornar
	var activity struct {
		ID          int       `json:"id"`
		Name        string    `json:"name"`
		Description string    `json:"description"`
		Icon        string    `json:"icon"`
		CreatedAt   time.Time `json:"created_at"`
	}
	
	// Usar COALESCE para garantir que valores nulos sejam tratados corretamente
	selectQuery := `
		SELECT 
			id, 
			name, 
			COALESCE(description, ''), 
			COALESCE(icon, ''), 
			created_at 
		FROM 
			activities 
		WHERE 
			id = $1
	`
	
	err = DB.QueryRow(c.Context(), selectQuery, activityID).Scan(
		&activity.ID, 
		&activity.Name, 
		&activity.Description, 
		&activity.Icon, 
		&activity.CreatedAt,
	)
	
	if err != nil {
		fmt.Println("Erro ao buscar atividade criada:", err)
		// Se não conseguir buscar a atividade, pelo menos retorna o status de sucesso
		return c.Status(201).JSON(fiber.Map{"id": activityID})
	}
	
	return c.Status(201).JSON(fiber.Map{"activity": activity})
}

func handleLogActivity(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	var req struct {
		ActivityID int `json:"activity_id"`
		FamilyID   int `json:"family_id"`
	}
	if err := c.BodyParser(&req); err != nil || req.ActivityID == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Dados inválidos"})
	}
	
	// Obter a primeira família do usuário se family_id não for fornecido
	if req.FamilyID == 0 {
		var familyID int
		err := DB.QueryRow(c.Context(), "SELECT family_id FROM family_members WHERE user_id = $1 LIMIT 1", userID).Scan(&familyID)
		if err != nil {
			// Se não encontrar uma família, continua com 0 (NULL no banco)
			familyID = 0
		}
		req.FamilyID = familyID
	}
	
	// Registrar a atividade com o performed_at como NOW()
	_, err := DB.Exec(c.Context(), "INSERT INTO user_activities (user_id, activity_id, family_id, performed_at) VALUES ($1, $2, $3, NOW())", userID, req.ActivityID, req.FamilyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao registrar atividade"})
	}
	return c.SendStatus(201)
}

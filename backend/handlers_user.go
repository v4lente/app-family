package main

import (
	"context"
	"fmt"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"time"
)

// GET /api/users
func handleListUsers(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	isSuper := false
	if v, ok := claims["is_superuser"]; ok {
		isSuper, _ = v.(bool)
	}

	// Consulta que inclui informações da família para cada usuário
	baseQuery := `
		SELECT 
			u.id, 
			u.name, 
			u.email, 
			u.created_at, 
			u.is_superuser,
			COALESCE(fm.family_id, 0) as family_id,
			COALESCE(f.name, '') as family_name
		FROM 
			users u
		LEFT JOIN 
			family_members fm ON u.id = fm.user_id
		LEFT JOIN 
			families f ON fm.family_id = f.id
	`

	var rows pgx.Rows
	var err error

	if isSuper {
		// Superusuário vê todos os usuários
		rows, err = DB.Query(context.Background(), baseQuery + " ORDER BY u.id")
	} else {
		// Admin de família: lista membros das famílias que é admin
		whereClause := `
			WHERE 
				fm.family_id IN (
					SELECT 
						family_id 
					FROM 
						family_members 
					WHERE 
						user_id = $1 AND is_admin = TRUE
				)
		`
		rows, err = DB.Query(context.Background(), baseQuery + whereClause + " ORDER BY u.id", userID)
	}

	if err != nil {
		fmt.Println("Erro ao buscar membros da família:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar membros da família"})
	}
	defer rows.Close()

	users := []fiber.Map{}
	for rows.Next() {
		var id int
		var name, email string
		var createdAt time.Time
		var isSuperuser bool
		var familyID int
		var familyName string

		if err := rows.Scan(
			&id, 
			&name, 
			&email, 
			&createdAt, 
			&isSuperuser, 
			&familyID, 
			&familyName,
		); err == nil {
			userData := fiber.Map{
				"id": id,
				"name": name,
				"email": email,
				"created_at": createdAt,
				"is_superuser": isSuperuser,
			}

			// Adicionar informações da família apenas se o usuário pertencer a uma
			if familyID > 0 {
				userData["family_id"] = familyID
				userData["family_name"] = familyName
			}

			users = append(users, userData)
		} else {
			fmt.Println("Erro ao ler dados do membro:", err)
		}
	}

	return c.JSON(users)
}

// GET /api/users/:id
func handleGetUser(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	isSuper := false
	if v, ok := claims["is_superuser"]; ok {
		isSuper, _ = v.(bool)
	}
	
	idParam := c.Params("id")
	var id int
	_, err := fmt.Sscanf(idParam, "%d", &id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID inválido"})
	}
	
	if !isSuper && userID != id {
		// Verifica se é admin da família do usuário alvo
		var count int
		err := DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM family_members fm1 JOIN family_members fm2 ON fm1.family_id = fm2.family_id WHERE fm1.user_id=$1 AND fm1.is_admin=TRUE AND fm2.user_id=$2`, userID, id).Scan(&count)
		if err != nil || count == 0 {
			return c.Status(403).JSON(fiber.Map{"error": "Sem permissão"})
		}
	}
	
	// Consulta que inclui informações da família
	query := `
		SELECT 
			u.name, 
			u.email, 
			u.created_at, 
			u.is_superuser,
			COALESCE(fm.family_id, 0) as family_id,
			COALESCE(f.name, '') as family_name
		FROM 
			users u
		LEFT JOIN 
			family_members fm ON u.id = fm.user_id
		LEFT JOIN 
			families f ON fm.family_id = f.id
		WHERE 
			u.id = $1
		LIMIT 1
	`
	
	var name, email string
	var createdAt time.Time
	var isSuperuser bool
	var familyID int
	var familyName string
	
	err = DB.QueryRow(context.Background(), query, id).Scan(
		&name, 
		&email, 
		&createdAt, 
		&isSuperuser, 
		&familyID, 
		&familyName,
	)
	
	if err != nil {
		fmt.Println("Erro ao buscar membro:", err)
		return c.Status(404).JSON(fiber.Map{"error": "Membro não encontrado"})
	}
	
	// Preparar a resposta
	userData := fiber.Map{
		"id": id, 
		"name": name, 
		"email": email, 
		"created_at": createdAt, 
		"is_superuser": isSuperuser,
	}
	
	// Adicionar informações da família apenas se o usuário pertencer a uma
	if familyID > 0 {
		userData["family_id"] = familyID
		userData["family_name"] = familyName
	}
	
	return c.JSON(userData)
}

// PUT /api/users/:id
func handleUpdateUser(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	isSuper := false
	if v, ok := claims["is_superuser"]; ok {
		isSuper, _ = v.(bool)
	}
	
	idParam := c.Params("id")
	var id int
	_, err := fmt.Sscanf(idParam, "%d", &id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID inválido"})
	}
	
	// Verificar permissões
	if !isSuper && userID != id {
		var count int
		err := DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM family_members fm1 JOIN family_members fm2 ON fm1.family_id = fm2.family_id WHERE fm1.user_id=$1 AND fm1.is_admin=TRUE AND fm2.user_id=$2`, userID, id).Scan(&count)
		if err != nil || count == 0 {
			return c.Status(403).JSON(fiber.Map{"error": "Sem permissão"})
		}
	}
	
	// Dados do formulário
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		FamilyID int    `json:"family_id"`
	}
	
	if err := c.BodyParser(&req); err != nil {
		fmt.Println("Erro ao fazer parse do body:", err)
		return c.Status(400).JSON(fiber.Map{"error": "Dados inválidos"})
	}
	
	// Iniciar uma transação para garantir consistência
	tx, err := DB.Begin(context.Background())
	if err != nil {
		fmt.Println("Erro ao iniciar transação:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao processar atualização"})
	}
	defer tx.Rollback(context.Background()) // Garante rollback em caso de erro
	
	// Atualizar dados básicos do usuário
	_, err = tx.Exec(context.Background(), 
		"UPDATE users SET name=$1, email=$2 WHERE id=$3", 
		req.Name, req.Email, id)
	
	if err != nil {
		fmt.Println("Erro ao atualizar usuário:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao atualizar usuário"})
	}
	
	// Se um ID de família foi fornecido, atualizar a associação
	if req.FamilyID > 0 {
		// Verificar se a família existe
		var familyExists bool
		err = tx.QueryRow(context.Background(), 
			"SELECT EXISTS(SELECT 1 FROM families WHERE id=$1)", 
			req.FamilyID).Scan(&familyExists)
		
		if err != nil {
			fmt.Println("Erro ao verificar família:", err)
			return c.Status(500).JSON(fiber.Map{"error": "Erro ao verificar família"})
		}
		
		if !familyExists {
			return c.Status(400).JSON(fiber.Map{"error": "Família não encontrada"})
		}
		
		// Verificar se o usuário já está associado a esta família
		var memberExists bool
		err = tx.QueryRow(context.Background(), 
			"SELECT EXISTS(SELECT 1 FROM family_members WHERE user_id=$1 AND family_id=$2)", 
			id, req.FamilyID).Scan(&memberExists)
		
		if err != nil {
			fmt.Println("Erro ao verificar associação:", err)
			return c.Status(500).JSON(fiber.Map{"error": "Erro ao verificar associação"})
		}
		
		// Se não estiver associado, criar a associação
		if !memberExists {
			_, err = tx.Exec(context.Background(), 
				"INSERT INTO family_members (family_id, user_id, is_admin) VALUES ($1, $2, $3)", 
				req.FamilyID, id, false) // Por padrão, não é admin
			
			if err != nil {
				fmt.Println("Erro ao associar usuário à família:", err)
				return c.Status(500).JSON(fiber.Map{"error": "Erro ao associar usuário à família"})
			}
		}
	}
	
	// Commit da transação
	if err := tx.Commit(context.Background()); err != nil {
		fmt.Println("Erro ao finalizar transação:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao finalizar atualização"})
	}
	
	// Buscar os dados atualizados do usuário para retornar
	var updatedUser struct {
		ID          int       `json:"id"`
		Name        string    `json:"name"`
		Email       string    `json:"email"`
		IsSuperuser bool      `json:"is_superuser"`
		CreatedAt   time.Time `json:"created_at"`
		FamilyID    int       `json:"family_id"`
		FamilyName  string    `json:"family_name"`
	}
	
	// Buscar dados do usuário com informações da família
	err = DB.QueryRow(context.Background(), `
		SELECT 
			u.id, u.name, u.email, u.is_superuser, u.created_at, 
			COALESCE(fm.family_id, 0) as family_id, 
			COALESCE(f.name, '') as family_name
		FROM 
			users u
		LEFT JOIN 
			family_members fm ON u.id = fm.user_id
		LEFT JOIN 
			families f ON fm.family_id = f.id
		WHERE 
			u.id = $1
		LIMIT 1
	`, id).Scan(
		&updatedUser.ID, 
		&updatedUser.Name, 
		&updatedUser.Email, 
		&updatedUser.IsSuperuser, 
		&updatedUser.CreatedAt,
		&updatedUser.FamilyID,
		&updatedUser.FamilyName,
	)
	
	if err != nil {
		fmt.Println("Erro ao buscar dados atualizados:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Atualização realizada, mas erro ao buscar dados"})
	}
	
	return c.Status(200).JSON(updatedUser)
}

// DELETE /api/users/:id
func handleDeleteUser(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	isSuper := false
	if v, ok := claims["is_superuser"]; ok {
		isSuper, _ = v.(bool)
	}
	idParam := c.Params("id")
	var id int
	_, err := fmt.Sscanf(idParam, "%d", &id)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID inválido"})
	}
	if !isSuper && userID != id {
		var count int
		err := DB.QueryRow(context.Background(), `SELECT COUNT(*) FROM family_members fm1 JOIN family_members fm2 ON fm1.family_id = fm2.family_id WHERE fm1.user_id=$1 AND fm1.is_admin=TRUE AND fm2.user_id=$2`, userID, id).Scan(&count)
		if err != nil || count == 0 {
			return c.Status(403).JSON(fiber.Map{"error": "Sem permissão"})
		}
	}
	_, err = DB.Exec(context.Background(), "DELETE FROM users WHERE id=$1", id)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao deletar usuário"})
	}
	return c.SendStatus(204)
}

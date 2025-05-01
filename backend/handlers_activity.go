package main

import (
	"fmt"
	"time"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Histórico de atividades
func handleHistory(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	period := c.Query("period", "week") // dia, semana, mês, ano
	
	fmt.Println("Buscando histórico para o usuário ID:", userID, "período:", period)
	
	// Consulta simplificada para evitar problemas com JOIN
	// Usamos COALESCE para garantir que valores nulos sejam tratados corretamente
	baseQuery := `
		SELECT 
			COALESCE(a.id, 0), 
			COALESCE(a.name, 'Atividade removida'), 
			COALESCE(a.description, ''), 
			COALESCE(a.icon, ''), 
			ua.performed_at 
		FROM 
			user_activities ua 
		LEFT JOIN 
			activities a ON ua.activity_id = a.id 
		WHERE 
			ua.user_id = $1 
	`
	
	var timeFilter string
	switch period {
	case "day":
		timeFilter = "AND ua.performed_at >= NOW() - INTERVAL '1 day'"
	case "month":
		timeFilter = "AND ua.performed_at >= NOW() - INTERVAL '1 month'"
	case "year":
		timeFilter = "AND ua.performed_at >= NOW() - INTERVAL '1 year'"
	default: // week
		timeFilter = "AND ua.performed_at >= NOW() - INTERVAL '1 week'"
	}
	
	// Consulta completa com filtro de tempo e ordenação
	query := baseQuery + timeFilter + " ORDER BY ua.performed_at DESC"
	
	// Imprimir a consulta para debug (remover em produção)
	fmt.Println("Query:", query)
	
	// Executar a consulta
	rows, err := DB.Query(c.Context(), query, userID)
	if err != nil {
		fmt.Println("Erro na consulta de histórico:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar histórico"})
	}
	defer rows.Close()
	
	// Processar os resultados
	var history []map[string]interface{}
	
	// Verificar se há resultados
	if !rows.Next() {
		fmt.Println("Nenhum resultado encontrado para o histórico")
		// Retornar um array vazio em vez de null
		return c.JSON(fiber.Map{"history": []map[string]interface{}{}})
	}
	
	// Resetar o cursor para o início
	rows, err = DB.Query(c.Context(), query, userID)
	if err != nil {
		fmt.Println("Erro ao reiniciar consulta:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar histórico"})
	}
	defer rows.Close()
	
	for rows.Next() {
		var id int
		var name, description, icon string
		var performedAt time.Time
		
		if err := rows.Scan(&id, &name, &description, &icon, &performedAt); err != nil {
			fmt.Println("Erro ao ler linha do histórico:", err)
			continue // Pular esta linha e continuar com a próxima
		}
		
		history = append(history, fiber.Map{
			"id": id,
			"name": name,
			"description": description,
			"icon": icon,
			"performed_at": performedAt,
		})
	}
	
	// Verificar se há resultados após filtrar linhas com erro
	if len(history) == 0 {
		fmt.Println("Nenhum resultado válido encontrado após processamento")
		// Retornar um array vazio em vez de null
		return c.JSON(fiber.Map{"history": []map[string]interface{}{}})
	}
	
	fmt.Println("Histórico encontrado com", len(history), "registros")
	return c.JSON(fiber.Map{"history": history})
}

// Estatísticas e ranking
func handleStats(c *fiber.Ctx) error {
	familyID := c.Query("family_id")
	if familyID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "family_id obrigatório"})
	}
	rows, err := DB.Query(c.Context(), `SELECT u.name, COUNT(*) as total FROM user_activities ua JOIN users u ON ua.user_id = u.id WHERE ua.family_id = $1 GROUP BY u.name ORDER BY total DESC`, familyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Erro ao buscar estatísticas"})
	}
	defer rows.Close()
	var stats []map[string]interface{}
	for rows.Next() {
		var name string
		var total int
		if err := rows.Scan(&name, &total); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Erro ao ler estatísticas"})
		}
		stats = append(stats, fiber.Map{"name": name, "total": total})
	}
	return c.JSON(fiber.Map{"stats": stats})
}

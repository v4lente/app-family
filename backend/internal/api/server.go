package api

import (
	"encoding/json"
	"net/http"
	"sort"
)

type Member struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type Task struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Category  string `json:"category"`
	OwnerID   string `json:"ownerId"`
	Frequency string `json:"frequency"`
	Completed bool   `json:"completed"`
}

type Server struct {
	members []Member
	tasks   []Task
}

type UserStat struct {
	MemberID       string `json:"memberId"`
	Name           string `json:"name"`
	Role           string `json:"role"`
	TotalTasks     int    `json:"totalTasks"`
	CompletedTasks int    `json:"completedTasks"`
	CompletionRate int    `json:"completionRate"`
}

type CategoryStat struct {
	Category       string `json:"category"`
	TotalTasks     int    `json:"totalTasks"`
	CompletedTasks int    `json:"completedTasks"`
	CompletionRate int    `json:"completionRate"`
}

type Summary struct {
	TotalTasks     int `json:"totalTasks"`
	CompletedTasks int `json:"completedTasks"`
	CompletionRate int `json:"completionRate"`
}

type StatsResponse struct {
	Summary    Summary        `json:"summary"`
	ByUser     []UserStat     `json:"byUser"`
	ByCategory []CategoryStat `json:"byCategory"`
}

func NewServer() *Server {
	return &Server{
		members: []Member{
			{ID: "m1", Name: "Ana", Role: "Responsável"},
			{ID: "m2", Name: "Pedro", Role: "Responsável"},
			{ID: "m3", Name: "Lia", Role: "Filho(a)"},
		},
		tasks: []Task{
			{ID: "t1", Title: "Organizar brinquedos", Category: "Organização", OwnerID: "m3", Frequency: "Diária", Completed: true},
			{ID: "t2", Title: "Preparar o jantar", Category: "Cozinha", OwnerID: "m2", Frequency: "Diária", Completed: false},
			{ID: "t3", Title: "Limpar banheiro", Category: "Limpeza", OwnerID: "m1", Frequency: "Semanal", Completed: false},
			{ID: "t4", Title: "Arrumar camas", Category: "Organização", OwnerID: "m3", Frequency: "Diária", Completed: true},
		},
	}
}

func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", s.handleHealth)
	mux.HandleFunc("/api/members", s.handleMembers)
	mux.HandleFunc("/api/tasks", s.handleTasks)
	mux.HandleFunc("/api/stats", s.handleStats)
	mux.HandleFunc("/api/stats/ranking", s.handleRanking)
	return withCORS(mux)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleMembers(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.members)
}

func (s *Server) handleTasks(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.tasks)
}

func (s *Server) buildStats() StatsResponse {
	totalTasks := len(s.tasks)
	completed := 0
	byCategoryMap := map[string]*CategoryStat{}
	byUser := make([]UserStat, 0, len(s.members))

	for _, member := range s.members {
		userTasks := 0
		userCompleted := 0
		for _, task := range s.tasks {
			if task.OwnerID != member.ID {
				continue
			}
			userTasks++
			if task.Completed {
				userCompleted++
			}
		}
		rate := 0
		if userTasks > 0 {
			rate = userCompleted * 100 / userTasks
		}
		byUser = append(byUser, UserStat{
			MemberID:       member.ID,
			Name:           member.Name,
			Role:           member.Role,
			TotalTasks:     userTasks,
			CompletedTasks: userCompleted,
			CompletionRate: rate,
		})
	}

	for _, task := range s.tasks {
		if task.Completed {
			completed++
		}
		if _, ok := byCategoryMap[task.Category]; !ok {
			byCategoryMap[task.Category] = &CategoryStat{Category: task.Category}
		}
		entry := byCategoryMap[task.Category]
		entry.TotalTasks++
		if task.Completed {
			entry.CompletedTasks++
		}
	}

	byCategory := make([]CategoryStat, 0, len(byCategoryMap))
	for _, stat := range byCategoryMap {
		if stat.TotalTasks > 0 {
			stat.CompletionRate = stat.CompletedTasks * 100 / stat.TotalTasks
		}
		byCategory = append(byCategory, *stat)
	}
	sort.Slice(byCategory, func(i, j int) bool {
		return byCategory[i].Category < byCategory[j].Category
	})

	overallRate := 0
	if totalTasks > 0 {
		overallRate = completed * 100 / totalTasks
	}
	return StatsResponse{
		Summary:    Summary{TotalTasks: totalTasks, CompletedTasks: completed, CompletionRate: overallRate},
		ByUser:     byUser,
		ByCategory: byCategory,
	}
}

func (s *Server) handleStats(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.buildStats())
}

func (s *Server) handleRanking(w http.ResponseWriter, _ *http.Request) {
	stats := s.buildStats()
	ranking := make([]UserStat, len(stats.ByUser))
	copy(ranking, stats.ByUser)
	sort.Slice(ranking, func(i, j int) bool {
		if ranking[i].CompletedTasks == ranking[j].CompletedTasks {
			return ranking[i].CompletionRate > ranking[j].CompletionRate
		}
		return ranking[i].CompletedTasks > ranking[j].CompletedTasks
	})
	writeJSON(w, http.StatusOK, ranking)
}

package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"daily-habit-tracker/config"
	"daily-habit-tracker/handlers"
	"daily-habit-tracker/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Memuat file konfigurasi .env jika tersedia
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] File .env tidak ditemukan, membaca environment bawaan sistem.")
	}

	port := os.Getenv("APP_PORT")
	if strings.TrimSpace(port) == "" {
		port = "8080"
	}

	// Inisialisasi koneksi database
	_, err := config.InitDatabase()
	if err != nil {
		log.Fatalf("[FATAL] %v", err)
	}

	router := gin.Default()

	// Melayani file statis CSS dan JS
	router.Static("/css", "./web/css")
	router.Static("/js", "./web/js")

	// Rute Halaman HTML
	router.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/login")
	})
	router.GET("/login", func(c *gin.Context) {
		c.File("./web/pages/login.html")
	})
	router.GET("/habits", func(c *gin.Context) {
		c.File("./web/pages/habits.html")
	})
	router.GET("/tracker", func(c *gin.Context) {
		c.File("./web/pages/tracker.html")
	})

	// Group REST API
	api := router.Group("/api")
	{
		// Endpoint Publik (Autentikasi)
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Endpoint Terproteksi (Memerlukan JWT Token)
		protected := api.Group("")
		protected.Use(middleware.AuthRequired())
		{
			// Profil User
			protected.GET("/auth/me", handlers.GetCurrentUser)

			// Manajemen Kebiasaan (Halaman 2)
			protected.GET("/habits", handlers.GetHabits)
			protected.POST("/habits", handlers.CreateHabit)
			protected.GET("/habits/:id", handlers.GetHabitByID)
			protected.PUT("/habits/:id", handlers.UpdateHabit)
			protected.DELETE("/habits/:id", handlers.DeleteHabit)

			// Pencatatan Capaian Harian & Grafik (Halaman 3)
			protected.POST("/logs", handlers.SaveOrUpdateLog)
			protected.GET("/logs", handlers.GetLogsByDate)
			protected.GET("/logs/chart/:habit_id", handlers.GetHabitChartData)
			protected.GET("/logs/chart-combined", handlers.GetCombinedChartData)
		}
	}

	address := fmt.Sprintf(":%s", port)
	log.Printf("[INFO] Server Daily Habit Tracker berjalan di http://localhost%s\n", address)
	if err := router.Run(address); err != nil {
		log.Fatalf("[FATAL] Gagal menjalankan server: %v", err)
	}
}

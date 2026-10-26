package config

import (
	"errors"
	"log"
	"os"
	"strings"

	"daily-habit-tracker/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase menginisialisasi koneksi database berdasarkan DATABASE_URL di environment
func InitDatabase() (*gorm.DB, error) {
	dbURL := os.Getenv("DATABASE_URL")
	if strings.TrimSpace(dbURL) == "" {
		return nil, errors.New("variabel lingkungan DATABASE_URL belum diatur. Silakan periksa file .env")
	}

	var dialector gorm.Dialector

	// Deteksi tipe database: PostgreSQL atau SQLite
	if strings.HasPrefix(dbURL, "postgres://") || strings.HasPrefix(dbURL, "postgresql://") {
		dialector = postgres.Open(dbURL)
		log.Println("[INFO] Menggunakan driver PostgreSQL...")
	} else if strings.HasPrefix(dbURL, "sqlite://") || strings.HasSuffix(dbURL, ".db") {
		filePath := strings.TrimPrefix(dbURL, "sqlite://")
		dialector = sqlite.Open(filePath)
		log.Println("[INFO] Menggunakan driver SQLite (file lokal)...")
	} else {
		// Default mencoba postgres jika format koneksi standar DSN
		dialector = postgres.Open(dbURL)
		log.Println("[INFO] Menggunakan driver PostgreSQL (default)...")
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		// Jangan membocorkan string URL/password pada pesan log
		return nil, errors.New("gagal terhubung ke database. Pastikan server database berjalan dan konfigurasi .env benar")
	}

	// Migrasi otomatis tabel
	err = db.AutoMigrate(
		&models.User{},
		&models.Habit{},
		&models.HabitLog{},
	)
	if err != nil {
		return nil, errors.New("gagal melakukan migrasi tabel database")
	}

	DB = db
	log.Println("[INFO] Koneksi dan migrasi database berhasil!")
	return DB, nil
}


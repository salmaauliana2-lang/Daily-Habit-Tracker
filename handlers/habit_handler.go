package handlers

import (
	"net/http"
	"strings"

	"daily-habit-tracker/config"
	"daily-habit-tracker/models"

	"github.com/gin-gonic/gin"
)

type HabitInput struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Type        string  `json:"type"` // "numeric" atau "boolean"
	TargetValue float64 `json:"target_value"`
	Unit        string  `json:"unit"`
}

// GetHabits mengambil semua jenis kebiasaan milik pengguna yang login
func GetHabits(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var habits []models.Habit
	if err := config.DB.Where("user_id = ?", userID).Order("id asc").Find(&habits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar kebiasaan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"habits": habits})
}

// GetHabitByID mengambil detail kebiasaan spesifik berdasarkan ID
func GetHabitByID(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	habitID := c.Param("id")

	var habit models.Habit
	if err := config.DB.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kebiasaan tidak ditemukan atau bukan milik Anda"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"habit": habit})
}

// CreateHabit membuat jenis kebiasaan baru
func CreateHabit(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var input HabitInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama kebiasaan wajib diisi"})
		return
	}

	habitType := strings.ToLower(strings.TrimSpace(input.Type))
	if habitType != "boolean" {
		habitType = "numeric"
	}

	var targetValue float64
	var unit string

	if habitType == "boolean" {
		targetValue = 1
		unit = "Ya/Tidak"
	} else {
		if input.TargetValue <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Target capaian harus lebih dari 0 untuk tipe angka"})
			return
		}
		if strings.TrimSpace(input.Unit) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Satuan parameter wajib diisi untuk tipe angka"})
			return
		}
		targetValue = input.TargetValue
		unit = strings.TrimSpace(input.Unit)
	}

	habit := models.Habit{
		UserID:      userID,
		Name:        strings.TrimSpace(input.Name),
		Description: strings.TrimSpace(input.Description),
		Type:        habitType,
		TargetValue: targetValue,
		Unit:        unit,
	}

	if err := config.DB.Create(&habit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menambahkan kebiasaan baru"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kebiasaan berhasil ditambahkan",
		"habit":   habit,
	})
}

// UpdateHabit mengubah data kebiasaan (nama, target, deskripsi, satuan, tipe)
func UpdateHabit(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	habitID := c.Param("id")

	var habit models.Habit
	if err := config.DB.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kebiasaan tidak ditemukan atau Anda tidak berhak mengubahnya"})
		return
	}

	var input HabitInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama kebiasaan wajib diisi"})
		return
	}

	habitType := strings.ToLower(strings.TrimSpace(input.Type))
	if habitType != "boolean" {
		habitType = "numeric"
	}

	var targetValue float64
	var unit string

	if habitType == "boolean" {
		targetValue = 1
		unit = "Ya/Tidak"
	} else {
		if input.TargetValue <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Target capaian harus lebih dari 0 untuk tipe angka"})
			return
		}
		if strings.TrimSpace(input.Unit) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Satuan parameter wajib diisi untuk tipe angka"})
			return
		}
		targetValue = input.TargetValue
		unit = strings.TrimSpace(input.Unit)
	}

	habit.Name = strings.TrimSpace(input.Name)
	habit.Description = strings.TrimSpace(input.Description)
	habit.Type = habitType
	habit.TargetValue = targetValue
	habit.Unit = unit

	if err := config.DB.Save(&habit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kebiasaan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kebiasaan berhasil diperbarui",
		"habit":   habit,
	})
}

// DeleteHabit menghapus kebiasaan beserta riwayat log terkait
func DeleteHabit(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	habitID := c.Param("id")

	var habit models.Habit
	if err := config.DB.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kebiasaan tidak ditemukan atau Anda tidak berhak menghapusnya"})
		return
	}

	// Hapus log terkait terlebih dahulu
	config.DB.Where("habit_id = ?", habit.ID).Delete(&models.HabitLog{})

	if err := config.DB.Delete(&habit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kebiasaan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kebiasaan dan riwayat capaian berhasil dihapus"})
}

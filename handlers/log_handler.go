package handlers

import (
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"daily-habit-tracker/config"
	"daily-habit-tracker/models"

	"github.com/gin-gonic/gin"
)

type LogInput struct {
	HabitID     uint    `json:"habit_id" binding:"required"`
	Date        string  `json:"date" binding:"required"` // YYYY-MM-DD
	ActualValue float64 `json:"actual_value" binding:"gte=0"`
	Notes       string  `json:"notes"`
}

// SaveOrUpdateLog menyimpan atau memperbarui capaian harian suatu kebiasaan
func SaveOrUpdateLog(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	var input LogInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Habit ID, tanggal, dan nilai capaian (>= 0) wajib diisi"})
		return
	}

	input.Date = strings.TrimSpace(input.Date)
	if _, err := time.Parse("2006-01-02", input.Date); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal harus YYYY-MM-DD"})
		return
	}

	// Pastikan kebiasaan tersebut memang milik pengguna yang sedang login
	var habit models.Habit
	if err := config.DB.Where("id = ? AND user_id = ?", input.HabitID, userID).First(&habit).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Kebiasaan tidak ditemukan atau bukan milik Anda"})
		return
	}

	// Jika tipe boolean, batasi nilainya hanya 0 (Tidak) atau 1 (Ya)
	actualVal := input.ActualValue
	if habit.Type == "boolean" {
		if actualVal > 0 {
			actualVal = 1
		} else {
			actualVal = 0
		}
	}

	// Cek apakah log untuk habit_id, user_id, dan date sudah ada
	var logEntry models.HabitLog
	err := config.DB.Where("user_id = ? AND habit_id = ? AND date = ?", userID, input.HabitID, input.Date).First(&logEntry).Error

	if err == nil {
		// Update data yang sudah ada
		logEntry.ActualValue = actualVal
		logEntry.Notes = strings.TrimSpace(input.Notes)
		if err := config.DB.Save(&logEntry).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui catatan capaian"})
			return
		}
	} else {
		// Buat baru
		logEntry = models.HabitLog{
			UserID:      userID,
			HabitID:     input.HabitID,
			Date:        input.Date,
			ActualValue: actualVal,
			Notes:       strings.TrimSpace(input.Notes),
		}
		if err := config.DB.Create(&logEntry).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan catatan capaian"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Capaian harian berhasil disimpan",
		"log":     logEntry,
	})
}

// GetLogsByDate mengambil seluruh capaian kebiasaan pada tanggal tertentu
func GetLogsByDate(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	dateStr := c.Query("date")

	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}

	var logs []models.HabitLog
	if err := config.DB.Where("user_id = ? AND date = ?", userID, dateStr).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data catatan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"date": dateStr,
		"logs": logs,
	})
}

// SingleHabitDayPoint merepresentasikan titik data harian untuk single habit chart
type SingleHabitDayPoint struct {
	Date            string  `json:"date"`
	ActualValue     float64 `json:"actual_value"`
	Notes           string  `json:"notes"`
	CumulativeCount int     `json:"cumulative_count"`
	Percentage      float64 `json:"percentage"`
}

// GetHabitChartData mengambil riwayat capaian sebuah habit spesifik untuk visualisasi grafik
func GetHabitChartData(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	habitID := c.Param("habit_id")

	// Pastikan habit milik user
	var habit models.Habit
	if err := config.DB.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kebiasaan tidak ditemukan atau bukan milik Anda"})
		return
	}

	// Parsing rentang hari (default 30 hari / 1 bulan)
	daysCount := 30
	if daysParam := c.Query("days"); daysParam != "" {
		if parsed, err := strconv.Atoi(daysParam); err == nil && parsed > 0 && parsed <= 90 {
			daysCount = parsed
		}
	}

	// Buat urutan tanggal dari (today - daysCount + 1) hingga today
	dates := make([]string, daysCount)
	now := time.Now()
	for i := 0; i < daysCount; i++ {
		d := now.AddDate(0, 0, -(daysCount - 1 - i))
		dates[i] = d.Format("2006-01-02")
	}

	startDate := dates[0]
	endDate := dates[len(dates)-1]

	var logs []models.HabitLog
	config.DB.Where("user_id = ? AND habit_id = ? AND date >= ? AND date <= ?", userID, habit.ID, startDate, endDate).
		Order("date asc").
		Find(&logs)

	logMap := make(map[string]models.HabitLog)
	for _, l := range logs {
		logMap[l.Date] = l
	}

	history := make([]SingleHabitDayPoint, daysCount)
	cumulativeYa := 0

	for i, d := range dates {
		var actual float64 = 0
		notes := ""
		if l, exists := logMap[d]; exists {
			actual = l.ActualValue
			notes = l.Notes
		}

		pct := 0.0
		if habit.Type == "boolean" {
			if actual >= 1 {
				cumulativeYa++
			}
			// Kenaikan sebesar (1 / jumlah hari) * 100%, mencapai 100% jika Ya selama 1 bulan penuh
			pct = math.Round((float64(cumulativeYa)/float64(daysCount))*1000.0) / 10.0
		} else {
			if habit.TargetValue > 0 {
				pct = math.Min(100.0, math.Round((actual/habit.TargetValue)*1000.0)/10.0)
			}
		}

		history[i] = SingleHabitDayPoint{
			Date:            d,
			ActualValue:     actual,
			Notes:           notes,
			CumulativeCount: cumulativeYa,
			Percentage:      pct,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"habit": gin.H{
			"id":           habit.ID,
			"name":         habit.Name,
			"type":         habit.Type,
			"target_value": habit.TargetValue,
			"unit":         habit.Unit,
		},
		"total_days":      daysCount,
		"step_percentage": math.Round((1.0/float64(daysCount))*1000.0) / 10.0,
		"history":         history,
	})
}

type HabitCombinedSeries struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	Unit        string    `json:"unit"`
	TargetValue float64   `json:"target_value"`
	Percentages []float64 `json:"percentages"` // Persentase capaian per hari (0 - 100%)
	Actuals     []float64 `json:"actuals"`     // Nilai riil per hari
	Cumulatives []int     `json:"cumulatives"` // Akumulasi hari Ya (khusus boolean)
}

// GetCombinedChartData mengembalikan data gabungan seluruh kebiasaan dalam rentang hari (default 30 hari / 1 bulan)
func GetCombinedChartData(c *gin.Context) {
	userID := c.MustGet("userID").(uint)

	// Ambil semua kebiasaan milik user
	var habits []models.Habit
	if err := config.DB.Where("user_id = ?", userID).Order("id asc").Find(&habits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat kebiasaan"})
		return
	}

	// Default rentang 30 hari (1 bulan), dapat disesuaikan lewat query ?days=30
	daysCount := 30
	if daysParam := c.Query("days"); daysParam != "" {
		if parsed, err := strconv.Atoi(daysParam); err == nil && parsed > 0 && parsed <= 90 {
			daysCount = parsed
		}
	}

	dates := make([]string, daysCount)
	now := time.Now()
	for i := 0; i < daysCount; i++ {
		d := now.AddDate(0, 0, -(daysCount - 1 - i))
		dates[i] = d.Format("2006-01-02")
	}

	startDate := dates[0]
	endDate := dates[len(dates)-1]

	// Ambil log untuk semua habit user dalam rentang tanggal tersebut
	var logs []models.HabitLog
	config.DB.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).Find(&logs)

	// Buat lookup map: [habitID][date] -> HabitLog
	logMap := make(map[uint]map[string]models.HabitLog)
	for _, l := range logs {
		if logMap[l.HabitID] == nil {
			logMap[l.HabitID] = make(map[string]models.HabitLog)
		}
		logMap[l.HabitID][l.Date] = l
	}

	// Bentuk series untuk masing-masing habit
	seriesList := make([]HabitCombinedSeries, 0, len(habits))
	for _, h := range habits {
		percentages := make([]float64, daysCount)
		actuals := make([]float64, daysCount)
		cumulatives := make([]int, daysCount)
		cumCount := 0

		for i, date := range dates {
			var actual float64 = 0
			if entry, exists := logMap[h.ID][date]; exists {
				actual = entry.ActualValue
			}
			actuals[i] = actual

			var pct float64 = 0
			if h.Type == "boolean" {
				if actual >= 1 {
					cumCount++
				}
				cumulatives[i] = cumCount
				// Kenaikan kumulatif sebesar 1/jumlah_hari * 100%
				pct = math.Round((float64(cumCount)/float64(daysCount))*1000.0) / 10.0
			} else {
				if h.TargetValue > 0 {
					pct = math.Min(100.0, math.Round((actual/h.TargetValue)*1000.0)/10.0)
				}
			}
			percentages[i] = pct
		}

		seriesList = append(seriesList, HabitCombinedSeries{
			ID:          h.ID,
			Name:        h.Name,
			Type:        h.Type,
			Unit:        h.Unit,
			TargetValue: h.TargetValue,
			Percentages: percentages,
			Actuals:     actuals,
			Cumulatives: cumulatives,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"dates":      dates,
		"days_count": daysCount,
		"habits":     seriesList,
	})
}

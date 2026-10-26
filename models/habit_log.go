package models

import (
	"time"
)

type HabitLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	HabitID     uint      `gorm:"not null;index" json:"habit_id"`
	Date        string    `gorm:"size:10;not null;index" json:"date"` // YYYY-MM-DD
	ActualValue float64   `gorm:"not null;default:0" json:"actual_value"`
	Notes       string    `gorm:"size:255" json:"notes"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}


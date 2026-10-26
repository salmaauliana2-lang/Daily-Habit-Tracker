package models

import (
	"time"
)

type Habit struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `gorm:"not null;index" json:"user_id"`
	Name        string     `gorm:"size:100;not null" json:"name"`
	Description string     `gorm:"size:255" json:"description"`
	Type        string     `gorm:"size:20;not null;default:'numeric'" json:"type"` // "numeric" atau "boolean"
	TargetValue float64    `gorm:"not null;default:1" json:"target_value"`        // numeric: e.g. 8, boolean: 1
	Unit        string     `gorm:"size:50;not null;default:'kali'" json:"unit"`   // e.g. "gelas", "menit", atau "Ya/Tidak"
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Logs        []HabitLog `gorm:"foreignKey:HabitID;constraint:OnDelete:CASCADE" json:"logs,omitempty"`
}

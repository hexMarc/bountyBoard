package models

import (
	"time"
)

type Reputation struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"userId" gorm:"uniqueIndex"`
	Score     int       `json:"score"`
	Level     int       `json:"level"`
	Badges    []Badge   `json:"badges" gorm:"foreignKey:UserID;references:UserID"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Badge struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"userId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	TokenURI    string    `json:"tokenUri"`
	TxHash      string    `json:"txHash"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CalculateLevel calculates the user's level based on their score
func (r *Reputation) CalculateLevel() {
	// Simple level calculation: level = score / 100
	r.Level = r.Score / 100
	if r.Level < 1 {
		r.Level = 1
	}
}

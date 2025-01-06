package models

import (
	"time"
)

type User struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Username    string    `json:"username" gorm:"uniqueIndex"`
	Address     string    `json:"address" gorm:"uniqueIndex"`
	Bio         string    `json:"bio"`
	Avatar      string    `json:"avatar"`
	Reputation  Reputation `json:"reputation" gorm:"foreignKey:UserID;references:ID"`
	CreatedBounties []Bounty `json:"created_bounties" gorm:"foreignKey:CreatorID"`
	HuntedBounties  []Bounty `json:"hunted_bounties" gorm:"foreignKey:HunterID"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

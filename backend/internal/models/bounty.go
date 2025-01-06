package models

import (
	"time"
	"github.com/shopspring/decimal"
)

type Bounty struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Reward      decimal.Decimal `json:"reward" gorm:"type:decimal(32,18)"` // 18 decimals for ETH compatibility
	CreatorID   string         `json:"creator_id"`
	HunterID    *string        `json:"hunter_id,omitempty"`
	Status      string         `json:"status"`
	Deadline    time.Time      `json:"deadline"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	TxHash      string         `json:"tx_hash"`
	IPFSHash    string         `json:"ipfs_hash"`
}

type BountySubmission struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	BountyID  uint      `json:"bounty_id"`
	HunterID  string    `json:"hunter_id"`
	Content   string    `json:"content"`
	IPFSHash  string    `json:"ipfs_hash"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

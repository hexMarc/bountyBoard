package services

import (
	"errors"

	"github.com/bountyBoard/internal/database"
	"github.com/bountyBoard/internal/models"
	"gorm.io/gorm"
)

type ReputationService struct {
	db *gorm.DB
}

func NewReputationService() *ReputationService {
	return &ReputationService{
		db: database.DB,
	}
}

func (s *ReputationService) GetUserReputation(userID string) (*models.Reputation, error) {
	var reputation models.Reputation
	result := s.db.Preload("Badges").Where("user_id = ?", userID).First(&reputation)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			// Create new reputation record if not found
			reputation = models.Reputation{
				UserID: userID,
				Score:  0,
				Level:  1,
			}
			if err := s.db.Create(&reputation).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, result.Error
		}
	}
	return &reputation, nil
}

func (s *ReputationService) UpdateScore(userID string, points int) (*models.Reputation, error) {
	reputation, err := s.GetUserReputation(userID)
	if err != nil {
		return nil, err
	}

	reputation.Score += points
	reputation.CalculateLevel()

	if err := s.db.Save(reputation).Error; err != nil {
		return nil, err
	}

	return reputation, nil
}

func (s *ReputationService) AwardBadge(userID string, name, description, tokenURI, txHash string) error {
	badge := models.Badge{
		UserID:      userID,
		Name:        name,
		Description: description,
		TokenURI:    tokenURI,
		TxHash:      txHash,
	}

	return s.db.Create(&badge).Error
}

// Milestone thresholds for badge awards
var milestones = map[string]int{
	"Novice Hunter":    100,
	"Skilled Hunter":   500,
	"Expert Hunter":    1000,
	"Legendary Hunter": 5000,
}

func (s *ReputationService) CheckAndAwardMilestoneBadges(userID string, reputation *models.Reputation) error {
	for badgeName, threshold := range milestones {
		if reputation.Score >= threshold {
			// Check if badge already exists
			var badge models.Badge
			result := s.db.Where("user_id = ? AND name = ?", userID, badgeName).First(&badge)
			if result.Error != nil {
				if errors.Is(result.Error, gorm.ErrRecordNotFound) {
					// Award new badge
					err := s.AwardBadge(userID, badgeName,
						"Awarded for reaching "+string(threshold)+" reputation points",
						"ipfs://...", // TODO: Generate badge metadata and upload to IPFS
						"",           // TODO: Mint NFT badge and get transaction hash
					)
					if err != nil {
						return err
					}
				} else {
					return result.Error
				}
			}
		}
	}
	return nil
}

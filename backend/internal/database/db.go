package database

import (
	"log"
	"os"

	"github.com/bountyBoard/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	// Auto migrate the schema
	err = DB.AutoMigrate(
		&models.User{},
		&models.Bounty{},
		&models.BountySubmission{},
		&models.Reputation{},
		&models.Badge{},
		&models.BountyComment{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}
}

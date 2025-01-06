package middleware

import (
	"net/http"
	"strings"

	"github.com/bountyBoard/internal/database"
	"github.com/bountyBoard/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func WalletAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Bearer token format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		walletAddress := strings.ToLower(parts[1])
		if !strings.HasPrefix(walletAddress, "0x") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid wallet address format"})
			c.Abort()
			return
		}

		// Try to find existing user
		var user models.User
		result := database.DB.First(&user, "address = ?", walletAddress)
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				// User doesn't exist, create new user with reputation
				tx := database.DB.Begin()
				if tx.Error != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
					c.Abort()
					return
				}

				// Create user
				user = models.User{
					ID:      walletAddress, // Using wallet address as ID
					Address: walletAddress,
					// Username is optional now
				}

				if err := tx.Create(&user).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user: " + err.Error()})
					c.Abort()
					return
				}

				// Create initial reputation
				reputation := models.Reputation{
					UserID: user.ID,
					Score:  0,
					Level:  1,
				}

				if err := tx.Create(&reputation).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reputation"})
					c.Abort()
					return
				}

				if err := tx.Commit().Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
					c.Abort()
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
				c.Abort()
				return
			}
		}

		c.Set("user_id", user.ID)
		c.Next()
	}
}

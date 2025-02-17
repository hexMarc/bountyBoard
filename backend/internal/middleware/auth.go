package middleware

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/bountyBoard/internal/database"
	"github.com/bountyBoard/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func LensAuth() gin.HandlerFunc {
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

		profileData := parts[1]

		// Decode the base64 profile data
		profileBytes, err := base64.StdEncoding.DecodeString(profileData)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid profile data format"})
			c.Abort()
			return
		}

		// Parse the profile data
		var profile map[string]interface{}
		if err := json.Unmarshal(profileBytes, &profile); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid profile data"})
			c.Abort()
			return
		}

		// Extract profile ID
		profileID, ok := profile["id"].(string)
		if !ok || profileID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid profile ID"})
			c.Abort()
			return
		}

		// Try to find existing user
		var user models.User
		result := database.DB.First(&user, "id = ?", profileID)
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
					ID:      profileID,
					Address: profile["ownedBy"].(string),
				}

				if err := tx.Create(&user).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
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

		c.Set("user_id", profileID)
		c.Next()
	}
}

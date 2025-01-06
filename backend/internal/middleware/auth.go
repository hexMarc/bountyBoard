package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
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

		// token := parts[1]

		// TODO: Verify token with Lens Protocol
		// This is a placeholder for actual Lens Protocol verification
		// In production, we would:
		// 1. Verify the token signature
		// 2. Extract the Lens Profile ID
		// 3. Check if the token is not expired

		// For now, we'll just set a mock user ID
		c.Set("user_id", "lens_profile_id")
		c.Next()
	}
}

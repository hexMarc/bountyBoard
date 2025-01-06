package v1

import (
	"net/http"

	"github.com/bountyBoard/internal/services"
	"github.com/gin-gonic/gin"
)

func RegisterReputationRoutes(router *gin.Engine) {
	v1 := router.Group("/api/v1")
	{
		v1.GET("/reputation/:userId", getReputation)
		v1.POST("/reputation/update", updateReputation)
	}
}

func getReputation(c *gin.Context) {
	userID := c.Param("userId")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	reputationService := services.NewReputationService()
	reputation, err := reputationService.GetUserReputation(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reputation)
}

type UpdateReputationRequest struct {
	UserID string `json:"userId" binding:"required"`
	Points int    `json:"points" binding:"required"`
}

func updateReputation(c *gin.Context) {
	var req UpdateReputationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reputationService := services.NewReputationService()
	reputation, err := reputationService.UpdateScore(req.UserID, req.Points)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check and award milestone badges
	if err := reputationService.CheckAndAwardMilestoneBadges(req.UserID, reputation); err != nil {
		// Log error but don't fail the request
		// TODO: Add proper error logging
		c.JSON(http.StatusOK, gin.H{
			"reputation": reputation,
			"warning": "Failed to check milestone badges",
		})
		return
	}

	c.JSON(http.StatusOK, reputation)
}

package v1

import (
	"net/http"
	"strconv"
	"time"

	"github.com/bountyBoard/internal/database"
	"github.com/bountyBoard/internal/models"
	"github.com/bountyBoard/internal/services"
	"github.com/gin-gonic/gin"
)

type CreateBountyRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description" binding:"required"`
	Reward      string    `json:"reward" binding:"required"`
	Deadline    time.Time `json:"deadline" binding:"required"`
}

type SubmitWorkRequest struct {
	Content string `json:"content" binding:"required"`
}

func RegisterBountyRoutes(router *gin.Engine) {
	v1 := router.Group("/api/v1")
	{
		v1.POST("/bounties", createBounty)
		v1.GET("/bounties", listBounties)
		v1.GET("/bounties/:id", getBounty)
		v1.POST("/bounties/:id/claim", claimBounty)
		v1.POST("/bounties/:id/submit", submitBounty)
		v1.POST("/bounties/:id/complete", completeBounty)
	}
}

func createBounty(c *gin.Context) {
	var req CreateBountyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create IPFS metadata
	ipfs := services.NewIPFSService()
	metadata := map[string]interface{}{
		"title":       req.Title,
		"description": req.Description,
		"deadline":    req.Deadline,
	}
	ipfsHash, err := ipfs.UploadJSON(metadata)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload to IPFS"})
		return
	}

	// Create bounty in database
	bounty := &models.Bounty{
		Title:       req.Title,
		Description: req.Description,
		Reward:      req.Reward,
		CreatorID:   c.GetString("user_id"), // Set from auth middleware
		Status:      "open",
		Deadline:    req.Deadline,
		IPFSHash:    ipfsHash,
	}

	if err := database.DB.Create(bounty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bounty"})
		return
	}

	c.JSON(http.StatusCreated, bounty)
}

func listBounties(c *gin.Context) {
	var bounties []models.Bounty
	query := database.DB

	// Filter by creator if specified
	if creator := c.Query("creator"); creator != "" {
		query = query.Where("creator_id = ?", creator)
	}

	// Filter by hunter if specified
	if hunter := c.Query("hunter"); hunter != "" {
		query = query.Where("hunter_id = ?", hunter)
	}

	// Filter by status if specified
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&bounties).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bounties"})
		return
	}

	c.JSON(http.StatusOK, bounties)
}

func getBounty(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bounty ID"})
		return
	}

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	// Get IPFS metadata
	ipfs := services.NewIPFSService()
	metadata, err := ipfs.GetFile(bounty.IPFSHash)
	if err == nil {
		bounty.Description = string(metadata) // Enhance with IPFS metadata
	}

	c.JSON(http.StatusOK, bounty)
}

func claimBounty(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bounty ID"})
		return
	}

	hunterID := c.GetString("user_id") // Set from auth middleware

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	if bounty.Status != "open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bounty is not available for claiming"})
		return
	}

	// Update bounty status and hunter
	bounty.Status = "claimed"
	bounty.HunterID = &hunterID

	if err := database.DB.Save(&bounty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to claim bounty"})
		return
	}

	c.JSON(http.StatusOK, bounty)
}

func submitBounty(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bounty ID"})
		return
	}

	var req SubmitWorkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hunterID := c.GetString("user_id")

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	if bounty.Status != "claimed" || *bounty.HunterID != hunterID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot submit work for this bounty"})
		return
	}

	// Upload submission to IPFS
	ipfs := services.NewIPFSService()
	ipfsHash, err := ipfs.UploadJSON(map[string]interface{}{
		"content": req.Content,
		"hunter":  hunterID,
		"time":    time.Now(),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload submission"})
		return
	}

	submission := &models.BountySubmission{
		BountyID: uint(id),
		HunterID: hunterID,
		Content:  req.Content,
		IPFSHash: ipfsHash,
		Status:   "pending",
	}

	if err := database.DB.Create(submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save submission"})
		return
	}

	c.JSON(http.StatusCreated, submission)
}

func completeBounty(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid bounty ID"})
		return
	}

	creatorID := c.GetString("user_id")

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	if bounty.CreatorID != creatorID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the creator can complete the bounty"})
		return
	}

	if bounty.Status != "claimed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bounty must be claimed before completion"})
		return
	}

	// Update bounty status
	bounty.Status = "completed"
	if err := database.DB.Save(&bounty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete bounty"})
		return
	}

	c.JSON(http.StatusOK, bounty)
}

package v1

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/bountyBoard/internal/database"
	"github.com/bountyBoard/internal/middleware"
	"github.com/bountyBoard/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

type CreateBountyRequest struct {
	BlockchainID uint            `json:"blockchain_id" binding:"required"` // Contract bounty ID
	Title        string          `json:"title" binding:"required"`
	Description  string          `json:"description" binding:"required"`
	Reward       decimal.Decimal `json:"reward" binding:"required"`
	Deadline     time.Time       `json:"deadline" binding:"required"`
	TxHash       string          `json:"txHash" binding:"required"` // Transaction hash from contract
}

type SubmitWorkRequest struct {
	Content string `json:"content" binding:"required"`
}

func RegisterBountyRoutes(router *gin.Engine) {
	// Public routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/bounties", listBounties)
		v1.GET("/bounties/:id", getBounty)
		v1.GET("/bounties/:id/comments", getBountyComments)
	}

	// Protected routes (require auth)
	protected := router.Group("/api/v1")
	protected.Use(middleware.WalletAuth())
	{
		protected.POST("/bounties", createBounty)
		protected.GET("/bounties/:id/submissions", getBountySubmissions)  
		protected.POST("/bounties/:id/claim", claimBounty)
		protected.POST("/bounties/:id/submit", submitBounty)
		protected.POST("/bounties/:id/dispute", raiseDispute)
		protected.POST("/bounties/:id/complete", completeBounty)
		protected.POST("/bounties/:id/comments", addBountyComment)
		protected.POST("/bounties/:id/resolve", resolveDispute)
	}
}

func createBounty(c *gin.Context) {
	var req CreateBountyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create bounty in database
	bounty := &models.Bounty{
		BlockchainID: req.BlockchainID, // Use the contract's bounty ID
		Title:        req.Title,
		Description:  req.Description,
		Reward:       req.Reward,
		CreatorID:    strings.ToLower(c.GetString("user_id")), // Convert to lowercase
		Status:       "open",
		Deadline:     req.Deadline,
		TxHash:       req.TxHash, // Store the transaction hash
		IPFSHash:     "",
	}

	// Use the contract's bounty ID
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
		creator = strings.ToLower(creator) // Convert to lowercase
		log.Printf("Filtering bounties by creator: %s", creator)
		// Debug: Check if any bounties exist with this creator
		var count int64
		database.DB.Model(&models.Bounty{}).Where("creator_id = ?", creator).Count(&count)
		log.Printf("Found bounties count for creator: %d", count)
		query = query.Where("creator_id = ?", creator)
	}

	// Filter by hunter if specified
	if hunter := c.Query("hunter"); hunter != "" {
		hunter = strings.ToLower(hunter) // Convert to lowercase
		log.Printf("Filtering bounties by hunter: %s", hunter)
		query = query.Where("hunter_id = ?", hunter)
	}

	// Filter by status if specified
	if status := c.Query("status"); status != "" {
		log.Printf("Filtering bounties by status: %s", status)
		query = query.Where("status = ?", status)
	}

	// Debug: Print the final SQL query
	stmt := query.Session(&gorm.Session{DryRun: true}).Find(&models.Bounty{})
	sql := stmt.Statement.SQL.String()
	log.Printf("Final SQL query: %s", sql)

	if err := query.Find(&bounties).Error; err != nil {
		log.Printf("Failed to fetch bounties: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch bounties"})
		return
	}

	log.Printf("Found %d bounties", len(bounties))
	c.JSON(http.StatusOK, bounties)
}

func getBounty(c *gin.Context) {
	id := c.Param("id")

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	// Always ensure addresses are lowercase and have 0x prefix
	bounty.CreatorID = ensureAddressFormat(bounty.CreatorID)
	if bounty.HunterID != nil {
		hunterID := ensureAddressFormat(*bounty.HunterID)
		bounty.HunterID = &hunterID
	}

	c.JSON(http.StatusOK, bounty)
}

func ensureAddressFormat(address string) string {
	address = strings.ToLower(address)
	if !strings.HasPrefix(address, "0x") {
		address = "0x" + address
	}
	return address
}

func getBountySubmissions(c *gin.Context) {
	id := c.Param("id")

	// Check if user is authenticated
	currentUser := c.GetString("user_id")
	log.Printf("Current user from context: %s", currentUser)
	
	if currentUser == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	log.Printf("Bounty found: %+v", bounty)

	// Convert all addresses to lowercase for comparison
	currentUser = strings.ToLower(currentUser)
	creatorID := strings.ToLower(bounty.CreatorID)
	var hunterID string
	if bounty.HunterID != nil {
		hunterID = strings.ToLower(*bounty.HunterID)
	}

	log.Printf("Comparing addresses - Current User: %s, Creator: %s, Hunter: %s", 
		currentUser, creatorID, hunterID)

	// Allow both creator and hunter to see submissions
	if currentUser != creatorID && (bounty.HunterID == nil || hunterID != currentUser) {
		log.Printf("Access denied - user is neither creator nor hunter")
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the bounty creator or hunter can view submissions"})
		return
	}

	log.Printf("Access granted - fetching submissions")

	var submissions []models.BountySubmission
	if err := database.DB.Where("bounty_id = ?", id).Find(&submissions).Error; err != nil {
		log.Printf("Error fetching submissions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}

	// Convert all hunter IDs to lowercase for consistency
	for i := range submissions {
		submissions[i].HunterID = strings.ToLower(submissions[i].HunterID)
	}

	log.Printf("Found %d submissions", len(submissions))
	c.JSON(http.StatusOK, submissions)
}

func getBountyComments(c *gin.Context) {
	bountyID := c.Param("id")
	var comments []models.BountyComment
	
	if err := database.DB.Where("bounty_id = ?", bountyID).Order("created_at desc").Find(&comments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch comments"})
		return
	}

	c.JSON(http.StatusOK, comments)
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

	// Create submission without IPFS for now
	submission := &models.BountySubmission{
		BountyID: uint(id),
		HunterID: hunterID,
		Content:  req.Content,
		Status:   "pending",
	}

	if err := database.DB.Create(submission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save submission"})
		return
	}

	c.JSON(http.StatusCreated, submission)
}

func addBountyComment(c *gin.Context) {
	bountyID := c.Param("id")
	var bounty models.Bounty
	if err := database.DB.First(&bounty, bountyID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	// Only allow creator and hunter to comment
	currentUser := strings.ToLower(c.GetString("user_id"))
	if currentUser != strings.ToLower(bounty.CreatorID) &&
		(bounty.HunterID == nil || strings.ToLower(*bounty.HunterID) != currentUser) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the bounty creator or hunter can comment"})
		return
	}

	var input struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comment := models.BountyComment{
		BountyID: bounty.ID,
		UserID:   currentUser,
		Content:  input.Content,
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create comment"})
		return
	}

	c.JSON(http.StatusCreated, comment)
}

func raiseDispute(c *gin.Context) {
	id := c.Param("id")
	currentUser := strings.ToLower(c.GetString("user_id"))

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	// Only creator can raise dispute
	if currentUser != strings.ToLower(bounty.CreatorID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only bounty creator can raise dispute"})
		return
	}

	// Can only dispute claimed bounties
	if bounty.Status != "claimed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only dispute claimed bounties"})
		return
	}

	var input struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update bounty status and store dispute reason
	bounty.Status = "disputed"
	bounty.DisputeReason = &input.Reason

	if err := database.DB.Save(&bounty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bounty status"})
		return
	}

	c.JSON(http.StatusOK, bounty)
}

func completeBounty(c *gin.Context) {
	id := c.Param("id")
	currentUser := strings.ToLower(c.GetString("user_id"))

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	// Only creator can complete bounties
	if currentUser != strings.ToLower(bounty.CreatorID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the bounty creator can complete bounties"})
		return
	}

	// Can only complete claimed bounties
	if bounty.Status != "claimed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only complete claimed bounties"})
		return
	}

	// Update bounty status to completed
	bounty.Status = "completed"
	if err := database.DB.Save(&bounty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bounty status"})
		return
	}

	c.JSON(http.StatusOK, bounty)
}

func resolveDispute(c *gin.Context) {
	id := c.Param("id")
	currentUser := strings.ToLower(c.GetString("user_id"))

	var bounty models.Bounty
	if err := database.DB.First(&bounty, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bounty not found"})
		return
	}

	// Only admin can resolve disputes
	if currentUser != strings.ToLower("0x15b5BDf7a5e0305B9a4bE413383C9b1500C8FCF2") {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admin can resolve disputes"})
		return
	}

	// Can only resolve disputed bounties
	if bounty.Status != "disputed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only resolve disputed bounties"})
		return
	}

	var input struct {
		Winner string `json:"winner" binding:"required"`
		Resolution string `json:"resolution" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify winner is either creator or hunter
	winner := strings.ToLower(input.Winner)
	if winner != strings.ToLower(bounty.CreatorID) && (bounty.HunterID == nil || winner != strings.ToLower(*bounty.HunterID)) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Winner must be creator or hunter"})
		return
	}

	// Update bounty with resolution info
	now := time.Now()
	bounty.Status = "completed"
	bounty.DisputeWinner = &winner
	bounty.DisputeResolution = &input.Resolution
	bounty.ResolvedAt = &now

	if err := database.DB.Save(&bounty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bounty status"})
		return
	}

	c.JSON(http.StatusOK, bounty)
}

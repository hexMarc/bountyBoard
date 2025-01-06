package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

type IPFSService struct {
	projectId  string
	projectKey string
	endpoint   string
}

func NewIPFSService() *IPFSService {
	return &IPFSService{
		projectId:  os.Getenv("IPFS_PROJECT_ID"),
		projectKey: os.Getenv("IPFS_PROJECT_SECRET"),
		endpoint:   "https://ipfs.infura.io:5001/api/v0",
	}
}

func (s *IPFSService) UploadJSON(data interface{}) (string, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal JSON: %w", err)
	}

	return s.UploadFile(bytes.NewReader(jsonData))
}

func (s *IPFSService) UploadFile(file io.Reader) (string, error) {
	url := fmt.Sprintf("%s/add", s.endpoint)
	
	req, err := http.NewRequest("POST", url, file)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(s.projectId, s.projectKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to upload to IPFS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("IPFS upload failed with status: %d", resp.StatusCode)
	}

	var result struct {
		Hash string `json:"Hash"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode IPFS response: %w", err)
	}

	return result.Hash, nil
}

func (s *IPFSService) GetFile(hash string) ([]byte, error) {
	url := fmt.Sprintf("%s/cat?arg=%s", s.endpoint, hash)
	
	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.SetBasicAuth(s.projectId, s.projectKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get file from IPFS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("IPFS get failed with status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

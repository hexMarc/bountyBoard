-- Seed data for BountyBoard application
-- Generated on 2025-01-06

-- Insert Users
INSERT INTO users (id, username, address, bio, avatar, created_at, updated_at)
VALUES 
  ('u1', 'alice_web3', '0x1234567890123456789012345678901234567890', 'Blockchain developer and smart contract auditor', 'https://example.com/avatar1.jpg', '2025-01-06 17:26:43', '2025-01-06 17:26:43'),
  ('u2', 'bob_crypto', '0x2345678901234567890123456789012345678901', 'DeFi enthusiast and full-stack developer', 'https://example.com/avatar2.jpg', '2025-01-06 17:26:43', '2025-01-06 17:26:43'),
  ('u3', 'carol_dev', '0x3456789012345678901234567890123456789012', 'Smart contract developer and security researcher', 'https://example.com/avatar3.jpg', '2025-01-06 17:26:43', '2025-01-06 17:26:43');

-- Insert Reputations
INSERT INTO reputations (user_id, score, level, created_at, updated_at)
VALUES 
  ('u1', 350, 3, '2025-01-06 17:26:43', '2025-01-06 17:26:43'),
  ('u2', 180, 1, '2025-01-06 17:26:43', '2025-01-06 17:26:43'),
  ('u3', 520, 5, '2025-01-06 17:26:43', '2025-01-06 17:26:43');

-- Insert Badges
INSERT INTO badges (user_id, name, description, token_uri, tx_hash, created_at)
VALUES 
  ('u1', 'Smart Contract Expert', 'Completed 10 smart contract bounties', 'ipfs://badge1', '0xabc...123', '2025-01-06 17:26:43'),
  ('u1', 'Quick Solver', 'Solved bounties in record time', 'ipfs://badge2', '0xdef...456', '2025-01-06 17:26:43'),
  ('u2', 'Rising Star', 'Promising new contributor', 'ipfs://badge3', '0xghi...789', '2025-01-06 17:26:43'),
  ('u3', 'Top Hunter', 'Successfully completed 20+ bounties', 'ipfs://badge4', '0xjkl...012', '2025-01-06 17:26:43');

-- Insert Bounties
INSERT INTO bounties (
  title, description, reward, creator_id, hunter_id, status, 
  deadline, created_at, updated_at, tx_hash, ipfs_hash
)
VALUES 
  (
    'Smart Contract Audit', 
    'Perform a comprehensive security audit of our new DeFi protocol',
    '5.0', -- 5 ETH
    'u1',
    'u2',
    'completed',
    '2025-02-06 17:26:43',
    '2025-01-06 17:26:43',
    '2025-01-06 17:26:43',
    '0xtx1...789',
    'ipfs://bounty1'
  ),
  (
    'Frontend Development for DEX', 
    'Build a modern, responsive frontend for our decentralized exchange',
    '3.5', -- 3.5 ETH
    'u2',
    NULL,
    'open',
    '2025-03-06 17:26:43',
    '2025-01-06 17:26:43',
    '2025-01-06 17:26:43',
    '0xtx2...012',
    'ipfs://bounty2'
  ),
  (
    'Gas Optimization Challenge', 
    'Optimize our smart contract to reduce gas costs by at least 30%',
    '2.8', -- 2.8 ETH
    'u3',
    'u1',
    'in_progress',
    '2025-02-20 17:26:43',
    '2025-01-06 17:26:43',
    '2025-01-06 17:26:43',
    '0xtx3...345',
    'ipfs://bounty3'
  );

-- Insert Bounty Submissions
INSERT INTO bounty_submissions (
  bounty_id, hunter_id, content, ipfs_hash, status, 
  created_at, updated_at
)
VALUES 
  (
    1,
    'u2',
    'Completed security audit report with 5 high-severity findings and mitigation suggestions',
    'ipfs://submission1',
    'accepted',
    '2025-01-06 17:26:43',
    '2025-01-06 17:26:43'
  ),
  (
    3,
    'u1',
    'Initial submission with 20% gas reduction achieved',
    'ipfs://submission2',
    'pending',
    '2025-01-06 17:26:43',
    '2025-01-06 17:26:43'
  );

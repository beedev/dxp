-- Initialize PostgreSQL extensions for Agentic Commerce
-- This runs automatically on first container start

-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

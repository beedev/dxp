#!/usr/bin/env bash
# Setup script for the Conversational AI Assistant backend.
# Creates a Python venv, installs dependencies, and initializes the database.
#
# Usage:
#   cd apps/conversational-assistant
#   ./setup.sh

set -e

echo "============================================"
echo "  Conversational AI Assistant — Setup"
echo "============================================"

# 1. Python venv
if [ ! -d ".venv" ]; then
  echo ""
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi
source .venv/bin/activate
echo "Using Python: $(python3 --version)"

# 2. Install dependencies
echo ""
echo "Installing Python dependencies..."
pip install -e ".[dev]" --quiet

# 3. Check PostgreSQL
echo ""
echo "Checking PostgreSQL..."
if psql -U codeloom -d postgres -c "SELECT 1" > /dev/null 2>&1; then
  echo "  PostgreSQL: OK"
else
  echo "  ERROR: PostgreSQL not reachable (user=codeloom). Check your DB server."
  exit 1
fi

# 4. Create database if needed
echo ""
echo "Creating database (if not exists)..."
psql -U codeloom -d postgres -c "CREATE DATABASE agentic_commerce;" 2>/dev/null || echo "  Database already exists"

# 5. Enable extensions (pgvector + uuid-ossp only — AGE removed)
echo ""
echo "Enabling extensions (pgvector, uuid-ossp)..."
psql -U codeloom -d agentic_commerce -c "
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
" 2>/dev/null || echo "  Extensions may already exist"

# 6. Ingest sample data (Ace Hardware catalog)
echo ""
echo "Ingesting Ace Hardware catalog..."

# Export Ace products from the portal starter if available
ACE_PRODUCTS="/tmp/ace_products.json"
PORTAL_DIR="../../starters/ace-hardware-portal"
if [ -f "$PORTAL_DIR/src/data/mock-products.ts" ] && [ ! -f "$ACE_PRODUCTS" ]; then
  echo "  Exporting products from portal mock data..."
  node -e "
    const fs = require('fs');
    const src = fs.readFileSync('$PORTAL_DIR/src/data/mock-products.ts', 'utf-8');
    const match = src.match(/export const products:\s*Product\[\]\s*=\s*(\[[\s\S]*?\n\];)/);
    if (match) {
      const products = eval('(' + match[1].replace(/;$/, '') + ')');
      fs.writeFileSync('$ACE_PRODUCTS', JSON.stringify(products, null, 2));
      console.log('  Exported ' + products.length + ' products');
    }
  " 2>/dev/null || echo "  (skipping export — run manually if needed)"
fi

if [ -f "$ACE_PRODUCTS" ]; then
  python -m src.db.ingest ace-hardware 2>&1 | tail -5
else
  echo "  No product data found at $ACE_PRODUCTS — run ingest manually later"
fi

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  To start the backend:"
echo "    source .venv/bin/activate"
echo "    uvicorn src.main:app --port 8002 --reload"
echo ""
echo "  To switch config:"
echo "    AGENTIC_CONFIG_ID=insurance-claims uvicorn src.main:app --port 8002"
echo "============================================"

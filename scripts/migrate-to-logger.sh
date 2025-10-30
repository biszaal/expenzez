#!/bin/bash
# Migration helper script: Replace console.log with production-safe logger
# Usage: ./scripts/migrate-to-logger.sh [analyze|migrate]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Console.log Migration Helper${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to analyze console usage
analyze() {
    echo -e "${YELLOW}📊 Analyzing console.log usage...${NC}"
    echo ""

    cd "$PROJECT_DIR"

    # Count console statements
    CONSOLE_LOG=$(grep -r "console\.log(" --include="*.ts" --include="*.tsx" app/ components/ services/ contexts/ hooks/ utils/ 2>/dev/null | wc -l)
    CONSOLE_ERROR=$(grep -r "console\.error(" --include="*.ts" --include="*.tsx" app/ components/ services/ contexts/ hooks/ utils/ 2>/dev/null | wc -l)
    CONSOLE_WARN=$(grep -r "console\.warn(" --include="*.ts" --include="*.tsx" app/ components/ services/ contexts/ hooks/ utils/ 2>/dev/null | wc -l)
    CONSOLE_INFO=$(grep -r "console\.info(" --include="*.ts" --include="*.tsx" app/ components/ services/ contexts/ hooks/ utils/ 2>/dev/null | wc -l)
    CONSOLE_DEBUG=$(grep -r "console\.debug(" --include="*.ts" --include="*.tsx" app/ components/ services/ contexts/ hooks/ utils/ 2>/dev/null | wc -l)

    TOTAL=$((CONSOLE_LOG + CONSOLE_ERROR + CONSOLE_WARN + CONSOLE_INFO + CONSOLE_DEBUG))

    echo -e "${BLUE}Total console statements found: ${RED}$TOTAL${NC}"
    echo -e "  - console.log:   $CONSOLE_LOG"
    echo -e "  - console.error: $CONSOLE_ERROR"
    echo -e "  - console.warn:  $CONSOLE_WARN"
    echo -e "  - console.info:  $CONSOLE_INFO"
    echo -e "  - console.debug: $CONSOLE_DEBUG"
    echo ""

    # Show top 10 files with most console statements
    echo -e "${YELLOW}📁 Top 10 files with most console statements:${NC}"
    grep -r "console\." --include="*.ts" --include="*.tsx" app/ components/ services/ contexts/ hooks/ utils/ 2>/dev/null | \
        cut -d: -f1 | sort | uniq -c | sort -rn | head -10 | \
        awk '{print "  " $1 " statements in " $2}'
    echo ""

    # High priority files (authentication, security, banking)
    echo -e "${RED}🚨 HIGH PRIORITY files (contains sensitive data):${NC}"
    grep -r "console\." --include="*.ts" --include="*.tsx" \
        app/auth/ \
        app/security/ \
        services/auth* \
        services/banking* \
        contexts/AuthContext* \
        contexts/SecurityContext* 2>/dev/null | \
        cut -d: -f1 | sort | uniq -c | sort -rn | \
        awk '{print "  " $1 " statements in " $2}' || echo "  (None found)"
    echo ""

    echo -e "${GREEN}✅ Analysis complete!${NC}"
    echo -e "${YELLOW}💡 Run './scripts/migrate-to-logger.sh migrate' to start migration${NC}"
}

# Function to help with migration (semi-automated)
migrate() {
    echo -e "${YELLOW}🔄 Starting migration helper...${NC}"
    echo ""
    echo -e "${RED}⚠️  WARNING: This will show you files to migrate manually${NC}"
    echo -e "${YELLOW}We recommend manual review to avoid breaking code${NC}"
    echo ""

    cd "$PROJECT_DIR"

    # List files by priority
    echo -e "${BLUE}Priority 1: Authentication & Security files${NC}"
    FILES=$(grep -rl "console\." --include="*.ts" --include="*.tsx" \
        app/auth/ \
        app/security/ \
        services/auth* \
        services/banking* \
        contexts/AuthContext* \
        contexts/SecurityContext* 2>/dev/null | sort)

    if [ -z "$FILES" ]; then
        echo -e "${GREEN}✅ No console statements in priority files!${NC}"
    else
        echo "$FILES" | while read -r file; do
            COUNT=$(grep -c "console\." "$file" 2>/dev/null || echo 0)
            echo -e "  ${YELLOW}$file${NC} - $COUNT statements"
        done
    fi
    echo ""

    echo -e "${BLUE}Migration Instructions:${NC}"
    echo -e "1. Open each file listed above"
    echo -e "2. Import logger: ${GREEN}import { log } from '@/utils/logger';${NC}"
    echo -e "3. Replace console statements:"
    echo -e "   - ${RED}console.log(...)${NC} → ${GREEN}log.info(...)${NC}"
    echo -e "   - ${RED}console.error(...)${NC} → ${GREEN}log.error(...)${NC}"
    echo -e "   - ${RED}console.warn(...)${NC} → ${GREEN}log.warn(...)${NC}"
    echo -e "4. Test in development mode"
    echo -e "5. Move to next file"
    echo ""

    echo -e "${YELLOW}📋 See LOGGER_MIGRATION_GUIDE.md for detailed examples${NC}"
}

# Main script
case "${1:-analyze}" in
    analyze)
        analyze
        ;;
    migrate)
        migrate
        ;;
    *)
        echo -e "${RED}Usage: $0 [analyze|migrate]${NC}"
        echo -e "  analyze - Show console.log usage statistics"
        echo -e "  migrate - Show migration guidance"
        exit 1
        ;;
esac

#!/bin/bash

# Deployment Script for Restaurant Reservations System
# Usage: ./deploy.sh [environment] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
DOCKER_REGISTRY="ghcr.io"
IMAGE_NAME="crud-reservas"
VERSION="latest"
COMPOSE_FILE="docker-compose.yml"
BACKUP_DB=false
ROLLBACK=false
HEALTH_CHECK_TIMEOUT=60

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    -r|--registry)
      DOCKER_REGISTRY="$2"
      shift 2
      ;;
    --backup)
      BACKUP_DB=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    --timeout)
      HEALTH_CHECK_TIMEOUT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -e, --environment   Environment (production, staging, development)"
      echo "  -v, --version       Image version/tag to deploy"
      echo "  -r, --registry      Docker registry URL"
      echo "  --backup           Create database backup before deployment"
      echo "  --rollback         Rollback to previous version"
      echo "  --timeout          Health check timeout in seconds"
      echo "  -h, --help         Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Set environment-specific configurations
case $ENVIRONMENT in
  production)
    COMPOSE_FILE="docker-compose.prod.yml"
    ;;
  staging)
    COMPOSE_FILE="docker-compose.staging.yml"
    ;;
  development)
    COMPOSE_FILE="docker-compose.yml"
    ;;
  *)
    echo -e "${RED}Error: Unknown environment '$ENVIRONMENT'${NC}"
    exit 1
    ;;
esac

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v docker >/dev/null 2>&1 || {
        log_error "Docker is required but not installed."
        exit 1
    }
    
    command -v docker-compose >/dev/null 2>&1 || {
        log_error "Docker Compose is required but not installed."
        exit 1
    }
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Compose file '$COMPOSE_FILE' not found."
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

backup_database() {
    if [ "$BACKUP_DB" = true ]; then
        log_info "Creating database backup..."
        
        BACKUP_DIR="backups"
        BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        
        mkdir -p $BACKUP_DIR
        
        # Create MongoDB backup
        docker-compose exec -T reservasdb mongodump --archive --gzip | gzip > "$BACKUP_DIR/$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            log_success "Database backup created: $BACKUP_DIR/$BACKUP_FILE"
        else
            log_error "Database backup failed"
            exit 1
        fi
    fi
}

pull_images() {
    log_info "Pulling latest images..."
    
    # Pull the specific version
    FULL_IMAGE_NAME="$DOCKER_REGISTRY/$IMAGE_NAME:$VERSION"
    
    if ! docker pull "$FULL_IMAGE_NAME"; then
        log_error "Failed to pull image: $FULL_IMAGE_NAME"
        exit 1
    fi
    
    log_success "Images pulled successfully"
}

deploy_application() {
    log_info "Deploying application..."
    
    # Export environment variables for docker-compose
    export DOCKER_REGISTRY
    export IMAGE_NAME
    export VERSION
    
    # Start services with zero-downtime deployment
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    if [ $? -eq 0 ]; then
        log_success "Application deployed successfully"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

health_check() {
    log_info "Performing health check..."
    
    local timeout=$HEALTH_CHECK_TIMEOUT
    local count=0
    local interval=5
    
    while [ $count -lt $timeout ]; do
        if curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        sleep $interval
        count=$((count + interval))
        log_info "Waiting for application to be ready... ($count/${timeout}s)"
    done
    
    log_error "Health check failed after ${timeout}s"
    return 1
}

cleanup_old_images() {
    log_info "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images "$DOCKER_REGISTRY/$IMAGE_NAME" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
        tail -n +2 | head -n -3 | awk '{print $1}' | xargs -r docker rmi
    
    log_success "Cleanup completed"
}

rollback_deployment() {
    log_warning "Rolling back deployment..."
    
    # Get the previous image
    PREVIOUS_IMAGE=$(docker images "$DOCKER_REGISTRY/$IMAGE_NAME" --format "{{.Repository}}:{{.Tag}}" | sed -n '2p')
    
    if [ -z "$PREVIOUS_IMAGE" ]; then
        log_error "No previous image found for rollback"
        exit 1
    fi
    
    log_info "Rolling back to: $PREVIOUS_IMAGE"
    
    # Update the deployment with previous image
    VERSION=$(echo "$PREVIOUS_IMAGE" | cut -d':' -f2)
    deploy_application
    
    if health_check; then
        log_success "Rollback completed successfully"
    else
        log_error "Rollback health check failed"
        exit 1
    fi
}

post_deployment_tasks() {
    log_info "Running post-deployment tasks..."
    
    # Run database migrations
    docker-compose -f "$COMPOSE_FILE" exec app npm run migrate
    
    # Send deployment notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🚀 Deployment completed for '"$ENVIRONMENT"' environment (version: '"$VERSION"')"}' \
            "$SLACK_WEBHOOK_URL"
    fi
    
    log_success "Post-deployment tasks completed"
}

show_deployment_info() {
    log_info "Deployment Information:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Version: $VERSION"
    echo "  Compose File: $COMPOSE_FILE"
    echo "  Registry: $DOCKER_REGISTRY"
    echo "  Image: $IMAGE_NAME"
    
    log_info "Running containers:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    log_info "Application URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Health Check: http://localhost:3000/health"
    echo "  API: http://localhost:3000/api"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $ENVIRONMENT environment..."
    
    check_dependencies
    
    if [ "$ROLLBACK" = true ]; then
        rollback_deployment
        show_deployment_info
        exit 0
    fi
    
    backup_database
    pull_images
    deploy_application
    
    if health_check; then
        post_deployment_tasks
        cleanup_old_images
        show_deployment_info
        log_success "🎉 Deployment completed successfully!"
    else
        log_error "❌ Deployment failed health check"
        log_warning "Consider rolling back: $0 --rollback"
        exit 1
    fi
}

# Trap to cleanup on exit
trap 'log_info "Deployment interrupted"' INT TERM

# Run main function
main "$@"
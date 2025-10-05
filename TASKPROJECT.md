# FRANCISCOMONEY INTEL - PROJECT IMPLEMENTATION TASKS

## Project Status: NOT STARTED
Last Updated: 2025-09-29

This document tracks ALL tasks required to build and deploy Franciscomoney Intel on the OVH server (51.178.253.51).

## PHASE 1: SERVER SETUP & CONFIGURATION
- [ ] **1.1 SSH into OVH server and check environment**
  - Connect: `ssh -i /root/coding/claudecode/projects/ovh/keys/ovh_master debian@51.178.253.51`
  - Check Node.js version (need 18+)
  - Check PostgreSQL installation
  - Check Redis installation
  - Check Postfix installation
  - Document any missing dependencies

- [ ] **1.2 Install missing dependencies on OVH**
  - Install Node.js 18+ if needed
  - Install PostgreSQL 14+ if needed
  - Install Redis if needed
  - Install PM2 globally: `npm install -g pm2`
  - Install nginx if needed
  - Install Postfix for email if needed

- [ ] **1.3 Configure PostgreSQL database**
  - Create database: `franciscomoney_intel`
  - Create database user with password
  - Set up database permissions
  - Test connection
  - Document credentials in `.env.example`

- [ ] **1.4 Configure Redis**
  - Set up Redis with password
  - Configure persistence
  - Test connection
  - Document Redis URL in `.env.example`

- [ ] **1.5 Configure Postfix for email sending**
  - Install and configure Postfix
  - Set up SPF records for domain
  - Set up DKIM signing
  - Set up DMARC policy
  - Test email sending locally
  - Document SMTP settings

## PHASE 2: PROJECT STRUCTURE & BASIC SETUP
- [ ] **2.1 Create complete project structure**
  ```
  franciscomoney-intel/
  ├── src/
  │   ├── api/          # Express routes
  │   ├── services/     # Business logic
  │   ├── workers/      # Background jobs
  │   ├── models/       # Database models
  │   ├── utils/        # Helper functions
  │   └── config/       # Configuration
  ├── public/           # Static files
  ├── views/            # Email templates
  ├── scripts/          # Utility scripts
  ├── tests/            # Test files
  └── docker/           # Docker configs
  ```

- [ ] **2.2 Initialize Node.js project**
  - Create package.json with all dependencies
  - Set up TypeScript configuration
  - Configure ESLint and Prettier
  - Set up nodemon for development
  - Create .env.example with all variables

- [ ] **2.3 Set up Git repository**
  - Initialize git repo
  - Create .gitignore (exclude .env, node_modules, logs, pdfs)
  - Initial commit with structure
  - Set up GitHub repository
  - Push to GitHub

## PHASE 3: DATABASE SCHEMA & MODELS
- [ ] **3.1 Design and create database schema**
  ```sql
  -- Tables needed:
  -- users (id, email, verified, created_at, verification_token)
  -- alerts (id, user_id, query, frequency, created_at, active)
  -- topic_areas (id, name, slug, created_at)
  -- sources (id, topic_area_id, name, url, type, active)
  -- documents (id, source_id, title, pdf_url, markdown_content, processed_at)
  -- summaries (id, document_id, user_id, alert_id, summary_text, created_at)
  -- email_logs (id, user_id, sent_at, opened_at, clicks)
  -- sponsors (id, title, content, topic_areas, active, impressions)
  ```

- [ ] **3.2 Create Sequelize/Prisma models**
  - Set up ORM (Sequelize or Prisma)
  - Create all model files
  - Set up relationships
  - Create migration files
  - Run migrations

- [ ] **3.3 Seed initial data**
  - Create topic areas (CBDCs, Climate Finance, AI Regulation)
  - Add 20 sources per topic area
  - Create test user accounts
  - Add sample sponsor content

## PHASE 4: CORE SERVICES IMPLEMENTATION
- [ ] **4.1 Implement PDF processing service**
  - Create PDF downloader (handle different source types)
  - Implement PDF to Markdown converter using pdf-parse
  - Create document storage service
  - Handle duplicate detection
  - Add error handling and retries

- [ ] **4.2 Implement Cerebras AI integration**
  - Set up Cerebras API client
  - Create prompt templates for analysis
  - Implement document analysis function
  - Create summary generation with user context
  - Add impact scoring algorithm
  - Add bias detection logic
  - Implement caching layer

- [ ] **4.3 Build email service**
  - Configure Nodemailer with Postfix
  - Create email templates (HTML + text)
  - Implement email tracking (opens, clicks)
  - Create digest compilation logic
  - Add unsubscribe handling
  - Test email deliverability

- [ ] **4.4 Create background job workers**
  - Set up Bull queue with Redis
  - Create daily PDF fetching job
  - Create weekly email sending job
  - Add job monitoring and error handling
  - Implement retry logic

## PHASE 5: WEB INTERFACE DEVELOPMENT
- [ ] **5.1 Build user-facing pages**
  - Create landing page with alert signup
  - Build email verification page
  - Create user dashboard for managing alerts
  - Implement alert CRUD operations
  - Add frequency settings per alert

- [ ] **5.2 Create SEO-optimized report pages**
  - Design report page template
  - Implement dynamic route generation
  - Add meta tags for SEO
  - Create related reports sidebar
  - Add social sharing buttons
  - Implement PDF download tracking

- [ ] **5.3 Build admin dashboard**
  - Create admin authentication
  - Build topic area management interface
  - Create source management (add/edit/delete)
  - Build sponsor content manager
  - Add analytics dashboard
  - Create email preview tool
  - **Create API configuration interface**
    - Secure form to update Cerebras API key
    - Automatic .env file update functionality
    - Test API connection button
    - Show current API status (active/invalid)

## PHASE 6: API ENDPOINTS
- [ ] **6.1 User authentication endpoints**
  - POST /api/auth/register
  - POST /api/auth/verify-email
  - POST /api/auth/login
  - POST /api/auth/logout

- [ ] **6.2 Alert management endpoints**
  - GET /api/alerts (user's alerts)
  - POST /api/alerts (create alert)
  - PUT /api/alerts/:id (update alert)
  - DELETE /api/alerts/:id (delete alert)

- [ ] **6.3 Report endpoints**
  - GET /api/reports/:slug (single report)
  - GET /api/reports (list with pagination)
  - GET /api/reports/download/:id (PDF download)

- [ ] **6.4 Admin endpoints**
  - All CRUD for topic areas
  - All CRUD for sources
  - All CRUD for sponsors
  - GET /api/admin/analytics

## PHASE 7: TESTING & OPTIMIZATION
- [ ] **7.1 Write comprehensive tests**
  - Unit tests for all services
  - Integration tests for API endpoints
  - Test email sending
  - Test PDF processing
  - Test Cerebras integration

- [ ] **7.2 Performance optimization**
  - Implement caching strategy
  - Optimize database queries
  - Add indexes where needed
  - Implement rate limiting
  - Add request compression

- [ ] **7.3 Security hardening**
  - Implement CSRF protection
  - Add rate limiting
  - Secure admin routes
  - Validate all inputs
  - Set up helmet.js

## PHASE 8: DEPLOYMENT & MONITORING
- [ ] **8.1 Prepare for deployment**
  - Create production .env file
  - Build production assets
  - Create PM2 ecosystem file
  - Set up nginx configuration
  - Configure SSL certificate

- [ ] **8.2 Deploy to OVH server**
  - Clone repository on server
  - Install dependencies
  - Run database migrations
  - Start PM2 processes
  - Configure nginx proxy
  - Test all functionality

- [ ] **8.3 Set up monitoring**
  - Configure PM2 monitoring
  - Set up error logging (Sentry or similar)
  - Create health check endpoint
  - Set up uptime monitoring
  - Configure backup strategy

## PHASE 9: LAUNCH PREPARATION
- [ ] **9.1 Final testing**
  - Complete user flow testing
  - Test email deliverability
  - Verify all links work
  - Check mobile responsiveness
  - Load testing

- [ ] **9.2 Documentation**
  - Write API documentation
  - Create user guide
  - Document admin features
  - Create troubleshooting guide

- [ ] **9.3 Launch checklist**
  - Verify DNS settings
  - Check all environment variables
  - Ensure backups are working
  - Monitor server resources
  - Prepare launch announcement

## CRITICAL IMPLEMENTATION NOTES

### Cerebras API Integration
- Get API key from Cerebras
- Test with small batches first
- Implement proper error handling
- Cache responses to minimize costs

### Email Deliverability
- Must configure SPF: `v=spf1 ip4:51.178.253.51 ~all`
- Set up DKIM with 2048-bit key
- Configure DMARC: `v=DMARC1; p=none; rua=mailto:reports@franciscomoney.com`
- Warm up IP by sending gradually

### SEO Considerations
- URL structure: `/reports/[topic-slug]/[date]-[title-slug]`
- Implement schema.org markup
- Create XML sitemap
- Set up robots.txt

### Performance Targets
- Page load: < 2 seconds
- Email processing: < 5 minutes for 1000 users
- PDF processing: < 30 seconds per document

## CURRENT STATUS: ADMIN PLATFORM FULLY FUNCTIONAL

### Completed:
✅ Server setup with all dependencies
✅ Database models created and synced
✅ FULL authentication system with login/logout
✅ Admin dashboard with ALL CRUD operations
✅ Admin user created: f@pachoman.com / C@rlos2025
✅ All API endpoints for admin features
✅ Topic Areas management
✅ Sources management
✅ Sponsors management
✅ API key configuration
✅ User management

### Next Action: 
Login to admin dashboard and configure Cerebras API key

### Command to start:
```bash
ssh -i /root/coding/claudecode/projects/ovh/keys/ovh_master debian@51.178.253.51
```
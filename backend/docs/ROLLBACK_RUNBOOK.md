# QUEENTHAIR Rollback Runbook

## Overview

This runbook provides step-by-step instructions for rolling back the QUEENTHAIR backend API in case of deployment failures, critical bugs, or security incidents. Every deployment can be reversed within 5 minutes with zero data loss.

**Last Updated:** 2024  
**Owner:** QUEENTHAIR Engineering Team  
**Severity Levels:**
- **P0 (Critical)**: Complete service outage, data loss, security breach
- **P1 (High)**: Major feature broken, performance degradation
- **P2 (Medium)**: Minor bug, non-critical feature issue

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Application Rollback](#a-application-rollback)
3. [Database Rollback](#b-database-rollback)
4. [Cache Invalidation](#c-cache-invalidation)
5. [Health Verification](#d-verifying-system-health-post-rollback)
6. [Stakeholder Communication](#e-stakeholder-communication-template)
7. [Prevention Checklist](#f-prevention-checklist)
8. [Post-Incident Review](#g-post-incident-review)

---

## Quick Reference

### Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-Call Engineer | On-Call Rotation | +1-XXX-XXX-XXXX | @oncall |
| Engineering Lead | [Name] | +1-XXX-XXX-XXXX | @eng-lead |
| Product Manager | [Name] | +1-XXX-XXX-XXXX | @pm |
| Security Lead | [Name] | +1-XXX-XXX-XXXX | @security |

### Critical Commands

```bash
# Application Rollback (Docker Swarm)
docker service update --image queenthair-api:v1.4.1 queenthair_api

# Application Rollback (Kubernetes)
kubectl rollout undo deployment/queenthair-api

# Database Rollback (requires migration down)
npm run migrate:down

# Check health endpoint
curl https://api.queenthair.com/health
```

---

## A. Application Rollback

### A1. Identify the Issue

1. Check alerts in Slack (#alerts channel)
2. Review error logs: `kubectl logs -f deployment/queenthair-api --tail=100`
3. Check health endpoint: `curl https://api.queenthair.com/health`
4. Determine if issue is application-level or infrastructure-level

### A2. Immediate Rollback Decision

**Rollback if:**
- Error rate > 10% for > 2 minutes
- Response time P95 > 5000ms
- Database connection failures
- Security vulnerability detected
- Data integrity issues

### A3. Docker Swarm Rollback

```bash
# 1. List available image tags
docker images queenthair-api --format "{{.Repository}}:{{.Tag}}" | head -5

# 2. Rollback to previous version (e.g., v1.4.1)
docker service update \
  --image queenthair-api:v1.4.1 \
  --update-parallelism 1 \
  --update-delay 10s \
  queenthair_api

# 3. Monitor rollout
docker service ps queenthair_api
watch docker service ls

# 4. Verify health
curl https://api.queenthair.com/health
```

### A4. Kubernetes Rollback

```bash
# 1. Check rollout history
kubectl rollout history deployment/queenthair-api

# 2. Rollback to previous version
kubectl rollout undo deployment/queenthair-api

# 3. Monitor rollout
kubectl rollout status deployment/queenthair-api

# 4. Verify pods are running
kubectl get pods -l app=queenthair-api

# 5. Check health endpoint
kubectl port-forward deployment/queenthair-api 8080:3000
curl http://localhost:8080/health
```

### A5. Verification Steps

- [ ] `/health` endpoint returns 200
- [ ] `/readiness` endpoint returns 200
- [ ] Error rate < 1%
- [ ] Response time P95 < 2000ms
- [ ] Database connections stable
- [ ] No 5xx errors in logs

---

## B. Database Rollback

### B1. Before You Begin

⚠️ **WARNING**: Database rollback should only be performed after application rollback and only if database migration caused the issue.

**Prerequisites:**
1. Confirm migration caused the issue
2. Verify backup exists from before migration
3. Get approval from Database Admin

### B2. Automated Backup Verification

```bash
# Check backup status (run this before any rollback)
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('queenthair'));"

# Verify WAL archiving is current
psql $DATABASE_URL -c "SELECT last_archived_wal FROM pg_stat_archiver;"
```

### B3. Migration Downgrade

```bash
# 1. Check current migration status
npm run migrate:status

# 2. Review down migration (DO NOT SKIP)
cat src/db/migrations/V003__security_indexes.down.sql

# 3. Run down migration
npm run migrate:down

# 4. Verify migration status
npm run migrate:status
```

### B4. Point-in-Time Recovery (PITR)

If down migration is not available or insufficient:

```bash
# 1. Stop application (prevent writes)
docker service scale queenthair_api=0

# 2. Restore from backup
pg_restore --clean --if-exists \
  --dbname=queenthair \
  /backups/queenthair-$(date -d '1 hour ago' +%Y%m%d-%H%M%S).dump

# 3. Replay WAL logs to desired point
# (This is handled by PostgreSQL automatically if WAL archiving is enabled)

# 4. Restart application
docker service scale queenthair_api=3
```

### B5. Post-Rollback Verification

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT NOW();"

# Verify table counts (should match pre-migration)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"

# Check for data inconsistencies
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC;"
```

---

## C. Cache Invalidation

### C1. Redis Cache Clear

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# Clear all keys (USE WITH CAUTION)
FLUSHDB

# Or clear specific key patterns
KEYS "cache:*" | xargs redis-cli DEL
KEYS "session:*" | xargs redis-cli DEL
KEYS "rate_limit:*" | xargs redis-cli DEL
```

### C2. CDN Cache Invalidation (if applicable)

```bash
# CloudFront invalidation example
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

---

## D. Verifying System Health Post-Rollback

### D1. Health Check Endpoints

```bash
# Health endpoint (basic liveness)
curl https://api.queenthair.com/health | jq .

# Expected response:
# {
#   "status": "healthy",
#   "version": "1.4.1",
#   "commitSha": "abc123",
#   "dbStatus": "connected",
#   "redisStatus": "connected",
#   "uptime": 3600
# }

# Readiness endpoint (traffic gating)
curl https://api.queenthair.com/readiness

# Should return HTTP 200 only when ready to receive traffic
```

### D2. Smoke Tests

```bash
# Test critical endpoints
curl -X POST https://api.queenthair.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

curl https://api.queenthair.com/products?page=1&limit=10

curl -H "Authorization: Bearer $TOKEN" \
  https://api.queenthair.com/orders
```

### D3. Monitoring Dashboards

Check the following dashboards:
- Grafana: https://grafana.queenthair.com
- Datadog: https://app.datadoghq.com
- CloudWatch: AWS Console

**Key Metrics:**
- Request rate (should be normal)
- Error rate (should be < 1%)
- Response time P95 (should be < 2000ms)
- Database connection count
- Redis memory usage

---

## E. Stakeholder Communication Template

### Internal Team Notification (Slack)

```
🚨 INCIDENT ALERT 🚨

**Status**: [Investigating / Identified / Mitigated / Resolved]
**Severity**: [P0 / P1 / P2]
**Service**: QUEENTHAIR API
**Started**: YYYY-MM-DD HH:MM UTC

**Summary**: Brief description of the issue

**Impact**: 
- [x] Customer-facing features affected: [list]
- [ ] Admin features affected: [list]
- [x] Estimated affected users: [number]

**Actions Taken**:
- 14:32 UTC - Issue detected via automated alert
- 14:35 UTC - On-call engineer paged
- 14:40 UTC - Application rolled back to v1.4.1
- 14:45 UTC - Service restored, monitoring continues

**Next Steps**:
- Root cause analysis in progress
- Post-incident review scheduled for [time]

**Incident Commander**: @username
```

### Customer Communication (Status Page)

```
**Investigating**: QUEENTHAIR API Performance Issues

We are currently investigating reports of slow response times from our API. 
Our engineering team is working to resolve this issue.

**Affected Services**:
- Checkout
- Product search
- User account access

**Workaround**: None at this time

We will provide updates every 30 minutes.

Last updated: YYYY-MM-DD HH:MM UTC
```

### Post-Resolution Summary

```
✅ RESOLVED: QUEENTHAIR API Performance Issues

The performance issues have been resolved. All services are now operating normally.

**Root Cause**: Brief explanation
**Duration**: XX minutes (HH:MM - HH:MM UTC)
**Affected Users**: Approximately X users

**What Happened**:
Detailed timeline and explanation

**What We Did**:
- Action 1
- Action 2

**What We're Doing to Prevent This**:
- Improvement 1
- Improvement 2

Thank you for your patience.
```

---

## F. Prevention Checklist

### Before Every Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan clean (npm audit, Snyk)
- [ ] Database migration reviewed by DBA
- [ ] Rollback plan documented
- [ ] Feature flags configured (can disable new features)
- [ ] Monitoring alerts configured
- [ ] On-call engineer notified

### Deployment Best Practices

- [ ] Use blue-green or canary deployment strategy
- [ ] Deploy to staging first, run smoke tests
- [ ] Monitor error rate for 30 minutes post-deployment
- [ ] Keep previous Docker image available
- [ ] Enable feature flags at 10% rollout initially

---

## G. Post-Incident Review

### Schedule
- Within 24 hours for P0 incidents
- Within 48 hours for P1 incidents
- Within 1 week for P2 incidents

### Template

```markdown
# Post-Incident Review: [Incident Name]

## Metadata
- **Date**: YYYY-MM-DD
- **Severity**: [P0/P1/P2]
- **Duration**: XX minutes
- **Incident Commander**: [Name]
- **Attendees**: [Names]

## Timeline
| Time | Event |
|------|-------|
| 14:32 | Issue detected via automated alert |
| 14:35 | On-call engineer paged |
| 14:40 | Rollback initiated |
| 14:45 | Service restored |

## Root Cause Analysis
[5 Whys analysis]

## Impact Assessment
- Users affected: X
- Revenue impact: $X
- Data integrity: [Yes/No]

## Lessons Learned
1. 
2. 
3. 

## Action Items
| Task | Owner | Due Date |
|------|-------|----------|
| | | |

## Prevention Measures
[What we're changing to prevent recurrence]
```

---

## Appendix

### A. Feature Flags

Disable features without redeployment:

```sql
-- Disable a problematic feature
UPDATE feature_flags SET enabled = false WHERE flag_name = 'new_checkout_flow';
```

### B. Emergency Database Queries

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill long-running queries
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';

-- Check replication lag
SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;
```

### C. Log Locations

- Application logs: `/var/log/queenthair/app.log`
- Error logs: `/var/log/queenthair/error.log`
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`

---

**Document Version**: 1.0  
**Review Date**: Quarterly  
**Owner**: QUEENTHAIR SRE Team

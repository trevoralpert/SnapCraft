# SnapCraft Documentation

This directory contains all project documentation organized by category.

## 📁 Directory Structure

### 🚀 Deployment
- [`vercel-deployment.md`](./deployment/vercel-deployment.md) - **Main deployment guide** - Vercel hosting with Firebase backend
- [`firebase-setup.md`](./deployment/firebase-setup.md) - Firebase backend services configuration
- [`firebase-manual-deployment.md`](./deployment/firebase-manual-deployment.md) - Manual Firebase rules deployment
- [`firebase-production-setup.md`](./deployment/firebase-production-setup.md) - Production Firebase environment setup

### 🔧 Development
- [`demo-guide.md`](./development/demo-guide.md) - App demo and feature walkthrough
- [`known-issues.md`](./development/known-issues.md) - Current known issues and limitations
- [`security-audit.md`](./development/security-audit.md) - Security audit and recommendations
- [`firebase-security-rules-update.md`](./development/firebase-security-rules-update.md) - Firebase security rules updates

### 🏃‍♂️ Sprint History
- [`daily-sprint-june-26.md`](./sprints/daily-sprint-june-26.md) - June 26 daily sprint log
- [`june-28-checklist.txt`](./sprints/june-28-checklist.txt) - June 28 sprint checklist
- [`june-29-final-checklist.txt`](./sprints/june-29-final-checklist.txt) - June 29 final sprint checklist
- [`task-5.4-analytics-summary.md`](./sprints/task-5.4-analytics-summary.md) - Analytics implementation summary

### 📚 Archive
- [`firebase-security-rules.md`](./archive/firebase-security-rules.md) - Legacy Firebase security rules doc
- [`markdowns/`](./archive/markdowns/) - Original project documentation and PDFs

## 🔍 Quick Reference

### For Deployment
**SnapCraft uses a hybrid approach:**
- **Frontend**: Deployed on **Vercel** (web hosting)
- **Backend**: **Firebase** (auth, database, storage)

Start with [`vercel-deployment.md`](./deployment/vercel-deployment.md) for the complete deployment process, then [`firebase-setup.md`](./deployment/firebase-setup.md) for backend configuration.

**Why this approach?**
- **Vercel**: Excellent for React/Expo web apps with automatic deployments, global CDN, and performance optimization
- **Firebase**: Robust backend services with real-time features, authentication, and file storage
- **Best of both worlds**: Fast frontend delivery + powerful backend services

### For Development
Check [`known-issues.md`](./development/known-issues.md) for current limitations and [`demo-guide.md`](./development/demo-guide.md) for feature overview.

### For Project History
Review sprint checklists in [`sprints/`](./sprints/) folder to understand development progression. 
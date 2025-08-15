#!/bin/bash

# Create GitHub repository with professional description and topics
gh repo create matchday --public \
  --description "A comprehensive sports team management application built with Next.js 15, featuring team organization, player management, league discovery, and real-time match tracking" \
  --add-readme=false

# Add repository topics based on research from @web-research-specialist
gh api repos/:owner/matchday/topics --method PUT --field names:='[
  "nextjs",
  "nextjs15", 
  "react",
  "typescript",
  "sports-management",
  "team-management",
  "tailwindcss",
  "supabase",
  "sports",
  "league-management",
  "player-dashboard",
  "real-time",
  "sports-app",
  "match-tracking",
  "nextjs-app"
]'

# Set up remote origin and push
git remote add origin https://github.com/$(gh api user --jq .login)/matchday.git
git branch -M main
git push -u origin main

echo "✅ GitHub repository created successfully!"
echo "Repository URL: https://github.com/$(gh api user --jq .login)/matchday"
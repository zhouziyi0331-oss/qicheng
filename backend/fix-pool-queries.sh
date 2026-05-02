#!/bin/bash

# 修复所有使用 pool.query 的文件

files=(
  "src/controllers/matchController.ts"
  "src/controllers/mentorController.ts"
  "src/controllers/milestoneController.ts"
  "src/controllers/opcController.ts"
  "src/controllers/taskLevelController.ts"
  "src/routes/chat/chatController.ts"
  "src/routes/rating/ratingController.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # 替换 import pool from '../utils/db' 为 import { query, queryOne } from '../utils/db'
    sed -i '' "s/import pool from '\.\.\/utils\/db';/import { query, queryOne } from '\.\.\/utils\/db';/g" "$file"
    sed -i '' "s/import pool from '\.\.\/\.\.\/utils\/db';/import { query, queryOne } from '\.\.\/\.\.\/utils\/db';/g" "$file"
    sed -i '' "s/import { pool } from '\.\.\/utils\/db';/import { query, queryOne } from '\.\.\/utils\/db';/g" "$file"
    sed -i '' "s/import { pool } from '\.\.\/\.\.\/utils\/db';/import { query, queryOne } from '\.\.\/\.\.\/utils\/db';/g" "$file"
    
  fi
done

echo "Done!"

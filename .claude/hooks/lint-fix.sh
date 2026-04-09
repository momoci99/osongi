#!/bin/bash
# PostToolUse hook: Edit/Write 후 자동으로 eslint --fix 실행

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# 파일 경로가 없으면 종료
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# ts/tsx/js/jsx 파일만 대상
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    npx eslint --fix "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0

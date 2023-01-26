#!/bin/bash
set -e

npm version --preid dev --no-git-tag-version --no-commit-hooks prepatch
#Use timestamp as package suffix
TIME=$(date -u +%Y%m%d%H%M%S)
sed -i "/version/s/dev.0/dev.$TIME/g" package.json
PUBLISH_VERSION=$(cat package.json | jq -r '.version')
echo publishing @massalabs/sc-standards@$PUBLISH_VERSION

# disable husky
npm pkg delete scripts.prepare

npm publish --access public --tag dev

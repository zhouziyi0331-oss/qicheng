#!/bin/bash
# 创建简单的占位图标（使用 ImageMagick 或者下载）
# 由于没有 ImageMagick，我们使用 base64 编码的最小 PNG

# 创建一个最小的透明 PNG (81x81)
echo "iVBORw0KGgoAAAANSUhEUgAAAFEAAABRCAYAAACqj0o2AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYSURBVHhe7cExAQAAAMKg9U9tCU+gAAAA4G8DIgAB6bwHWwAAAABJRU5ErkJggg==" | base64 -d > home.png
cp home.png home-active.png
cp home.png tasks.png
cp home.png tasks-active.png
cp home.png my.png
cp home.png my-active.png
cp home.png profile.png
cp home.png profile-active.png

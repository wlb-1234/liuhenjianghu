#!/bin/bash

# 流痕江湖 构建脚本

echo "======================================"
echo "  流痕江湖 - Android 构建脚本"
echo "======================================"

# 检查是否在 client 目录
if [ ! -d "../client" ]; then
  echo "错误：请在 client 目录或项目根目录执行此脚本"
  exit 1
fi

# 显示菜单
echo ""
echo "请选择操作："
echo "1. 构建预览版 APK (内部测试)"
echo "2. 构建正式版 APK (发布用)"
echo "3. 发布 EAS Update (更新已安装的App)"
echo "4. 构建并发布完整流程"
echo "0. 退出"
echo ""

read -p "请输入选项 (0-4): " choice

case $choice in
  1)
    echo ">>> 构建预览版 APK..."
    eas build --platform android --profile preview --local
    ;;
  2)
    echo ">>> 构建正式版 APK..."
    eas build --platform android --profile production --local
    ;;
  3)
    echo ">>> 发布 EAS Update..."
    eas update --branch production --message "更新内容"
    ;;
  4)
    echo ">>> 构建并发布..."
    eas build --platform android --profile production --local && \
    eas update --branch production --message "版本更新"
    ;;
  0)
    echo "退出"
    exit 0
    ;;
  *)
    echo "无效选项"
    exit 1
    ;;
esac

echo ""
echo "======================================"
echo "  构建完成!"
echo "======================================"

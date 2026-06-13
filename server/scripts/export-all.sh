#!/bin/bash
# 导出所有行政区划数据

cd /workspace/projects/server/src/data

# 获取省份
curl -s "http://localhost:9091/api/v1/regions/provinces" > provinces.json

# 创建完整的JSON结构
cat > regions.json << 'JSONEOF'
{
  "provinces": PROVINCES_PLACEHOLDER,
  "cities": {},
  "districts": {},
  "streets": {}
}
JSONEOF

# 读取省份代码
PROVINCES=$(cat provinces.json)

# 构建cities JSON
CITIES="{"
FIRST_P=1
for CODE in 11 12 13 14 15 21 22 23 31 32 33 34 35 36 37 41 42 43 44 45 46 50 51 52 53 54 61 62 63 64 65 71 81 82; do
  CITIES_DATA=$(curl -s "http://localhost:9091/api/v1/regions/cities/$CODE")
  if [ "$CITIES_DATA" != "[]" ] && [ "$CITIES_DATA" != '{"code":0,"message":"success","data":[]}' ]; then
    # 提取data数组
    DATA=$(echo "$CITIES_DATA" | sed 's/{"code":0,"message":"success","data"://' | sed 's/}$//')
    if [ "$FIRST_P" -eq 1 ]; then
      CITIES="$CITIES\"$CODE\":$DATA"
      FIRST_P=0
    else
      CITIES="$CITIES,\"$CODE\":$DATA"
    fi
    echo "Got cities for $CODE"
  fi
done
CITIES="$CITIES}"

# 更新regions.json
sed -i "s/PROVINCES_PLACEHOLDER/$PROVINCES/" regions.json
sed -i "s/\"cities\": {}/\"cities\": $CITIES/" regions.json

echo "Done!"

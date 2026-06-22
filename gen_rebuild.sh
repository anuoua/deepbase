#!/bin/bash
DIR="${1:?请提供目录路径}"
DIR_NAME="$(basename "$(cd "$DIR" 2>/dev/null && pwd)")"
OUT="${2:-rebuild_${DIR_NAME}.sh}"
[[ "$OUT" != /* ]] && OUT="$PWD/$OUT"
BASE="$(cd "$DIR" && pwd | sed "s|^$(pwd)/||")"

cat << 'HEADER' > "$OUT"
#!/bin/bash
BASE="__BASE_PLACEHOLDER__"
mkdir -p "$BASE"
HEADER

sed -i "s|__BASE_PLACEHOLDER__|$BASE|" "$OUT"

OUT_NAME="$(basename "$OUT")"
cd "$DIR" && find . -type f -not -name "$OUT_NAME" -not -path '*/node_modules/*' -not -path '*/.git/*' | sort | while read f; do
  rel="${f#./}"
  dir="$(dirname "$rel")"
  if [ "$dir" != "." ]; then
    echo "mkdir -p \"\$BASE/$dir\"" >> "$OUT"
  fi
  echo "base64 -d << 'B64_EOF' > \"\$BASE/$rel\"" >> "$OUT"
  base64 "$f" >> "$OUT"
  echo "B64_EOF" >> "$OUT"
done

echo "echo '目录 $BASE 已重建完成'" >> "$OUT"
chmod +x "$OUT"
echo "已生成: $OUT"
#!/bin/bash

# Configure JAVA_HOME for Gradle builds that require JDK 17+.

if [ -n "${JAVA_HOME:-}" ] && [ -x "${JAVA_HOME}/bin/java" ]; then
  CURRENT_JAVA_VERSION=$("${JAVA_HOME}/bin/java" -version 2>&1 | awk -F '"' '/version/ {print $2; exit}')
else
  CURRENT_JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2; exit}')
fi

java_major_version() {
  local version="$1"

  if [ -z "$version" ]; then
    return 1
  fi

  if [[ "$version" == 1.* ]]; then
    printf '%s\n' "${version#1.}" | awk -F. '{print $1}'
    return 0
  fi

  printf '%s\n' "$version" | awk -F. '{print $1}'
}

CURRENT_JAVA_MAJOR="$(java_major_version "$CURRENT_JAVA_VERSION" || true)"

if [ -n "$CURRENT_JAVA_MAJOR" ] && [ "$CURRENT_JAVA_MAJOR" -ge 17 ]; then
  return 0
fi

for candidate in \
  /usr/lib/jvm/java-17-openjdk-amd64 \
  /usr/lib/jvm/java-1.17.0-openjdk-amd64 \
  /usr/lib/jvm/openjdk-17
do
  if [ -x "$candidate/bin/java" ]; then
    export JAVA_HOME="$candidate"
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "☕ JAVA_HOME set to $JAVA_HOME"
    return 0
  fi
done

echo "❌ Java 17+ not found. Install JDK 17 and retry."
echo "   Current java: ${CURRENT_JAVA_VERSION:-unknown}"
exit 1

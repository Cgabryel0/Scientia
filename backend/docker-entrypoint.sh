#!/bin/sh
set -eu

if [ -z "${PORTA:-}" ]; then
  export PORTA="${PORT:-3000}"
fi

exec "$@"

#!/bin/sh
set -e
# We need to buid because the configuration file may be modified at runtime.
npm run build

serve -s build -p 8080

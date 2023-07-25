#!/bin/sh
set -e

# We need to buid because the configuration file may be modified at runtime.
npm run build

serve build --single -p 8080 --no-port-switching

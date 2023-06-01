#!/bin/sh
set -e
# We need to buid because the configuration file may be modified at runtime.
# npm run build

serve -s dist -p 80 --no-port-switching

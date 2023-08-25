#!/bin/sh
set -ex

# Validate the application's config.json. This includes a ts compilation that
# validates the config's structure. It may have custom settings and was mounted
# to the container in /public. Once validated, move it to /build to be served.
npm run check-config
cp ./public/config.json ./build/config.json

serve build --single -p 8080 --no-port-switching

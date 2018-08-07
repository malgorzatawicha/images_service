#!/usr/bin/env bash

# Bomb if anything fails.
set -e

# Run the container.
DATADIR="$(pwd)/data"
rm -rf $DATADIR; mkdir $DATADIR
echo "Created temporary data directory: $DATADIR"
ID=$(docker run -d -p 8000:8000 -v $DATADIR:/data/ dwmkerr/dynamodb -dbPath /data/ --sharedDb)
sleep 2

# Create a table.
aws dynamodb --endpoint-url http://localhost:8000 --region eu-west-1 \
	create-table \
        --cli-input-json file:///$(pwd)/db_images.json

echo "Stopping..."
docker stop $ID && docker rm $ID || true
sleep 2

echo "Created data files at '$DATADIR'..."

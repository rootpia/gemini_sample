#!/bin/bash
sudo docker run --rm -v ${PWD}/config.json:/app/config.json --entrypoint python gemini-sample /app/main.py

#!/bin/bash
sudo  docker run --rm -v ${PWD}/config.json:/app/config.json -p 8888:8888 --entrypoint python gemini-sample /app/main.py

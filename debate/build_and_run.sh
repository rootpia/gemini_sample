#!/bin/bash
docker build -t gemini-debate .
docker run -it --rm -v `"${PWD}/chat/config.json:/app/config.json`" gemini-debate

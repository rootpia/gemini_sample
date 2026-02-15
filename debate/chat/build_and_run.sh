#!/bin/bash
docker build -t gemini-sample .
docker run -it --rm -v `"${PWD}/config.json:/app/config.json`" gemini-sample

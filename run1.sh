#!/bin/bash
sudo docker run --rm -v ${PWD}/config.json:/app/config.json gemini-sample "What's your version?"

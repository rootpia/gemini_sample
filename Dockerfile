FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ai_assist.py main.py ./

RUN pip install --no-cache-dir -r requirements.txt
ENTRYPOINT ["python", "ai_assist.py"]

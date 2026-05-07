FROM python:3.12-slim
# Note: Python 3.14 has no official Docker image yet, use 3.12

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

EXPOSE 8000
CMD ["python", "main.py"]
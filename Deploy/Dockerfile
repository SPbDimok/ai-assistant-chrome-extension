
# Dockerfile для AI Assistant Server

FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Создание рабочей директории
WORKDIR /app

# Копирование файлов зависимостей
COPY requirements.txt .
COPY requirements_mcp.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r requirements_mcp.txt

# Установка Playwright браузеров
RUN playwright install chromium
RUN playwright install-deps chromium

# Копирование исходного кода
COPY . .

# Создание папок для данных
RUN mkdir -p screenshots logs

# Переменные окружения
ENV PYTHONPATH=/app
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Открытие портов
EXPOSE 8000 3000

# Команда по умолчанию
CMD ["python", "server.py", "--host", "0.0.0.0", "--port", "8000"]

# AI Assistant Chrome Extension

Интеллектуальное расширение для Chrome с поддержкой LLM-агента и MCP-серверов для автоматизации веб-страниц.

## 🚀 Возможности

- **Анализ веб-страниц** - автоматический анализ содержимого страниц
- **Извлечение данных** - структурированное извлечение информации
- **Суммирование контента** - создание кратких изложений
- **Автоматизация браузера** - через MCP-серверы с Playwright
- **Чат с ИИ** - интерактивное общение с LLM-агентом
- **Настраиваемые MCP-серверы** - расширяемая архитектура

## 📋 Структура проекта

```
ai-assistant-chrome-extension/
├── Chrome Extension/              # Файлы расширения
│   ├── manifest.json             # Конфигурация расширения
│   ├── background.js             # Service Worker
│   ├── content.js                # Content Script
│   ├── content.css               # Стили для content script
│   ├── popup.html/css/js         # Всплывающее окно
│   ├── options.html/css/js       # Страница настроек
│   └── icons/                    # Иконки расширения
├── LLM Server/                   # Сервер с ИИ-агентом
│   ├── server.py                 # Основной сервер
│   └── requirements.txt          # Python зависимости
├── MCP Servers/                  # MCP серверы
│   ├── playwright_mcp_server.py  # Playwright автоматизация
│   └── requirements_mcp.txt      # MCP зависимости
└── Deploy/                       # Развертывание
    ├── Dockerfile
    └── docker-compose.yml
```

## 🛠️ Установка и настройка

### Этап 1: Настройка Chrome Extension

1. **Загрузка расширения в Chrome:**
   ```bash
   # Клонируйте репозиторий
   git clone <repository-url>
   cd ai-assistant-chrome-extension
   ```

2. **Установка в Chrome:**
   - Откройте Chrome и перейдите в `chrome://extensions/`
   - Включите "Режим разработчика" в правом верхнем углу
   - Нажмите "Загрузить распакованное расширение"
   - Выберите папку с файлами расширения

3. **Первоначальная настройка:**
   - Кликните по иконке расширения
   - Перейдите в настройки (⚙️)
   - Настройте URL сервера (по умолчанию: `http://localhost:8000`)

### Этап 2: Развертывание LLM Server

1. **Установка зависимостей:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Запуск сервера:**
   ```bash
   python server.py
   # Или с настройками:
   python server.py --host 0.0.0.0 --port 8000 --debug
   ```

3. **Проверка работы:**
   ```bash
   curl http://localhost:8000/api/status
   ```

### Этап 3: Настройка MCP-серверов

1. **Установка MCP зависимостей:**
   ```bash
   pip install -r requirements_mcp.txt
   ```

2. **Установка Playwright:**
   ```bash
   playwright install
   ```

3. **Запуск Playwright MCP сервера:**
   ```bash
   python playwright_mcp_server.py --transport stdio
   ```

4. **Настройка в расширении:**
   - Откройте настройки расширения
   - Включите "MCP серверы"
   - Добавьте новый сервер:
     - **Название:** Playwright Server
     - **Команда:** `python playwright_mcp_server.py`
     - **Аргументы:** `--transport stdio`

## 🐳 Развертывание с Docker

1. **Сборка и запуск:**
   ```bash
   docker-compose up --build
   ```

2. **Проверка статуса:**
   ```bash
   curl http://localhost:8000/api/status
   ```

## 📖 Использование

### Основные возможности

1. **Анализ страницы:**
   - Используйте горячую клавишу `Ctrl+Shift+A`
   - Или кликните по иконке расширения → "Анализировать страницу"

2. **Выбор элементов:**
   - Удерживайте `Alt` и кликните по элементу на странице

3. **Чат с ИИ:**
   - Откройте popup расширения
   - Введите вопрос в поле чата

### Настройка LLM

Для подключения реального LLM (OpenAI, Anthropic, местная модель), отредактируйте `server.py`:

```python
# Пример интеграции с OpenAI
import openai

async def _generate_response(self, query: str, context: Dict[str, Any]) -> str:
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Ты помощник для анализа веб-страниц."},
            {"role": "user", "content": query}
        ]
    )
    return response.choices[0].message.content
```

### MCP команды

Playwright MCP сервер поддерживает следующие команды:

- `navigate_to_url(url)` - переход на URL
- `get_page_content()` - получение содержимого страницы
- `take_screenshot(filename)` - создание скриншота
- `extract_links()` - извлечение ссылок
- `click_element(selector)` - клик по элементу
- `fill_form_field(selector, value)` - заполнение формы
- `execute_javascript(code)` - выполнение JS кода

## ⚙️ Конфигурация

### Переменные окружения

```bash
# Сервер
SERVER_HOST=localhost
SERVER_PORT=8000
DEBUG=false

# API ключи (опционально)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# MCP настройки
MCP_ENABLED=true
MCP_TIMEOUT=30000
```

### Настройка расширения

В файле `options.html` можно настроить:
- URL сервера LLM-агента
- API ключи для аутентификации
- Список MCP серверов
- Языковые настройки
- Горячие клавиши

## 🔧 Разработка

### Структура Chrome Extension

- **manifest.json** - конфигурация Manifest V3
- **background.js** - Service Worker для API запросов
- **content.js** - взаимодействие с веб-страницами
- **popup.html/js** - пользовательский интерфейс
- **options.html/js** - страница настроек

### API сервера

**Основные endpoints:**
- `GET /api/status` - статус сервера
- `POST /api/query` - обработка запросов через LLM
- `POST /api/mcp` - выполнение MCP команд
- `WS /ws` - WebSocket соединение

### Добавление новых MCP серверов

1. Создайте новый файл сервера:
   ```python
   from mcp.server.fastmcp import FastMCP
   
   mcp = FastMCP("Your Server Name")
   
   @mcp.tool()
   async def your_tool(param: str) -> str:
       # Ваша логика
       return "result"
   
   if __name__ == "__main__":
       mcp.run(transport="stdio")
   ```

2. Добавьте сервер в настройки расширения

## 🚨 Безопасность

- Используйте HTTPS для продакшена
- Настройте API ключи для аутентификации
- Ограничьте CORS политики
- Валидируйте все входящие данные
- Используйте песочницу для выполнения кода

## 📝 Лицензия

MIT License - см. файл LICENSE

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

- GitHub Issues для багов и предложений
- Документация: [ссылка на docs]
- Примеры использования: [ссылка на examples]

## 🎯 Roadmap

- [ ] Интеграция с дополнительными LLM провайдерами
- [ ] Поддержка дополнительных MCP серверов
- [ ] Улучшенная аналитика и метрики
- [ ] Мобильная версия
- [ ] Плагины для других браузеров
- [ ] Облачная синхронизация настроек
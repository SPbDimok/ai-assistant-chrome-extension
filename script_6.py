# Создание MCP-сервера для Playwright

# playwright_mcp_server.py - MCP сервер для работы с Playwright
playwright_mcp_server_py = '''
#!/usr/bin/env python3
"""
Playwright MCP Server
MCP сервер для автоматизации браузера через Playwright
"""

import asyncio
import json
import logging
import os
import sys
import traceback
from typing import Any, Dict, List, Optional
from datetime import datetime

# MCP imports
try:
    from mcp.server.fastmcp import FastMCP
    from mcp.types import TextContent, ImageContent, EmbeddedResource
except ImportError:
    print("Error: MCP package not found. Install with: pip install mcp")
    sys.exit(1)

# Playwright imports
try:
    from playwright.async_api import async_playwright, Browser, BrowserContext, Page
except ImportError:
    print("Error: Playwright not found. Install with: pip install playwright")
    print("Then run: playwright install")
    sys.exit(1)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание MCP сервера
mcp = FastMCP("Playwright Browser Automation Server")

# Глобальные переменные для браузера
playwright_instance = None
browser: Optional[Browser] = None
context: Optional[BrowserContext] = None
current_page: Optional[Page] = None

async def init_browser():
    """Инициализация браузера Playwright"""
    global playwright_instance, browser, context, current_page
    
    try:
        if not playwright_instance:
            playwright_instance = await async_playwright().start()
            
        if not browser:
            # Запускаем браузер (можно выбрать chromium, firefox, webkit)
            browser = await playwright_instance.chromium.launch(
                headless=True,  # Можно изменить на False для отладки
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
        if not context:
            # Создаем контекст браузера
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            )
            
        if not current_page:
            # Создаем страницу
            current_page = await context.new_page()
            
        logger.info("Playwright browser initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize browser: {e}")
        return False

async def cleanup_browser():
    """Очистка ресурсов браузера"""
    global playwright_instance, browser, context, current_page
    
    try:
        if current_page:
            await current_page.close()
            current_page = None
            
        if context:
            await context.close()
            context = None
            
        if browser:
            await browser.close()
            browser = None
            
        if playwright_instance:
            await playwright_instance.stop()
            playwright_instance = None
            
        logger.info("Browser cleanup completed")
        
    except Exception as e:
        logger.error(f"Error during browser cleanup: {e}")

# MCP Tools

@mcp.tool()
async def navigate_to_url(url: str) -> str:
    """
    Переход на указанный URL
    
    Args:
        url: URL для перехода
    """
    try:
        await init_browser()
        
        if not current_page:
            return "Error: Browser page not available"
            
        await current_page.goto(url, wait_until='networkidle')
        title = await current_page.title()
        
        logger.info(f"Navigated to {url}")
        return f"Successfully navigated to {url}. Page title: {title}"
        
    except Exception as e:
        error_msg = f"Failed to navigate to {url}: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def get_page_content() -> str:
    """
    Получение содержимого текущей страницы
    """
    try:
        if not current_page:
            await init_browser()
            
        if not current_page:
            return "Error: No page available"
            
        # Получаем заголовок и URL
        title = await current_page.title()
        url = current_page.url
        
        # Получаем текстовое содержимое
        text_content = await current_page.inner_text('body')
        
        # Ограничиваем размер контента
        if len(text_content) > 5000:
            text_content = text_content[:5000] + "... (truncated)"
            
        result = {
            "title": title,
            "url": url,
            "content": text_content,
            "timestamp": datetime.now().isoformat()
        }
        
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Failed to get page content: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def take_screenshot(filename: str = "screenshot.png") -> str:
    """
    Создание скриншота текущей страницы
    
    Args:
        filename: Имя файла для сохранения скриншота
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        # Создаем папку для скриншотов если её нет
        os.makedirs("screenshots", exist_ok=True)
        filepath = os.path.join("screenshots", filename)
        
        await current_page.screenshot(path=filepath, full_page=True)
        
        logger.info(f"Screenshot saved to {filepath}")
        return f"Screenshot saved successfully to {filepath}"
        
    except Exception as e:
        error_msg = f"Failed to take screenshot: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def extract_links() -> str:
    """
    Извлечение всех ссылок со страницы
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        # Извлекаем все ссылки
        links = await current_page.evaluate("""
            () => {
                const links = Array.from(document.querySelectorAll('a[href]'));
                return links.map(link => ({
                    text: link.textContent.trim(),
                    href: link.href,
                    title: link.title || ''
                })).filter(link => link.text && link.href);
            }
        """)
        
        # Ограничиваем количество ссылок
        if len(links) > 50:
            links = links[:50]
            
        result = {
            "total_links": len(links),
            "links": links,
            "timestamp": datetime.now().isoformat()
        }
        
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Failed to extract links: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def extract_forms() -> str:
    """
    Извлечение информации о формах на странице
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        forms = await current_page.evaluate("""
            () => {
                const forms = Array.from(document.querySelectorAll('form'));
                return forms.map((form, index) => {
                    const inputs = Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
                        type: input.type || input.tagName.toLowerCase(),
                        name: input.name || '',
                        placeholder: input.placeholder || '',
                        required: input.required || false
                    }));
                    
                    return {
                        id: form.id || `form_${index}`,
                        action: form.action || '',
                        method: form.method || 'get',
                        inputs: inputs
                    };
                });
            }
        """)
        
        result = {
            "total_forms": len(forms),
            "forms": forms,
            "timestamp": datetime.now().isoformat()
        }
        
        return json.dumps(result, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Failed to extract forms: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def click_element(selector: str) -> str:
    """
    Клик по элементу на странице
    
    Args:
        selector: CSS селектор элемента
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        # Ждем появления элемента
        await current_page.wait_for_selector(selector, timeout=5000)
        
        # Кликаем по элементу
        await current_page.click(selector)
        
        logger.info(f"Clicked element: {selector}")
        return f"Successfully clicked element: {selector}"
        
    except Exception as e:
        error_msg = f"Failed to click element {selector}: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def fill_form_field(selector: str, value: str) -> str:
    """
    Заполнение поля формы
    
    Args:
        selector: CSS селектор поля
        value: Значение для ввода
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        # Ждем появления поля
        await current_page.wait_for_selector(selector, timeout=5000)
        
        # Очищаем и заполняем поле
        await current_page.fill(selector, value)
        
        logger.info(f"Filled field {selector} with value: {value}")
        return f"Successfully filled field {selector}"
        
    except Exception as e:
        error_msg = f"Failed to fill field {selector}: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def scroll_page(direction: str = "down", pixels: int = 500) -> str:
    """
    Прокрутка страницы
    
    Args:
        direction: Направление прокрутки (up/down)
        pixels: Количество пикселей для прокрутки
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        if direction.lower() == "down":
            await current_page.evaluate(f"window.scrollBy(0, {pixels})")
        elif direction.lower() == "up":
            await current_page.evaluate(f"window.scrollBy(0, -{pixels})")
        else:
            return "Error: Invalid direction. Use 'up' or 'down'"
            
        logger.info(f"Scrolled {direction} by {pixels} pixels")
        return f"Successfully scrolled {direction} by {pixels} pixels"
        
    except Exception as e:
        error_msg = f"Failed to scroll: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def wait_for_element(selector: str, timeout: int = 5000) -> str:
    """
    Ожидание появления элемента на странице
    
    Args:
        selector: CSS селектор элемента
        timeout: Таймаут ожидания в миллисекундах
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        await current_page.wait_for_selector(selector, timeout=timeout)
        
        logger.info(f"Element {selector} appeared")
        return f"Element {selector} is now visible"
        
    except Exception as e:
        error_msg = f"Element {selector} did not appear within {timeout}ms: {str(e)}"
        logger.error(error_msg)
        return error_msg

@mcp.tool()
async def execute_javascript(code: str) -> str:
    """
    Выполнение JavaScript кода на странице
    
    Args:
        code: JavaScript код для выполнения
    """
    try:
        if not current_page:
            return "Error: No page available"
            
        result = await current_page.evaluate(code)
        
        logger.info("JavaScript code executed successfully")
        return json.dumps({
            "success": True,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }, ensure_ascii=False, indent=2)
        
    except Exception as e:
        error_msg = f"Failed to execute JavaScript: {str(e)}"
        logger.error(error_msg)
        return json.dumps({
            "success": False,
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }, ensure_ascii=False, indent=2)

# MCP Resources

@mcp.resource("browser://status")
async def get_browser_status() -> str:
    """Получение статуса браузера"""
    try:
        status = {
            "browser_initialized": browser is not None,
            "context_available": context is not None,
            "page_available": current_page is not None,
            "current_url": current_page.url if current_page else None,
            "timestamp": datetime.now().isoformat()
        }
        
        return json.dumps(status, ensure_ascii=False, indent=2)
        
    except Exception as e:
        return json.dumps({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }, ensure_ascii=False, indent=2)

@mcp.resource("browser://page-info")
async def get_page_info() -> str:
    """Получение информации о текущей странице"""
    try:
        if not current_page:
            return json.dumps({"error": "No page available"}, ensure_ascii=False, indent=2)
            
        info = {
            "title": await current_page.title(),
            "url": current_page.url,
            "viewport": await current_page.viewport_size(),
            "timestamp": datetime.now().isoformat()
        }
        
        return json.dumps(info, ensure_ascii=False, indent=2)
        
    except Exception as e:
        return json.dumps({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }, ensure_ascii=False, indent=2)

# Обработчики событий
async def on_startup():
    """Инициализация при запуске сервера"""
    logger.info("Playwright MCP Server starting...")
    await init_browser()

async def on_shutdown():
    """Очистка при остановке сервера"""
    logger.info("Playwright MCP Server shutting down...")
    await cleanup_browser()

# Запуск сервера
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Playwright MCP Server")
    parser.add_argument("--transport", default="stdio", choices=["stdio", "http"], 
                       help="Transport method")
    parser.add_argument("--port", type=int, default=3000, help="Port for HTTP transport")
    parser.add_argument("--host", default="localhost", help="Host for HTTP transport")
    
    args = parser.parse_args()
    
    # Регистрируем обработчики
    import atexit
    atexit.register(lambda: asyncio.run(cleanup_browser()))
    
    try:
        # Инициализируем браузер
        asyncio.run(init_browser())
        
        # Запускаем MCP сервер
        logger.info(f"Starting Playwright MCP Server with {args.transport} transport")
        mcp.run(transport=args.transport)
        
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        traceback.print_exc()
    finally:
        # Очищаем ресурсы
        asyncio.run(cleanup_browser())
'''

# requirements_mcp.txt - зависимости для MCP сервера
requirements_mcp_txt = '''
# Playwright MCP Server Dependencies

# MCP framework
mcp>=0.1.0

# Browser automation
playwright>=1.40.0

# Async support
asyncio

# Logging
logging

# Standard library (no need to install)
# json
# os
# sys
# traceback
# datetime
# typing
'''

# Dockerfile для контейнеризации
dockerfile_content = '''
# Dockerfile для AI Assistant Server

FROM python:3.11-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \\
    curl \\
    wget \\
    gnupg \\
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
'''

# docker-compose.yml для простого развертывания
docker_compose_yml = '''
version: '3.8'

services:
  ai-assistant-server:
    build: .
    ports:
      - "8000:8000"
      - "3000:3000"
    environment:
      - DEBUG=false
      - LOG_LEVEL=info
    volumes:
      - ./screenshots:/app/screenshots
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Опционально: можно добавить базу данных
  # redis:
  #   image: redis:7-alpine
  #   ports:
  #     - "6379:6379"
  #   restart: unless-stopped
'''

# Сохраняем файлы
with open('playwright_mcp_server.py', 'w', encoding='utf-8') as f:
    f.write(playwright_mcp_server_py)

with open('requirements_mcp.txt', 'w', encoding='utf-8') as f:
    f.write(requirements_mcp_txt)

with open('Dockerfile', 'w', encoding='utf-8') as f:
    f.write(dockerfile_content)

with open('docker-compose.yml', 'w', encoding='utf-8') as f:
    f.write(docker_compose_yml)

print("Созданы файлы MCP сервера и развертывания:")
print("- playwright_mcp_server.py (MCP сервер для Playwright)")
print("- requirements_mcp.txt (зависимости для MCP)")
print("- Dockerfile (для контейнеризации)")
print("- docker-compose.yml (для простого развертывания)")
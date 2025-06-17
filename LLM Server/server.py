
#!/usr/bin/env python3
"""
AI Assistant LLM Agent Server
Сервер с ИИ-агентом для Chrome Extension AI Assistant
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Модели данных
class QueryRequest(BaseModel):
    query: str = Field(..., description="Запрос пользователя")
    context: Dict[str, Any] = Field(default_factory=dict, description="Контекст запроса")
    mcpEnabled: bool = Field(default=False, description="Включены ли MCP серверы")
    requestId: Optional[str] = Field(default=None, description="ID запроса")

class QueryResponse(BaseModel):
    response: str = Field(..., description="Ответ ИИ")
    requestId: Optional[str] = Field(default=None, description="ID запроса")
    mcpUsed: bool = Field(default=False, description="Использовались ли MCP серверы")
    timestamp: datetime = Field(default_factory=datetime.now)

class MCPCommandRequest(BaseModel):
    action: str = Field(..., description="Действие MCP")
    command: str = Field(..., description="Команда MCP")
    params: Dict[str, Any] = Field(default_factory=dict, description="Параметры команды")

class ServerStatus(BaseModel):
    name: str = "AI Assistant LLM Agent"
    version: str = "1.0.0"
    status: str = "running"
    mcpServers: List[str] = Field(default_factory=list)
    connections: int = 0

@dataclass
class ConnectionInfo:
    """Информация о подключении клиента"""
    id: str
    websocket: WebSocket
    connected_at: datetime
    last_activity: datetime

class LLMAgent:
    """Основной класс LLM-агента"""

    def __init__(self):
        self.name = "AI Assistant Agent"
        self.version = "1.0.0"
        self.mcp_enabled = True
        self.connections: Dict[str, ConnectionInfo] = {}

    async def process_query(self, request: QueryRequest) -> QueryResponse:
        """Обработка запроса через LLM"""
        try:
            # Здесь должна быть интеграция с реальным LLM
            # Для демонстрации используем заглушку
            response_text = await self._generate_response(request.query, request.context)

            # Проверяем, нужно ли использовать MCP серверы
            mcp_used = False
            if request.mcpEnabled:
                mcp_response = await self._handle_mcp_request(request)
                if mcp_response:
                    response_text += "\n\n" + mcp_response
                    mcp_used = True

            return QueryResponse(
                response=response_text,
                requestId=request.requestId,
                mcpUsed=mcp_used
            )

        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return QueryResponse(
                response=f"Извините, произошла ошибка при обработке запроса: {str(e)}",
                requestId=request.requestId,
                mcpUsed=False
            )

    async def _generate_response(self, query: str, context: Dict[str, Any]) -> str:
        """Генерация ответа через LLM (заглушка)"""
        # В реальной реализации здесь должен быть вызов OpenAI API, Anthropic API, или локальной модели

        # Анализируем тип запроса
        query_lower = query.lower()

        if "анализ" in query_lower or "анализ" in query_lower:
            return await self._analyze_page(context)
        elif "суммир" in query_lower or "краткое" in query_lower:
            return await self._summarize_content(context)
        elif "извлек" in query_lower or "данные" in query_lower:
            return await self._extract_data(context)
        else:
            return await self._general_response(query, context)

    async def _analyze_page(self, context: Dict[str, Any]) -> str:
        """Анализ веб-страницы"""
        page_data = context.get('pageData', {})
        title = page_data.get('title', 'Неизвестная страница')
        url = context.get('url', 'Неизвестный URL')

        response = f"📄 **Анализ страницы: {title}**\n\n"
        response += f"🔗 URL: {url}\n\n"

        if 'headings' in page_data:
            headings = page_data['headings'][:5]  # Берем первые 5 заголовков
            response += "📋 **Основные разделы:**\n"
            for heading in headings:
                response += f"• {heading['text']}\n"
            response += "\n"

        if 'metaDescription' in page_data and page_data['metaDescription']:
            response += f"📝 **Описание:** {page_data['metaDescription']}\n\n"

        response += "✅ **Заключение:** Страница содержит структурированную информацию и доступна для анализа."

        return response

    async def _summarize_content(self, context: Dict[str, Any]) -> str:
        """Создание краткого изложения"""
        text_content = context.get('textContent', '')
        title = context.get('pageData', {}).get('title', 'Контент')

        # Простое суммирование - берем первые предложения
        sentences = text_content.split('.')[:5]
        summary = '. '.join(sentence.strip() for sentence in sentences if sentence.strip())

        response = f"📝 **Краткое изложение: {title}**\n\n"
        response += f"{summary}...\n\n"
        response += "💡 **Примечание:** Это автоматически сгенерированное краткое изложение. Для более точного анализа рекомендуется использовать полную LLM модель."

        return response

    async def _extract_data(self, context: Dict[str, Any]) -> str:
        """Извлечение структурированных данных"""
        structured_data = context.get('structuredData', {})

        response = "📊 **Извлеченные данные:**\n\n"

        # Контакты
        contacts = structured_data.get('contacts', {})
        if contacts:
            response += "📞 **Контактная информация:**\n"
            if 'emails' in contacts:
                response += f"• Email: {', '.join(contacts['emails'][:3])}\n"
            if 'phones' in contacts:
                response += f"• Телефоны: {', '.join(contacts['phones'][:3])}\n"
            response += "\n"

        # Цены
        prices = structured_data.get('prices', [])
        if prices:
            response += f"💰 **Найденные цены:** {', '.join(prices[:5])}\n\n"

        # Таблицы
        tables = structured_data.get('tables', [])
        if tables:
            response += f"📋 **Таблицы:** Найдено {len(tables)} таблиц с данными\n\n"

        # Списки
        lists = structured_data.get('lists', [])
        if lists:
            response += f"📝 **Списки:** Найдено {len(lists)} списков\n\n"

        if not any([contacts, prices, tables, lists]):
            response += "ℹ️ Структурированные данные на странице не обнаружены."

        return response

    async def _general_response(self, query: str, context: Dict[str, Any]) -> str:
        """Общий ответ на вопрос"""
        response = f"🤖 **Ответ на ваш вопрос:** {query}\n\n"
        response += "Извините, но в демонстрационной версии я могу только анализировать веб-страницы, создавать краткие изложения и извлекать данные.\n\n"
        response += "Для полноценной работы необходимо подключить настоящую LLM модель (GPT-4, Claude, Llama и т.д.).\n\n"
        response += "🔧 **Доступные команды:**\n"
        response += "• Анализировать страницу\n"
        response += "• Суммировать контент\n"
        response += "• Извлечь данные\n"

        return response

    async def _handle_mcp_request(self, request: QueryRequest) -> Optional[str]:
        """Обработка запроса через MCP серверы"""
        # В реальной реализации здесь должно быть взаимодействие с MCP серверами
        # Для демонстрации возвращаем заглушку

        if "playwright" in request.query.lower() or "автоматиз" in request.query.lower():
            return "🎭 **MCP Playwright:** Готов к автоматизации браузера и веб-скрапингу."

        return None

    def add_connection(self, websocket: WebSocket) -> str:
        """Добавление нового WebSocket подключения"""
        connection_id = str(uuid.uuid4())
        self.connections[connection_id] = ConnectionInfo(
            id=connection_id,
            websocket=websocket,
            connected_at=datetime.now(),
            last_activity=datetime.now()
        )
        logger.info(f"New connection: {connection_id}")
        return connection_id

    def remove_connection(self, connection_id: str):
        """Удаление WebSocket подключения"""
        if connection_id in self.connections:
            del self.connections[connection_id]
            logger.info(f"Connection removed: {connection_id}")

    def update_activity(self, connection_id: str):
        """Обновление времени активности соединения"""
        if connection_id in self.connections:
            self.connections[connection_id].last_activity = datetime.now()

# Создание FastAPI приложения
app = FastAPI(
    title="AI Assistant LLM Agent Server",
    description="Сервер с ИИ-агентом для Chrome Extension",
    version="1.0.0"
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация агента
agent = LLMAgent()

# Безопасность (опционально)
security = HTTPBearer(auto_error=False)

async def get_api_key(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Проверка API ключа (опционально)"""
    # Здесь можно добавить проверку API ключа
    return credentials

# API Endpoints

@app.get("/api/status", response_model=ServerStatus)
async def get_status():
    """Получение статуса сервера"""
    return ServerStatus(
        mcpServers=["playwright-mcp", "file-system-mcp"],
        connections=len(agent.connections)
    )

@app.post("/api/query", response_model=QueryResponse)
async def process_query(
    request: QueryRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(get_api_key)
):
    """Обработка запроса через LLM"""
    return await agent.process_query(request)

@app.post("/api/mcp")
async def handle_mcp_command(
    request: MCPCommandRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(get_api_key)
):
    """Обработка команд MCP"""
    try:
        # В реальной реализации здесь должно быть взаимодействие с MCP серверами
        result = {
            "action": request.action,
            "command": request.command,
            "result": "MCP command executed successfully (demo)",
            "timestamp": datetime.now().isoformat()
        }

        logger.info(f"MCP command executed: {request.command}")
        return {"success": True, "data": result}

    except Exception as e:
        logger.error(f"MCP command error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket соединение для реального времени"""
    await websocket.accept()
    connection_id = agent.add_connection(websocket)

    try:
        while True:
            # Получаем сообщение от клиента
            data = await websocket.receive_text()
            message = json.loads(data)

            # Обновляем время активности
            agent.update_activity(connection_id)

            if message.get('type') == 'keepalive':
                # Отвечаем на keepalive
                await websocket.send_text(json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))
            elif message.get('type') == 'query':
                # Обрабатываем запрос
                request = QueryRequest(**message)
                response = await agent.process_query(request)

                await websocket.send_text(json.dumps({
                    'type': 'response',
                    'requestId': request.requestId,
                    'data': asdict(response)
                }))
            else:
                # Обрабатываем как обычный запрос
                request = QueryRequest(**message)
                response = await agent.process_query(request)

                response_data = {
                    'requestId': request.requestId,
                    'response': response.response,
                    'mcpUsed': response.mcpUsed,
                    'timestamp': response.timestamp.isoformat()
                }

                await websocket.send_text(json.dumps(response_data))

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        agent.remove_connection(connection_id)

# Дополнительные endpoints

@app.get("/api/connections")
async def get_connections():
    """Получение информации о подключениях"""
    connections_info = []
    for conn_id, conn in agent.connections.items():
        connections_info.append({
            'id': conn_id,
            'connected_at': conn.connected_at.isoformat(),
            'last_activity': conn.last_activity.isoformat()
        })

    return {
        'total': len(agent.connections),
        'connections': connections_info
    }

@app.get("/")
async def root():
    """Корневая страница"""
    return {
        "message": "AI Assistant LLM Agent Server",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    # Настройки сервера
    import argparse

    parser = argparse.ArgumentParser(description="AI Assistant LLM Agent Server")
    parser.add_argument("--host", default="localhost", help="Host address")
    parser.add_argument("--port", type=int, default=8000, help="Port number")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")

    args = parser.parse_args()

    # Запуск сервера
    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.debug,
        log_level="info"
    )

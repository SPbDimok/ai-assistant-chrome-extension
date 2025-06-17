# Создание страницы настроек Chrome Extension

# 8. options.html - Страница настроек
options_html = '''
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Assistant - Настройки</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="options-container">
    <div class="header">
      <h1>🤖 AI Assistant - Настройки</h1>
      <p>Настройте подключение к вашему LLM-серверу и MCP-серверам</p>
    </div>
    
    <div class="settings-section">
      <div class="section-title">🌐 Подключение к серверу</div>
      <div class="form-group">
        <label for="server-url">URL сервера LLM-агента:</label>
        <input type="url" id="server-url" placeholder="http://localhost:8000" />
        <div class="help-text">
          Введите URL вашего сервера с LLM-агентом. По умолчанию: http://localhost:8000
        </div>
      </div>
      
      <div class="form-group">
        <label for="api-key">API ключ (если требуется):</label>
        <input type="password" id="api-key" placeholder="Введите API ключ..." />
        <div class="help-text">
          Опциональный API ключ для аутентификации на сервере
        </div>
      </div>
      
      <div class="form-group">
        <button id="test-connection" class="btn primary">🔍 Проверить соединение</button>
        <div id="connection-result" class="connection-status"></div>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="section-title">🔧 MCP серверы</div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="mcp-enabled" />
          <span class="checkmark"></span>
          Включить поддержку MCP серверов
        </label>
        <div class="help-text">
          Model Context Protocol позволяет LLM взаимодействовать с внешними инструментами
        </div>
      </div>
      
      <div id="mcp-settings" class="mcp-settings-container">
        <div class="mcp-server-list">
          <div class="subsection-title">Список MCP серверов:</div>
          <div id="mcp-servers">
            <!-- Серверы будут добавлены динамически -->
          </div>
          <button id="add-mcp-server" class="btn secondary">➕ Добавить MCP сервер</button>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="section-title">⚙️ Общие настройки</div>
      
      <div class="form-group">
        <label for="response-language">Язык ответов:</label>
        <select id="response-language">
          <option value="ru">Русский</option>
          <option value="en">English</option>
          <option value="auto">Автоопределение</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="auto-analyze" />
          <span class="checkmark"></span>
          Автоматический анализ страниц
        </label>
        <div class="help-text">
          Автоматически анализировать страницы при их загрузке
        </div>
      </div>
      
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" id="debug-mode" />
          <span class="checkmark"></span>
          Режим отладки
        </label>
        <div class="help-text">
          Включить подробное логирование в консоли разработчика
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <div class="section-title">💡 Быстрые команды</div>
      <div class="form-group">
        <label for="hotkey-toggle">Горячая клавиша для вызова панели:</label>
        <input type="text" id="hotkey-toggle" readonly value="Ctrl+Shift+A" />
      </div>
      
      <div class="form-group">
        <label for="hotkey-analyze">Горячая клавиша для анализа элемента:</label>
        <input type="text" id="hotkey-analyze" readonly value="Alt+Click" />
      </div>
    </div>
    
    <div class="actions">
      <button id="save-settings" class="btn primary large">💾 Сохранить настройки</button>
      <button id="reset-settings" class="btn secondary">🔄 Сбросить к умолчаниям</button>
      <div id="save-status" class="save-status"></div>
    </div>
    
    <div class="settings-section">
      <div class="section-title">ℹ️ Информация</div>
      <div class="info-grid">
        <div class="info-item">
          <strong>Версия расширения:</strong>
          <span id="extension-version">1.0.0</span>
        </div>
        <div class="info-item">
          <strong>Статус соединения:</strong>
          <span id="connection-info">Не подключено</span>
        </div>
        <div class="info-item">
          <strong>Активных MCP серверов:</strong>
          <span id="mcp-count">0</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Модальное окно для добавления MCP сервера -->
  <div id="add-mcp-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Добавить MCP сервер</h3>
        <span class="close" id="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="mcp-name">Название сервера:</label>
          <input type="text" id="mcp-name" placeholder="Например: Playwright Server" />
        </div>
        <div class="form-group">
          <label for="mcp-command">Команда запуска:</label>
          <input type="text" id="mcp-command" placeholder="npx @executeautomation/playwright-mcp-server" />
        </div>
        <div class="form-group">
          <label for="mcp-args">Аргументы (необязательно):</label>
          <input type="text" id="mcp-args" placeholder="--port 3000" />
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="mcp-auto-start" checked />
            <span class="checkmark"></span>
            Автоматически запускать
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button id="save-mcp-server" class="btn primary">Сохранить</button>
        <button id="cancel-mcp" class="btn secondary">Отмена</button>
      </div>
    </div>
  </div>
  
  <script src="options.js"></script>
</body>
</html>
'''

# 9. options.css - Стили для страницы настроек
options_css = '''
/* Стили для страницы настроек AI Assistant */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8f9fa;
  color: #202124;
  line-height: 1.5;
}

.options-container {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
  padding: 30px;
  text-align: center;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 400;
}

.header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.settings-section {
  padding: 30px;
  border-bottom: 1px solid #e8eaed;
}

.settings-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 20px;
  color: #1a73e8;
}

.subsection-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #5f6368;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #3c4043;
}

.form-group input[type="text"],
.form-group input[type="url"],
.form-group input[type="password"],
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4285f4;
}

.help-text {
  margin-top: 5px;
  font-size: 12px;
  color: #5f6368;
}

/* Кастомные чекбоксы */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal !important;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #dadce0;
  border-radius: 4px;
  margin-right: 12px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked + .checkmark {
  background: #4285f4;
  border-color: #4285f4;
}

.checkbox-label input:checked + .checkmark:after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 14px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* Кнопки */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn.primary {
  background: #4285f4;
  color: white;
}

.btn.primary:hover {
  background: #3367d6;
}

.btn.secondary {
  background: #f8f9fa;
  color: #3c4043;
  border: 1px solid #dadce0;
}

.btn.secondary:hover {
  background: #e8f0fe;
}

.btn.large {
  padding: 16px 32px;
  font-size: 16px;
}

/* MCP серверы */
.mcp-settings-container {
  margin-top: 15px;
  display: none;
}

.mcp-settings-container.enabled {
  display: block;
}

.mcp-server-item {
  background: #f8f9fa;
  border: 1px solid #e8eaed;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mcp-server-info {
  flex: 1;
}

.mcp-server-name {
  font-weight: 500;
  margin-bottom: 5px;
}

.mcp-server-command {
  font-size: 12px;
  color: #5f6368;
  font-family: monospace;
}

.mcp-server-actions {
  display: flex;
  gap: 10px;
}

.mcp-server-actions button {
  padding: 6px 12px;
  font-size: 12px;
}

/* Статусы */
.connection-status {
  margin-top: 10px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
}

.connection-status.success {
  background: #e8f5e8;
  color: #137333;
  border: 1px solid #c6f6d5;
}

.connection-status.error {
  background: #fce8e6;
  color: #d93025;
  border: 1px solid #f9b9b7;
}

.save-status {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  display: none;
}

.save-status.success {
  background: #e8f5e8;
  color: #137333;
  display: block;
}

.save-status.error {
  background: #fce8e6;
  color: #d93025;
  display: block;
}

/* Действия */
.actions {
  padding: 30px;
  background: #f8f9fa;
  text-align: center;
}

.actions .btn {
  margin: 0 10px;
}

/* Информационная сетка */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e8eaed;
}

.info-item strong {
  display: block;
  margin-bottom: 5px;
  color: #3c4043;
}

/* Модальное окно */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: white;
  margin: 10% auto;
  padding: 0;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e8eaed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #3c4043;
}

.close {
  color: #5f6368;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover {
  color: #202124;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e8eaed;
  text-align: right;
}

.modal-footer .btn {
  margin-left: 10px;
}

/* Адаптивность */
@media (max-width: 600px) {
  body {
    padding: 10px;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .header {
    padding: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .actions .btn {
    display: block;
    margin: 10px 0;
    width: 100%;
  }
}
'''

# Сохраняем файлы
with open('options.html', 'w', encoding='utf-8') as f:
    f.write(options_html)

with open('options.css', 'w', encoding='utf-8') as f:
    f.write(options_css)

print("Созданы файлы настроек:")
print("- options.html (страница настроек)")
print("- options.css (стили для настроек)")
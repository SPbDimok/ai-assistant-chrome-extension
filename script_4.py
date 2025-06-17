# Создание JavaScript для страницы настроек и иконок расширения

# 10. options.js - JavaScript для страницы настроек
options_js = '''
// JavaScript для страницы настроек AI Assistant
class AIAssistantOptions {
  constructor() {
    this.serverUrl = document.getElementById('server-url');
    this.apiKey = document.getElementById('api-key');
    this.mcpEnabled = document.getElementById('mcp-enabled');
    this.responseLanguage = document.getElementById('response-language');
    this.autoAnalyze = document.getElementById('auto-analyze');
    this.debugMode = document.getElementById('debug-mode');
    this.testConnectionButton = document.getElementById('test-connection');
    this.saveSettingsButton = document.getElementById('save-settings');
    this.resetSettingsButton = document.getElementById('reset-settings');
    this.addMcpServerButton = document.getElementById('add-mcp-server');
    this.mcpServersContainer = document.getElementById('mcp-servers');
    this.mcpSettingsContainer = document.getElementById('mcp-settings');
    this.saveStatus = document.getElementById('save-status');
    this.connectionResult = document.getElementById('connection-result');
    this.connectionInfo = document.getElementById('connection-info');
    this.mcpCount = document.getElementById('mcp-count');
    this.extensionVersion = document.getElementById('extension-version');
    
    // Модальное окно
    this.modal = document.getElementById('add-mcp-modal');
    this.closeModal = document.getElementById('close-modal');
    this.saveMcpServerButton = document.getElementById('save-mcp-server');
    this.cancelMcpButton = document.getElementById('cancel-mcp');
    
    // Поля модального окна
    this.mcpName = document.getElementById('mcp-name');
    this.mcpCommand = document.getElementById('mcp-command');
    this.mcpArgs = document.getElementById('mcp-args');
    this.mcpAutoStart = document.getElementById('mcp-auto-start');
    
    this.mcpServers = [];
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.attachEventListeners();
    this.checkConnectionStatus();
    this.displayExtensionInfo();
  }

  attachEventListeners() {
    this.testConnectionButton.addEventListener('click', () => {
      this.testConnection();
    });
    
    this.saveSettingsButton.addEventListener('click', () => {
      this.saveSettings();
    });
    
    this.resetSettingsButton.addEventListener('click', () => {
      this.resetSettings();
    });
    
    this.mcpEnabled.addEventListener('change', (e) => {
      this.toggleMcpSettings(e.target.checked);
    });
    
    this.addMcpServerButton.addEventListener('click', () => {
      this.showAddMcpModal();
    });
    
    // Модальное окно
    this.closeModal.addEventListener('click', () => {
      this.hideModal();
    });
    
    this.saveMcpServerButton.addEventListener('click', () => {
      this.addMcpServer();
    });
    
    this.cancelMcpButton.addEventListener('click', () => {
      this.hideModal();
    });
    
    // Закрытие модального окна при клике вне его области
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });
  }

  async loadSettings() {
    // Загружаем настройки из chrome.storage
    const settings = await chrome.storage.sync.get([
      'serverUrl',
      'apiKey',
      'mcpEnabled',
      'mcpServers',
      'responseLanguage',
      'autoAnalyze',
      'debugMode'
    ]);
    
    // Применяем настройки к полям
    this.serverUrl.value = settings.serverUrl || 'http://localhost:8000';
    this.apiKey.value = settings.apiKey || '';
    this.mcpEnabled.checked = settings.mcpEnabled || false;
    this.responseLanguage.value = settings.responseLanguage || 'ru';
    this.autoAnalyze.checked = settings.autoAnalyze || false;
    this.debugMode.checked = settings.debugMode || false;
    
    // Настройки MCP серверов
    this.mcpServers = settings.mcpServers || [];
    this.renderMcpServers();
    this.toggleMcpSettings(this.mcpEnabled.checked);
    
    // Обновляем счетчик MCP серверов
    this.mcpCount.textContent = this.mcpServers.length;
  }

  async saveSettings() {
    try {
      const settings = {
        serverUrl: this.serverUrl.value.trim(),
        apiKey: this.apiKey.value,
        mcpEnabled: this.mcpEnabled.checked,
        mcpServers: this.mcpServers,
        responseLanguage: this.responseLanguage.value,
        autoAnalyze: this.autoAnalyze.checked,
        debugMode: this.debugMode.checked
      };
      
      await chrome.storage.sync.set(settings);
      
      this.showSaveStatus('Настройки успешно сохранены!', 'success');
    } catch (error) {
      this.showSaveStatus('Ошибка сохранения настроек: ' + error.message, 'error');
    }
  }

  resetSettings() {
    if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
      this.serverUrl.value = 'http://localhost:8000';
      this.apiKey.value = '';
      this.mcpEnabled.checked = false;
      this.responseLanguage.value = 'ru';
      this.autoAnalyze.checked = false;
      this.debugMode.checked = false;
      
      this.mcpServers = [];
      this.renderMcpServers();
      this.toggleMcpSettings(false);
      
      this.saveSettings();
    }
  }

  async testConnection() {
    const url = this.serverUrl.value.trim();
    if (!url) {
      this.showConnectionResult('Введите URL сервера', 'error');
      return;
    }
    
    try {
      this.connectionResult.textContent = 'Проверка соединения...';
      this.connectionResult.className = 'connection-status';
      
      const response = await fetch(url + '/api/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey.value
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showConnectionResult(`Успешное соединение! Сервер: ${data.name || 'LLM Agent'}, Версия: ${data.version || 'Unknown'}`, 'success');
        this.connectionInfo.textContent = 'Подключено';
      } else {
        this.showConnectionResult(`Ошибка соединения: ${response.status} ${response.statusText}`, 'error');
        this.connectionInfo.textContent = 'Не подключено';
      }
    } catch (error) {
      this.showConnectionResult(`Не удалось подключиться к серверу: ${error.message}`, 'error');
      this.connectionInfo.textContent = 'Не подключено';
    }
  }

  showConnectionResult(message, type) {
    this.connectionResult.textContent = message;
    this.connectionResult.className = `connection-status ${type}`;
  }

  async checkConnectionStatus() {
    try {
      const settings = await chrome.storage.sync.get(['serverUrl', 'apiKey']);
      if (!settings.serverUrl) {
        this.connectionInfo.textContent = 'Не настроено';
        return;
      }
      
      const response = await fetch(settings.serverUrl + '/api/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': settings.apiKey || ''
        }
      });
      
      if (response.ok) {
        this.connectionInfo.textContent = 'Подключено';
      } else {
        this.connectionInfo.textContent = 'Ошибка соединения';
      }
    } catch (error) {
      this.connectionInfo.textContent = 'Не подключено';
    }
  }

  displayExtensionInfo() {
    // Получаем версию расширения
    const manifest = chrome.runtime.getManifest();
    this.extensionVersion.textContent = manifest.version || '1.0.0';
  }

  toggleMcpSettings(enabled) {
    if (enabled) {
      this.mcpSettingsContainer.classList.add('enabled');
    } else {
      this.mcpSettingsContainer.classList.remove('enabled');
    }
  }

  renderMcpServers() {
    this.mcpServersContainer.innerHTML = '';
    
    if (this.mcpServers.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'Нет настроенных MCP серверов. Добавьте сервер, нажав кнопку ниже.';
      this.mcpServersContainer.appendChild(emptyMessage);
      return;
    }
    
    this.mcpServers.forEach((server, index) => {
      const serverElement = document.createElement('div');
      serverElement.className = 'mcp-server-item';
      
      const serverInfo = document.createElement('div');
      serverInfo.className = 'mcp-server-info';
      
      const serverName = document.createElement('div');
      serverName.className = 'mcp-server-name';
      serverName.textContent = server.name;
      
      const serverCommand = document.createElement('div');
      serverCommand.className = 'mcp-server-command';
      serverCommand.textContent = `$ ${server.command} ${server.args || ''}`;
      
      serverInfo.appendChild(serverName);
      serverInfo.appendChild(serverCommand);
      
      const serverActions = document.createElement('div');
      serverActions.className = 'mcp-server-actions';
      
      const editButton = document.createElement('button');
      editButton.className = 'btn secondary';
      editButton.textContent = 'Редактировать';
      editButton.addEventListener('click', () => {
        this.editMcpServer(index);
      });
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn secondary';
      deleteButton.textContent = 'Удалить';
      deleteButton.addEventListener('click', () => {
        this.deleteMcpServer(index);
      });
      
      serverActions.appendChild(editButton);
      serverActions.appendChild(deleteButton);
      
      serverElement.appendChild(serverInfo);
      serverElement.appendChild(serverActions);
      
      this.mcpServersContainer.appendChild(serverElement);
    });
  }

  showAddMcpModal() {
    // Очищаем поля формы
    this.mcpName.value = '';
    this.mcpCommand.value = '';
    this.mcpArgs.value = '';
    this.mcpAutoStart.checked = true;
    
    // Показываем модальное окно
    this.modal.style.display = 'block';
  }

  hideModal() {
    this.modal.style.display = 'none';
  }

  addMcpServer() {
    const name = this.mcpName.value.trim();
    const command = this.mcpCommand.value.trim();
    
    if (!name || !command) {
      alert('Пожалуйста, заполните обязательные поля: название и команда.');
      return;
    }
    
    const server = {
      name: name,
      command: command,
      args: this.mcpArgs.value.trim(),
      autoStart: this.mcpAutoStart.checked
    };
    
    this.mcpServers.push(server);
    this.renderMcpServers();
    this.hideModal();
    
    // Обновляем счетчик
    this.mcpCount.textContent = this.mcpServers.length;
  }

  editMcpServer(index) {
    const server = this.mcpServers[index];
    
    // Заполняем поля формы
    this.mcpName.value = server.name;
    this.mcpCommand.value = server.command;
    this.mcpArgs.value = server.args || '';
    this.mcpAutoStart.checked = server.autoStart !== false;
    
    // Показываем модальное окно
    this.modal.style.display = 'block';
    
    // Сохраняем индекс редактируемого сервера
    this.editingServerIndex = index;
    
    // Заменяем обработчик сохранения
    this.saveMcpServerButton.removeEventListener('click', this.addMcpServer);
    this.saveMcpServerButton.addEventListener('click', () => {
      this.updateMcpServer(index);
    });
  }

  updateMcpServer(index) {
    const name = this.mcpName.value.trim();
    const command = this.mcpCommand.value.trim();
    
    if (!name || !command) {
      alert('Пожалуйста, заполните обязательные поля: название и команда.');
      return;
    }
    
    this.mcpServers[index] = {
      name: name,
      command: command,
      args: this.mcpArgs.value.trim(),
      autoStart: this.mcpAutoStart.checked
    };
    
    this.renderMcpServers();
    this.hideModal();
    
    // Восстанавливаем стандартный обработчик
    this.saveMcpServerButton.removeEventListener('click', this.updateMcpServer);
    this.saveMcpServerButton.addEventListener('click', () => {
      this.addMcpServer();
    });
  }

  deleteMcpServer(index) {
    if (confirm(`Вы уверены, что хотите удалить сервер "${this.mcpServers[index].name}"?`)) {
      this.mcpServers.splice(index, 1);
      this.renderMcpServers();
      
      // Обновляем счетчик
      this.mcpCount.textContent = this.mcpServers.length;
    }
  }

  showSaveStatus(message, type) {
    this.saveStatus.textContent = message;
    this.saveStatus.className = `save-status ${type}`;
    
    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
      this.saveStatus.className = 'save-status';
    }, 3000);
  }
}

// Инициализация страницы настроек при загрузке
document.addEventListener('DOMContentLoaded', () => {
  new AIAssistantOptions();
});
'''

# Создаем директорию для иконок
import os
os.makedirs('icons', exist_ok=True)

# 11. Создаем простые цветные иконки через Python
import base64
from io import BytesIO
from PIL import Image, ImageDraw

# Функция для создания иконки с размером и сохранения
def create_icon(size, color="#4285f4", filename=None):
    # Создаем новый RGB образ с белым фоном
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Рисуем круг (эллипс) в центре с нужным цветом
    margin = int(size * 0.1)
    draw.ellipse(
        [(margin, margin), (size - margin, size - margin)],
        fill=color
    )
    
    # Рисуем "робота" - два глаза и линию рта
    eye_size = int(size * 0.12)
    eye_margin = int(size * 0.25)
    eye_top = int(size * 0.35)
    
    # Левый глаз
    left_eye_left = eye_margin
    left_eye_top = eye_top
    draw.rectangle(
        [(left_eye_left, left_eye_top), 
         (left_eye_left + eye_size, left_eye_top + eye_size)],
        fill="white"
    )
    
    # Правый глаз
    right_eye_left = size - eye_margin - eye_size
    right_eye_top = eye_top
    draw.rectangle(
        [(right_eye_left, right_eye_top), 
         (right_eye_left + eye_size, right_eye_top + eye_size)],
        fill="white"
    )
    
    # Рот
    mouth_top = int(size * 0.6)
    mouth_height = int(size * 0.1)
    mouth_left = int(size * 0.25)
    mouth_right = int(size * 0.75)
    
    draw.rectangle(
        [(mouth_left, mouth_top), (mouth_right, mouth_top + mouth_height)],
        fill="white"
    )
    
    # Сохраняем изображение
    if filename:
        img.save(filename, 'PNG')
    
    return img

# Создаем иконки разных размеров
icon_sizes = {
    16: "icons/icon16.png",
    32: "icons/icon32.png",
    48: "icons/icon48.png",
    128: "icons/icon128.png"
}

for size, filename in icon_sizes.items():
    create_icon(size, "#4285f4", filename)

# Сохраняем options.js
with open('options.js', 'w', encoding='utf-8') as f:
    f.write(options_js)

print("Созданы файлы:")
print("- options.js (JavaScript для страницы настроек)")
print("- Иконки расширения:")
for size, filename in icon_sizes.items():
    print(f"  - {filename} ({size}x{size}px)")
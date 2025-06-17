
// Content Script для взаимодействия с веб-страницами
class AIAssistantContent {
  constructor() {
    this.initialized = false;
    this.selectedElement = null;
    this.aiPanel = null;
    this.isAnalyzing = false;

    this.init();
  }

  init() {
    if (this.initialized) return;

    this.createAIPanel();
    this.attachEventListeners();
    this.initialized = true;

    console.log('AI Assistant Content Script initialized');
  }

  createAIPanel() {
    // Создаем плавающую панель AI Assistant
    this.aiPanel = document.createElement('div');
    this.aiPanel.id = 'ai-assistant-panel';
    this.aiPanel.innerHTML = `
      <div class="ai-panel-header">
        <span>🤖 AI Assistant</span>
        <button id="ai-panel-close">×</button>
      </div>
      <div class="ai-panel-content">
        <div id="ai-response-area">Выберите элемент на странице для анализа</div>
        <div class="ai-panel-controls">
          <button id="ai-analyze-page">Анализировать страницу</button>
          <button id="ai-summarize">Суммировать</button>
          <button id="ai-extract-data">Извлечь данные</button>
        </div>
      </div>
    `;

    this.aiPanel.style.display = 'none';
    document.body.appendChild(this.aiPanel);
  }

  attachEventListeners() {
    // Обработчик выбора элементов на странице
    document.addEventListener('click', (e) => {
      if (e.altKey && !e.target.closest('#ai-assistant-panel')) {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
      }
    });

    // Обработчик горячих клавиш
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        this.togglePanel();
      }
    });

    // Обработчики кнопок панели
    document.addEventListener('click', (e) => {
      if (e.target.id === 'ai-panel-close') {
        this.hidePanel();
      } else if (e.target.id === 'ai-analyze-page') {
        this.analyzePage();
      } else if (e.target.id === 'ai-summarize') {
        this.summarizePage();
      } else if (e.target.id === 'ai-extract-data') {
        this.extractData();
      }
    });

    // Слушатель сообщений от background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });

    // Обработчик контекстного меню
    document.addEventListener('contextmenu', (e) => {
      this.selectedElement = e.target;
    });
  }

  selectElement(element) {
    // Убираем выделение с предыдущего элемента
    if (this.selectedElement) {
      this.selectedElement.classList.remove('ai-selected');
    }

    // Выделяем новый элемент
    this.selectedElement = element;
    element.classList.add('ai-selected');

    // Показываем панель рядом с элементом
    this.showPanelNearElement(element);

    // Отправляем информацию об элементе для анализа
    this.analyzeElement(element);
  }

  showPanelNearElement(element) {
    const rect = element.getBoundingClientRect();
    const panelWidth = 300;
    const panelHeight = 200;

    let left = rect.right + 10;
    let top = rect.top;

    // Проверяем, не выходит ли панель за пределы экрана
    if (left + panelWidth > window.innerWidth) {
      left = rect.left - panelWidth - 10;
    }
    if (top + panelHeight > window.innerHeight) {
      top = window.innerHeight - panelHeight - 10;
    }

    this.aiPanel.style.left = left + 'px';
    this.aiPanel.style.top = (top + window.scrollY) + 'px';
    this.aiPanel.style.display = 'block';
  }

  async analyzeElement(element) {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    const responseArea = document.getElementById('ai-response-area');
    responseArea.innerHTML = '🔍 Анализирую элемент...';

    try {
      const elementData = {
        tagName: element.tagName,
        text: element.textContent?.substring(0, 500) || '',
        className: element.className,
        id: element.id,
        attributes: this.getElementAttributes(element),
        position: element.getBoundingClientRect()
      };

      const response = await chrome.runtime.sendMessage({
        action: 'analyzeElement',
        elementData: elementData
      });

      if (response.success) {
        responseArea.innerHTML = this.formatResponse(response.data);
      } else {
        responseArea.innerHTML = '❌ Ошибка анализа: ' + response.error;
      }
    } catch (error) {
      responseArea.innerHTML = '❌ Ошибка: ' + error.message;
    } finally {
      this.isAnalyzing = false;
    }
  }

  getElementAttributes(element) {
    const attributes = {};
    for (let attr of element.attributes) {
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  async analyzePage() {
    const responseArea = document.getElementById('ai-response-area');
    responseArea.innerHTML = '🔍 Анализирую страницу...';

    try {
      const pageData = {
        title: document.title,
        url: window.location.href,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        headings: this.extractHeadings(),
        links: this.extractLinks(),
        forms: this.extractForms(),
        images: this.extractImages()
      };

      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: 'Проанализируй эту веб-страницу и дай краткое описание её содержания',
        context: { pageData }
      });

      if (response.success) {
        responseArea.innerHTML = this.formatResponse(response.data);
      } else {
        responseArea.innerHTML = '❌ Ошибка анализа: ' + response.error;
      }
    } catch (error) {
      responseArea.innerHTML = '❌ Ошибка: ' + error.message;
    }
  }

  async summarizePage() {
    const responseArea = document.getElementById('ai-response-area');
    responseArea.innerHTML = '📝 Создаю краткое изложение...';

    try {
      const textContent = this.extractTextContent();

      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: 'Создай краткое изложение этого текста на русском языке',
        context: { textContent }
      });

      if (response.success) {
        responseArea.innerHTML = this.formatResponse(response.data);
      } else {
        responseArea.innerHTML = '❌ Ошибка создания изложения: ' + response.error;
      }
    } catch (error) {
      responseArea.innerHTML = '❌ Ошибка: ' + error.message;
    }
  }

  async extractData() {
    const responseArea = document.getElementById('ai-response-area');
    responseArea.innerHTML = '📊 Извлекаю структурированные данные...';

    try {
      const structuredData = {
        tables: this.extractTables(),
        lists: this.extractLists(),
        contacts: this.extractContacts(),
        prices: this.extractPrices()
      };

      const response = await chrome.runtime.sendMessage({
        action: 'sendQuery',
        query: 'Извлеки и структурируй важные данные с этой страницы',
        context: { structuredData }
      });

      if (response.success) {
        responseArea.innerHTML = this.formatResponse(response.data);
      } else {
        responseArea.innerHTML = '❌ Ошибка извлечения данных: ' + response.error;
      }
    } catch (error) {
      responseArea.innerHTML = '❌ Ошибка: ' + error.message;
    }
  }

  // Вспомогательные методы для извлечения данных
  extractHeadings() {
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
      headings.push({
        level: h.tagName,
        text: h.textContent.trim()
      });
    });
    return headings;
  }

  extractLinks() {
    const links = [];
    document.querySelectorAll('a[href]').forEach(a => {
      links.push({
        text: a.textContent.trim(),
        href: a.href
      });
    });
    return links.slice(0, 20); // Ограничиваем количество
  }

  extractForms() {
    const forms = [];
    document.querySelectorAll('form').forEach(form => {
      const inputs = [];
      form.querySelectorAll('input, select, textarea').forEach(input => {
        inputs.push({
          type: input.type || input.tagName.toLowerCase(),
          name: input.name,
          placeholder: input.placeholder
        });
      });
      forms.push({ inputs });
    });
    return forms;
  }

  extractImages() {
    const images = [];
    document.querySelectorAll('img').forEach(img => {
      images.push({
        src: img.src,
        alt: img.alt
      });
    });
    return images.slice(0, 10); // Ограничиваем количество
  }

  extractTextContent() {
    // Извлекаем основной текстовый контент
    const content = document.body.innerText || document.body.textContent || '';
    return content.substring(0, 10000); // Ограничиваем размер
  }

  extractTables() {
    const tables = [];
    document.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td, th').forEach(cell => {
          cells.push(cell.textContent.trim());
        });
        if (cells.length > 0) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });
    return tables;
  }

  extractLists() {
    const lists = [];
    document.querySelectorAll('ul, ol').forEach(list => {
      const items = [];
      list.querySelectorAll('li').forEach(li => {
        items.push(li.textContent.trim());
      });
      lists.push(items);
    });
    return lists;
  }

  extractContacts() {
    const text = document.body.textContent;
    const contacts = {};

    // Простое извлечение email и телефонов
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const phones = text.match(/[+]?[0-9]{1,4}?[-\s]?\(?[0-9]{1,3}?\)?[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,4}[-\s]?[0-9]{1,9}/g) || [];

    if (emails.length > 0) contacts.emails = emails.slice(0, 5);
    if (phones.length > 0) contacts.phones = phones.slice(0, 5);

    return contacts;
  }

  extractPrices() {
    const text = document.body.textContent;
    const prices = text.match(/[$€£¥₽]\s?[0-9]+(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?\s?[$€£¥₽]/g) || [];
    return prices.slice(0, 10);
  }

  formatResponse(data) {
    if (typeof data === 'string') {
      return data;
    }

    if (data.response) {
      return data.response;
    }

    return JSON.stringify(data, null, 2);
  }

  togglePanel() {
    if (this.aiPanel.style.display === 'none') {
      this.aiPanel.style.display = 'block';
      this.aiPanel.style.left = '50px';
      this.aiPanel.style.top = '50px';
    } else {
      this.hidePanel();
    }
  }

  hidePanel() {
    this.aiPanel.style.display = 'none';
    if (this.selectedElement) {
      this.selectedElement.classList.remove('ai-selected');
      this.selectedElement = null;
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'update':
        // Обработка обновлений от сервера
        console.log('Received update:', request.data);
        break;
    }
  }
}

// Инициализация Content Script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AIAssistantContent();
  });
} else {
  new AIAssistantContent();
}

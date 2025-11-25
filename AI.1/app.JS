// app.js - النسخة الآمنة بدون API Key

// ❌ احذف هالسطر تماماً - ما في داعي للـ API Key هون
// const OPENAI_API_KEY = '...' // احذفه!

let conversations = [];
let currentConversationId = null;
let isProcessing = false;
let isSecretMode = false;
let mediaRecorder;
let audioChunks = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('welcomeScreen').style.display = 'none';
    }, 4000);
    
    alternateTitle();
    initTheme();
    setupTabs();
    setupEventListeners();
    loadConversations();
    
    if (conversations.length === 0) {
        createNewConversation();
    } else {
        loadConversation(conversations[0].id);
    }
});

// ... (باقي الدوال بدون تغيير حتى handleSendMessage)

async function handleSendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message || isProcessing) return;

    isProcessing = true;
    addUserMessage(message);
    input.value = '';

    const container = document.getElementById('messages-container');
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'message-bubble ai-message p-4 max-w-3xl mx-auto';
    indicator.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                <i class="fas fa-robot text-white"></i>
            </div>
            <div class="flex space-x-1">
                <div class="typing-indicator"></div>
                <div class="typing-indicator"></div>
                <div class="typing-indicator"></div>
            </div>
        </div>
    `;
    container.appendChild(indicator);

    // Custom responses
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('شو اسمك') || lowerMsg.includes('ما اسمك') || lowerMsg.includes('اسمك')) {
        indicator.remove();
        addAIMessage("اسمي AI robotic ship");
        isProcessing = false;
        return;
    }

    if (lowerMsg.includes('من صنعك') || lowerMsg.includes('مين صنعك')) {
        indicator.remove();
        addAIMessage("صنعني الدكتور غياث محمد غيثان شاكر");
        isProcessing = false;
        return;
    }

    if (lowerMsg.includes('من غياث') || lowerMsg.includes('man howa ghiath')) {
        indicator.remove();
        addAIMessage("غياث شاكر هو أصغر مبرمج AI في مصر. عُرف غياث بقدرته الرائعة على تحليل الأكواد وحل المشاكل من عمر 10 سنواتٍ، ويبلغ الآن من العمر 18 عاماً. لم يدخل الجامعة بعد، لكنه يمتلك خبرة بروفيسور في مجال البرمجة وحصل على العديد من الجوائز في مجال برمجة الألعاب والمحاكاة والأمان السيبراني.");
        isProcessing = false;
        return;
    }

    try {
        const conv = conversations.find(c => c.id === currentConversationId);
        const history = conv && conv.messages ? conv.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : msg.role,
            content: msg.content
        })) : [];

        // 🔥 الحل: استدعاء Serverless Function بدل API مباشر
        const apiUrl = window.location.hostname === 'localhost' 
            ? '/.netlify/functions/chat'  // للتطوير المحلي
            : '/.netlify/functions/chat';  // للنشر على Netlify

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: history
            })
        });

        const data = await response.json();
        indicator.remove();
        
        if (data.error) {
            throw new Error(data.error.message || data.error);
        }
        
        const aiText = data.choices[0].message.content;
        addAIMessage(aiText);
    } catch (error) {
        indicator.remove();
        addAIMessage('عذراً، حدث خطأ: ' + error.message);
    }

    isProcessing = false;
}

async function handleCodeSendMessage() {
    const input = document.getElementById('code-message-input');
    const message = input.value.trim();
    if (!message || isProcessing) return;

    isProcessing = true;
    
    const container = document.getElementById('code-messages-container');
    const userDiv = document.createElement('div');
    userDiv.className = 'message-bubble user-message p-4 max-w-3xl mx-auto';
    userDiv.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                <i class="fas fa-user text-white"></i>
            </div>
            <div class="flex-1">${escapeHtml(message)}</div>
        </div>
    `;
    container.appendChild(userDiv);
    input.value = '';

    const indicator = document.createElement('div');
    indicator.id = 'code-typing-indicator';
    indicator.className = 'message-bubble ai-message p-4 max-w-3xl mx-auto';
    indicator.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                <i class="fas fa-robot text-white"></i>
            </div>
            <div class="flex space-x-1">
                <div class="typing-indicator"></div>
                <div class="typing-indicator"></div>
                <div class="typing-indicator"></div>
            </div>
        </div>
    `;
    container.appendChild(indicator);

    try {
        const apiUrl = '/.netlify/functions/chat';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful coding assistant. Provide code examples when asked. Format code with ```language syntax.' },
                    { role: 'user', content: message }
                ]
            })
        });

        const data = await response.json();
        indicator.remove();
        
        if (data.error) {
            throw new Error(data.error.message || data.error);
        }
        
        const aiText = data.choices[0].message.content;
        
        const aiDiv = document.createElement('div');
        aiDiv.className = 'message-bubble ai-message p-4 max-w-3xl mx-auto';
        aiDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                    <i class="fas fa-robot text-white"></i>
                </div>
                <div class="flex-1">${formatMessage(aiText)}</div>
            </div>
        `;
        container.appendChild(aiDiv);
        
        const codeMatch = aiText.match(/```[\s\S]*?\n([\s\S]*?)```/);
        if (codeMatch) {
            document.getElementById('code-preview').value = codeMatch[1].trim();
        }
    } catch (error) {
        indicator.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message-bubble ai-message p-4 max-w-3xl mx-auto';
        errorDiv.innerHTML = `
            <div class="flex items-start space-x-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                    <i class="fas fa-robot text-white"></i>
                </div>
                <div class="flex-1">عذراً، حدث خطأ: ${error.message}</div>
            </div>
        `;
        container.appendChild(errorDiv);
    }

    isProcessing = false;
}

// ... (باقي الدوال بدون تغيير)
// نسخ كل الدوال الباقية من ملفك الأصلي
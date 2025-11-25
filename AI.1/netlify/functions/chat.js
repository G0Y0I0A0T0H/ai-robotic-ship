// netlify/functions/chat.js
exports.handler = async (event, context) => {
    // السماح للطلبات من أي مكان (CORS)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // للتعامل مع preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { messages } = JSON.parse(event.body);

        // API Key محفوظ في متغيرات البيئة (Environment Variables)
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'API Error');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: error.message || 'Internal Server Error' 
            })
        };
    }
};
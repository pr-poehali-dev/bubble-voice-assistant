'''
Business: Обработка запросов к YandexGPT API для голосового помощника
Args: event - dict с httpMethod, body (JSON с полем "query")
Returns: HTTP response с ответом от YandexGPT
'''

import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    query: str = body_data.get('query', '').strip()
    
    if not query:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Query is required'})
        }
    
    api_key = os.environ.get('YANDEX_API_KEY')
    folder_id = os.environ.get('YANDEX_FOLDER_ID')
    
    if not api_key or not folder_id:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'YandexGPT API key or Folder ID not configured'})
        }
    
    try:
        import requests
        
        url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'
        
        response = requests.post(
            url,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Api-Key {api_key}',
                'x-folder-id': folder_id
            },
            json={
                'modelUri': f'gpt://{folder_id}/yandexgpt-lite',
                'completionOptions': {
                    'stream': False,
                    'temperature': 0.7,
                    'maxTokens': 500
                },
                'messages': [
                    {
                        'role': 'system',
                        'text': 'Ты дружелюбный голосовой помощник. Отвечай кратко и по делу на русском языке. Будь полезным и вежливым.'
                    },
                    {
                        'role': 'user',
                        'text': query
                    }
                ]
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'YandexGPT API error: {response.text}'})
            }
        
        result = response.json()
        
        if 'result' in result and 'alternatives' in result['result'] and len(result['result']['alternatives']) > 0:
            answer = result['result']['alternatives'][0]['message']['text']
        else:
            answer = 'Не удалось получить ответ от YandexGPT'
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'answer': answer})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Error: {str(e)}'})
        }

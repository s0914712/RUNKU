#!/usr/bin/env python3
"""
Generate examples for vocabulary words using Apertis AI API
"""
import os
import json
import httpx
from pathlib import Path
from datetime import datetime

# API 設定
APERTIS_API_KEY = os.getenv('APERTIS_API_KEY')
APERTIS_MODEL = 'grok-4.1-fast:free'
APERTIS_BASE_URL = 'https://api.apertis.ai/v1'

# 檔案路徑
WORDS_FILE = Path('words')
OUTPUT_FILE = Path('data/vocabulary.json')


def parse_words_file():
    """解析 words 檔案，支援多種格式"""
    words = []
    
    if not WORDS_FILE.exists():
        print(f"❌ File not found: {WORDS_FILE}")
        return words
    
    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # 支援格式: "中文-英文" 或 "英文-中文" 或單純單字
            if '-' in line:
                parts = line.split('-', 1)
                chinese = parts[0].strip()
                english = parts[1].strip()
                
                # 判斷哪邊是中文
                if any('\u4e00' <= c <= '\u9fff' for c in chinese):
                    words.append({'chinese': chinese, 'english': english})
                else:
                    words.append({'chinese': english, 'english': chinese})
            else:
                # 只有英文的情況，中文留空
                words.append({'chinese': '', 'english': line})
    
    return words


def load_existing_data():
    """載入已存在的 vocabulary.json"""
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {'words': [], 'last_updated': None}


def generate_examples(word_entry):
    """使用 Apertis API 生成例句和用法提示"""
    chinese = word_entry['chinese']
    english = word_entry['english']
    
    prompt = f"""為這個英文單字生成學習材料（請用繁體中文回答）：

單字: {english}
中文: {chinese if chinese else '(請提供中文翻譯)'}

請提供以下內容，使用 JSON 格式回答：
1. chinese_translation: 如果沒有中文翻譯，請提供
2. examples: 3個實用的英文例句（從簡單到複雜）
3. usage_tips: 簡短的用法說明（30字內）
4. difficulty: 難度等級 1-5 (1=基礎, 5=進階)
5. category: 詞性（如 noun, verb, adjective 等）

JSON格式範例：
{{
  "chinese_translation": "開放的",
  "examples": [
    "The store is open.",
    "She has an open mind.",
    "They opened a new restaurant."
  ],
  "usage_tips": "常用於描述狀態或態度",
  "difficulty": 2,
  "category": "adjective"
}}"""

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{APERTIS_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {APERTIS_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": APERTIS_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            result_json = response.json()
            response_text = result_json["choices"][0]["message"]["content"]
            
            # 提取 JSON
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response_text[start:end]
                return json.loads(json_str)
            
            return None
            
    except Exception as e:
        print(f"❌ Error generating examples for '{english}': {e}")
        return None


def main():
    """主程式"""
    print("🚀 Starting vocabulary generation...")
    
    # 確保 data 目錄存在
    OUTPUT_FILE.parent.mkdir(exist_ok=True)
    
    # 載入現有資料
    data = load_existing_data()
    existing_words = {w['english']: w for w in data['words']}
    
    # 解析 words 檔案
    words = parse_words_file()
    print(f"📚 Found {len(words)} words in file")
    
    # 處理每個單字
    updated_count = 0
    new_count = 0
    
    for word_entry in words:
        english = word_entry['english']
        
        # 如果已經有例句，跳過
        if english in existing_words and 'examples' in existing_words[english]:
            print(f"⏭️  Skip '{english}' (already has examples)")
            continue
        
        print(f"🔄 Generating examples for '{english}'...")
        result = generate_examples(word_entry)
        
        if result:
            # 更新或新增
            if english in existing_words:
                existing_words[english].update({
                    'chinese': result.get('chinese_translation', word_entry['chinese']),
                    'examples': result['examples'],
                    'usage_tips': result['usage_tips'],
                    'difficulty': result['difficulty'],
                    'category': result['category'],
                    'updated_at': datetime.now().isoformat()
                })
                updated_count += 1
            else:
                existing_words[english] = {
                    'english': english,
                    'chinese': result.get('chinese_translation', word_entry['chinese']),
                    'examples': result['examples'],
                    'usage_tips': result['usage_tips'],
                    'difficulty': result['difficulty'],
                    'category': result['category'],
                    'created_at': datetime.now().isoformat()
                }
                new_count += 1
            
            print(f"✅ Generated for '{english}'")
    
    # 儲存結果
    data['words'] = list(existing_words.values())
    data['last_updated'] = datetime.now().isoformat()
    data['total_words'] = len(data['words'])
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✨ Complete!")
    print(f"  📝 New words: {new_count}")
    print(f"  🔄 Updated words: {updated_count}")
    print(f"  📊 Total words: {len(data['words'])}")
    print(f"  💾 Saved to: {OUTPUT_FILE}")


if __name__ == '__main__':
    main()

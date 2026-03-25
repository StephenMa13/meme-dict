import json
import re

def clean_text(text):
    """清理字符串中的特定图片标签"""
    if not isinstance(text, str):
        return text
    
    # 正则表达式匹配目标：<br><br><img src="https://dummyimage.com..." ... >
    # 匹配任意带有 dummyimage.com 的图片标签及其前面的换行
    pattern = r'<br><br><img src="https://dummyimage\.com[^>]+>'
    
    # 将匹配到的内容替换为空字符串
    return re.sub(pattern, '', text)

def process_data(data):
    """递归遍历 JSON 数据结构"""
    if isinstance(data, dict):
        return {k: process_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_data(item) for item in data]
    else:
        return clean_text(data)

def main():
    input_file = 'memes.json'
    output_file = 'memes_cleaned.json'

    # 1. 读取原始 JSON
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"错误: 找不到文件 {input_file}")
        return

    # 2. 清理数据
    cleaned_data = process_data(data)

    # 3. 保存清理后的 JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        # ensure_ascii=False 保证中文正常显示，indent=4 保持格式美观
        json.dump(cleaned_data, f, ensure_ascii=False, indent=4)
    
    print(f"清理完成！结果已保存至 {output_file}")

if __name__ == '__main__':
    main()

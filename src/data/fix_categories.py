import json
import re
import os

def extract_categories_from_js(js_path):
    """从 JS 文件中提取合法的标签名集合"""
    valid_categories = set()
    try:
        with open(js_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # 匹配类似 '萌系': { 或者 "科技": { 这样的结构
            # 提取单引号或双引号内的标签名
            matches = re.findall(r"['\"]([\u4e00-\u9fa5a-zA-Z0-9_]+)['\"]\s*:\s*\{", content)
            valid_categories.update(matches)
        return valid_categories
    except Exception as e:
        print(f"❌ 读取 categories.js 失败: {e}")
        return set()

def find_similar_category(invalid_tag, valid_categories):
    """寻找最相近的合法标签"""
    # 1. 检查合法标签是否是无效标签的子串 (例如：合法='社交', 无效='社交生活' -> 命中 '社交')
    for valid in valid_categories:
        if valid in invalid_tag:
            return valid
    
    # 2. 检查无效标签是否是合法标签的子串 (例如：无效='二次元', 合法='泛二次元' -> 命中 '泛二次元')
    for valid in valid_categories:
        if invalid_tag in valid:
            return valid
            
    # 3. 如果实在找不到任何关联，使用默认标签
    return "默认"

def fix_meme_categories(json_path="memes.json", js_path="../categories.js", output_path="memes_fixed.json"):
    print("🔍 开始解析合法标签库...")
    valid_cats = extract_categories_from_js(js_path)
    
    if not valid_cats:
        print("⚠️ 未能提取到有效的标签列表，请检查 categories.js 路径是否正确。")
        return
        
    print(f"✅ 成功提取到 {len(valid_cats)} 个标准标签: {', '.join(valid_cats)}\n")
    print("-" * 40)
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 读取 {json_path} 失败: {e}")
        return
        
    fixed_count = 0
    
    for item in data:
        if 'category' not in item or not isinstance(item['category'], list):
            continue
            
        new_categories = []
        for tag in item['category']:
            if tag in valid_cats:
                new_categories.append(tag)
            else:
                # 触发相近词替换逻辑
                similar_tag = find_similar_category(tag, valid_cats)
                print(f"🔄 标签修复 | ID {item.get('id', '未知')}: [{tag}] -> [{similar_tag}]")
                new_categories.append(similar_tag)
                fixed_count += 1
                    
        # 核心：去重（防止替换后出现两个相同的标签）并限制最多 3 个标签
        unique_cats = list(dict.fromkeys(new_categories))[:3]
        
        # 兜底：如果列表为空，塞入一个默认标签
        if not unique_cats:
            unique_cats = ["默认"]
            
        item['category'] = unique_cats
        
    # 保存修复后的文件
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print("-" * 40)
    print(f"🎉 检查完毕！共自动修复了 {fixed_count} 个不规范标签。")
    print(f"💾 格式统一的数据已保存至: {output_path}")

if __name__ == "__main__":
    # 请确保路径与你的实际文件层级一致
    fix_meme_categories(
        json_path="memes.json", 
        js_path="../categories.js", 
        output_path="memes_fixed.json"
    )
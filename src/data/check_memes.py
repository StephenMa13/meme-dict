import json
import re

def clean_and_reindex_memes(input_file="memes.json", output_file="memes_cleaned.json"):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"📥 成功加载数据，共 {len(data)} 条。")
    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return

    unique_data = []
    seen_fingerprints = {} # 记录特征值

    def get_fingerprint(text):
        """提取词条特征：转小写、去除空格、保留中英数"""
        if not text: return ""
        text = str(text).lower().strip()
        # 只保留字母、数字、汉字
        chars = re.findall(r'[a-z0-9\u4e00-\u9fa5]', text)
        return "".join(chars)

    # 1. 第一步：去重
    for item in data:
        original_term = item.get('term', '').strip()
        fingerprint = get_fingerprint(original_term)

        if not fingerprint:
            continue

        if fingerprint in seen_fingerprints:
            # 如果已经存在该词条，跳过（不加入 unique_data）
            continue
        
        seen_fingerprints[fingerprint] = original_term
        unique_data.append(item)

    # 2. 第二步：重新排序并重写 ID (核心修改)
    # 按照原来的顺序（或者你可以自定义排序逻辑）重新分配 ID
    for index, item in enumerate(unique_data):
        item['id'] = index + 1  # 让 ID 从 1 开始连续排列

    # 3. 输出报告
    print("\n" + "="*40)
    print(f"✅ 处理完成：")
    print(f"  - 原始总数: {len(data)}")
    print(f"  - 剩余独立词条: {len(unique_data)}")
    print(f"  - 剔除重复数量: {len(data) - len(unique_data)}")2
    print(f"  - ID 状态: 已重置为 1 到 {len(unique_data)} 的连续整数")
    print("="*40)

    # 4. 保存结果
    with open(output_file, 'w', encoding='utf-8') as f:
        # indent=2 让 JSON 格式美观，ensure_ascii=False 保证中文不乱码
        json.dump(unique_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 干净且有序的数据已保存至: {output_file}")

if __name__ == "__main__":
    clean_and_reindex_memes()

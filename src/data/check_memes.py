import json
import re

def ultimate_clean_memes(input_file="memes.json", output_file="memes_final.json"):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return

    # 1. 结构容错：展平嵌套列表 (吸收第二段代码的优点)
    flat_data = []
    for item in data:
        if isinstance(item, list):
            flat_data.extend(item)
        elif isinstance(item, dict):
            flat_data.append(item)
            
    print(f"📥 成功读取并展平数据，当前共有 {len(flat_data)} 条初始数据。")

    # 2. 提取指纹函数 (吸收第一段代码的优点)
    def get_fingerprint(text):
        if not text: return ""
        text = str(text).lower().strip()
        chars = re.findall(r'[a-z0-9\u4e00-\u9fa5]', text)
        return "".join(chars)

    # 3. 核心清洗：去重 (吸收第一段代码的优点)
    unique_data = []
    seen_fingerprints = set() # 使用 set 提升查找效率

    for item in flat_data:
        if not isinstance(item, dict):
            continue
            
        original_term = item.get('term', '').strip()
        fingerprint = get_fingerprint(original_term)

        if not fingerprint or fingerprint in seen_fingerprints:
            continue
        
        seen_fingerprints.add(fingerprint)
        unique_data.append(item)

    # 4. 重新分配连续的升序 ID
    for index, obj in enumerate(unique_data, start=1):
        obj['id'] = index

    # 5. 保存结果
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_data, f, ensure_ascii=False, indent=2)

    # 6. 输出详细报告 (修复了第一段代码的笔误)
    print("\n" + "="*40)
    print(f"✅ 处理完成！")
    print(f"  - 展平后总数: {len(flat_data)}")
    print(f"  - 剔除重复数: {len(flat_data) - len(unique_data)}")
    print(f"  - 最终有效词条: {len(unique_data)}")
    print(f"  - ID 状态: 已重置为 1 到 {len(unique_data)} 的连续整数")
    print("="*40)
    print(f"💾 干净、无重、有序的数据已保存至: {output_file}")

if __name__ == "__main__":
    ultimate_clean_memes()
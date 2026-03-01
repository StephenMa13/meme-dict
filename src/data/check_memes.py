import json
import re

def check_and_clean_duplicates(input_file="memes.json", output_file="memes_cleaned.json"):
    # 1. 读取 JSON 数据
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"📥 成功加载数据，共 {len(data)} 条。开始智能查重...\n")
    except Exception as e:
        print(f"❌ 读取文件失败，请检查文件是否存在: {e}")
        return

    # 2. 停用词库：防止常见的助词或无意义后缀引发误判
    stopwords = {'的', '了', '是', '我', '你', '他', '啊', '吧', '呀', '不', '版', '式', '第', '大', '小'}
    
    duplicate_pairs = []
    to_remove_ids = set() # 记录需要剔除的重复项 ID

    # 3. 核心查重逻辑：双重循环比对
    for i in range(len(data)):
        item1 = data[i]
        for j in range(i + 1, len(data)):
            item2 = data[j]
            
            term1 = item1.get('term', '')
            term2 = item2.get('term', '')

            # 利用正则仅提取中文字符，并过滤掉停用词
            chars1 = set(re.findall(r'[\u4e00-\u9fa5]', term1)) - stopwords
            chars2 = set(re.findall(r'[\u4e00-\u9fa5]', term2)) - stopwords
            
            # 求两个词条包含的共同字符交集
            common_chars = chars1 & chars2
            
            # 🎯 判定条件：有两个字符（或以上）相同
            if len(common_chars) >= 2:
                duplicate_pairs.append({
                    't1': f"{term1} (ID:{item1['id']})",
                    't2': f"{term2} (ID:{item2['id']})",
                    'common': "".join(common_chars)
                })
                # 将后出现的衍生词条（ID通常较大）标记为待删除
                to_remove_ids.add(item2['id'])

    # 4. 输出查重报告
    if not duplicate_pairs:
        print("✅ 完美！没有发现包含两个相同字符的重复项。")
    else:
        print(f"⚠️ 扫描发现 {len(duplicate_pairs)} 对疑似重复项（已匹配“至少两个字符相同”）：")
        for idx, pair in enumerate(duplicate_pairs, 1):
            print(f"  [{idx}] 【{pair['t1']}】 <==> 【{pair['t2']}】 (重复字符: '{pair['common']}')")
        
        # 5. 自动剔除重复项并生成新文件
        cleaned_data = [item for item in data if item['id'] not in to_remove_ids]
        
        print("\n" + "="*40)
        print(f"🗑️ 自动去重处理完毕：")
        print(f"  - 原有词条总数: {len(data)}")
        print(f"  - 自动剔除数量: {len(to_remove_ids)}")
        print(f"  - 剩余独立词条: {len(cleaned_data)}")
        print("="*40)
        
        # 将清理后的干净数据保存下来
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
        print(f"\n💾 干净无重复的数据已自动保存至: {output_file}")
        print("💡 提示：你可以直接使用上文我发给你的【30个全新替换包】补充不足的条目！")

if __name__ == "__main__":
    check_and_clean_duplicates()
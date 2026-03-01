import json

def reorder_memes_ids(input_file="memes.json", output_file="memes_final.json"):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 读取文件失败: {e}")
        return
    
    # 1. 自动展平嵌套列表 (处理手动拼凑 JSON 导致的 [[{}], [{}]] 结构)
    flat_data = []
    for item in data:
        if isinstance(item, list):
            flat_data.extend(item) # 如果是列表，就把里面的词条抽出来
        elif isinstance(item, dict):
            flat_data.append(item) # 如果直接是字典，直接加入
            
    print(f"📥 成功读取并展平数据，当前共有 {len(flat_data)} 条独立词条。")

    # 2. 重新分配连续的升序 ID
    for index, obj in enumerate(flat_data, start=1):
        if isinstance(obj, dict):
            obj['id'] = index

    # 3. 将结果保存到最终文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(flat_data, f, ensure_ascii=False, indent=2)
        
    print(f"✅ ID 重新升序排列完成！(1 到 {len(flat_data)})")
    print(f"💾 最终文件已保存为: {output_file}")

if __name__ == "__main__":
    reorder_memes_ids()
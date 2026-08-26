#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 public/vocabulary/tem4.json —— 完全按用户提供的《华研专四词汇突破8000》顺序。

数据源（仓库根目录，用户上传）：
- 华研专四词汇突破8000.txt   ← 单词顺序（# 章节标题 + 逐词列表）
- 华研专四词汇突破8000.csv   ← 单词 → 释义（word,definition）

生成规则：
- List = TXT 里的一个章节（Part I~IV 的 36 个 Lesson + 附录2 热词 8 类，共 44 组）
- 单词顺序严格跟随 TXT 文件原始顺序
- 释义取 CSV；CSV 为空时回退到考纲词表释义
- 音标尽量从考纲词表补充（不影响顺序/释义）
"""
import csv
import io
import json
import re
import unicodedata

SRC_TXT = "华研专四词汇突破8000.txt"
SRC_CSV = "华研专四词汇突破8000.csv"
OUT = "public/vocabulary/tem4.json"

# 旧考纲词表（用于补充音标与兜底释义）——优先用环境变量，否则当前 tem4.json
import os
LEGACY = os.environ.get("LEGACY_TEM4", "public/vocabulary/tem4.json")

POS_PREFIX = re.compile(
    r"^(?:vt|vi|v|n|adj|adv|prep|conj|num|art|pron|aux|int|abbr)\.[\s.]*"
)

def norm_key(word: str) -> str:
    """归一化：小写 + 去变音符号（précis -> precis）"""
    s = unicodedata.normalize("NFD", word.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")

def load_legacy():
    """从旧考纲词表建立 word -> {phonetic, meaning} 查找表（含归一化键）"""
    lookup = {}
    try:
        d = json.load(open(LEGACY, encoding="utf-8"))
        for l in d.get("lists", []):
            for w in l.get("words", []):
                wd = w.get("word", "")
                if not wd:
                    continue
                entry = {
                    "phonetic": w.get("phonetic") or "",
                    "meaning": w.get("meaning") or "",
                }
                if wd.lower() not in lookup:
                    lookup[wd.lower()] = entry
                nk = norm_key(wd)
                if nk not in lookup:
                    lookup[nk] = entry
    except FileNotFoundError:
        pass
    return lookup

def parse_txt():
    """解析 TXT：返回 [(section_title, [words...]), ...]，保持原始顺序"""
    sections = []
    cur = None
    words = []
    for line in open(SRC_TXT, encoding="utf-8-sig"):
        s = line.strip()
        if not s:
            continue
        if s.startswith("#"):
            if cur is not None:
                sections.append((cur, words))
            cur = s[1:].strip()
            words = []
        else:
            words.append(s)
    if cur is not None:
        sections.append((cur, words))
    return sections

def parse_csv():
    """解析 CSV：word -> 释义（合并多行引号字段），含归一化键"""
    text = open(SRC_CSV, encoding="utf-8-sig").read()
    rows = csv.reader(io.StringIO(text))
    mapping = {}
    for r in rows:
        if not r:
            continue
        w = r[0].strip()
        if not w:
            continue
        # 合并多行释义为单行
        defn = " ".join((r[1] if len(r) > 1 else "").split())
        # 重复词条取非空释义优先
        for key in (w, norm_key(w)):
            if key not in mapping or (not mapping[key] and defn):
                mapping[key] = defn
    return mapping

def split_pos(defn):
    """从释义开头提取词性（vt. / n. / adj. 等），其余为释义正文"""
    m = POS_PREFIX.match(defn)
    if m:
        pos = m.group(0).strip().rstrip(".")
        rest = defn[m.end():].strip()
        return pos + ".", rest or defn
    return "", defn

def list_name(title):
    """章节标题 -> List 名称（简洁版）"""
    # "Part I 专四高频词汇 Lesson 1" -> "Lesson 01 · 高频"
    # "附录2 实用英语热词 政治类"    -> "热词 · 政治类"
    m = re.match(r"Part\s*([IV]+)\s*专四([高频常次常考认知]+)词汇\s*Lesson\s*(\d+)", title)
    if m:
        part, kind, num = m.groups()
        return f"Lesson {int(num):02d} · {kind}"
    m2 = re.match(r"附录\d*\s*实用英语热词\s*(.+)", title)
    if m2:
        return f"热词 · {m2.group(1).strip()}"
    return title

def main():
    legacy = load_legacy()
    defs = parse_csv()
    sections = parse_txt()

    lists = []
    total = 0
    no_def = []
    no_phon = 0
    for idx, (title, words) in enumerate(sections, 1):
        list_words = []
        for j, word in enumerate(words, 1):
            key = norm_key(word)
            defn = defs.get(word) or defs.get(key) or ""
            if not defn and key in legacy:
                defn = legacy[key]["meaning"]
            pos, meaning = split_pos(defn)
            phonetic = ""
            if key in legacy:
                phonetic = legacy[key]["phonetic"]
            if not defn:
                no_def.append(word)
            if not phonetic:
                no_phon += 1
            list_words.append({
                "id": f"tem4-list{idx:02d}-{j:04d}",
                "word": word,
                "phonetic": phonetic,
                "meaning": meaning,
                "partOfSpeech": pos,
                "wordOrder": j,
            })
        lists.append({
            "id": f"tem4-list-{idx:02d}",
            "name": list_name(title),
            "order": idx,
            "words": list_words,
        })
        total += len(list_words)

    book = {"id": "tem4", "name": "专四", "lists": lists}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(book, f, ensure_ascii=False, indent=2)

    print(f"sections: {len(lists)} | total words: {total}")
    print(f"no-definition words: {len(no_def)} {no_def[:10]}")
    print(f"words without phonetic: {no_phon} ({no_phon/total:.1%})")
    print("list names:", [l["name"] for l in lists[:4]], "...", [l["name"] for l in lists[-2:]])
    print("first word:", json.dumps(lists[0]["words"][0], ensure_ascii=False))
    print("last word:", json.dumps(lists[-1]["words"][-1], ensure_ascii=False))

if __name__ == "__main__":
    main()

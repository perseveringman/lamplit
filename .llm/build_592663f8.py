import json, re, sys

IN = "/Users/ryanbzhou/Developer/lamplit/.llm/in/analysis-592663f8.json"
OUT = "/Users/ryanbzhou/Developer/lamplit/.llm/out/analysis-592663f8.json"

ROLES = {"定语从句","状语从句","宾语从句","同位语","分词短语","介词短语","不定式","插入语","并列结构","其他"}

data = json.load(open(IN, encoding="utf-8"))
texts = {it["sentenceId"]: it["text"] for it in data["items"]}
gram  = {it["sentenceId"]: it["grammar"] for it in data["items"]}

R = {}

R["b2-024-s005"] = dict(
    skeleton="'Everyone's losing money these days,'",
    modifiers=[{"text": "he said", "role": "插入语"}],
    grammarRefs=["现在进行时", "一般过去时"],
    gloss="他说，如今人人都在亏钱。",
    whyLearn="同一句里引语用现在进行时描述当下处境，转述部分用一般过去时，能对比两种时态的分工。",
)

R["b2-024-s006"] = dict(
    skeleton="He started",
    modifiers=[
        {"text": "to complain about this wicked world", "role": "不定式"},
        {"text": "but was interrupted by a knock at the door", "role": "并列结构"},
        {"text": "by a knock at the door", "role": "介词短语"},
    ],
    grammarRefs=["动词不定式", "被动语态", "一般过去时"],
    gloss="他开始抱怨这个邪恶的世界，却被敲门声打断。",
    whyLearn="start 后接不定式，was interrupted by 点出打断者，but 连接共享主语的第二个谓语，一句覆盖三个考点。",
)

R["b2-024-s007"] = dict(
    skeleton="A girl came in and put an envelope",
    modifiers=[{"text": "on his desk", "role": "介词短语"}],
    grammarRefs=["一般过去时", "所属与所有格"],
    gloss="一个女孩进来，把一只信封放在他桌上。",
    whyLearn="came 与 put 用 and 并列共享一个主语，put 后是宾语加地点介词短语，his 是形容词性物主代词。",
)

R["b2-024-s009"] = dict(
    skeleton="I found this",
    modifiers=[
        {"text": "outside this gentleman's room", "role": "介词短语"},
        {"text": "she said", "role": "插入语"},
    ],
    grammarRefs=["一般过去时"],
    gloss="她说，我是在这位先生房门外捡到的。",
    whyLearn="found 后接宾语再跟地点介词短语，引语末尾的逗号放在引号内，是英文引述的书写细节。",
)

R["b2-025-s001"] = dict(
    skeleton="I arrived",
    modifiers=[
        {"text": "in London", "role": "介词短语"},
        {"text": "at last", "role": "介词短语"},
    ],
    grammarRefs=["一般过去时"],
    gloss="我终于到达了伦敦。",
    whyLearn="arrive in 后接大地点，at last 作时间状语置于句尾，很短一句就能记住到达类动词的搭配。",
)

R["b2-025-s002"] = dict(
    skeleton="The railway station was",
    modifiers=[{"text": "big, black and dark", "role": "并列结构"}],
    grammarRefs=["一般过去时"],
    gloss="火车站又大又黑，一片昏暗。",
    whyLearn="was 后接三个并列形容词作表语，and 只出现在最后两项之间，可体会逗号加 and 的并列规则。",
)

R["b2-025-s003"] = dict(
    skeleton="I did not know the way to my hotel",
    modifiers=[
        {"text": "to my hotel", "role": "介词短语"},
        {"text": "so I asked a porter", "role": "状语从句"},
    ],
    grammarRefs=["否定句", "一般过去时", "所属与所有格"],
    gloss="我不认识去旅馆的路，就问了一个搬运工。",
    whyLearn="did not 构成过去否定，so 引出结果状语从句，the way to 是表达路线的固定搭配。",
)

R["b2-025-s005"] = dict(
    skeleton="The porter, however, could not understand me",
    modifiers=[
        {"text": "however", "role": "插入语"},
        {"text": "I repeated my question several times", "role": "并列结构"},
        {"text": "at last he understood", "role": "并列结构"},
    ],
    grammarRefs=["情态动词", "所属与所有格"],
    gloss="搬运工听不懂我的话，我重复几遍他才明白。",
    whyLearn="could not 表过去能力的否定，however 插在主语后要用逗号隔开，分号连接三个并列句，可学书面停顿。",
)

R["b2-025-s007"] = dict(
    skeleton="I am a foreigner",
    modifiers=[{"text": "I said", "role": "插入语"}],
    grammarRefs=["一般现在时", "一般过去时"],
    gloss="我说：我是外国人。",
    whyLearn="引语用一般现在时陈述身份，转述动词 said 用过去时，一句话看清两种时态的搭配。",
)

R["b2-025-s010"] = dict(
    skeleton="The porter and I looked at each other and smiled",
    modifiers=[
        {"text": "The porter and I", "role": "并列结构"},
        {"text": "at each other", "role": "介词短语"},
    ],
    grammarRefs=["一般过去时"],
    gloss="搬运工和我对视一眼，都笑了。",
    whyLearn="并列主语接两个并列谓语，look at 后用 each other 表互相，这里不能换成 themselves。",
)

R["b2-025-s011"] = dict(
    skeleton="he said something",
    modifiers=[
        {"text": "Then", "role": "其他"},
        {"text": "and I understood it", "role": "并列结构"},
    ],
    grammarRefs=["一般过去时"],
    gloss="然后他说了句什么，我听懂了。",
    whyLearn="两个过去时小句由 and 连成并列句，it 回指前句的 something，可练代词回指与时序。",
)

R["b2-025-s015"] = dict(
    skeleton="each man speaks a different language",
    modifiers=[{"text": "In England", "role": "介词短语"}],
    grammarRefs=[],
    gloss="在英格兰，每个人说的语言都不一样。",
    whyLearn="地点状语 In England 置于句首并用逗号隔开，each man 作单数主语，谓语用 speaks。",
)

R["b2-026-s001"] = dict(
    skeleton="I am an art student",
    modifiers=[
        {"text": "and I paint a lot of pictures", "role": "并列结构"},
        {"text": "a lot of pictures", "role": "其他"},
    ],
    grammarRefs=["一般现在时", "数量表达"],
    gloss="我是学美术的，画很多画。",
    whyLearn="and 连接两个主语相同的现在时句子，a lot of 后接可数名词复数，是常用的数量表达。",
)

R["b2-026-s002"] = dict(
    skeleton="Many people pretend",
    modifiers=[{"text": "that they understand modern art", "role": "宾语从句"}],
    grammarRefs=[],
    gloss="许多人假装自己懂现代艺术。",
    whyLearn="pretend 后接 that 引导的宾语从句，从句用一般现在时，可整句记下 pretend 的句型。",
)

R["b2-026-s003"] = dict(
    skeleton="They always tell you",
    modifiers=[{"text": "what a picture is 'about'", "role": "宾语从句"}],
    grammarRefs=["间接疑问句", "一般现在时"],
    gloss="他们总要告诉你一幅画在表达什么。",
    whyLearn="tell 后接双宾语再跟 what 引导的宾语从句，介词 about 留在从句末尾，是这类从句的常见语序。",
)

R["b2-026-s004"] = dict(
    skeleton="many pictures arc not 'about' anything",
    modifiers=[{"text": "Of course", "role": "插入语"}],
    grammarRefs=[],
    gloss="当然，许多画并不表达任何东西。",
    whyLearn="Of course 作插入语置于句首用逗号隔开，否定用 not ... anything 代替 nothing，语气更口语。",
)

# ---------- validation ----------
CJK = re.compile(r"[\u4e00-\u9fff]")
errors = []
results = []
for it in data["items"]:
    sid = it["sentenceId"]; text = it["text"]; r = R[sid]
    if r["skeleton"] not in text:
        errors.append(f"{sid}: skeleton not substring")
    for m in r["modifiers"]:
        if m["text"] not in text:
            errors.append(f"{sid}: modifier not substring: {m['text']!r}")
        if m["role"] not in ROLES:
            errors.append(f"{sid}: bad role {m['role']}")
    for g in r["grammarRefs"]:
        if g not in it["grammar"]:
            errors.append(f"{sid}: grammarRef not allowed: {g}")
    if len(CJK.findall(r["gloss"])) > 25:
        errors.append(f"{sid}: gloss too long ({len(CJK.findall(r['gloss']))})")
    if len(r["whyLearn"]) > 70:
        errors.append(f"{sid}: whyLearn too long ({len(r['whyLearn'])})")
    results.append({"sentenceId": sid, **r})

if len(results) != len(data["items"]):
    errors.append("item count mismatch")
if errors:
    print("VALIDATION FAILED"); [print(" -", e) for e in errors]; sys.exit(1)

json.dump({"id": data["id"], "results": results}, open(OUT, "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("OK written", OUT, len(results), "results")

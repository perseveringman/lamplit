# Hit 载荷按类型分派

> 状态：**待实施**。这是「地基复审」三处修正里的第三处，前两处已完成。
> 本文记录现状、待决策点与验证方式，供独立会话接手。

---

## 一、现状（实测）

命中总数 **48,378**，其中带载荷的 **31,636（65.4%）**——**全部是 word**。

| 类型 | 命中 | 有载荷 | 覆盖率 |
|---|---|---|---|
| word | 31,776 | 31,636 | 99.6% |
| grammar | **11,804** | 0 | **0%** |
| chunk | 3,267 | 0 | 0% |
| pattern | 1,531 | 0 | 0% |

载荷的定义在 `Hit` 元组里：

```ts
type Hit = [kpId, start, end, glossIndex?, methodIndex?]
```

`glossIndex` / `methodIndex` 指向 `lesson.glosses[]` / `lesson.glossMethods[]`，
即「**这一句里这个词取哪个义项**」。

**瓶颈在代码里只有一行**：

```js
// build-data.mjs · resolveSentenceSenses
if (!def || def.type !== 'word') continue;   // grammar / pattern / chunk 全跳过
```

---

## 二、为什么不能照搬 word 的载荷

这是本文最重要的一点。

word 的载荷回答的是「**取哪个义项**」——因为一个词有多个意思，语境决定取哪个。

**grammar 没有"义项"这回事。** `g-present-perfect` 不是"现在完成时的第 2 个意思"。
它需要回答的是另一个问题：

> **这个结构在**这一句**里落在哪些词上、是怎么构成的？**

举例：

```
I have just received a letter from my brother, Tim.
  └───── g-present-perfect ─────┘
      助动词 have  +  副词 just  +  过去分词 received
```

现在详情卡只能显示规则的**通用**信息（名称、英文术语、结构公式 `have / has + 过去分词`），
**说不出这一句里哪几个词承担了这个结构**。

同理：
- **pattern** 需要的是「**本句的可替换成分**」——`Here is your umbrella` 里 `your umbrella` 是槽位
- **chunk** 需要的是「**整体释义**」——其实 `chunk.meaning` 已经有了，只是没挂到命中上

**所以这不是"给 grammar 也加 glossIndex"，是"载荷要按类型分派"。**

---

## 三、三个方案

### 方案 A · 扩展 Hit 元组

```ts
type Hit = [kpId, start, end, payloadIndex?, methodIndex?]
// payloadIndex 指向一个按类型分派的载荷池
```

- **优点**：结构统一，`touch()` 一处改动
- **缺点**：**动了地基**。`Hit` 是 5 元组，被 `check-data`、Reader、Details、gloss 解析、
  integrity 哈希等十几处消费。改长度要全量回归
- **风险**：高

### 方案 B · 平行索引（不改 Hit）

```js
sentence.structureRoles = {
  'g-present-perfect': { span: [2, 45], parts: [{ text: 'have', role: '助动词' }, ...] }
}
```

- **优点**：**纯增量**，现有元组与所有消费点不变；可以先只做 grammar，验证后再扩
- **缺点**：同一句里同一规则多次出现时要处理 key 冲突（需带 start 做 key）
- **风险**：低

### 方案 C · 只做「成分拆解」的展示层

不改数据，在 UI 侧按规则类型 + `stop` 表实时推断成分。

- **优点**：零数据改动
- **缺点**：**推断就是猜**。`stop` 表分不出 "have" 是助动词还是实义动词。
  这违反本项目反复出现的那条判断：**测不准的东西宁可不测，不要填一个看起来合理的值**
- **风险**：低，但产出不可信

---

## 四、建议

**方案 B**，理由：

1. 它是**纯增量**的——不动 `Hit` 元组，所有既有断言与消费点无需回归
2. 它可以**分类型推进**：先 grammar（11,804 个命中，收益最大），验证后再做 pattern
3. 它失败了可以整体删除，不留半改结构

**具体第一步（建议只做这一步）**：

给 50 条语法规则加**语法成分标注**，从规则自身的结构出发而不是猜：

```js
// knowledge.mjs 里已有 formula：'have / has + 过去分词'
// 加一个 parts 声明，说明这个结构的组成部分与角色
rule('g-present-perfect', ..., { parts: [
  { role: '助动词', from: 'have|has|have|has' },
  { role: '过去分词', from: 'pp' },
]})
```

然后在 `build` 时**按 parts 去切已有命中 span**（span 已经知道，只是没切）——
这一步是**确定性的**：span 内的词按 parts 的模式匹配，匹配不上就不产出载荷
（**不猜**，宁可空着）。

---

## 五、验证方式

沿用本项目已经反复奏效的三条：

1. **产物自证合法**：`data:check` 断言「载荷的 parts 文本必须是命中 span 的精确子串」
2. **不猜**：切不出成分的命中**载荷留空**，并**报告空载荷比例**（像 `lowFrequencyRules` 那样可见）
3. **有消费者**：UI 上必须用起来（语法详情卡显示「这一句：have(助动词) + received(过去分词)」），
   否则就是又一个孤儿字段——这条自查在 B7 和 C5 上各抓到一次

---

## 六、风险与边界

| 风险 | 说明 |
|---|---|
| **规则自身的结构描述可能不准** | `formula` 是为展示写的自然语言（如 `be + 过去分词（+ by 施动者）`），不能直接当解析规则用。`parts` 要单独声明 |
| **一句里同一规则多次出现** | key 需要带 `start`，不能用 `kpId` 单键 |
| **`pattern` 的槽位识别更难** | 它需要知道哪部分是可变槽位。建议**放在 grammar 之后**，且允许长期为空 |
| **不要顺手改 `Hit` 元组** | 那是另一件事。方案 B 的全部价值就在于不动它 |

---

## 七、与已完成部分的关系

```
地基复审三处修正
  ① 语言对象与教学点解耦   ✅ 已完成（teachingPoints 层）
  ② 分层加 bookRole 维度   ✅ 已完成（introduceBook / bookRoles）
  ③ hit 载荷按类型分派      ⏳ 本文
```

③ 做完之后，详情卡的三个层就齐了：

```
规则层   现在完成时 · present perfect · have / has + 过去分词      ← B7 已做
教学层   教材教学点：现在完成时（可点击）                          ← C4 已做
本句层   have(助动词) + just(副词) + received(过去分词)            ← 本文
```

import { VERB_FORMS, formsOf } from './verb-forms.mjs';

// Editorial learning annotations. These are NOT supplied textbook notes.
// Only an exact text match creates an occurrence; original text is never rewritten.
// priority：同 span 冲突时保留数值最高的（默认 50）。
// excludes：本规则命中后，其 span 上与这些 id 重叠的命中全部丢弃。
// 这两个字段是为「补规则」准备的——不先建互斥机制就补规则，双标会失控。
// 例：补上「过去将来时 would+do」后，它会与「情态动词」命中同一 span。
const rule = (id, type, name, meaning, regex, parent, opts) => ({
 id, type, name, meaning, regex, parent,
 provenance:'editorial-rule',
 priority: opts?.priority ?? 50,
 excludes: opts?.excludes ?? [],
});
// 过去分词集：从 VERB_FORMS 反推——去掉原形、-ing、三单形式，剩下的就是过去式与过去分词。
// 原先这里是一份 ~50 个词的手写白名单，"have" 的过去分词 "had" 根本不在里面，
// 导致 "I've already had lunch." 这种最典型的现在完成时识别不出来。
const PAST_PARTICIPLES = (() => {
 // ECDICT 的 exchange 字段对**所有词性**都给屈折形式，所以动词表里混进了 18 个功能词表头：
 // a, and, as, at, here, i, in, it, no, one, or, other, so, you ……
 // 它们贡献了 your / ands / ass / heres / noes 这类"分词"，会让 "is your" 被判成被动语态。
 // 处理办法是按**表头**过滤，而不是逐个往黑名单里加形式 —— 黑名单补不完。
 const NOT_VERB = new Set(['a','an','and','as','at','here','i','in','it','no','one','or','other','so','you','they','we','my','of','to','the','this','that','these','those','some','any','every','all','both','either','neither','such','then','now','only','own','very','just','too','out','up','down','off','over',
  // 形容词也在这张表里（ECDICT 给比较级/最高级），它们的屈折不是分词
  'good','bad','far','little','much','many','old','ill']);
 const OK_HEAD = new Set(['be','do','have']);
 // be / do / have 是动词，但只有这几个形式是过去分词
 const OK_FORM = new Set(['been','done','had']);
 const out = new Set();
 for (const [base, joined] of Object.entries(VERB_FORMS)) {
  if (NOT_VERB.has(base) && !OK_HEAD.has(base)) continue;
  for (const f of String(joined).split('|')) {
   if (f === base || f.endsWith('ing') || !/^[a-z]+$/.test(f) || f.length < 2) continue;
   if (f === base + 's' || f === base + 'es' || f === base.slice(0, -1) + 'ies') continue;
   if (OK_HEAD.has(base) && !OK_FORM.has(f)) continue;
   out.add(f);
  }
 }
 return [...out].sort();
})();
// 规则动词的 -ed 不在表里（表只收不规则与高频词），单独放行。
// 原形即过去分词的动词（come-come-come 型）。上面的反推会把这些的原形当"原形"剔除，
// 所以单独补一份——否则 "has become" 会被判成没有分词。
const PP_SUPPLEMENT = ['become','come','run','cut','put','set','read','hurt','let','cost','hit','shut','spread','burst','bet','cast','rid','shed','split','quit','beat','forecast'];
export const PP = '(?:[a-z]{3,}ed|' + [...PAST_PARTICIPLES, ...PP_SUPPLEMENT].join('|') + ')';
// 问句里 have/has 与分词之间夹着主语（"Have you had lunch?"），
// 不允许这个位置的话，现在完成时的疑问形式全部识别不出来。
const subject = '(?:(?:I|you|he|she|we|they|it|there)\\s+)?';
export const ADV = '(?:(?:already|just|never|ever|always|often|nearly|recently|not|yet|also|only|still|probably|certainly|suddenly|carefully|fully|successfully|specially|completely|been)\\s+){0,3}';
export const rules = [
 rule('g-past','grammar','一般过去时','讲述已经发生的动作或过去的状态。关注过去式及其对应的时间线。', /\b(?:was|were|did|went|had|saw|said|came|got|took|gave|made|found|thought|told|heard|felt|left|bought|brought|stood|sat|ran|knew|began|became|lost|wrote|spoke|read|looked|asked|turned|arrived|wanted|replied|returned|noticed|received|decided|stopped|visited|happened)\b/gi),
 rule('g-present','grammar','一般现在时','描述经常发生的行为、习惯或一般状态。注意第三人称单数和频率副词。', /\b(?:(?:I|you|we|they)\s+(?:(?:always|often|usually|sometimes|never)\s+)?(?:like|know|live|work|want|have|need|think|do|see|go|get|find|feel|believe|read)|(?:he|she|it)\s+(?:(?:always|often|usually|sometimes|never)\s+)?(?:likes|knows|lives|works|wants|has|needs|thinks|does|goes|gets)|am|is|are)\b/gi),
 rule('g-present-continuous','grammar','现在进行时','be + 动词 -ing，描述此刻或当前一段时期正在发生的动作。', /\b(?:am|is|are|'m|'re|'s)\s+(?:(?:not|still|always|now)\s+)?[a-z]+ing\b/gi),
 rule('g-past-continuous','grammar','过去进行时','was / were + 动词 -ing，交代过去某一时刻的动作或故事背景。', /\b(?:was|were)\s+(?:(?:not|still|always|busily)\s+)?[a-z]+ing\b/gi),
 rule('g-present-perfect','grammar','现在完成时','have / has + 过去分词。连接过去的经历与现在的结果，而非单纯定位过去时间。', new RegExp(`(?:\\b(?:have|has)|'ve|'s)\\s+${subject}${ADV}${PP}\\b`,'gi')),
 rule('g-past-perfect','grammar','过去完成时','had + 过去分词，说明某个过去时间点之前已经发生的事情。', new RegExp(`\\bhad\\s+${ADV}${PP}\\b`,'gi')),
 rule('g-future','grammar','一般将来时','用 will / shall 表达将来的行动、预测或临时决定。', /(?:\b(?:will|shall)|'ll)\s+(?:not\s+)?[a-z]+\b/gi),
 rule('g-going-to','grammar','be going to 表计划','be going to + 动词原形，表达打算或有迹象的预测。', /\b(?:am|is|are|'m|'s|'re)\s+going\s+to\s+[a-z]+\b/gi),
 rule('g-future-continuous','grammar','将来进行时','will be + 动词 -ing，说明将来某个时间正在进行的活动。', /\bwill\s+be\s+[a-z]+ing\b/gi),
 rule('g-future-perfect','grammar','将来完成时','will have + 过去分词，以未来的时间为参照回看已完成的行动。', new RegExp(`\\bwill\\s+have\\s+${PP}\\b`,'gi')),
 rule('g-perfect-continuous','grammar','完成进行时','have / has / had been + 动词 -ing，突出行为的持续过程。', /\b(?:have|has|had)\s+been\s+[a-z]+ing\b/gi),
 rule('g-passive','grammar','被动语态','be + 过去分词，把动作的承受者放在叙述中心。注意也可能是表示状态的分词。', new RegExp(`\\b(?:am|is|are|was|were|be|been|being)\\s+(?:(?:not|often|always|just|carefully|fully|recently|finally|usually|specially)\\s+){0,2}${PP}\\b`,'gi')),
 rule('g-modal','grammar','情态动词','can / could / may / might / must / should 等后接动词原形。结合语境区分能力、许可、义务与推测。', /\b(?:can|could|may|might|must|should|would|ought to|needn't|mustn't|can't|couldn't)\s+(?:not\s+)?[a-z]+\b/gi),
 rule('g-deduction','grammar','情态动词表推测','must / might / may / could have + 过去分词，对过去作出推测。', new RegExp(`\\b(?:must|might|may|could|should|cannot|can't|couldn't)\\s+(?:not\\s+)?have\\s+${PP}\\b`,'gi')),
 rule('g-relative','grammar','定语从句','who / whom / which / whose 引出信息来限定或补充前面的名词。先找到被修饰对象。', /\b[a-z]+\s+(?:who|whom|which|whose)\s+[^.!?]{2,55}/gi),
 rule('g-object','grammar','宾语从句','把完整信息放在 think / say / know 等动词之后；注意转述时的时态与人称。', /\b(?:think|thought|know|knew|say|said|says|told|believe|believed|realized|realize|found|noticed|explained|hope|hoped)\s+(?:[a-z]+\s+)?that\s+[^.!?]{2,45}/gi),
 rule('g-indirect-question','grammar','间接疑问句','疑问词或 if / whether 引导从句，通常使用陈述语序。', /\b(?:asked|wondered|wonder|know|knew|tell|explain|discover|see)\s+(?:[a-z]+\s+)?(?:whether|if|how|why|what|where|when)\s+[^.!?]{2,40}/gi),
 rule('g-condition','grammar','条件状语从句','if / unless 引出条件，主句给出在此条件下的结果。先判断真实条件还是假设。', /\b(?:if|unless)\s+[^.!?]{3,70}/gi),
 rule('g-time','grammar','时间状语从句','when / while / before / after / until 等标明动作发生的时机与顺序。', /\b(?:when|while|before|after|until|as soon as)\s+[^.!?]{3,65}/gi),
 rule('g-cause','grammar','原因状语从句','because / since / as 等说明原因。这里优先标记明确的 because 结构。', /\bbecause\s+(?!of\b)[^.!?]{3,65}/gi),
 rule('g-concession','grammar','让步表达','although / though / even if / despite 等先承认一种情况，再引出不同的结果。', /\b(?:although|though|even though|even if|in spite of|despite)\s+[^.!?]{3,60}/gi),
 rule('g-purpose','grammar','目的与结果','so that / in order to 等连接行动与目的。辨别想达到的目的与实际发生的结果。', /\b(?:so that|in order to|in order that)\s+[^.!?]{3,60}/gi),
 rule('g-comparative','grammar','比较级','比较两种事物或行为的程度，留意比较对象与 than 后的省略。', /\b(?:[a-z]+er|more\s+[a-z]+|less\s+[a-z]+|better|worse)\s+than\b/gi),
 rule('g-superlative','grammar','最高级','在一个范围内比较程度，通常采用 the + -est 或 the most。', /\bthe\s+(?:most\s+[a-z]+|least\s+[a-z]+|[a-z]+est|best|worst)\b/gi),
   rule('g-infinitive','grammar','动词不定式','to 加动词原形，可表达目的或补充动词含义。',
  /\b(?:to|To)\s+(?!(?:the|a|an|my|your|his|her|its|our|their|this|that|these|those|some|any|no|every|all|both|one|two|me|you|him|us|them|myself|yourself|himself|herself|itself|ourselves|themselves|school|bed|church|sea|hospital|prison|market|town|court|college|university|pieces|here|there|sleep)\b)[a-z]{2,}\b/g),
 rule('g-gerund','grammar','介词后的 -ing','介词后常用动词 -ing 形式。把介词与其后的动作整体理解。', /\b(?:of|in|by|without|for|after|before|on|about)\s+[a-z]+ing\b/gi),
 rule('g-participle','grammar','分词作状语','句首分词结构可交代时间、原因或伴随状态；先找它和主句主语的关系。', /^(?:['"“”]\s*)?(?:[A-Za-z]+ing|Armed|Dressed|Faced|Tired|Convinced|Designed|Built|Not realizing|Not wanting)\s+[^,]{2,75},/g),
 rule('g-negation','grammar','否定句','注意 not / never / no longer 等如何改变整句的意义。', /\b(?:do not|does not|did not|don't|doesn't|didn't|is not|are not|was not|were not|isn't|aren't|wasn't|weren't|never|no longer)\b/gi),
 rule('g-imperative','grammar','祈使句','用动词原形给出请求、建议或指令；please 可以缓和语气。', /(?:^|:\s*)(?:Please\s+)?(?:Give|Come|Go|Look|Listen|Tell|Take|Put|Open|Shut|Keep|Be|Let|Try|Show|Read|Don't)\s+[^.!?]{1,65}/gi),
 rule('g-question','grammar','一般疑问句','把 be、助动词或情态动词放在主语前，邀请对方确认信息。', /(?:^|:\s*|['"])(?:Is|Are|Was|Were|Do|Does|Did|Have|Has|Can|Could|Will|Would|May)\s+[^?]{2,75}\?/g),
 rule('g-wh-question','grammar','特殊疑问句','用 what / why / where / when / who / how 明确你想获得的信息。', /\b(?:What|Why|Where|When|Who|Whose|Which|How)\b[^?]{1,85}\?/g),
 rule('g-tag','grammar','反意疑问句','用简短问句确认或征求认同。留意前后肯否、助动词和代词的一致性。', /,\s*(?:isn't|aren't|wasn't|weren't|don't|doesn't|didn't|haven't|hasn't|won't|can't|is|are|was|were|do|does|did|have|has|will|can)\s+(?:it|he|she|they|you|we|I)\s*\?/gi),
 rule('g-exclamation','grammar','感叹句','what / how 开头的感叹结构，把评价与情绪放在句子前面。', /\b(?:What\s+(?:a|an)\s+[^!?]{2,55}|How\s+[a-z]+(?:\s+[^!?]{1,35})?)!/g),
 rule('g-cleft','grammar','强调句','It is / was … that / who …，将要强调的部分单独凸显出来。', /\bIt\s+(?:is|was)\s+[^.!?]{2,45}\s+(?:that|who)\b/gi),
 rule('g-existential','grammar','there be 存在句','there is / are / was / were，先说明某处有某物，再补充位置或状态。', /\bthere(?:\s+(?:is|are|was|were|has been|have been)|'s)\b/gi),
 rule('g-coordination','grammar','并列结构','用 both…and / either…or / neither…nor / not only…but also 让对应信息保持平行。', /\b(?:both\s+[^.!?]{1,35}\s+and|either\s+[^.!?]{1,40}\s+or|neither\s+[^.!?]{1,40}\s+nor|not only\s+[^.!?]{1,60}\s+but)\b/gi),
 rule('g-used-to','grammar','used to 与过去习惯','used to + 动词原形，描述过去经常发生、如今可能已经改变的事。', /\bused\s+to\s+(?!being|[a-z]+ing)[a-z]+\b/gi),
 rule('g-possession','grammar','所属与所有格','用所有格说明归属；结合上下文区别名词所有格与 is / has 的缩写。', /\b(?:my|your|his|her|our|their|whose)\s+[a-z]+\b/gi),
 rule('g-quantity','grammar','数量表达','a few / a little / a great deal of 等与可数或不可数名词搭配，表达数量和态度。', /\b(?:a few|a little|a great deal of|a large number of|a great many|a number of|plenty of|a lot of|lots of)\b/gi),
 rule('p-request','pattern','Can / Could you …? · 礼貌求助','Can / Could you + 动词原形：提出具体请求。把 you 后的动作换成你需要的帮助。', /\b(?:Can|Could|Would)\s+you\b[^?]{1,95}\?/gi,'g-modal'),
 rule('p-permission','pattern','May / Can I …? · 请求许可','May / Can / Could I + 动词原形：询问是否可以做某件事。', /\b(?:May|Can|Could)\s+I\b[^?]{1,90}\?/gi,'g-modal'),
 rule('p-would-like','pattern','Would you like …? · 发出邀请','Would you like + 名词 / to do：提供东西或提出邀请，比 want 更委婉。', /\bwould\s+you\s+like\b[^?]{1,90}\?/gi,'g-question'),
 rule('p-there-be','pattern','There is / are … · 描述存在','There + be + 人或物 + 位置：用于介绍空间与环境。', /\bthere(?:\s+(?:is|are|was|were)|'s)\s+[^.!?]{2,60}/gi,'g-existential'),
 rule('p-too-to','pattern','too … to … · 太…而不能','too + 形容词 / 副词 + to do。用一个结构连接程度与受限的行动。', /\btoo\s+[a-z]+(?:\s+for\s+\w+)?\s+to\s+[a-z]+/gi,'g-infinitive'),
 rule('p-enough-to','pattern','… enough to … · 足以','形容词 / 副词 + enough to do，说明足够达到某一结果。', /\b[a-z]+\s+enough\s+to\s+[a-z]+/gi,'g-infinitive'),
 rule('p-so-that','pattern','so … that … · 如此…以至于','so + 形容词 / 副词 + that 从句，表达程度造成的结果。', /\bso\s+[^,.!?]{2,35}\s+that\b/gi,'g-purpose'),
 rule('p-such-that','pattern','such … that … · 如此…以至于','such + 名词短语 + that 从句。与 so … that … 的区别在于被修饰的成分。', /\bsuch\s+[^,.!?]{2,45}\s+that\b/gi,'g-purpose'),
 rule('p-it-adj','pattern','It is … to … · 评价一件事','It is + 形容词 + to do：先作评价，再说所评价的行动。', /\bit\s+(?:is|was|will be|would be)\s+(?:not\s+)?(?:very\s+|quite\s+|almost\s+)?[a-z]+\s+(?:for\s+[^,]{1,25}\s+)?to\s+[a-z]+/gi,'g-infinitive'),
 rule('p-take-time','pattern','It takes … to … · 说明耗时','It takes / took + 人 + 时间 + to do，把行动需要的时间说清楚。', /\bit\s+(?:takes?|took|will take)\s+[^.!?]{2,65}\s+to\s+[a-z]+/gi,'g-infinitive'),
 rule('p-not-until','pattern','not … until … · 直到…才','先用否定说明事情没有发生，再用 until 标明转折的时间点。', /\b(?:not|didn't|doesn't|don't)\s+[^.!?]{2,65}\s+until\b/gi,'g-time'),
 rule('p-no-sooner','pattern','no sooner … than … · 刚…就','常用于叙事，强调两件事发生得紧接；句首 no sooner 可引发倒装。', /\bno\s+sooner\s+[^.!?]{2,80}\s+than\b/gi,'g-inversion-only'),
 rule('p-hardly-when','pattern','hardly … when … · 刚…就','hardly 与 when 配合，描述前一件事刚发生，另一件事就接着发生。', /\bhardly\s+[^.!?]{2,85}\s+when\b/gi,'g-time'),
 rule('p-as-as','pattern','as … as … · 同等比较','as + 形容词 / 副词 + as，比较相同程度；not as … as 表示不及。', /\bas\s+[a-z]+\s+as\b/gi,'g-comparative'),
 rule('p-rather-than','pattern','would rather … than … · 表达偏好','would rather + 动词原形 + than + 动词原形，比较两种选择。', /\bwould\s+rather\s+[^.!?]{2,55}\s+than\b/gi,'g-modal'),
 rule('p-have-something','pattern','have … done · 请人做某事','have + 宾语 + 过去分词，表达安排别人做或经历某种情况。注意与完成时区分。', /\b(?:have|has|had)\s+(?:the|a|an|his|her|my|their|our|it)\s+[^.!?]{1,25}\s+(?:repaired|built|cut|removed|checked|painted|increased|rebuilt)\b/gi,'g-passive'),
 rule('p-what-about','pattern','What / How about …? · 提出建议','What / How about + 名词 / 动词 -ing，追问另一个选择或提出建议。', /\b(?:What|How)\s+about\b[^?]{1,65}\?/gi,'g-wh-question'),
 rule('p-why-dont','pattern',"Why don't we …? · 提议一起做",'Why don’t we + 动词原形：把建议说成一个共同的行动。', /\bwhy\s+don't\s+(?:we|you)\b[^?]{1,70}\?/gi,'g-question'),
 rule('p-mind','pattern','Would you mind …? · 委婉请求','Would you mind + 动词 -ing：请对方做某事。回答时注意 mind 是“介意”。', /\bwould\s+you\s+mind\b[^?]{1,85}\?/gi,'g-modal'),
 rule('p-find-it','pattern','find it … to … · 表达感受','find + it + 形容词 + to do：it 代指后面真正要说的行动。', /\b(?:find|found)\s+it\s+(?:very\s+|quite\s+)?[a-z]+\s+to\s+[a-z]+/gi,'g-infinitive'),
 rule('p-suppose','pattern','Let us suppose … · 引入假设','引导读者暂时接受一个情境，再推导结果或说明观点。', /\blet\s+us\s+suppose\b[^.!?]{1,80}/gi,'g-imperative'),
 rule('p-no-matter','pattern','No matter … · 无论','No matter + 疑问词 + 从句，强调结论不受某个条件变化影响。', /\bno\s+matter\s+(?:what|how|where|when|who)\s+[^.!?]{1,65}/gi,'g-concession'),
 rule('p-not-only','pattern','not only … but … · 不仅…而且','把第二条信息推进一层，同时保持两个部分的语法结构一致。', /\bnot\s+only\s+[^.!?]{1,90}\s+but\b/gi,'g-coordination'),
 rule('p-the-more','pattern','the more … the more … · 越…越','两个 the + 比较级相互呼应，描述一起变化的趋势。', /\bthe\s+(?:more|less|bigger|higher|greater|longer)\s+[^.!?]{1,75},\s+the\s+\w+/gi,'g-comparative'),
 rule('p-used-to','pattern','used to do · 回看过去','在今昔对比中描述以前的习惯，把 used to 后的动作替换成你的经历。', /\bused\s+to\s+(?!being|[a-z]+ing)[a-z]+\b/gi,'g-used-to'),
 rule('p-think-that','pattern','I think … · 表达判断','I think / believe + 观点，让读者知道这是说话者的判断。', /\bI\s+(?:think|believe|thought)\s+[^.!?]{2,70}/gi,'g-object'),
 rule('p-afraid','pattern',"I'm afraid … · 委婉说明",'用 I’m afraid 引出坏消息、拒绝或不确定的判断，并不总是表示害怕。', /\b(?:I'm|I am)\s+afraid\s+[^.!?]{1,60}/gi,'g-object'),
 rule('p-make-possible','pattern','make it possible to … · 使…成为可能','make + it + possible + to do，以行动的结果为中心说明作用。', /\b(?:make|makes|made)\s+it\s+possible\s+(?:for\s+[^.!?]{1,35}\s+)?to\s+[a-z]+/gi,'g-infinitive'),
 rule('p-no-doubt','pattern','There is no doubt that … · 明确判断','先标明确信程度，再用 that 从句给出内容。留意论据是否足以支持判断。', /\bthere\s+(?:is|was)\s+no\s+doubt\s+that\b/gi,'g-object'),
 rule('p-first-time','pattern','for the first time · 第一次','强调某次经历的新鲜或特殊；与具体动作和时间搭配使用。', /\bfor\s+the\s+first\s+time\b/gi),

 // ── 以下 9 类由语料实测缺口补齐（PRINCIPLES 原则 4：候选枚举 + 语料验证）──
 // 出现次数来自正则探针，量级可信；释义为本项目自撰。
 rule('g-future-in-past','grammar','过去将来时','在过去的时间点上回看将来要发生的事，用 would / should 加动词原形。多出现在转述与回忆里。',
  /\b(?:would|should)\s+(?!like\b|rather\b|mind\b|have\b|you\b|be\b|sooner\b|hardly\b|not\b)[a-z]+/gi, null, { priority: 70, excludes: ['g-modal'] }),
 rule('g-participle-attribute','grammar','分词作定语','过去分词跟在名词后限定它，相当于一个省略了的定语从句。先找到被修饰的名词。',
  /\b[a-z]+\s+(?:made|given|taken|written|built|found|known|called|used|left|sent|held|kept|shown|driven|caught)\s+(?:by|in|from|for|with|on|at)\b/gi, null, { priority: 60 }),
  rule('g-appositive-clause','grammar','同位语从句','抽象名词后用 that 引出从句，说明这个名词的具体内容，而不是限定它。去掉 that 从句仍完整。',
  /\b(?:report|fact|news|idea|belief|view|opinion|claim|statement|argument|evidence|proof|assumption|theory|doubt|hope|fear|worry|concern|confidence|realization|discovery|conclusion|decision|promise|warning|rumour|story|message|signal|indication|sign|knowledge|awareness|sense|feeling|impression|notion|concept|thought|suggestion|recommendation|proposal|possibility|probability|likelihood|truth|chance|risk|danger)s?\s+(?:[a-z]+\s+){0,6}that\s+[^.!?]{3,70}/gi, null, { priority: 75 }),
 rule('g-place-clause','grammar','地点状语从句','where 引出从句说明动作发生的地点，而不是指代前面的名词。',
  /\bwhere\s+(?:I|you|he|she|we|they|it|there|the|a|an|his|her|our|their)\b[^.!?]{0,50}/gi, null, { priority: 55 }),
 rule('g-absolute-construction','grammar','独立主格','名词或代词后直接跟分词、不定式或介词短语，构成一个不依附主句的从属结构。它自带主语。',
  /\b[a-z]+\s+[a-z]+(?:ing|ed)\s*,\s*(?:I|he|she|we|they|the|his|her|its|our|their)\b/gi, null, { priority: 75 }),
 rule('g-subjunctive-past','grammar','虚拟语气','用 were / had done 表达与事实相反或不可能实现的假设。注意时态要比真实情况后退一步。',
  /\bif\s+(?:I|he|she|it|we|they|you)\s+(?:were\b|had\s+[a-z]+)/gi, null, { priority: 80, excludes: ['g-condition'] }),
 rule('g-manner-clause','grammar','方式状语从句','as if / as though 引出从句说明动作的方式，后面常接与事实相反的假设。',
  /\bas\s+(?:if|though)\b[^.!?]{0,60}/gi, null, { priority: 60 }),
 // 倒装族：教材把倒装分散在多课教（否定词置首、only 置首、地点状语前置），
 // 形态与语序各不相同。原先一条 g-inversion-negative 只覆盖否定词那一种。
 rule('g-inversion-negative','grammar','倒装 · 否定词置句首','否定意义的词提到句首时，助动词要移到主语前面。把否定词移回原位就能看懂。',
  /(?:^|[.!?]\s+)(?:Never|Not only|Not until|Rarely|Seldom|Hardly|Scarcely|No sooner|Little|Nowhere)\b[^.!?]{0,60}/g, null, { priority: 70 }),
 rule('g-inversion-only','grammar','倒装 · only 置句首','only 加状语放在句首时，主句用部分倒装。先找出 only 修饰的是哪个成分。',
  /(?:^|[.!?]\s+)Only\s+(?:when|after|then|if|by|in|with|through|because)\b[^.!?]{0,60}/g, null, { priority: 72 }),
 rule('g-inversion-locative','grammar','倒装 · 地点状语前置','地点或方向状语放到句首时，动词整个提到主语前面（完全倒装）。先把状语挪回句尾就能还原。',
  /(?:In|in|On|on|At|at|Under|under|Over|over|Beside|beside|Among|among|Within|within|Through|through|Beyond|beyond|Above|above|Below|below|Around|around|Outside|outside|Inside|inside|Away|away|Down|down|Up|up|Out|out|Here|here|There|there)\s+(?:[^.!?]{0,45}?\s)?(?:stood|sat|lay|lain|flowed|ran|runs|came|comes|went|goes|walked|marched|lived|lives|hung|hangs|rose|rises|fell|falls|remained|remains|waited|arrived|appeared|followed|follows|passed)\s+(?:a|an|the|my|your|his|her|its|our|their|this|that|these|those|no|every|some|another)\s+[a-z]+/g, null, { priority: 68 }),
 rule('g-wish-clause','grammar','wish 从句','wish 后面的从句用过去时或过去完成时，表达与现在或过去事实相反的愿望。',
  /\b(?:wish|wishes|wished)\s+(?:I|he|she|we|they|it|you)\b[^.!?]{0,50}/gi, null, { priority: 65 }),

 // ── 句型补齐：第一册基础问答（缺这一批导致 24% 的课零句型命中）──
 rule('p-is-this','pattern','Is this …? · 确认物品','用 Is this / Is that 加名词，确认眼前的东西是不是对方的。回答用 Yes, it is. / No, it isn\'t.', /\bIs\s+(?:this|that|it)\s+(?:your|my|his|her|a|an|the)\s+[a-z]+/gi, 'g-question'),
 rule('p-what-colour','pattern','What colour …? · 询问颜色','用 What colour 提问，后接 be 动词与主语。注意英式 colour、美式 color。', /\bWhat\s+colou?r\s+(?:is|are)\b/gi, 'g-special-question'),
 rule('p-whose','pattern','Whose …? · 询问归属','用 Whose 提问东西属于谁。可以问 Whose is it? 也可以问 Whose bag is this?', /\bWhose\s+(?:is|are|bag|car|house|[a-z]+)\b/gi, 'g-special-question'),
 rule('p-how-many','pattern','How many …? · 询问数量','how many 后接可数名词复数，用来说明数量的多少。', /\bHow\s+many\s+[a-z]+s?\b/gi, 'g-special-question'),
 rule('p-how-much','pattern','How much …? · 询问价钱或数量','问价钱用 How much is / are …；问不可数名词的量也用 How much。', /\bHow\s+much\s+(?:is|are|does|do|money|[a-z]+)\b/gi, 'g-special-question'),
 rule('p-here-is','pattern','Here is / Here are … · 递东西','把东西递给对方时用 Here is / Here are 开头，后面紧跟所给的东西。', /\bHere\s+(?:is|are|you\s+are)\b/gi),
 rule('p-this-is-intro','pattern','This is … · 介绍他人','介绍某人时用 This is 加名字或身份，不用 He is。', /\bThis\s+is\s+(?:Mr|Mrs|Miss|Ms|my|our|a|an)\b[^.!?]{0,30}/gi),
 rule('p-third-person-be','pattern','He / She is … · 说明身份','第三人称单数用 is，说明国籍、职业或身份。', /\b(?:He|She|It)\s+is\s+(?:a|an|my|your|his|her|not|[A-Z][a-z]+)\b[^.!?]{0,28}/g),
 rule('p-where-is','pattern','Where is / are …? · 询问位置','用 Where 加 be 动词提问位置。回答常配 in / on / under 等介词短语。', /\bWhere\s+(?:is|are|do|does)\b[^.!?]{0,45}/gi, 'g-special-question'),
 rule('p-what-doing','pattern','What are you doing? · 询问正在做的事','用现在进行时的疑问形式询问对方此刻在做什么。', /\bWhat\s+(?:are|is)\s+(?:you|he|she|they|it)\s+[a-z]+ing\b/gi, 'g-present-continuous'),
 rule('p-what-must','pattern','What must I do? · 询问该做什么','用 must / should 提问自己该做什么，回答里通常给出动作或步骤。', /\bWhat\s+(?:must|should|shall)\s+(?:I|we)\s+[a-z]+\b/gi, 'g-modal'),
 rule('p-lets','pattern',"Let's … · 提出一起做",'Let us / Let\'s 加动词原形，提出一起做某事。否定用 Let\'s not。', /\bLet(?:'s| us)\s+(?:not\s+)?[a-z]+\b/gi),
 rule('p-dont-imperative','pattern',"Don't … · 否定的祈使句",'祈使句的否定形式在动词前加 Do not / Don\'t，用来劝阻或提醒。', /\b(?:Don't|Do not|Never)\s+[a-z]+\b/gi),
 rule('p-give-me','pattern','Give me … please · 索要东西','Give / Show / Pass 加 me 加东西，句尾 please 让语气客气。', /\b(?:Give|Show|Pass|Send|Bring)\s+(?:me|him|her|us|them)\s+[a-z]+/gi),
 rule('p-i-can','pattern',"I can / I can't … · 表达能与不能",'情态动词 can 后接动词原形，否定是 cannot / can\'t，表达能力或许可。', /\b(?:I|You|He|She|We|They)\s+(?:can|cannot|can't|could|couldn't)\s+(?:not\s+)?[a-z]+\b/gi, 'g-modal'),
 rule('p-do-you-question','pattern','Do you …? · 一般疑问句','实义动词的一般疑问句用 Do / Does / Did 提到句首，后接动词原形。', /\b(?:Do|Does|Did)\s+(?:you|he|she|we|they|it)\s+(?:not\s+)?[a-z]+\b/gi, 'g-question'),
 rule('p-have-you-ever','pattern','Have you ever …? · 询问经历','现在完成时的一般疑问句用 Have / Has 提前，ever 强调至今为止的经历。', /\b(?:Have|Has)\s+(?:you|he|she|we|they|it)\s+(?:ever\s+|already\s+|never\s+)?[a-z]+\b/gi, 'g-present-perfect'),
 rule('p-whats-the-matter','pattern',"What's the matter? · 询问出了什么事",'用 What\'s the matter / wrong 询问对方遇到的麻烦，回答说明症状或问题。', /\bWhat(?:'s| is)\s+(?:the\s+)?(?:matter|wrong|problem|trouble)\b/gi, 'g-special-question'),
 rule('p-going-to','pattern',"I'm going to … · 打算做",'be going to 加动词原形，表达已经打算好的事或有迹象的预测。', /\b(?:am|is|are|'m|'s|'re)\s+going\s+to\s+[a-z]+\b/gi, 'g-going-to'),
 rule('p-is-there-q','pattern','Is there …? · 询问是否存在','There be 的疑问句把 be 提到 there 前面，回答沿用 There is / are。', /\b(?:Is|Are|Was|Were)\s+there\s+(?:any|a|an|the|some)?\s*[a-z]+/gi, 'g-there-be'),
 rule('p-what-about-you','pattern','What about you? · 反问对方','用 What / How about 加名词或动名词，把话题抛回去或提出建议。', /\b(?:What|How)\s+about\s+(?:you|me|him|her|us|them|[a-z]+ing)\b/gi, 'p-what-about'),
 rule('p-too-much-many','pattern','too much / too many · 表示过多','too much 接不可数名词，too many 接可数名词复数，都表示超出合适范围。', /\btoo\s+(?:much|many)\s+[a-z]+/gi),
 rule('p-one-of-the','pattern','one of the … · 其中之一','one of the 加形容词最高级加名词复数，说明某个群体里最突出的一个。', /\bone\s+of\s+the\s+(?:[a-z]+est\s+|most\s+[a-z]+\s+)?[a-z]+s\b/gi, 'g-superlative'),
 rule('p-the-same-as','pattern','the same as … · 与…相同','the same as 表示两者没有差别，中间可以插入名词。', /\bthe\s+same\s+(?:[a-z]+\s+)?as\b/gi),
 rule('p-both-and','pattern','both … and … · 两者都','both A and B 连接两个并列成分，谓语用复数。', /\bboth\s+[a-z]+\s+and\s+[a-z]+/gi),
 rule('p-either-or','pattern','either … or … · 二者之一','either A or B 表示两者中选一个，谓语随最近的主语变化。', /\beither\s+[a-z]+\s+or\s+[a-z]+/gi),
 rule('p-neither-nor','pattern','neither … nor … · 两者都不','neither A nor B 表示两者都否定，谓语通常用单数。', /\bneither\s+[a-z]+\s+nor\s+[a-z]+/gi),
 rule('p-so-do-i','pattern','So do I / Neither do I · 表示同样','用 So 加助动词加主语表示"我也是"，否定用 Neither / Nor 开头。', /\b(?:So|Neither|Nor)\s+(?:do|did|have|has|am|is|are|can|will)\s+(?:I|you|he|she|we|they)\b/gi),
 rule('p-as-soon-as','pattern','as soon as … · 一…就','as soon as 引导时间状语从句，主句动作紧跟着从句动作发生。', /\bas\s+soon\s+as\s+[^.!?]{2,45}/gi, 'g-time-clause'),
 rule('p-because-clause','pattern','because … · 说明原因','because 引导原因状语从句，回答 why 提出的问题。', /\bbecause\s+[^.!?]{3,55}/gi, 'g-reason-clause'),
 rule('p-if-clause','pattern','If … , … · 提出条件','if 引导条件从句，主句说明在该条件下会发生什么。注意主将从现。', /\bIf\s+[^.!?]{3,55},\s*[^.!?]{3,55}/gi, 'g-condition'),
 rule('p-when-clause','pattern','When … , … · 交代时间','when 引导时间状语从句，先交代时间背景，再说主句的事。', /\bWhen\s+[^.!?]{3,55},\s*[^.!?]{3,55}/gi, 'g-time-clause'),
 rule('p-while-clause','pattern','while … · 两件事同时进行','while 强调两个动作同时发生，从句常用进行时。', /\bwhile\s+[^.!?]{3,55},\s*[^.!?]{3,55}/gi, 'g-time-clause'),
 rule('p-it-seems','pattern','It seems that … · 表示看起来','It seems / appears that 引出看起来的结论，语气比 I think 弱。', /\bIt\s+(?:seems|appears|seemed|appeared)\s+(?:that\s+)?[^.!?]{3,50}/gi, 'g-subject-clause'),
 rule('p-how-long','pattern','How long …? · 询问时长','how long 询问时间长度，回答常用 for 加时间段。', /\bHow\s+long\s+(?:does|do|did|is|are|will|have|has)\b/gi, 'g-special-question'),
 rule('p-could-you-tell','pattern','Could you tell me …? · 委婉询问','Could you tell me 后接疑问词从句，是比直接提问更客气的说法。', /\bCould\s+you\s+(?:tell|show|explain)\s+me\b[^.!?]{0,50}/gi, 'g-indirect-question'),
  rule('p-it-is-said','pattern','It is said that … · 据说','It is said / reported / believed that 引出传闻或普遍看法，不指明来源。', /\bIt\s+(?:is|was)\s+(?:said|reported|believed|thought|known|estimated)\s+that\b[^.!?]{0,50}/gi, 'g-passive'),
 rule('p-nothing-but','pattern','nothing but … · 只不过','nothing but 加强语气，表示除此之外没有别的。', /\bnothing\s+but\s+[a-z]+/gi),
 rule('p-more-and-more','pattern','more and more · 越来越','比较级用 and 连接重复，表示持续变化。', /\b(?:more\s+and\s+more|less\s+and\s+less|better\s+and\s+better|worse\s+and\s+worse)\b/gi, 'g-comparative'),
 rule('p-not-so-as','pattern','not so … as … · 不如','not so / as 加形容词加 as，表示前者不如后者。', /\bnot\s+(?:so|as)\s+[a-z]+\s+as\b/gi, 'g-comparative'),
 rule('p-in-order-to','pattern','in order to … · 为了','in order to 加动词原形，比单独用不定式更明确地表示目的。', /\bin\s+order\s+(?:not\s+)?to\s+[a-z]+/gi, 'g-infinitive'),
 rule('p-so-that-can','pattern','so that … can … · 以便','so that 引导目的状语从句，从句里常有 can / could / may。', /\bso\s+that\s+[^.!?]{2,45}\b(?:can|could|may|might|will|would)\b/gi, 'g-purpose'),
 rule('p-such-a-that','pattern','such a … that … · 如此…以至于','such 后接名词短语，与 so 后接形容词的用法相对。', /\bsuch\s+(?:a|an)\s+[a-z]+\s+[a-z]+\s+that\b/gi, 'p-such-that'),
  rule('p-as-if','pattern','as if … · 好像','as if / as though 引出看起来的样子，后面常接与事实相反的假设。', /\bas\s+(?:if|though)\s+[^.!?]{2,50}/gi, 'g-manner-clause'),
 rule('p-even-if','pattern','even if … · 即使','even if 表示让步，强调即便条件成立，结论也不变。', /\beven\s+if\s+[^.!?]{3,50}/gi, 'g-concession'),
 rule('p-even-though','pattern','even though … · 尽管','even though 引导让步状语从句，所说是事实而非假设。', /\beven\s+though\s+[^.!?]{3,50}/gi, 'g-concession'),
 rule('p-as-long-as','pattern','as long as … · 只要','as long as 引导条件从句，强调只要满足这个条件即可。', /\bas\s+long\s+as\s+[^.!?]{3,50}/gi, 'g-condition'),
 rule('p-unless','pattern','unless … · 除非','unless 相当于 if not，引导否定条件从句。', /\bunless\s+[^.!?]{3,50}/gi, 'g-condition'),
 rule('p-in-case','pattern','in case … · 以防','in case 引导的从句说明预防的情况，不用将来时。', /\bin\s+case\s+[^.!?]{3,45}/gi),
 rule('p-by-the-time','pattern','by the time … · 到…的时候','by the time 引导时间从句，主句常用完成时表示在此之前已完成。', /\bby\s+the\s+time\s+[^.!?]{3,50}/gi, 'g-time-clause'),
 rule('p-only-when','pattern','Only when … · 只有当','only 加状语放句首时主句要部分倒装。', /\bOnly\s+(?:when|after|then|if)\s+[^.!?]{3,50}/gi, 'g-inversion-only'),
 rule('p-seem-to','pattern','seem to … · 似乎是','seem / appear 加不定式，说明根据观察得出的印象。', /\b(?:seem|seems|seemed|appear|appears|appeared)\s+to\s+[a-z]+/gi),
 rule('p-tend-to','pattern','tend to … · 倾向于','tend to 加动词原形，说明经常出现的倾向。', /\btend(?:s|ed)?\s+to\s+[a-z]+/gi),
 rule('p-be-likely-to','pattern','be likely to … · 很可能','be likely to 表示根据情况推测的可能性。', /\b(?:is|are|was|were|am)\s+likely\s+to\s+[a-z]+/gi),
 rule('p-be-about-to','pattern','be about to … · 即将','be about to 表示马上就要发生的动作，通常不与时间状语连用。', /\b(?:is|are|was|were|am)\s+about\s+to\s+[a-z]+/gi),
 rule('p-be-used-to','pattern','be used to … · 习惯于','be used to 后接名词或动名词，与 used to do 的意思不同。', /\b(?:is|are|was|were|am|get|got|getting)\s+used\s+to\s+[a-z]+/gi),
  rule('p-had-better','pattern','had better … · 最好','had better 加动词原形，表示劝告或建议，否定是 had better not。', /\bhad\s+better\s+(?:not\s+)?[a-z]+/gi),
 rule('p-it-is-no-use','pattern','It is no use … · 做…没用','It is no use / no good 后接动名词，说明做某事没有意义。', /\bIt\s+(?:is|was)\s+no\s+(?:use|good)\s+[a-z]+ing\b/gi, 'g-gerund'),
 rule('p-suppose-clause','pattern','Suppose … · 假设','Suppose / Supposing 引导假设，常用于提出一个情形来讨论。', /\bSuppose\s+(?:that\s+)?[^.!?]{3,50}/gi),
  rule('p-not-only-inv','pattern','Not only … but also … · 不但…而且','not only 放句首时前半句要部分倒装，but also 后接并列成分。', /\bNot\s+only\s+[^.!?]{2,45}\bbut\s+(?:also\s+)?[^.!?]{0,40}/gi, 'p-not-only'),
];

// ── 语料范围外的句型（已从 rules 移除，保留记录）────────────────────
// 这 9 条经实测在新概念 1–4 语料里 0 命中，按原则 4 不入册。但缺口本身有信息量：
//   p-whats-this / p-are-these  第一册最基础的问答句型，位于「双课练习课」，
//                               而本语料只收录了 72 个奇数主课（官方 144 课）。
//                               这是语料范围导致的系统性缺席，不是规则写错。
//   p-i-wonder                 语料里只有独立句 "I wonder."，没有从句形式
//   p-do-you-know / p-how-often / p-there-seems / p-so-as-to /
//   p-there-is-no-point / p-what-if
//                              确实不在本语料中
// C 组做教学点抽取时，这些点应标为「本课语料无法验证」而不是忽略。
export const offCorpusPatterns = [
 'p-are-these',
 'p-whats-this',
 'p-there-seems',
 'p-how-often',
 'p-i-wonder',
 'p-do-you-know',
 'p-so-as-to',
 'p-there-is-no-point',
 'p-what-if',
];

// ── 搭配：经语料验证后入册（B4）──────────────────────────────
// 候选 233 条（动词+介词 / be+形容词+介词），逐条过发货的 chunkRegex，
// 只有真出现在语料里的 27 条入册。其余 206 条不是被淘汰，而是语料范围之外：
// 教材把这些搭配放在练习课与搭配总表（第二册 L22 / L70），而本语料只收课文正文。
// 缺口清单见 offCorpusCollocations。
const chunkText = `
have to|不得不
one of|其中之一
be able to|能够
a few|少量；一些（可数）
used to|过去经常
look at|看
live in|住在
not only|不仅
thank you|谢谢你
come to|达到；苏醒
be on|上映；开着
of course|当然
more than|多于
as well|也
at all|根本
most of|大多数
be going to|将要
as soon as|一…就…
go on|继续；发生
a little|少量；一点（不可数）
go into|进入；调查
years ago|多年前
a great many|很多
so that|以便
come from|来自
thousands of|数千
some of|其中一些
a number of|若干；许多
arrive at|到达
in fact|事实上
at least|至少
come in|进来
pick up|拾起；接人；习得
a lot|许多
sort of|有点
for instance|例如
find out|查明
i'm afraid|恐怕
many of|其中许多
as if|好像
at once|立即
a lot of|许多
no longer|不再
come into|进入
at home|在家
at it|忙着
a long time|很长时间
many years|许多年
at last|终于
in this way|用这种方式
get up|起床；站起来
set out|出发；着手
sit down|坐下
human beings|人类
in the morning|在早上
stay at|住在
return to|回到
give up|放弃
ask for|请求
wake up|醒来
think of|想到；认为
work on|从事；影响
hundreds of|数百
per cent|百分之
one day|有一天
such as|例如
be used to|习惯于
a great deal|大量
be possible to|可能
interest in|对…的兴趣
at first|起初
every day|每天
in front of|在…前面
because of|因为
full of|充满
you see|你知道
all right|好吧
each other|互相
in front|在前面
in bed|卧床
stay in|待在家里
how much|多少
arrive in|抵达
here you are|给你
point out|指出
lead to|导致；通向
go up|上升；上涨
in order|整齐；按顺序
at night|在夜里
last year|去年
next morning|第二天早上
work in|在…工作
other side|另一边
the other side|另一边
even if|即使
be impossible to|不可能
on the floor|在地板上
at the time|当时
so far|迄今为止
in spite of|尽管
look after|照顾
look for|寻找
get off|下车；离开
set up|建立；创立
make up|组成；化妆；编造
depend on|取决于
consist of|由…组成
likely to|可能
no more|不再；没有更多
go down|下降；下沉
i'm sorry|对不起
as much as|多达
that's right|没错
half an hour|半小时
united states|美国
the united states|美国
last week|上周
get to|到达
work for|为…工作
front door|前门
dress in|穿着
nice to meet you|很高兴认识你
at the moment|此刻
since then|从那以后
once more|再一次
in time|及时；最终
on board|在船或飞机上
go out|出去；熄灭
take off|起飞；脱下
bring up|养育；提出
regard as|视为
turn to|转向；求助
live on|靠…生活
as to|至于
see you|回头见
what about|…怎么样
millions of|数百万
engaged in|从事
ever since|自从
what's the matter|怎么了
take part|参与
less than|少于
twenty years|二十年
long ago|很久以前
a short time|很短时间
kind of|有点
hear of|听说
be full of|充满
no matter|无论
be allowed to|被允许
stand on|站在…上
stand in|站在…里
at the bottom|在底部
get out|出去；取出
be over|结束
in the end|最终
for a long time|很长一段时间
all the time|一直
on time|准时
at the bottom of|在…底部
on foot|步行
by train|乘火车
apart from|除了
of his own|属于他自己的
pay for|为…付钱
look like|看起来像
get back|回来
go back|返回
go away|离开
take part in|参加
carry out|执行；实施
run away|逃跑
stand up|站起来
laugh at|嘲笑
belong to|属于
refer to|提到；指的是
capable of|能够
a great deal of|大量
read about|读到
in hospital|住院
good morning|早上好
made of|由…制成
not yet|还没有
one night|一天晚上
for this reason|因此
go to school|上学
more likely|更可能
made in|在…制造
made by|由…制造
in those days|那时候
hundred years|一百年
none of|没有一个
be worth|值得
be likely to|可能
be capable of|能够
be based on|基于
even though|尽管
the first time|第一次
be unable to|无法
speak to|对…说
face with|面对
do with|处理
at the station|在车站
be about|即将
search for|搜寻
dream of|梦想
as usual|像往常一样
for the first time|第一次
by the end of|到…结束时
on the way|在途中
on display|陈列；展示
as long as|只要；与…一样长
as far as|就…而言；远至
according to|根据
on the other hand|另一方面
needless to say|不用说
in despair|绝望地
look on|旁观
get on|上车；进展
get rid of|摆脱；除去
get away|逃脱；离开
get into|进入；陷入
go through|经历；检查
give rise to|引起
take out|取出
put out|扑灭
put up|搭建；张贴
set off|出发；引发
wait for|等待
settle down|安定下来
worry about|担心
interested in|对…感兴趣
aware of|意识到
willing to|愿意
not at all|一点也不；不客气
no doubt|无疑
come up|出现；被提出
fly over|飞越
point at|指向
in fashion|流行
at the end of|在…末尾
at the same time|同时
on end|连续地
due to|由于
close to|接近
sure of|确信
sorry for|为…抱歉
for a moment|一会儿
in the evening|在晚上
old friend|老朋友
small town|小镇
bad habit|坏习惯
designed by|由…设计
no matter how|无论如何
by now|到现在
be supposed to|应该
be known as|被称为
miles per hour|每小时英里
side to side|左右
how many|多少
by the end|到最后
at the end|在末尾
be expected to|预计
move into|搬进
work at|从事于
write to|写信给
come with|伴随
take to|喜欢上
come at|扑向
in the middle|在中间
be back|回来
from the moment|从那一刻起
the day before|前一天
the day after|第二天
thank you very much|非常感谢
just then|就在那时
at that moment|在那一刻
in the middle of|在…中间
on the left|在左边
on the right|在右边
in sight|看得见
by air|乘飞机
as well as|也；还；和…一样好
instead of|而不是；代替
in addition to|除…之外还
in addition|此外
by means of|通过；借助
in terms of|就…而言
after all|毕竟
above all|尤其重要的是
of their own|属于他们自己的
in general|一般而言
look up|查找；抬头看
turn round|转过身
turn out|结果是；被发现是
go to sleep|入睡
have a look|看一看
had better|最好
break down|出故障；崩溃
bring about|引起
call in|请来
hold up|耽搁；举起
proud of|为…自豪
free from|免于
accustomed to|习惯于
bound to|必定
obliged to|不得不
plenty of|充足的
as it were|可以说；仿佛
sure enough|果然
grow up|长大
hang up|挂断电话
run through|穿过；浏览
write out|写出；开列
fly through|飞过
cut through|穿过；抄近路
deal with|处理
make for|走向；有助于
in case|以防
in future|今后
in order to|为了
at present|目前
at sea|在海上；茫然
at the beginning of|在…开始
at work|在工作
by sea|乘船
over and over|反复
up and down|上上下下
would you mind|你介意吗
let me see|让我想想
a series of|一系列
the majority of|大多数
all sorts of|各种各样的
together with|连同
in the afternoon|在下午
at that time|那时
these days|如今
few of|很少
be about to|即将
be bound to|一定会
be ready to|准备
be engaged in|从事于
to one's surprise|令某人惊讶
be faced with|面临
be filled with|充满
be fitted with|装有
be made of|由…制成
be trapped in|被困在
be designed by|由…设计
name and address|姓名与地址
science and technology|科学技术
be confined to|限于
be known to|为…所知
be used for|用于
be used in|用于
be recorded in|记录在
be killed in|死于
be part of|是…的一部分
be difficult to|难以
be necessary to|对…必要
fall into|落入
get in|进入
keep in|保持在
drive at|意在
at the beginning|起初
in the centre|在中心
on the table|在桌上
for a walk|去散步
in the future|将来
in the spring|在春天
during the day|在白天
during the night|在夜里
in the same way|同样地
in the midst of|在…之中
on the outskirts of|在…郊外
a great number of|大量的
out of the window|向窗外
out of the water|从水里
out of the shop|从店里
more and more|越来越多
but for|要不是
escape from|逃离
excuse me|劳驾；打扰一下
how do you do|初次见面的问候
day and night|日夜不停
night after night|一夜又一夜
up to now|到目前为止
before long|不久之后
in the meantime|在此期间
next to|紧挨着
next door|在隔壁
far away|在远处
for sale|待售
for example|例如
on the whole|总体而言
more or less|或多或少；大致
what is more|更重要的是
to tell you the truth|说实话
by chance|偶然地
in public|公开地
look out|小心；向外看
look through|浏览；透过…看
turn on|打开
get out of|从…出来；摆脱
get used to|习惯于
get down to|开始认真做
go to bed|上床睡觉
take place|发生
take up|开始从事；占据
put forward|提出
put together|组装；组合
make sure|确保
make a living|谋生
would like|想要
carry on|继续
catch sight of|看见
run out of|用完
break into|闯入；突然开始
call at|短暂拜访某处
call out|大声喊
hand over|移交
hand down|传给后代
hand in|上交
responsible for|对…负责
different from|与…不同
in favour of|赞同；有利于
in response to|作为对…的回应
in accordance with|按照
by heart|熟记
in full|完整地
nothing but|只是；仅仅
in short|简而言之
what a pity|真遗憾
pull out|抽出；驶出
cut off|切断
come out|出来；出版
drive away|开车走；赶走
throw away|扔掉
make out|辨认出；理解
light up|点亮；照亮
draw up|停下；起草
come along|一起来；出现
ring up|打电话
go off|走开；爆炸；响起
write down|写下
rise up|升起；起义
keep on|继续
look into|调查
bring in|引入；带来
lay out|布置；摆放
in charge of|负责
on earth|究竟
on fire|着火
at the age of|在…岁时
at times|有时
by contrast|相比之下
by no means|绝不
for nothing|免费；徒劳
under control|受控制
with ease|轻松地
at hand|在手边
first of all|首先
on the move|在移动
once upon a time|从前
to and fro|来回
how are you|你好吗
would you like|你想要
certainly not|当然不
i see|我明白了
you know|你知道
it doesn't matter|没关系
come on|来吧；得了吧
so long|再见
a large number of|大量的
a couple of|两个；几个
the rest of|其余的
one another|互相
ought to|应该
be due to|由于；预定
along with|连同
as for|至于
worthy of|值得
related to|与…有关
on the part of|在…方面
at school|在学校
all night|整夜
next day|第二天
right now|现在
and so on|等等
both of|两个都
each of|每一个
be willing to|愿意
make one's way|前往
make up one's mind|下定决心
on one's own|独自
argue with|与…争论
be different from|与…不同
be interested in|对…感兴趣
be pleased with|对…满意
be proud of|为…骄傲
be covered with|覆盖着
be divided into|被分成
be prepared for|为…做好准备
be separated from|与…分离
be surrounded by|被…环绕
be deprived of|被剥夺
be paid for|为…付款
be put into|被放入
be struck by|被…击中
shapes and sizes|形状与尺寸
roast beef|烤牛肉
any more|再
such things|这类事情
be ordered to|被命令
be required to|被要求
be instructed to|被指示
be reluctant to|不愿
be prepared to|准备
be employed to|受雇于
be intended to|旨在
be surprised to|惊讶地
be amazed to|惊讶于
be astonished to|震惊于
be received by|被…接收
be fixed to|固定在
be incapable of|不能
be analogous to|类似于
be enough to|足以
be quick to|迅速
at the top|在顶部
on the other side|在另一边
in the air|在空中
on the wall|在墙上
at the door|在门口
get down|下来；记下
run out|用完；跑出去
do up|系上；整理
be up|起床；上升
be out|外出；熄灭
at the foot of|在…脚下
so far as|就…而言
believe in|相信
recover from|从…恢复
compete with|与…竞争
once a month|每月一次
once a week|每周一次
year in year out|年复一年
from now on|从现在起
sooner or later|迟早
at any moment|随时
at the top of|在…顶部
out of order|出故障；无序
out of control|失去控制
out of breath|气喘吁吁
at large|未被捕获；逍遥在外
by car|乘汽车
in contrast|相比之下
as a matter of fact|事实上
to some extent|在一定程度上
at most|至多
in that case|那样的话
at any rate|不管怎样
to my surprise|令我惊讶的是
to their surprise|令他们惊讶的是
to our dismay|令我们沮丧的是
in surprise|惊讶地
without difficulty|毫不费力地
for a while|一会儿
all of a sudden|突然
little by little|一点一点地
bit by bit|逐渐地
by the way|顺便说一下
pay attention|注意
look forward to|期待
turn back|往回走
get over|克服；恢复
come back|回来
come across|偶遇；偶然发现
come true|实现
come into use|开始被使用
take advantage of|利用
take into account|把…考虑在内
take charge of|负责
take turns|轮流
put on|穿上；上演
put away|收好
make up for|弥补
make do with|凑合使用
keep in touch with|保持联系
keep an eye on|留意；照看
keep order|维持秩序
keep calm|保持镇定
keep his word|信守承诺
run into|偶遇；遇到
break out|爆发
call for|需要；要求
hold back|阻止；抑制
listen to|听
rely on|依赖
think about|考虑
care for|照顾；喜欢
suffer from|遭受
remind of|使想起
in return for|作为对…的回报
fond of|喜欢
similar to|与…相似
familiar with|熟悉
in the possession of|由…拥有
in search of|寻找
in connection with|与…有关
as a result|结果
as a result of|由于
in the light of|考虑到；根据
on the verge of|濒临；即将
at the sight of|一看见
all over the world|全世界
lots of|许多
anything but|绝不
rather than|而不是
other than|除了；不同于
let alone|更不用说
so to speak|可以说
that's all right|没关系
it's none of your business|不关你的事
sell out|卖完
catch up|赶上
pay back|偿还
blow up|爆炸；放大
cut down|砍倒；削减
send back|退回
let out|放出；发出
hear about|听说
come down|下来；下降
look back|回头看；回顾
go over|复习；检查
look around|环顾
send out|发出
sweep up|清扫
drive off|驱车离开
fall off|掉下；减少
slide off|滑落
sit up|坐起来；熬夜
move on|继续前进
take on|承担；呈现
give way to|让位于
turn over|翻转；移交
turn against|反对
bring down|降低；打倒
work out|算出；锻炼；解决
sort out|分类；解决
wear out|磨损；使疲乏
lay down|放下；规定
pull up|停下
stick to|坚持
throw up|呕吐；抛起
use up|用完
burst out|突然爆发
face up to|勇敢面对
keep in touch|保持联系
occur to|想起
result in|导致
result from|由…造成
speak up|大声说
in debt|负债
in detail|详细地
in ink|用墨水
in need|需要帮助
in place of|代替
in prison|坐牢
in return|作为回报
in the way|挡路
in touch|联系
in vain|徒劳
in writing|书面
on duty|值班
on holiday|度假
on show|展出
on strike|罢工
on the contrary|相反
on the spot|当场
on top of|在…上面
at best|充其量
at war|交战
by far|…得多
for fear of|生怕
for good|永久地
for life|终身
for once|就这一次
for short|简称
out of danger|脱离危险
as yet|至今
all the same|仍然
at the mercy of|任由…摆布
be fond of|喜欢
be responsible for|对…负责
do without|没有…也行
far from|远非
first and foremost|首要的是
hand in hand|手拉手；密切相关
here and there|到处
keep a straight face|板着脸
more often than not|往往
not to mention|更不用说
on and off|时断时续
on the brink of|濒于
once and for all|一劳永逸
stay up|熬夜
straight away|立刻
take for granted|想当然
up to date|最新的
good afternoon|下午好
here it is|在这儿
i beg your pardon|请再说一遍
how about|…怎么样
not really|也不尽然
of course not|当然不
it depends|看情况
go ahead|请继续
cheer up|振作点
hurry up|快点
would rather|宁愿
be sure to|务必
except for|除…之外
contrary to|与…相反
tired of|厌倦
afraid of|害怕
characteristic of|特有的
exposed to|暴露于
relevant to|与…相关
superior to|优于
subject to|易受
worried about|担心
made from|由…制成
composed of|由…组成
in comparison with|与…相比
under the impression|以为
at noon|在中午
all day|一整天
no matter what|无论什么
from then on|从那时起
the other day|前几天
for ever|永远
never again|再也不
or so|大约
a good deal|大量
either of|两者之一
neither of|两者都不
be subject to|受制于
do one's best|尽力
drive sb mad|把某人逼疯
go out of one's way|不辞辛劳
hold one's breath|屏住呼吸
keep one's word|守信
speak of|谈到
respond to|回应
be afraid of|害怕
be busy with|忙于
be certain of|确信
be free from|没有
be kind to|对…友好
be late for|迟到
be popular with|受…欢迎
be similar to|与…相似
be sorry for|为…抱歉
be sure of|确信
be surprised at|对…惊讶
be wrong with|出毛病
be crowded with|挤满
be dressed in|穿着
be forced to|被迫
be made from|由…制成
be related to|与…有关
be composed of|由…组成
be connected with|与…相连
be accustomed to|习惯于
be born in|出生于
be confronted with|面对
be followed by|紧随其后
be impressed by|对…印象深刻
be influenced by|受…影响
as though|好像
in a way|在某种意义上
all the way|一路上
out of the way|不挡路
be associated with|与…相关
in the dark|在黑暗中
in the open|在户外
in the snow|在雪中
in the sky|在天上
on the ground|在地上
at the window|在窗边
at the airport|在机场
in the summer|在夏天
in the autumn|在秋天
in the winter|在冬天
a small number of|少量的
in the course of|在…过程中
along the way|沿途
all night long|整夜
in some ways|在某些方面
in many ways|在许多方面
for one thing|一则
if only|要是…就好了
in a word|总之
in part|部分地

prefer to|更喜欢
talk to|和…说话
complain about|抱怨
account for|解释；占
be glad to|高兴
talk about|谈论
pay attention to|注意
die of|死于
catch up with|赶上
point to|指向
reply to|回复
come about|发生
fall out|争吵
pass on|传递
be astonished at|对…震惊
be good for|对…有益
be familiar with|熟悉
be far from|远非
be absent from|缺席
be exempt from|免除
be eager to|渴望
be careful to|注意去
be pleased to|乐意
be determined to|决心
be grateful to|感激
be dedicated to|献身于
be hard on|对…严厉
`;
const used = new Set();

/** be 的各种形式。语块里的 "be XXX" 在原文中几乎从不以 be 原形出现。 */
/** ECDICT exchange 字段混进来的非动词屈折形式。真词，会造成跨词误配。 */
const JUNK_FORMS = new Set(['of','i','it','my','we','they','its','goods','bads','best','worse','worst','further','furthest','fars','ins','ats','mores','bes','haves','ones','one-which']);
/** 功能词永不参与变形。ECDICT 把 "a" 的表读成了 an，会把 "a few" 变成 "(?:an) few"。 */
const NO_INFLECT = new Set(['a','an','the','of','in','on','at','to','for','with','from','by','as','and','or','but','if','so','not','no','more','most','one','all','any','some','each','every','both','either','neither','other','another','such','there','here','then','now','only','own','two','three','very','just','too','out','up','down','off','over']);
/**
 * 首词的所有可信形式。三条过滤缺一不可：
 *   1. 功能词不展开（否则 "a few" → "(?:an) few"）
 *   2. 丢掉 ECDICT 混入的非动词屈折（"have" 的表里有 "of"）
 *   3. 首词本身必须保留（曾经因为长度过滤把单词首词丢光，只剩一个错的替代形式）
 */
function headForms(head){
 if (NO_INFLECT.has(head)) return [head];
 const raw = formsOf(head);
 const list = (typeof raw === 'string' ? raw.split('|') : raw)
  .filter((f) => /^[a-z]+$/.test(f))
  .filter((f) => !JUNK_FORMS.has(f))
  .filter((f) => f.length <= head.length + 5);
 if (!list.includes(head)) list.unshift(head);
 return list;
}
const BE_GAP='\\s+(?:(?:very|quite|so|really|rather|extremely|always|never|still|just|not|also|too|most|more|only|already|often|usually|sometimes)\\s+)*';
// 占位符展开：清单里写的 one's / sb 在语料里永远不会字面出现，
// 语料里是 "to my surprise"、"do his best"。不展开这些语块就是死的。
const PLACEHOLDER_MAP=[[/one's/g,'(?:my|your|his|her|its|our|their)'],[/\bsb\b/g,'(?:me|you|him|her|us|them|someone|somebody)'],[/\bsth\b/g,'(?:something|anything|nothing|it)'],[/\boneself\b/g,'(?:myself|yourself|himself|herself|itself|ourselves|themselves)']];
const expandPlaceholders=(text)=>{let out=text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');for(const [re,alt] of PLACEHOLDER_MAP)out=out.replace(re,alt);return out;};
export function chunkRegex(name){
 const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
 const [first, ...rest] = name.split(' ');
 if (!rest.length) return new RegExp('(?<![A-Za-z])' + esc(first) + '(?![A-Za-z])', 'gi');
 const forms = headForms(first);
 const alt = first === 'be'
  ? '(?:be|is|are|was|were|am|been|being)'
  : (forms.length > 1 ? '(?:' + forms.map(esc).join('|') + ')' : esc(forms[0]));
 let tail = expandPlaceholders(rest.join(' ')).replace(/ /g, '\\s+');
 if (name === 'pay attention') tail = '(?:(?:any|no|much|little|some|close)\\s+)?attention';
 const gap = first === 'be' ? BE_GAP : '\\s+';
 return new RegExp('(?<![A-Za-z])' + alt + gap + tail + '(?![A-Za-z])', 'gi');
}

export const chunks = chunkText.trim().split('\n').map(x=>x.split('|')).filter(([n])=>n&&n.trim()&&!used.has(n)&&used.add(n)).map(([name,meaning])=>({ id:'c-'+name.replace(/[^a-z]+/g,'-'),type:'chunk',name,meaning,provenance:'editorial',regex:chunkRegex(name) }));

// 语料范围外的搭配：教材 L22（动词+介词）与 L70（形容词+介词）以搭配总表的形式
// 教学，而本语料只收课文正文，不含练习课与总表。下列搭配在 288 课里 0 命中，
// 不是"没被采用"，是"语料里教不到"。C 组做教学点抽取时应标为「本课语料无法验证」。
export const offCorpusCollocations = [
 'ask about',
 'hear from',
 'insist on',
 'concentrate on',
 'call on',
 'take care of',
 'take pride in',
 'take over',
 'make fun of',
 'make use of',
 'agree with',
 'agree on',
 'prevent from',
 'protect from',
 'inform of',
 'convince of',
 'approve of',
 'hope for',
 'prepare for',
 'provide with',
 'supply with',
 'compare with',
 'compare to',
 'connect with',
 'fill with',
 'cover with',
 'share with',
 'help with',
 'begin with',
 'end with',
 'meet with',
 'put up with',
 'keep up with',
 'come up with',
 'object to',
 'contribute to',
 'devote to',
 'adapt to',
 'adjust to',
 'apologize to',
 'explain to',
 'introduce to',
 'owe to',
 'allow for',
 'long for',
 'stand for',
 'apply for',
 'succeed in',
 'persist in',
 'engage in',
 'participate in',
 'burst into',
 'turn into',
 'translate into',
 'divide into',
 'separate from',
 'differ from',
 'distinguish from',
 'benefit from',
 'date from',
 'depart from',
 'derive from',
 'retire from',
 'resign from',
 'graduate from',
 'judge from',
 'put off',
 'break up',
 'turn up',
 'turn down',
 'give in',
 'give away',
 'run over',
 'see off',
 'show off',
 'show up',
 'hold on',
 'drop in',
 'drop out',
 'fall behind',
 'hand out',
 'pick out',
 'figure out',
 'check out',
 'pass away',
 'calm down',
 'slow down',
 'speed up',
 'be aware of',
 'be conscious of',
 'be guilty of',
 'be short of',
 'be tired of',
 'be typical of',
 'be worthy of',
 'be ashamed of',
 'be careful of',
 'be independent of',
 'be innocent of',
 'be ignorant of',
 'be doubtful of',
 'be fearful of',
 'be tolerant of',
 'be free of',
 'be involved in',
 'be absorbed in',
 'be rich in',
 'be successful in',
 'be experienced in',
 'be lacking in',
 'be disappointed in',
 'be confident in',
 'be good at',
 'be bad at',
 'be clever at',
 'be skilled at',
 'be amazed at',
 'be annoyed at',
 'be angry at',
 'be present at',
 'be quick at',
 'be slow at',
 'be expert at',
 'be shocked at',
 'be ready for',
 'be famous for',
 'be fit for',
 'be grateful for',
 'be suitable for',
 'be anxious for',
 'be eager for',
 'be thankful for',
 'be qualified for',
 'be known for',
 'be useful for',
 'be bad for',
 'be necessary for',
 'be essential for',
 'be important for',
 'be angry with',
 'be satisfied with',
 'be careful with',
 'be patient with',
 'be content with',
 'be delighted with',
 'be disappointed with',
 'be bored with',
 'be concerned with',
 'be equipped with',
 'be impressed with',
 'be satisfied with',
 'be strict with',
 'be fed up with',
 'be acquainted with',
 'be charged with',
 'be safe from',
 'be separate from',
 'be derived from',
 'be distinct from',
 'be happy to',
 'be free to',
 'be keen to',
 'be addicted to',
 'be exposed to',
 'be devoted to',
 'be married to',
 'be opposed to',
 'be superior to',
 'be inferior to',
 'be indifferent to',
 'be sensitive to',
 'be loyal to',
 'be faithful to',
 'be polite to',
 'be rude to',
 'be friendly to',
 'be cruel to',
 'be generous to',
 'be helpful to',
 'be important to',
 'be essential to',
 'be relevant to',
 'be suited to',
 'be adapted to',
 'be committed to',
 'be dependent on',
 'be keen on',
 'be intent on',
 'be focused on',
 'be reliant on',
 'be sorry about',
 'be worried about',
 'be concerned about',
 'be anxious about',
 'be careful about',
 'be certain about',
 'be enthusiastic about',
 'be excited about',
 'be happy about',
 'be nervous about',
 'be optimistic about',
 'be particular about',
 'be pessimistic about',
 'be serious about',
 'be upset about',
 'be curious about',
];

export const connective = /\b(?:however|therefore|because|although|though|meanwhile|nevertheless|moreover|furthermore|instead|then|finally|consequently|thus|yet|but|so|otherwise|for instance|for example|on the other hand|in contrast)\b/gi;
export const stop = new Set(`a an the and or but if as at by for from in into of on to with without than that this these those it its it's is are was were be been being have has had do does did can could will would shall should may might must need i you he she we they me him her us them my your his our their who whom whose which what why when where how not no nor so too very just all any some each every either neither both other another such there here then now only own one two three mr mrs miss sir said says say`.split(/\s+/));

// Reusable basic frames, with spans anchored to the user's actual sentences.
rules.push(
 rule('p-cannot','pattern','I cannot / could not … · 表达做不到','主语 + cannot / could not + 动词原形。把动作换成听见、理解或完成，表达能力或情境上的限制。', /\b(?:I|you|he|she|we|they)\s+(?:cannot|can not|could not|can't|couldn't)\s+[a-z]+\b/gi,'g-modal'),
 rule('p-was-doing','pattern','was / were doing · 交代当时情景','主语 + was / were + 动词 -ing。先交代当时正在做什么，再接后来的事情。', /\b(?:I|you|he|she|we|they)\s+(?:was|were)\s+(?:(?:not|still)\s+)?[a-z]+ing\b/gi,'g-past-continuous')
);
// Inflected phrasal verbs belong to one phrase, rather than becoming unrelated cards.
// be 开头的语块要留出副词槽位："am very proud of" / "is always full of"。
// 没有这个槽，整类 be+形容词/分词+介词 的搭配都匹配不到。
// 占位符展开：清单里写的 one's / sb 在语料里永远不会字面出现，
// 语料里是 "to my surprise"、"do his best"。不展开这些语块就是死的。
// 注意：verify-chunks 用的是同一套逻辑，两边必须一致，否则验证通过而线上匹配不到。

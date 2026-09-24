// Editorial learning annotations. These are NOT supplied textbook notes.
// Only an exact text match creates an occurrence; original text is never rewritten.
const rule = (id, type, name, meaning, regex, parent) => ({id, type, name, meaning, regex, parent, provenance:'editorial-rule'});
const pp = "(?:been|done|gone|seen|known|found|made|taken|given|written|spoken|bought|brought|thought|taught|told|built|sent|left|lost|kept|held|heard|caught|read|paid|put|set|cut|won|sold|shown|grown|become|begun|broken|driven|eaten|fallen|forgotten|flown|got|gotten|hidden|hurt|met|run|risen|stolen|stood|swum|thrown|worn|[a-z]+ed)";
const adv = '(?:(?:already|just|never|ever|always|often|nearly|recently|not|yet|also|only|still|probably|certainly|suddenly|carefully|fully|successfully|specially|completely|been)\\s+){0,3}';
export const rules = [
 rule('g-past','grammar','一般过去时','讲述已经发生的动作或过去的状态。关注过去式及其对应的时间线。', /\b(?:was|were|did|went|had|saw|said|came|got|took|gave|made|found|thought|told|heard|felt|left|bought|brought|stood|sat|ran|knew|began|became|lost|wrote|spoke|read|looked|asked|turned|arrived|wanted|replied|returned|noticed|received|decided|stopped|visited|happened)\b/gi),
 rule('g-present','grammar','一般现在时','描述经常发生的行为、习惯或一般状态。注意第三人称单数和频率副词。', /\b(?:(?:I|you|we|they)\s+(?:(?:always|often|usually|sometimes|never)\s+)?(?:like|know|live|work|want|have|need|think|do|see|go|get|find|feel|believe|read)|(?:he|she|it)\s+(?:(?:always|often|usually|sometimes|never)\s+)?(?:likes|knows|lives|works|wants|has|needs|thinks|does|goes|gets)|am|is|are)\b/gi),
 rule('g-present-continuous','grammar','现在进行时','be + 动词 -ing，描述此刻或当前一段时期正在发生的动作。', /\b(?:am|is|are|'m|'re|'s)\s+(?:(?:not|still|always|now)\s+)?[a-z]+ing\b/gi),
 rule('g-past-continuous','grammar','过去进行时','was / were + 动词 -ing，交代过去某一时刻的动作或故事背景。', /\b(?:was|were)\s+(?:(?:not|still|always|busily)\s+)?[a-z]+ing\b/gi),
 rule('g-present-perfect','grammar','现在完成时','have / has + 过去分词。连接过去的经历与现在的结果，而非单纯定位过去时间。', new RegExp(`(?:\\b(?:have|has)|'ve|'s)\\s+${adv}${pp}\\b`,'gi')),
 rule('g-past-perfect','grammar','过去完成时','had + 过去分词，说明某个过去时间点之前已经发生的事情。', new RegExp(`\\bhad\\s+${adv}${pp}\\b`,'gi')),
 rule('g-future','grammar','一般将来时','用 will / shall 表达将来的行动、预测或临时决定。', /(?:\b(?:will|shall)|'ll)\s+(?:not\s+)?[a-z]+\b/gi),
 rule('g-going-to','grammar','be going to 表计划','be going to + 动词原形，表达打算或有迹象的预测。', /\b(?:am|is|are|'m|'s|'re)\s+going\s+to\s+[a-z]+\b/gi),
 rule('g-future-continuous','grammar','将来进行时','will be + 动词 -ing，说明将来某个时间正在进行的活动。', /\bwill\s+be\s+[a-z]+ing\b/gi),
 rule('g-future-perfect','grammar','将来完成时','will have + 过去分词，以未来的时间为参照回看已完成的行动。', new RegExp(`\\bwill\\s+have\\s+${pp}\\b`,'gi')),
 rule('g-perfect-continuous','grammar','完成进行时','have / has / had been + 动词 -ing，突出行为的持续过程。', /\b(?:have|has|had)\s+been\s+[a-z]+ing\b/gi),
 rule('g-passive','grammar','被动语态','be + 过去分词，把动作的承受者放在叙述中心。注意也可能是表示状态的分词。', new RegExp(`\\b(?:am|is|are|was|were|be|been|being)\\s+(?:(?:not|often|always|just|carefully|fully|recently|finally|usually|specially)\\s+){0,2}${pp}\\b`,'gi')),
 rule('g-modal','grammar','情态动词','can / could / may / might / must / should 等后接动词原形。结合语境区分能力、许可、义务与推测。', /\b(?:can|could|may|might|must|should|would|ought to|needn't|mustn't|can't|couldn't)\s+(?:not\s+)?[a-z]+\b/gi),
 rule('g-deduction','grammar','情态动词表推测','must / might / may / could have + 过去分词，对过去作出推测。', new RegExp(`\\b(?:must|might|may|could|should|can't|couldn't)\\s+(?:not\\s+)?have\\s+${pp}\\b`,'gi')),
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
 rule('g-infinitive','grammar','动词不定式','to + 动词原形，可表达目的或补充动词含义。此处只标记词表内的明确动词。', /\bto\s+(?:be|do|go|see|get|make|take|have|give|find|know|understand|learn|read|write|say|tell|buy|come|leave|help|work|live|keep|return|stay|look|pay|put|ask|meet|use|try|bring|think|explain|discover|accept|receive|become|build|reach|avoid|solve|save|collect|remember|forget)\b/gi),
 rule('g-gerund','grammar','介词后的 -ing','介词后常用动词 -ing 形式。把介词与其后的动作整体理解。', /\b(?:of|in|by|without|for|after|before|on|about)\s+[a-z]+ing\b/gi),
 rule('g-participle','grammar','分词作状语','句首分词结构可交代时间、原因或伴随状态；先找它和主句主语的关系。', /^(?:['"“”]\s*)?(?:[A-Za-z]+ing|Armed|Dressed|Faced|Tired|Convinced|Designed|Built|Not realizing|Not wanting)\s+[^,]{2,75},/g),
 rule('g-negation','grammar','否定句','注意 not / never / no longer 等如何改变整句的意义。', /\b(?:do not|does not|did not|don't|doesn't|didn't|is not|are not|was not|were not|isn't|aren't|wasn't|weren't|never|no longer)\b/gi),
 rule('g-imperative','grammar','祈使句','用动词原形给出请求、建议或指令；please 可以缓和语气。', /(?:^|:\s*)(?:Please\s+)?(?:Give|Come|Go|Look|Listen|Tell|Take|Put|Open|Shut|Keep|Be|Let|Try|Show|Read|Don't)\s+[^.!?]{1,65}/gi),
 rule('g-question','grammar','一般疑问句','把 be、助动词或情态动词放在主语前，邀请对方确认信息。', /(?:^|:\s*|['"])(?:Is|Are|Was|Were|Do|Does|Did|Have|Has|Can|Could|Will|Would|May)\s+[^?]{2,75}\?/g),
 rule('g-wh-question','grammar','特殊疑问句','用 what / why / where / when / who / how 明确你想获得的信息。', /\b(?:What|Why|Where|When|Who|Whose|Which|How)\b[^?]{1,85}\?/g),
 rule('g-tag','grammar','反意疑问句','用简短问句确认或征求认同。留意前后肯否、助动词和代词的一致性。', /,\s*(?:isn't|aren't|wasn't|weren't|don't|doesn't|didn't|haven't|hasn't|won't|can't|is|are|was|were|do|does|did|have|has|will|can)\s+(?:it|he|she|they|you|we|I)\s*\?/gi),
 rule('g-exclamation','grammar','感叹句','what / how 开头的感叹结构，把评价与情绪放在句子前面。', /\b(?:What\s+(?:a|an)\s+[^!?]{2,55}|How\s+[a-z]+(?:\s+[^!?]{1,35})?)!/g),
 rule('g-inversion','grammar','倒装强调','否定或限制性表达置于句首时，主语与助动词可能倒装；先还原正常语序。', /\b(?:Not only|Never|Rarely|Hardly|Only when|Only after|No sooner)\s+[^.!?]{3,85}/g),
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
 rule('p-no-sooner','pattern','no sooner … than … · 刚…就','常用于叙事，强调两件事发生得紧接；句首 no sooner 可引发倒装。', /\bno\s+sooner\s+[^.!?]{2,80}\s+than\b/gi,'g-inversion'),
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
];
const chunkText = `
excuse me|劳驾；打扰一下
thank you|谢谢你
thank you very much|非常感谢
nice to meet you|很高兴认识你
how do you do|初次见面的问候
here you are|给你
of course|当然
at once|立即
in the end|最终
at last|终于
just then|就在那时
at the moment|此刻
at that moment|在那一刻
at first|起初
as usual|像往常一样
for a long time|很长一段时间
from time to time|时不时
all the time|一直
for the first time|第一次
once a month|每月一次
once a week|每周一次
every day|每天
day and night|日夜不停
night after night|一夜又一夜
year in year out|年复一年
by the end of|到…结束时
up to now|到目前为止
so far|迄今为止
from now on|从现在起
since then|从那以后
before long|不久之后
sooner or later|迟早
once more|再一次
in the meantime|在此期间
in time|及时；最终
on time|准时
at any moment|随时
on the way|在途中
in front of|在…前面
in the middle of|在…中间
at the top of|在…顶部
at the bottom of|在…底部
on the left|在左边
on the right|在右边
next to|紧挨着
next door|在隔壁
far away|在远处
out of sight|看不见
in sight|看得见
out of order|出故障；无序
out of control|失去控制
out of breath|气喘吁吁
at large|未被捕获；逍遥在外
for sale|待售
on display|陈列；展示
on board|在船或飞机上
by air|乘飞机
on foot|步行
by train|乘火车
by car|乘汽车
as soon as|一…就…
as long as|只要；与…一样长
as far as|就…而言；远至
as well as|也；还；和…一样好
as well|也
because of|因为
in spite of|尽管
instead of|而不是；代替
apart from|除了
according to|根据
in addition to|除…之外还
in addition|此外
in contrast|相比之下
on the other hand|另一方面
for instance|例如
for example|例如
in fact|事实上
as a matter of fact|事实上
in other words|换句话说
in this way|用这种方式
by means of|通过；借助
in terms of|就…而言
to some extent|在一定程度上
on the whole|总体而言
after all|毕竟
above all|尤其重要的是
at least|至少
at most|至多
more or less|或多或少；大致
in any case|无论如何
in that case|那样的话
at any rate|不管怎样
what is more|更重要的是
needless to say|不用说
to tell you the truth|说实话
to my surprise|令我惊讶的是
to their surprise|令他们惊讶的是
to our dismay|令我们沮丧的是
in surprise|惊讶地
in despair|绝望地
in a hurry|匆忙地
with difficulty|费力地
without difficulty|毫不费力地
by chance|偶然地
on purpose|故意地
of his own|属于他自己的
of their own|属于他们自己的
of course|当然
in common|共同的
in particular|尤其；特别
in general|一般而言
in public|公开地
in private|私下里
for a while|一会儿
all of a sudden|突然
little by little|一点一点地
bit by bit|逐渐地
now and then|偶尔
by the way|顺便说一下
pay attention|注意
pay for|为…付钱
look after|照顾
look for|寻找
look at|看
look up|查找；抬头看
look forward to|期待
look out|小心；向外看
look on|旁观
look like|看起来像
look through|浏览；透过…看
turn round|转过身
turn back|往回走
turn off|关掉
turn on|打开
turn into|变成
turn out|结果是；被发现是
get up|起床；站起来
get off|下车；离开
get on|上车；进展
get out of|从…出来；摆脱
get rid of|摆脱；除去
get used to|习惯于
get away|逃脱；离开
get back|回来
get into|进入；陷入
get over|克服；恢复
get down to|开始认真做
come in|进来
come back|回来
come from|来自
come across|偶遇；偶然发现
come to|达到；苏醒
come true|实现
come into use|开始被使用
go on|继续；发生
go out|出去；熄灭
go back|返回
go away|离开
go through|经历；检查
go to bed|上床睡觉
go to sleep|入睡
give up|放弃
give rise to|引起
give away|赠送；泄露
give back|归还
take off|起飞；脱下
take out|取出
take part in|参加
take place|发生
take care of|照顾
take advantage of|利用
take into account|把…考虑在内
take charge of|负责
take turns|轮流
take up|开始从事；占据
put on|穿上；上演
put out|扑灭
put off|推迟
put up|搭建；张贴
put away|收好
put forward|提出
put together|组装；组合
put down|放下；记下
set out|出发；着手
set off|出发；引发
set up|建立；创立
make up|组成；化妆；编造
make up for|弥补
make sure|确保
make a decision|作决定
make a living|谋生
make an effort|作出努力
make use of|利用
make do with|凑合使用
have a look|看一看
have to|不得不
had better|最好
would like|想要
be able to|能够
used to|过去经常
find out|查明
carry out|执行；实施
carry on|继续
catch sight of|看见
keep in touch with|保持联系
keep up with|跟上
keep an eye on|留意；照看
keep order|维持秩序
keep calm|保持镇定
keep his word|信守承诺
run away|逃跑
run out of|用完
run into|偶遇；遇到
break down|出故障；崩溃
break into|闯入；突然开始
break out|爆发
bring about|引起
bring up|养育；提出
point out|指出
call at|短暂拜访某处
call on|拜访某人；号召
call in|请来
call out|大声喊
call for|需要；要求
ask for|请求
wait for|等待
send for|派人去请
stand for|代表
stand up|站起来
sit down|坐下
lie down|躺下
wake up|醒来
settle down|安定下来
pick up|拾起；接人；习得
pick out|挑选；辨认
hold up|耽搁；举起
hold back|阻止；抑制
hand over|移交
hand down|传给后代
hand in|上交
laugh at|嘲笑
listen to|听
belong to|属于
depend on|取决于
rely on|依赖
consist of|由…组成
lead to|导致；通向
refer to|提到；指的是
regard as|视为
think of|想到；认为
think about|考虑
care for|照顾；喜欢
care about|在意
worry about|担心
suffer from|遭受
prevent from|阻止
provide with|为…提供
remind of|使想起
accuse of|指责
in return for|作为对…的回报
be proud of|为…自豪
proud of|为…自豪
interested in|对…感兴趣
fond of|喜欢
aware of|意识到
capable of|能够
full of|充满
free from|免于
involved in|参与；涉及
responsible for|对…负责
similar to|与…相似
different from|与…不同
familiar with|熟悉
accustomed to|习惯于
willing to|愿意
likely to|可能
bound to|必定
obliged to|不得不
in the possession of|由…拥有
in possession of|拥有
in favour of|赞同；有利于
in response to|作为对…的回应
in search of|寻找
in connection with|与…有关
in accordance with|按照
on behalf of|代表
with regard to|关于
as a result|结果
as a result of|由于
at the expense of|以…为代价
in the light of|考虑到；根据
on the verge of|濒临；即将
at the sight of|一看见
by heart|熟记
in full|完整地
for the sake of|为了
all over the world|全世界
a great deal of|大量
plenty of|充足的
a number of|若干；许多
a lot of|许多
lots of|许多
a few|少量；一些（可数）
a little|少量；一点（不可数）
not at all|一点也不；不客气
not only|不仅
no doubt|无疑
no longer|不再
no more|不再；没有更多
nothing but|只是；仅仅
anything but|绝不
rather than|而不是
other than|除了；不同于
let alone|更不用说
so to speak|可以说
as it were|可以说；仿佛
in short|简而言之
in conclusion|总而言之
sure enough|果然
what a pity|真遗憾
never mind|没关系
that's all right|没关系
it's none of your business|不关你的事
`;
const used = new Set();
export const chunks = chunkText.trim().split('\n').map(x=>x.split('|')).filter(([n])=>!used.has(n)&&used.add(n)).map(([name,meaning])=>({ id:'c-'+name.replace(/[^a-z]+/g,'-'),type:'chunk',name,meaning,provenance:'editorial',regex:new RegExp('(?<![A-Za-z])'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s+')+'(?![A-Za-z])','gi') }));
export const connective = /\b(?:however|therefore|because|although|though|meanwhile|nevertheless|moreover|furthermore|instead|then|finally|consequently|thus|yet|but|so|otherwise|for instance|for example|on the other hand|in contrast)\b/gi;
export const stop = new Set(`a an the and or but if as at by for from in into of on to with without than that this these those it its it's is are was were be been being have has had do does did can could will would shall should may might must need i you he she we they me him her us them my your his our their who whom whose which what why when where how not no nor so too very just all any some each every either neither both other another such there here then now only own one two three mr mrs miss sir said says say`.split(/\s+/));

// Reusable basic frames, with spans anchored to the user's actual sentences.
rules.push(
 rule('p-cannot','pattern','I cannot / could not … · 表达做不到','主语 + cannot / could not + 动词原形。把动作换成听见、理解或完成，表达能力或情境上的限制。', /\b(?:I|you|he|she|we|they)\s+(?:cannot|can not|could not|can't|couldn't)\s+[a-z]+\b/gi,'g-modal'),
 rule('p-was-doing','pattern','was / were doing · 交代当时情景','主语 + was / were + 动词 -ing。先交代当时正在做什么，再接后来的事情。', /\b(?:I|you|he|she|we|they)\s+(?:was|were)\s+(?:(?:not|still)\s+)?[a-z]+ing\b/gi,'g-past-continuous')
);
// Inflected phrasal verbs belong to one phrase, rather than becoming unrelated cards.
const verbForms={get:'get|gets|getting|got|gotten',go:'go|goes|going|went|gone',take:'take|takes|taking|took|taken',give:'give|gives|giving|gave|given',make:'make|makes|making|made',come:'come|comes|coming|came',look:'look|looks|looking|looked',turn:'turn|turns|turning|turned',pay:'pay|pays|paying|paid',set:'set|sets|setting',put:'put|puts|putting',find:'find|finds|finding|found',break:'break|breaks|breaking|broke|broken',keep:'keep|keeps|keeping|kept',pick:'pick|picks|picking|picked',run:'run|runs|running|ran',catch:'catch|catches|catching|caught',carry:'carry|carries|carrying|carried',bring:'bring|brings|bringing|brought',call:'call|calls|calling|called',fall:'fall|falls|falling|fell|fallen',stand:'stand|stands|standing|stood',sit:'sit|sits|sitting|sat',point:'point|points|pointing|pointed',send:'send|sends|sending|sent',hold:'hold|holds|holding|held',grow:'grow|grows|growing|grew|grown',be:'be|am|is|are|was|were|been|being',have:'have|has|having|had'};
for(const chunk of chunks){const [first,...rest]=chunk.name.split(' ');if(!rest.length||!verbForms[first])continue;let tail=rest.join(' ').replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s+');if(chunk.name==='pay attention')tail='(?:(?:any|no|much|little|some|close)\\s+)?attention';chunk.regex=new RegExp('(?<![A-Za-z])(?:'+verbForms[first]+')\\s+'+tail+'(?![A-Za-z])','gi');}

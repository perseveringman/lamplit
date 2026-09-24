// Product learning routes and brief labels, authored for this app, not textbook metadata.
const rows = [
 ['polite','生存','能在公共场合礼貌求助','把请求说清楚，也给对方回应的余地。','礼貌求助','help|please|excuse|request|sorry|pardon|would you|could you'],
 ['meet','生存','能自然地介绍与认识他人','从打招呼开始，把谈话接下去。','初次见面','hello|good morning|name|meet|nationality|introduce|greet'],
 ['food','生存','能点餐、购物并说明需求','说清数量、偏好与想要的东西。','餐饮购物','coffee|tea|shop|buy|meat|bread|food|dinner|meal|price|cost'],
 ['travel','生存','能问路、乘车与安排出行','在陌生的地方确认方向与时间。','旅途出行','train|travel|airport|ticket|journey|holiday|plane|station|passport'],
 ['health','生存','能描述不适与应对紧急情况','说明发生了什么，以及需要怎样的帮助。','健康安全','doctor|hospital|ill|dentist|hurt|rescue|danger|accident|urgent'],
 ['home','日常','能介绍住处与安排家务','用位置、物品和动作描述生活空间。','居家生活','house|kitchen|room|bed|garden|furniture|floor|home'],
 ['routine','日常','能谈论日常习惯与变化','区分平时怎样做，与今天有何不同。','日常习惯','usually|every day|often|always|sometimes|habit|morning|routine'],
 ['plan','日常','能表达计划与未来打算','说明准备做什么、何时做和可能的变化。','计划安排','going to|tomorrow|future|plan|intend|will|next week'],
 ['choice','日常','能比较选择与表达偏好','比较大小、价格或优缺点，再说明选择。','比较选择','prefer|better|best|expensive|cheaper|rather|choose|size'],
 ['feeling','日常','能表达感受与回应情绪','从简单评价到解释感受背后的原因。','感受回应','feel|angry|happy|sad|pleased|afraid|surprise|worried'],
 ['story','叙事','能按时间顺序讲述经历','用时间线把人物、动作和结果连起来。','经历叙述','yesterday|last week|last year|ago|went|came|said|story'],
 ['background','叙事','能交代故事背景与同时发生的事','用背景衬托关键动作，不把故事说成流水账。','场景展开','while|was|were|when|during|meanwhile'],
 ['twist','叙事','能讲清意外、转折与结局','先建立预期，再把变化与结果讲明白。','意外转折','suddenly|surprise|unexpected|however|realized|discovered|unfortunately'],
 ['report','叙事','能转述消息与他人的话','保留原意，同时调整人称、时态和语序。','消息转述','said|told|asked|reported|informed|message|letter|news'],
 ['cause','叙事','能说明原因、条件与后果','把为什么、在什么条件下与会怎样连接起来。','因果说明','because|if|unless|therefore|result|cause|consequence'],
 ['person','读写','能描写人物、性格与行为','用细节和定语让一个人物变得具体。','人物描写','man|woman|who|character|person|life|personality'],
 ['place','读写','能描写地点、物品与空间','由整体到细节，帮助读者建立清晰画面。','空间描写','town|village|city|building|river|bridge|mountain|island'],
 ['process','读写','能解释过程与工作原理','按顺序说明如何运作，以及各部分的作用。','过程原理','process|method|machine|instrument|operation|water|system|function'],
 ['information','读写','能从说明文中提取关键信息','抓住定义、数字、事实和信息之间的关系。','信息阅读','number|fact|information|data|record|history|evidence'],
 ['culture','读写','能理解文化差异与社会习惯','分清观察、习俗与作者的解释。','文化生活','custom|culture|tradition|society|people|country|art|language'],
 ['compare','思辨','能比较观点与权衡利弊','沿着同一维度比较，避免只罗列差异。','观点比较','however|on the other hand|contrast|comparison|advantage|disadvantage'],
 ['argument','思辨','能提出观点并用例子支撑','识别观点、例证和结论如何一步步推进。','观点论证','believe|think|argue|argument|opinion|for instance|for example'],
 ['evidence','思辨','能区分事实、推测与证据','读懂作者有多确定，以及为什么这样判断。','证据判断','evidence|prove|proof|claim|hypothesis|assume|theory|perhaps|must have'],
 ['science','思辨','能阅读科学与技术话题','把陌生术语放回定义、解释和实例中理解。','科学技术','science|scientific|technology|experiment|space|computer|atom|research'],
 ['society','思辨','能讨论社会问题与价值判断','发现文本的立场、因果链与没有说出的前提。','社会议题','society|social|government|law|education|public|industry|population|freedom'],
];
export const clusters = rows.map(([id,stage,name,description,scene,keywords],index)=>({id,stage,name,description,scene,keywords,index,lessonIds:[]}));
export const bookMeta = [
 {id:1,name:'第一册',en:'First Things First',subtitle:'从生活开口',roman:'I'},
 {id:2,name:'第二册',en:'Practice and Progress',subtitle:'把经历讲成故事',roman:'II'},
 {id:3,name:'第三册',en:'Developing Skills',subtitle:'在细节里读懂语言',roman:'III'},
 {id:4,name:'第四册',en:'Fluency in English',subtitle:'理解观点与世界',roman:'IV'},
];
// Mapping is by source sequence, NOT printed lesson number. Both printed Lesson 27 entries survive.
export const primary = {
 1:`polite polite meet meet meet choice choice travel meet health food food home home home background place place plan plan food food polite food food place place routine routine food health health plan story story report travel choice health food food plan travel twist choice report person travel polite health report feeling polite choice food choice polite home twist twist person travel routine evidence health plan report report plan report twist society`.split(' '),
 2:`story routine story travel report person background choice story process feeling travel plan story report polite person twist polite routine cause report place twist travel argument background home process twist person food health report background plan plan feeling health polite choice culture story background twist travel cause health twist travel routine home evidence home evidence information food evidence routine report science process feeling process background process science polite health background information information story person health report science routine travel information background evidence report society routine background evidence health report place report polite information process twist culture`.split(' '),
 3:`evidence twist information person report background society place science story polite compare twist person twist story information culture feeling information person routine culture twist story argument society choice culture evidence person evidence twist information society evidence travel information travel society compare science process compare society home science travel person routine science twist society science science background story twist routine travel`.split(' '),
 4:`information science compare evidence science society argument society process society information argument society argument information process evidence science society society cause science science argument science culture science science argument society evidence information story argument process information argument culture evidence society society person science society science society society process science information process science information science culture science society routine travel argument`.split(' '),
};
export const titles3 = [
'A puma at large','Thirteen equals one','An unknown goddess','The double life of Alfred Bloggs','The facts','Smash-and-grab','Mutilated ladies','A famous monastery',null,'The loss of Titanic','Not guilty','Life on a desert island',"It's only me",'A noble gangster','Fifty pence worth of trouble','Mary had a little lamb','The longest suspension bridge in the world','Electric currents in modern art','A very dear cat','Pioneer pilots','Daniel Mendoza','By heart',"One man's meat is another man's poison",'A skeleton in the cupboard','The Cutty Sark','Wanted: a large biscuit tin','Nothing to sell and nothing to buy','Five pounds too dear','Funny or not','The death of a ghost','A lovable eccentric','A lost ship','A day to remember','A happy discovery','Justice was done','A chance in a million','The Westhaven Express','The first calendar','Nothing to worry about',"Who's who",'Illusions of Pastoral peace','Modern Cavemen','Fully insured','Speed and comfort','The power of press','Do it yourself',"Through the earth's crust",'The silent village','The Ideal Servant','New Year Resolutions','Automation','Mud is mud','In the public interest','Instinct or cleverness','From the earth: greatings','The river beside our farm','The return of the native','A little spot of bother','Possession amassing and collecting','The importance of Punctuality'
];
export const titles1 = [
'Excuse me','Sorry sir','Nice to meet you','Are you a teacher','How are you today','Is this your shirt','A new dress','Your passport, please','How do you do','Tired and thirsty','Which book','Which glasses',"Mrs. Smith's kitchen","Mrs. Smith's living room",'Come in, Amy',"Where's Sally",'A fine day','Our village','Making a bookcase',"Don't drop it","Penny's bag",'Hurry up',null,'A cup of coffee',"At the butcher's",'A pleasant climate','An interesting climate','The Sawyer family','An unusual day','Is that all',null,'Thank you , doctor','Not a baby','The weekend','The car race',"He's awful",'The way to King Street','Uncomfortable shoes','Terrible toothache',"Peggy's shopping-list",'Roast beef and potato','Going on a holiday','Paris in the Spring','A car crash','For sale','Poor West','Our new neighbor','Ticket, please','A small blue case','Ow','A card from Jimmy','The Intelligence test','Hello, Mr. boss',"It's too small",'A good idea','The most expensive model','small change','Not',"Tommy's breakfast",'A true story','The man in the hat','A trip to Australia',null,'A famous actress','70 miles an hour',"Don't be so sure",'Sensational news','The latest report','A pleasant dream','Is that you, John',"Sally's first train ride",'A walk through the woods'
];
export const labels4 = '追溯人类的过去|蜘蛛与生态|早期登山者|非同寻常的感知|大猩猩的谜团|年轻人与长辈|体育与竞争|变化中的家庭|声音与回声|创造力与社会|国王与情报|电影的表象与内涵|工业与大学城|生命如河流|银行与客户|深层钻探|怎样衡量智力|科研与保密|绅士的社会角色|城市与人的需要|兔子与生态平衡|海豚的游戏|睡眠与梦|散步与思考|蛇的毒液|西部电影的英雄|知识与进步|鸟类的飞行|美与语言|城市的变迁|噪声与证据|化石如何保存|瓦萨号的沉没|对药物的信任|气垫船的原理|认识海洋|真实与便利|欣赏雕塑|重新理解伽利略|人口与资源|教育与平等|青春期的亲子关系|能源的来源|信任与管理成本|衰老与生命|城市的扩张|知识分子的政治观|写作的过程|气球与天文观测|河流的作用|大象的训练|记录地震|军团的起源|宇宙中的生命|习俗与认知|科技延伸人的能力|思想与环境|工作、兴趣与休息|露营与自由|生命、刑罚与同情'.split('|');
export const featured = {
 'b2-001': {scene:'剧院里的一次误会', canDo:'用过去时讲清一段经历，并表达被打扰的感受。', summary:'叙述者在剧院被谈话声打扰，几次表达不满后，却得到一句意想不到的回应。', focus:['g-past','g-past-continuous','c-in-the-end','c-pay-attention','c-turn-round']},
 'b1-001': {scene:'认领一只手提包', canDo:'先礼貌引起注意，再确认物品归属。', summary:'一段由“Excuse me”开始的简短确认与致谢。',focus:['g-question','c-excuse-me','c-thank-you-very-much']},
 'b2-003': {scene:'旅行中的明信片', canDo:'按时间顺序描述计划、行动与最后的反差。',summary:'一次旅行中，叙述者一直惦记寄明信片，直到最后一天作出决定，结果却出人意料。'},
 'b3-001': {scene:'乡间的美洲狮目击报告',canDo:'串联目击描述与证据，区分事实和推测。',summary:'多次相似的目击描述让专家展开调查，但动物的来历和去向仍不明确。'},
 'b4-031': {scene:'噪声与健康的论证',canDo:'区分个案、因果关系与系统研究的证据。',summary:'文章比较轶事与研究证据，提醒读者区分原因、结果和诊断方法的局限。'},
};

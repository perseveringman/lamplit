// 语块候选池：按类别枚举，再由语料验证。
//
// 方法论的由来：我用频率法从语料反挖过三次，每次 top 结果都被 `the most`、
// `to get`、`went to`、`of people` 这类语法组合淹没。频率法分不清「语法组合」
// 和「词汇语块」——这是结构性的，不是调参能解决的。
//
// 所以反过来做：候选来自类别枚举（下面的清单），语料只做验证。
// 只有真的在新概念 1–4 里出现过的才入册，否则就是死条目。
//
// 格式：'name|中文释义'，与 knowledge.mjs 的 chunkText 一致。

export const CHUNK_CANDIDATES = `
// —— 动词 + 副词性小品词（短语动词）——
pick up|捡起；接人
point out|指出
bring up|养育；提出
get up|起床；起身
carry out|执行；实施
run away|逃跑
get back|回来；取回
wake up|醒来
sit down|坐下
take out|取出
go out|出去；熄灭
find out|查明
call out|大声喊
go through|经历；仔细检查
pull out|抽出；驶出
break down|出故障；崩溃
get off|下车；离开
hold up|举起；阻挡
give up|放弃
come up|出现；被提出
cut off|切断
sell out|卖完
go up|上升；上涨
go down|下降；下沉
come out|出来；出版
grow up|长大
hang up|挂断电话
burn down|烧毁
drive away|开车走；赶走
throw away|扔掉
make out|辨认出；理解
light up|点亮；照亮
draw up|停下；起草
come along|一起来；出现
ring up|打电话
go off|走开；爆炸；响起
write down|写下
read about|读到
fly over|飞越
run through|穿过；浏览
write out|写出；开列
fly through|飞过
cut through|穿过；抄近路
catch up|赶上
pay back|偿还
blow up|爆炸；放大
cut down|砍倒；削减
rise up|升起；起义
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
take off|起飞；脱下
turn out|结果是；生产
put out|熄灭；伸出
put on|穿上；上演
put up|举起；搭建
put away|收好
put forward|提出
put together|组装
set off|出发；引爆
set out|出发；着手
set up|建立；安排
break out|爆发
break into|闯入
bring about|引起
hold back|阻止；抑制
keep on|继续
move on|继续前进
pass away|去世
point at|指向
refer to|提到；参考
rely on|依靠
depend on|取决于；依靠
wait for|等待
care for|照顾；喜欢
look after|照顾
look for|寻找
look into|调查
look up|查阅；抬头看
look forward to|期待
come across|偶遇；发现
come into|进入
come from|来自
come back|回来
come in|进来
go back|回去
go on|继续
go into|进入；调查
get on|上车；相处
get into|进入；陷入
get out of|离开；摆脱
get over|克服；恢复
get rid of|摆脱
get used to|习惯于
get down to|开始认真做
get away|离开；逃脱
take up|开始从事；占据
take in|吸收；理解
take over|接管
take on|承担；呈现
take place|发生
take part in|参加
take care of|照顾
take advantage of|利用
take charge of|负责
take into account|考虑到
make up|组成；编造；化妆
make up for|弥补
make sure|确保
make sense|讲得通
make a living|谋生
make a decision|做决定
make an effort|努力
make use of|利用
make do with|凑合
make the most of|充分利用
give away|送掉；泄露
give back|归还
give in|屈服
give off|散发
give out|分发；用完
give way to|让位于
turn on|打开
turn off|关掉
turn into|变成
turn to|转向；求助
turn up|出现；调大
turn down|拒绝；调小
turn over|翻转；移交
turn against|反对
carry on|继续
carry through|完成
bring back|带回；使回忆
bring down|降低；打倒
bring in|引入；带来
bring out|出版；使显现
call on|拜访；号召
call for|需要；要求
call off|取消
call in|召来；拜访
call at|停靠
call back|回电话
put down|放下；记下
put off|推迟
put through|接通电话
work out|算出；锻炼；解决
work on|从事；影响
find out about|了解
figure out|弄明白
sort out|分类；解决
clean up|清理
fix up|安排；修理
check in|登记入住
check out|结账离开
hand in|上交
hand out|分发
hand over|移交
hand down|传下来
show off|炫耀
show up|出现
wear out|磨损；使疲乏
wipe out|消灭
rule out|排除
lay off|解雇
lay out|布置；摆放
lay down|放下；规定
let down|使失望
live on|靠…生活
live up to|不辜负
lock up|锁好
pack up|打包
pull up|停下
pull through|渡过难关
push on|继续推进
reach out|伸出；联系
run into|撞上；偶遇
run out of|用完
run over|碾过；溢出
see off|送行
send for|派人去请
set aside|搁置；留出
settle down|安顿下来
stand by|支持；待命
stand for|代表；容忍
stand out|突出
stand up|站起来
stick to|坚持
sum up|总结
switch on|打开
switch off|关掉
tear down|拆除
tell apart|区分
think over|仔细考虑
think of|想起；考虑
think about|考虑
throw up|呕吐；抛起
try on|试穿
try out|试用
use up|用完
watch out|当心
wear off|逐渐消失
wind up|上发条；结束
burst into|突然进入（某种状态）
burst out|突然爆发
count on|指望
deal with|处理
drop in|顺访
drop out|退出
end up|最终成为
face up to|勇敢面对
fall behind|落后
fall in love|坠入爱河
fit in|融入
hold on|坚持；别挂电话
hold out|伸出；坚持
keep up with|跟上
keep away from|远离
keep in touch|保持联系
keep an eye on|照看
keep calm|保持冷静
keep order|维持秩序
let alone|更不用说
look down on|看不起
make for|走向；有助于
occur to|想起
pay attention|注意
pay for|付款；付出代价
pay off|还清；成功
pick out|挑出
pull off|完成；驶离
put aside|搁置；储蓄
result in|导致
result from|由…造成
set about|着手
show around|带…参观
speak up|大声说
stand up for|支持
take after|长得像
take away|拿走
take back|收回
take down|记下；拆下
tell off|责备
watch for|留意
work up|鼓起

// —— 介词固定短语 ——
in fact|事实上
in reality|实际上
in general|总的来说
in particular|尤其
in private|私下
in public|公开地
in person|亲自
in advance|提前
in addition|另外
in addition to|除…之外
in any case|无论如何
in that case|那样的话
in case|以防
in charge of|负责
in common|共同
in conclusion|总之
in danger|处于危险中
in debt|负债
in detail|详细地
in doubt|怀疑
in fashion|流行
in favour of|支持
in front of|在…前面
in full|全部
in future|今后
in half|分成两半
in honour of|为纪念
in hospital|住院
in a hurry|匆忙
in ink|用墨水
in love|恋爱
in memory of|纪念
in need|需要帮助
in order|整齐；按顺序
in order to|为了
in other words|换句话说
in pain|疼痛
in particular|尤其
in place of|代替
in practice|实际上
in preparation for|为…做准备
in principle|原则上
in prison|坐牢
in private|私下
in progress|进行中
in response to|回应
in return|作为回报
in secret|秘密地
in short|简言之
in sight|看得见
in spite of|尽管
in style|流行
in surprise|惊讶地
in tears|流泪
in terms of|就…而言
in the end|最后
in the meantime|同时
in the middle of|在…中间
in the way|挡路
in this way|这样
in time|及时
in touch|联系
in trouble|有麻烦
in vain|徒劳
in writing|书面
on account of|由于
on average|平均
on behalf of|代表
on board|在船上
on business|出差
on duty|值班
on earth|究竟
on fire|着火
on foot|步行
on holiday|度假
on purpose|故意
on sale|出售
on show|展出
on strike|罢工
on the contrary|相反
on the left|在左边
on the right|在右边
on the other hand|另一方面
on the point of|正要
on the spot|当场
on the way|在途中
on the whole|总的来说
on time|准时
on top of|在…上面
on trial|受审
on vacation|度假
at all|根本
at any rate|无论如何
at best|充其量
at first|起初
at first sight|乍一看
at heart|内心
at home|在家
at large|在逃；总体
at last|终于
at least|至少
at length|最终；详细地
at most|至多
at night|在夜里
at once|立刻
at peace|平静
at present|目前
at random|随机
at sea|在海上；茫然
at the age of|在…岁时
at the beginning of|在…开始
at the bottom of|在…底部
at the end of|在…末尾
at the moment|此刻
at the same time|同时
at the sight of|一看到
at the top of|在…顶部
at times|有时
at war|交战
at work|在工作
by accident|偶然
by air|乘飞机
by all means|务必
by chance|碰巧
by contrast|相比之下
by day|白天
by far|…得多
by hand|用手工
by heart|凭记忆
by means of|通过
by mistake|错误地
by name|名叫
by nature|天性
by no means|绝不
by post|邮寄
by sea|乘船
by sight|凭外貌
by the end of|到…结束时
by the way|顺便说
by train|乘火车
by turns|轮流
for ages|很久
for example|例如
for fear of|生怕
for good|永久地
for instance|例如
for life|终身
for nothing|免费；徒劳
for once|就这一次
for sale|出售
for short|简称
for sure|确定
for the first time|第一次
for the sake of|为了
for the time being|暂时
from now on|从今以后
from time to time|不时
out of breath|上气不接下气
out of control|失控
out of danger|脱离危险
out of date|过时
out of doors|户外
out of order|出故障
out of place|不合适
out of practice|生疏
out of reach|够不着
out of sight|看不见
out of the question|不可能
out of work|失业
under control|受控制
under construction|建设中
under discussion|讨论中
under repair|修理中
with difficulty|困难地
with ease|轻松地
with regard to|关于
with respect to|关于
without doubt|毫无疑问
without fail|务必
as a matter of fact|事实上
as a result|结果
as a result of|由于
as a rule|通常
as a whole|总体上
as usual|像往常一样
as well|也
as well as|以及
as yet|至今

// —— 习语与固定表达 ——
all of a sudden|突然
all the same|仍然
all the time|一直
all over the world|全世界
above all|首先
after all|毕竟
again and again|一再
ahead of time|提前
around the clock|昼夜不停
as far as|就…而言
as follows|如下
as long as|只要
as soon as|一…就
as to|至于
at all costs|不惜一切代价
at all events|无论如何
at death's door|生命垂危
at first hand|第一手
at hand|在手边
at heart|在内心里
at issue|争论中
at it|忙着
at last|终于
at least|至少
at leisure|空闲时
at liberty|自由
at loose ends|无所适从
at odds|不和
at once|立刻
at one's best|处于最佳状态
at one's disposal|由某人支配
at one's wit's end|不知所措
at random|随便地
at risk|有风险
at sixes and sevens|乱七八糟
at the mercy of|任由…摆布
at the moment|此刻
at the outset|一开始
at the risk of|冒…的风险
at this rate|照这样下去
at will|随意
be about to|即将
be bound to|一定会
be dying to|渴望
be engaged in|从事于
be fed up with|厌倦
be fond of|喜欢
be in for|即将遭遇
be into|热衷于
be keen on|喜爱
be opposed to|反对
be prone to|易于
be responsible for|对…负责
be short of|缺少
be subject to|受制于
be supposed to|应该
be used to|习惯于
be worth|值得
bear in mind|记住
beat about the bush|拐弯抹角
bite off more than one can chew|贪多嚼不烂
black and blue|青一块紫一块
break the ice|打破僵局
bring to light|揭露
burn the midnight oil|开夜车
by and by|不久
by and large|大体上
by hook or by crook|不择手段
by leaps and bounds|突飞猛进
call it a day|今天到此为止
carry weight|有分量
cast light on|阐明
catch one's breath|喘口气
catch sight of|看到
catch fire|着火
come of age|成年
come to terms with|接受
come true|实现
cook the books|做假账
cross one's mind|想起
cut a long story short|长话短说
day and night|日夜
day in day out|日复一日
do away with|废除
do one's best|尽力
do sb a favour|帮某人忙
do without|没有…也行
down and out|穷困潦倒
draw the line|划清界限
drive sb mad|把某人逼疯
easier said than done|说来容易做来难
every now and then|时不时
every other|每隔一个
face the music|承担后果
fair and square|光明正大
fall flat|彻底失败
fall short of|达不到
far and away|远远
far from|远非
feel like|想要
few and far between|稀少
fight shy of|回避
find fault with|挑剔
first and foremost|首要的是
first of all|首先
follow suit|效仿
for good measure|另外
for the most part|大部分
from scratch|从零开始
from scratch|白手起家
get cold feet|临阵退缩
get down to business|言归正传
get even|报复
get the hang of|掌握窍门
get the upper hand|占上风
give the game away|泄露秘密
go Dutch|各付各的
go from bad to worse|每况愈下
go out of one's way|不辞辛劳
go without saying|不言而喻
hand in hand|手拉手；密切相关
hang in there|坚持下去
have a good time|玩得开心
have a look|看一看
have a word with|和…说句话
have an eye for|对…有鉴赏力
have it out with|和…摊牌
have second thoughts|改变主意
have the last laugh|笑到最后
heart and soul|全心全意
here and there|到处
hit the nail on the head|一针见血
hold one's breath|屏住呼吸
hold one's tongue|保持沉默
hold true|适用
in a nutshell|简言之
in cold blood|残忍地
in the long run|从长远看
in the nick of time|及时
in the same boat|处境相同
ins and outs|来龙去脉
it goes without saying|不言而喻
keep a straight face|板着脸
keep one's word|守信
keep to oneself|不与人来往
kill two birds with one stone|一石二鸟
know the ropes|懂行
last but not least|最后但同样重要
laugh at|嘲笑
learn by heart|背熟
leave no stone unturned|千方百计
lend a hand|帮忙
let bygones be bygones|既往不咎
let the cat out of the bag|泄露秘密
like a fish out of water|如鱼离水
little by little|一点一点
live from hand to mouth|勉强糊口
look on the bright side|看光明面
lose one's temper|发脾气
make a fool of|愚弄
make a fuss|大惊小怪
make both ends meet|收支相抵
make ends meet|量入为出
make head or tail of|弄懂
make hay while the sun shines|趁热打铁
make one's way|前往
make the best of|充分利用
make up one's mind|下定决心
more often than not|往往
more or less|或多或少
neck and neck|并驾齐驱
never mind|没关系
next to nothing|几乎没有
no doubt|无疑
no longer|不再
no sooner said than done|说到做到
no wonder|难怪
not at all|一点也不
not to mention|更不用说
now and then|偶尔
odds and ends|零碎东西
off and on|断断续续
off the beaten track|人迹罕至
off the record|非正式地
on and off|时断时续
on cloud nine|极其快乐
on edge|紧张不安
on end|连续地
on one's own|独自
on second thoughts|再一想
on the alert|警惕
on the brink of|濒于
on the dot|准时
on the increase|在增加
on the move|在移动
on the rise|在上升
on the run|在逃
on the spur of the moment|一时冲动
on the tip of one's tongue|话到嘴边
on the verge of|濒于
on the whole|总的来说
once and for all|一劳永逸
once in a while|偶尔
once upon a time|从前
one way or another|无论如何
out and out|彻头彻尾
out of the blue|出乎意料
over and over|反复
part and parcel|重要组成部分
pay lip service to|口头敷衍
pick holes in|挑毛病
piece of cake|小菜一碟
play it by ear|见机行事
play safe|求稳
pull one's leg|开玩笑
pull one's weight|尽本分
put in a word|说情
put one's foot down|坚决反对
put one's foot in it|说错话
put two and two together|综合推断
rain cats and dogs|倾盆大雨
read between the lines|体会言外之意
right away|立刻
round the clock|昼夜不停
rule of thumb|经验法则
run short of|缺少
see eye to eye|意见一致
see the light|恍然大悟
serve one right|活该
set one's heart on|渴望
shake hands|握手
shed light on|阐明
show one's true colours|露出真面目
side by side|并排
sit on the fence|骑墙
slowly but surely|缓慢但稳步
small talk|闲聊
so far|到目前为止
so to speak|可以说
sooner or later|迟早
spick and span|一尘不染
stand one's ground|坚持立场
stay up|熬夜
step by step|一步步
stick one's neck out|冒险
straight away|立刻
take a fancy to|喜欢上
take a seat|坐下
take care|保重
take for granted|想当然
take one's time|慢慢来
take pains|费心
take the bull by the horns|不畏艰险
take the plunge|毅然决定
talk shop|谈本行
the ins and outs|详情
the last straw|最后一根稻草
the pros and cons|利弊
the tip of the iceberg|冰山一角
through thick and thin|同甘共苦
time after time|屡次
time and again|一再
to and fro|来回
to one's surprise|令某人惊讶
to some extent|在某种程度上
to tell you the truth|说实话
turn a blind eye to|视而不见
turn a deaf ear to|充耳不闻
turn over a new leaf|改过自新
under one's breath|低声
under the weather|身体不适
up and down|上上下下
up to date|最新的
up to now|至今
ups and downs|起起落落
wear and tear|磨损
what is more|而且
what's worse|更糟的是
white elephant|累赘
with flying colours|出色地
word for word|逐字
work like a horse|拼命工作
year in year out|年复一年

// —— 功能与社交套语 ——
excuse me|劳驾；打扰一下
thank you|谢谢你
thank you very much|非常感谢
thanks a lot|多谢
not at all|不客气
that's all right|没关系
you're welcome|不客气
never mind|别在意
how do you do|你好
how are you|你好吗
nice to meet you|很高兴认识你
good morning|早上好
good afternoon|下午好
good evening|晚上好
good night|晚安
good bye|再见
see you|回头见
see you later|一会儿见
here you are|给你
here it is|在这儿
after you|您先请
come in|请进
sit down|请坐
help yourself|请自便
make yourself at home|别客气
i'm afraid|恐怕
i'm sorry|对不起
i beg your pardon|请再说一遍
if you please|请
if you don't mind|如果你不介意
would you like|你想要
would you mind|你介意吗
what about|…怎么样
how about|…怎么样
what a pity|真遗憾
what a shame|真可惜
that's too bad|太可惜了
no wonder|难怪
by all means|当然可以
not really|也不尽然
of course|当然
of course not|当然不
certainly not|当然不
i see|我明白了
let me see|让我想想
you see|你知道
you know|你知道
as you know|如你所知
to be honest|老实说
to be frank|坦率地说
in my opinion|依我看
if I were you|如果我是你
it depends|看情况
it doesn't matter|没关系
it's up to you|由你决定
take your time|慢慢来
don't mention it|别客气
mind you|请注意
believe it or not|信不信由你
come on|来吧；得了吧
go ahead|请继续
cheer up|振作点
hurry up|快点
look out|当心
watch out|小心
shut up|闭嘴
well done|干得好
that's it|就这样
here goes|开始了
there you are|给你
so long|再见
all right|好吧
all the best|祝一切顺利
good luck|祝好运
many thanks|多谢
best wishes|祝好
congratulations on|祝贺
happy birthday|生日快乐
merry christmas|圣诞快乐
happy new year|新年快乐

// —— 半固定框架（另有句型层分担，此处只收语块性的）——
a great deal of|大量的
a good many|很多
a large number of|大量的
a number of|一些
a lot of|许多
lots of|许多
plenty of|大量
a bit of|一点儿
a couple of|两个；几个
a few|几个
a little|一点儿
a series of|一系列
a variety of|各种各样的
an amount of|大量的
hundreds of|数百
thousands of|数千
millions of|数百万
dozens of|几十
scores of|许多
the majority of|大多数
the rest of|其余的
the whole of|整个
all kinds of|各种各样的
all sorts of|各种各样的
one another|互相
each other|互相
either or|要么…要么
neither nor|既不…也不
not only but also|不仅…而且
both and|既…又
as many as|多达
as much as|多达
as far as|就…而言
as early as|早在
as late as|直到
had better|最好
would rather|宁愿
used to|过去常常
be going to|将要
be able to|能够
be about to|即将
have to|必须
ought to|应该
be sure to|务必
be likely to|可能
be willing to|愿意
be ready to|准备
be bound to|必定
be supposed to|应该
be due to|由于；预定
thanks to|由于
owing to|由于
due to|由于
because of|因为
instead of|代替
in spite of|尽管
regardless of|不管
apart from|除…之外
except for|除…之外
along with|连同
together with|连同
as for|至于
as regards|关于
according to|根据
contrary to|与…相反
prior to|在…之前
subsequent to|在…之后
close to|接近
next to|紧邻
due for|预期
short of|缺少
full of|充满
free of|没有
aware of|意识到
capable of|能够
fond of|喜爱
proud of|为…骄傲
tired of|厌倦
sure of|确信
afraid of|害怕
guilty of|有罪
typical of|典型的
characteristic of|特有的
worthy of|值得
regardless|不管
interested in|对…感兴趣
involved in|参与
engaged in|从事
experienced in|在…有经验
rich in|富含
successful in|在…成功
similar to|与…相似
equal to|等于
opposed to|反对
exposed to|暴露于
accustomed to|习惯于
addicted to|沉溺于
related to|与…有关
relevant to|与…相关
essential to|对…必要
vital to|对…至关重要
loyal to|忠于
superior to|优于
inferior to|劣于
subject to|易受
obliged to|不得不
bound for|前往
responsible for|对…负责
famous for|以…闻名
known for|以…著称
ready for|准备好
suitable for|适合
grateful for|感激
sorry for|为…抱歉
anxious about|担心
concerned about|关心
curious about|好奇
doubtful about|怀疑
enthusiastic about|热心
optimistic about|乐观
particular about|挑剔
worried about|担心
made of|由…制成
made from|由…制成
made up of|由…组成
consist of|由…组成
composed of|由…组成
short of|缺少
in need of|需要
in charge of|负责
in favour of|支持
in terms of|就…而言
on behalf of|代表
by means of|通过
for fear of|生怕
with a view to|为了
with regard to|关于
in accordance with|依照
in line with|与…一致
in place of|代替
in return for|作为回报
in exchange for|交换
in search of|寻找
in honour of|为纪念
in memory of|纪念
in response to|回应
in relation to|关于
in comparison with|与…相比
in contrast to|与…对比
at the expense of|以…为代价
at the mercy of|任由…摆布
at the risk of|冒…的风险
at the age of|在…岁
at the sight of|一看到
at the thought of|一想到
on the verge of|濒于
on the point of|正要
on the eve of|在…前夕
on the grounds of|以…为理由
on the part of|在…方面
under the impression|以为
under the influence of|在…影响下
// 逐个过了一遍。仍然要过 verify：语料里没有的就不写进来。
in front of|在…前面
in front|在前面
human beings|人类
that's right|没错
ever since|自从
in bed|卧床
not yet|还没有
one night|一天晚上
for this reason|因此
what's the matter|怎么了
take part in|参加
take part|参与
go to school|上学
at school|在学校
half an hour|半小时
less than|少于
more than|多于
more likely|更可能
at the end of|在…末尾
at the bottom of|在…底部
for a moment|一会儿
for the moment|暂时
in the evening|在晚上
in the morning|在早上
in the afternoon|在下午
at night|在夜里
at noon|在中午
all day|一整天
all night|整夜
old friend|老朋友
small town|小镇
bad habit|坏习惯
per cent|百分之
united states|美国
the united states|美国
designed by|由…设计
made in|在…制造
made by|由…制造
on earth|究竟
no matter how|无论如何
no matter what|无论什么
as far as I know|据我所知
so far|到目前为止
up to now|至今
from then on|从那时起
since then|从那时起
at that time|那时
at the same time|同时
in those days|那时候
these days|如今
one day|有一天
the other day|前几天
last week|上周
last year|去年
next morning|第二天早上
next day|第二天
twenty years|二十年
hundred years|一百年
years ago|多年前
long ago|很久以前
a long time|很长时间
for a long time|很久
a short time|很短时间
in time|及时
on time|准时
all the time|一直
at times|有时
from time to time|不时
just now|刚才
right now|现在
by now|到现在
for ever|永远
for good|永远
never again|再也不
again and again|再三
over and over|反复
little by little|逐渐
step by step|逐步
one by one|一个接一个
side by side|并排
face to face|面对面
hand in hand|手挽手
day by day|一天天
year after year|年复一年
sooner or later|迟早
at first|起初
at last|终于
in the end|最后
in fact|事实上
as a matter of fact|事实上
in other words|换句话说
that is to say|也就是说
for example|例如
for instance|例如
such as|例如
and so on|等等
and so forth|等等
more or less|大约
or so|大约
at least|至少
at most|至多
a little|一点
a few|几个
a lot|许多
lots of|许多
plenty of|很多
a number of|一些
a great many|很多
a great deal of|大量
a good deal|大量
a bit|一点儿
sort of|有点
kind of|有点
all kinds of|各种各样
all sorts of|各种各样
most of|大多数
some of|其中一些
many of|其中许多
few of|很少
none of|没有一个
both of|两个都
either of|两者之一
neither of|两者都不
each of|每一个
one of|其中之一

// —— 动词 + 介词搭配（介词性动词，与「动词+副词性小品词」是不同类别）——
// 这一批来自对语料做「动词+介词」抽取后的结果：X to（不定式）与 X of（属格）
// 是语法框架要排除，剩下的才是真正的介词性动词。
arrive at|到达
arrive in|抵达
lead to|导致
refer to|提到；参考
belong to|属于
depend on|取决于；依靠
rely on|依靠
insist on|坚持
persist in|坚持
succeed in|成功做到
engage in|从事
participate in|参与
believe in|相信
result in|导致
result from|由…造成
suffer from|遭受
prevent from|阻止
protect from|保护免受
differ from|与…不同
escape from|逃离
recover from|从…恢复
die from|死于
accuse of|指控
remind of|使想起
approve of|赞成
consist of|由…组成
hear of|听说
speak of|谈到
dream of|梦想
get rid of|摆脱
make use of|利用
object to|反对
respond to|回应
adapt to|适应
adjust to|适应
amount to|总计
contribute to|促成；贡献
stick to|坚持
appeal to|吸引；呼吁
apply for|申请
ask for|请求
hope for|希望
search for|搜寻
wish for|希望得到
agree with|同意
argue with|与…争论
compare with|与…比较
compete with|与…竞争
deal with|处理
disagree with|不同意
help with|帮助
meet with|遭遇
provide with|提供
share with|分享
talk with|与…交谈
add to|增加
admit to|承认
apologize for|为…道歉
apply to|适用于
attribute to|归因于
base on|基于
concentrate on|专注于
congratulate on|祝贺
count on|指望
decide on|决定
focus on|聚焦于
operate on|给…做手术
come from|来自
come into|进入
get to|到达
return to|回到
stay at|住在
stay in|待在家里
live in|住在
work for|为…工作
work in|在…工作
dress in|穿着
take part in|参加
in spite of|尽管
interest in|对…的兴趣

// —— be + 形容词 + 介词（中国学习者最常错的一类）——
be afraid of|害怕
be angry with|生…的气
be aware of|意识到
be bad at|不擅长
be busy with|忙于
be capable of|能够
be careful of|当心
be certain of|确信
be close to|接近
be confident of|对…有信心
be curious about|好奇
be different from|与…不同
be disappointed with|对…失望
be equal to|等于
be excited about|对…兴奋
be famous for|以…闻名
be fit for|适合
be fond of|喜爱
be free from|没有
be full of|充满
be good at|擅长
be grateful for|感激
be guilty of|有罪
be interested in|对…感兴趣
be jealous of|嫉妒
be keen on|热衷
be kind to|对…友好
be known for|以…著称
be late for|迟到
be married to|与…结婚
be necessary for|对…必要
be nervous about|对…紧张
be patient with|对…耐心
be pleased with|对…满意
be polite to|对…有礼貌
be popular with|受…欢迎
be proud of|为…骄傲
be ready for|为…准备好
be responsible for|对…负责
be rich in|富含
be satisfied with|对…满意
be serious about|对…认真
be short of|缺少
be similar to|与…相似
be sorry for|为…抱歉
be strict with|对…严格
be successful in|在…成功
be sure of|确信
be surprised at|对…惊讶
be tired of|厌倦
be typical of|典型的
be useful for|对…有用
be used to|习惯于
be worried about|担心
be wrong with|出毛病

// —— be + 分词 + 介词（被动结构里的固定搭配）——
be based on|基于
be covered with|覆盖着
be crowded with|挤满
be divided into|被分成
be dressed in|穿着
be equipped with|配备有
be faced with|面临
be filled with|充满
be fitted with|装有
be forced to|被迫
be involved in|参与
be known as|被称为
be limited to|限于
be located in|位于
be made from|由…制成
be made of|由…制成
be prepared for|为…做好准备
be related to|与…有关
be separated from|与…分离
be situated in|位于
be surrounded by|被…环绕
be trapped in|被困在
be composed of|由…组成
be connected with|与…相连
be deprived of|被剥夺
be devoted to|致力于
be exposed to|暴露于
be included in|包含在
be engaged in|从事
be accustomed to|习惯于
be addicted to|沉溺于
be attached to|附属于
be blessed with|有幸拥有
be born in|出生于
be bound to|必定
be burdened with|背负
be compared with|与…相比
be concerned about|关心
be confronted with|面对
be convinced of|确信
be written by|由…所写
be designed by|由…设计
be followed by|紧随其后
be paid for|为…付款
be put into|被放入
be struck by|被…击中
be impressed by|对…印象深刻
be influenced by|受…影响

// —— 语料里出现频次高、语义不透明的固定短语 ——
a great deal|大量
a great many|很多
a good deal|大量
miles per hour|每小时英里
side to side|左右
name and address|姓名与地址
shapes and sizes|形状与尺寸
science and technology|科学技术
roast beef|烤牛肉
front door|前门
at the front|在前面
in front|在前面
other side|另一边
the other side|另一边
how much|多少
how many|多少
many years|许多年
years ago|多年前
long ago|很久以前
once again|再一次
once more|再一次
what about|怎么样
what if|要是…会怎样
no matter|无论
as if|好像
as though|好像
even though|尽管
even if|即使
so that|以便
such as|例如
the same as|与…相同
different from|与…不同
the first time|第一次
for the first time|第一次
at once|立刻
right away|立刻
by the way|顺便
in a way|在某种意义上
on the way|在路上
all the way|一路上
in the way|挡路
out of the way|不挡路
by the end|到最后
at the end|在末尾
in the end|最后
at first|起初
from the start|从一开始
all along|一直
so far|至今
as yet|至今
no longer|不再
not any more|不再
any more|再
at least|至少
at most|至多
at best|充其量
at worst|最坏
more or less|大约
or so|大约
and so on|等等
such things|这类事情
the like|诸如此类

// —— 第二轮补充：从语料里逐一挖出的 be+分词/形容词+介词，以及剩余动词+介词 ——
be allowed to|被允许
be unable to|无法
be expected to|预计
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
be confined to|限于
be known to|为…所知
be used for|用于
be used in|用于
be recorded in|记录在
be killed in|死于
be part of|是…的一部分
be associated with|与…相关
be received by|被…接收
be fixed to|固定在
be incapable of|不能
be analogous to|类似于
be difficult to|难以
be impossible to|不可能
be possible to|可能
be necessary to|对…必要
be enough to|足以
be quick to|迅速
stand on|站在…上
stand in|站在…里
speak to|对…说
move into|搬进
work at|从事于
write to|写信给
come with|伴随
take to|喜欢上
fall into|落入
get in|进入
keep in|保持在
drive at|意在
come at|扑向
face with|面对
do with|处理
in the end|最终
at the beginning|起初
at the start|开始时
in the beginning|起初
on the left|在左边
on the right|在右边
at the back|在后面
at the top|在顶部
at the bottom|在底部
in the middle|在中间
in the centre|在中心
on the other side|在另一边
at the side|在旁边
by the side|在…旁边
in the distance|在远处
in the dark|在黑暗中
in the open|在户外
in the sun|在阳光下
in the rain|在雨中
in the snow|在雪中
in the air|在空中
in the sky|在天上
on the ground|在地上
on the floor|在地板上
on the wall|在墙上
on the table|在桌上
at the door|在门口
at the window|在窗边
at the station|在车站
at the airport|在机场
at home|在家
at work|在工作
at school|在学校
at sea|在海上
at night|在夜里
by train|乘火车
by plane|乘飞机
by bus|乘公共汽车
by car|乘汽车
by ship|乘船
by boat|乘船
on board|在船上
on foot|步行
in cash|用现金
by cheque|用支票

// —— 第三轮补充：语料里剩余的短语动词与时间/地点固定短语 ——
get out|出去；取出
get down|下来；记下
run out|用完；跑出去
do up|系上；整理
be over|结束
be back|回来
be up|起床；上升
be out|外出；熄灭
be about|即将
be on|上映；开着
have over|请…来家里
at the time|当时
at times|有时
from the moment|从那一刻起
for a while|一会儿
for a walk|去散步
in the future|将来
in the past|过去
in the spring|在春天
in the summer|在夏天
in the autumn|在秋天
in the winter|在冬天
during the day|在白天
during the night|在夜里
in the same way|同样地
in the meantime|与此同时
in the midst of|在…之中
on the outskirts of|在…郊外
a great number of|大量的
a large amount of|大量的
a small number of|少量的
at the age of|在…岁
at the foot of|在…脚下
at the head of|在…前头
in the course of|在…过程中
in the face of|面对
in the light of|鉴于
in the name of|以…的名义
on the basis of|根据
on the edge of|在…边缘
on the part of|在…方面
out of the window|向窗外
out of the water|从水里
out of the shop|从店里
across the street|在街对面
down the street|沿街
along the way|沿途
round the corner|在拐角处
at the corner|在拐角
in the corner|在角落里
on the corner|在转角
by the window|在窗边
by the door|在门边
under the bed|在床下
under the table|在桌下
behind the door|在门后
in front of the house|在房前
at the back of|在…后部
at the side of|在…旁边
in the direction of|朝…方向

// —— 第四轮补充：常用连接性与量化短语 ——
in a moment|马上
in a minute|马上
at this moment|此刻
at that moment|那时
in those days|那时候
in the old days|从前
the day before|前一天
the day after|第二天
all day long|整天
all night long|整夜
day after day|日复一日
week after week|一周又一周
more and more|越来越多
less and less|越来越少
one after another|一个接一个
here and there|到处
up and down|上上下下
back and forth|来回
first of all|首先
in short|简言之
in brief|简言之
as usual|照常
as before|如前
as a whole|总体上
to some extent|在某种程度上
in some ways|在某些方面
in many ways|在许多方面
for one thing|一则
if only|要是…就好了
as long as|只要
as far as|就…而言
nothing but|只不过
anything but|绝不是
more than|多于
less than|少于
or rather|更确切地说
or else|否则
if so|如果是这样
if not|如果不是
as to|至于
as for|至于
thanks to|由于
owing to|由于
due to|由于
apart from|除…之外
aside from|除…之外
but for|要不是
except for|除了
so far as|就…而言
in other words|换句话说
in a word|总之
in general|总的来说
in detail|详细地
in full|全部
in part|部分地
on the contrary|相反
by contrast|相比之下
in contrast|相反
as a result|结果
in addition|此外
what is more|而且
above all|首先
after all|毕竟
at any rate|无论如何
in any event|无论如何
by all means|务必
in no way|绝不
under no circumstances|绝不
on no account|绝不
`;

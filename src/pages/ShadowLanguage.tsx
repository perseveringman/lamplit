import React from 'react';
import { Icon } from '../components/Icon';
import './shadow-language.css';
import todayShot from '../assets/shadow-language/today.png';
import corpusShot from '../assets/shadow-language/public-corpus.png';
import assessmentShot from '../assets/shadow-language/assessment.png';

const PRODUCT_URL = 'https://language.honi.pro';

const learningSteps = [
  { number: '01', icon: 'search' as const, title: '挑一段听得进去的内容', text: '从公开语料目录按频道、主题、语速和难度找视频，也可以从 YouTube 或 Bilibili 的真实内容开始。' },
  { number: '02', icon: 'play' as const, title: '让耳朵先遇见英文', text: '连续播放，或停在当前句反复听；字幕句段同时承担定位、跟读和听写的坐标。' },
  { number: '03', icon: 'book' as const, title: '在原句里弄懂细节', text: '对照英文字幕、查词与上下文，再用逐句听写或开口跟读把注意力带回声音。' },
  { number: '04', icon: 'bookmark' as const, title: '留下真正想带走的表达', text: '保存遇到的单词、短语、句式和学习进度；已保存的单词进入本地间隔复习。' },
  { number: '05', icon: 'route' as const, title: '从理解走向复用', text: '把用户确认的语块、句型和来源整句作为表达包，先主动回想再揭晓，并按自己的回忆情况安排下次复习。' },
];

const capabilities = [
  { number: 'A', icon: 'play' as const, title: '播放器围绕句子工作', text: '逐句导航、循环播放、速度与字幕控制、悬停暂停、逐词听写和跟读，让“再听一遍”有明确落点。' },
  { number: 'B', icon: 'search' as const, title: '查词不离开上下文', text: '悬停单词可看轻量翻译，点开可查看完整词典；字幕里保存的表达仍保留它出现时的原句。' },
  { number: 'C', icon: 'layers' as const, title: '用词汇量估计内容门槛', text: '自适应测评根据作答调整题目，给出可手动调整的参考起点。它是词汇量估算，不是认证考试或 CEFR 证明。' },
  { number: 'D', icon: 'spark' as const, title: '让 AI 帮忙解释，不替人下结论', text: 'AI 可辅助分析句子和提出难度、候选生词线索；视频词数、词频与字幕语速等可计算指标仍由确定性逻辑给出。' },
];

function ProductLink({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <a className={className} href={PRODUCT_URL} target="_blank" rel="noreferrer">{children}<Icon name="arrow" size={16}/></a>;
}

export default function ShadowLanguage() {
  return <article className="shadow-language-page">
    <header className="sl-hero">
      <div className="sl-hero-topline">
        <span className="sl-kicker"><i/>PROJECT NOTE <b>01</b></span>
        <ProductLink className="sl-text-link">打开 Shadow Language</ProductLink>
      </div>
      <div className="sl-hero-grid">
        <div className="sl-hero-copy">
          <p className="sl-overline">ENGLISH, IN CONTEXT</p>
          <h1>把英语放回<br/><em>真实发生的语境。</em></h1>
          <p className="sl-hero-deck">Shadow Language 把视频、字幕、精听、查词和复习连到一起：先理解真实内容，再把值得记住的表达带走。</p>
          <div className="sl-tags"><span>Web</span><span>Chrome 扩展</span><span>YouTube · Bilibili</span></div>
        </div>
        <div className="sl-hero-graphic" aria-label="听见、理解、表达、复习的学习轨迹">
          <div className="sl-orbit sl-orbit-outer"/><div className="sl-orbit sl-orbit-inner"/>
          <span className="sl-orbit-node node-one"><Icon name="play" size={17}/></span>
          <span className="sl-orbit-node node-two"><Icon name="book" size={17}/></span>
          <span className="sl-orbit-node node-three"><Icon name="spark" size={17}/></span>
          <div className="sl-orbit-center"><span>LISTEN</span><b>理解之后<br/>再留下</b><small>NOTICE · KEEP · REVISIT</small></div>
          <span className="sl-orbit-caption orbit-caption-a">真实输入</span><span className="sl-orbit-caption orbit-caption-b">自己的表达</span>
        </div>
      </div>
      <div className="sl-hero-foot"><span>01 / 05&nbsp;&nbsp; 从内容开始</span><span>Shadow Language · Product overview</span></div>
    </header>

    <section className="sl-section sl-corpus-section">
      <div className="sl-section-heading">
        <span className="sl-index">01</span>
        <div><p className="sl-overline">START WITH INPUT</p><h2>先找到一段<br/><em>愿意听下去的英语。</em></h2></div>
      </div>
      <div className="sl-corpus-layout">
        <div className="sl-copy-column">
          <p>语料库把公开频道与视频整理成可浏览目录。可以先从 EnglishPod、ESLPod 这样的系列音频开始，也可以按主题、字幕语速和词汇难度筛选公开视频。</p>
          <p>目标不是先背完一张词表再碰英语，而是把有意思、能理解一部分的真实输入带到播放器里；个人观看记录与公共语料目录分开管理。</p>
          <div className="sl-note"><Icon name="eye" size={17}/><span>Web 端可匿名浏览公开目录；播放和部分 AI 能力需要登录。</span></div>
        </div>
        <figure className="sl-screenshot sl-screenshot-wide">
          <div className="sl-image-frame"><img src={corpusShot} alt="Shadow Language 真实语料库页面，展示频道系列与视频分类" loading="lazy"/></div>
          <figcaption><span><b>真实应用截图</b> · 公共语料库</span><small>本地启动 Web 预览后截取</small></figcaption>
        </figure>
      </div>
    </section>

    <section className="sl-section sl-capability-section">
      <div className="sl-section-heading sl-heading-row">
        <span className="sl-index">02</span>
        <div><p className="sl-overline">LEARN THROUGH THE MOMENT</p><h2>每个工具，都回到<br/><em>眼前这一句。</em></h2></div>
        <p className="sl-heading-aside">句子是听力、字幕、词典、听写与跟读的共同坐标。学习者可以放慢、停下、重听，也可以只留下对自己有用的部分。</p>
      </div>
      <div className="sl-capability-grid">{capabilities.map(item => <section className="sl-capability" key={item.number}>
        <div className="sl-capability-top"><span>{item.number}</span><Icon name={item.icon} size={19}/></div>
        <h3>{item.title}</h3><p>{item.text}</p>
      </section>)}</div>
    </section>

    <section className="sl-loop-section">
      <div className="sl-loop-intro"><p className="sl-overline">A SMALL, REPEATABLE LOOP</p><h2>一次专注的学习，<br/><em>从听见到带走。</em></h2><p>不是每次都要做完所有练习。选择一个真实片段，把一两句话听清、读懂，再决定什么值得留下。</p></div>
      <ol className="sl-learning-loop">{learningSteps.map((step, index) => <li key={step.number}>
        <span className="sl-step-number">{step.number}</span><span className="sl-step-icon"><Icon name={step.icon} size={18}/></span>
        <div><h3>{step.title}</h3><p>{step.text}</p></div>{index < learningSteps.length - 1 && <span className="sl-step-connector" aria-hidden="true"/>}
      </li>)}</ol>
      <p className="sl-loop-footnote">已经实现：语料目录、字幕播放器、查词、逐句听写/跟读、单词 FSRS 与本地表达复习。表达复习的登录 AI/视频入口、移动端体验和多设备同步仍在后续验收；今日学习也在继续把可用工具收束为清楚的下一步。</p>
    </section>

    <section className="sl-section sl-screens-section">
      <div className="sl-section-heading sl-heading-row">
        <span className="sl-index">03</span>
        <div><p className="sl-overline">A REAL LOOK INSIDE</p><h2>让起点贴近本人，<br/><em>进度也由本人掌舵。</em></h2></div>
        <p className="sl-heading-aside">词汇测评只根据你对单词的回答给出参考估计。观看、收藏和跟读行为不会被用来暗中推断英语水平。</p>
      </div>
      <div className="sl-shot-grid">
        <figure className="sl-screenshot">
          <div className="sl-image-frame"><img src={assessmentShot} alt="Shadow Language 自适应词汇测评页面，用户可以选择认识或不认识当前词语" loading="lazy"/></div>
          <figcaption><span><b>真实应用截图</b> · 自适应词汇测评</span><small>模型根据作答调整题目</small></figcaption>
          <p className="sl-shot-caption">结果是可调整的词汇量估计；当前测评界面也明确提示，题目模型尚未经过真实样本校准。</p>
        </figure>
        <figure className="sl-screenshot">
          <div className="sl-image-frame"><img src={todayShot} alt="Shadow Language 今日学习页面，显示词汇估计与个人观看记录" loading="lazy"/></div>
          <figcaption><span><b>真实应用截图</b> · 今日学习与观看记录</span><small>个人记录与公开语料分开</small></figcaption>
          <p className="sl-shot-caption">页面显示当前设置与个人看过的语料；打开视频不会自动把字幕发布到公共语料库。</p>
        </figure>
      </div>
    </section>

    <aside className="sl-middle-cta">
      <div><span>SEE THE PRODUCT</span><p>想看看语料目录和实际界面？</p></div>
      <ProductLink>前往 Shadow Language</ProductLink>
    </aside>

    <section className="sl-section sl-principles-section">
      <div className="sl-section-heading">
        <span className="sl-index">04</span>
        <div><p className="sl-overline">THE DESIGN BELIEFS</p><h2>更像学习的设计，<br/><em>从尊重真实经验开始。</em></h2></div>
      </div>
      <div className="sl-principle-grid">
        <section><span className="sl-principle-mark">I</span><h3>先输入，再练习</h3><p>从真实视频里遇见语言，精听、听写与跟读帮助重新注意到声音细节；练习服务于理解，不取代理解。</p></section>
        <section><span className="sl-principle-mark">II</span><h3>把表达放回场景</h3><p>单词帮助拆解声音和意思；长期希望记住的是词组、句式与整句，以及它们分别适合在什么场景里使用。</p></section>
        <section><span className="sl-principle-mark">III</span><h3>让学习者看得见、做主</h3><p>难度是参考，不是标签；公共语料和个人历史各自清楚，用户能管理自己的保存内容与学习进度。</p></section>
      </div>
      <div className="sl-privacy-band"><span className="sl-privacy-symbol">✳</span><div><b>隐私边界也属于产品体验。</b><p>观看页面的字幕用于当下学习与本地缓存，不会因此自动进入公共语料。产品不录制跟读声音，也不根据观看习惯构建隐形词汇档案。</p></div></div>
    </section>

    <footer className="sl-footer-cta">
      <p className="sl-overline">KEEP LEARNING IN CONTEXT</p>
      <h2>听懂一句，<br/><em>再把它变成自己的。</em></h2>
      <p>这就是 Shadow Language 想持续靠近的学习体验。</p>
      <ProductLink className="sl-footer-link">打开 Shadow Language <span>·</span> language.honi.pro</ProductLink>
      <small>Shadow Language · English learning through comprehensible input</small>
    </footer>
  </article>;
}

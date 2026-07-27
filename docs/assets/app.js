/* =============================================================
   AI Engineering Layers — shared page script
   One file drives both /ko/ and /en/. Every user-facing string
   lives in I18N below and is picked by <html lang="…">.
   ============================================================= */
var LANG = (document.documentElement.getAttribute('lang') || 'en')
             .toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en';

var I18N = {

/* ---------------------------------------------------------- ko */
ko: {
  copy:'복사', copied:'복사됨', copyFail:'실패',

  /* skill builder */
  sbDesc:[
    ': src 안에서 에러 처리가 없는 await 호출을 찾아',
    '  위험도별로 분류한다. "에러 처리 확인", "unhandled promise",',
    '  "배포 전 점검" 요청 시 사용. 코드를 수정하지는 않는다.'
  ],
  sbBody:[
    ['## 범위',
     '- 대상: `src/**/*.ts` — `*.test.ts`, `src/legacy/` 제외',
     '- 코드를 고치지 않는다. 찾고 판정만 한다.'],
    ['## 판정 기준',
     '1. 외부 I/O   2. 외부 입력 파싱   3. 금전/데이터 위험'],
    ['## 출력',
     'FILE / CALL / CATEGORY / BREAKS / CALLER'],
    ['## 멈춤',
     '확신이 없으면 목록에 넣지 말고 UNSURE 로 따로 적는다.']
  ],
  sbWhy:{
    user:['disable-model-invocation: true',
      'Claude가 <b>자동으로 호출할 수 없습니다</b>. 나만 <code>/find-unhandled</code>로. 배포·커밋·전송처럼 <b>부작용이 있는 작업</b>에 필수입니다. 덤으로 설명이 컨텍스트에서 아예 빠져 토큰도 아낍니다.'],
    model:['user-invocable: false',
      '<code>/</code> 메뉴에서 숨겨지고 <b>Claude만</b> 씁니다. "레거시 시스템 배경지식"처럼 <b>사람이 실행할 의미가 없는 지식</b>용입니다. 주의: 이건 메뉴 노출만 막고 Skill 도구 접근은 막지 않습니다.'],
    both:['(기본값)',
      '나도 <code>/find-unhandled</code>로 부르고, Claude도 관련 요청에 알아서 로드합니다. <b>설명은 항상 컨텍스트에 있고 본문은 호출 시에만</b> 로드됩니다.'],
    fork:['context: fork + agent: Explore',
      '<b>격리된 서브에이전트</b>에서 돕니다. 대화 이력을 보지 않고, 조사로 생긴 수십 개 파일 내용이 <b>내 컨텍스트를 더럽히지 않습니다</b>. 스킬 본문이 그 서브에이전트의 프롬프트가 됩니다.<br><code>background: false</code>는 호출한 턴에서 결과를 기다리게 합니다(기본은 백그라운드).<br>⚠ <b>지침만 있고 할 일이 없는 스킬에는 쓰지 마세요</b> — 빈손으로 돌아옵니다.'],
    inline:['(현재 대화 안에서 실행)',
      '대화 문맥과 함께 씁니다. 규칙·컨벤션 같은 참조형이나, 지금 보고 있는 코드에 이어서 작업할 때 맞습니다.'],
    pre:['allowed-tools',
      '<b>이 스킬을 호출한 그 턴 동안만</b> 권한 프롬프트 없이 쓸 수 있습니다. 다음 메시지를 보내면 해제됩니다. 무인 실행에서 매번 승인을 묻지 않게 하는 장치입니다.<br>⚠ 도구를 <b>제한하지는 않습니다</b> — 나열되지 않은 도구도 여전히 호출 가능하며 기존 권한 설정을 따릅니다.'],
    readonly:['disallowed-tools',
      '스킬이 활성인 동안 해당 도구를 <b>도구 풀에서 제거</b>합니다. "고치지 마세요"라고 <em>부탁</em>하는 것과 <b>고칠 수단을 주지 않는 것</b>의 차이입니다. 리뷰·조사 스킬의 정석.'],
    notools:['(도구 설정 없음)',
      '기존 권한 설정을 그대로 따릅니다. 대화형으로 쓸 스킬이면 이게 맞습니다.'],
    scoped:['paths',
      '해당 글롭에 <b>매칭되는 파일을 다룰 때만</b> 자동 로드됩니다. 스킬이 엉뚱한 맥락에서 불리는 문제의 가장 깔끔한 해법입니다. (직접 <code>/이름</code>으로 부르는 건 언제나 됩니다.)']
  },

  /* context budget simulator */
  ctxCats:{ over:'고정 오버헤드', conf:'상시 설정', bulk:'대량 적재', task:'이번 작업' },
  ctxItems:{
    sys:'시스템 프롬프트 + 환경', cmd:'CLAUDE.md', mem:'자동 메모리',
    skl:'스킬 설명 ×12', mcp:'MCP 도구 정의 ×12 서버', fil:'파일 5개 통째로 읽기',
    his:'앞선 대화 40턴', tsk:'작업 관련 코드 (정밀 추출)', q:'사용자 질문'
  },
  ctxLocked:'항상 로드됩니다',
  ctxVerdict:['좋음 — 고신호 컨텍스트','보통 — 정리 여지 있음',
              '낮음 — 어텐션 예산이 노이즈에 쓰이는 중','위험 — 컨텍스트 부패 영역'],

  /* five moves */
  moveWhat:'무엇을 하는가:', moveSkip:'⚠ 이 동작을 건너뛰면 → ', moveFix:'처방:',
  moves:[
    {n:'① 발견 — Discovery',
     what:'이번 턴이 무엇을 해야 하는지 <b>스스로 알아낸다.</b> 트리아지 스킬이 어제 실패한 CI, 열린 이슈, 최근 커밋을 읽는다.',
     key:'핵심은 <b>에이전트가 자기 일을 찾게 하는 것</b>이다. 목록을 손에 쥐여 주는 것이 아니라. 그리고 그 판단 로직은 크론 잡에 붙인 프롬프트 벽이 아니라 <b>스킬</b>에 있어야 한다 — 스킬은 재사용되고 유지보수되지만, 아무도 갱신하지 않는 스케줄 속 프롬프트는 썩는다.',
     anti:'눈먼 루프 (Blind loop)',
     antiWhat:'사람이 여전히 매일 아침 일감을 손으로 건넨다 — "이 버그 세 개 고쳐줘". 하는 일은 자동화됐지만 <b>무엇을 할지 고르는 일</b>은 자동화되지 않았고, 대개 그쪽이 더 비싼 부분이다.',
     fix:'발견 로직을 스킬로 옮겨 루프가 자기 일을 스스로 떠올리게 한다.'},
    {n:'② 인계 — Handoff',
     what:'작업을 스케줄링 시스템에서 <b>실제로 수행하는 에이전트의 손</b>으로 옮긴다. 처리할 가치가 있는 발견마다 격리된 워크트리가 열린다.',
     key:'작업을 <b>깔끔하게 잘라낼수록</b> 나중의 검증과 병합이 쉬워진다. 여러 에이전트가 각자 다른 디렉터리에서 코드를 바꾸므로 서로를 밟지 않는다.',
     anti:'엉킨 루프 (Tangled loop)',
     antiWhat:'여러 에이전트를 병렬로 돌리면서 <b>같은 작업 디렉터리</b>를 쓰게 둔다. 편집이 충돌하고, 병합은 아무도 풀 수 없는 엉망이 된다.',
     fix:'작업당 워크트리 하나. 증상이 병렬성에서만 나타나므로 — 단일 에이전트 루프는 멀쩡해 보이고, 어느 아침 여러 개가 한꺼번에 돌 때 처음 드러난다.'},
    {n:'③ 검증 — Verification',
     what:'<b>"아니오"라고 말하기 위해</b> 다른 에이전트를 갈아 끼운다. 첫 서브에이전트가 수정 초안을 쓰면, 두 번째가 테스트에 대조해 리뷰한다 — 다른 지시문, 때로는 다른 모델로.',
     key:'가장 건너뛰기 쉽고, 가장 건너뛰면 안 되는 동작. 코드를 쓴 에이전트는 <b>자기 숙제를 너무 후하게 채점한다</b>. 전담 구멍 뚫는 에이전트가 첫 번째가 스스로를 설득해 넘어간 것을 잡아낸다.',
     anti:'고개만 끄덕이는 루프 (Nodding loop)',
     antiWhat:'<b>가장 흔한 실패.</b> 루프가 돌고, 에이전트가 코드를 쓰고, <b>같은 에이전트가 잘됐다고 선언한다.</b> 매 턴이 자기 승인된 출력을 만들고, 루프는 그럴듯해 보이는 실수를 기계 속도로 축적한다.',
     fix:'생성자–평가자 분리. 증상: 수백 턴 동안 <b>단 한 번도 "아니오"라고 한 적이 없는 루프</b> — 어떤 현실의 작업 부하에서도 통계적으로 불가능하며, 따라서 진짜 검증이 없다는 증거다.'},
    {n:'④ 영속 — Persistence',
     what:'결과를 <b>대화 밖에서 살아남는 곳</b>에 착지시킨다. PR과 갱신된 티켓, 사람을 기다리는 인박스, 진행 상황을 기록하는 상태 파일.',
     key:'루프의 메모리는 컨텍스트 윈도우에만 살 수 없다. <b>잊지 않으려면 마크다운이나 보드에 써야 한다.</b>',
     anti:'기억상실 루프 (Amnesiac loop)',
     antiWhat:'루프가 좋은 일을 찾아내고, 하고, <b>그것을 잊는다</b> — 결과가 비워진 컨텍스트 윈도우에만 살았기 때문에. 다음 턴은 같은 작업을 다시 발견하고, 다시 하고, 첫 시도와 충돌한다.',
     fix:'디스크의 상태 파일. <b>에이전트는 잊지만 저장소는 잊지 않는다.</b> 증상: 매일 아침 같은 자리에서 시작하는, 누적 진전이 없는 루프.'},
    {n:'⑤ 스케줄링 — Scheduling',
     what:'한 턴을 <b>루프로 만드는</b> 동작. 트리아지가 매일 아침 자동으로 돌고, 상태 파일이 끝나지 않은 발견을 다음 날로 넘긴다.',
     key:'"자동화가 루프를 실제 루프로 만들고, 당신이 한 번 실행하는 것으로 만들지 않는다."',
     anti:'매뉴얼 루프 (Manual loop)',
     antiWhat:'네 개의 좋은 동작이 다 있는데 자동화가 없다. 이건 루프가 아니라 <b>사람이 손으로 돌리다가 돌리는 것을 잊는 스크립트</b>다. 만든 날에는 인상적으로 작동하고, 주의가 흩어지는 날 조용히 멈춘다.',
     fix:'진짜 트리거 — 타이머나 이벤트. <b>사람이 기억하는 것에 의존하지 않는 것.</b> 증상: 마지막 실행이 데모한 날인 루프.'}
  ],

  /* knowledge-graph demo */
  kgNames:{ prog:'아폴로 계획', a11:'아폴로 11호', arm:'닐 암스트롱', ald:'버즈 올드린',
            sat:'새턴 V', moon:'달', ksc:'케네디우주센터', nasa:'NASA' },
  kgLabels:{ prog:'아폴로 계획', a11:'아폴로 11호', arm:'닐 암스트롱', ald:'버즈 올드린',
             sat:'새턴 V', moon:'달', ksc:'케네디\n우주센터', nasa:'NASA' },
  kgPick:function(n){ return n+' 노드 선택'; },
  kgCount:function(n,e){ return '// 노드 '+n+'개, 엣지 '+e+'개'; },
  kgQuestion:function(n){ return 'Q: "'+n+'"에 대해 그래프가 뒷받침하는 사실은?'; },
  kgOnly:'→ 위 엣지만이 근거입니다. 그래프에 없는 주장은 하지 않습니다.',
  kgHop2:'2홉이 여는 것 —',
  kgNotes:{
    arm:'2홉으로 넓히면 <b>버즈 올드린</b>이 나타납니다 — 두 사람 모두 아폴로 11호를 통해 연결됩니다. "암스트롱과 같은 임무에 탄 사람은?"은 <b>어떤 단일 문서에도 없지만</b> 2홉 순회로 답할 수 있습니다. 이것이 멀티홉 추론입니다.',
    ksc:'2홉으로 넓히면 새턴 V를 거쳐 <b>아폴로 계획</b>까지 닿습니다. 발사장 → 로켓 → 계획의 사슬은 한 문서 안에 없습니다.',
    prog:'허브 노드입니다(차수가 높음). 여러 문서에서 언급되므로 요약을 만들 가치가 큽니다 — 문서 간 종합의 이득이 가장 큰 노드.',
    ald:'2홉으로 넓히면 아폴로 11호를 통해 <b>암스트롱</b>과, 아폴로 계획을 통해 <b>NASA</b>와 연결됩니다.',
    nasa:'2홉은 NASA를 아폴로 11호·새턴 V까지 확장합니다. 조직 → 계획 → 임무의 계층이 그래프 구조로 드러납니다.',
    moon:'달의 차수는 2입니다 — 걸어 본 두 사람. 2홉으로는 아폴로 11호까지 닿아 "달을 걸은 사람들이 함께 탄 임무"를 답할 수 있습니다.',
    sat:'2홉은 새턴 V를 아폴로 11호·NASA까지 확장합니다.',
    a11:'아폴로 11호는 두 번째 허브입니다. 계획·승무원·로켓을 잇는 결절점.'
  }
},

/* ---------------------------------------------------------- en */
en: {
  copy:'Copy', copied:'Copied', copyFail:'Failed',

  /* skill builder */
  sbDesc:[
    ': Find await calls in src/ that have no error handling and',
    '  classify them by risk. Use when asked to "check error handling",',
    '  "unhandled promise", or "pre-deploy check". Does not modify code.'
  ],
  sbBody:[
    ['## Scope',
     '- Targets `src/**/*.ts` — excluding `*.test.ts` and `src/legacy/`',
     '- Do not fix code. Find and classify only.'],
    ['## Classification',
     '1. External I/O   2. Parsing external input   3. Money / data at risk'],
    ['## Output',
     'FILE / CALL / CATEGORY / BREAKS / CALLER'],
    ['## Stop',
     'If unsure, keep it off the list and note it separately as UNSURE.']
  ],
  sbWhy:{
    user:['disable-model-invocation: true',
      'Claude <b>cannot call this on its own</b>. Only you can, via <code>/find-unhandled</code>. Essential for anything with <b>side effects</b> — deploying, committing, sending. As a bonus the description drops out of context entirely, so it costs no tokens.'],
    model:['user-invocable: false',
      'Hidden from the <code>/</code> menu; <b>only Claude</b> uses it. Meant for knowledge <b>a human has no reason to run</b> — "background on the legacy system", say. Note: this only hides the menu entry; it does not block access through the Skill tool.'],
    both:['(default)',
      'You can call it with <code>/find-unhandled</code>, and Claude loads it on its own when a request looks relevant. <b>The description is always in context; the body loads only when invoked.</b>'],
    fork:['context: fork + agent: Explore',
      'Runs in an <b>isolated subagent</b>. It never sees the conversation history, and the dozens of files it opens while investigating <b>never pollute your context</b>. The skill body becomes that subagent’s prompt.<br><code>background: false</code> makes the calling turn wait for the result (background is the default).<br>⚠ <b>Do not use this for skills that are pure instructions with no work to do</b> — they come back empty-handed.'],
    inline:['(runs inside the current conversation)',
      'Uses the conversation as context. Right for reference material — rules, conventions — or for continuing work on code you are already looking at.'],
    pre:['allowed-tools',
      'Usable without a permission prompt <b>for the duration of the turn that invoked the skill</b>, and released as soon as you send the next message. This is what keeps unattended runs from asking for approval on every step.<br>⚠ It does <b>not restrict</b> tools — anything not listed is still callable and still follows your existing permission settings.'],
    readonly:['disallowed-tools',
      '<b>Removes those tools from the pool</b> while the skill is active. That is the difference between <em>asking</em> "please don’t fix anything" and <b>not handing over the means to fix it</b>. The standard move for review and investigation skills.'],
    notools:['(no tool settings)',
      'Follows your existing permission settings unchanged. The right choice for a skill you will use interactively.'],
    scoped:['paths',
      'Auto-loads <b>only when the files in play match the glob</b>. The cleanest fix for a skill that keeps firing in the wrong context. (Calling it directly with <code>/name</code> always works.)']
  },

  /* context budget simulator */
  ctxCats:{ over:'Fixed overhead', conf:'Always-on config', bulk:'Bulk loads', task:'This task' },
  ctxItems:{
    sys:'System prompt + environment', cmd:'CLAUDE.md', mem:'Auto memory',
    skl:'Skill descriptions ×12', mcp:'MCP tool definitions ×12 servers', fil:'5 files read whole',
    his:'Previous 40 turns', tsk:'Task-relevant code (precise extract)', q:'User question'
  },
  ctxLocked:'Always loaded',
  ctxVerdict:['Good — high-signal context','Fair — room to trim',
              'Low — attention budget is going to noise','Danger — context-rot territory'],

  /* five moves */
  moveWhat:'What it does:', moveSkip:'⚠ Skip this move → ', moveFix:'Fix:',
  moves:[
    {n:'① Discovery',
     what:'The turn <b>works out for itself</b> what it should be doing. A triage skill reads yesterday’s failed CI runs, the open issues, the recent commits.',
     key:'The point is to <b>let the agent find its own work</b>, not to hand it a list. And that judgment logic belongs in a <b>skill</b>, not in a wall of prompt text bolted onto a cron job — skills get reused and maintained, while a prompt buried in a schedule nobody updates quietly rots.',
     anti:'Blind loop',
     antiWhat:'A human still hands over the work every morning — "fix these three bugs." The doing got automated, but <b>choosing what to do</b> did not, and that is usually the more expensive half.',
     fix:'Move the discovery logic into a skill so the loop can work out its own agenda.'},
    {n:'② Handoff',
     what:'Moves the work out of the scheduling system and <b>into the hands of the agent that actually does it</b>. Every finding worth acting on opens its own isolated worktree.',
     key:'The <b>more cleanly you cut the work</b>, the easier verification and merging get later. Several agents change code in separate directories, so they never step on each other.',
     anti:'Tangled loop',
     antiWhat:'You run several agents in parallel and let them share <b>one working directory</b>. Edits collide, and the merge becomes a mess nobody can untangle.',
     fix:'One worktree per task. The symptom shows up only under parallelism — a single-agent loop looks perfectly fine, and it breaks for the first time on the morning several run at once.'},
    {n:'③ Verification',
     what:'Swaps in a different agent <b>whose job is to say "no."</b> The first subagent drafts the fix; a second reviews it against the tests — different instructions, sometimes a different model.',
     key:'The easiest move to skip and the one you can least afford to skip. An agent that wrote the code <b>grades its own homework far too generously</b>. A dedicated hole-puncher catches what the first one talked itself past.',
     anti:'Nodding loop',
     antiWhat:'<b>The most common failure.</b> The loop runs, the agent writes code, and <b>the same agent declares it good.</b> Every turn produces self-approved output, and the loop accumulates plausible-looking mistakes at machine speed.',
     fix:'Split generator from evaluator. Symptom: a loop that has <b>never once said "no"</b> across hundreds of turns — statistically impossible on any real workload, and therefore proof that no real verification is happening.'},
    {n:'④ Persistence',
     what:'Lands the result <b>somewhere that outlives the conversation</b>: a PR and an updated ticket, an inbox waiting for a human, a state file that records progress.',
     key:'A loop’s memory cannot live in the context window alone. <b>If it must not be forgotten, it has to be written down — to markdown, or to a board.</b>',
     anti:'Amnesiac loop',
     antiWhat:'The loop finds good work, does it, and <b>forgets it</b> — because the result only ever lived in a context window that was later cleared. The next turn rediscovers the same task, does it again, and collides with the first attempt.',
     fix:'A state file on disk. <b>Agents forget; repositories do not.</b> Symptom: a loop that starts from the same place every morning with nothing accumulating.'},
    {n:'⑤ Scheduling',
     what:'The move that <b>turns one turn into a loop</b>. Triage runs itself every morning, and the state file carries unfinished findings over to the next day.',
     key:'"Automation is what makes a loop an actual loop, rather than something you run once."',
     anti:'Manual loop',
     antiWhat:'All four good moves are in place and there is no automation. That is not a loop — it is <b>a script a human runs by hand until the day they forget to</b>. It works impressively on the day it was built and goes quiet on the first distracted one.',
     fix:'A real trigger — a timer or an event. <b>Something that does not depend on a human remembering.</b> Symptom: a loop whose last run was the day you demoed it.'}
  ],

  /* knowledge-graph demo */
  kgNames:{ prog:'Apollo program', a11:'Apollo 11', arm:'Neil Alden Armstrong', ald:'Buzz Aldrin',
            sat:'Saturn V', moon:'Moon', ksc:'Kennedy Space Center', nasa:'NASA' },
  kgLabels:{ prog:'Apollo\nprogram', a11:'Apollo 11', arm:'Neil\nArmstrong', ald:'Buzz\nAldrin',
             sat:'Saturn V', moon:'Moon', ksc:'Kennedy\nSpace Center', nasa:'NASA' },
  kgPick:function(n){ return 'Select node: '+n; },
  kgCount:function(n,e){ return '// '+n+' nodes, '+e+' edges'; },
  kgQuestion:function(n){ return 'Q: What does the graph support about "'+n+'"?'; },
  kgOnly:'→ Only the edges above count as evidence. Nothing is claimed that the graph does not hold.',
  kgHop2:'What the 2nd hop opens up —',
  kgNotes:{
    arm:'Widen to 2 hops and <b>Buzz Aldrin</b> appears — both men connect through Apollo 11. "Who flew the same mission as Armstrong?" appears in <b>no single document</b>, yet a 2-hop traversal answers it. That is multi-hop reasoning.',
    ksc:'Widen to 2 hops and you reach <b>the Apollo program</b> by way of Saturn V. The launch site → rocket → program chain lives in no one document.',
    prog:'A hub node — high degree. It is mentioned across many documents, which makes it well worth summarizing: this is where cross-document synthesis pays off most.',
    ald:'Widen to 2 hops and Aldrin connects to <b>Armstrong</b> through Apollo 11, and to <b>NASA</b> through the Apollo program.',
    nasa:'Two hops expand NASA out to Apollo 11 and Saturn V. The organization → program → mission hierarchy shows up as graph structure.',
    moon:'The Moon has degree 2 — the two men who walked on it. Two hops reach Apollo 11, which answers "which mission carried the people who walked on the Moon?"',
    sat:'Two hops expand Saturn V out to Apollo 11 and NASA.',
    a11:'Apollo 11 is the second hub — the junction tying program, crew and rocket together.'
  }
}

};

var T = I18N[LANG];

/* ---------- theme ---------- */
(function(){
  var root=document.documentElement, btn=document.getElementById('themeBtn');
  var mq=window.matchMedia('(prefers-color-scheme: dark)');
  root.setAttribute('data-theme', mq.matches?'dark':'light');
  try{ mq.addEventListener('change',function(e){ if(!root.dataset.userSet) root.setAttribute('data-theme', e.matches?'dark':'light'); }); }catch(e){}
  btn.addEventListener('click',function(){
    root.dataset.userSet='1';
    root.setAttribute('data-theme', root.getAttribute('data-theme')==='dark'?'light':'dark');
  });
})();

/* ---------- language switch ----------
   Remembers the explicit choice so the root gate honours it next visit,
   and carries the current anchor across so you land in the same place.  */
(function(){
  var a=document.getElementById('langBtn'); if(!a) return;
  var to=LANG==='ko'?'en':'ko';
  a.addEventListener('click',function(){
    try{ localStorage.setItem('ael-lang', to); }catch(e){}
    a.setAttribute('href','../'+to+'/'+location.hash);
  });
})();

/* ---------- build TOC + scrollspy + progress ---------- */
(function(){
  var list=document.getElementById('tocList');
  var secs=[].slice.call(document.querySelectorAll('main section[id]'));
  var links=[];
  secs.forEach(function(s){
    var h=s.querySelector('h2'); if(!h) return;
    var n=s.dataset.num||'';
    var li=document.createElement('li');
    var a=document.createElement('a'); a.href='#'+s.id;
    a.innerHTML='<span class="n">'+n+'</span><span>'+(h.dataset.short||h.firstChild.textContent.trim())+'</span>';
    li.appendChild(a); list.appendChild(li); links.push({a:a,el:s});
    [].slice.call(s.querySelectorAll('h3[id]')).forEach(function(h3){
      var li2=document.createElement('li');
      var a2=document.createElement('a'); a2.href='#'+h3.id; a2.className='lv2';
      a2.innerHTML='<span>'+(h3.dataset.short||h3.firstChild.textContent.trim())+'</span>';
      li2.appendChild(a2); list.appendChild(li2); links.push({a:a2,el:h3});
    });
  });
  var prog=document.getElementById('progress');
  function onScroll(){
    var h=document.documentElement;
    var pct=h.scrollTop/(h.scrollHeight-h.clientHeight||1)*100;
    prog.style.width=Math.min(100,Math.max(0,pct))+'%';
    var y=h.scrollTop+120, cur=null;
    links.forEach(function(o){ if(o.el.offsetTop<=y) cur=o; });
    links.forEach(function(o){ o.a.classList.toggle('active', o===cur); });
    if(cur){ var t=document.getElementById('toc');
      if(t.scrollHeight>t.clientHeight && window.innerWidth>1000){
        var r=cur.a.offsetTop-t.clientHeight/2; t.scrollTop+= (r-t.scrollTop)*0.25; } }
  }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
  var tg=document.getElementById('tocToggle'), toc=document.getElementById('toc');
  tg.addEventListener('click',function(){ toc.classList.toggle('open'); });
  toc.addEventListener('click',function(e){ if(e.target.closest('a')) toc.classList.remove('open'); });
})();

/* ---------- anchors ---------- */
(function(){
  document.querySelectorAll('main h2[id], main h3[id], main section[id]>h2').forEach(function(h){
    var id=h.id||(h.parentElement&&h.parentElement.id); if(!id) return;
    var a=document.createElement('a'); a.className='anchor'; a.href='#'+id; a.textContent='#'; a.setAttribute('aria-hidden','true');
    h.appendChild(a);
  });
})();

/* ---------- copy buttons ---------- */
(function(){
  document.querySelectorAll('.codeblock').forEach(function(cb){
    var head=cb.querySelector('.cbhead'); if(!head) return;
    var b=document.createElement('button'); b.className='copybtn'; b.textContent=T.copy;
    b.addEventListener('click',function(){
      var t=cb.querySelector('pre').innerText;
      navigator.clipboard.writeText(t).then(function(){ b.textContent=T.copied; setTimeout(function(){b.textContent=T.copy;},1400); },
        function(){ b.textContent=T.copyFail; setTimeout(function(){b.textContent=T.copy;},1400); });
    });
    head.appendChild(b);
  });
})();

/* ---------- layer stack accordion ---------- */
(function(){
  document.querySelectorAll('.layer').forEach(function(btn){
    btn.addEventListener('click',function(){
      var body=document.getElementById(btn.getAttribute('aria-controls'));
      var open=btn.getAttribute('aria-expanded')==='true';
      document.querySelectorAll('.layer').forEach(function(o){
        if(o!==btn){ o.setAttribute('aria-expanded','false');
          var ob=document.getElementById(o.getAttribute('aria-controls')); if(ob) ob.classList.remove('open'); }
      });
      btn.setAttribute('aria-expanded', open?'false':'true');
      body.classList.toggle('open', !open);
    });
  });
})();

/* ---------- tabs ---------- */
(function(){
  document.querySelectorAll('.tabs').forEach(function(t){
    var bs=[].slice.call(t.querySelectorAll('.tabbar button'));
    var ps=[].slice.call(t.querySelectorAll('.tabpanel'));
    bs.forEach(function(b,i){
      b.addEventListener('click',function(){
        bs.forEach(function(x,j){ x.setAttribute('aria-selected', j===i?'true':'false'); });
        ps.forEach(function(p,j){ p.classList.toggle('on', j===i); });
      });
    });
  });
})();

/* ---------- diagram flow animation ----------
   Clones every arrow in every figure and lays one travelling highlight on top.
   · The original arrow is untouched (solid stays solid, dashed stays dashed)
   · Only figures on screen play — off screen, they pause
   · Never built at all under reduced-motion, and hidden in print               */
(function(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var CYCLE  = 2.0;                       // one lap in seconds — every arrow shares the rhythm
  var TRAVEL = 1.15;                      // of that lap, the time actually spent travelling
  var axis = getComputedStyle(document.documentElement).getPropertyValue('--axis').trim();
  function norm(c){ return (c||'').replace(/\s+/g,''); }

  document.querySelectorAll('main figure svg').forEach(function(svg){
    if (svg.id === 'kgSvg') return;                       // skip the interactive widget
    var made = 0, anims = [];
    [].slice.call(svg.querySelectorAll('path[marker-end],line[marker-end]')).forEach(function(el){
      var L; try { L = el.getTotalLength(); } catch(e){ return; }
      if (!L || L < 14) return;                           // skip very short connectors
      var cs = getComputedStyle(el);
      var clone = el.cloneNode(false);
      clone.removeAttribute('marker-end');
      clone.removeAttribute('class');
      clone.removeAttribute('id');
      clone.setAttribute('class','flowline');
      clone.removeAttribute('stroke-dasharray');
      // grey arrows get a blue highlight; coloured arrows get a deeper cut of their own colour
      var isNeutral = norm(cs.stroke) === norm(axis) || norm(cs.stroke) === 'rgb(195,194,183)';
      clone.style.stroke = isNeutral ? 'var(--s1)' : cs.stroke;
      clone.style.opacity = isNeutral ? '.95' : '1';
      // One lap = CYCLE seconds, of which TRAVEL seconds is motion and the rest is rest.
      // Travel time is length-independent, so the whole document moves on one beat.
      var seg  = Math.max(16, Math.min(60, L * 0.55));
      var gap  = (L + seg) * CYCLE / TRAVEL - seg;                // the remainder waits off-path
      var base = parseFloat(cs.strokeWidth) || 1.6;
      clone.style.setProperty('--seg', seg.toFixed(1));
      clone.style.setProperty('--gap', gap.toFixed(1));
      clone.style.setProperty('--fw', (base * 1.95).toFixed(1));
      // the bloom underneath — without it, "travelling" doesn't read
      var glow = clone.cloneNode(false);
      glow.setAttribute('class','flowglow');
      glow.style.setProperty('--gw', (base * 5.2).toFixed(1));
      glow.style.opacity = '';
      el.parentNode.insertBefore(glow, el.nextSibling);
      el.parentNode.insertBefore(clone, glow.nextSibling);
      // leftmost arrows depart first → the chain appears to flow left-to-right
      var x0 = 0; try { x0 = el.getPointAtLength(0).x; } catch(e){}
      if (!clone.animate) { made++; return; }             // older browsers: leave it static
      var kf = [{ strokeDashoffset: seg }, { strokeDashoffset: -gap }];
      var op = { duration: CYCLE * 1000, delay: Math.round(x0 / 0.9), iterations: Infinity, easing: 'linear' };
      [clone, glow].forEach(function(n){ var a = n.animate(kf, op); a.pause(); anims.push(a); });
      made++;
    });
    if (made) { svg.setAttribute('data-flow',''); svg.__anims = anims; }
  });

  // play only while visible
  var targets = document.querySelectorAll('svg[data-flow]');
  if (!targets.length) return;
  function set(svg, on){ (svg.__anims||[]).forEach(function(a){ on ? a.play() : a.pause(); }); }
  if (!('IntersectionObserver' in window)) { targets.forEach(function(s){ set(s,true); }); return; }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ set(e.target, e.isIntersecting); });
  }, { threshold: 0.12 });
  targets.forEach(function(s){ io.observe(s); });
  // stop everything when the tab goes to the background
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) targets.forEach(function(s){ set(s,false); });
  });
})();

/* ---------- lazy youtube ---------- */
(function(){
  document.querySelectorAll('.vframe[data-yt]').forEach(function(f){
    f.addEventListener('click',function(){
      var id=f.dataset.yt;
      f.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
    });
  });
})();

/* ============================================================
   SKILL BUILDER
   ============================================================ */
(function(){
  var yamlEl=document.getElementById('sbYaml'); if(!yamlEl) return;
  var whyEl=document.getElementById('sbWhy'), pathEl=document.getElementById('sbPath');
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function k(s){ return '<span class="c-kw">'+esc(s)+'</span>'; }
  function cm(s){ return '<span class="c-cm">'+esc(s)+'</span>'; }

  function val(n){ var e=document.querySelector('input[name="'+n+'"]:checked'); return e?e.value:''; }

  function render(){
    var who=val('sbwho'), where=val('sbwhere'), tools=val('sbtools'), paths=val('sbpaths');
    var L=[], W=[];

    L.push('<span class="c-op">---</span>');
    L.push(k('name')+': find-unhandled');
    L.push(k('description')+T.sbDesc[0]);
    L.push(T.sbDesc[1]);
    L.push(T.sbDesc[2]);

    if(who==='user'){
      L.push(k('disable-model-invocation')+': true');
      W.push(T.sbWhy.user);
    } else if(who==='model'){
      L.push(k('user-invocable')+': false');
      W.push(T.sbWhy.model);
    } else {
      W.push(T.sbWhy.both);
    }

    if(where==='fork'){
      L.push(k('context')+': fork');
      L.push(k('agent')+': Explore');
      L.push(k('background')+': false');
      W.push(T.sbWhy.fork);
    } else {
      W.push(T.sbWhy.inline);
    }

    if(tools==='pre'){
      L.push(k('allowed-tools')+': Read, Grep, Glob, Bash(git *)');
      W.push(T.sbWhy.pre);
    } else if(tools==='readonly'){
      L.push(k('allowed-tools')+': Read, Grep, Glob');
      L.push(k('disallowed-tools')+': Edit, Write, NotebookEdit');
      W.push(T.sbWhy.readonly);
    } else {
      W.push(T.sbWhy.notools);
    }

    if(paths==='scoped'){
      L.push(k('paths')+': src/**/*.ts');
      W.push(T.sbWhy.scoped);
    }

    L.push('<span class="c-op">---</span>');
    T.sbBody.forEach(function(block){
      L.push('');
      L.push(cm(block[0]));
      for(var i=1;i<block.length;i++) L.push(block[i]);
    });

    yamlEl.innerHTML = L.join('\n');
    pathEl.textContent = '.claude/skills/find-unhandled/SKILL.md';
    whyEl.innerHTML = W.map(function(p){
      return '<div><b>'+p[0]+'</b><br>'+p[1]+'</div>';
    }).join('');
  }
  document.querySelectorAll('.sb input').forEach(function(i){ i.addEventListener('change', render); });
  render();
})();

/* ============================================================
   CONTEXT BUDGET SIMULATOR
   ============================================================ */
(function(){
  var host=document.getElementById('ctxToggles'); if(!host) return;
  var CATS={
    over:{name:T.ctxCats.over, c:'var(--axis)'},
    conf:{name:T.ctxCats.conf, c:'var(--s1)'},
    bulk:{name:T.ctxCats.bulk, c:'var(--s2)'},
    task:{name:T.ctxCats.task, c:'var(--s3)'}
  };
  var ITEMS=[
    {id:'sys',  t:4500,  s:0,    on:true,  lock:true, cat:'over'},
    {id:'cmd',  t:2120,  s:2120, on:true,  cat:'conf'},
    {id:'mem',  t:680,   s:340,  on:true,  cat:'conf'},
    {id:'skl',  t:450,   s:120,  on:true,  cat:'conf'},
    {id:'mcp',  t:38000, s:900,  on:false, cat:'bulk'},
    {id:'fil',  t:24000, s:2400, on:false, cat:'bulk'},
    {id:'his',  t:35000, s:1200, on:false, cat:'bulk'},
    {id:'tsk',  t:6400,  s:6400, on:true,  cat:'task'},
    {id:'q',    t:200,   s:200,  on:true,  lock:true, cat:'task'}
  ];
  ITEMS.forEach(function(it){ it.label=T.ctxItems[it.id]; });
  var meter=document.getElementById('ctxMeter'), legend=document.getElementById('ctxLegend');
  var elT=document.getElementById('ctxTotal'), elS=document.getElementById('ctxSignal'),
      elR=document.getElementById('ctxRatio'), elV=document.getElementById('ctxVerdict');

  ITEMS.forEach(function(it){
    var b=document.createElement('button');
    b.className='toggle'; b.type='button';
    b.setAttribute('aria-pressed', it.on?'true':'false');
    b.innerHTML='<span class="sw" style="background:'+(it.on?CATS[it.cat].c:'var(--axis)')+'"></span>'+
                it.label+' <span style="font-variant-numeric:tabular-nums;opacity:.65;font-weight:500">'+
                it.t.toLocaleString()+'</span>';
    if(it.lock){ b.disabled=true; b.style.opacity='.72'; b.style.cursor='default'; b.title=T.ctxLocked; }
    b.addEventListener('click',function(){
      it.on=!it.on;
      b.setAttribute('aria-pressed', it.on?'true':'false');
      b.querySelector('.sw').style.background = it.on?CATS[it.cat].c:'var(--axis)';
      render();
    });
    host.appendChild(b);
  });

  function render(){
    var on=ITEMS.filter(function(i){return i.on;});
    var total=on.reduce(function(a,i){return a+i.t;},0);
    var sig=on.reduce(function(a,i){return a+i.s;},0);
    var byCat={};
    on.forEach(function(i){ byCat[i.cat]=(byCat[i.cat]||0)+i.t; });
    meter.innerHTML='';
    Object.keys(CATS).forEach(function(k){
      if(!byCat[k]) return;
      var sp=document.createElement('span');
      sp.style.width=(byCat[k]/total*100)+'%';
      sp.style.background=CATS[k].c;
      meter.appendChild(sp);
    });
    legend.innerHTML=Object.keys(CATS).filter(function(k){return byCat[k];}).map(function(k){
      return '<i><b style="background:'+CATS[k].c+'"></b>'+CATS[k].name+' · '+
             byCat[k].toLocaleString()+' ('+Math.round(byCat[k]/total*100)+'%)</i>';
    }).join('');
    elT.textContent=total.toLocaleString();
    elS.textContent=sig.toLocaleString();
    var r=sig/total*100;
    elR.textContent=r.toFixed(1)+'%';
    var v,c;
    if(r>=50){v=T.ctxVerdict[0];c='var(--good-text)';}
    else if(r>=25){v=T.ctxVerdict[1];c='var(--ink-2)';}
    else if(r>=10){v=T.ctxVerdict[2];c='var(--serious)';}
    else {v=T.ctxVerdict[3];c='var(--critical)';}
    elV.textContent=v; elV.style.color=c; elR.style.color=c;
  }
  render();
})();

/* ============================================================
   FIVE MOVES — click to reveal the anti-pattern
   ============================================================ */
(function(){
  var svg=document.getElementById('movesSvg'); if(!svg) return;
  var box=document.getElementById('moveDetail');
  var M=T.moves;
  function show(i){
    var m=M[i];
    box.innerHTML=
      '<div style="font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--s4);margin-bottom:8px">'+m.n+'</div>'+
      '<p style="margin:0 0 10px"><b>'+T.moveWhat+'</b> '+m.what+'</p>'+
      '<p style="margin:0 0 14px;font-size:15px;color:var(--ink-2)">'+m.key+'</p>'+
      '<div style="border-top:1px solid var(--border);padding-top:12px">'+
      '<div style="font-size:12px;font-weight:800;letter-spacing:.04em;color:var(--critical);margin-bottom:6px">'+
      T.moveSkip+m.anti+'</div>'+
      '<p style="margin:0 0 8px;font-size:15px">'+m.antiWhat+'</p>'+
      '<p style="margin:0;font-size:14.5px;color:var(--ink-2)"><b>'+T.moveFix+'</b> '+m.fix+'</p></div>';
    [].slice.call(svg.querySelectorAll('.moveNode rect')).forEach(function(r,j){
      r.setAttribute('stroke-width', j===i?'2.8':'1.6');
      r.setAttribute('fill', j===i?'var(--s4)':'var(--s4-soft)');
      r.style.fillOpacity = j===i?'0.34':'1';
      var lbls=svg.querySelectorAll('.moveNode')[j].querySelectorAll('text');
      lbls[0].style.fontWeight = j===i?'800':'600';
    });
  }
  [].slice.call(svg.querySelectorAll('.moveNode')).forEach(function(g){
    g.addEventListener('click',function(){ show(+g.dataset.m); });
    g.setAttribute('tabindex','0'); g.setAttribute('role','button');
    g.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); show(+g.dataset.m);} });
  });
  show(2);
})();

/* ============================================================
   KNOWLEDGE GRAPH TRAVERSAL DEMO
   ============================================================ */
(function(){
  var svg=document.getElementById('kgSvg'); if(!svg) return;
  var N=[
    {id:'prog', en:'Apollo program',      x:325, y:52,  r:34},
    {id:'a11',  en:'Apollo 11',           x:325, y:170, r:34},
    {id:'arm',  en:'Neil Alden Armstrong',x:140, y:104, r:31},
    {id:'ald',  en:'Buzz Aldrin',         x:140, y:246, r:29},
    {id:'sat',  en:'Saturn V',            x:505, y:104, r:28},
    {id:'moon', en:'Moon',                x:325, y:288, r:24},
    {id:'ksc',  en:'Kennedy Space Center',x:512, y:246, r:32},
    {id:'nasa', en:'NASA',                x:52,  y:172, r:26}
  ];
  N.forEach(function(n){ n.name=T.kgNames[n.id]; n.label=T.kgLabels[n.id]; });
  var E=[
    ['a11','part of','prog',0.5], ['arm','commanded','a11',0.58], ['ald','flew on','a11',0.34],
    ['prog','used','sat',0.5], ['sat','launched from','ksc',0.5],
    ['arm','walked on','moon',0.66], ['ald','walked on','moon',0.5],
    ['prog','operated by','nasa',0.34], ['arm','employed by','nasa',0.5], ['ksc','operated by','nasa',0.8]
  ];
  var NOTE=T.kgNotes;
  var idx={}; N.forEach(function(n){ idx[n.id]=n; });
  var adj={}; N.forEach(function(n){ adj[n.id]=[]; });
  E.forEach(function(e,i){ adj[e[0]].push({o:e[2],i:i}); adj[e[2]].push({o:e[0],i:i}); });

  var gE=document.getElementById('kgEdges'), gN=document.getElementById('kgNodes');
  var NS='http://www.w3.org/2000/svg';
  var edgeEls=[], nodeEls={};

  E.forEach(function(e,i){
    var a=idx[e[0]], b=idx[e[2]];
    var dx=b.x-a.x, dy=b.y-a.y, L=Math.sqrt(dx*dx+dy*dy);
    var x1=a.x+dx/L*a.r, y1=a.y+dy/L*a.r, x2=b.x-dx/L*b.r, y2=b.y-dy/L*b.r;
    var tp=(e[3]===undefined?0.5:e[3]);
    var g=document.createElementNS(NS,'g'); g.setAttribute('class','kgedge');
    var ln=document.createElementNS(NS,'line');
    ln.setAttribute('x1',x1); ln.setAttribute('y1',y1); ln.setAttribute('x2',x2); ln.setAttribute('y2',y2);
    ln.setAttribute('stroke','var(--axis)'); ln.setAttribute('stroke-width','1.5');
    ln.setAttribute('marker-end','url(#ar1)');
    var tx=document.createElementNS(NS,'text');
    tx.setAttribute('x',x1+(x2-x1)*tp); tx.setAttribute('y',y1+(y2-y1)*tp-4);
    tx.setAttribute('text-anchor','middle'); tx.setAttribute('class','svg-label tiny');
    tx.style.fill='var(--muted)';
    tx.textContent=e[1];
    g.appendChild(ln); g.appendChild(tx); gE.appendChild(g);
    edgeEls.push({g:g,ln:ln,tx:tx});
  });

  N.forEach(function(n){
    var g=document.createElementNS(NS,'g'); g.setAttribute('class','kgnode');
    g.setAttribute('tabindex','0'); g.setAttribute('role','button');
    g.setAttribute('aria-label',T.kgPick(n.name));
    var c=document.createElementNS(NS,'circle');
    c.setAttribute('cx',n.x); c.setAttribute('cy',n.y); c.setAttribute('r',n.r);
    c.setAttribute('fill','var(--surface-2)'); c.setAttribute('stroke','var(--border-strong)'); c.setAttribute('stroke-width','1.5');
    var t=document.createElementNS(NS,'text');
    var rows=String(n.label).split('\n');
    t.setAttribute('x',n.x); t.setAttribute('y',n.y+4-(rows.length-1)*6); t.setAttribute('text-anchor','middle');
    t.setAttribute('class','svg-label'); t.setAttribute('style','font-size:11px;pointer-events:none');
    rows.forEach(function(row,ri){
      var ts=document.createElementNS(NS,'tspan');
      ts.setAttribute('x',n.x); if(ri) ts.setAttribute('dy','12');
      ts.textContent=row; t.appendChild(ts);
    });
    g.appendChild(c); g.appendChild(t); gN.appendChild(g);
    nodeEls[n.id]={g:g,c:c,t:t};
    function go(){ select(n.id); }
    g.addEventListener('click',go);
    g.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();go();} });
  });

  var hops=1, cur=null;
  var b1=document.getElementById('hop1'), b2=document.getElementById('hop2');
  b1.addEventListener('click',function(){ hops=1; b1.setAttribute('aria-pressed','true'); b2.setAttribute('aria-pressed','false'); if(cur) select(cur); });
  b2.addEventListener('click',function(){ hops=2; b2.setAttribute('aria-pressed','true'); b1.setAttribute('aria-pressed','false'); if(cur) select(cur); });

  function select(id){
    cur=id;
    var seen={}, frontier=[id], inE={};
    seen[id]=true;
    for(var h=0;h<hops;h++){
      var nxt=[];
      frontier.forEach(function(f){
        adj[f].forEach(function(a){
          inE[a.i]=true;
          if(!seen[a.o]){ seen[a.o]=true; nxt.push(a.o); }
        });
      });
      frontier=nxt;
    }
    N.forEach(function(n){
      var el=nodeEls[n.id], on=!!seen[n.id];
      el.g.classList.toggle('kg-dim', !on);
      el.c.setAttribute('fill', n.id===id ? 'var(--s3)' : (on?'var(--s3-soft)':'var(--surface-2)'));
      el.c.setAttribute('stroke', on?'var(--s3)':'var(--border-strong)');
      el.c.setAttribute('stroke-width', n.id===id?'2.6':'1.5');
      el.t.style.fill = (n.id===id?'#fff':'var(--ink)');
    });
    edgeEls.forEach(function(e,i){
      var on=!!inE[i];
      e.g.classList.toggle('kg-dim', !on);
      e.ln.setAttribute('stroke', on?'var(--s3)':'var(--axis)');
      e.ln.setAttribute('marker-end', on?'url(#arKG)':'url(#ar1)');
      e.ln.setAttribute('stroke-width', on?'2.2':'1.5');
      e.tx.style.fill = on?'var(--ink-2)':'var(--muted)';
    });
    var triples=E.filter(function(e,i){return inE[i];}).map(function(e){
      return '('+idx[e[0]].en+') --['+e[1]+']--> ('+idx[e[2]].en+')';
    }).sort();
    document.getElementById('kgTriples').textContent=
      triples.join('\n')+'\n\n'+T.kgCount(Object.keys(seen).length, triples.length);
    var me=idx[id];
    var facts=E.filter(function(e,i){return inE[i] && (e[0]===id||e[2]===id);}).map(function(e){
      return '· '+idx[e[0]].name+' --['+e[1]+']--> '+idx[e[2]].name;
    });
    var ans=T.kgQuestion(me.name)+'\n\n'+facts.join('\n')+'\n\n'+T.kgOnly;
    var box=document.getElementById('kgAnswer');
    box.textContent=ans;
    if(hops===2 && NOTE[id]){
      var d=document.createElement('div');
      d.style.cssText='margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);font-family:var(--font);font-size:13.5px;line-height:1.6;color:var(--ink-2);white-space:normal';
      d.innerHTML='<b style="color:var(--s3)">'+T.kgHop2+'</b> '+NOTE[id];
      box.appendChild(d);
    }
  }
  select('arm');
})();

/* ============================================================
   reduced motion: stop SMIL
   ============================================================ */
(function(){
  try{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      [].slice.call(document.querySelectorAll('animateMotion')).forEach(function(a){
        if(a.endElement) a.endElement();
        a.setAttribute('dur','0.001s'); a.setAttribute('repeatCount','1');
      });
    }
  }catch(e){}
})();

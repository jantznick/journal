/**
 * Starter focus areas for journaling.
 * Grouped for settings / one-time focus dropdowns.
 * Keep ids stable — users may store them as defaultTheme.
 */
export const STARTER_THEME_GROUPS = [
  {
    id: 'inward',
    label: 'Looking inward',
    themes: [
      {
        id: 'reflection',
        label: 'Reflection',
        description: 'Look back on the day with honesty and curiosity.',
      },
      {
        id: 'mental-health',
        label: 'Mental health',
        description: 'Check in on mood, thoughts, and what you need right now.',
      },
      {
        id: 'anxiety',
        label: 'Anxiety',
        description: 'Name worries and notice what is within your control.',
      },
      {
        id: 'calm',
        label: 'Calm & grounding',
        description: 'Slow down, settle your body, and find a quieter baseline.',
      },
      {
        id: 'stress',
        label: 'Stress',
        description: 'Unload pressure and spot what you can set down or change.',
      },
      {
        id: 'self-compassion',
        label: 'Self-compassion',
        description: 'Speak to yourself with the kindness you would offer a friend.',
      },
    ],
  },
  {
    id: 'body',
    label: 'Body & energy',
    themes: [
      {
        id: 'physical',
        label: 'Physical health',
        description: 'Notice how your body feels and what it might be asking for.',
      },
      {
        id: 'sleep',
        label: 'Sleep & rest',
        description: 'Explore rest, recovery, and what helps you unwind.',
      },
      {
        id: 'energy',
        label: 'Energy & movement',
        description: 'Track energy, movement, and what renews or drains you.',
      },
    ],
  },
  {
    id: 'growth',
    label: 'Growth & meaning',
    themes: [
      {
        id: 'gratitude',
        label: 'Gratitude',
        description: 'Notice what went well and who helped along the way.',
      },
      {
        id: 'goals',
        label: 'Goals & progress',
        description: 'Check in on direction, momentum, and next steps.',
      },
      {
        id: 'mindfulness',
        label: 'Mindfulness',
        description: 'Stay with the present moment without rushing to fix it.',
      },
      {
        id: 'creativity',
        label: 'Creativity',
        description: 'Follow sparks, ideas, and what wants to be made.',
      },
    ],
  },
  {
    id: 'life',
    label: 'People & work',
    themes: [
      {
        id: 'relationships',
        label: 'Relationships',
        description: 'Explore connection, conflict, and how you show up for others.',
      },
      {
        id: 'work',
        label: 'Work & career',
        description: 'Reflect on effort, purpose, boundaries, and what work means to you.',
      },
    ],
  },
  {
    id: 'character',
    label: 'Character & habits',
    themes: [
      {
        id: 'self-awareness',
        label: 'Self-awareness',
        description: 'Notice patterns in how you think, react, and show up.',
      },
      {
        id: 'consideration',
        label: 'Consideration',
        description: 'Practice noticing others’ needs and how your actions land.',
      },
      {
        id: 'competitiveness',
        label: 'Ease competitiveness',
        description: 'Catch comparison and win/lose habits; choose collaboration instead.',
      },
      {
        id: 'slowing-down',
        label: 'Slowing down',
        description: 'Make room to relax, pause, and stop rushing through the day.',
      },
      {
        id: 'patience',
        label: 'Patience',
        description: 'Watch where urgency or irritation shows up, and practice waiting well.',
      },
      {
        id: 'confidence',
        label: 'Confidence',
        description: 'Build steady self-trust without needing to prove yourself.',
      },
      {
        id: 'boundaries',
        label: 'Boundaries',
        description: 'Notice where you overextend, people-please, or shut people out.',
      },
      {
        id: 'authenticity',
        label: 'Authenticity',
        description: 'Check when you perform versus when you feel like yourself.',
      },
      {
        id: 'empathy',
        label: 'Empathy',
        description: 'Stretch into other perspectives without losing your own.',
      },
      {
        id: 'consistency',
        label: 'Consistency',
        description: 'Track follow-through on the small habits that shape who you become.',
      },
    ],
  },
  {
    id: 'open',
    label: 'Open',
    themes: [
      {
        id: 'freewrite',
        label: 'Free write',
        description: 'An open prompt when you just need to put words down.',
      },
    ],
  },
];

export const STARTER_THEMES = STARTER_THEME_GROUPS.flatMap((g) => g.themes);

/**
 * Built-in prompts used when AI is off or unavailable.
 * Several per focus so "Generate prompt" can vary without a model.
 */
export const FALLBACK_PROMPTS = {
  reflection: [
    'What moment from today keeps coming back to you — and what do you think it is trying to tell you?',
    'If you replayed the last 24 hours as a short story, what would the turning point be?',
    'What surprised you about yourself today, even a little?',
    'Looking back, where did you act like the person you want to be — and where did you drift?',
    'What unfinished thought from today deserves a few honest sentences?',
  ],
  'mental-health': [
    'How is your mind today, in plain words — heavy, foggy, sharp, tender, something else?',
    'What has been helping your mental health lately, even in small ways?',
    'Is there a thought loop you keep returning to? Write it out, then write what you wish you could believe instead.',
    'What would “taking care of your mind” look like for the next day or two?',
    'Name one feeling you have been avoiding. What happens when you let it sit on the page?',
  ],
  anxiety: [
    'What is weighing on you right now? Write it out, then note one thing that is still within your control.',
    'If your anxiety had a voice, what would it say — and what would a calmer part of you answer?',
    'Which worry feels biggest today? Break it into what you know, what you fear, and what you can do next.',
    'Where do you feel anxiety in your body? Describe the sensation without judging it.',
    'What would help you feel 10% safer or steadier in the next hour?',
  ],
  calm: [
    'What does calm feel like in your body when it shows up — even briefly?',
    'Describe a place, memory, or routine that settles you. What about it works?',
    'What noise (literal or mental) could you turn down tonight?',
    'If you gave yourself five quiet minutes with no agenda, what might surface?',
    'What is one grounding thing you can notice right now — a sound, a texture, a breath?',
  ],
  stress: [
    'What is asking too much of you right now? Sort it into must-do, should-do, and can-wait.',
    'Where is stress showing up — sleep, patience, appetite, focus? Be specific.',
    'What obligation could you renegotiate, delay, or drop without the world ending?',
    'Write a short letter to your stressed self: what do they need to hear?',
    'What restored you after a hard stretch recently? Could any of that fit into this week?',
  ],
  'self-compassion': [
    'Where have you been hard on yourself lately? What would a kind friend say instead?',
    'Describe a mistake or imperfect moment without the usual self-criticism. What else is true about it?',
    'What do you need permission to feel or want right now?',
    'Name one way you showed up for yourself today, however small.',
    'If you treated yourself with the same care you give others, what would change this week?',
  ],
  physical: [
    'How does your body feel today from head to toe — energy, tension, ease?',
    'What has your body been asking for that you have been ignoring or postponing?',
    'What movement, food, water, or rest made a difference recently?',
    'Is there a physical symptom or sensation you want to understand better? Describe it without diagnosing.',
    'What would “being kind to your body” look like for the rest of today?',
  ],
  sleep: [
    'How did you sleep lately, and how is that affecting your day?',
    'What usually helps you wind down — and what gets in the way?',
    'What thoughts tend to show up when your head hits the pillow?',
    'If tonight went a little better than usual, what would that look like?',
    'What rest do you need that is not just sleep — quiet, a nap, a slower evening?',
  ],
  energy: [
    'When did your energy feel strongest and weakest today? What was different about those moments?',
    'What activities drain you faster than you expect — and which quietly refill you?',
    'How has movement (or the lack of it) shaped your mood lately?',
    'What pace does your body want right now: push, maintain, or recover?',
    'Design a low-pressure plan for tomorrow that protects your energy.',
  ],
  gratitude: [
    'Name three small things that made today a little better. Why did each one matter?',
    'Who made your life easier recently, and what would you thank them for?',
    'What ordinary part of your routine are you quietly grateful for?',
    'What challenge are you oddly thankful for because of what it taught you?',
    'Write about a comfort you often overlook — a place, a habit, a person, a privilege.',
  ],
  goals: [
    'What are you working toward lately? Where did you make progress, stall, or learn something useful?',
    'Which goal still feels alive, and which one might need shrinking, pausing, or releasing?',
    'What is the next smallest step you could take — not the heroic one, the honest one?',
    'How will you know you are making progress this month? Be concrete.',
    'What support, boundary, or habit would make your goals more realistic?',
  ],
  mindfulness: [
    'What are you noticing in this exact moment — sights, sounds, breath, emotion?',
    'Where has your attention been living today: past, future, or here?',
    'Describe one ordinary moment from today in rich detail, as if you were seeing it for the first time.',
    'What sensation or thought keeps pulling you away from the present? Meet it gently on the page.',
    'What would it mean to do the next thing with full attention, even for a few minutes?',
  ],
  creativity: [
    'What idea, image, or project has been tugging at you lately?',
    'If you had an hour with no judgment and no audience, what would you make or explore?',
    'Where did curiosity show up today, even briefly?',
    'What creative block or self-doubt is in the way — and what would “good enough” look like?',
    'Describe inspiration as a place. Where is it, and what does it feel like to visit?',
  ],
  relationships: [
    'How did you show up in your relationships today? Is there a conversation you want to have — or one you are glad you had?',
    'Who do you feel closest to right now, and what makes that connection feel good?',
    'Is there tension with someone that wants airing? Write what you feel before you decide what to say.',
    'What kind of support do you need from others lately — and have you asked for it?',
    'Recall a moment of kindness you gave or received. What stayed with you?',
  ],
  work: [
    'What part of work felt meaningful today, and what felt like noise?',
    'Where are your boundaries with work strong — and where are they thin?',
    'What would make tomorrow at work 10% more sustainable?',
    'Are you chasing achievement, security, growth, or something else right now? Be honest.',
    'If you could change one thing about how you work (not the whole job), what would it be?',
  ],
  freewrite: [
    'What do you need to get off your mind tonight? Start anywhere and keep going.',
    'Write the first true sentence that comes to mind — then follow it for a page.',
    'What have you not said out loud that still wants space?',
    'If nobody would read this, what would you admit?',
    'Start with “Lately I’ve been noticing…” and see where the pen goes.',
  ],
  'self-awareness': [
    'What pattern in yourself did you notice today — a reaction, a habit, a story you tell?',
    'When were you most and least like “yourself” today? What changed between those moments?',
    'What triggered a strong reaction recently? Trace it back: situation → thought → feeling → action.',
    'If you watched yourself from the outside for an hour, what would stand out?',
    'Name one assumption you made about yourself lately. Is it still true?',
  ],
  consideration: [
    'Where did you make room for someone else’s needs today — or miss a chance to?',
    'Think of a recent interaction: how might the other person have experienced you?',
    'What would “being more considerate” look like in one concrete situation this week?',
    'Is there someone you have been taking for granted? What would a thoughtful gesture be?',
    'When did you listen fully versus waiting for your turn to talk?',
  ],
  competitiveness: [
    'Where did comparison or a need to win show up today? What did it cost you (or someone else)?',
    'Describe a moment you chose collaboration over competition — or wish you had.',
    'What are you competing for right now, and is that race still worth running?',
    'If you released the scoreboard for one relationship or project, what would change?',
    'When does competitiveness feel useful to you, and when does it turn sharp or draining?',
  ],
  'slowing-down': [
    'Where did you rush today when you could have taken a breath?',
    'What would a genuinely relaxed hour look like for you — not productive, just restful?',
    'What keeps you from slowing down: guilt, FOMO, habit, other people? Be honest.',
    'Recall a recent moment of ease. What made it possible, and how could you invite more of that?',
    'Design tomorrow with one intentional pause built in. What will you protect?',
  ],
  patience: [
    'Where did impatience show up today — in traffic, with people, with yourself?',
    'What are you waiting on that feels hard? What would waiting well look like?',
    'Describe the last time you forced an outcome. What happened, and what might patience have offered?',
    'Who or what tests your patience most right now, and what is that teaching you?',
    'Practice writing the slower version of a decision you are tempted to rush.',
  ],
  confidence: [
    'Where did you trust yourself today — and where did you shrink or overcompensate?',
    'What evidence do you have that you can handle hard things, even if you doubt it tonight?',
    'Is there a place you are waiting for permission? What if you already have enough?',
    'Separate confidence from arrogance for a moment: what does quiet self-trust look like for you?',
    'Name one small risk you could take this week that would stretch your confidence gently.',
  ],
  boundaries: [
    'Where did you say yes when you meant no — or no when you needed connection?',
    'What boundary would make the next few days more sustainable?',
    'Describe a relationship or commitment where the line feels blurry. What do you need?',
    'How do you feel after protecting a boundary — guilty, relieved, both?',
    'What is one clear sentence you could use next time you need to hold a limit?',
  ],
  authenticity: [
    'When today did you feel most like yourself, and when were you performing?',
    'What part of you stays hidden in certain rooms — and what would it take to show a little more?',
    'Is there an opinion, preference, or need you softened to keep the peace?',
    'Write about a time you were honest and it went better (or worse) than expected.',
    'If you dropped one mask this week, which would it be?',
  ],
  empathy: [
    'Whose shoes could you try on today? What might their day have felt like?',
    'Where did you assume motive instead of curiosity? Rewrite that moment with empathy.',
    'When is empathy easy for you, and when do you shut it off?',
    'How do you stay open to someone else’s feelings without abandoning your own?',
    'Recall a disagreement. Argue their side fairly for a few sentences.',
  ],
  consistency: [
    'Which small habit moved forward today, even a little — and which slipped?',
    'What keeps getting in the way of the consistency you want? Be specific, not harsh.',
    'If you could only keep one daily practice for the next month, what would it be and why?',
    'How do you talk to yourself after a missed day — and how would a coach reframe it?',
    'Design the easiest possible version of a habit you care about, so showing up is almost automatic.',
  ],
};

export function themeLabel(themeIdOrCustom) {
  const found = STARTER_THEMES.find((t) => t.id === themeIdOrCustom);
  return found?.label || String(themeIdOrCustom || '').trim() || 'Free write';
}

export function isStarterTheme(value) {
  return STARTER_THEMES.some((t) => t.id === value);
}

/** Pick a built-in prompt for a focus; varies across calls. */
export function pickFallbackPrompt(theme) {
  const key = String(theme || '').toLowerCase();
  const prompts = FALLBACK_PROMPTS[key];
  if (Array.isArray(prompts) && prompts.length > 0) {
    return prompts[Math.floor(Math.random() * prompts.length)];
  }
  const label = themeLabel(theme);
  const custom = [
    `What's coming up for you around "${label}"? Start wherever feels true.`,
    `Write honestly about "${label}" — what you feel, what you need, and what you notice.`,
    `If "${label}" were the title of today's entry, what belongs on the first page?`,
  ];
  return custom[Math.floor(Math.random() * custom.length)];
}

# The custom agent

Every POC app gets a Pigment custom agent named for the client (Mike, OKEA, 23 Nov 2026: "absolutely standard for all demos going forward"). It appears in AI Chats beside Pigment's Analyst, Modeler and Documentation agents. It answers the client's questions in their own words, from the live model, and says which board to go to.

Built so far: FRP budget assistant (18 Nov), Benchmark seat and envelope guide (20 Nov), OKEA forecast assistant (23 Nov). Each took about 10 minutes once the text was written.

## When

Build it after the boards and the demo script's Part 1 are finished. The agent's knowledge is a condensed Part 1 with live values, so it must come from the same read-back. Rebuild the knowledge whenever the baseline numbers change.

## Where it lives

- App ⋯ menu (bottom of the left panel) → **Custom Agents & Missions** → **Create an agent**.
- Direct URL: `https://pigment.app/w/<workspace>/application/<app id>/all-settings/ai-agents/custom/new`.
- To edit it later: `.../all-settings/ai-agents/custom/edit/<agent id>`. The id appears in the URL after clicking the pencil on the agent's card.
- The form has six sections: General (name, description, appearance colour), Activate agent, Instructions, Knowledge, Skills, Conversation starters.
- Skills: Search and display Boards, Pigment Documentation and Perform Analysis come ticked as a set (Nov 2026). Pigment says individual skills are coming.

## The text: write it to a file first

Save it as `specs/<client>/agent/<client>-agent.md`, with sections Name, Description, Instructions, Knowledge and Conversation starters. That file is the source of truth: paste from it, and update it when the agent changes.

### Name and description
- Name: `<Client> <process> assistant` (for example "OKEA forecast assistant", "FRP budget assistant").
- Description, one sentence: who it helps, and the three or four things it does. It shows under "How can I help you?" in the chat.
- Appearance: the client's main colour where the palette has it.

### Instructions (how it behaves)
Write these headings, in this order:
1. **Opening line:** "You are the <name>. You help <roles> at <client> run <process> in Pigment, and understand every number."
2. **Who you help:** the two or three roles, and what each one does in the process.
3. **How to answer:**
   - plain English, short, UK spelling, the client's own words (list their key terms);
   - always say the version/round, period and entity being discussed, and give their defaults;
   - units and number formats exactly as the boards show them (whole pounds, mNOK to one decimal, kboe...);
   - gross or net, actual or forecast: whichever distinction the client's model turns on, say which one every time;
   - read the live numbers before answering, never guess a figure, flag anything illustrative;
   - explaining a number = the formula in words, the live values behind it, and the board where it is seen or changed;
   - for a change, name the board, grid, row and column, and what will move; **never change data itself**;
   - for "why did X move", start from the bridge or variance by reason, then the biggest lines and the comments on them;
   - out-of-scope topics: name them, and say they aren't in the proof of concept and would follow the same pattern.
4. **The process, step by step:** one numbered line per story board (board number, what the user does there, which rule applies), ending with the workflow tracker and the sign-off strips.

### Knowledge (what it knows)
A condensed Part 1 of the demo script, as short bulleted sections:
- the core concept with one worked example (gross x share = net, seat budget = envelope...);
- versions or rounds, and what each compares with;
- codes and categories (cost classes, statuses, project buckets);
- every formula a user is likely to ask about, in words (KPI definitions such as PRODEX, headroom or utilisation);
- the headline numbers at baseline, by entity;
- the variance story: change by reason, the biggest line, the returned item and why;
- the workflow: stages, status scores, round progress by entity, the returned stage and its reason;
- data provenance: what is the client's data (and which file), what is illustrative, and what would be integrated.

Every number must be one read back from the live model that day. Use the client's own spellings (Øst, not Ost).

### Conversation starters (four)
Each one must show off a different strength, and starter 1 is the one you'll use live:
1. **Why did <the variance in the story> move?** The headline "why" question. It shows the agent reading the bridge, finding the line and quoting the controller's comment.
2. **Which <items> are off <forecast/budget>, and why?** The exception list.
3. **How is <the client's headline KPI> worked out for <entity>?** Formula in words with live values.
4. **What do I need to fill in for <the round>, and in what order?** The process guide for a new contributor.

## Filling the form from Chrome

- **Name, description and starters:** `form_input` on their refs (use `find` for "conversation starter text inputs 1-4 and the Activate agent toggle switch").
- **Instructions and Knowledge are ProseMirror editors.** `form_input` fails on them, and typing long text with "- " lines nests bullets and freezes the tab for minutes. Instead, select the editor's contents and dispatch a synthetic paste of HTML (`<p>`, `<p><strong>` for headings, `<ul><li>`, `<ol><li>`; escape `&` as `&amp;`):

  ```js
  const eds = document.querySelectorAll('.ProseMirror');   // [0] Instructions, [1] Knowledge
  function pasteInto(ed, html) {
    ed.focus();
    const r = document.createRange(); r.selectNodeContents(ed);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const dt = new DataTransfer(); const t = document.createElement('div'); t.innerHTML = html;
    dt.setData('text/html', html); dt.setData('text/plain', t.innerText);
    ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }
  ```
  The paste lands asynchronously: wait about a second, then check `innerText.length` and the number of `li` against the source.
- **Activate agent:** click the switch so "Allow all the Members of this Application to use this agent" is on. Otherwise only you see it.
- Click **Save**. The card shows "Active". Open the edit page once and check the lengths and `li` counts survived the save.

## Test it before the demo

- AI Chats (`.../application/<app id>/ai-chats`) → choose the agent → **Start Chat**.
- Clicking a starter only fills the box; press **Enter** to send. Answers take 1-2 minutes, and the "Thought & work process" steps show while it reads views.
- Run starter 1 at least, and check every number in the answer against the demo script. If it gets one wrong, tighten the knowledge (usually a missing default or an ambiguous term), save, and ask again in a new chat.
- Record the test in `build-spec.md`: the question, the key numbers it gave, pass/fail.

## In the demo

- **Where it goes:** at the end of the story board whose question it answers (usually the forecast comparison or variance board), or in the questions block. Not as the opener. Two minutes.
- **Say:** "Your controllers won't all know where everything is. This is an assistant set up for your round: it knows your codes and your process, reads the live model, and says which board to go to."
- **Do:** AI Chats → the agent → starter 1 → Enter. Talk over the 1-2 minute wait, or ask it before the call and open the finished chat.
- **Watch out for:** the AI Chats sidebar lists your chat history across apps (other clients' chat titles). Collapse the sidebar, or clear old chats, before sharing your screen.
- **Likely questions:**
  - "Can it change my numbers?" No. It reads and explains. Inputs are typed on the boards, under the usual access rights.
  - "Will it always be right?" It answers from the live model and the client's own definitions, and says where to check. Pigment labels AI answers as possibly inaccurate.
  - "Who can use it?" Everyone with access to the app, through AI Chats, and it only sees what that user can see.

Write the agent into the demo script: a Part 1 section (what it is, what it knows, what it can do, the four starters) and a Part 2 step (the moment, the starter, the expected answer with its numbers).

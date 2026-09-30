# Cents in Sixty: making videos people share

## Goal
Short money videos that a 13 to 25 year old wants to send to a friend or show a parent. They should be 100% original and posted on a steady schedule.

## What makes a money Short spread (research)
- A specific, surprising number in the first 2 seconds ("$6 coffee = $147,359").
- A choice or a guess the viewer makes before the reveal. This drives comments and rewatches.
- Something to *do* with it: "comment your habit", "send this to the friend who buys skins".
- Titles with specific numbers, "if you started today" framing, and social comparison. These are the finance outliers in 2026 (OutlierKit).

## Brainstorm (lateral passes)
- **Reversal:** instead of "stop spending", show what money *does* when you leave it alone. That's a win, not guilt.
- **Provocation:** "what if money were a video game?" This gives cheat codes (Rule of 72), level-ups (doubling), and loot (birthday money). It matches Centy's gamer studio.
- **Random entry ("evolution"):** a penny that evolves every day. This became the doubling-penny video.
- **Challenge "it has to be about adults":** teens get birthday money and buy skins. Those are their numbers, so they share them.
- **The viewer as the star:** every video ends by asking for the viewer's number, and the replies become next week's videos (the reply engine).

## Series (first batch)
| # | Hook | Share trigger |
|---|------|---------------|
| 001 | Your $6 coffee costs $147,359 | Tag the coffee friend |
| 002 | $1M now, or a penny that doubles for 30 days? | Pick A or B in the comments |
| 003 | Your savings might take 72 years to double (Rule of 72) | Save it, check your own rate |
| 004 | $25/month on a $1,000 credit card: guess when you're free (82 months) | Show a parent, ask their card's rate |
| 005 | Millionaire for less than $10 a day | Save or share with a friend |
| 006 | $10/month on skins, guess what it could have been | Tag the gamer friend |

## Format rules
- 30 to 45 seconds for Shorts. Later, a 60 to 75 second TikTok cut with an extra example so it qualifies for Creator Rewards.
- The hook number is on screen and spoken within 2 seconds. No intro.
- Centy presents from the gamer studio, and the numbers play on the RGB monitor.
- Every number is computed in `studio/finance.py`. Assumptions (7% average yearly return) go in the caption with "not financial advice".
- Voice is AI (Kokoro), so the AI-content label is on for every post.

## Posting
- One video a day per platform.
- YouTube: uploaded ahead of time as private with `publishAt`, so YouTube publishes it itself. The time is 6 PM ET on weekdays and 12 PM ET on weekends (Blogging Wizard, Buffer and Sprout data).
- TikTok: the Content Posting API sends the video to the account's inbox at the scheduled time, with the caption ready. The owner taps post. TikTok's API rules require the owner to see and approve each post until the app passes audit.
- Hashtags: 3 to 5 per post, meaning 2 broad (#money #personalfinance), 1 community (#fintok), and 1 or 2 topical. TikTok and YouTube both penalize hashtag stuffing.

## Review round 2 (v4, 2026-09-30)
Three reviewer agents (virality, motion design, audio with speech-to-text) scored the v3 set 3 to 7 out of 10. What changed:
- **Hook:** the result is on screen from frame 0. When the video has a guess, the hook shows "???" instead, so the guess is real suspense.
- **Reveal:** a pause (⏸) with a riser, a boom, a camera punch and a monitor flash. The counter shows "???" until the boom, never a wrong number.
- **Guess beat:** three options with a countdown. The right answer isn't always the biggest or the last.
- **Loop:** the last line ends on "because…" and the video restarts on the hook sentence.
- **Honesty:** the assumption behind the numbers (7% average, not guaranteed, or the example APR) stays on the monitor while the numbers are shown.
- **Centy:** 5 expressions, a lean-in on the hook, and he points at charts.
- **Voice:** af_heart 0.6 + am_michael 0.4 at 1.18x, the most expressive and best understood in the speech-to-text test.
- **Mix:** music ducks about 8 dB under the voice; reveal effects are quieter than the revealed number.
- **Birthday money** was cut because it repeated the skins video. It was replaced by credit card minimum payments (debt compounding against you).
- **Length:** 20 to 30 seconds.

# Design Brief

## Direction

Electric Night — a dark, immersive social canvas where user video content and private conversations are the stars.

## Tone

Vibrant, contemporary social-media energy: near-black violet surfaces that make full-screen reels pop, with a bold magenta brand accent and warm coral for engagement actions.

## Differentiation

A reels feed where the video is the hero and every interaction (like, comment, save, share) floats on a translucent rail, paired with gradient-sender chat bubbles that make 1:1 conversation feel alive.

## Color Palette

| Token      | OKLCH (dark)     | Role                              |
| ---------- | ---------------- | --------------------------------- |
| background | 0.145 0.02 300   | deep violet-charcoal canvas       |
| foreground | 0.95 0.01 300    | primary text on dark              |
| card       | 0.185 0.025 300  | elevated surfaces / chat bubbles  |
| primary    | 0.65 0.25 330    | vivid magenta brand / CTAs        |
| accent     | 0.72 0.18 25     | warm coral for likes & hearts     |
| muted      | 0.24 0.03 300    | secondary surfaces / input bg     |

## Typography

- Display: Space Grotesk — reels captions, headings, brand wordmark
- Body: DM Sans — chat text, labels, UI copy
- Scale: hero `text-4xl font-bold tracking-tight`, h2 `text-2xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base`

## Elevation & Depth

Dark layered surfaces (background → card) with soft elevated shadows; reels use a translucent bottom gradient overlay and a floating action rail with `shadow-reel-rail` for depth over video.

## Structural Zones

| Zone          | Background         | Border   | Notes                                      |
| ------------- | ------------------ | -------- | ------------------------------------------ |
| Reels feed    | full-bleed video   | —        | gradient overlay + right action rail       |
| Bottom nav    | card/translucent   | border-t | Reels, Chats, Profile; active = brand      |
| Chat header   | card               | border-b | avatar + name, back action                 |
| Chat thread   | background         | —        | bubble list, sent = gradient-primary       |
| Chat input    | card               | border-t | pill input + send button                   |
| Profile       | background         | —        | card sections for saved / uploaded reels   |

## Spacing & Rhythm

Mobile-first, generous vertical rhythm (16–24px between sections); reels fill the viewport edge-to-edge; chat uses compact 8–12px gaps between bubbles with 16px page padding.

## Component Patterns

- Buttons: rounded-full, `bg-gradient-primary` for primary CTAs, coral for like/love
- Cards: `rounded-2xl` `bg-card` with `shadow-subtle`/`shadow-elevated`
- Badges: rounded-full, `bg-primary` or `bg-accent` with contrasting foreground
- Chat bubbles: `rounded-2xl`, sent = `bg-gradient-primary` text-primary-foreground, received = `bg-card`

## Motion

- Entrance: `animate-fade-up` for feed items and chat threads (0.4s)
- Hover: `transition-smooth` scale/color shifts on action rail and nav icons
- Decorative: `animate-pop-in` for like hearts and reaction emojis

## Constraints

- Token-only styling — no raw hex/rgb or arbitrary color classes in components
- Dark mode is the primary experience; light mode tuned for readability
- Mobile-first: bottom nav, full-bleed reels, thumb-friendly touch targets

## Signature Detail

Gradient-magenta sender bubbles and a floating translucent action rail over full-bleed reels — the two moments that make Baathchit feel like a living social canvas.

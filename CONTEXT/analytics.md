# Analytics — Method Page

- Event names (LOCKED):
  - method_hero_waitlist_click
  - method_faq_teaser_waitlist_click
  - method_sticky_waitlist_click
  - method_exit_nudge_shown
- Common payload fields:
  - locale (BCP-47), route: "/{locale}/method/"
  - position ("hero" | "faq_teaser" | "sticky" | "nudge")
  - variant_personalized (boolean)
  - timestamp (client ISO)
- QA: Verify in GA debug and console during staging.

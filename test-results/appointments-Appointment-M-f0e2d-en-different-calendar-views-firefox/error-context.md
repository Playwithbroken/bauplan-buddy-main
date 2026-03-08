# Page snapshot

```yaml
- generic [active]:
  - link "Skip to main content" [ref=e1] [cursor=pointer]:
    - /url: "#main-content"
  - generic:
    - region "Notifications (F8)":
      - list
    - region "Notifications alt+T"
    - button "KI-Assistent öffnen" [ref=e2] [cursor=pointer]:
      - img [ref=e3]
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "We respect your privacy" [level=3] [ref=e10]
        - paragraph [ref=e11]:
          - text: We use cookies to enhance your experience. Some are necessary for site functionality, while others help us analyze usage and show relevant content.
          - button "Learn more" [ref=e12] [cursor=pointer]
      - generic [ref=e13]:
        - button "Reject" [ref=e14] [cursor=pointer]
        - button "Accept All" [ref=e15] [cursor=pointer]
    - link "Zum Hauptinhalt springen" [ref=e16] [cursor=pointer]:
      - /url: "#main-content"
```
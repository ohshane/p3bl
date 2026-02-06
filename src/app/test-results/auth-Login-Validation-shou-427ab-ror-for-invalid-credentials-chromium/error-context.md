# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - link "Peabee" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "Peabee" [ref=e7]
        - heading "Welcome back" [level=1] [ref=e8]
        - paragraph [ref=e9]: Sign in to your account
      - generic [ref=e11]:
        - generic [ref=e12]:
          - text: Email or Username
          - textbox "Email or Username" [active] [ref=e13]:
            - /placeholder: you@example.com
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Password
            - generic [ref=e17] [cursor=pointer]: Forgot password?
          - generic [ref=e18]:
            - textbox "Password" [ref=e19]:
              - /placeholder: Enter your password
            - button [ref=e20]:
              - img [ref=e21]
        - button "Sign in" [ref=e24]
        - paragraph [ref=e25]:
          - text: Don't have an account?
          - link "Sign up" [ref=e26] [cursor=pointer]:
            - /url: /signup
      - paragraph [ref=e27]: Peabee - Project-Based Learning Platform
  - region "Notifications alt+T"
  - button "Open TanStack Devtools" [ref=e28] [cursor=pointer]:
    - img "TanStack Devtools" [ref=e29]
```
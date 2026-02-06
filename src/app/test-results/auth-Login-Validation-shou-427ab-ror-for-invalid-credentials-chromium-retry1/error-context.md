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
          - textbox "Email or Username" [ref=e13]:
            - /placeholder: you@example.com
          - paragraph [ref=e14]: Email or username is required
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Password
            - generic [ref=e18] [cursor=pointer]: Forgot password?
          - generic [ref=e19]:
            - textbox "Password" [ref=e20]:
              - /placeholder: Enter your password
              - text: wrongpassword
            - button [ref=e21]:
              - img [ref=e22]
        - button "Sign in" [active] [ref=e25]
        - paragraph [ref=e26]:
          - text: Don't have an account?
          - link "Sign up" [ref=e27] [cursor=pointer]:
            - /url: /signup
      - paragraph [ref=e28]: Peabee - Project-Based Learning Platform
  - region "Notifications alt+T"
  - button "Open TanStack Devtools" [ref=e29] [cursor=pointer]:
    - img "TanStack Devtools" [ref=e30]
```
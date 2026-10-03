# ReliefSync — Frontend

React 19 + Vite 8 single-page app for the ReliefSync disaster relief platform.

```
npm install
npm run dev      # http://localhost:3000  (proxies /api → http://localhost:5000)
npm run build    # production build in dist/
npm run preview  # serve the production build
npm run lint     # ESLint (react-hooks + react-refresh rules)
```

The backend API must be running on port 5000. See the project root `README.md` for the full setup.

## Structure

```
src/
  main.jsx, App.jsx          entry, providers, global toaster
  routes/AppRoutes.jsx        all routes, role guards, lazy-loaded pages
  styles/                     design tokens, base, component styles (design system)
  components/
    ui/                       Button, Card, Badge, Field, Modal, Drawer, Toaster,
                              DataTable, StatCard, Segmented, Feedback states…
    charts/                   BarList, ColumnChart, StackedBar, Meter, Ring, Sparkline
    layout/                   Sidebar, Topbar, CommandPalette (Ctrl/⌘ + K)
    brand/Logo.jsx
  layouts/MainLayout.jsx      authenticated app shell + page transitions
  pages/
    WelcomePage.jsx + landing/   marketing landing page
    auth/                        sign in / sign up
    dashboards/                  one workspace per role
    modules/                     Families, Shelters, Admissions, Inventory, Requests,
                                 Distributions, Donations, Audit logs + forms
  services/api.js             every REST endpoint, typed to the backend routes
  context/                    AuthContext (JWT session), ToastContext
  hooks/                      useFetch, useLookups, useNewParam, useRole, UI hooks
  utils/                      constants, permissions, helpers, motion presets
```

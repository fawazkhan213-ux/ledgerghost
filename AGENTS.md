<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Charge review uses labeled mobile editors below the desktop-table breakpoint, sharing the same charge state and update functions so editing stays consistent without horizontal scrolling.
- Home-screen branding uses static PNG icons derived from the header mark, linked through the root head and a web manifest so iOS and Android can use the same identity.
- Appearance is owned by a root-mounted ThemeProvider; persist only deliberate changes so page remounts cannot overwrite the saved preference.
- Avatar uploads use owner-scoped private Storage paths stored in profiles.avatar_url and resolved to signed display URLs; this keeps device-selected photos private without changing the profile schema.

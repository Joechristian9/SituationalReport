# Git Workflow Notes

Day-to-day work happens on `testing`. Finished work is merged into `main`, which is what gets deployed.

## Check where you are

```powershell
git status -sb          # current branch, ahead/behind GitHub, changed files
git branch              # local branches (* = current)
git log --oneline -5    # last 5 commits
```

## Commit

```powershell
git add -A                          # stage everything (or: git add path/to/file)
git commit -m "fix: audit logs"     # message style: type: short description
git push                            # send to GitHub
```

Common types: `feat`, `fix`, `refactor`, `redesign`, `build`, `docs`.

Never commit `.env`, deploy zips, `node_modules`, or `vendor`.

## Fetch vs pull

| Command | What it does |
|---|---|
| `git fetch` | Downloads what's new on GitHub. Does **not** change your files. Safe anytime. |
| `git pull` | `fetch` + merges GitHub's version into your current branch. |

See what GitHub has that you don't:

```powershell
git fetch
git status -sb                         # "behind 3" = GitHub has 3 commits you don't
git log --oneline main..origin/main    # list them
```

## Switch branch

```powershell
git checkout testing      # or: git switch testing
```

If you have uncommitted changes, deal with them first:

- **Keep them on this branch:** commit them.
- **Take them to the other branch:** they usually come along automatically. If Git refuses, use stash:

```powershell
git stash            # set changes aside
git checkout main
git stash pop        # bring them back
```

### After switching to `testing`: fetch, pull, or merge?

Switching only moves you to your **local** copy of `testing`. It doesn't fetch anything from GitHub, so your copy can be out of date.

| Situation | Run |
|---|---|
| Just want to know if GitHub has newer `testing` commits | `git fetch` then `git status -sb` |
| GitHub's `testing` is ahead ("behind N"), e.g. you pushed from another PC | `git pull` |
| `main` has changes `testing` doesn't (after a release or a hotfix) | `git merge main` (see "Bring `testing` up to date with `main`") |

The usual habit is to run `git pull` right after switching, before you start work:

```powershell
git switch testing
git pull                 # get the latest testing from GitHub
```

- `git fetch` alone never changes your files. It's the safe way to look before you change anything.
- `git pull` does `fetch` and then merges `origin/testing` into your local `testing`. It only brings in `testing`'s own commits, not `main`'s.
- `git merge main` is the step that brings `main`'s changes into `testing`. Use it on purpose, not every time you switch.

Pull **before** you edit. If you pull when you already have local commits and GitHub has new ones too, Git makes a merge commit and may hit conflicts.

## Merge `testing` into `main` (release)

Always update `main` from GitHub **before** merging, otherwise the push gets rejected and you resolve conflicts twice.

```powershell
git checkout main
git pull
git merge testing
git push origin main
```

## Bring `testing` up to date with `main`

After a release, or when someone else pushed to `main`:

```powershell
git checkout testing
git merge --ff-only main     # just moves testing forward, no merge commit
git push origin testing
```

If `--ff-only` refuses, `testing` has commits `main` doesn't. Use `git merge main` instead.

## Merge conflicts

```powershell
git status                   # "both modified" / "deleted by" = conflicted files
```

**Only `public/build/` conflicts** (most common). Those are generated files, so don't edit them; regenerate:

```powershell
npm run build
git add public/build
git commit --no-edit
```

**Source files conflict** (`.jsx`, `.php`): open each file, keep the right code between the `<<<<<<<`, `=======`, `>>>>>>>` markers, delete the markers, then:

```powershell
git add path/to/file
git commit --no-edit
```

**Want to back out of a merge** that went wrong:

```powershell
git merge --abort            # returns to how things were before the merge
```

## Before pushing a release

```powershell
php artisan config:clear
php artisan test
npm run build
```

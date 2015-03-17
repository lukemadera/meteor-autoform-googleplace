# 1.0.1 (2015-03-17)

## Features
- update for autoform v5.0

## Bug Fixes
- fix instance issue where dropdown would disappear or show old values sometimes after the first use


# 1.0.0 (2015-02-25)

## Features
- added iOS 3rd party keyboard support!
  - set the new boolean `stopTimeoutOnKeyup` option to false to ensure this works even when toggling back and forth between keyboards (by default, for performance, 3rd party keyboards work BUT as soon as a keyup is dectected, the timeout stops running so if a regular keyboard is used and THEN a 3rd party keyboard is used later, the 3rd party keyboard will no longer work anymore)
- option naming change: changed from `standard` to `googleUI` for using the standard GoogleUI `type` option
- styling (box-sizing on dropdown, colors)
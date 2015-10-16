# 1.0.7 (2015-10-16)

## Features
- return `placeId` for Google `place_id` for looking up any additional information


# 1.0.6 (2015-08-02)

## Features
- add keyboard up, down, escape, enter support (closes #4)


# 1.0.5 (2015-08-01)

## Features
- add geoJSON support (closes #2)


# 1.0.4 (2015-05-22)

## Features
- refactor to support multiple instances (on same view / page - previously this did not work; could only use one at a time)


# 1.0.3 (2015-05-19)

## Features
- add `googleOptions` pass through option for customization and no longer default to US countries only


# 1.0.2 (2015-05-02)

## Bug Fixes
- change to default `stopTimeoutOnKeyup` option to false since some Android Cordova apps were not displaying results. Worse for performance but should fix this issue.


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
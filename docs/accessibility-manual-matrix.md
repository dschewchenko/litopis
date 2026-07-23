# Manual accessibility matrix

Automated browser and axe checks are necessary but do not validate speech output or assistive-technology interaction. Complete this matrix before describing Litopis accessibility support as stable.

## Combinations

| Screen reader | Browser | Platform | Status  |
| ------------- | ------- | -------- | ------- |
| VoiceOver     | Safari  | macOS    | Pending |
| VoiceOver     | Safari  | iOS      | Pending |
| NVDA          | Firefox | Windows  | Pending |
| NVDA          | Chrome  | Windows  | Pending |
| JAWS          | Chrome  | Windows  | Pending |

Record the tested screen-reader, browser and operating-system versions with each completed result.

## Scenarios

- The text field announces its label, current value, expanded state and invalid state.
- `ArrowDown` moves from the field to the focused calendar date.
- Arrow keys move one day or one week and announce the newly focused date.
- `Home` and `End` move to the start and end of the configured week.
- `PageUp` and `PageDown` change month; holding Shift changes year.
- Month changes and focused dates are announced once without duplicate speech.
- Enter and Space select the focused date and expose the selected state.
- Escape closes a popover and restores focus to the text field.
- Minimum and maximum dates announce and prevent disabled selection.
- The month and year chooser exposes its group label and selected option.
- Touch exploration reaches every comfortable-size control without overlapping targets.

## Result format

For every combination, record:

- Date and tester.
- Exact assistive technology, browser and operating system versions.
- Passed scenarios.
- Reproduction steps for failures.
- Link to the fix or a documented known issue.

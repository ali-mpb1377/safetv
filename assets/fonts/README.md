# Persian font (Vazirmatn)

SafeTV uses **Vazirmatn** for Persian text so it looks the same on every
device (some TV boxes ship without any Persian system font).

Put these two files in this folder, then rebuild:

- `Vazirmatn-Regular.ttf`
- `Vazirmatn-Bold.ttf`

Get them from https://github.com/rastikerdar/vazirmatn/releases
(zip -> `fonts/ttf/`) and keep the `OFL.txt` license file next to them.
Vazirmatn is licensed under the SIL Open Font License.

If the files are missing the app still works and falls back to the system
font for Persian text.

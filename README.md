# HomeFit Nutrition V8 Pro Training + Nutrition

Clean Expo React Native Android project for Samsung/Android with a more polished UI, workout upgrades, nutrition tracker and real camera barcode scanner.

## Includes

- Camera barcode scanner using `expo-camera`
- Open Food Facts nutrition lookup from scanned barcode
- Manual barcode entry fallback
- Food search and portion-size adjustment
- Everyday food templates: eggs, chicken, rice, oats, lactose-free milk, tuna, lean beef mince and more
- Editable workout logging: enter actual kg and reps for every set
- PR tracker based on real logged sets
- Workout volume tracking
- Rest timer
- +2.5kg progression suggestions
- Push / Pull / Legs smart workout rotation
- Bodyweight exercises: push-ups and sit-ups
- Weekly coaching recommendations
- Auto calorie adjustment from weigh-ins
- Equipment manager with decimal kg support
- Manual custom exercise creator
- Favourite meals for one-tap repeat logging
- Weight trend graph from weigh-ins
- Water tracker with daily ml target
- Weekly dashboard showing workouts, average calories, average protein and weight change
- Recent / most used foods for faster repeat logging
- Training and nutrition streaks
- Workout history with full set-by-set details
- Polished darker UI with bigger cards, clearer spacing and stronger contrast
- Backup, restore and reset
- No Health Connect, so the build stays cleaner

## GitHub build setup

1. Upload every file and folder in this project to your GitHub repo.
2. In GitHub, go to **Settings > Secrets and variables > Actions > New repository secret**.
3. Add this secret:
   - Name: `EXPO_TOKEN`
   - Value: your Expo access token
4. Go to **Actions**.
5. Run **Check and start EAS APK build**.

Workflow file included: `.github/workflows/check-and-build.yml`

The workflow does this order:

```bash
npm install
npx expo install --check
npx expo-doctor
npx eas-cli@latest build -p android --profile preview --non-interactive --no-wait
```

So once the checks pass, GitHub starts the EAS preview APK build automatically.

## Local build command

```bash
npm install
npx expo install --check
npx expo-doctor
npx eas build -p android --profile preview
```

## Notes

Sainsbury's and Morrisons do not provide a simple free public nutrition barcode API, so this build uses Open Food Facts plus manual/custom foods and everyday templates. You can still search by supermarket/product name when Open Food Facts has it.

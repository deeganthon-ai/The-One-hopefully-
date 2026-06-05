import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY = 'homefit_v8_pro_state';
const today = () => new Date().toISOString().slice(0, 10);
const toNum = value => Number(String(value ?? '').replace(',', '.')) || 0;
const round1 = value => Math.round((Number(value) || 0) * 10) / 10;
const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const goals = [
  { key: 'Fat Loss', emoji: '🔥', caloriesFactor: 22, proteinFactor: 2.1, fatFactor: 0.7, note: 'Calorie deficit with high protein.' },
  { key: 'Build Muscle', emoji: '💪', caloriesFactor: 32, proteinFactor: 1.8, fatFactor: 0.9, note: 'Small surplus and progressive overload.' },
  { key: 'Recomp', emoji: '⚖️', caloriesFactor: 27, proteinFactor: 2.0, fatFactor: 0.8, note: 'Lose fat while building strength.' },
  { key: 'Strength', emoji: '🏋️', caloriesFactor: 30, proteinFactor: 1.8, fatFactor: 0.8, note: 'Performance focus with longer rests.' },
  { key: 'General Fitness', emoji: '❤️', caloriesFactor: 28, proteinFactor: 1.6, fatFactor: 0.8, note: 'Flexible maintenance and consistency.' },
];

const starterFoods = [
  { id: 'local-eggs', name: 'Eggs, whole', brand: 'Everyday food', servingG: 100, calories: 143, protein: 13, carbs: 1.1, fat: 9.5, source: 'Local' },
  { id: 'local-scrambled-eggs', name: 'Scrambled eggs with butter', brand: 'Meal template', servingG: 180, calories: 360, protein: 21, carbs: 2, fat: 30, source: 'Local' },
  { id: 'local-poached-eggs', name: 'Poached eggs', brand: 'Meal template', servingG: 100, calories: 143, protein: 13, carbs: 1.1, fat: 9.5, source: 'Local' },
  { id: 'local-grilled-chicken', name: 'Grilled chicken breast', brand: 'Meal template', servingG: 150, calories: 248, protein: 46.5, carbs: 0, fat: 5.4, source: 'Local' },
  { id: 'local-rice', name: 'White rice, cooked', brand: 'Everyday food', servingG: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3, source: 'Local' },
  { id: 'local-potato', name: 'Potatoes, boiled', brand: 'Everyday food', servingG: 100, calories: 87, protein: 1.9, carbs: 20, fat: 0.1, source: 'Local' },
  { id: 'local-oats', name: 'Porridge oats', brand: 'Everyday food', servingG: 100, calories: 389, protein: 17, carbs: 66, fat: 7, source: 'Local' },
  { id: 'local-milk', name: 'Lactose-free semi skimmed milk', brand: 'Everyday food', servingG: 250, calories: 115, protein: 9, carbs: 12, fat: 4, source: 'Local' },
  { id: 'local-shake', name: 'Protein shake', brand: 'Meal template', servingG: 35, calories: 130, protein: 25, carbs: 3, fat: 2, source: 'Local' },
  { id: 'local-beef', name: 'Lean beef mince 5%', brand: 'Everyday food', servingG: 100, calories: 155, protein: 21, carbs: 0, fat: 7, source: 'Local' },
  { id: 'local-tuna', name: 'Tuna in spring water', brand: 'Everyday food', servingG: 100, calories: 116, protein: 26, carbs: 0, fat: 1, source: 'Local' },
];

const exerciseLibrary = [
  { name: 'Dumbbell Bench Press', day: 'Push', muscle: 'chest', equipment: ['Dumbbells', 'Bench'], sets: 4, reps: '8-12', targetReps: 10, load: 'Moderate', rest: 120, defaultKg: 17.5 },
  { name: 'Barbell Floor Press', day: 'Push', muscle: 'chest', equipment: ['Barbell'], sets: 4, reps: '6-10', targetReps: 8, load: 'Heavy', rest: 150, defaultKg: 50 },
  { name: 'Dumbbell Shoulder Press', day: 'Push', muscle: 'shoulders', equipment: ['Dumbbells'], sets: 3, reps: '8-12', targetReps: 10, load: 'Moderate', rest: 120, defaultKg: 12.5 },
  { name: 'Lying Tricep Bar Extension', day: 'Push', muscle: 'arms', equipment: ['Tricep Bar'], sets: 3, reps: '10-12', targetReps: 11, load: 'Light', rest: 90, defaultKg: 15 },
  { name: 'Push Ups', day: 'Push', muscle: 'chest', equipment: ['Bodyweight'], sets: 3, reps: 'AMRAP', targetReps: 12, load: 'Light', rest: 90, defaultKg: 0 },
  { name: 'Barbell Bent-Over Row', day: 'Pull', muscle: 'back', equipment: ['Barbell'], sets: 4, reps: '6-10', targetReps: 8, load: 'Heavy', rest: 150, defaultKg: 50 },
  { name: 'Chest-Supported Dumbbell Row', day: 'Pull', muscle: 'back', equipment: ['Dumbbells', 'Bench'], sets: 4, reps: '8-12', targetReps: 10, load: 'Moderate', rest: 120, defaultKg: 17.5 },
  { name: 'One-Arm Dumbbell Row', day: 'Pull', muscle: 'back', equipment: ['Dumbbells'], sets: 3, reps: '10-12 each', targetReps: 11, load: 'Moderate', rest: 120, defaultKg: 20 },
  { name: 'Dumbbell Curl', day: 'Pull', muscle: 'arms', equipment: ['Dumbbells'], sets: 3, reps: '10-12', targetReps: 11, load: 'Light', rest: 90, defaultKg: 10 },
  { name: 'Barbell Romanian Deadlift', day: 'Legs', muscle: 'legs', equipment: ['Barbell'], sets: 4, reps: '6-10', targetReps: 8, load: 'Heavy', rest: 150, defaultKg: 60 },
  { name: 'Goblet Squat', day: 'Legs', muscle: 'legs', equipment: ['Dumbbells'], sets: 4, reps: '10-15', targetReps: 12, load: 'Moderate', rest: 120, defaultKg: 22.5 },
  { name: 'Dumbbell Split Squat', day: 'Legs', muscle: 'legs', equipment: ['Dumbbells'], sets: 3, reps: '8-10 each', targetReps: 9, load: 'Moderate', rest: 120, defaultKg: 12.5 },
  { name: 'Standing Calf Raise', day: 'Legs', muscle: 'legs', equipment: ['Dumbbells'], sets: 3, reps: '12-20', targetReps: 15, load: 'Light', rest: 75, defaultKg: 15 },
  { name: 'Sit Ups', day: 'Legs', muscle: 'core', equipment: ['Bodyweight'], sets: 3, reps: '12-20', targetReps: 15, load: 'Light', rest: 75, defaultKg: 0 },
];

const defaultState = {
  tab: 'Dashboard',
  profile: { goal: 'Recomp', calories: 2300, protein: 180, carbs: 220, fat: 75, weight: 92, height: 178, age: 43 },
  equipment: [
    { id: 'eq-bodyweight', name: 'Bodyweight', enabled: true, maxKg: 0 },
    { id: 'eq-dumbbells', name: 'Dumbbells', enabled: true, maxKg: 25 },
    { id: 'eq-barbell', name: 'Barbell', enabled: true, maxKg: 100 },
    { id: 'eq-tricep', name: 'Tricep Bar', enabled: true, maxKg: 40 },
    { id: 'eq-bench', name: 'Bench', enabled: true, maxKg: 0 },
  ],
  meals: [], favourites: starterFoods, savedMeals: [], recentFoods: [], progress: [], workouts: [], customExercises: [],
  recovery: { chest: 3, back: 3, legs: 3, shoulders: 3, arms: 3, energy: 3, sleep: 3 },
  backupText: '', activeTimer: null,
  water: [], waterTarget: 2500,
};

export default function App() {
  const [state, setState] = useState(defaultState);
  const [targetDraft, setTargetDraft] = useState(defaultState.profile);
  const [foodQuery, setFoodQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portionG, setPortionG] = useState('100');
  const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', servingG: '100' });
  const [mealName, setMealName] = useState('');
  const [exerciseDraft, setExerciseDraft] = useState({ name: '', day: 'Push', muscle: 'chest', equipment: 'Dumbbells', sets: '3', reps: '8-12', targetReps: '10', load: 'Moderate', rest: '90', defaultKg: '10' });
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [equipmentDraft, setEquipmentDraft] = useState({ name: '', maxKg: '' });
  const [progressDraft, setProgressDraft] = useState({ weight: '', waist: '', chest: '', arms: '', thighs: '' });
  const [backupInput, setBackupInput] = useState('');
  const [workoutDraft, setWorkoutDraft] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [waterDraft, setWaterDraft] = useState('500');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const intervalRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(value => {
      if (value) {
        const parsed = JSON.parse(value);
        setState({ ...defaultState, ...parsed });
        setTargetDraft({ ...defaultState.profile, ...parsed.profile });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {}); }, [state]);
  useEffect(() => () => intervalRef.current && clearInterval(intervalRef.current), []);

  const setPatch = patch => setState(prev => ({ ...prev, ...patch }));
  const mealsToday = state.meals.filter(meal => meal.date === today());
  const totals = macroTotals(mealsToday);
  const enabledEquipment = state.equipment.filter(item => item.enabled).map(item => item.name);
  const nextDay = ['Push', 'Pull', 'Legs'][state.workouts.length % 3];
  const allExercises = useMemo(() => [...exerciseLibrary, ...(state.customExercises || [])], [state.customExercises]);
  const selectedWorkout = useMemo(() => state.workouts.find(w => w.id === selectedWorkoutId) || state.workouts[state.workouts.length - 1], [state.workouts, selectedWorkoutId]);

  const generatedWorkout = useMemo(() => allExercises
    .filter(exercise => exercise.day === nextDay)
    .filter(exercise => exercise.equipment.every(eq => enabledEquipment.includes(eq)))
    .map(exercise => ({ ...exercise, suggestedKg: suggestWeight(exercise, state.workouts) }))
    .slice(0, 6), [nextDay, enabledEquipment.join('|'), state.workouts.length, allExercises.length]);

  useEffect(() => {
    setWorkoutDraft(createWorkoutDraft(generatedWorkout));
  }, [nextDay, generatedWorkout.map(ex => `${ex.name}:${ex.suggestedKg}`).join('|')]);

  const draftVolume = useMemo(() => workoutVolume(workoutDraft), [JSON.stringify(workoutDraft)]);
  const prs = useMemo(() => getPRs(state.workouts), [state.workouts]);
  const coaching = useMemo(() => getCoaching(state, totals), [state.workouts, state.progress, totals.calories, totals.protein, state.profile.calories, state.profile.protein]);
  const weeklyVolume = useMemo(() => volumeLast7Days(state.workouts), [state.workouts]);
  const waterToday = useMemo(() => waterTotalToday(state.water), [state.water]);
  const weeklySummary = useMemo(() => getWeeklySummary(state), [state.workouts, state.meals, state.progress, state.water]);
  const streaks = useMemo(() => getStreaks(state), [state.workouts, state.meals]);

  function addWater(amount = waterDraft) {
    const ml = Math.max(0, Math.round(toNum(amount)));
    if (!ml) return Alert.alert('Add water', 'Enter an amount in ml first.');
    setState(prev => ({ ...prev, water: [...(prev.water || []), { id: uid('water'), date: today(), ml }] }));
  }

  function removeWater(id) {
    setState(prev => ({ ...prev, water: (prev.water || []).filter(item => item.id !== id) }));
  }

  function calculateTargets(goalKey = targetDraft.goal, weight = toNum(targetDraft.weight)) {
    const goal = goals.find(item => item.key === goalKey) || goals[2];
    const calories = Math.round(weight * goal.caloriesFactor);
    const protein = Math.round(weight * goal.proteinFactor);
    const fat = Math.round(weight * goal.fatFactor);
    const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
    setTargetDraft({ ...targetDraft, goal: goalKey, weight, calories, protein, carbs, fat });
  }

  function autoAdjustCalories() {
    const history = state.progress.filter(p => toNum(p.weight) > 0).slice(-4);
    if (history.length < 2) return Alert.alert('Need more weigh-ins', 'Add at least two bodyweight entries first.');
    const change = round1(history[history.length - 1].weight - history[0].weight);
    let adjustment = 0;
    if (state.profile.goal === 'Fat Loss' && change >= 0) adjustment = -150;
    if (state.profile.goal === 'Fat Loss' && change < -1.2) adjustment = 100;
    if (state.profile.goal === 'Build Muscle' && change <= 0) adjustment = 150;
    if (state.profile.goal === 'Build Muscle' && change > 1.5) adjustment = -100;
    if (state.profile.goal === 'Recomp' && Math.abs(change) > 1.5) adjustment = change > 0 ? -100 : 100;
    const calories = Math.max(1400, toNum(state.profile.calories) + adjustment);
    const next = { ...state.profile, calories };
    setState(prev => ({ ...prev, profile: next }));
    setTargetDraft(next);
    Alert.alert('Calories adjusted', adjustment === 0 ? 'No change needed based on recent weigh-ins.' : `Changed by ${adjustment} kcal. Recent change: ${change}kg.`);
  }

  function startRest(seconds = 90) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); intervalRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function searchOpenFoodFacts() {
    const query = foodQuery.trim();
    if (!query) return;
    setFoodLoading(true);
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=code,product_name,brands,nutriments,serving_quantity,serving_size`;
      const res = await fetch(url);
      const json = await res.json();
      const results = (json.products || []).map(mapOpenFoodFacts).filter(Boolean);
      setFoodResults(results);
      if (!results.length) Alert.alert('No foods found', 'Try a simpler search or create a custom food.');
    } catch (error) { Alert.alert('Search failed', 'Check internet connection or create a custom food.'); }
    finally { setFoodLoading(false); }
  }

  async function searchBarcodeValue(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) return;
    setBarcode(code);
    setFoodLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);
      const json = await res.json();
      if (json.status !== 1) return Alert.alert('Food not found', 'Search manually or create a custom food.');
      const mapped = mapOpenFoodFacts(json.product);
      if (mapped) { setFoodResults([mapped]); setSelectedFood(mapped); setPortionG(String(mapped.servingG || 100)); }
    } catch (error) { Alert.alert('Barcode lookup failed', 'Check internet connection or add it manually.'); }
    finally { setFoodLoading(false); }
  }

  async function searchBarcode() {
    return searchBarcodeValue(barcode);
  }

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) return Alert.alert('Camera permission needed', 'Allow camera access to scan food barcodes.');
    }
    setScanned(false);
    setScannerOpen(true);
  }

  async function handleBarcodeScanned(result) {
    if (scanned) return;
    setScanned(true);
    setScannerOpen(false);
    await searchBarcodeValue(result?.data);
  }

  function addFoodToDiary(food, grams = portionG) {
    const multiplier = toNum(grams) / 100;
    const item = { id: uid('meal'), date: today(), name: food.name, brand: food.brand || '', grams: toNum(grams), calories: round1(food.calories * multiplier), protein: round1(food.protein * multiplier), carbs: round1(food.carbs * multiplier), fat: round1(food.fat * multiplier), source: food.source || 'Open Food Facts' };
    setState(prev => ({ ...prev, meals: [...prev.meals, item], recentFoods: [food, ...prev.recentFoods.filter(f => f.id !== food.id)].slice(0, 10) }));
    setSelectedFood(null);
  }

  function saveCustomFood() {
    if (!customFood.name.trim()) return;
    const serving = toNum(customFood.servingG) || 100;
    const food = { id: uid('custom'), name: customFood.name.trim(), brand: 'Custom', servingG: serving, calories: round1(toNum(customFood.calories) / serving * 100), protein: round1(toNum(customFood.protein) / serving * 100), carbs: round1(toNum(customFood.carbs) / serving * 100), fat: round1(toNum(customFood.fat) / serving * 100), source: 'Custom' };
    setState(prev => ({ ...prev, favourites: [food, ...prev.favourites] }));
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '', servingG: '100' });
  }

  function saveTargets() {
    setState(prev => ({ ...prev, profile: { ...targetDraft, calories: toNum(targetDraft.calories), protein: toNum(targetDraft.protein), carbs: toNum(targetDraft.carbs), fat: toNum(targetDraft.fat), weight: toNum(targetDraft.weight) } }));
    Alert.alert('Saved', 'Targets updated.');
  }

  function saveCustomExercise() {
    if (!exerciseDraft.name.trim()) return Alert.alert('Missing exercise name', 'Add a name for the exercise first.');
    const exercise = {
      name: exerciseDraft.name.trim(),
      day: exerciseDraft.day || 'Push',
      muscle: exerciseDraft.muscle || 'custom',
      equipment: String(exerciseDraft.equipment || 'Dumbbells').split(',').map(item => item.trim()).filter(Boolean),
      sets: Math.max(1, toNum(exerciseDraft.sets) || 3),
      reps: exerciseDraft.reps || '8-12',
      targetReps: toNum(exerciseDraft.targetReps) || 10,
      load: exerciseDraft.load || 'Moderate',
      rest: toNum(exerciseDraft.rest) || 90,
      defaultKg: toNum(exerciseDraft.defaultKg),
      custom: true,
    };
    setState(prev => ({ ...prev, customExercises: [exercise, ...(prev.customExercises || [])] }));
    setExerciseDraft({ name: '', day: 'Push', muscle: 'chest', equipment: 'Dumbbells', sets: '3', reps: '8-12', targetReps: '10', load: 'Moderate', rest: '90', defaultKg: '10' });
  }

  function saveTodaysMeal() {
    if (!mealsToday.length) return Alert.alert('Nothing to save', 'Add foods to today first, then save them as a favourite meal.');
    const name = mealName.trim() || `Meal ${state.savedMeals.length + 1}`;
    const meal = { id: uid('savedmeal'), name, items: mealsToday.map(({ id, ...item }) => ({ ...item })), totals };
    setState(prev => ({ ...prev, savedMeals: [meal, ...(prev.savedMeals || [])].slice(0, 20) }));
    setMealName('');
    Alert.alert('Favourite meal saved', `${name} is ready for one-tap logging.`);
  }

  function addSavedMeal(meal) {
    const items = (meal.items || []).map(item => ({ ...item, id: uid('meal'), date: today() }));
    setState(prev => ({ ...prev, meals: [...prev.meals, ...items] }));
  }

  function updateExerciseDraft(key, value) {
    setExerciseDraft(prev => ({ ...prev, [key]: value }));
  }

  function updateWorkoutSet(exerciseIndex, setIndex, key, value) {
    setWorkoutDraft(prev => prev.map((exercise, exIdx) => {
      if (exIdx !== exerciseIndex) return exercise;
      const setsDone = exercise.setsDone.map((set, sIdx) => sIdx === setIndex ? { ...set, [key]: value } : set);
      return { ...exercise, setsDone };
    }));
  }

  function logWorkout() {
    if (!workoutDraft.length) return Alert.alert('No workout available', 'Turn on your equipment or add matching exercises first.');
    const exercises = workoutDraft.map(ex => ({
      ...ex,
      setsDone: (ex.setsDone || []).map(set => ({ kg: toNum(set.kg), reps: toNum(set.reps), rest: toNum(set.rest) || ex.rest })),
    }));
    const workout = { id: uid('workout'), date: today(), day: nextDay, exercises, volume: workoutVolume(exercises) };
    setPatch({ workouts: [...state.workouts, workout] });
    startRest(exercises[0]?.rest || 90);
    Alert.alert('Workout logged', `Saved ${nextDay} Day with ${workout.volume}kg volume.`);
  }

  function createBackup() {
    const backup = JSON.stringify({ ...state, tab: 'Dashboard', backupText: '' });
    setPatch({ backupText: backup }); setBackupInput(backup);
    Alert.alert('Backup created', 'Copy the backup text and save it somewhere safe.');
  }
  function restoreBackup() {
    try { const parsed = JSON.parse(backupInput.trim()); setState({ ...defaultState, ...parsed, tab: 'Dashboard' }); setTargetDraft({ ...defaultState.profile, ...parsed.profile }); Alert.alert('Restored', 'Backup restored successfully.'); }
    catch (error) { Alert.alert('Restore failed', 'Backup text was not valid.'); }
  }

  if (scannerOpen) {
    return <SafeAreaView style={styles.app}><StatusBar style="light" /><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'] }} onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}><View style={styles.cameraOverlay}><Text style={styles.hero}>Scan barcode</Text><Text style={styles.text}>Point the camera at the food barcode. Nutrition will load from Open Food Facts.</Text><Button danger label="Cancel scanner" onPress={() => setScannerOpen(false)} /></View></CameraView></SafeAreaView>;
  }

  return <SafeAreaView style={styles.app}><StatusBar style="light" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
    <View style={styles.header}><Text style={styles.title}>HomeFit</Text><Text style={styles.subtitle}>Smart home gym + nutrition tracker</Text></View>
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {state.tab === 'Dashboard' && <View>
        <Card title="Today" badge={state.profile.goal}><Text style={styles.hero}>{nextDay} Day</Text><Text style={styles.text}>Calories {totals.calories}/{state.profile.calories} kcal</Text><Text style={styles.text}>Protein {totals.protein}/{state.profile.protein}g</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (totals.calories / Math.max(1, state.profile.calories)) * 100)}%` }]} /></View></Card>
        <Card title="Weekly Dashboard" badge="Pro"><View style={styles.statGrid}><StatBox label="Workouts" value={weeklySummary.workouts} /><StatBox label="Avg cals" value={weeklySummary.avgCalories} /><StatBox label="Avg protein" value={`${weeklySummary.avgProtein}g`} /><StatBox label="Weight" value={`${weeklySummary.weightChange}kg`} /></View><Text style={styles.muted}>Last 7 days from your logged workouts, foods and weigh-ins.</Text></Card>
        <Card title="Streaks" badge="Motivation"><View style={styles.statGrid}><StatBox label="Training" value={`${streaks.training}d`} /><StatBox label="Nutrition" value={`${streaks.nutrition}d`} /><StatBox label="This week" value={`${weeklySummary.completion}%`} /><StatBox label="Volume" value={`${weeklyVolume}kg`} /></View></Card>
        <Card title="Water Tracker" badge={`${waterToday}/${state.waterTarget || 2500}ml`}><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, (waterToday / Math.max(1, state.waterTarget || 2500)) * 100)}%` }]} /></View><View style={styles.setRow}><TextInput style={[styles.tinyInput, { width: 88 }]} value={waterDraft} keyboardType="decimal-pad" onChangeText={setWaterDraft} /><Text style={styles.setUnit}>ml</Text><Button secondary label="Add water" onPress={() => addWater()} /></View><View style={styles.choiceRow}>{[250, 500, 750].map(amount => <TouchableOpacity key={amount} style={styles.choice} onPress={() => addWater(amount)}><Text style={styles.choiceText}>+{amount}ml</Text></TouchableOpacity>)}</View>{(state.water || []).filter(w => w.date === today()).slice(-5).reverse().map(w => <TouchableOpacity key={w.id} onPress={() => removeWater(w.id)}><Text style={styles.muted}>Logged {w.ml}ml • tap to remove</Text></TouchableOpacity>)}</Card>
        <Card title="Weekly Coaching" badge="AI-style"><Text style={styles.text}>{coaching}</Text><Text style={styles.muted}>Uses your logged workouts, meals, weigh-ins and goal. No paid API needed.</Text></Card>
        <Card title="Training Stats"><Text style={styles.text}>Workouts logged: {state.workouts.length}</Text><Text style={styles.text}>7-day volume: {weeklyVolume} kg</Text><Text style={styles.text}>Foods logged today: {mealsToday.length}</Text>{secondsLeft > 0 && <Text style={styles.hero}>Rest {formatTime(secondsLeft)}</Text>}</Card>
        <Card title="Recent PRs">{Object.keys(prs).length === 0 && <Text style={styles.muted}>PRs appear after you log workouts.</Text>}{Object.entries(prs).slice(0, 5).map(([name, pr]) => <Text key={name} style={styles.text}>{name}: {pr.kg}kg x {pr.reps}</Text>)}</Card>
      </View>}

      {state.tab === 'Train' && <View>
        <Card title={`Smart ${nextDay} Workout`} badge="Home Gym"><Text style={styles.muted}>Edit each set before logging. PRs, volume and +2.5kg progression now use your real entries.</Text><Text style={styles.text}>Draft volume: {draftVolume}kg</Text>{workoutDraft.map((exercise, index) => <View key={exercise.name} style={styles.exerciseRow}><Text style={styles.exerciseName}>{index + 1}. {exercise.name}</Text><Text style={styles.muted}>{exercise.sets} sets • {exercise.reps} • {exercise.load} • Rest {exercise.rest}s</Text><Text style={styles.text}>Suggested: {exercise.suggestedKg}kg</Text>{(exercise.setsDone || []).map((set, setIndex) => <View key={`${exercise.name}-${setIndex}`} style={styles.setRow}><Text style={styles.setLabel}>Set {setIndex + 1}</Text><TextInput style={styles.tinyInput} value={String(set.kg)} keyboardType="decimal-pad" onChangeText={v => updateWorkoutSet(index, setIndex, 'kg', v)} /><Text style={styles.setUnit}>kg</Text><TextInput style={styles.tinyInput} value={String(set.reps)} keyboardType="decimal-pad" onChangeText={v => updateWorkoutSet(index, setIndex, 'reps', v)} /><Text style={styles.setUnit}>reps</Text></View>)}<Button secondary label={`Start ${exercise.rest}s rest`} onPress={() => startRest(exercise.rest)} /></View>)}<Button label="Log this workout" onPress={logWorkout} /></Card>
        <Card title="Workout History" badge="Tap to view">{state.workouts.length === 0 && <Text style={styles.muted}>No workouts logged yet.</Text>}{state.workouts.slice(-8).reverse().map(workout => <TouchableOpacity key={workout.id} style={[styles.historyRow, selectedWorkout?.id === workout.id && styles.historyRowOn]} onPress={() => setSelectedWorkoutId(workout.id)}><Text style={styles.text}>{workout.date} • {workout.day}</Text><Text style={styles.muted}>{workout.volume || 0}kg volume • {(workout.exercises || []).length} exercises</Text></TouchableOpacity>)}</Card>{selectedWorkout && <Card title={`${selectedWorkout.day} Details`} badge={selectedWorkout.date}><Text style={styles.heroSmall}>{selectedWorkout.volume || 0}kg</Text>{(selectedWorkout.exercises || []).map(ex => <View key={ex.name} style={styles.foodResult}><Text style={styles.exerciseName}>{ex.name}</Text><Text style={styles.muted}>{(ex.setsDone || []).map((set, idx) => `S${idx + 1}: ${set.kg}kg x ${set.reps}`).join('   ')}</Text></View>)}</Card>}
      </View>}

      {state.tab === 'Food' && <View>
        <Card title="Today’s Nutrition"><Text style={styles.hero}>{totals.calories} kcal</Text><Text style={styles.text}>Protein {totals.protein}g • Carbs {totals.carbs}g • Fat {totals.fat}g</Text></Card>
        <Card title="Food Search + Barcode"><Input placeholder="Search food e.g. chicken breast, Morrisons rice" value={foodQuery} onChangeText={setFoodQuery} /><Button label={foodLoading ? 'Searching...' : 'Search foods'} onPress={searchOpenFoodFacts} /><Input placeholder="Barcode number" value={barcode} onChangeText={setBarcode} keyboardType="numeric" /><Button secondary label="Scan with camera" onPress={openScanner} /><Button secondary label="Find barcode by number" onPress={searchBarcode} />{foodResults.map(food => <FoodResult key={food.id} food={food} onPress={() => { setSelectedFood(food); setPortionG(String(food.servingG || 100)); }} />)}</Card>
        {selectedFood && <Card title="Add Food"><Text style={styles.exerciseName}>{selectedFood.name}</Text><Text style={styles.muted}>{selectedFood.brand} • per 100g: {selectedFood.calories} kcal</Text><Input placeholder="Portion grams" value={portionG} onChangeText={setPortionG} keyboardType="decimal-pad" /><Button label="Add to today" onPress={() => addFoodToDiary(selectedFood)} /><Button secondary label="Save as favourite" onPress={() => setPatch({ favourites: [selectedFood, ...state.favourites.filter(f => f.id !== selectedFood.id)] })} /></Card>}
        <Card title="Recent / Most Used Foods" badge="Fast log">{(state.recentFoods || []).length === 0 && <Text style={styles.muted}>Foods you log will appear here for quicker repeat entries.</Text>}{(state.recentFoods || []).slice(0, 8).map(food => <FoodResult key={food.id} food={food} onPress={() => { setSelectedFood(food); setPortionG(String(food.servingG || 100)); }} />)}</Card>
        <Card title="Favourites / Everyday Foods">{state.favourites.slice(0, 20).map(food => <FoodResult key={food.id} food={food} onPress={() => { setSelectedFood(food); setPortionG(String(food.servingG || 100)); }} />)}</Card>
        <Card title="Favourite Meals" badge="One tap"><Text style={styles.muted}>Save a normal day meal once, then log it quickly next time.</Text><Input placeholder="Meal name e.g. Work breakfast" value={mealName} onChangeText={setMealName} /><Button secondary label="Save today as favourite meal" onPress={saveTodaysMeal} />{(state.savedMeals || []).length === 0 && <Text style={styles.muted}>No favourite meals saved yet.</Text>}{(state.savedMeals || []).map(meal => <View key={meal.id} style={styles.itemRow}><TouchableOpacity style={{ flex: 1 }} onPress={() => addSavedMeal(meal)}><Text style={styles.text}>{meal.name}</Text><Text style={styles.muted}>{meal.totals?.calories || 0} kcal • P{meal.totals?.protein || 0} C{meal.totals?.carbs || 0} F{meal.totals?.fat || 0}</Text></TouchableOpacity><TouchableOpacity onPress={() => setPatch({ savedMeals: (state.savedMeals || []).filter(item => item.id !== meal.id) })}><Text style={styles.delete}>Remove</Text></TouchableOpacity></View>)}</Card><Card title="Today’s Diary">{mealsToday.length === 0 && <Text style={styles.muted}>No meals logged today.</Text>}{mealsToday.map(meal => <View key={meal.id} style={styles.itemRow}><View style={{ flex: 1 }}><Text style={styles.text}>{meal.name}</Text><Text style={styles.muted}>{meal.grams}g • {meal.calories} kcal • P{meal.protein} C{meal.carbs} F{meal.fat}</Text></View><TouchableOpacity onPress={() => setPatch({ meals: state.meals.filter(item => item.id !== meal.id) })}><Text style={styles.delete}>Delete</Text></TouchableOpacity></View>)}</Card>
        <Card title="Create Custom Food"><Input placeholder="Food name" value={customFood.name} onChangeText={v => setCustomFood({ ...customFood, name: v })} /><Input placeholder="Serving grams" value={customFood.servingG} onChangeText={v => setCustomFood({ ...customFood, servingG: v })} keyboardType="decimal-pad" />{['calories', 'protein', 'carbs', 'fat'].map(key => <Input key={key} placeholder={`${key} per serving`} value={customFood[key]} onChangeText={v => setCustomFood({ ...customFood, [key]: v })} keyboardType="decimal-pad" />)}<Button label="Save custom food" onPress={saveCustomFood} /></Card>
      </View>}

      {state.tab === 'Progress' && <View><Card title="Weight Trend" badge="Graph"><WeightGraph progress={state.progress} /><Text style={styles.muted}>Uses your last 8 weigh-ins. Keep checking waist as well for recomp.</Text></Card><Card title="Measurements"><Text style={styles.muted}>Add weigh-ins here. Auto calorie adjustment uses your recent weight trend.</Text>{['weight', 'waist', 'chest', 'arms', 'thighs'].map(key => <Input key={key} placeholder={`${key} kg/cm`} value={progressDraft[key]} onChangeText={v => setProgressDraft({ ...progressDraft, [key]: v })} keyboardType="decimal-pad" />)}<Button label="Save measurements" onPress={() => { setPatch({ progress: [...state.progress, { ...progressDraft, id: uid('progress'), date: today(), weight: toNum(progressDraft.weight), waist: toNum(progressDraft.waist), chest: toNum(progressDraft.chest), arms: toNum(progressDraft.arms), thighs: toNum(progressDraft.thighs) }] }); setProgressDraft({ weight: '', waist: '', chest: '', arms: '', thighs: '' }); }} /><Button secondary label="Auto-adjust calories from weigh-ins" onPress={autoAdjustCalories} /></Card><Card title="History">{state.progress.length === 0 && <Text style={styles.muted}>No measurements yet.</Text>}{state.progress.slice(-10).reverse().map(row => <Text key={row.id} style={styles.text}>{row.date} • {row.weight}kg • waist {row.waist}cm</Text>)}</Card><Card title="PR Board">{Object.keys(prs).length === 0 && <Text style={styles.muted}>No PRs yet.</Text>}{Object.entries(prs).map(([name, pr]) => <Text key={name} style={styles.text}>{name}: {pr.kg}kg x {pr.reps}</Text>)}</Card></View>}

      {state.tab === 'More' && <View><Card title="Goals">{goals.map(goal => <TouchableOpacity key={goal.key} style={[styles.goal, targetDraft.goal === goal.key && styles.goalOn]} onPress={() => calculateTargets(goal.key, toNum(targetDraft.weight))}><Text style={styles.goalTitle}>{goal.emoji} {goal.key}</Text><Text style={styles.muted}>{goal.note}</Text></TouchableOpacity>)}</Card><Card title="Targets"><LabelInput label="Daily Calories" value={String(targetDraft.calories)} onChangeText={v => setTargetDraft({ ...targetDraft, calories: v })} /><LabelInput label="Protein (g)" value={String(targetDraft.protein)} onChangeText={v => setTargetDraft({ ...targetDraft, protein: v })} /><LabelInput label="Carbs (g)" value={String(targetDraft.carbs)} onChangeText={v => setTargetDraft({ ...targetDraft, carbs: v })} /><LabelInput label="Fat (g)" value={String(targetDraft.fat)} onChangeText={v => setTargetDraft({ ...targetDraft, fat: v })} /><LabelInput label="Body Weight (kg)" value={String(targetDraft.weight)} onChangeText={v => setTargetDraft({ ...targetDraft, weight: v })} /><LabelInput label="Water Target (ml)" value={String(state.waterTarget || 2500)} onChangeText={v => setPatch({ waterTarget: toNum(v) || 2500 })} /><Button label="Save Targets" onPress={saveTargets} /><Button secondary label="Calculate Targets" onPress={() => calculateTargets(targetDraft.goal, toNum(targetDraft.weight))} /><Button secondary label="Reset Recommended" onPress={() => { const reset = defaultState.profile; setTargetDraft(reset); setState(prev => ({ ...prev, profile: reset })); }} /></Card><Card title="Equipment Manager">{state.equipment.map((item, index) => <View key={item.id} style={styles.itemRow}><TouchableOpacity style={{ flex: 1 }} onPress={() => { const equipment = [...state.equipment]; equipment[index] = { ...equipment[index], enabled: !equipment[index].enabled }; setPatch({ equipment }); }}><Text style={styles.text}>{item.enabled ? '✓' : '☐'} {item.name}</Text><Text style={styles.muted}>Max {item.maxKg || '-'} kg</Text></TouchableOpacity><TextInput style={styles.smallInput} value={String(item.maxKg)} keyboardType="decimal-pad" onChangeText={v => { const equipment = [...state.equipment]; equipment[index] = { ...equipment[index], maxKg: toNum(v) }; setPatch({ equipment }); }} /><TouchableOpacity onPress={() => setPatch({ equipment: state.equipment.filter(eq => eq.id !== item.id) })}><Text style={styles.delete}>Remove</Text></TouchableOpacity></View>)}<Input placeholder="New equipment name" value={equipmentDraft.name} onChangeText={v => setEquipmentDraft({ ...equipmentDraft, name: v })} /><Input placeholder="Max kg e.g. 17.5" value={equipmentDraft.maxKg} onChangeText={v => setEquipmentDraft({ ...equipmentDraft, maxKg: v })} keyboardType="decimal-pad" /><Button label="Add equipment" onPress={() => { if (!equipmentDraft.name.trim()) return; setPatch({ equipment: [...state.equipment, { id: uid('eq'), name: equipmentDraft.name.trim(), enabled: true, maxKg: toNum(equipmentDraft.maxKg) }] }); setEquipmentDraft({ name: '', maxKg: '' }); }} /></Card><Card title="Manual Exercise Creator" badge="Custom"><Text style={styles.muted}>Add your own lifts, bodyweight moves or cable/bar variations. Use equipment names that match your equipment list.</Text><Input placeholder="Exercise name e.g. Incline Dumbbell Curl" value={exerciseDraft.name} onChangeText={v => updateExerciseDraft('name', v)} /><View style={styles.choiceRow}>{['Push', 'Pull', 'Legs'].map(day => <TouchableOpacity key={day} style={[styles.choice, exerciseDraft.day === day && styles.choiceOn]} onPress={() => updateExerciseDraft('day', day)}><Text style={styles.choiceText}>{day}</Text></TouchableOpacity>)}</View><Input placeholder="Muscle e.g. arms" value={exerciseDraft.muscle} onChangeText={v => updateExerciseDraft('muscle', v)} /><Input placeholder="Equipment e.g. Dumbbells or Bodyweight" value={exerciseDraft.equipment} onChangeText={v => updateExerciseDraft('equipment', v)} /><View style={styles.grid2}><Input placeholder="Sets" value={exerciseDraft.sets} onChangeText={v => updateExerciseDraft('sets', v)} keyboardType="decimal-pad" /><Input placeholder="Reps e.g. 8-12" value={exerciseDraft.reps} onChangeText={v => updateExerciseDraft('reps', v)} /></View><View style={styles.grid2}><Input placeholder="Target reps" value={exerciseDraft.targetReps} onChangeText={v => updateExerciseDraft('targetReps', v)} keyboardType="decimal-pad" /><Input placeholder="Start kg" value={exerciseDraft.defaultKg} onChangeText={v => updateExerciseDraft('defaultKg', v)} keyboardType="decimal-pad" /></View><View style={styles.choiceRow}>{['Heavy', 'Moderate', 'Light'].map(load => <TouchableOpacity key={load} style={[styles.choice, exerciseDraft.load === load && styles.choiceOn]} onPress={() => updateExerciseDraft('load', load)}><Text style={styles.choiceText}>{load}</Text></TouchableOpacity>)}</View><Input placeholder="Rest seconds e.g. 90" value={exerciseDraft.rest} onChangeText={v => updateExerciseDraft('rest', v)} keyboardType="decimal-pad" /><Button label="Add custom exercise" onPress={saveCustomExercise} />{(state.customExercises || []).map(ex => <View key={ex.name} style={styles.itemRow}><View style={{ flex: 1 }}><Text style={styles.text}>{ex.name}</Text><Text style={styles.muted}>{ex.day} • {ex.equipment.join(', ')} • {ex.sets} x {ex.reps}</Text></View><TouchableOpacity onPress={() => setPatch({ customExercises: (state.customExercises || []).filter(item => item.name !== ex.name) })}><Text style={styles.delete}>Remove</Text></TouchableOpacity></View>)}</Card><Card title="Backup & Restore"><Text style={styles.muted}>One backup includes workouts, nutrition, progress, equipment, settings and goals.</Text><Button label="Create Backup" onPress={createBackup} /><Input multiline placeholder="Backup text appears here. Paste backup text here to restore." value={backupInput} onChangeText={setBackupInput} /><Button secondary label="Restore Backup" onPress={restoreBackup} /><Button danger label="Reset App" onPress={() => Alert.alert('Reset app?', 'This deletes local app data.', [{ text: 'Cancel' }, { text: 'Reset', onPress: () => { setState(defaultState); setTargetDraft(defaultState.profile); } }])} /></Card></View>}
    </ScrollView>
    <View style={styles.bottomTabs}>{['Dashboard', 'Train', 'Food', 'Progress', 'More'].map(tab => <TouchableOpacity key={tab} style={styles.bottomTab} onPress={() => setPatch({ tab })}><Text style={[styles.bottomIcon, state.tab === tab && styles.bottomOn]}>{tabIcon(tab)}</Text><Text style={[styles.bottomLabel, state.tab === tab && styles.bottomOn]}>{tab}</Text></TouchableOpacity>)}</View>
  </KeyboardAvoidingView></SafeAreaView>;
}


function getDateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}
function lastNDates(days = 7) { return Array.from({ length: days }).map((_, index) => getDateKey(index - days + 1)); }
function waterTotalToday(water = []) { return (water || []).filter(item => item.date === today()).reduce((sum, item) => sum + toNum(item.ml), 0); }
function getWeeklySummary(state) {
  const dates = lastNDates(7);
  const meals = (state.meals || []).filter(item => dates.includes(item.date));
  const totals = macroTotals(meals);
  const workouts = (state.workouts || []).filter(item => dates.includes(item.date));
  const weighIns = (state.progress || []).filter(item => dates.includes(item.date) && toNum(item.weight) > 0);
  const weightChange = weighIns.length >= 2 ? round1(weighIns[weighIns.length - 1].weight - weighIns[0].weight) : 0;
  const nutritionDays = new Set(meals.map(item => item.date)).size;
  const trainingDays = new Set(workouts.map(item => item.date)).size;
  const completion = Math.round(((nutritionDays + trainingDays) / 14) * 100);
  return {
    workouts: workouts.length,
    avgCalories: Math.round(totals.calories / 7),
    avgProtein: Math.round(totals.protein / 7),
    weightChange,
    completion,
  };
}
function consecutiveDays(dates) {
  let streak = 0;
  const dateSet = new Set(dates);
  for (let i = 0; i < 365; i += 1) {
    if (!dateSet.has(getDateKey(-i))) break;
    streak += 1;
  }
  return streak;
}
function getStreaks(state) {
  return {
    training: consecutiveDays((state.workouts || []).map(item => item.date)),
    nutrition: consecutiveDays((state.meals || []).map(item => item.date)),
  };
}

function createWorkoutDraft(exercises) {
  return exercises.map(ex => ({
    ...ex,
    setsDone: Array.from({ length: ex.sets }).map(() => ({
      kg: String(ex.suggestedKg ?? ex.defaultKg ?? 0),
      reps: String(ex.targetReps ?? ''),
      rest: String(ex.rest ?? 90),
    })),
  }));
}
function suggestWeight(exercise, workouts) {
  const previous = [...workouts].reverse().flatMap(w => w.exercises || []).find(ex => ex.name === exercise.name);
  if (!previous) return exercise.defaultKg || 0;
  const sets = previous.setsDone || [];
  const topKg = Math.max(...sets.map(s => toNum(s.kg)), exercise.defaultKg || 0);
  const hitTarget = sets.length && sets.every(s => toNum(s.reps) >= exercise.targetReps);
  return round1(topKg + (hitTarget && topKg > 0 ? 2.5 : 0));
}
function workoutVolume(exercises) { return round1(exercises.reduce((sum, ex) => sum + (ex.setsDone || []).reduce((s, set) => s + toNum(set.kg) * toNum(set.reps), 0), 0)); }
function volumeLast7Days(workouts) { const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7); return round1(workouts.filter(w => new Date(w.date) >= cutoff).reduce((sum, w) => sum + toNum(w.volume), 0)); }
function getPRs(workouts) { const prs = {}; workouts.forEach(w => (w.exercises || []).forEach(ex => (ex.setsDone || []).forEach(set => { const kg = toNum(set.kg); const reps = toNum(set.reps); const score = kg * reps; if (!prs[ex.name] || score > prs[ex.name].score) prs[ex.name] = { kg, reps, score }; }))); return prs; }
function getCoaching(state, totals) {
  const last7 = volumeLast7Days(state.workouts);
  const lastProgress = state.progress[state.progress.length - 1];
  if (state.workouts.length === 0) return 'Start with the suggested Push/Pull/Legs rotation and log the first workout. Keep finishers optional before a shift.';
  if (totals.protein < state.profile.protein * 0.7) return 'Protein is low today. Add an easy high-protein meal like chicken, tuna, eggs or a lactose-free shake.';
  if (totals.calories > state.profile.calories * 1.15 && state.profile.goal === 'Fat Loss') return 'Calories are running high for fat loss. Keep protein high and reduce snacks or added fats today.';
  if (last7 < 3000) return 'Training volume is light this week. Aim to complete the next planned session before adding extra cardio.';
  if (lastProgress?.waist && state.profile.goal === 'Recomp') return 'Good recomp setup: keep lifting consistent, protein high, and watch waist trend rather than scale only.';
  return 'Stay steady. If all sets hit the top of the rep range, the app will suggest +2.5kg next time.';
}
function mapOpenFoodFacts(product) { const n = product.nutriments || {}; const name = product.product_name || 'Unnamed food'; const calories = n['energy-kcal_100g']; if (calories === undefined) return null; return { id: `off-${product.code || name}`, code: product.code, name, brand: product.brands || 'Open Food Facts', servingG: toNum(product.serving_quantity) || 100, calories: round1(toNum(calories)), protein: round1(toNum(n.proteins_100g)), carbs: round1(toNum(n.carbohydrates_100g)), fat: round1(toNum(n.fat_100g)), source: 'Open Food Facts' }; }
function macroTotals(items) { return items.reduce((acc, item) => ({ calories: round1(acc.calories + toNum(item.calories)), protein: round1(acc.protein + toNum(item.protein)), carbs: round1(acc.carbs + toNum(item.carbs)), fat: round1(acc.fat + toNum(item.fat)) }), { calories: 0, protein: 0, carbs: 0, fat: 0 }); }
function formatTime(seconds) { const m = Math.floor(seconds / 60); const s = String(seconds % 60).padStart(2, '0'); return `${m}:${s}`; }
function tabIcon(tab) { return { Dashboard: '🏠', Train: '🏋️', Food: '🍽️', Progress: '📈', More: '⚙️' }[tab]; }
function Card({ title, badge, children }) { return <View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{title}</Text>{badge && <Text style={styles.badge}>{badge}</Text>}</View>{children}</View>; }
function StatBox({ label, value }) { return <View style={styles.statBox}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function Button({ label, onPress, secondary, danger }) { return <TouchableOpacity onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, danger && styles.dangerButton]}><Text style={styles.buttonText}>{label}</Text></TouchableOpacity>; }
function Input(props) { return <TextInput {...props} placeholderTextColor="#7f8798" style={[styles.input, props.multiline && styles.multiline]} />; }
function LabelInput({ label, value, onChangeText }) { return <View style={{ marginBottom: 10 }}><Text style={styles.label}>{label}</Text><Input value={value} onChangeText={onChangeText} keyboardType="decimal-pad" /></View>; }
function FoodResult({ food, onPress }) { return <TouchableOpacity style={styles.foodResult} onPress={onPress}><Text style={styles.text}>{food.name}</Text><Text style={styles.muted}>{food.brand} • {food.calories} kcal/100g • P{food.protein} C{food.carbs} F{food.fat}</Text></TouchableOpacity>; }
function WeightGraph({ progress }) {
  const rows = (progress || []).filter(row => toNum(row.weight) > 0).slice(-8);
  if (!rows.length) return <View style={styles.emptyGraph}><Text style={styles.muted}>Add weigh-ins to see your trend graph.</Text></View>;
  const weights = rows.map(row => toNum(row.weight));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = Math.max(1, max - min);
  return <View><View style={styles.graph}>{rows.map(row => { const weight = toNum(row.weight); const height = 28 + ((weight - min) / range) * 78; return <View key={row.id} style={styles.graphCol}><View style={[styles.graphBar, { height }]} /><Text style={styles.graphLabel}>{weight}</Text></View>; })}</View><Text style={styles.text}>Latest: {weights[weights.length - 1]}kg • Change: {round1(weights[weights.length - 1] - weights[0])}kg</Text></View>;
}

const styles = {
  app: { flex: 1, backgroundColor: '#070a12' },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12, backgroundColor: '#0b1020', borderBottomWidth: 1, borderBottomColor: '#202843' },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 0.2 },
  subtitle: { color: '#a9b4cc', marginTop: 2, fontSize: 14, fontWeight: '600' },
  body: { padding: 14, paddingBottom: 120 },
  card: { backgroundColor: '#131a2a', borderRadius: 24, padding: 17, marginBottom: 14, borderWidth: 1, borderColor: '#29334f', shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  badge: { color: '#eef3ff', backgroundColor: '#3c5cff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '900' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statBox: { flexGrow: 1, flexBasis: '46%', backgroundColor: '#0a0f1d', borderRadius: 16, borderWidth: 1, borderColor: '#27314a', padding: 12 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#aab4c8', fontSize: 12, fontWeight: '800', marginTop: 2 },
  hero: { color: '#fff', fontSize: 34, fontWeight: '900', marginBottom: 6 },
  heroSmall: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  text: { color: '#f5f7fc', fontSize: 16, lineHeight: 23, fontWeight: '600' },
  muted: { color: '#aab4c8', fontSize: 13, lineHeight: 19, marginTop: 2 },
  label: { color: '#d7def0', marginBottom: 4, fontWeight: '900' },
  input: { backgroundColor: '#0a0f1d', borderColor: '#313b58', borderWidth: 1, color: '#fff', borderRadius: 15, paddingHorizontal: 13, paddingVertical: 12, marginVertical: 5, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  button: { backgroundColor: '#4d6dff', paddingVertical: 14, borderRadius: 17, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#6f86ff' },
  secondaryButton: { backgroundColor: '#242d43', borderColor: '#394563' },
  dangerButton: { backgroundColor: '#862b3a', borderColor: '#b94b5d' },
  buttonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  progressTrack: { height: 11, backgroundColor: '#26304a', borderRadius: 99, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#57d6a3' },
  exerciseRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#2a344d' },
  exerciseName: { color: '#fff', fontSize: 17, fontWeight: '900' },
  foodResult: { padding: 13, backgroundColor: '#0a0f1d', borderRadius: 16, marginVertical: 6, borderWidth: 1, borderColor: '#27314a' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, backgroundColor: '#0a0f1d', borderRadius: 16, marginVertical: 6, borderWidth: 1, borderColor: '#27314a' },
  historyRow: { padding: 13, backgroundColor: '#0a0f1d', borderRadius: 16, marginVertical: 6, borderWidth: 1, borderColor: '#27314a' },
  historyRowOn: { borderColor: '#57d6a3', backgroundColor: '#10251f' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  setLabel: { color: '#d7def0', fontWeight: '900', width: 48 },
  setUnit: { color: '#aab4c8', fontSize: 12 },
  tinyInput: { width: 62, backgroundColor: '#050812', color: '#fff', borderWidth: 1, borderColor: '#333e5b', borderRadius: 11, padding: 8, textAlign: 'center' },
  smallInput: { width: 72, backgroundColor: '#050812', color: '#fff', borderWidth: 1, borderColor: '#333e5b', borderRadius: 12, padding: 9, textAlign: 'center' },
  delete: { color: '#ff8191', fontWeight: '900' },
  goal: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#333e5b', backgroundColor: '#0a0f1d', marginBottom: 9 },
  goalOn: { borderColor: '#57d6a3', backgroundColor: '#10251f' },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  bottomTabs: { position: 'absolute', left: 12, right: 12, bottom: 10, backgroundColor: '#11192a', borderRadius: 25, borderWidth: 1, borderColor: '#313b58', paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-around', elevation: 8 },
  bottomTab: { alignItems: 'center', flex: 1 },
  bottomIcon: { fontSize: 19, opacity: 0.7 },
  bottomLabel: { color: '#96a0b5', fontSize: 11, marginTop: 2, fontWeight: '900' },
  bottomOn: { color: '#fff', opacity: 1 },
  camera: { flex: 1 },
  cameraOverlay: { position: 'absolute', left: 16, right: 16, bottom: 28, backgroundColor: 'rgba(7,10,18,0.9)', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#3a4564' },
  choiceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 6 },
  choice: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: '#0a0f1d', borderWidth: 1, borderColor: '#313b58' },
  choiceOn: { backgroundColor: '#243a92', borderColor: '#6280ff' },
  choiceText: { color: '#fff', fontWeight: '900' },
  grid2: { flexDirection: 'row', gap: 10 },
  graph: { height: 150, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 12, paddingBottom: 8, backgroundColor: '#0a0f1d', borderRadius: 18, borderWidth: 1, borderColor: '#27314a', marginBottom: 10 },
  graphCol: { alignItems: 'center', flex: 1 },
  graphBar: { width: 18, backgroundColor: '#57d6a3', borderRadius: 999 },
  graphLabel: { color: '#aab4c8', fontSize: 10, marginTop: 5, fontWeight: '800' },
  emptyGraph: { backgroundColor: '#0a0f1d', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#27314a' },
};

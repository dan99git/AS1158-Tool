// How to run tests:
// 1. Ensure app.js is loaded before tests.js in index.html (and app.js exposes necessary state/functions to `window`).
// 2. Open the browser's developer console.
// 3. Call runAllTests() in the console.

// --- Test Utilities ---
function assertEquals(actual, expected, testName) {
    if (actual === expected) {
        console.log(`PASSED: ${testName}`);
    } else {
        console.error(`FAILED: ${testName}`);
        console.error(`  Expected: "${expected}" (Type: ${typeof expected})`);
        console.error(`  Actual:   "${actual}" (Type: ${typeof actual})`);
    }
}

function assertNotNull(actual, testName) {
    if (actual !== null && actual !== undefined) {
        console.log(`PASSED: ${testName}`);
    } else {
        console.error(`FAILED: ${testName}`);
        console.error(`  Expected: not null/undefined`);
        console.error(`  Actual:   ${actual}`);
    }
}


// --- Test Setup & Teardown (Basic) ---
// These functions assume 'tasks' and 'rp' from app.js are globally accessible
// and that app.js has functions like renderTasks() and updateRpDisplay() also globally accessible.
// --- Test Setup & Teardown (Basic) ---
function resetAppStateForTesting() {
    if (typeof window.resetAppForTest === 'function') {
        window.resetAppForTest();
        console.log("App state reset for test.");
    } else {
        console.error("CRITICAL: window.resetAppForTest is not defined. Cannot reset app state.");
        // Fallback for critical failure, though tests will likely be unreliable.
        const taskListContainer = document.getElementById('task-list');
        if (taskListContainer) taskListContainer.innerHTML = '';
        const rpCounterElement = document.getElementById('rp-counter'); // Renamed from xpCounterElement
        if (rpCounterElement) rpCounterElement.textContent = 'RP: 0'; // Updated to RP
        const newTaskInput = document.getElementById('new-task-input');
        if (newTaskInput) newTaskInput.value = '';
    }
}


// --- Test Cases ---

// Test Case 1: Adding a Task
function testAddTask() {
    console.log("--- Running testAddTask ---");
    resetAppStateForTesting();

    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');

    if (!newTaskInput || !addTaskBtn) {
        console.error("FAILED: testAddTask - DOM elements (#new-task-input or #add-task-btn) not found.");
        return;
    }
    if (!window.appState || !window.appFunctions) {
        console.error("FAILED: testAddTask - window.appState or window.appFunctions not exposed by app.js.");
        return;
    }

    // Simulate adding a task via UI
    newTaskInput.value = "Test Quest 1";
    addTaskBtn.click(); // This will trigger app.js's addTask function via event listener

    const tasks = window.appState.tasks;
    assertEquals(tasks.length, 1, "testAddTask: tasks.length should be 1");
    if (tasks.length > 0) {
        assertEquals(tasks[0].text, "Test Quest 1", "testAddTask: tasks[0].text should match input");
        assertEquals(tasks[0].completed, false, "testAddTask: tasks[0].completed should be false");
    }
    console.log("--- Finished testAddTask ---");
}

// Test Case 2: Completing a Task and Awarding RP
function testCompleteTaskAndAwardRp() { // Renamed from testCompleteTaskAndAwardXp
    console.log("--- Running testCompleteTaskAndAwardRp ---");
    resetAppStateForTesting();

    if (!window.appState || !window.appFunctions) {
        console.error("FAILED: testCompleteTaskAndAwardRp - window.appState or window.appFunctions not exposed by app.js.");
        return;
    }

    // Add a task programmatically for the test (bypassing UI for setup)
    const testTaskText = "Test Quest for RP"; // Updated XP to RP
    window.appState.tasks.push({
        id: window.appState.nextTaskId++,
        text: testTaskText,
        completed: false,
        xpAwarded: false // Keeping xpAwarded as the flag name, as it's about points being awarded
    });
    window.appFunctions.renderTasks(); // Update the DOM with the new task

    const addedTask = window.appState.tasks.find(t => t.text === testTaskText);
    assertNotNull(addedTask, "testCompleteTaskAndAwardRp: Programmatically added task should be in state");
    if (!addedTask) return;

    const taskListItem = document.querySelector(`[data-task-id="${addedTask.id}"]`);
    assertNotNull(taskListItem, "testCompleteTaskAndAwardRp: Task list item should be in DOM after render");

    if (taskListItem) {
        taskListItem.click(); // Simulate clicking the task item to complete it

        const completedTask = window.appState.tasks.find(t => t.id === addedTask.id);
        assertNotNull(completedTask, "testCompleteTaskAndAwardRp: Completed task should be found in tasks array");
        if (completedTask) {
            assertEquals(completedTask.completed, true, "testCompleteTaskAndAwardRp: Task should be marked as completed");
            assertEquals(completedTask.xpAwarded, true, "testCompleteTaskAndAwardRp: Task should have xpAwarded flag set to true");
        }
        assertEquals(window.appState.rp, 10, "testCompleteTaskAndAwardRp: RP should be 10"); // Updated XP to RP
    }
    console.log("--- Finished testCompleteTaskAndAwardRp ---");
}

// Test Case 3: Local Storage - Save & Load
function testLocalStorageSaveLoad() {
    console.log("--- Running testLocalStorageSaveLoad ---");
    resetAppStateForTesting(); // This clears localStorage and in-memory state

    // 1. Programmatically add a task and gain RP
    const taskText = "Test Task for Storage";
    window.appState.tasks.push({ id: window.appState.nextTaskId++, text: taskText, completed: false, xpAwarded: false });
    let addedTask = window.appState.tasks.find(t => t.text === taskText);
    assertNotNull(addedTask, "testLocalStorageSaveLoad: Task should be in memory before completion");
    
    // Simulate completion
    addedTask.completed = true;
    addedTask.xpAwarded = true; // Assuming xpAwarded flag is used for RP too
    window.appState.rp += 10;
    
    // Manually update UI elements as app.js functions might not be fully active in this testing context
    window.appFunctions.renderTasks(); 
    window.appFunctions.updateRpDisplay();

    // 2. Call saveData
    window.appFunctions.saveData();
    console.log("testLocalStorageSaveLoad: Data saved.");

    // 3. Simulate app reload by resetting in-memory state (without clearing localStorage this time)
    // window.resetAppForTest() clears local storage, so we do a partial reset here.
    window.appState.tasks = [];
    window.appState.rp = 0;
    window.appState.characterLevel = 1; // Reset other relevant states if necessary
    window.appState.currentStreak = 0;
    window.appState.lastActivityDate = null;
    window.appState.intentionsData = ["", "", ""];
    window.appState.symptomsData = { focus: null, energy: null, distraction: null };
    window.appState.victoriesData = [];
    window.appState.debriefData = { well: "", challenge: "", better: "" };
    
    // Clear UI that would be cleared on a fresh load before app.js populates it
    document.getElementById('task-list').innerHTML = '';
    document.getElementById('rp-counter').textContent = 'RP: 0';
    document.getElementById('level-display').textContent = 'Level: 1';
    // ... clear other UI elements if necessary ...
    console.log("testLocalStorageSaveLoad: In-memory state reset.");

    // 4. Call loadData
    window.appFunctions.loadData();
    console.log("testLocalStorageSaveLoad: Data loaded.");

    // 5. Assertions
    assertEquals(window.appState.tasks.length, 1, "testLocalStorageSaveLoad: tasks.length should be 1 after load");
    if (window.appState.tasks.length > 0) {
        assertEquals(window.appState.tasks[0].text, taskText, "testLocalStorageSaveLoad: Task text should match after load");
        assertEquals(window.appState.tasks[0].completed, true, "testLocalStorageSaveLoad: Task completed status should be true after load");
    }
    assertEquals(window.appState.rp, 10, "testLocalStorageSaveLoad: RP should be 10 after load");
    
    // Check UI elements are updated (basic check)
    const taskListItem = document.querySelector(`#task-list li[data-task-id="${addedTask.id}"]`);
    assertNotNull(taskListItem, "testLocalStorageSaveLoad: Task list item should be in DOM after load");
    if(taskListItem) {
        assertEquals(taskListItem.classList.contains('completed-task'), true, "testLocalStorageSaveLoad: Task item should have 'completed-task' class after load");
    }
    assertEquals(document.getElementById('rp-counter').textContent, "RP: 10", "testLocalStorageSaveLoad: RP display should be updated after load");

    console.log("--- Finished testLocalStorageSaveLoad ---");
}

// Test Case 4: Character Leveling
function testCharacterLeveling() {
    console.log("--- Running testCharacterLeveling ---");
    resetAppStateForTesting();
    const rpPerLevel = 100; // Assuming this is defined in app.js and accessible or known

    // Initial state
    assertEquals(window.appState.characterLevel, 1, "testCharacterLeveling: Initial character level should be 1");

    // Award RP just below threshold
    window.appState.rp = rpPerLevel - 10; // e.g., 90 if rpPerLevel is 100
    window.appFunctions.updateRpDisplay(); // This should call checkLevelUp internally
    assertEquals(window.appState.characterLevel, 1, "testCharacterLeveling: Character level should still be 1 before threshold");

    // Award more RP to cross threshold
    window.appState.rp += 20; // e.g., 90 + 20 = 110
    window.appFunctions.updateRpDisplay();
    assertEquals(window.appState.characterLevel, 2, "testCharacterLeveling: Character level should be 2 after threshold");
    
    // Optional: Check avatar CSS class
    const avatarElement = document.querySelector('#header-character-info #character-area');
    assertNotNull(avatarElement, "testCharacterLeveling: Avatar element should exist");
    if(avatarElement) {
        assertEquals(avatarElement.classList.contains('avatar-level-2'), true, "testCharacterLeveling: Avatar should have 'avatar-level-2' class");
    }

    // Level up again
    window.appState.rp += rpPerLevel; // Add enough for another level
    window.appFunctions.updateRpDisplay();
    assertEquals(window.appState.characterLevel, 3, "testCharacterLeveling: Character level should be 3 after second level up");
    if(avatarElement) {
        assertEquals(avatarElement.classList.contains('avatar-level-3'), true, "testCharacterLeveling: Avatar should have 'avatar-level-3' class");
    }

    console.log("--- Finished testCharacterLeveling ---");
}

// Test Case 5: Daily Streak
function testDailyStreak() {
    console.log("--- Running testDailyStreak ---");
    resetAppStateForTesting();

    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const twoDaysAgoString = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

    // Scenario 1: First activity
    console.log("testDailyStreak: Scenario 1 - First activity");
    window.appState.lastActivityDate = null;
    window.appState.currentStreak = 0;
    window.appFunctions.updateStreak(); // Simulate activity
    assertEquals(window.appState.currentStreak, 1, "testDailyStreak (Scenario 1): Streak should be 1");
    assertEquals(window.appState.lastActivityDate, todayString, "testDailyStreak (Scenario 1): lastActivityDate should be today");

    // Scenario 2: Activity on consecutive day
    console.log("testDailyStreak: Scenario 2 - Activity on consecutive day");
    window.appState.lastActivityDate = yesterdayString; // Set to yesterday
    window.appState.currentStreak = 1; // Streak from yesterday
    window.appFunctions.updateStreak(); // Simulate activity today
    assertEquals(window.appState.currentStreak, 2, "testDailyStreak (Scenario 2): Streak should be 2");
    assertEquals(window.appState.lastActivityDate, todayString, "testDailyStreak (Scenario 2): lastActivityDate should be today");

    // Scenario 3: Activity after a gap
    console.log("testDailyStreak: Scenario 3 - Activity after a gap");
    window.appState.lastActivityDate = twoDaysAgoString; // Set to two days ago
    window.appState.currentStreak = 2; // Streak from two days ago
    window.appFunctions.updateStreak(); // Simulate activity today
    assertEquals(window.appState.currentStreak, 1, "testDailyStreak (Scenario 3): Streak should reset to 1");
    assertEquals(window.appState.lastActivityDate, todayString, "testDailyStreak (Scenario 3): lastActivityDate should be today");

    // Scenario 4: Multiple activities on the same day
    console.log("testDailyStreak: Scenario 4 - Multiple activities on same day");
    window.appState.lastActivityDate = todayString; // Already active today
    window.appState.currentStreak = 1; // Current streak is 1
    window.appFunctions.updateStreak(); // Simulate another activity today
    assertEquals(window.appState.currentStreak, 1, "testDailyStreak (Scenario 4): Streak should still be 1");
    assertEquals(window.appState.lastActivityDate, todayString, "testDailyStreak (Scenario 4): lastActivityDate should still be today");

    console.log("--- Finished testDailyStreak ---");
}


// --- Main Test Runner ---
function runAllTests() {
    console.log("===== STARTING ALL TESTS =====");

    // Check if app.js has exposed necessary items
    if (!window.appState || !window.appFunctions || typeof window.resetAppForTest !== 'function') {
        console.error("CRITICAL FAILURE: app.js did not expose 'window.appState', 'window.appFunctions', or 'window.resetAppForTest'. Tests cannot run reliably.");
        console.log("Please ensure app.js includes the testing exposure block at the end of its DOMContentLoaded listener.");
        console.log("===== TESTS ABORTED =====");
        return;
    }

    testAddTask();
    testCompleteTaskAndAwardRp();
    testLocalStorageSaveLoad();
    testCharacterLeveling();
    testDailyStreak();

    console.log("===== FINISHED ALL TESTS =====");
    console.log("Review results above. Any 'FAILED' messages indicate an issue.");
    console.log("If tests fail due to missing app state/functions, ensure app.js is correctly exposing them to the window object.");
}

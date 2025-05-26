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
// These functions assume 'tasks' and 'xp' from app.js are globally accessible
// and that app.js has functions like renderTasks() and updateXpDisplay() also globally accessible.
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
        const xpCounterElement = document.getElementById('xp-counter');
        if (xpCounterElement) xpCounterElement.textContent = 'XP: 0';
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

// Test Case 2: Completing a Task and Awarding XP
function testCompleteTaskAndAwardXp() {
    console.log("--- Running testCompleteTaskAndAwardXp ---");
    resetAppStateForTesting();

    if (!window.appState || !window.appFunctions) {
        console.error("FAILED: testCompleteTaskAndAwardXp - window.appState or window.appFunctions not exposed by app.js.");
        return;
    }

    // Add a task programmatically for the test (bypassing UI for setup)
    const testTaskText = "Test Quest for XP";
    window.appState.tasks.push({
        id: window.appState.nextTaskId++,
        text: testTaskText,
        completed: false,
        xpAwarded: false
    });
    window.appFunctions.renderTasks(); // Update the DOM with the new task

    const addedTask = window.appState.tasks.find(t => t.text === testTaskText);
    assertNotNull(addedTask, "testCompleteTaskAndAwardXp: Programmatically added task should be in state");
    if (!addedTask) return;

    const taskListItem = document.querySelector(`[data-task-id="${addedTask.id}"]`);
    assertNotNull(taskListItem, "testCompleteTaskAndAwardXp: Task list item should be in DOM after render");

    if (taskListItem) {
        taskListItem.click(); // Simulate clicking the task item to complete it

        const completedTask = window.appState.tasks.find(t => t.id === addedTask.id);
        assertNotNull(completedTask, "testCompleteTaskAndAwardXp: Completed task should be found in tasks array");
        if (completedTask) {
            assertEquals(completedTask.completed, true, "testCompleteTaskAndAwardXp: Task should be marked as completed");
            assertEquals(completedTask.xpAwarded, true, "testCompleteTaskAndAwardXp: Task should have xpAwarded flag set to true");
        }
        assertEquals(window.appState.xp, 10, "testCompleteTaskAndAwardXp: XP should be 10");
    }
    console.log("--- Finished testCompleteTaskAndAwardXp ---");
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
    testCompleteTaskAndAwardXp();

    console.log("===== FINISHED ALL TESTS =====");
    console.log("Review results above. Any 'FAILED' messages indicate an issue.");
    console.log("If tests fail due to missing app state/functions, ensure app.js is correctly exposing them to the window object.");
}

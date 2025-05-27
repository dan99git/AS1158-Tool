document.addEventListener('DOMContentLoaded', () => {
    // Core State
    let tasks = [];
    let nextTaskId = 1;
    let rp = 0;
    let characterLevel = 1;
    let currentStreak = 0;
    let lastActivityDate = null; // Store as YYYY-MM-DD string

    // Captain's Log State
    let intentionsData = ["", "", ""];
    let symptomsData = { focus: null, energy: null, distraction: null };
    let victoriesData = [];
    let debriefData = { well: "", challenge: "", better: "" };

    // Gamification constants
    const rpPerLevel = 100; 

    let rewardTimeout = null;

    // DOM Elements - UI (Tasks, Rewards)
    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');
    const rewardMessageAreaElement = document.getElementById('reward-message-area');
    
    // DOM Elements - Header Character Info
    const rpCounterElement = document.getElementById('rp-counter');
    const levelDisplayElement = document.getElementById('level-display');
    const streakDisplayElement = document.getElementById('streak-display'); 
    const headerCharacterArea = document.querySelector('#header-character-info #character-area');

    // DOM Elements - Captain's Log
    const intentionInputs = [
        document.getElementById('intention-1'),
        document.getElementById('intention-2'),
        document.getElementById('intention-3')
    ];
    const symptomOptionGroups = {
        focus: document.querySelectorAll('#symptom-focus .symptom-option'),
        energy: document.querySelectorAll('#symptom-energy .symptom-option'),
        distraction: document.querySelectorAll('#symptom-distraction .symptom-option')
    };
    const newVictoryInput = document.getElementById('new-victory-input');
    const addVictoryBtn = document.getElementById('add-victory-btn');
    const victoryListElement = document.getElementById('victory-list');
    const debriefInputs = {
        well: document.getElementById('debrief-well'),
        challenge: document.getElementById('debrief-challenge'),
        better: document.getElementById('debrief-better')
    };

    // Function to show task completion reward
    function showTaskCompletionReward(taskText) {
        if (rewardMessageAreaElement) {
            rewardMessageAreaElement.textContent = `Quest Complete: "${taskText}"! +10 RP`; // Updated XP to RP
            rewardMessageAreaElement.classList.add('reward-popup-show');

            // Clear any existing timeout to prevent premature hiding
            if (rewardTimeout) {
                clearTimeout(rewardTimeout);
            }

            rewardTimeout = setTimeout(() => {
                rewardMessageAreaElement.classList.remove('reward-popup-show');
            }, 3000); // Display for 3 seconds
        }
    }

    // Function to update avatar appearance based on level
    function updateAvatarAppearance() {
        if (headerCharacterArea) {
            // Remove existing level classes
            headerCharacterArea.classList.remove('avatar-level-1', 'avatar-level-2', 'avatar-level-3'); // Add more if more levels defined
            // Add current level class (up to level 3 for now)
            if (characterLevel <= 3) { // Assuming styles up to level 3 are defined
                headerCharacterArea.classList.add(`avatar-level-${characterLevel}`);
            } else {
                 headerCharacterArea.classList.add(`avatar-level-3`); // Fallback to max defined style
            }
        }
    }

    // Function to check for level up
    function checkLevelUp() {
        const requiredRpForNextLevel = characterLevel * rpPerLevel;
        if (rp >= requiredRpForNextLevel) {
            characterLevel++;
            // rp -= requiredRpForNextLevel; // Optional: reset RP for next level or keep cumulative
            console.log(`Leveled up to ${characterLevel}!`);
            updateAvatarAppearance(); // Update avatar on level up
            // Potentially add a level up notification here
        }
    }
    
    // Function to update RP and Level display
    function updateRpDisplay() { 
        if (rpCounterElement) {
            rpCounterElement.textContent = `RP: ${rp}`;
        }
        if (levelDisplayElement) {
            levelDisplayElement.textContent = `Level: ${characterLevel}`;
        }
        checkLevelUp(); // Check for level up every time RP is updated
    }

    // Function to update Streak display
    function updateStreakDisplay() {
        if (streakDisplayElement) {
            streakDisplayElement.textContent = `Streak: ${currentStreak}`;
        }
    }

    // Function to update the daily streak
    function updateStreak() {
        const today = new Date();
        const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (lastActivityDate === null) { // First activity ever
            currentStreak = 1;
        } else if (lastActivityDate === todayDateString) {
            // Activity already recorded for today, do nothing to the streak itself
            // (unless you want to count multiple activities in a day, which is not typical for streaks)
        } else {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayDateString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            if (lastActivityDate === yesterdayDateString) {
                currentStreak++;
            } else { // Gap of more than one day
                currentStreak = 1; // Reset streak
            }
        }
        lastActivityDate = todayDateString;
        updateStreakDisplay();
        saveData(); // Save data after streak update
    }

    // Function to add a new task
    function addTask() {
        const taskText = newTaskInput.value.trim();

        if (taskText !== "") {
            const newTask = {
                id: nextTaskId++,
                text: taskText,
                completed: false,
                xpAwarded: false // To ensure XP is awarded only once
            };
            tasks.push(newTask);
            newTaskInput.value = ""; // Clear input field
            renderTasks();
            saveData(); // Save after adding a task
            // console.log(tasks); // For debugging
        }
    }

    // Function to render tasks to the DOM
    function renderTasks() {
        taskListContainer.innerHTML = ''; // Clear existing tasks

        tasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.textContent = task.text;
            taskItem.classList.add('task-item');
            taskItem.dataset.taskId = task.id;

            if (task.completed) {
                taskItem.classList.add('completed-task'); // Use new class name
            }

            // Click listener for task completion
            taskItem.addEventListener('click', () => {
                const clickedTask = tasks.find(t => t.id === task.id);
                if (clickedTask) {
                    // Toggle completion status
                    clickedTask.completed = !clickedTask.completed;

                    if (clickedTask.completed && !clickedTask.xpAwarded) {
                        rp += 10; 
                        clickedTask.xpAwarded = true; 
                        updateRpDisplay(); 
                        showTaskCompletionReward(clickedTask.text); 
                        updateStreak(); 
                    } else if (!clickedTask.completed && clickedTask.xpAwarded) {
                        // Optional: Deduct RP if task is un-completed
                    }
                    renderTasks(); 
                    saveData(); // Save data after task completion change
                }
            });

            // Placeholder for delete button (added in a later step)
            // const deleteBtn = document.createElement('button');
            // deleteBtn.textContent = 'X';
            // deleteBtn.classList.add('delete-task-btn');
            // deleteBtn.addEventListener('click', () => deleteTask(task.id));
            // taskItem.appendChild(deleteBtn);

            // Placeholder for complete button/checkbox (added in a later step)
            // const completeCheckbox = document.createElement('input');
            // completeCheckbox.type = 'checkbox';
            // completeCheckbox.checked = task.completed;
            // completeCheckbox.addEventListener('change', () => toggleComplete(task.id));
            // taskItem.prepend(completeCheckbox);


            taskListContainer.appendChild(taskItem);
        });
    }

    // Event Listeners
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    // Allow pressing Enter to add task
    if (newTaskInput) {
        newTaskInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                addTask();
            }
        });
    }

    // --- Captain's Log Functions ---
    function renderIntentions() {
        intentionInputs.forEach((input, index) => {
            if(input) input.value = intentionsData[index] || "";
        });
    }

    function renderSymptoms() {
        for (const symptomType in symptomOptionGroups) {
            symptomOptionGroups[symptomType].forEach(optionElement => {
                optionElement.classList.remove('selected-symptom');
                if (symptomsData[symptomType] && parseInt(optionElement.dataset.value) === symptomsData[symptomType]) {
                    optionElement.classList.add('selected-symptom');
                }
            });
        }
    }

    function renderVictories() {
        if (!victoryListElement) return;
        victoryListElement.innerHTML = '';
        victoriesData.forEach(victoryText => {
            const li = document.createElement('li');
            li.textContent = victoryText;
            victoryListElement.appendChild(li);
        });
    }

    function addVictory() {
        const victoryText = newVictoryInput.value.trim();
        if (victoryText) {
            victoriesData.push(victoryText);
            newVictoryInput.value = '';
            renderVictories();
            updateStreak(); 
            saveData();
        }
    }

    function renderDebrief() {
        for (const key in debriefInputs) {
            if(debriefInputs[key]) debriefInputs[key].value = debriefData[key] || "";
        }
    }
    
    function renderAllCaptainLogData() {
        renderIntentions();
        renderSymptoms();
        renderVictories();
        renderDebrief();
    }

    // --- Local Storage ---
    function saveData() {
        const dataToSave = {
            tasks,
            nextTaskId,
            rp,
            characterLevel,
            currentStreak,
            lastActivityDate,
            intentionsData,
            symptomsData,
            victoriesData,
            debriefData
        };
        localStorage.setItem('adhdLifeQuestData', JSON.stringify(dataToSave));
        // console.log("Data saved:", dataToSave);
    }

    function loadData() {
        const savedData = localStorage.getItem('adhdLifeQuestData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            tasks = parsedData.tasks || [];
            nextTaskId = parsedData.nextTaskId || 1;
            rp = parsedData.rp || 0;
            characterLevel = parsedData.characterLevel || 1;
            currentStreak = parsedData.currentStreak || 0;
            lastActivityDate = parsedData.lastActivityDate || null;
            
            intentionsData = parsedData.intentionsData || ["", "", ""];
            symptomsData = parsedData.symptomsData || { focus: null, energy: null, distraction: null };
            victoriesData = parsedData.victoriesData || [];
            debriefData = parsedData.debriefData || { well: "", challenge: "", better: "" };

            // console.log("Data loaded:", parsedData);
        } else {
            // console.log("No saved data found. Starting fresh.");
        }

        // Update UI with loaded or default data
        renderTasks();
        updateRpDisplay();
        updateStreakDisplay();
        updateAvatarAppearance();
        renderAllCaptainLogData();
    }

    // Initial Load - Call this after all function definitions and DOM element initializations
    loadData();


    // --- Event Listeners for Captain's Log ---
    intentionInputs.forEach((input, index) => {
        if(input) input.addEventListener('input', () => {
            intentionsData[index] = input.value;
            updateStreak(); 
            saveData();
        });
    });

    for (const symptomType in symptomOptionGroups) {
        symptomOptionGroups[symptomType].forEach(optionElement => {
            optionElement.addEventListener('click', () => {
                const value = parseInt(optionElement.dataset.value);
                if (symptomsData[symptomType] === value) { // If already selected, deselect
                    symptomsData[symptomType] = null; 
                } else {
                    symptomsData[symptomType] = value;
                }
                renderSymptoms(); 
                updateStreak(); 
                saveData();
            });
        });
    }

    if(addVictoryBtn) addVictoryBtn.addEventListener('click', addVictory); // addVictory calls updateStreak & saveData

    for (const key in debriefInputs) {
        if(debriefInputs[key]) debriefInputs[key].addEventListener('input', () => {
            debriefData[key] = debriefInputs[key].value;
            updateStreak(); 
            saveData();
        });
    }


    // --- View Switching Logic ---
    const navButtons = document.querySelectorAll('.nav-button');
    const views = document.querySelectorAll('#main-content > div[id^="view-"]'); // Selects divs starting with "view-"

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetViewId = button.dataset.view;

            // Update button active state
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update view visibility
            views.forEach(view => {
                if (view.id === `view-${targetViewId}`) {
                    view.classList.remove('view-hidden');
                    view.classList.add('view-active');
                } else {
                    view.classList.remove('view-active');
                    view.classList.add('view-hidden');
                }
            });
        });
    });

    // Ensure initial view is correctly displayed (although HTML should handle this)
    // This could be useful if the initial active classes were not set in HTML.
    const initialActiveButton = document.querySelector('.nav-button.active');
    if (initialActiveButton) {
        const initialViewId = initialActiveButton.dataset.view;
        views.forEach(view => {
            if (view.id === `view-${initialViewId}`) {
                view.classList.remove('view-hidden');
                view.classList.add('view-active');
            } else {
                view.classList.remove('view-active');
                view.classList.add('view-hidden');
            }
        });
    }


    // Expose variables and functions for testing (if running in a browser context)
    if (typeof window !== 'undefined') {
        window.appState = {
            get tasks() { return tasks; },
            set tasks(newTasks) { tasks = newTasks; },
            get rp() { return rp; },
            set rp(newRp) { rp = newRp; },
            get characterLevel() { return characterLevel; },
            set characterLevel(level) { characterLevel = level; },
            get currentStreak() { return currentStreak; }, 
            set currentStreak(streak) { currentStreak = streak; }, 
            get lastActivityDate() { return lastActivityDate; }, 
            set lastActivityDate(date) { lastActivityDate = date; }, 
            get nextTaskId() { return nextTaskId; },
            set nextTaskId(id) { nextTaskId = id; },
            // Captain's Log state
            get intentionsData() { return intentionsData; },
            set intentionsData(val) { intentionsData = val; },
            get symptomsData() { return symptomsData; },
            set symptomsData(val) { symptomsData = val; },
            get victoriesData() { return victoriesData; },
            set victoriesData(val) { victoriesData = val; },
            get debriefData() { return debriefData; },
            set debriefData(val) { debriefData = val; }
        };
        window.appFunctions = {
            renderTasks,
            updateRpDisplay,
            addTask,
            showTaskCompletionReward,
            updateAvatarAppearance,
            updateStreakDisplay, 
            updateStreak,
            saveData, 
            loadData, 
            renderAllCaptainLogData 
        };

        // Functions for tests to easily reset state
        window.resetAppForTest = () => {
            localStorage.removeItem('adhdLifeQuestData'); 
            tasks.length = 0;
            rp = 0;
            characterLevel = 1;
            currentStreak = 0; 
            lastActivityDate = null; 
            nextTaskId = 1;
            
            intentionsData = ["", "", ""];
            symptomsData = { focus: null, energy: null, distraction: null };
            victoriesData = [];
            debriefData = { well: "", challenge: "", better: "" };

            if (newTaskInput) newTaskInput.value = '';
            if (taskListContainer) taskListContainer.innerHTML = '';
            if (rpCounterElement) rpCounterElement.textContent = 'RP: 0';
            if (levelDisplayElement) levelDisplayElement.textContent = 'Level: 1';
            if (streakDisplayElement) streakDisplayElement.textContent = 'Streak: 0'; 
            updateAvatarAppearance();
            renderAllCaptainLogData(); 
        };
    }
});

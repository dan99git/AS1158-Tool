document.addEventListener('DOMContentLoaded', () => {
    let tasks = [];
    let nextTaskId = 1; // Simple counter for unique IDs
    let xp = 0;
    let rewardTimeout = null; // To manage the timeout

    const newTaskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskListContainer = document.getElementById('task-list');
    const xpCounterElement = document.getElementById('xp-counter');
    const rewardMessageAreaElement = document.getElementById('reward-message-area');

    // Function to show task completion reward
    function showTaskCompletionReward(taskText) {
        if (rewardMessageAreaElement) {
            rewardMessageAreaElement.textContent = `Quest Complete: "${taskText}"! +10 XP`;
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

    // Function to update XP display
    function updateXpDisplay() {
        if (xpCounterElement) {
            xpCounterElement.textContent = `XP: ${xp}`;
        }
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
                        xp += 10;
                        clickedTask.xpAwarded = true; // Mark XP as awarded
                        updateXpDisplay();
                        showTaskCompletionReward(clickedTask.text); // Show reward message
                    } else if (!clickedTask.completed && clickedTask.xpAwarded) {
                        // Optional: Deduct XP if task is un-completed
                        // For now, let's not deduct XP to keep it simple.
                        // xp -= 10;
                        // clickedTask.xpAwarded = false;
                        // updateXpDisplay();
                    }
                    renderTasks(); // Re-render to update styles
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

    // Initial render of tasks
    renderTasks();
    updateXpDisplay(); // Initial XP display

    // Expose variables and functions for testing (if running in a browser context)
    if (typeof window !== 'undefined') {
        window.appState = {
            get tasks() { return tasks; },
            set tasks(newTasks) { tasks = newTasks; },
            get xp() { return xp; },
            set xp(newXp) { xp = newXp; },
            get nextTaskId() { return nextTaskId; },
            set nextTaskId(id) { nextTaskId = id; }
        };
        window.appFunctions = {
            renderTasks,
            updateXpDisplay,
            addTask, // Exposing the original addTask
            showTaskCompletionReward
        };

        // Functions for tests to easily reset state
        window.resetAppForTest = () => {
            tasks.length = 0;
            xp = 0;
            nextTaskId = 1;
            if (newTaskInput) newTaskInput.value = '';
            if (taskListContainer) taskListContainer.innerHTML = '';
            if (xpCounterElement) xpCounterElement.textContent = 'XP: 0';
            // No need to call renderTasks or updateXpDisplay here, tests will do it if needed.
        };
    }
});

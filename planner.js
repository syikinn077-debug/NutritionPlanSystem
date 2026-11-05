console.log("planner.js loaded");

// Daily calorie limit for each plan (approximate values)
const PLAN_LIMITS = {
    "Weight Loss": 1500,
    "Muscle Builder": 2500,
    "Balanced Diet": 2000
};

let meals = JSON.parse(localStorage.getItem("meals")) || [];
let editingIndex = null;   // LET NULL FOR ADD & EDIT MODE

// Wait until the page is fully loaded before using any element
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addButton").addEventListener("click", addMeal);
    displayMeals();
});

// CREATE OPERATIONS
function addMeal() {
    const nameInput = document.getElementById("mealName");
    const calInput = document.getElementById("mealCalories");
    const plan = document.getElementById("dietPlan").value;

    const name = nameInput.value.trim();
    const calories = Number(calInput.value);

    if (name === "" || !Number.isFinite(calories) || calories < 0) {
        alert("Enter a meal name and valid calories.");
        return;
    }

    // Add mode: put the new meal at the end of the list
    if (editingIndex === null) {
        meals.push({ name, calories, plan });
    } else {
        // Edit mode: replace the meal in its original position
        meals[editingIndex] = { name, calories, plan };
        editingIndex = null;
        document.getElementById("addButton").textContent = "Add Meal";
    }
    // Clear the form, then save and redraw
    nameInput.value = "";
    calInput.value = "";
    saveMeals();
    displayMeals();
}

// READ OPERATIONS
function displayMeals() {
    // Reload so meals added from the search page also appear
    meals = JSON.parse(localStorage.getItem("meals")) || [];
    const list = document.getElementById("listMeals");
    list.innerHTML = "";
    // One row per meal; index tells Edit/Delete which meal to use
    meals.forEach((meal, index) => {
        list.innerHTML += `
            <div>
                ${meal.name} (${meal.calories} kcal) - ${meal.plan || "No plan"}
                <button onclick="editMeal(${index})">Edit</button>
                <button onclick="deleteMeal(${index})">Delete</button>
            </div>
        `;
    });

    calcTotalCalories();
}


function editMeal(index) {
    // Copy the meal's values back into the form
    document.getElementById("mealName").value = meals[index].name;
    document.getElementById("mealCalories").value = meals[index].calories;
    document.getElementById("dietPlan").value = meals[index].plan || "Balanced Diet";
    // Remember which meal is being edited
    editingIndex = index;
    document.getElementById("addButton").textContent = "Update Meal";
}

// DELETE: removes one meal from the list
function deleteMeal(index) {
    // Remove 1 meal at the selected position
    meals.splice(index, 1);

    // Leave edit mode so a later update cannot change the wrong meal
    editingIndex = null;
    document.getElementById("addButton").textContent = "Add Meal";
    // Save the shorter list, then redraw the screen
    saveMeals();
    displayMeals();
}

// Save the list so it is kept after the app is closed
function saveMeals() {
    localStorage.setItem("meals", JSON.stringify(meals));
}


function calcTotalCalories() {
    const stats = {}; // example: { "Weight Loss": { count: 2, calories: 771 } 
    // Count meals and add up calories for each plan
    meals.forEach(meal => {
        const plan = meal.plan || "No plan";
        if (!stats[plan]) stats[plan] = { count: 0, calories: 0 };
        stats[plan].count++;
        stats[plan].calories += meal.calories;
    });

    let html = `<div class="plan-total">Total Meals: ${meals.length}</div>`;
    // For each plan, compare the total with the plan's limit
    //APPEAR AT NUTRITION SUMMARY
    for (const plan in stats) {
        const s = stats[plan];
        let detail = `${s.count} meal(s)<br>${s.calories} kcal`;

        const limit = PLAN_LIMITS[plan];
        if (limit) {
            const left = limit - s.calories;
            detail += left >= 0
                ? `<br>${left} kcal left of ${limit}`
                : `<br>⚠️ over by ${-left} kcal`;
        }

        html += `
            <div class="plan-box">
                <strong>${plan}</strong>
                <div>${detail}</div>
            </div>
        `;
    }

    document.getElementById("totalCalories").innerHTML = html;
}
console.log("Nutrition.js loaded");

const API_KEY = "WWjdGJGntFbJjpk7pjLtKQLcLnNkhfmzhh66mhkf";

let lastFood = null;

// Event handling: run searchFood() when the Search button is clicked
document.getElementById("searchButton")
.addEventListener("click", searchFood);


// nutrition.js: request food data from the USDA API
async function searchFood() {

    const food =
        document.getElementById("foodInput").value.trim();

    // DOM manipulation: show a loading spinner while waiting
    const result =
        document.getElementById("result");

    result.innerHTML = `
    <div class="loading">
        <div class="spinner"></div>
        <p>Searching for food...</p>
    </div>
`;    

    // Validation: stop if the food name is empty
    if (!food) {
        result.innerHTML =
        "<p>Please enter a food name.</p>";
        return;
    }

    try {
        // Send a request to the USDA FoodData Central API
        const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(food)}`
        );

        // Convert the response text into a JavaScript object (JSON processing)
        const data = await response.json();

        console.log(data);

        // Handle a search with no results
        if (!data.foods || data.foods.length === 0) {

            result.innerHTML =
            "<p>No food found.</p>";

            return;
        }

        // Prefer a result whose name contains the search word
        const exactFood = data.foods.find(
            item => item.description.toLowerCase().includes(food.toLowerCase())
        );


        displayFood(exactFood || data.foods[0]);

        // Any error thrown above is caught here and shown to the user
        } catch(error){

            result.innerHTML = `<p>${error.message}</p>`;
        }
}

function displayFood(item){

    const qty =
    Number(document.getElementById("qtyInput").value) || 1;

    const food = {

        name: item.description,

        // Multiply each value by the quantity 
        calories:
        getNutrient(item,"Energy") * qty,

        protein_g:
        getNutrient(item,"Protein") * qty,

        fat_total_g:
        getNutrient(item,"Total lipid (fat)") * qty,

        carbohydrates_total_g:
        getNutrient(
            item,
            "Carbohydrate, by difference"
        ) * qty
    };

    lastFood = food;

    const suggestion =
    getSuggestion(food);
    //APPEAR ALONG API
    document.getElementById("result").innerHTML = `

        <h3>${food.name} × ${qty}</h3>

        <p>Calories: ${food.calories} kcal</p>

        <p>Protein: ${food.protein_g} g</p>

        <p>Fat: ${food.fat_total_g} g</p>

        <p>Carbohydrates: ${food.carbohydrates_total_g} g</p>

        <p>
        <strong>Recommendation:</strong>
        ${suggestion}
        </p>

        <select id="planSelect">
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Builder">Muscle Builder</option>
            <option value="Balanced Diet">Balanced Diet</option>
        </select>

        <button onclick="addToPlanner()">
            Add To Planner
        </button>
    `;
}

// Choose a recommendation from the food's nutrition values
function getSuggestion(food) {

    const cal = food.calories;
    const protein = food.protein_g;
    const fat = food.fat_total_g;
    const carbs = food.carbohydrates_total_g;

    if (protein >= 15) {
        return "💪 High protein. Great for Muscle Builder plan!";
    }

    else if (cal <= 120 && fat < 5) {
        return "🥗 Low calorie. Suitable for Weight Loss plan!";
    }

    else if (fat >= 20) {
        return "⚠️ High fat. Consume moderately.";
    }

    else if (carbs >= 40) {
        return "⚡ Good energy source before workout.";
    }

    else if (cal >= 450) {
        return "⚠️ High calorie food. Eat in moderation.";
    }

    else {
        return "🍽️ Suitable for Balanced Diet plan.";
    }
}    

//ADD TO MEAL PLANNER 
function addToPlanner() {

    if (!lastFood) {

        alert("Search food first.");

        return;
    }



    const meals =
        JSON.parse(
            localStorage.getItem("meals")
        ) || [];

    // Add the new meal with the plan chosen in the dropdown
    meals.push({

        name: lastFood.name,

        calories: lastFood.calories,

        protein: lastFood.protein_g,

        fat: lastFood.fat_total_g,

        carbs:
            lastFood.carbohydrates_total_g,

        plan:
            document.getElementById(
                "planSelect"
            ).value
    });

    // Save the list back as text (Local Storage only stores text)
    localStorage.setItem(
        "meals",
        JSON.stringify(meals)
    );

    alert("Meal added successfully!");
}
// JSON PROCESSING HELPER
// The API returns nutrients as a list, so this finds one by its name.
// Returns 0 if the nutrient is not in the list.
function getNutrient(item, nutrientName){

    const nutrient =
        item.foodNutrients.find(
            n => n.nutrientName === nutrientName
        );

    return nutrient ? nutrient.value : 0;
}

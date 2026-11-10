const sampleWardrobe = [
    {
        id: 1,
        name: "White Classic Shirt",
        category: "Top",
        color: "White",
        style: "Minimal",
        image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500"
    },
    {
        id: 2,
        name: "Pink Summer Top",
        category: "Top",
        color: "Pink",
        style: "Chic",
        image: "https://images.unsplash.com/photo-1564257577-2d8f6a5d1e8c?w=500"
    },
    {
        id: 3,
        name: "Blue Denim Jeans",
        category: "Bottom",
        color: "Blue",
        style: "Streetwear",
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500"
    },
    {
        id: 4,
        name: "Black Trousers",
        category: "Bottom",
        color: "Black",
        style: "Elegant",
        image: "https://images.unsplash.com/photo-1506629905607-d9d5b2e6e4e8?w=500"
    },
    {
        id: 5,
        name: "White Sneakers",
        category: "Shoes",
        color: "White",
        style: "Chic",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
    },
    {
        id: 6,
        name: "Black Heels",
        category: "Shoes",
        color: "Black",
        style: "Elegant",
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500"
    },
    {
        id: 7,
        name: "Silver Earrings",
        category: "Accessory",
        color: "Silver",
        style: "Chic",
        image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500"
    },
    {
        id: 8,
        name: "Black Sunglasses",
        category: "Accessory",
        color: "Black",
        style: "Streetwear",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"
    }
];

// Load saved information

function loadData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Could not load saved data:", error);
        return fallback;
    }
}

let wardrobe = loadData("styleSyncWardrobe", null);
let favorites = loadData("styleSyncFavorites", []);
let generatedCount = Number(
    localStorage.getItem("styleSyncGenerated") || 0
);

if (!Array.isArray(wardrobe)) {
    wardrobe = sampleWardrobe;
    saveData();
}

if (!Array.isArray(favorites)) {
    favorites = [];
}

let currentOutfit = null;
let currentFilter = "All";
let selectedMood = "Confident";

// Save everything

function saveData() {
    localStorage.setItem("styleSyncWardrobe",
        JSON.stringify(wardrobe));

    localStorage.setItem("styleSyncFavorites",
        JSON.stringify(favorites));

    localStorage.setItem("styleSyncGenerated",
        generatedCount);
}

// Safe text for HTML

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Toast message

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Date

document.getElementById("today").textContent =
    new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });

// Modal functions

function openModal() {
    document.getElementById("addModal").classList.add("show");
}

function closeModal() {
    document.getElementById("addModal").classList.remove("show");
}

document.getElementById("addModal").addEventListener(
    "click", function(event) {
        if (event.target === this) {
            closeModal();
        }
    }
);

// Compress uploaded image before saving

function processImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(new Error("Please select an image."));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            reject(new Error("Image must be smaller than 5 MB."));
            return;
        }

        const reader = new FileReader();

        reader.onload = function() {
            const img = new Image();

            img.onload = function() {
                const canvas = document.createElement("canvas");

                const maxSize = 700;
                const scale = Math.min(
                    1,
                    maxSize / Math.max(img.width, img.height)
                );

                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    img, 0, 0, canvas.width, canvas.height
                );

                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };

            img.onerror = () => reject(
                new Error("Could not read this image.")
            );

            img.src = reader.result;
        };

        reader.onerror = () => reject(
            new Error("Image upload failed.")
        );

        reader.readAsDataURL(file);
    });
}

// Add clothes

document.getElementById("clothingForm").addEventListener(
    "submit", async function(event) {

        event.preventDefault();

        const name = document.getElementById("itemName").value.trim();
        const category = document.getElementById("category").value;
        const color = document.getElementById("itemColor").value.trim();
        const style = document.getElementById("itemStyle").value;
        const file = document.getElementById("itemImage").files[0];

        if (!name || !color) {
            showToast("Please fill in all details.");
            return;
        }

        const submitButton = this.querySelector("button[type='submit']");
        submitButton.disabled = true;
        submitButton.textContent = "Adding...";

        try {
            const image = await processImage(file);

            const newItem = {
                id: Date.now() + Math.random(),
                name,
                category,
                color,
                style,
                image
            };

            wardrobe.unshift(newItem);

            try {
                saveData();
            } catch (error) {
                wardrobe.shift();
                throw new Error(
                    "Storage is full. Remove some items and try again."
                );
            }

            displayWardrobe();
            updateStats();

            this.reset();
            closeModal();

            showToast("New piece added to your wardrobe! ♡");

        } catch (error) {
            showToast(error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Add to my wardrobe ♡";
        }
    }
);

// Display wardrobe

function displayWardrobe() {

    const grid = document.getElementById("wardrobeGrid");

    const filtered = currentFilter === "All"
        ? wardrobe
        : wardrobe.filter(item =>
            item.category === currentFilter
        );

    if (filtered.length === 0) {
        grid.innerHTML =
            '<p class="empty-message">No items here yet. Add something beautiful!</p>';
        return;
    }

    grid.innerHTML = filtered.map(item => `
        <div class="item-card">

            <img src="${escapeHTML(item.image ||
                "https://placehold.co/400x400/f5e8ed/9e5272?text=My+Wardrobe")}"
                alt="${escapeHTML(item.name)}"
                loading="lazy"
                onerror="this.src='https://placehold.co/400x400/f5e8ed/9e5272?text=Fashion'">

            <div class="item-info">

                <h3>${escapeHTML(item.name)}</h3>

                <p>${escapeHTML(item.color)} ·
                   ${escapeHTML(item.category)}</p>

                <button class="delete-btn"
                    onclick="deleteItem(${Number(item.id)})">
                    Remove piece ×
                </button>

            </div>
        </div>
    `).join("");
}

// Delete item

function deleteItem(id) {

    wardrobe = wardrobe.filter(item => item.id !== id);

    // Remove this item from saved outfits too
    favorites = favorites.filter(outfit =>
        outfit.top.id !== id &&
        outfit.bottom.id !== id &&
        outfit.shoes.id !== id &&
        outfit.accessory?.id !== id
    );

    saveData();

    displayWardrobe();
    displayFavorites();
    updateStats();

    showToast("Piece removed from wardrobe.");
}

// Category filters

document.querySelectorAll(".filter").forEach(button => {

    button.addEventListener("click", function() {

        document.querySelectorAll(".filter").forEach(btn =>
            btn.classList.remove("active")
        );

        this.classList.add("active");

        currentFilter = this.dataset.filter;

        displayWardrobe();
    });
});

// Mood selection

document.querySelectorAll(".mood").forEach(button => {

    button.addEventListener("click", function() {

        document.querySelectorAll(".mood").forEach(btn =>
            btn.classList.remove("active")
        );

        this.classList.add("active");

        selectedMood = this.dataset.mood;
    });
});

// Random selection

function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Outfit generator

function generateOutfit() {

    const occasion = document.getElementById("occasion").value;
    const aesthetic = document.getElementById("aesthetic").value;

    let available = aesthetic === "Any"
        ? wardrobe
        : wardrobe.filter(item => item.style === aesthetic);

    const tops = available.filter(item => item.category === "Top");
    const bottoms = available.filter(item => item.category === "Bottom");
    const shoes = available.filter(item => item.category === "Shoes");
    const accessories = available.filter(
        item => item.category === "Accessory"
    );

    if (!tops.length || !bottoms.length || !shoes.length) {
        showToast("Add a top, bottom and shoes in this style first!");
        return;
    }

    currentOutfit = {
        occasion,
        aesthetic,
        mood: selectedMood,
        top: randomItem(tops),
        bottom: randomItem(bottoms),
        shoes: randomItem(shoes),
        accessory: accessories.length
            ? randomItem(accessories)
            : null
    };

    generatedCount++;

    saveData();

    showOutfit(currentOutfit);
    updateStats();
}

// Display outfit

function showOutfit(outfit) {

    const display = document.getElementById("outfitDisplay");

    const pieces = [
        ["TOP", outfit.top],
        ["BOTTOM", outfit.bottom],
        ["SHOES", outfit.shoes],
        ["ACCESSORY", outfit.accessory]
    ];

    const cards = pieces
        .filter(([label, item]) => item)
        .map(([label, item]) => `
            <div class="piece">

                <img src="${escapeHTML(item.image ||
                    "https://placehold.co/400x400/f5e8ed/9e5272?text=Fashion")}"
                    alt="${escapeHTML(item.name)}"
                    loading="lazy"
                    onerror="this.src='https://placehold.co/400x400/f5e8ed/9e5272?text=Fashion'">

                <p><b>${label}</b></p>
                <p>${escapeHTML(item.name)}</p>
                <small>${escapeHTML(item.color)}</small>

            </div>
        `).join("");

    display.innerHTML = `
        <div class="outfit-result">

            <span class="eyebrow">YOUR NEW LOOK ✨</span>

            <h3>${escapeHTML(outfit.occasion)} Edition</h3>

            <p>Vibe: ${escapeHTML(outfit.mood)} ·
                ${escapeHTML(outfit.aesthetic)}</p>

            <div class="outfit-pieces">
                ${cards}
            </div>

            <button class="save-btn" onclick="saveFavorite()">
                ♡ Save this outfit
            </button>

            <button class="save-btn" onclick="generateOutfit()">
                ↻ Try another
            </button>

        </div>
    `;

    currentOutfit = outfit;
}

// Save favourites

function saveFavorite() {

    if (!currentOutfit) return;

    const alreadyExists = favorites.some(outfit =>
        outfit.top.id === currentOutfit.top.id &&
        outfit.bottom.id === currentOutfit.bottom.id &&
        outfit.shoes.id === currentOutfit.shoes.id &&
        (outfit.accessory?.id || null) ===
        (currentOutfit.accessory?.id || null)
    );

    if (alreadyExists) {
        showToast("Already saved in your favourites!");
        return;
    }

    favorites.push(currentOutfit);

    try {
        saveData();
    } catch (error) {
        favorites.pop();
        showToast("Storage is full. Could not save this outfit.");
        return;
    }

    displayFavorites();
    updateStats();

    showToast("Your look is saved! ❤️");
}

// Display favourites

function displayFavorites() {

    const grid = document.getElementById("favoriteGrid");

    if (!favorites.length) {
        grid.innerHTML =
            '<p class="empty-message">Your favourite looks will appear here. ♡</p>';
        return;
    }

    grid.innerHTML = favorites.map((outfit, index) => `
        <div class="favorite-card">

            <img src="${escapeHTML(outfit.top.image ||
                "https://placehold.co/400x400/f5e8ed/9e5272?text=Fashion")}"
                alt="Saved outfit"
                loading="lazy"
                onerror="this.src='https://placehold.co/400x400/f5e8ed/9e5272?text=Fashion'">

            <div class="item-info">

                <h3>${escapeHTML(outfit.occasion)} Look ♡</h3>

                <p>${escapeHTML(outfit.top.name)} +
                    ${escapeHTML(outfit.bottom.name)}</p>

                <p>${escapeHTML(outfit.shoes.name)}</p>

                <button class="delete-btn"
                    onclick="removeFavorite(${index})">
                    Remove favourite ×
                </button>

            </div>
        </div>
    `).join("");
}

// Remove favourite

function removeFavorite(index) {

    favorites.splice(index, 1);

    saveData();

    displayFavorites();
    updateStats();

    showToast("Removed from favourites.");
}

// Dashboard statistics

function updateStats() {

    document.getElementById("totalItems").textContent =
        wardrobe.length;

    document.getElementById("totalGenerated").textContent =
        generatedCount;

    document.getElementById("totalFavorites").textContent =
        favorites.length;
}

// Navigation active state

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", function() {

        document.querySelectorAll(".nav-link").forEach(item =>
            item.classList.remove("active")
        );

        this.classList.add("active");
    });
});

// Initial rendering

displayWardrobe();
displayFavorites();
updateStats();

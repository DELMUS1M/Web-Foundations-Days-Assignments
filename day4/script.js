// DOM Element Selections
const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

/**
 * Updates character and word counters and handles warning/over classes
 */
function updateCounts() {
  const text = noteText.value;
  const numChars = text.length;

  // Word count calculation
  const trimmed = text.trim();
  const numWords = trimmed === "" ? 0 : trimmed.split(/\s+/).length;

  // Update display text
  charCount.textContent = `${numChars} / 200 characters`;
  wordCount.textContent = `${numWords} ${numWords === 1 ? "word" : "words"}`;

  // Reset classes
  charCount.classList.remove("warning", "over");

  // Apply warning or over class based on character length
  if (numChars > 200) {
    charCount.classList.add("over");
  } else if (numChars > 180) {
    charCount.classList.add("warning");
  }
}

/**
 * Clears the textarea, resets counters, and removes draft from localStorage
 */
function clearAll() {
  noteText.value = "";
  localStorage.removeItem("note_draft");
  updateCounts();
}

/**
 * Toggles dark mode on body, updates button label, and saves theme preference
 */
function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem("theme_preference", isDark ? "dark" : "light");
}

/**
 * Initializes the app state on page load
 */
function init() {
  // Restore saved theme
  const savedTheme = localStorage.getItem("theme_preference");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    themeToggle.textContent = "Dark mode";
  }

  // Restore saved draft
  const savedDraft = localStorage.getItem("note_draft");
  if (savedDraft !== null) {
    noteText.value = savedDraft;
  }

  // Initial counter calculation
  updateCounts();
}

// Event Listeners
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem("note_draft", noteText.value);
});

noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearAll();
  }
});

clearBtn.addEventListener("click", clearAll);

themeToggle.addEventListener("click", toggleTheme);

// Initialize application state
init();

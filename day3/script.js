// Starting Data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

/**
 * 1. searchNotes(word)
 * Returns an array of notes whose text contains word, ignoring case.
 */
function searchNotes(word) {
  if (!word) return [];
  const term = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(term));
}

/**
 * 2. longestNote()
 * Returns the note object with the most characters, or null if empty.
 */
function longestNote() {
  if (!notes || notes.length === 0) return null;
  return notes.reduce((longest, current) =>
    current.text.length > longest.text.length ? current : longest
  , notes[0]);
}

/**
 * 3. countByCategory()
 * Returns an object counting notes per category.
 */
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

/**
 * 4. getSummary()
 * Returns a summary string using countByCategory and a template literal.
 */
function getSummary() {
  const total = notes.length;
  const noteLabel = total === 1 ? "note" : "notes";
  if (total === 0) {
    return "0 notes.";
  }
  const counts = countByCategory();
  const categoryParts = Object.entries(counts).map(
    ([category, count]) => `${count} ${category}`
  );
  return `${total} ${noteLabel}: ${categoryParts.join(", ")}.`;
}

/**
 * 5. isDuplicate(text)
 * Returns true if a note with the same text exists (ignoring case & extra spaces).
 */
function isDuplicate(text) {
  if (!text) return false;
  const cleanText = text.trim().toLowerCase();
  return notes.some(note => note.text.trim().toLowerCase() === cleanText);
}

/**
 * 6. addNote(text, category)
 * Adds a note if length is 1-200 chars, not duplicate, and valid category.
 */
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];

  if (typeof text !== "string") {
    console.log("Failed to add note: Text must be a string.");
    return false;
  }

  const trimmedText = text.trim();
  if (trimmedText.length < 1 || trimmedText.length > 200) {
    console.log("Failed to add note: Text length must be between 1 and 200 characters.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log(`Failed to add note: Invalid category '${category}'. Must be personal, work, or study.`);
    return false;
  }

  if (isDuplicate(text)) {
    console.log("Failed to add note: Duplicate note detected.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  const newNote = { id: newId, text: text, category: category };
  notes.push(newNote);
  return true;
}

// ==========================================
// FUNCTION TESTS & CONSOLE LOGS
// ==========================================

console.log("--- 1. searchNotes ---");
console.log(searchNotes("report"));
// Expected output: [ { id: 3, text: 'Email the project report to Grace', category: 'work' } ]

console.log(searchNotes("python"));
// Expected output: []

console.log("\n--- 2. longestNote ---");
console.log(longestNote());
// Expected output: { id: 3, text: 'Email the project report to Grace', category: 'work' }

const backupNotes = [...notes];
notes = [];
console.log(longestNote());
// Expected output: null
notes = [...backupNotes];

console.log("\n--- 3. countByCategory ---");
console.log(countByCategory());
// Expected output: { personal: 2, study: 2, work: 1 }

notes = [];
console.log(countByCategory());
// Expected output: {}
notes = [...backupNotes];

console.log("\n--- 4. getSummary ---");
console.log(getSummary());
// Expected output: "5 notes: 2 personal, 2 study, 1 work."

notes = [{ id: 1, text: "Solo note", category: "personal" }];
console.log(getSummary());
// Expected output: "1 note: 1 personal."
notes = [...backupNotes];

console.log("\n--- 5. isDuplicate ---");
console.log(isDuplicate(" buy milk and bread "));
// Expected output: true

console.log(isDuplicate("Take out the trash"));
// Expected output: false

console.log("\n--- 6. addNote ---");
console.log(addNote("Schedule dentist appointment", "personal"));
// Expected output: true

console.log(addNote("Call mum", "personal"));
// Expected output: Failed to add note: Duplicate note detected.
// Expected output: false

console.log(addNote("", "study"));
// Expected output: Failed to add note: Text length must be between 1 and 200 characters.
// Expected output: false

console.log(addNote("New note", "gaming"));
// Expected output: Failed to add note: Invalid category 'gaming'. Must be personal, work, or study.
// Expected output: false
